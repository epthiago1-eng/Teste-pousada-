import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BedDouble, CalendarClock, CalendarPlus, DollarSign, LogIn, LogOut, Percent, Sparkles, Users, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { usePrefs } from '../context/PrefsContext';
import { Badge, Button, Card, EmptyState, PageHeader, Stat } from '../components/ui';
import BookingModal from '../components/BookingModal';
import BookingDetailsModal from '../components/BookingDetailsModal';
import type { Booking } from '../types';
import { bookingBalance, brl, fmtDateShort, todayISO } from '../lib/utils';

export default function DashboardPage() {
  const { profile, tenant } = useAuth();
  const { bookings, rooms, clients, requests } = useData();
  const { cardEnabled } = usePrefs();
  const [newOpen, setNewOpen] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Booking | null>(null);

  const today = todayISO();

  const stats = useMemo(() => {
    const arrivals = bookings.filter((b) => b.checkIn === today && ['confirmed', 'pre-booking'].includes(b.status));
    const departures = bookings.filter((b) => b.checkOut === today && b.status === 'checked-in');
    const inHouse = bookings.filter((b) => b.status === 'checked-in');
    const occupied = new Set(
      bookings.filter((b) => ['checked-in', 'confirmed', 'blocked'].includes(b.status) && b.checkIn <= today && b.checkOut > today).map((b) => b.roomId)
    );
    const occupancy = rooms.length ? Math.round((occupied.size / rooms.length) * 100) : 0;
    const monthStart = today.slice(0, 8) + '01';
    const revenueMonth = bookings
      .filter((b) => !['cancelled', 'no-show', 'blocked'].includes(b.status) && b.checkIn >= monthStart && b.checkIn <= today)
      .reduce((s, b) => s + b.totalPrice, 0);
    const dirty = rooms.filter((r) => r.status === 'dirty').length;
    // Cards extras (ativados em Personalizar)
    const pendingPayments = bookings
      .filter((b) => ['pre-booking', 'confirmed', 'checked-in'].includes(b.status) && bookingBalance(b) > 0)
      .sort((a, b) => bookingBalance(b) - bookingBalance(a));
    const weekEnd = format(addDays(new Date(), 7), 'yyyy-MM-dd');
    const upcoming = bookings
      .filter((b) => ['pre-booking', 'confirmed'].includes(b.status) && b.checkIn > today && b.checkIn <= weekEnd)
      .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
    return { arrivals, departures, inHouse, occupancy, revenueMonth, dirty, pendingPayments, upcoming };
  }, [bookings, rooms, today]);

  const clientName = (id?: string) => clients.find((c) => c.id === id)?.name ?? 'Hóspede';
  const roomNumber = (id: string) => rooms.find((r) => r.id === id)?.number ?? '?';
  const pendingReq = requests.filter((r) => !r.status || r.status === 'pending').length;

  return (
    <>
      <PageHeader
        title={`Olá, ${profile?.name?.split(' ')[0] ?? ''} 👋`}
        subtitle={format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
        actions={<Button onClick={() => setNewOpen(true)}><CalendarPlus size={16} /> Nova reserva</Button>}
      />

      {rooms.length === 0 ? (
        <EmptyState
          icon={BedDouble}
          title="Bem-vindo ao PousadaGest!"
          subtitle="Comece cadastrando as categorias e os quartos da sua pousada. Depois é só criar reservas."
          action={<Link to="/quartos"><Button>Cadastrar quartos</Button></Link>}
        />
      ) : (
        <>
          {cardEnabled('stats') && (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat label="Ocupação hoje" value={`${stats.occupancy}%`} icon={Percent} tone="teal" sub={`${rooms.length} quartos`} />
              <Stat label="Hóspedes na casa" value={stats.inHouse.length} icon={Users} tone="blue" />
              <Stat label="Receita do mês" value={brl(stats.revenueMonth)} icon={DollarSign} tone="emerald" />
              <Stat label="Quartos a limpar" value={stats.dirty} icon={Sparkles} tone={stats.dirty > 0 ? 'amber' : 'teal'} />
            </div>
          )}

          {cardEnabled('requests') && pendingReq > 0 && (
            <Link to="/solicitacoes">
              <Card className="mt-4 flex items-center justify-between border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-800">
                  📥 {pendingReq} solicitação(ões) de reserva aguardando resposta
                </p>
                <Badge color="yellow">Ver</Badge>
              </Card>
            </Link>
          )}

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {/* Chegadas */}
            {cardEnabled('arrivals') && (
            <Card className="p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
                <LogIn size={16} className="text-emerald-600" /> Chegadas de hoje ({stats.arrivals.length})
              </h3>
              {stats.arrivals.length === 0 ? (
                <p className="text-sm text-slate-400">Nenhuma chegada prevista.</p>
              ) : (
                <ul className="space-y-2">
                  {stats.arrivals.map((b) => (
                    <li key={b.id} onClick={() => setDetailsId(b.id)} className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5 hover:border-brand-200 hover:bg-brand-50/40">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{clientName(b.clientId)}</p>
                        <p className="text-xs text-slate-400">Quarto {roomNumber(b.roomId)} · {b.adults + (b.children ?? 0)} hóspede(s)</p>
                      </div>
                      <Badge color="blue">Check-in</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            )}

            {/* Saídas */}
            {cardEnabled('departures') && (
            <Card className="p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
                <LogOut size={16} className="text-orange-500" /> Saídas de hoje ({stats.departures.length})
              </h3>
              {stats.departures.length === 0 ? (
                <p className="text-sm text-slate-400">Nenhuma saída prevista.</p>
              ) : (
                <ul className="space-y-2">
                  {stats.departures.map((b) => (
                    <li key={b.id} onClick={() => setDetailsId(b.id)} className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5 hover:border-brand-200 hover:bg-brand-50/40">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{clientName(b.clientId)}</p>
                        <p className="text-xs text-slate-400">Quarto {roomNumber(b.roomId)}</p>
                      </div>
                      <Badge color="orange">Check-out</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            )}
          </div>

          {/* Hóspedes na casa */}
          {cardEnabled('inhouse') && (
          <Card className="mt-4 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
              <Users size={16} className="text-brand-600" /> Hospedados agora ({stats.inHouse.length})
            </h3>
            {stats.inHouse.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhum hóspede na casa no momento.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {stats.inHouse.map((b) => (
                  <div key={b.id} onClick={() => setDetailsId(b.id)} className="cursor-pointer rounded-xl border border-slate-100 px-3 py-2.5 hover:border-brand-200 hover:bg-brand-50/40">
                    <p className="text-sm font-bold text-slate-800">{clientName(b.clientId)}</p>
                    <p className="text-xs text-slate-400">Quarto {roomNumber(b.roomId)} · sai {b.checkOut.split('-').reverse().slice(0, 2).join('/')}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
          )}

          {/* Cards extras (ative em Personalizar) */}
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {cardEnabled('pendingPayments') && (
              <Card className="p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Wallet size={16} className="text-red-500" /> Pagamentos pendentes ({stats.pendingPayments.length})
                </h3>
                {stats.pendingPayments.length === 0 ? (
                  <p className="text-sm text-slate-400">Nenhum saldo em aberto. 🎉</p>
                ) : (
                  <>
                    <ul className="space-y-2">
                      {stats.pendingPayments.slice(0, 6).map((b) => (
                        <li key={b.id} onClick={() => setDetailsId(b.id)} className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5 hover:border-brand-200 hover:bg-brand-50/40">
                          <div>
                            <p className="text-sm font-bold text-slate-800">{clientName(b.clientId)}</p>
                            <p className="text-xs text-slate-400">Quarto {roomNumber(b.roomId)} · {fmtDateShort(b.checkIn)}</p>
                          </div>
                          <span className="text-sm font-extrabold text-red-600">{brl(bookingBalance(b))}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-right text-xs font-bold text-slate-500">
                      Total em aberto: <span className="text-red-600">{brl(stats.pendingPayments.reduce((s, b) => s + bookingBalance(b), 0))}</span>
                    </p>
                  </>
                )}
              </Card>
            )}

            {cardEnabled('upcoming') && (
              <Card className="p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
                  <CalendarClock size={16} className="text-brand-600" /> Próximas chegadas — 7 dias ({stats.upcoming.length})
                </h3>
                {stats.upcoming.length === 0 ? (
                  <p className="text-sm text-slate-400">Nenhuma chegada prevista para a semana.</p>
                ) : (
                  <ul className="space-y-2">
                    {stats.upcoming.slice(0, 6).map((b) => (
                      <li key={b.id} onClick={() => setDetailsId(b.id)} className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5 hover:border-brand-200 hover:bg-brand-50/40">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{clientName(b.clientId)}</p>
                          <p className="text-xs text-slate-400">Quarto {roomNumber(b.roomId)} · {b.adults + (b.children ?? 0)} hóspede(s)</p>
                        </div>
                        <Badge color="teal">{fmtDateShort(b.checkIn)}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}
          </div>

          {tenant?.publicBookingEnabled && tenant.slug && (
            <p className="mt-4 text-center text-xs text-slate-400">
              Página pública de reservas: <span className="font-semibold text-brand-700">{window.location.origin}/p/{tenant.slug}</span>
            </p>
          )}
        </>
      )}

      <BookingModal open={newOpen || Boolean(editing)} onClose={() => { setNewOpen(false); setEditing(null); }} booking={editing} />
      <BookingDetailsModal bookingId={detailsId} onClose={() => setDetailsId(null)} onEdit={(b) => { setDetailsId(null); setEditing(b); }} />
    </>
  );
}
