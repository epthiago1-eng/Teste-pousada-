import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import type {
  Booking, BookingRequest, Client, FnrhForm, Invite, Product, RatePlan, Room, RoomCategory, Staff, Transaction, UserProfile,
} from '../types';
import { isActiveBooking, uid } from '../lib/utils';

interface DataContextValue {
  rooms: Room[];
  categories: RoomCategory[];
  clients: Client[];
  bookings: Booking[];
  products: Product[];
  transactions: Transaction[];
  staff: Staff[];
  ratePlans: RatePlan[];
  requests: BookingRequest[];
  fnrhForms: FnrhForm[];
  invites: Invite[];
  users: UserProfile[];
  online: boolean;
  hasPendingWrites: boolean;
  save: (col: string, data: Record<string, unknown> & { id?: string }) => Promise<string>;
  remove: (col: string, id: string) => Promise<void>;
  update: (col: string, id: string, data: Record<string, unknown>) => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

/** Remove valores `undefined` (o Firestore não os aceita), inclusive dentro de objetos e arrays. */
function sanitize<T>(value: T): T {
  if (Array.isArray(value)) return value.map((v) => sanitize(v)) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) out[k] = sanitize(v);
    }
    return out as T;
  }
  return value;
}

function useTenantCollection<T>(tenantId: string | undefined, name: string, enabled = true) {
  const [items, setItems] = useState<T[]>([]);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (!tenantId || !enabled) {
      setItems([]);
      return;
    }
    const unsub = onSnapshot(
      collection(db, 'tenants', tenantId, name),
      { includeMetadataChanges: true },
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as T[]);
        setPending(snap.metadata.hasPendingWrites);
      },
      (err) => console.warn(`[${name}]`, err.code)
    );
    return unsub;
  }, [tenantId, name, enabled]);
  return { items, pending };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const tenantId = profile?.tenantId;
  const role = profile?.role;
  const isStaffOnly = role === 'housekeeper';
  const isAdminOrManager = role === 'admin' || role === 'manager';
  const canOperate = role !== 'housekeeper';

  const rooms = useTenantCollection<Room>(tenantId, 'rooms');
  const categories = useTenantCollection<RoomCategory>(tenantId, 'categories');
  const bookings = useTenantCollection<Booking>(tenantId, 'bookings'); // governança também vê ocupação
  const clients = useTenantCollection<Client>(tenantId, 'clients', canOperate);
  const products = useTenantCollection<Product>(tenantId, 'products', canOperate);
  const transactions = useTenantCollection<Transaction>(tenantId, 'transactions', isAdminOrManager);
  const staff = useTenantCollection<Staff>(tenantId, 'staff', isAdminOrManager);
  const ratePlans = useTenantCollection<RatePlan>(tenantId, 'ratePlans', !isStaffOnly);
  const requests = useTenantCollection<BookingRequest>(tenantId, 'bookingRequests', canOperate);
  const fnrhForms = useTenantCollection<FnrhForm>(tenantId, 'fnrh', canOperate);
  const invites = useTenantCollection<Invite>(tenantId, 'invites', role === 'admin');

  // Usuários do tenant (visível para admin/gerente)
  const [users, setUsers] = useState<UserProfile[]>([]);
  useEffect(() => {
    if (!tenantId || !isAdminOrManager) {
      setUsers([]);
      return;
    }
    return onSnapshot(
      query(collection(db, 'users'), where('tenantId', '==', tenantId)),
      (snap) => setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as UserProfile[]),
      (err) => console.warn('[users]', err.code)
    );
  }, [tenantId, isAdminOrManager]);

  // Status online/offline
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const hasPendingWrites =
    rooms.pending || bookings.pending || clients.pending || transactions.pending ||
    products.pending || staff.pending || categories.pending;

  const save = async (col: string, data: Record<string, unknown> & { id?: string }) => {
    if (!tenantId) throw new Error('Sem pousada ativa');
    const id = data.id ?? uid();
    const { id: _omit, ...rest } = data;
    // Não aguardamos o servidor: com cache offline, o setDoc resolve localmente
    setDoc(doc(db, 'tenants', tenantId, col, id), sanitize({ ...rest, updatedAt: new Date().toISOString() }), { merge: true });
    if (col === 'bookings') syncPublicAvailability(tenantId, bookings.items, { ...(data as unknown as Booking), id });
    return id;
  };

  const update = async (col: string, id: string, data: Record<string, unknown>) => {
    if (!tenantId) throw new Error('Sem pousada ativa');
    updateDoc(doc(db, 'tenants', tenantId, col, id), sanitize({ ...data, updatedAt: new Date().toISOString() }));
  };

  const remove = async (col: string, id: string) => {
    if (!tenantId) throw new Error('Sem pousada ativa');
    deleteDoc(doc(db, 'tenants', tenantId, col, id));
    if (col === 'bookings') syncPublicAvailability(tenantId, bookings.items.filter((b) => b.id !== id));
  };

  // Mantém o documento público de disponibilidade (sem dados pessoais)
  const roomsById = useMemo(() => new Map(rooms.items.map((r) => [r.id, r])), [rooms.items]);

  // Publica categorias + contagem de quartos + tarifas para o site público (sem dados pessoais)
  const publicCategoriesJson = useMemo(() => {
    if (!canOperate) return '';
    const today = new Date().toISOString().slice(0, 10);
    const items = categories.items.map((c) => {
      const catRooms = rooms.items.filter((r) => r.categoryId === c.id);
      // Fotos: primeiro as da categoria, depois as dos quartos (principal de cada quarto primeiro)
      const photos = Array.from(new Set([...(c.photos ?? []), ...catRooms.flatMap((r) => r.photos ?? [])])).slice(0, 10);
      // Tarifa pública: plano ativo da categoria (só preços — nada sensível)
      const plan = ratePlans.items.find((p) => p.categoryId === c.id && p.active);
      const overrides = Object.fromEntries(
        Object.entries(plan?.dailyOverrides ?? {}).filter(([date]) => date >= today)
      );
      const beds = catRooms.reduce(
        (acc, r) => ({ double: Math.max(acc.double, r.doubleBeds ?? 0), single: Math.max(acc.single, r.singleBeds ?? 0) }),
        { double: 0, single: 0 }
      );
      return {
        id: c.id,
        name: c.name,
        maxGuests: c.maxGuests ?? 2,
        basePrice: plan?.basePrice ?? c.basePrice ?? 0,
        description: c.description ?? '',
        photos,
        roomIds: catRooms.map((r) => r.id),
        beds,
        pricing: plan
          ? {
              basePrice: plan.basePrice,
              pricesByDayOfWeek: plan.pricesByDayOfWeek ?? {},
              dailyOverrides: overrides,
              minStay: plan.minStay ?? 1,
              validFrom: plan.validFrom ?? '',
              validTo: plan.validTo ?? '',
            }
          : { basePrice: c.basePrice ?? 0, pricesByDayOfWeek: {}, dailyOverrides: {}, minStay: 1, validFrom: '', validTo: '' },
      };
    });
    return JSON.stringify(items);
  }, [categories.items, rooms.items, ratePlans.items, canOperate]);

  useEffect(() => {
    if (!tenantId || !publicCategoriesJson || !navigator.onLine) return;
    const t = setTimeout(() => {
      setDoc(doc(db, 'tenants', tenantId, 'publicData', 'categories'), {
        items: JSON.parse(publicCategoriesJson),
        updatedAt: new Date().toISOString(),
      }).catch((e) => console.warn('publicData/categories', e?.code));
    }, 1500);
    return () => clearTimeout(t);
  }, [tenantId, publicCategoriesJson]);
  function syncPublicAvailability(tid: string, current: Booking[], changed?: Booking) {
    try {
      const all = changed
        ? [...current.filter((b) => b.id !== changed.id), changed]
        : current;
      const ranges = all
        .filter(isActiveBooking)
        .map((b) => ({
          roomId: b.roomId,
          categoryId: roomsById.get(b.roomId)?.categoryId ?? '',
          start: b.checkIn,
          end: b.checkOut,
        }));
      setDoc(doc(db, 'tenants', tid, 'publicData', 'availability'), {
        ranges,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('availability sync', e);
    }
  }

  const value: DataContextValue = {
    rooms: rooms.items,
    categories: categories.items,
    clients: clients.items,
    bookings: bookings.items,
    products: products.items,
    transactions: transactions.items,
    staff: staff.items,
    ratePlans: ratePlans.items,
    requests: requests.items,
    fnrhForms: fnrhForms.items,
    invites: invites.items,
    users,
    online,
    hasPendingWrites,
    save,
    remove,
    update,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData deve ser usado dentro de DataProvider');
  return ctx;
}
