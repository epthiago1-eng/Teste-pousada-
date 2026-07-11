import { useMemo, useState } from 'react';
import { CalendarPlus, ClipboardList, Search } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Badge, Button, Card, EmptyState, Input, PageHeader, Select } from '../components/ui';
import BookingModal from '../components/BookingModal';
import BookingDetailsModal from '../components/BookingDetailsModal';
import type { Booking, BookingStatus } from '../types';
import { BOOKING_STATUS_LABELS, CHANNEL_LABELS } from '../types';
import { bookingBalance, brl, fmtDateShort } from '../lib/utils';

const statusColor: Record<BookingStatus, 'yellow' | 'blue' | 'green' | 'gray' | 'red' | 'purple' | 'orange'> = {
  'pre-booking': 'yellow',
  confirmed: 'blue',
  'checked-in': 'green',
  'checked-out': 'gray',
  cancelled: 'red',
  'no-show': 'orange',
  blocked: 'purple',
};

export default function BookingsPage() {
  const { bookings, clients, rooms } = useData();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | BookingStatus>('active');
  const [newOpen, setNewOpen] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Booking | null>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return bookings
      .filter((b) => {
        if (status === 'active') return ['pre-booking', 'confirmed', 'checked-in'].includes(b.status);
        if (status !== 'all') return b.status === status;
        return true;
      })
      .filter((b) => {
        if (!term) return true;
        const client = clients.find((c) => c.id === b.clientId);
        const room = rooms.find((r) => r.id === b.roomId);
        return (
          b.reservationNumber?.toLowerCase().includes(term) ||
          client?.name?.toLowerCase().includes(term) ||
          client?.phone?.includes(term) ||
          room?.number?.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => b.checkIn.localeCompare(a.checkIn));
  }, [bookings, clients, rooms, q, status]);

  return (
    <>
      <PageHeader
        title="Reservas"
        subtitle={`${filtered.length} reserva(s)`}
        actions={<Button onClick={() => setNewOpen(true)}><CalendarPlus size={16} /> Nova reserva</Button>}
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input className="pl-9" placeholder="Buscar por hóspede, nº da reserva, quarto…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select className="sm:w-52" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="active">Ativas (pré + confirmadas + na casa)</option>
          <option value="all">Todas</option>
          {(Object.keys(BOOKING_STATUS_LABELS) as BookingStatus[]).map((s) => (
            <option key={s} value={s}>{BOOKING_STATUS_LABELS[s]}</option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Nenhuma reserva encontrada" subtitle="Ajuste os filtros ou crie uma nova reserva." action={<Button onClick={() => setNewOpen(true)}>Nova reserva</Button>} />
      ) : (
        <div className="space-y-2">
          {filtered.map((b) => {
            const client = clients.find((c) => c.id === b.clientId);
            const room = rooms.find((r) => r.id === b.roomId);
            const balance = bookingBalance(b);
            return (
              <Card key={b.id} onClick={() => setDetailsId(b.id)} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-slate-800">
                    {b.status === 'blocked' ? '🔒 Bloqueio' : client?.name ?? 'Cliente removido'}
                  </p>
                  <p className="text-xs text-slate-400">
                    #{b.reservationNumber} · Quarto {room?.number ?? '?'} · {CHANNEL_LABELS[b.channel]}
                  </p>
                </div>
                <div className="text-sm font-semibold text-slate-600">
                  {fmtDateShort(b.checkIn)} → {fmtDateShort(b.checkOut)}
                </div>
                {b.status !== 'blocked' && (
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-slate-900">{brl(b.totalPrice)}</p>
                    {balance > 0 && ['pre-booking', 'confirmed', 'checked-in'].includes(b.status) && (
                      <p className="text-[11px] font-semibold text-red-500">falta {brl(balance)}</p>
                    )}
                  </div>
                )}
                <Badge color={statusColor[b.status]}>{BOOKING_STATUS_LABELS[b.status]}</Badge>
              </Card>
            );
          })}
        </div>
      )}

      <BookingModal open={newOpen || Boolean(editing)} onClose={() => { setNewOpen(false); setEditing(null); }} booking={editing} />
      <BookingDetailsModal bookingId={detailsId} onClose={() => setDetailsId(null)} onEdit={(b) => { setDetailsId(null); setEditing(b); }} />
    </>
  );
}
