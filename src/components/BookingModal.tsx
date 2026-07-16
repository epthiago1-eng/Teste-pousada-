import { useEffect, useMemo, useState } from 'react';
import { addDays, format } from 'date-fns';
import { toast } from 'sonner';
import { AlertTriangle, Bed, ChevronDown, ChevronUp, Moon, Search, UserPlus, Wallet, X } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Button, Field, Input, Modal, Select, Textarea } from './ui';
import type { Booking, BookingStatus, Channel, Payment } from '../types';
import { BOOKING_STATUS_LABELS, CHANNEL_LABELS, PAYMENT_METHOD_LABELS } from '../types';
import { parseISO } from 'date-fns';
import { brl, cn, formatCPF, formatPhoneBR, isActiveBooking, nextReservationNumber, nights, planPriceForDate, rangesOverlap, todayISO, uid } from '../lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  booking?: Booking | null; // edição
  defaults?: Partial<Booking>; // pré-preenchido (ex.: clique no calendário)
}

const STATUS_BADGE: Record<BookingStatus, string> = {
  'pre-booking': 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  'checked-in': 'bg-sky-100 text-sky-800',
  'checked-out': 'bg-slate-100 text-slate-600',
  cancelled: 'bg-red-100 text-red-700',
  'no-show': 'bg-red-100 text-red-700',
  blocked: 'bg-slate-200 text-slate-700',
};

