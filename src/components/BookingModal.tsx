import { useEffect, useMemo, useState } from 'react';
import { addDays, format } from 'date-fns';
import { toast } from 'sonner';
import { AlertTriangle, Search, UserPlus, Wallet, X } from 'lucide-react';
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

export default function BookingModal({ open, onClose, booking, defaults }: Props) {
  const { rooms, categories, clients, bookings, ratePlans, save } = useData();
  const isEdit = Boolean(booking);

  const [form, setForm] = useState({
    clientId: '',
    newClientName: '',
    newClientPhone: '',
    newClientDocument: '',
    roomId: '',
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
    } else {
      setForm((f) => ({
        ...f,
        clientId: defaults?.clientId ?? '',
        newClientName: '',
        newClientPhone: '',
        newClientDocument: '',
        roomId: defaults?.roomId ?? '',
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
    }
    setDepositAmount(0);
    setDepositMethod('pix');
    setPickerOpen(false);
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

  /** Preço médio por noite (para mostrar no seletor de quartos). */
  const roomPrice = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return 0;
    if (room.price) return room.price;
    const plan = ratePlans.find((p) => p.categoryId === room.categoryId && p.active);
    if (plan) return plan.basePrice;
    return categories.find((c) => c.id === room.categoryId)?.basePrice ?? 0;
  };

  /** Soma noite a noite usando o tarifário (preço especial da data > dia da semana > base). */
  const stayTotal = (roomId: string, checkIn: string, checkOut: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room || checkOut <= checkIn) return 0;
    const plan = ratePlans.find((p) => p.categoryId === room.categoryId && p.active);
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
    setForm((f) => ({ ...f, totalPrice: stayTotal(f.roomId, f.checkIn, f.checkOut) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.roomId, form.checkIn, form.checkOut, isBlock, ratePlans]);

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

  // Capacidade do quarto selecionado — apenas um aviso, nunca bloqueia a reserva.
  const selectedRoom = rooms.find((r) => r.id === form.roomId);
  const selectedCategory = categories.find((c) => c.id === selectedRoom?.categoryId);
  const maxGuests = selectedCategory?.maxGuests;
  const overCapacity = Boolean(maxGuests && form.adults + form.children > maxGuests);

  const remainingAfterDeposit = Math.max(0, form.totalPrice - (depositAmount || 0));

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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `${editingClientName ? `${editingClientName} · ` : ''}Editar reserva ${booking?.reservationNumber ?? ''}` : 'Nova reserva'}
      wide
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit}>{isEdit ? 'Salvar alterações' : isBlock ? 'Bloquear período' : 'Criar reserva'}</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Status">
          <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as BookingStatus }))}>
            {(Object.keys(BOOKING_STATUS_LABELS) as BookingStatus[])
              .filter((s) => isEdit || ['pre-booking', 'confirmed', 'checked-in', 'blocked'].includes(s))
              .map((s) => (
                <option key={s} value={s}>{BOOKING_STATUS_LABELS[s]}</option>
              ))}
          </Select>
        </Field>
        <Field label="Canal">
          <Select value={form.channel} onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value as Channel }))}>
            {(Object.keys(CHANNEL_LABELS) as Channel[]).map((c) => (
              <option key={c} value={c}>{CHANNEL_LABELS[c]}</option>
            ))}
          </Select>
        </Field>

        <Field label="Check-in" required>
          <Input type="date" value={form.checkIn} onChange={(e) => setForm((f) => ({ ...f, checkIn: e.target.value }))} />
        </Field>
        <Field label="Check-out" required>
          <Input type="date" value={form.checkOut} min={form.checkIn} onChange={(e) => setForm((f) => ({ ...f, checkOut: e.target.value }))} />
        </Field>

        <Field label="Quarto" required>
          <Select value={form.roomId} onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))}>
            <option value="">Selecione…</option>
            {roomsWithAvailability.map((r) => (
              <option key={r.id} value={r.id} disabled={r.busy}>
                Quarto {r.number} — {categories.find((c) => c.id === r.categoryId)?.name ?? 'Sem categoria'}
                {r.busy ? ' (ocupado)' : ` · ${brl(roomPrice(r.id))}/noite`}
              </option>
            ))}
          </Select>
        </Field>

        {!isBlock && (
          <div className="sm:col-span-2">
            <Field label="Hóspede" required>
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
                  placeholder="Busque por nome ou telefone…"
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
          <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
            <Field label="Nome do hóspede" required>
              <Input value={form.newClientName} onChange={(e) => setForm((f) => ({ ...f, newClientName: e.target.value }))} placeholder="Nome completo" />
            </Field>
            <Field label="Telefone do hóspede" required>
              <Input value={form.newClientPhone} onChange={(e) => setForm((f) => ({ ...f, newClientPhone: formatPhoneBR(e.target.value) }))} placeholder="(00) 90000-0000" inputMode="tel" />
            </Field>
            <Field label="Documento (CPF/RG)" required>
              <Input value={form.newClientDocument} onChange={(e) => setForm((f) => ({ ...f, newClientDocument: formatCPF(e.target.value) }))} placeholder="000.000.000-00" inputMode="numeric" />
            </Field>
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

        {!isBlock && (
          <>
            <Field label="Adultos">
              <Input type="number" min={1} value={form.adults} onChange={(e) => setForm((f) => ({ ...f, adults: Number(e.target.value) }))} />
            </Field>
            <Field label="Crianças">
              <Input type="number" min={0} value={form.children} onChange={(e) => setForm((f) => ({ ...f, children: Number(e.target.value) }))} />
            </Field>
            {overCapacity && (
              <p className="flex items-start gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 sm:col-span-2">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" /> Este quarto comporta até {maxGuests} hóspede{maxGuests === 1 ? '' : 's'} — {form.adults + form.children} pode precisar de cama extra ou ajuste na reserva.
              </p>
            )}
            {isEdit ? (
              <Field label={`Valor total (${numNights} ${numNights === 1 ? 'noite' : 'noites'})`} hint="Calculado automaticamente — edite se quiser">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.totalPrice}
                  onChange={(e) => setForm((f) => ({ ...f, totalPrice: Number(e.target.value), priceTouched: true }))}
                />
              </Field>
            ) : (
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                <h4 className="flex items-center gap-1.5 text-sm font-bold text-slate-700"><Wallet size={15} /> Resumo financeiro</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={`Valor total (${numNights} ${numNights === 1 ? 'noite' : 'noites'})`} hint="Calculado automaticamente — edite se quiser">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.totalPrice}
                      onChange={(e) => setForm((f) => ({ ...f, totalPrice: Number(e.target.value), priceTouched: true }))}
                    />
                  </Field>
                  <Field label="Adiantamento (opcional)" hint="Já recebeu algum sinal/depósito? Registre aqui.">
                    <div className="flex gap-2">
                      <Input type="number" min={0} step="0.01" value={depositAmount || ''} onChange={(e) => setDepositAmount(Number(e.target.value))} placeholder="0,00" />
                      <Select value={depositMethod} onChange={(e) => setDepositMethod(e.target.value as Payment['method'])} className="w-32 shrink-0">
                        {(Object.keys(PAYMENT_METHOD_LABELS) as Payment['method'][]).map((m) => (
                          <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>
                        ))}
                      </Select>
                    </div>
                  </Field>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm">
                  <span className="text-sm font-semibold text-slate-500">Saldo {depositAmount > 0 ? 'após o adiantamento' : 'a pagar'}</span>
                  <span className={cn('text-xl font-extrabold', remainingAfterDeposit > 0 ? 'text-red-600' : 'text-emerald-700')}>{brl(remainingAfterDeposit)}</span>
                </div>
              </div>
            )}
          </>
        )}

        <div className={isBlock ? 'sm:col-span-2' : ''}>
          <Field label="Observações">
            <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder={isBlock ? 'Motivo do bloqueio (manutenção, uso interno…)' : 'Pedidos especiais, horário de chegada…'} />
          </Field>
        </div>
      </div>

      {conflict && (
        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          ⚠️ Conflito: este quarto já tem reserva de {conflict.checkIn} a {conflict.checkOut}.
        </p>
      )}
    </Modal>
  );
}
