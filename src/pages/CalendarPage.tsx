import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  addDays, differenceInCalendarDays, format, isBefore, isSameDay, isToday, isWeekend,
  parseISO, startOfDay, startOfToday, subDays,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  ArrowLeft, ArrowRight, BedDouble, Calendar as CalendarIcon, Check, ChevronDown, ChevronRight,
  CircleOff, Clock, DollarSign, Globe, GripVertical, List, Lock, Moon, Plus, Sparkles, User, X,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Button, EmptyState, PageHeader } from '../components/ui';
import BookingModal from '../components/BookingModal';
import BookingDetailsModal from '../components/BookingDetailsModal';
import type { Booking, Room } from '../types';
import { bookingBalance, bookingPaid, cn, isActiveBooking, rangesOverlap } from '../lib/utils';

const CELL = 60; // largura da célula (px)
const HALF = CELL / 2; // reservas começam/terminam ao meio-dia

const NUM_DAYS = 16;

/* Estilo do cartão da reserva por status */
const barStyle: Record<string, string> = {
  'pre-booking': 'bg-amber-50 border-amber-400',
  confirmed: 'bg-emerald-50 border-emerald-500',
  'checked-in': 'bg-blue-50 border-blue-500',
  'checked-out': 'bg-slate-50 border-slate-500',
  cancelled: 'bg-red-50 border-red-500',
  'no-show': 'bg-rose-50 border-rose-500',
  blocked: 'bg-slate-200 border-slate-400 opacity-80',
};
const dotStyle: Record<string, string> = {
  'pre-booking': 'bg-amber-400',
  confirmed: 'bg-emerald-500',
  'checked-in': 'bg-blue-500',
  'checked-out': 'bg-slate-600',
  cancelled: 'bg-red-500',
  'no-show': 'bg-rose-500',
  blocked: 'bg-slate-800',
};

function StatusDot({ status }: { status: Booking['status'] }) {
  return (
    <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white shadow-sm', dotStyle[status])}>
      {status === 'pre-booking' && <CircleOff size={9} />}
      {status === 'confirmed' && <Check size={9} strokeWidth={3} />}
      {status === 'checked-in' && <User size={9} strokeWidth={3} />}
      {status === 'checked-out' && <Check size={9} strokeWidth={3} />}
      {status === 'cancelled' && <X size={9} strokeWidth={3} />}
      {status === 'no-show' && <X size={9} strokeWidth={3} />}
      {status === 'blocked' && <Lock size={9} strokeWidth={3} />}
    </span>
  );
}