export default function BookingModal({ open, onClose, booking, defaults }: Props) {
  const { rooms, categories, clients, bookings, ratePlans, save } = useData();
  const isEdit = Boolean(booking);

  const [form, setForm] = useState({
    clientId: '',
    newClientName: '',
    newClientPhone: '',
    newClientDocument: '',
    roomId: '',
    planId: '',
    checkIn: todayISO(),
    checkOut: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    adults: 2,
    children: 0,
    status: 'confirmed' as BookingStatus,
    channel: 'direct' as Channel,
    totalPrice: 0,
    notes: '',
    priceTouched: false,
  });

  // Busca de hóspede (autocomplete) — evita listas gigantes em <select> nativo.
  const [clientQuery, setClientQuery] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [addingNewClient, setAddingNewClient] = useState(false);

  // Busca de quarto (autocomplete), no estilo "Quartos disponíveis".
  const [roomQuery, setRoomQuery] = useState('');
  const [roomPickerOpen, setRoomPickerOpen] = useState(false);
  const [roomCardOpen, setRoomCardOpen] = useState(true);
  const [priceUnit, setPriceUnit] = useState<'total' | 'night'>('total');

  // Adiantamento — só na criação (edição de reserva já tem "Registrar pagamento" nos detalhes).
  const [depositAmount, setDepositAmount] = useState(0);
  const [depositMethod, setDepositMethod] = useState<Payment['method']>('pix');

  useEffect(() => {
    if (!open) return;
    if (booking) {
      setForm({
        clientId: booking.clientId ?? '',
        newClientName: '',
        newClientPhone: '',
        newClientDocument: '',
        roomId: booking.roomId,
        planId: '',
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        adults: booking.adults ?? 2,
        children: booking.children ?? 0,
        status: booking.status,
        channel: booking.channel,
        totalPrice: booking.totalPrice,
        notes: booking.notes ?? '',
        priceTouched: true,
      });
      setClientQuery(clients.find((c) => c.id === booking.clientId)?.name ?? '');
      setAddingNewClient(false);
      setRoomQuery('');
    } else {
      setForm((f) => ({
        ...f,
        clientId: defaults?.clientId ?? '',
        newClientName: '',
        newClientPhone: '',
        newClientDocument: '',
        roomId: defaults?.roomId ?? '',
        planId: '',
        checkIn: defaults?.checkIn ?? todayISO(),
        checkOut: defaults?.checkOut ?? format(addDays(new Date(), 1), 'yyyy-MM-dd'),
        adults: 2,
        children: 0,
        status: (defaults?.status as BookingStatus) ?? 'confirmed',
        channel: 'direct',
        totalPrice: 0,
        notes: '',
        priceTouched: false,
      }));
      setClientQuery(defaults?.clientId ? clients.find((c) => c.id === defaults.clientId)?.name ?? '' : '');
      setAddingNewClient(false);
      setRoomQuery('');
    }
    setDepositAmount(0);
    setDepositMethod('pix');
    setPickerOpen(false);
    setRoomPickerOpen(false);
    setRoomCardOpen(true);
    setPriceUnit('total');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, booking, defaults]);

  const matchingClients = useMemo(() => {
    const term = clientQuery.trim().toLowerCase();
    if (!term) return [];
    return clients
      .filter((c) => c.name.toLowerCase().includes(term) || c.phone?.includes(term))
      .slice(0, 8);
  }, [clients, clientQuery]);

  const selectClient = (id: string, name: string) => {
    setForm((f) => ({ ...f, clientId: id }));
    setClientQuery(name);
    setPickerOpen(false);
    setAddingNewClient(false);
  };

  const clearClient = () => {
    setForm((f) => ({ ...f, clientId: '' }));
    setClientQuery('');
    setPickerOpen(false);
  };

  const isBlock = form.status === 'blocked';
  const numNights = form.checkIn && form.checkOut ? nights(form.checkIn, form.checkOut) : 0;

  /** Planos ativos aplicáveis à categoria de um quarto. */
  const plansForRoom = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return [];
    return ratePlans.filter((p) => p.categoryId === room.categoryId && p.active);
  };

  /** Preço médio por noite (para mostrar na busca de quartos). */
  const roomPrice = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return 0;
    if (room.price) return room.price;
    const plan = ratePlans.find((p) => p.categoryId === room.categoryId && p.active);
    if (plan) return plan.basePrice;
    return categories.find((c) => c.id === room.categoryId)?.basePrice ?? 0;
  };

  /** Soma noite a noite usando o tarifário (preço especial da data > dia da semana > base). */
  const stayTotal = (roomId: string, checkIn: string, checkOut: string, planId?: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room || checkOut <= checkIn) return 0;
    const plan = ratePlans.find((p) => p.id === planId) ?? ratePlans.find((p) => p.categoryId === room.categoryId && p.active);
    const fallback = room.price ?? categories.find((c) => c.id === room.categoryId)?.basePrice ?? 0;
    let total = 0;
    for (let d = parseISO(checkIn); format(d, 'yyyy-MM-dd') < checkOut; d = addDays(d, 1)) {
      const iso = format(d, 'yyyy-MM-dd');
      const p = room.price ?? (plan ? planPriceForDate(plan, iso) : null);
      total += p ?? fallback;
    }
    return total;
  };

  // Preço sugerido automático
  useEffect(() => {
    if (form.priceTouched || !form.roomId || isBlock) return;
    setForm((f) => ({ ...f, totalPrice: stayTotal(f.roomId, f.checkIn, f.checkOut, f.planId) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.roomId, form.checkIn, form.checkOut, form.planId, isBlock, ratePlans]);

  // Conflito de datas no quarto
  const conflict = useMemo(() => {
    if (!form.roomId || !form.checkIn || !form.checkOut) return null;
    return bookings.find(
      (b) =>
        b.roomId === form.roomId &&
        b.id !== booking?.id &&
        isActiveBooking(b) &&
        rangesOverlap(form.checkIn, form.checkOut, b.checkIn, b.checkOut)
    );
  }, [form.roomId, form.checkIn, form.checkOut, bookings, booking?.id]);

  const roomsWithAvailability = useMemo(() => {
    return rooms
      .slice()
      .sort((a, b) => a.number.localeCompare(b.number, 'pt-BR', { numeric: true }))
      .map((r) => {
        const busy = bookings.some(
          (b) => b.roomId === r.id && b.id !== booking?.id && isActiveBooking(b) && rangesOverlap(form.checkIn, form.checkOut, b.checkIn, b.checkOut)
        );
        return { ...r, busy };
      });
  }, [rooms, bookings, form.checkIn, form.checkOut, booking?.id]);

  const matchingRooms = useMemo(() => {
    const term = roomQuery.trim().toLowerCase();
    return roomsWithAvailability.filter((r) => {
      if (r.id === form.roomId) return false;
      if (!term) return true;
      const catName = categories.find((c) => c.id === r.categoryId)?.name ?? '';
      return r.number.toLowerCase().includes(term) || catName.toLowerCase().includes(term);
    });
  }, [roomsWithAvailability, roomQuery, form.roomId, categories]);

  const selectRoom = (roomId: string) => {
    const plans = plansForRoom(roomId);
    setForm((f) => ({ ...f, roomId, planId: plans[0]?.id ?? '', priceTouched: false }));
    setRoomQuery('');
    setRoomPickerOpen(false);
    setRoomCardOpen(true);
  };

  const removeRoom = () => {
    setForm((f) => ({ ...f, roomId: '', planId: '' }));
  };

  // Capacidade do quarto selecionado — apenas um aviso, nunca bloqueia a reserva.
  const selectedRoom = rooms.find((r) => r.id === form.roomId);
  const selectedCategory = categories.find((c) => c.id === selectedRoom?.categoryId);
  const maxGuests = selectedCategory?.maxGuests;
  const overCapacity = Boolean(maxGuests && form.adults + form.children > maxGuests);
  const availablePlans = form.roomId ? plansForRoom(form.roomId) : [];

  const remainingAfterDeposit = Math.max(0, form.totalPrice - (depositAmount || 0));
  const guestName = form.clientId ? clients.find((c) => c.id === form.clientId)?.name : (addingNewClient ? form.newClientName : undefined);

  const priceFieldValue = priceUnit === 'night' && numNights > 0 ? Math.round((form.totalPrice / numNights) * 100) / 100 : form.totalPrice;
  const onPriceFieldChange = (raw: number) => {
    const total = priceUnit === 'night' ? raw * (numNights || 1) : raw;
    setForm((f) => ({ ...f, totalPrice: total, priceTouched: true }));
  };

  const submit = async () => {
    if (!form.roomId) return toast.error('Selecione um quarto.');
    if (form.checkOut <= form.checkIn) return toast.error('O check-out deve ser depois do check-in.');
    if (conflict) return toast.error('Este quarto já está ocupado nessas datas.');

    let clientId = form.clientId;
    if (!isBlock && !clientId) {
      if (!addingNewClient) return toast.error('Busque um hóspede já cadastrado ou clique em "Cadastrar novo hóspede".');
      if (!form.newClientName.trim()) return toast.error('Informe o nome do hóspede.');
      if (!form.newClientPhone.trim()) return toast.error('Informe o telefone do hóspede.');
      if (!form.newClientDocument.trim()) return toast.error('Informe o documento (CPF/RG) do hóspede.');
      clientId = await save('clients', {
        name: form.newClientName.trim(),
        phone: form.newClientPhone.trim(),
        document: form.newClientDocument.trim(),
        createdAt: new Date().toISOString(),
      });
    }

    const initialPayments =
      !isEdit && !isBlock && depositAmount > 0
        ? [{ id: uid(), amount: depositAmount, method: depositMethod, date: new Date().toISOString() }]
        : booking?.payments ?? [];

    await save('bookings', {
      id: booking?.id,
      reservationNumber: booking?.reservationNumber ?? nextReservationNumber(bookings),
      roomId: form.roomId,
      clientId: isBlock ? '' : clientId,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      adults: form.adults,
      children: form.children,
      totalPrice: isBlock ? 0 : form.totalPrice,
      status: form.status,
      channel: form.channel,
      consumption: booking?.consumption ?? [],
      payments: initialPayments,
      notes: form.notes,
      createdAt: booking?.createdAt ?? new Date().toISOString(),
    });
    toast.success(isEdit ? 'Reserva atualizada.' : isBlock ? 'Período bloqueado.' : 'Reserva criada!');
    onClose();
  };

  const editingClientName = isEdit ? clients.find((c) => c.id === booking?.clientId)?.name : undefined;
  const submitLabel = isEdit ? 'Salvar alterações' : isBlock ? 'Bloquear período' : 'Criar reserva';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `${editingClientName ? `${editingClientName} · ` : ''}Editar reserva ${booking?.reservationNumber ?? ''}` : 'Nova reserva'}
      wide
      footer={<Button variant="outline" onClick={onClose}>Cancelar</Button>}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* ---------- Coluna principal ---------- */}
        <div className="space-y-5 min-w-0">
          <div className="flex flex-wrap gap-4">
            <div className="min-w-[160px] flex-1">
              <Field label="Canal">
                <Select value={form.channel} onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value as Channel }))}>
                  {(Object.keys(CHANNEL_LABELS) as Channel[]).map((c) => (
                    <option key={c} value={c}>{CHANNEL_LABELS[c]}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="min-w-[160px] flex-1">
              <Field label="Status">
                <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as BookingStatus }))}>
                  {(Object.keys(BOOKING_STATUS_LABELS) as BookingStatus[])
                    .filter((s) => isEdit || ['pre-booking', 'confirmed', 'checked-in', 'blocked'].includes(s))
                    .map((s) => (
                      <option key={s} value={s}>{BOOKING_STATUS_LABELS[s]}</option>
                    ))}
                </Select>
              </Field>
            </div>
          </div>

          {!isBlock && (
            <div>
              <Field label="Hóspede principal" required>
                <div className="relative">
                  <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                  <Input
                    value={clientQuery}
                    onChange={(e) => {
                      setClientQuery(e.target.value);
                      setForm((f) => ({ ...f, clientId: '' }));
                      setPickerOpen(true);
                      setAddingNewClient(false);
                    }}
                    onFocus={() => setPickerOpen(true)}
                    onBlur={() => setTimeout(() => setPickerOpen(false), 150)}
                    placeholder="Procurar…"
                    className={cn('pl-9 pr-9', form.clientId && 'border-brand-300 bg-brand-50/40 font-semibold text-brand-900')}
                  />
                  {(form.clientId || clientQuery) && (
                    <button type="button" onClick={clearClient} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-300 hover:text-slate-500 cursor-pointer">
                      <X size={15} />
                    </button>
                  )}
                  {pickerOpen && !form.clientId && clientQuery.trim() && (
                    <div className="absolute z-20 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                      {matchingClients.length > 0 ? (
                        matchingClients.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onMouseDown={() => selectClient(c.id, c.name)}
                            className="flex w-full flex-col items-start rounded-lg px-3 py-2 text-left text-sm hover:bg-brand-50 cursor-pointer"
                          >
                            <span className="font-semibold text-slate-800">{c.name}</span>
                            <span className="text-xs text-slate-400">{c.phone}{c.document ? ` · ${c.document}` : ''}</span>
                          </button>
                        ))
                      ) : (
                        <p className="px-3 py-2 text-sm text-slate-400">Nenhum hóspede encontrado.</p>
                      )}
                      <button
                        type="button"
                        onMouseDown={() => {
                          setAddingNewClient(true);
                          setPickerOpen(false);
                          setForm((f) => ({ ...f, newClientName: clientQuery.trim() }));
                        }}
                        className="mt-1 flex w-full items-center gap-1.5 rounded-lg border-t border-slate-100 px-3 py-2 text-left text-sm font-semibold text-brand-700 hover:bg-brand-50 cursor-pointer"
                      >
                        <UserPlus size={14} /> Cadastrar "{clientQuery.trim()}" como novo hóspede
                      </button>
                    </div>
                  )}
                </div>
              </Field>
              {!form.clientId && !addingNewClient && !clientQuery.trim() && (
                <button type="button" onClick={() => setAddingNewClient(true)} className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800 cursor-pointer">
                  <UserPlus size={13} /> Ou cadastre um hóspede novo
                </button>
              )}
            </div>
          )}

          {!isBlock && addingNewClient && (
            <div className="flex flex-wrap gap-4">
              <div className="min-w-[200px] flex-1">
                <Field label="Nome do hóspede" required>
                  <Input value={form.newClientName} onChange={(e) => setForm((f) => ({ ...f, newClientName: e.target.value }))} placeholder="Nome completo" />
                </Field>
              </div>
              <div className="min-w-[180px] flex-1">
                <Field label="Telefone do hóspede" required>
                  <Input value={form.newClientPhone} onChange={(e) => setForm((f) => ({ ...f, newClientPhone: formatPhoneBR(e.target.value) }))} placeholder="(00) 90000-0000" inputMode="tel" />
                </Field>
              </div>
              <div className="min-w-[180px] flex-1">
                <Field label="Documento (CPF/RG)" required>
                  <Input value={form.newClientDocument} onChange={(e) => setForm((f) => ({ ...f, newClientDocument: formatCPF(e.target.value) }))} placeholder="000.000.000-00" inputMode="numeric" />
                </Field>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setAddingNewClient(false);
                    setClientQuery('');
                    setForm((f) => ({ ...f, newClientName: '', newClientPhone: '', newClientDocument: '' }));
                  }}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Cancelar — voltar a buscar hóspede
                </button>
              </div>
            </div>
          )}

          <Field label="Datas da estadia" required>
            <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white p-1.5">
              <Input type="date" value={form.checkIn} onChange={(e) => setForm((f) => ({ ...f, checkIn: e.target.value }))} className="h-9 border-0 shadow-none focus:ring-0" />
              <span className="shrink-0 text-slate-300">–</span>
              <Input type="date" value={form.checkOut} min={form.checkIn} onChange={(e) => setForm((f) => ({ ...f, checkOut: e.target.value }))} className="h-9 border-0 shadow-none focus:ring-0" />
              <span className="ml-auto flex shrink-0 items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                <Moon size={12} /> {numNights}
              </span>
            </div>
          </Field>

          <div>
            <Field label="Quartos disponíveis">
              <div className="relative">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                <Input
                  value={roomQuery}
                  onChange={(e) => setRoomQuery(e.target.value)}
                  onFocus={() => setRoomPickerOpen(true)}
                  onBlur={() => setTimeout(() => setRoomPickerOpen(false), 150)}
                  placeholder="Procurar…"
                  className="pl-9"
                />
                {roomPickerOpen && (
                  <div className="absolute z-20 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                    {matchingRooms.length > 0 ? (
                      matchingRooms.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          disabled={r.busy}
                          onMouseDown={() => !r.busy && selectRoom(r.id)}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                        >
                          <span>
                            <span className="font-semibold text-slate-800">Quarto {r.number}</span>
                            <span className="text-xs text-slate-400"> · {categories.find((c) => c.id === r.categoryId)?.name ?? 'Sem categoria'}</span>
                          </span>
                          <span className="shrink-0 text-xs font-bold text-slate-500">{r.busy ? 'Ocupado' : brl(roomPrice(r.id))}</span>
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-sm text-slate-400">Nenhum quarto encontrado.</p>
                    )}
                  </div>
                )}
              </div>
            </Field>
          </div>

          {selectedRoom && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                <Bed size={15} /> Quarto selecionado (1)
              </p>
              <div className="overflow-hidden rounded-2xl border border-brand-200 bg-brand-50/40">
                <button
                  type="button"
                  onClick={() => setRoomCardOpen((v) => !v)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-700 text-white">
                      {roomCardOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                    <span className="font-bold text-slate-800">Quarto {selectedRoom.number}</span>
                    <span className="text-xs text-slate-400">{selectedCategory?.name ?? 'Sem categoria'}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="font-bold text-brand-800">{brl(form.totalPrice)}</span>
                    <span onClick={(e) => { e.stopPropagation(); removeRoom(); }} className="rounded p-1 text-slate-400 hover:bg-white hover:text-red-500 cursor-pointer">
                      <X size={15} />
                    </span>
                  </span>
                </button>
                {roomCardOpen && (
                  <div className="flex flex-wrap gap-4 border-t border-brand-100 bg-white px-4 py-4">
                    <div className="w-20">
                      <Field label="Adultos">
                        <Input type="number" min={1} value={form.adults} onChange={(e) => setForm((f) => ({ ...f, adults: Number(e.target.value) }))} />
                      </Field>
                    </div>
                    <div className="w-20">
                      <Field label="Crianças">
                        <Input type="number" min={0} value={form.children} onChange={(e) => setForm((f) => ({ ...f, children: Number(e.target.value) }))} />
                      </Field>
                    </div>
                    <div className="min-w-[160px] flex-1">
                      <Field label="Plano tarifário">
                        <Select
                          value={form.planId}
                          onChange={(e) => setForm((f) => ({ ...f, planId: e.target.value, priceTouched: false }))}
                          disabled={availablePlans.length === 0}
                        >
                          {availablePlans.length === 0 ? (
                            <option value="">Padrão da categoria</option>
                          ) : (
                            availablePlans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)
                          )}
                        </Select>
                      </Field>
                    </div>
                    <div className="min-w-[180px] flex-1">
                    <Field label="Preço">
                      <div className="flex gap-1.5">
                        <div className="relative flex-1">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">R$</span>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={priceFieldValue}
                            onChange={(e) => onPriceFieldChange(Number(e.target.value))}
                            className="pl-8"
                          />
                        </div>
                        <Select value={priceUnit} onChange={(e) => setPriceUnit(e.target.value as 'total' | 'night')} className="w-28 shrink-0">
                          <option value="total">Total</option>
                          <option value="night">Por noite</option>
                        </Select>
                      </div>
                    </Field>
                    </div>
                  </div>
                )}
              </div>
              {overCapacity && (
                <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" /> Este quarto comporta até {maxGuests} hóspede{maxGuests === 1 ? '' : 's'} — {form.adults + form.children} pode precisar de cama extra ou ajuste na reserva.
                </p>
              )}
              {conflict && (
                <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                  ⚠️ Conflito: este quarto já tem reserva de {conflict.checkIn} a {conflict.checkOut}.
                </p>
              )}
            </div>
          )}

          <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Detalhes adicionais</p>
            <Field label="Observações">
              <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder={isBlock ? 'Motivo do bloqueio (manutenção, uso interno…)' : 'Pedidos especiais, horário de chegada…'} />
            </Field>

            {!isEdit && !isBlock && (
              <div className="space-y-3 rounded-xl bg-slate-50 p-3">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"><Wallet size={13} /> Pré-pagamento</p>
                <div className="flex flex-wrap gap-3">
                  <div className="min-w-[220px] flex-1">
                    <Field label="Valor pago">
                      <div className="flex gap-2">
                        <Input type="number" min={0} step="0.01" value={depositAmount || ''} onChange={(e) => setDepositAmount(Number(e.target.value))} placeholder="0,00" className="min-w-0 flex-1" />
                        <Button type="button" variant="secondary" size="md" className="shrink-0 whitespace-nowrap" onClick={() => setDepositAmount(form.totalPrice)}>
                          Pago em total
                        </Button>
                      </div>
                    </Field>
                  </div>
                  <div className="min-w-[140px] flex-1">
                    <Field label="Método">
                      <Select value={depositMethod} onChange={(e) => setDepositMethod(e.target.value as Payment['method'])}>
                        {(Object.keys(PAYMENT_METHOD_LABELS) as Payment['method'][]).map((m) => (
                          <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ---------- Painel de resumo ---------- */}
        <div className="lg:sticky lg:top-0 lg:self-start">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold text-slate-800">Resumo da reserva</p>
              <span className={cn('rounded-full px-2.5 py-1 text-xs font-bold', STATUS_BADGE[form.status])}>
                {BOOKING_STATUS_LABELS[form.status]}
              </span>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Hóspede principal</span>
                <span className="max-w-[55%] truncate font-semibold text-slate-700">{guestName || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Datas</span>
                <span className="font-semibold text-slate-700">{form.checkIn && form.checkOut ? `${format(parseISO(form.checkIn), 'dd/MM')} – ${format(parseISO(form.checkOut), 'dd/MM')}` : '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Duração</span>
                <span className="font-semibold text-slate-700">{numNights} {numNights === 1 ? 'noite' : 'noites'}</span>
              </div>
            </div>

            {selectedRoom && (
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                <span className="text-slate-500">Quarto {selectedRoom.number}</span>
                <span className="font-semibold text-slate-700">{brl(form.totalPrice)}</span>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-sm font-semibold text-slate-500">Total</span>
              <span className="text-lg font-extrabold text-slate-900">{brl(isBlock ? 0 : form.totalPrice)}</span>
            </div>

            {!isBlock && !isEdit && (
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-500">Devido</span>
                  <span className={cn('text-xl font-extrabold', remainingAfterDeposit > 0 ? 'text-red-600' : 'text-emerald-700')}>{brl(remainingAfterDeposit)}</span>
                </div>
              </div>
            )}

            <Button onClick={submit} className="w-full">{submitLabel}</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
