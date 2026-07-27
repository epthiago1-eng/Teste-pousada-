import { useMemo, useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { addDays, addMonths, endOfMonth, format, isBefore, startOfDay, startOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  ArrowLeft, CalendarDays, Check, ChevronLeft, ChevronRight, Loader2, MessageCircle, Moon, Users,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import type { PublicAvailability, Tenant } from '../../types';
import type { PublicCategory } from './usePublicTenant';
import { freeRooms, priceFor, stayTotal } from './publicPricing';
import { brl, cn, formatPhoneBR, nights, todayISO, waPhone } from '../../lib/utils';

type Step = 'dates' | 'guest' | 'done';
type Range = { checkIn: string; checkOut: string };

/* ================================================================
   Calendário do mês: preço por diária, disponibilidade e seleção
   ================================================================ */
function MonthCalendar({ cat, availability, range, onPick }: {
  cat: PublicCategory;
  availability: PublicAvailability | null;
  range: Range | null;
  onPick: (iso: string) => void;
}) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const today = todayISO();

  const cells = useMemo(() => {
    const first = startOfMonth(month);
    const start = addDays(first, -first.getDay());
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [month]);

  const atFirstMonth = isBefore(endOfMonth(subMonths(month, 1)), startOfDay(new Date()));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonth(subMonths(month, 1))}
          disabled={atFirstMonth}
          className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="text-sm font-extrabold capitalize text-slate-800">{format(month, 'MMMM yyyy', { locale: ptBR })}</p>
        <button
          type="button"
          onClick={() => setMonth(addMonths(month, 1))}
          className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 cursor-pointer"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
          <span key={d} className="pb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">{d}</span>
        ))}
        {cells.map((d) => {
          const iso = format(d, 'yyyy-MM-dd');
          const inMonth = d.getMonth() === month.getMonth();
          const past = iso < today;
          const free = freeRooms(cat, availability, iso, format(addDays(d, 1), 'yyyy-MM-dd')) > 0;
          const price = priceFor(cat, iso);
          const isStart = range?.checkIn === iso;
          const isEnd = range?.checkOut === iso;
          const inRange = Boolean(range?.checkOut && iso > range.checkIn && iso < range.checkOut);
          const selectable = inMonth && !past && free;

          return (
            <button
              key={iso}
              type="button"
              disabled={!selectable}
              onClick={() => onPick(iso)}
              className={cn(
                'flex h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-sm transition',
                !inMonth && 'invisible',
                selectable && 'cursor-pointer text-slate-700 hover:bg-brand-50',
                (past || !free) && inMonth && 'cursor-not-allowed text-slate-300',
                !past && !free && inMonth && 'bg-slate-100',
                inRange && 'bg-brand-100 text-brand-900',
                (isStart || isEnd) && 'bg-brand-700 font-bold text-white hover:bg-brand-700'
              )}
            >
              <span className="font-bold leading-none">{format(d, 'd')}</span>
              {selectable && (
                <span className={cn('text-[9px] font-semibold leading-none', isStart || isEnd ? 'text-white/80' : 'text-slate-400')}>
                  {brl(price).replace('R$', '').replace(',00', '').trim()}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-[11px] font-semibold text-slate-500">
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded bg-brand-700" /> Selecionado</span>
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded bg-brand-100" /> Disponível</span>
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded bg-slate-200" /> Indisponível</span>
      </div>
    </div>
  );
}

/* ================================================================
   Fluxo de reserva: datas → dados do hóspede → pedido enviado
   ================================================================ */
export function BookingSheet({ tenant, cat, availability, initialRange, initialGuests, onClose }: {
  tenant: Tenant;
  cat: PublicCategory;
  availability: PublicAvailability | null;
  initialRange?: Range | null;
  initialGuests?: { adults: number; children: number };
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>(initialRange?.checkOut ? 'guest' : 'dates');
  const [range, setRange] = useState<Range | null>(initialRange?.checkOut ? initialRange : null);
  const [guest, setGuest] = useState({
    name: '',
    phone: '',
    email: '',
    adults: initialGuests?.adults ?? 2,
    children: initialGuests?.children ?? 0,
    notes: '',
  });
  const [sending, setSending] = useState(false);
  const [photoBroken, setPhotoBroken] = useState(false);

  const minStay = cat.pricing?.minStay ?? 1;
  const numNights = range?.checkOut ? nights(range.checkIn, range.checkOut) : 0;
  const total = range?.checkOut ? stayTotal(cat, range.checkIn, range.checkOut) : 0;
  const nightly = numNights > 0 ? total / numNights : priceFor(cat, todayISO());
  const overCapacity = guest.adults + guest.children > cat.maxGuests;

  const pickDate = (iso: string) => {
    // Primeiro toque (ou reinício): define a chegada e espera a saída.
    if (!range || range.checkOut || iso <= range.checkIn) {
      setRange({ checkIn: iso, checkOut: '' });
      return;
    }
    // Só fecha o período se TODAS as noites entre as duas datas estiverem livres —
    // o calendário valida noite a noite, então um vão no meio seria aceito sem isso.
    if (freeRooms(cat, availability, range.checkIn, iso) <= 0) {
      return toast.error('Há noites ocupadas nesse intervalo. Escolha outro período.');
    }
    if (nights(range.checkIn, iso) < minStay) {
      return toast.error(`Esta acomodação pede no mínimo ${minStay} noite(s).`);
    }
    setRange({ checkIn: range.checkIn, checkOut: iso });
  };

  const submit = async () => {
    if (guest.name.trim().length < 2) return toast.error('Informe seu nome completo.');
    if (guest.phone.replace(/\D/g, '').length < 10) return toast.error('Informe um telefone válido — é por ele que confirmamos sua reserva.');
    if (!range?.checkOut) return toast.error('Escolha as datas da estadia.');

    setSending(true);
    try {
      // Mesmo formato que a tela de Solicitações do app já lê (status "pending").
      await addDoc(collection(db, 'tenants', tenant.id, 'bookingRequests'), {
        guestName: guest.name.trim().slice(0, 119),
        guestPhone: guest.phone.trim().slice(0, 39),
        guestEmail: guest.email.trim(),
        categoryId: cat.id,
        checkIn: range.checkIn,
        checkOut: range.checkOut,
        adults: guest.adults,
        children: guest.children,
        notes: guest.notes.trim().slice(0, 500),
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      setStep('done');
    } catch {
      toast.error('Não foi possível enviar. Verifique sua conexão e tente novamente.');
    } finally {
      setSending(false);
    }
  };

  const fmt = (iso: string) => format(new Date(`${iso}T12:00:00`), "d 'de' MMM", { locale: ptBR });

  const titles: Record<Step, string> = {
    dates: 'Selecionar datas',
    guest: 'Resumo da reserva',
    done: 'Pedido enviado',
  };

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-slate-50">
      {/* Cabeçalho */}
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <button
          type="button"
          onClick={() => (step === 'guest' ? setStep('dates') : onClose())}
          className="rounded-xl p-1.5 text-slate-500 transition hover:bg-slate-100 cursor-pointer"
          aria-label="Voltar"
        >
          <ArrowLeft size={20} />
        </button>
        <p className="flex-1 truncate text-center text-sm font-extrabold text-slate-800">{titles[step]}</p>
        <span className="w-8" />
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-lg px-4 py-4">
          {step === 'dates' && (
            <>
              <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <MonthCalendar cat={cat} availability={availability} range={range} onPick={pickDate} />
              </div>
              <div className="mt-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                {range?.checkOut ? (
                  <>
                    <p className="text-sm font-extrabold text-slate-800">
                      {numNights} noite{numNights === 1 ? '' : 's'} selecionada{numNights === 1 ? '' : 's'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Check-in: {fmt(range.checkIn)}{tenant.checkinTime ? ` · a partir das ${tenant.checkinTime}` : ''}</p>
                    <p className="text-xs text-slate-500">Check-out: {fmt(range.checkOut)}{tenant.checkoutTime ? ` · até as ${tenant.checkoutTime}` : ''}</p>
                  </>
                ) : (
                  <p className="text-xs text-slate-500">
                    {range?.checkIn
                      ? `Chegada em ${fmt(range.checkIn)}. Agora escolha a data de saída.`
                      : 'Toque na data de chegada e depois na data de saída.'}
                  </p>
                )}
              </div>
            </>
          )}

          {step === 'guest' && range?.checkOut && (
            <div className="space-y-3">
              {/* Acomodação */}
              <div className="flex items-center gap-3 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
                {cat.photos?.[0] && !photoBroken ? (
                  <img
                    src={cat.photos[0]}
                    alt=""
                    onError={() => setPhotoBroken(true)}
                    className="h-16 w-20 shrink-0 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">🛏️</div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-extrabold text-slate-800">{cat.name}</p>
                  <p className="text-xs text-slate-500">Até {cat.maxGuests} hóspede{cat.maxGuests === 1 ? '' : 's'}</p>
                </div>
              </div>

              {/* Datas */}
              <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <div className="flex items-stretch gap-3 text-sm">
                  <div className="flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Check-in</p>
                    <p className="mt-0.5 font-bold text-slate-800">{fmt(range.checkIn)}</p>
                  </div>
                  <div className="w-px bg-slate-100" />
                  <div className="flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Check-out</p>
                    <p className="mt-0.5 font-bold text-slate-800">{fmt(range.checkOut)}</p>
                  </div>
                  <div className="w-px bg-slate-100" />
                  <div className="flex shrink-0 flex-col justify-center">
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-600">
                      <Moon size={12} className="text-slate-400" /> {numNights}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('dates')}
                  className="mt-3 text-xs font-bold text-brand-700 hover:text-brand-800 cursor-pointer"
                >
                  Alterar datas
                </button>
              </div>

              {/* Hóspedes */}
              <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <p className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  <Users size={13} /> Hóspedes
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { key: 'adults' as const, label: 'Adultos', min: 1 },
                    { key: 'children' as const, label: 'Crianças', min: 0 },
                  ]).map(({ key, label, min }) => (
                    <label key={key} className="block">
                      <span className="mb-1 block text-xs font-semibold text-slate-500">{label}</span>
                      <input
                        type="number"
                        min={min}
                        value={guest[key]}
                        onChange={(e) => setGuest((g) => ({ ...g, [key]: Math.max(min, Number(e.target.value) || 0) }))}
                        className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                      />
                    </label>
                  ))}
                </div>
                {overCapacity && (
                  <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                    Esta acomodação comporta até {cat.maxGuests} hóspede{cat.maxGuests === 1 ? '' : 's'}. Podemos avaliar cama extra — deixe um recado abaixo.
                  </p>
                )}
              </div>

              {/* Seus dados */}
              <div className="space-y-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Seus dados</p>
                <input
                  value={guest.name}
                  onChange={(e) => setGuest((g) => ({ ...g, name: e.target.value }))}
                  placeholder="Nome completo *"
                  className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
                <input
                  value={guest.phone}
                  onChange={(e) => setGuest((g) => ({ ...g, phone: formatPhoneBR(e.target.value) }))}
                  placeholder="WhatsApp / telefone *"
                  inputMode="tel"
                  className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
                <input
                  value={guest.email}
                  onChange={(e) => setGuest((g) => ({ ...g, email: e.target.value }))}
                  placeholder="E-mail (opcional)"
                  inputMode="email"
                  className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
                <textarea
                  value={guest.notes}
                  onChange={(e) => setGuest((g) => ({ ...g, notes: e.target.value }))}
                  placeholder="Algum pedido especial? Horário de chegada, cama extra…"
                  className="min-h-20 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>

              {/* Valores */}
              <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">{brl(nightly)} × {numNights} noite{numNights === 1 ? '' : 's'}</span>
                  <span className="font-semibold text-slate-700">{brl(total)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="font-extrabold text-slate-800">Total</span>
                  <span className="text-xl font-extrabold text-slate-900">{brl(total)}</span>
                </div>
                <p className="mt-2 text-[11px] leading-snug text-slate-400">
                  Nada é cobrado agora. A {tenant.name} confirma a disponibilidade e combina o pagamento com você.
                </p>
              </div>
            </div>
          )}

          {step === 'done' && range?.checkOut && (
            <div className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-100">
              {tenant.logoUrl && <img src={tenant.logoUrl} alt="" className="mx-auto mb-4 h-14 w-14 rounded-2xl object-cover" />}
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <Check size={30} className="text-emerald-600" strokeWidth={3} />
              </span>
              <h2 className="mt-4 text-xl font-extrabold text-slate-900">Pedido enviado!</h2>
              <p className="mt-2 text-sm text-slate-500">
                A {tenant.name} recebeu sua solicitação e vai confirmar a disponibilidade pelo telefone{' '}
                <strong className="text-slate-700">{guest.phone}</strong>. Sua reserva fica garantida só depois dessa confirmação.
              </p>

              <div className="mt-5 space-y-2 rounded-2xl bg-slate-50 p-4 text-left text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Acomodação</span>
                  <span className="font-semibold text-slate-700">{cat.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Check-in</span>
                  <span className="font-semibold text-slate-700">{fmt(range.checkIn)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Check-out</span>
                  <span className="font-semibold text-slate-700">{fmt(range.checkOut)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Hóspedes</span>
                  <span className="font-semibold text-slate-700">
                    {guest.adults} adulto{guest.adults === 1 ? '' : 's'}{guest.children ? `, ${guest.children} criança${guest.children === 1 ? '' : 's'}` : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                  <span className="text-slate-400">Estimativa</span>
                  <span className="font-extrabold text-slate-800">{brl(total)}</span>
                </div>
              </div>

              {tenant.whatsappNumber && (
                <a
                  href={`https://wa.me/${waPhone(tenant.whatsappNumber)}?text=${encodeURIComponent(
                    `Olá! Acabei de enviar um pedido de reserva em nome de ${guest.name} para ${fmt(range.checkIn)} a ${fmt(range.checkOut)}.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-emerald-600"
                >
                  <MessageCircle size={16} /> Falar no WhatsApp
                </a>
              )}
              <button
                type="button"
                onClick={onClose}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 cursor-pointer"
              >
                Voltar para o início
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Rodapé fixo com a ação do passo */}
      {step !== 'done' && (
        <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 safe-bottom">
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <div className="min-w-0 flex-1">
              {range?.checkOut ? (
                <>
                  <p className="text-[11px] font-semibold text-slate-400">{numNights} noite{numNights === 1 ? '' : 's'}</p>
                  <p className="truncate text-lg font-extrabold text-slate-900">{brl(total)}</p>
                </>
              ) : (
                <>
                  <p className="text-[11px] font-semibold text-slate-400">A partir de</p>
                  <p className="truncate text-lg font-extrabold text-slate-900">{brl(nightly)} <span className="text-xs font-semibold text-slate-400">/noite</span></p>
                </>
              )}
            </div>
            {step === 'dates' ? (
              <button
                type="button"
                disabled={!range?.checkOut}
                onClick={() => setStep('guest')}
                className="shrink-0 rounded-2xl bg-brand-700 px-6 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-brand-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                Continuar
              </button>
            ) : (
              <button
                type="button"
                disabled={sending}
                onClick={submit}
                className="flex shrink-0 items-center gap-2 rounded-2xl bg-brand-700 px-6 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-brand-800 disabled:opacity-60 cursor-pointer"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <CalendarDays size={16} />}
                {sending ? 'Enviando…' : 'Solicitar reserva'}
              </button>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