function RoomIcon({ room, occupied }: { room: Room; occupied: boolean }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-100 bg-slate-50">
      {occupied ? (
        <User size={12} className="text-blue-500" />
      ) : room.status === 'maintenance' ? (
        <X size={12} className="text-rose-500" />
      ) : room.status === 'dirty' ? (
        <Sparkles size={12} className="text-amber-500" />
      ) : room.status === 'cleaning' ? (
        <Clock size={12} className="text-blue-400" />
      ) : (
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
      )}
    </span>
  );
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const { rooms, categories, bookings, clients, update } = useData();

  const [startDate, setStartDate] = useState(() => subDays(startOfDay(new Date()), 2));
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [newDefaults, setNewDefaults] = useState<Partial<Booking> | null>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [now, setNow] = useState(new Date());
  const [legendOpen, setLegendOpen] = useState(false);

  // Seleção por arrasto (criar reserva)
  const [sel, setSel] = useState<{ roomId: string; anchor: Date; hover: Date } | null>(null);
  const selRef = useRef(sel);
  selRef.current = sel;

  // Arrastar e soltar reservas
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ roomId: string; day: Date } | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const days = useMemo(() => Array.from({ length: NUM_DAYS }, (_, i) => addDays(startDate, i)), [startDate]);
  const viewStart = format(days[0], 'yyyy-MM-dd');
  const viewEnd = format(addDays(days[NUM_DAYS - 1], 1), 'yyyy-MM-dd');

  const clientName = (id?: string) => clients.find((c) => c.id === id)?.name ?? 'Hóspede';

  const visibleBookings = useMemo(
    () =>
      bookings.filter(
        (b) => !['cancelled', 'no-show'].includes(b.status) && b.checkIn < viewEnd && b.checkOut > viewStart
      ),
    [bookings, viewStart, viewEnd]
  );

  const groups = useMemo(() => {
    const sortRooms = (list: Room[]) => list.slice().sort((a, b) => a.number.localeCompare(b.number, 'pt-BR', { numeric: true }));
    const g = categories.map((cat) => ({ cat, rooms: sortRooms(rooms.filter((r) => r.categoryId === cat.id)) }));
    const orphans = sortRooms(rooms.filter((r) => !categories.some((c) => c.id === r.categoryId)));
    if (orphans.length) g.push({ cat: { id: '_none', name: 'Sem categoria', maxGuests: 0, basePrice: 0 }, rooms: orphans });
    return g.filter((x) => x.rooms.length > 0);
  }, [rooms, categories]);

  /** A noite que começa em `day` está livre neste quarto? */
  const nightFree = (roomId: string, day: Date) => {
    const d = format(day, 'yyyy-MM-dd');
    const d1 = format(addDays(day, 1), 'yyyy-MM-dd');
    return !visibleBookings.some((b) => b.roomId === roomId && isActiveBooking(b) && rangesOverlap(d, d1, b.checkIn, b.checkOut));
  };

  const occupiedToday = (roomId: string) => {
    const t = format(new Date(), 'yyyy-MM-dd');
    return visibleBookings.some((b) => b.roomId === roomId && ['checked-in', 'confirmed', 'blocked'].includes(b.status) && b.checkIn <= t && b.checkOut > t);
  };

  // ---- Seleção por arrasto ----
  const finishSelection = () => {
    const s = selRef.current;
    if (!s) return;
    const a = s.anchor < s.hover ? s.anchor : s.hover;
    const b = s.anchor < s.hover ? s.hover : s.anchor;
    setSel(null);
    setNewDefaults({
      roomId: s.roomId,
      checkIn: format(a, 'yyyy-MM-dd'),
      checkOut: format(addDays(b, 1), 'yyyy-MM-dd'),
    });
  };
  useEffect(() => {
    const up = () => finishSelection();
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  const inSelection = (roomId: string, day: Date) => {
    if (!sel || sel.roomId !== roomId) return false;
    const a = sel.anchor < sel.hover ? sel.anchor : sel.hover;
    const b = sel.anchor < sel.hover ? sel.hover : sel.anchor;
    return day >= a && day <= b;
  };

  // ---- Mover reserva (drag & drop) ----
  const dropBooking = async (roomId: string, day: Date) => {
    setDropTarget(null);
    if (!dragId) return;
    const b = bookings.find((x) => x.id === dragId);
    setDragId(null);
    if (!b) return;
    const nightsCount = differenceInCalendarDays(parseISO(b.checkOut), parseISO(b.checkIn));
    const newIn = format(day, 'yyyy-MM-dd');
    const newOut = format(addDays(day, nightsCount), 'yyyy-MM-dd');
    if (newIn === b.checkIn && roomId === b.roomId) return;
    const conflict = bookings.some(
      (x) => x.id !== b.id && x.roomId === roomId && isActiveBooking(x) && rangesOverlap(newIn, newOut, x.checkIn, x.checkOut)
    );
    if (conflict) return toast.error('Não foi possível mover: o quarto está ocupado nessas datas.');
    await update('bookings', b.id, { roomId, checkIn: newIn, checkOut: newOut });
    toast.success(`Reserva de ${clientName(b.clientId)} movida para o quarto ${rooms.find((r) => r.id === roomId)?.number} · ${format(day, 'dd/MM')}.`);
  };

  const nowLinePct = ((now.getHours() * 60 + now.getMinutes()) / (24 * 60)) * 100;

  // Meses no cabeçalho
  const monthSpans = useMemo(() => {
    const spans: { label: string; span: number }[] = [];
    for (const d of days) {
      const label = format(d, 'MMMM yyyy', { locale: ptBR });
      const last = spans[spans.length - 1];
      if (last && last.label === label) last.span++;
      else spans.push({ label, span: 1 });
    }
    return spans;
  }, [days]);

  return (
    <>
      <PageHeader
        title="Calendário de Reservas"
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/reservas')}><List size={16} /> Lista<span className="hidden sm:inline"> de Reservas</span></Button>
            <Button onClick={() => setNewDefaults({})}><Plus size={16} /> <span className="hidden sm:inline">Nova </span>Reserva</Button>
          </>
        }
      />

      {/* Navegação */}
      <div className="mb-3 flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1 shadow-sm sm:w-fit">
        <button
          onClick={() => setStartDate(subDays(startDate, 7))}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-white hover:shadow-sm cursor-pointer"
        >
          <ArrowLeft size={16} strokeWidth={2.5} /> <span className="hidden sm:inline">Voltar 7 dias</span>
        </button>
        <div className="relative">
          <input
            type="date"
            value={format(startDate, 'yyyy-MM-dd')}
            onChange={(e) => e.target.value && setStartDate(startOfDay(parseISO(e.target.value)))}
            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
          />
          <div className="pointer-events-none px-3 py-2 text-slate-500"><CalendarIcon size={18} strokeWidth={2.5} /></div>
        </div>
        <button
          onClick={() => setStartDate(subDays(startOfDay(new Date()), 2))}
          className="rounded-xl px-3 py-2 text-sm font-bold text-brand-700 transition hover:bg-white hover:shadow-sm cursor-pointer"
        >
          Hoje
        </button>
        <button
          onClick={() => setStartDate(addDays(startDate, 7))}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-white hover:shadow-sm cursor-pointer"
        >
          <span className="hidden sm:inline">Próximos 7 dias</span> <ArrowRight size={16} strokeWidth={2.5} />
        </button>
      </div>

      {rooms.length === 0 ? (
        <EmptyState icon={BedDouble} title="Nenhum quarto cadastrado" subtitle="Cadastre seus quartos para visualizar o calendário de ocupação." />
      ) : (
        <div className="overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm" style={{ maxHeight: 'calc(100dvh - 230px)' }}>
          <table className="min-w-max table-fixed border-separate border-spacing-0">
            <colgroup>
              <col className="w-[66px] sm:w-[128px]" />
              {days.map((d) => <col key={d.toISOString()} style={{ width: CELL }} />)}
            </colgroup>

            <thead>
              {/* Linha do mês */}
              <tr className="sticky top-0 z-[60]">
                <th rowSpan={2} className="sticky left-0 z-[70] border-b border-r border-slate-200 bg-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]" />
                {monthSpans.map((m, i) => (
                  <th key={i} colSpan={m.span} className="h-8 border-b border-r border-slate-200 bg-slate-100 px-2 text-left align-middle">
                    <span className="whitespace-nowrap text-[11px] font-bold capitalize text-slate-500">{m.label}</span>
                  </th>
                ))}
              </tr>
              {/* Linha dos dias */}
              <tr className="sticky top-8 z-[55] shadow-[0_4px_10px_-4px_rgba(0,0,0,0.06)]">
                {days.map((d) => (
                  <th
                    key={d.toISOString()}
                    className={cn(
                      'relative h-[52px] border-b border-r border-slate-100 p-0 text-center',
                      isToday(d) ? 'bg-brand-50' : isWeekend(d) ? 'bg-slate-50' : 'bg-white'
                    )}
                  >
                    {isToday(d) && (
                      <span className="absolute bottom-0 top-0 z-40 w-[2px] rounded-full bg-brand-600" style={{ left: `${nowLinePct}%` }} />
                    )}
                    <div className="flex h-full flex-col items-center justify-center gap-0.5">
                      <span className={cn('text-[9px] font-bold uppercase tracking-widest leading-none', isToday(d) ? 'text-brand-700' : 'text-slate-400')}>
                        {format(d, 'EEE', { locale: ptBR }).replace('.', '')}
                      </span>
                      <span className={cn('text-sm font-bold leading-none', isToday(d) ? 'text-brand-800' : 'text-slate-700')}>{format(d, 'dd')}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {groups.map(({ cat, rooms: catRooms }) => {
                const isCollapsed = collapsed.includes(cat.id);
                return (
                  <Fragment key={cat.id}>
                    {/* Cabeçalho da categoria */}
                    <tr>
                      <td
                        onClick={() => setCollapsed((c) => (isCollapsed ? c.filter((x) => x !== cat.id) : [...c, cat.id]))}
                        className="sticky left-0 z-50 h-[42px] cursor-pointer overflow-hidden border-b border-r border-slate-200 bg-slate-50/95 px-1.5 backdrop-blur transition hover:bg-slate-100 shadow-[2px_0_8px_-2px_rgba(0,0,0,0.05)] sm:px-2.5"
                        title={cat.name}
                      >
                        <div className="flex min-w-0 items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 sm:gap-1.5 sm:text-[11px]">
                          {isCollapsed ? <ChevronRight size={14} className="shrink-0 text-slate-400" /> : <ChevronDown size={14} className="shrink-0 text-slate-400" />}
                          <span className="min-w-0 truncate">{cat.name}</span>
                        </div>
                      </td>
                      {days.map((d) => {
                        let free: number | null = null;
                        if (isCollapsed) free = catRooms.filter((r) => nightFree(r.id, d)).length;
                        return (
                          <td key={d.toISOString()} className={cn('relative h-[42px] border-b border-r border-slate-100 p-0', isToday(d) ? 'bg-brand-50/40' : isWeekend(d) ? 'bg-slate-50/60' : 'bg-slate-50/30')}>
                            {free !== null && (
                              <span className={cn('absolute inset-0 z-10 flex items-center justify-center text-[10px] font-bold', free > 0 ? 'text-emerald-500' : 'text-rose-400')} title={`${free} quarto(s) livre(s)`}>
                                {free}
                              </span>
                            )}
                            {isToday(d) && <span className="absolute bottom-0 top-0 z-40 w-[2px] rounded-full bg-brand-600/50" style={{ left: `${nowLinePct}%` }} />}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Quartos */}
                    {!isCollapsed && catRooms.map((room) => {
                      const roomBars = visibleBookings.filter((b) => b.roomId === room.id);
                      return (
                        <tr key={room.id} className="group h-[58px] transition-colors hover:bg-slate-50/50">
                          <td className="sticky left-0 z-50 overflow-hidden border-b border-r border-slate-100 bg-white px-1.5 shadow-[2px_0_8px_-4px_rgba(0,0,0,0.05)] transition group-hover:bg-slate-50 sm:px-2.5" title={`Quarto ${room.number}`}>
                            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                              <RoomIcon room={room} occupied={occupiedToday(room.id)} />
                              <span className="min-w-0 truncate text-xs font-bold tracking-tight text-slate-700 transition group-hover:text-brand-700">{room.number}</span>
                            </div>
                          </td>

                          {days.map((day, index) => {
                            const free = nightFree(room.id, day);
                            const isPast = isBefore(day, startOfToday());
                            return (
                              <td
                                key={day.toISOString()}
                                className={cn(
                                  'relative h-[58px] border-b border-r border-slate-100 p-0',
                                  isToday(day) ? 'bg-brand-50/20' : isWeekend(day) ? 'bg-slate-50/40' : 'bg-white'
                                )}
                                style={{ zIndex: NUM_DAYS - index }}
                              >
                                {/* Sombreamento do passado */}
                                {(isPast || isToday(day)) && (
                                  <span className="pointer-events-none absolute bottom-0 left-0 top-0 z-0 bg-slate-100/50" style={{ width: isPast ? '100%' : '50%' }} />
                                )}
                                {/* Linha do agora */}
                                {isToday(day) && (
                                  <span className="pointer-events-none absolute bottom-0 top-0 z-40 w-[2px] rounded-full bg-brand-600/40" style={{ left: `${nowLinePct}%` }} />
                                )}
                                {/* Seleção */}
                                {inSelection(room.id, day) && (
                                  <span className="pointer-events-none absolute bottom-0 top-0 left-1/2 z-20 w-full border-y-2 border-brand-600 bg-brand-600/15" />
                                )}
                                {/* Alvo do drop */}
                                {dropTarget && dropTarget.roomId === room.id && isSameDay(dropTarget.day, day) && (
                                  <span className="pointer-events-none absolute bottom-0 top-0 left-1/2 z-40 w-full bg-brand-50 ring-2 ring-inset ring-brand-500" />
                                )}

                                {/* Camada de interação da noite (meio-dia → meio-dia) */}
                                <div
                                  className="group/night absolute bottom-0 top-0 left-1/2 z-10 flex w-full cursor-pointer items-center justify-center"
                                  onDragOver={(e) => { if (dragId) { e.preventDefault(); setDropTarget({ roomId: room.id, day }); } }}
                                  onDragLeave={() => setDropTarget((t) => (t && t.roomId === room.id && isSameDay(t.day, day) ? null : t))}
                                  onDrop={(e) => { e.preventDefault(); dropBooking(room.id, day); }}
                                  onMouseDown={(e) => {
                                    if (e.button !== 0 || !free) return;
                                    e.preventDefault();
                                    setSel({ roomId: room.id, anchor: day, hover: day });
                                  }}
                                  onMouseEnter={() => {
                                    if (selRef.current && selRef.current.roomId === room.id) setSel((s) => (s ? { ...s, hover: day } : s));
                                  }}
                                >
                                  {free && !sel && (
                                    <>
                                      <span className="pointer-events-none absolute inset-0 transition-colors group-hover/night:bg-brand-50/50" />
                                      <span className="pointer-events-none relative z-20 flex h-7 w-7 scale-90 items-center justify-center rounded-full border border-brand-600 bg-brand-700 text-white opacity-0 shadow-md transition-all duration-200 group-hover/night:scale-100 group-hover/night:opacity-100">
                                        <Plus size={15} strokeWidth={2.5} />
                                      </span>
                                    </>
                                  )}
                                </div>

                                {/* Barras de reserva (renderizadas no primeiro dia visível) */}
                                {roomBars.map((b) => {
                                  const ci = parseISO(b.checkIn);
                                  const co = parseISO(b.checkOut);
                                  const isFirstVisibleDay = isSameDay(day, ci) || (isSameDay(day, days[0]) && ci < days[0]);
                                  if (!isFirstVisibleDay) return null;

                                  const isActualCheckIn = isSameDay(day, ci);
                                  const barStart = isActualCheckIn ? ci : days[0];
                                  const lastDay = days[NUM_DAYS - 1];
                                  const overflows = co > addDays(lastDay, 1);
                                  const barEnd = overflows ? addDays(lastDay, 1) : co;
                                  let width = differenceInCalendarDays(barEnd, barStart) * CELL;
                                  if (isActualCheckIn) width -= HALF;
                                  if (!overflows) width += HALF;
                                  if (width < 22) width = 22;

                                  const nightsCount = differenceInCalendarDays(co, ci);
                                  const paid = bookingPaid(b);
                                  const balance = bookingBalance(b);
                                  const payState = balance <= 0 && paid > 0 ? 'full' : paid > 0 ? 'partial' : 'none';
                                  const isBlock = b.status === 'blocked';

                                  return (
                                    <div
                                      key={b.id}
                                      draggable={isActiveBooking(b)}
                                      onDragStart={(e) => { setDragId(b.id); e.dataTransfer.effectAllowed = 'move'; }}
                                      onDragEnd={() => { setDragId(null); setDropTarget(null); }}
                                      onClick={(e) => { e.stopPropagation(); setDetailsId(b.id); }}
                                      onMouseDown={(e) => e.stopPropagation()}
                                      title={`${isBlock ? 'Bloqueado' : clientName(b.clientId)} · ${format(ci, 'dd/MM')} → ${format(co, 'dd/MM')}`}
                                      className={cn(
                                        'absolute bottom-[6px] top-[6px] z-30 flex cursor-pointer select-none flex-col overflow-hidden whitespace-nowrap rounded-[10px] border-l-4 shadow-sm transition-all hover:z-40 hover:scale-[1.01] hover:shadow-md',
                                        barStyle[b.status] ?? 'bg-white border-slate-400',
                                        dragId === b.id && 'opacity-40 grayscale'
                                      )}
                                      style={{ left: isActualCheckIn ? HALF : 0, width, minWidth: 22 }}
                                    >
                                      <div className="flex items-center gap-1.5 border-b border-black/[0.04] bg-white/60 px-1.5 py-0.5 text-[11px] font-bold text-slate-800">
                                        <StatusDot status={b.status} />
                                        <span className="flex-1 truncate tracking-tight">{isBlock ? 'Bloqueado' : clientName(b.clientId)}</span>
                                        {width > 90 && <GripVertical size={12} className="shrink-0 text-slate-300" />}
                                      </div>
                                      {!isBlock && width > 60 && (
                                        <div className="mt-0.5 flex items-center gap-2 px-1.5 text-[10px] font-medium text-slate-500">
                                          <span className="flex items-center gap-0.5" title={`${nightsCount} noite(s)`}>
                                            <Moon size={10} className="text-slate-400" /> {nightsCount}
                                          </span>
                                          <span className="flex items-center gap-0.5" title={`${b.adults + (b.children ?? 0)} hóspede(s)`}>
                                            <User size={10} className="text-slate-400" /> {b.adults + (b.children ?? 0)}
                                          </span>
                                          {b.channel !== 'direct' && <span title={b.channel}><Globe size={10} className="text-brand-500" /></span>}
                                          <span className="flex items-center" title={payState === 'full' ? 'Pago' : payState === 'partial' ? 'Pagamento parcial' : 'Não pago'}>
                                            <DollarSign size={10} className={cn(payState === 'full' ? 'text-emerald-500' : payState === 'partial' ? 'text-blue-500' : 'text-amber-500')} />
                                            {payState === 'none' && <X size={8} className="-ml-1 text-amber-500" />}
                                          </span>
                                        </div>
                                      )}
                                      {/* Separadores de dia dentro da barra */}
                                      {width > CELL && Array.from({ length: Math.ceil(width / CELL) }).map((_, i) => {
                                        const linePos = (isActualCheckIn ? HALF : CELL) + i * CELL;
                                        if (linePos <= 4 || linePos >= width - 4) return null;
                                        return <span key={i} className="absolute bottom-0 top-0 z-0 border-r border-slate-300/25" style={{ left: linePos }} />;
                                      })}
                                    </div>
                                  );
                                })}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>

          {/* Legenda: fixa no desktop, botão flutuante no mobile */}
          <div className="sticky bottom-0 left-0 border-t border-slate-100 bg-white px-3 py-2 sm:px-4">
            <div className={cn('flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-500', legendOpen ? 'flex pb-2' : 'hidden sm:flex')}>
              <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Pré-reserva</span>
              <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Confirmada</span>
              <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Hospedado</span>
              <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-slate-500" /> Finalizada</span>
              <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-slate-800" /> Bloqueio</span>
              <span className="ml-auto hidden text-slate-400 lg:inline">Arraste nas células para criar · arraste uma reserva para mover</span>
            </div>
            <button
              onClick={() => setLegendOpen(!legendOpen)}
              className="ml-auto block rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm cursor-pointer sm:hidden"
            >
              {legendOpen ? 'Fechar' : 'Legenda'}
            </button>
          </div>
        </div>
      )}

      <BookingModal
        open={newDefaults !== null || Boolean(editing)}
        onClose={() => { setNewDefaults(null); setEditing(null); }}
        booking={editing}
        defaults={newDefaults ?? undefined}
      />
      <BookingDetailsModal bookingId={detailsId} onClose={() => setDetailsId(null)} onEdit={(b) => { setDetailsId(null); setEditing(b); }} />
    </>
  );
}
