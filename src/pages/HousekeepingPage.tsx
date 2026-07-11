import { useMemo } from 'react';
import { toast } from 'sonner';
import { BedDouble, Check, Sparkles } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Badge, Card, EmptyState, PageHeader } from '../components/ui';
import type { Room, RoomStatus } from '../types';
import { ROOM_STATUS_LABELS } from '../types';
import { cn, isActiveBooking, todayISO } from '../lib/utils';

const FLOW: { from: RoomStatus; to: RoomStatus; label: string }[] = [
  { from: 'dirty', to: 'cleaning', label: 'Iniciar limpeza' },
  { from: 'cleaning', to: 'clean', label: 'Concluir limpeza' },
  { from: 'clean', to: 'inspected', label: 'Marcar inspecionado' },
  { from: 'inspected', to: 'dirty', label: 'Marcar sujo' },
  { from: 'maintenance', to: 'dirty', label: 'Fim da manutenção' },
];

const statusStyles: Record<RoomStatus, { badge: 'green' | 'red' | 'yellow' | 'blue' | 'gray'; ring: string }> = {
  clean: { badge: 'green', ring: 'border-emerald-200' },
  dirty: { badge: 'red', ring: 'border-red-200' },
  cleaning: { badge: 'yellow', ring: 'border-amber-200' },
  inspected: { badge: 'blue', ring: 'border-sky-200' },
  maintenance: { badge: 'gray', ring: 'border-slate-200' },
};

export default function HousekeepingPage() {
  const { rooms, bookings, categories, update } = useData();
  const today = todayISO();

  const sorted = useMemo(() => {
    const order: RoomStatus[] = ['dirty', 'cleaning', 'maintenance', 'clean', 'inspected'];
    return rooms.slice().sort((a, b) => {
      const so = order.indexOf(a.status) - order.indexOf(b.status);
      return so !== 0 ? so : a.number.localeCompare(b.number, 'pt-BR', { numeric: true });
    });
  }, [rooms]);

  const departsToday = (room: Room) =>
    bookings.some((b) => b.roomId === room.id && b.status === 'checked-in' && b.checkOut === today);
  const occupied = (room: Room) =>
    bookings.some((b) => b.roomId === room.id && isActiveBooking(b) && b.status !== 'pre-booking' && b.checkIn <= today && b.checkOut > today);

  const dirtyCount = rooms.filter((r) => r.status === 'dirty').length;

  const advance = async (room: Room) => {
    const step = FLOW.find((s) => s.from === room.status);
    if (!step) return;
    await update('rooms', room.id, { status: step.to });
    toast.success(`Quarto ${room.number}: ${ROOM_STATUS_LABELS[step.to]}`);
  };

  return (
    <>
      <PageHeader title="Governança" subtitle={dirtyCount > 0 ? `${dirtyCount} quarto(s) aguardando limpeza` : 'Tudo em dia! ✨'} />

      {rooms.length === 0 ? (
        <EmptyState icon={BedDouble} title="Nenhum quarto cadastrado" />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {sorted.map((room) => {
            const step = FLOW.find((s) => s.from === room.status);
            const style = statusStyles[room.status];
            return (
              <Card key={room.id} className={cn('border-2 p-4', style.ring)}>
                <div className="flex items-start justify-between">
                  <p className="text-xl font-extrabold text-slate-800">{room.number}</p>
                  <Badge color={style.badge}>{ROOM_STATUS_LABELS[room.status]}</Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-400">{categories.find((c) => c.id === room.categoryId)?.name}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {occupied(room) && <Badge color="purple">Ocupado</Badge>}
                  {departsToday(room) && <Badge color="orange">Sai hoje</Badge>}
                </div>
                {step && (
                  <button
                    onClick={() => advance(room)}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-700 py-2.5 text-xs font-bold text-white hover:bg-brand-800 cursor-pointer"
                  >
                    {step.to === 'clean' || step.to === 'inspected' ? <Check size={14} /> : <Sparkles size={14} />}
                    {step.label}
                  </button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
