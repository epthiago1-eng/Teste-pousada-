import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, onSnapshot, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { Role, Tenant, UserProfile } from '../types';
import { slugify, uid } from '../lib/utils';

interface AuthContextValue {
  firebaseUser: User | null;
  profile: UserProfile | null;
  tenant: Tenant | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  registerWithNewTenant: (name: string, email: string, password: string, tenantName: string) => Promise<void>;
  registerWithInvite: (name: string, email: string, password: string, tenantId: string, code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        setProfile(null);
        setTenant(null);
        setLoading(false);
      }
    });
  }, []);

  // Perfil do usuário em tempo real
  useEffect(() => {
    if (!firebaseUser) return;
    const unsub = onSnapshot(
      doc(db, 'users', firebaseUser.uid),
      (snap) => {
        setProfile(snap.exists() ? ({ id: snap.id, ...snap.data() } as UserProfile) : null);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [firebaseUser]);

  // Dados da pousada em tempo real
  useEffect(() => {
    if (!profile?.tenantId) {
      setTenant(null);
      return;
    }
    return onSnapshot(doc(db, 'tenants', profile.tenantId), (snap) => {
      setTenant(snap.exists() ? ({ id: snap.id, ...snap.data() } as Tenant) : null);
    });
  }, [profile?.tenantId]);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  /** Cria conta + pousada nova (usuário vira admin). */
  const registerWithNewTenant = async (name: string, email: string, password: string, tenantName: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const tenantId = uid();
    let slug = slugify(tenantName) || `pousada-${tenantId.slice(0, 6)}`;
    const slugSnap = await getDoc(doc(db, 'slugs', slug));
    if (slugSnap.exists()) slug = `${slug}-${tenantId.slice(0, 4)}`;

    await setDoc(doc(db, 'tenants', tenantId), {
      ownerUid: cred.user.uid,
      name: tenantName.trim(),
      slug,
      publicBookingEnabled: false,
      guestPortalEnabled: true,
      checkinTime: '14:00',
      checkoutTime: '12:00',
      createdAt: new Date().toISOString(),
      _ts: serverTimestamp(),
    });
    // O perfil precisa existir ANTES do slug: a regra do slug exige papel admin.
    await setDoc(doc(db, 'users', cred.user.uid), {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      tenantId,
      role: 'admin' satisfies Role,
      status: 'active',
    });
    await setDoc(doc(db, 'slugs', slug), { tenantId });
  };

  /** Cria conta entrando numa pousada existente via código de convite. */
  const registerWithInvite = async (name: string, email: string, password: string, tenantId: string, code: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const inviteRef = doc(db, 'tenants', tenantId.trim(), 'invites', code.trim().toUpperCase());
    const inviteSnap = await getDoc(inviteRef);
    if (!inviteSnap.exists() || inviteSnap.data().used) {
      await cred.user.delete().catch(() => {});
      throw new Error('Código de convite inválido ou já utilizado.');
    }
    const role = inviteSnap.data().role as Role;
    await runTransaction(db, async (tx) => {
      tx.set(doc(db, 'users', cred.user.uid), {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        tenantId: tenantId.trim(),
        role,
        status: 'active',
        inviteCode: code.trim().toUpperCase(),
      });
      tx.update(inviteRef, { used: true, role });
    });
  };

  return (
    <AuthContext.Provider
      value={{ firebaseUser, profile, tenant, loading, login, logout, resetPassword, registerWithNewTenant, registerWithInvite }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}

/** Permissões por papel — usadas para esconder/mostrar áreas do app. */
export const PERMISSIONS: Record<Role, { view: string[] }> = {
  admin: { view: ['*'] },
  manager: { view: ['*'] },
  receptionist: {
    view: ['dashboard', 'calendar', 'bookings', 'rooms', 'clients', 'products', 'housekeeping', 'requests', 'customize'],
  },
  housekeeper: { view: ['housekeeping', 'customize'] },
};

export function canView(role: Role | undefined, area: string) {
  if (!role) return false;
  const p = PERMISSIONS[role];
  return p.view.includes('*') || p.view.includes(area);
}
