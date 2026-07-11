import { useEffect, useMemo, useState } from 'react';
import { addDays, format } from 'date-fns';
import { toast } from 'sonner';
import { useData } from '../context/DataContext';
import { Button, Field, Input, Modal, Select, Textarea } from './ui';
import type { Booking, BookingStatus, Channel } from '../types';
import { BOOKING_STATUS_LABELS, CHANNEL_LABELS } from '../types';
import { parseISO } from 'date-fns';
import { brl, isActiveBooking, nextReservationNumber, nights, planPriceForDate, rangesOverlap, todayISO } from '../lib/utils';

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
    }
  }, [open, booking, defaults]);

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

  const submit = async () => {
    if (!form.roomId) return toast.error('Selecione um quarto.');
    if (form.checkOut <= form.checkIn) return toast.error('O check-out deve ser depois do check-in.');
    if (conflict) return toast.error('Este quarto já está ocupado nessas datas.');

    let clientId = form.clientId;
    if (!isBlock && !clientId) {
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
      payments: booking?.payments ?? [],
      notes: form.notes,
      createdAt: booking?.createdAt ?? new Date().toISOString(),
    });
    toast.success(isEdit ? 'Reserva atualizada.' : isBlock ? 'Período bloqueado.' : 'Reserva criada!');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? `Editar reserva ${booking?.reservationNumber ?? ''}` : 'Nova reserva'} wide
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
          <Field label="Cliente" required>
            <Select value={form.clientId} onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}>
              <option value="">+ Novo cliente (preencha abaixo)</option>
              {clients
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </Select>
          </Field>
        )}

        {!isBlock && !form.clientId && (
          <>
            <Field label="Nome do hóspede" required>
              <Input value={form.newClientName} onChange={(e) => setForm((f) => ({ ...f, newClientName: e.target.value }))} placeholder="Nome completo" />
            </Field>
            <Field label="Telefone do hóspede" required>
              <Input value={form.newClientPhone} onChange={(e) => setForm((f) => ({ ...f, newClientPhone: e.target.value }))} placeholder="(00) 90000-0000" />
            </Field>
            <Field label="Documento (CPF/RG)" required>
              <Input value={form.newClientDocument} onChange={(e) => setForm((f) => ({ ...f, newClientDocument: e.target.value }))} placeholder="000.000.000-00" />
            </Field>
          </>
        )}

        {!isBlock && (
          <>
            <Field label="Adultos">
              <Input type="number" min={1} value={form.adults} onChange={(e) => setForm((f) => ({ ...f, adults: Number(e.target.value) }))} />
            </Field>
            <Field label="Crianças">
              <Input type="number" min={0} value={form.children} onChange={(e) => setForm((f) => ({ ...f, children: Number(e.target.value) }))} />
            </Field>
            <Field label={`Valor total (${numNights} ${numNights === 1 ? 'noite' : 'noites'})`} hint="Calculado automaticamente — edite se quiser">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.totalPrice}
                onChange={(e) => setForm((f) => ({ ...f, totalPrice: Number(e.target.value), priceTouched: true }))}
              />
            </Field>
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
