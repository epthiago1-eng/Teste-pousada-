import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { addDoc, collection } from 'firebase/firestore';
import { addDays, addMonths, endOfMonth, format, isBefore, parseISO, startOfDay, startOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  BedDouble, CalendarCheck, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Coffee, Loader2,
  MapPin, MessageCircle, Phone, Search, Send, Users, Wifi, X,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { usePublicTenant, type PublicCategory } from './usePublicTenant';
import type { PublicAvailability, Tenant } from '../../types';
import { brl, cn, nights, planPriceForDate, rangesOverlap, todayISO } from '../../lib/utils';

/* ================================================================
   Helpers de preço e disponibilidade (dados públicos, sem login)
   ================================================================ */
function priceFor(cat: PublicCategory, iso: string): number {
  if (!cat.pricing) return cat.basePrice;
  return (
    planPriceForDate(
      {
        basePrice: cat.pricing.basePrice,
        pricesByDayOfWeek: cat.pricing.pricesByDayOfWeek,
        dailyOverrides: cat.pricing.dailyOverrides,
        validFrom: cat.pricing.validFrom || undefined,
        validTo: cat.pricing.validTo || undefined,
      },
      iso
    ) ?? cat.pricing.basePrice
  );
}

function freeRooms(cat: PublicCategory, availability: PublicAvailability | null, startISO: string, endISO: string): number {
  const busy = new Set(
    (availability?.ranges ?? [])
      .filter((r) => cat.roomIds.includes(r.roomId) && rangesOverlap(startISO, endISO, r.start, r.end))
      .map((r) => r.roomId)
  );
  return cat.roomIds.length - busy.size;
}

const stayTotal = (cat: PublicCategory, checkIn: string, checkOut: string) => {
  let total = 0;
  for (let d = parseISO(checkIn); format(d, 'yyyy-MM-dd') < checkOut; d = addDays(d, 1)) {
    total += priceFor(cat, format(d, 'yyyy-MM-dd'));
  }
  return total;
};

/* ================================================================
   Sequência de frames (vídeo da pousada convertido em imagens),
   pré-carregada e desenhada num <canvas> conforme o progresso do scroll.
   ================================================================ */
const HERO_FRAME_COUNT = 32;
const heroFramePath = (i: number) => `/booking-scroll/frame-${String(i).padStart(3, '0')}.webp`;

function useFrameSequence(frameCount: number, framePath: (i: number) => string) {
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [firstFrameLoaded, setFirstFrameLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const images: HTMLImageElement[] = [];
    for (let i = 1; i <= frameCount; i++) {
      const img = new Image();
      // Prioriza os primeiros frames (visíveis logo de cara); o resto carrega em segundo plano.
      img.fetchPriority = i <= 4 ? 'high' : 'low';
      img.decoding = 'async';
      img.src = framePath(i);
      if (i === 1) img.onload = () => !cancelled && setFirstFrameLoaded(true);
      images.push(img);
    }
    imagesRef.current = images;
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameCount]);

  return { imagesRef, firstFrameLoaded };
}

/* ================================================================
   Hero cinematográfico: sequência de frames (vídeo) conduzida pelo scroll
   ================================================================ */
function CinematicHero({ tenant, roomPhoto, onReserve }: { tenant: Tenant; roomPhoto?: string; onReserve: () => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { imagesRef, firstFrameLoaded } = useFrameSequence(HERO_FRAME_COUNT, heroFramePath);
  const [p, setP] = useState(0); // progresso 0..1 dentro do trilho

  const drawFrame = (progress: number) => {
    const canvas = canvasRef.current;
    const idx = Math.min(HERO_FRAME_COUNT - 1, Math.max(0, Math.floor(progress * HERO_FRAME_COUNT)));
    const img = imagesRef.current[idx];
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    if (cw === 0 || ch === 0) return;
    const targetW = Math.round(cw * dpr);
    const targetH = Math.round(ch * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = cw / ch;
    let drawW: number, drawH: number, dx: number, dy: number;
    if (imgRatio > canvasRatio) {
      drawH = ch;
      drawW = ch * imgRatio;
      dx = (cw - drawW) / 2;
      dy = 0;
    } else {
      drawW = cw;
      drawH = cw / imgRatio;
      dx = 0;
      dy = (ch - drawH) / 2;
    }
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, drawW, drawH);
  };

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = trackRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const total = el.offsetHeight - window.innerHeight;
        const progress = Math.min(1, Math.max(0, -rect.top / Math.max(total, 1)));
        setP(progress);
        drawFrame(progress);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstFrameLoaded]);

  // Fases: 0–0.3 vista distante · 0.3–0.7 voo de aproximação · 0.7–1 "entrando" (foto do quarto)
  const fade2 = Math.min(1, Math.max(0, (p - 0.72) / 0.22)); // camada interna
  const t1 = 1 - Math.min(1, p / 0.22); // título
  const t2 = p > 0.26 && p < 0.62 ? Math.min(1, (p - 0.26) / 0.12) * (1 - Math.max(0, (p - 0.5) / 0.12)) : 0; // localização
  const t3 = Math.min(1, Math.max(0, (p - 0.78) / 0.18)); // convite final

  return (
    <div ref={trackRef} style={{ height: '280vh' }} className="relative">
      <div className="sticky top-0 h-dvh overflow-hidden bg-slate-900">
        {/* Camada 1: sequência de frames do vídeo, controlada pelo scroll */}
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        {!firstFrameLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          </div>
        )}

        {/* Camada 2: interior (revela no final, como se entrasse) */}
        {roomPhoto && (
          <img
            src={roomPhoto}
            alt=""
            className="absolute inset-0 h-full w-full object-cover will-change-transform"
            style={{ opacity: fade2, transform: `scale(${1.35 - fade2 * 0.35})`, filter: 'brightness(0.75)' }}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-transparent to-slate-900/60" />

        {/* Textos por fase */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
          <div style={{ opacity: t1, transform: `translateY(${(1 - t1) * -22}px)` }}>
            {tenant.logoUrl && <img src={tenant.logoUrl} alt="" className="mx-auto mb-4 h-20 w-20 rounded-3xl object-cover shadow-2xl" />}
            <h1 className="text-4xl font-extrabold drop-shadow-lg sm:text-6xl">{tenant.name}</h1>
            {tenant.description && <p className="mx-auto mt-3 max-w-xl text-sm text-white/85 drop-shadow sm:text-lg">{tenant.description}</p>}
          </div>
          <div className="absolute" style={{ opacity: t2, transform: `scale(${0.92 + t2 * 0.08})` }}>
            <MapPin size={36} className="mx-auto mb-3 text-brand-300 drop-shadow" />
            <p className="text-2xl font-extrabold drop-shadow sm:text-4xl">Um refúgio esperando por você</p>
            {tenant.address && <p className="mt-2 text-sm text-white/85 drop-shadow sm:text-base">📍 {tenant.address}</p>}
          </div>
          <div className="absolute" style={{ opacity: t3, transform: `translateY(${(1 - t3) * 26}px)` }}>
            <p className="text-3xl font-extrabold drop-shadow sm:text-5xl">Entre. Sinta-se em casa. 🌺</p>
            <button
              onClick={onReserve}
              className="mt-6 rounded-2xl bg-white px-8 py-4 text-base font-extrabold text-slate-900 shadow-2xl transition hover:scale-105 cursor-pointer"
            >
              Reservar agora
            </button>
          </div>
        </div>

        {/* Indicador de scroll */}
        <div className="absolute inset-x-0 bottom-6 flex justify-center" style={{ opacity: 1 - p * 2.4 }}>
          <div className="flex flex-col items-center gap-1 text-white/80">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em]">Deslize para entrar</span>
            <ChevronDown size={22} className="animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   Calendário mensal do quarto (preços + disponibilidade + seleção)
   ================================================================ */
function RoomCalendar({ cat, availability, range, onPick }: {
  cat: PublicCategory;
  availability: PublicAvailability | null;
  range: { checkIn: string; checkOut: string } | null;
  onPick: (iso: string) => void;
}) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const today = todayISO();

  const cells = useMemo(() => {
    const first = startOfMonth(month);
    const start = addDays(first, -first.getDay());
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [month]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <button onClick={() => setMonth(subMonths(month, 1))} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer" disabled={isBefore(endOfMonth(subMonths(month, 1)), startOfDay(new Date()))}>
          <ChevronLeft size={17} />
        </button>
        <p className="text-sm font-extrabold capitalize text-slate-800">{format(month, 'MMMM yyyy', { locale: ptBR })}</p>
        <button onClick={() => setMonth(addMonths(month, 1))} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer">
          <ChevronRight size={17} />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
          <span key={i} className="pb-1 text-[10px] font-bold uppercase text-slate-400">{d}</span>
        ))}
        {cells.map((d) => {
          const iso = format(d, 'yyyy-MM-dd');
          const inMonth = d.getMonth() === month.getMonth();
          const past = iso < today;
          const free = freeRooms(cat, availability, iso, format(addDays(d, 1), 'yyyy-MM-dd')) > 0;
          const price = priceFor(cat, iso);
          const isStart = range?.checkIn === iso;
          const isEnd = range?.checkOut === iso;
          const inRange = range && range.checkOut ? iso > range.checkIn && iso < range.checkOut : false;
          const selectable = inMonth && !past && free;
          return (
            <button
              key={iso}
              disabled={!selectable}
              onClick={() => onPick(iso)}
              className={cn(
                'flex h-12 flex-col items-center justify-center rounded-lg text-[11px] transition sm:h-14',
                !inMonth && 'invisible',
                past || !free ? 'cursor-not-allowed text-slate-300' : 'cursor-pointer hover:bg-brand-50',
                !past && !free && inMonth && 'bg-slate-50 line-through',
                inRange && 'bg-brand-100',
                (isStart || isEnd) && 'bg-brand-700 font-bold text-white hover:bg-brand-700'
              )}
            >
              <span className="font-bold">{format(d, 'd')}</span>
              {selectable && <span className={cn('text-[8px] font-semibold sm:text-[9px]', isStart || isEnd ? 'text-white/85' : 'text-slate-400')}>{brl(price).replace(',00', '')}</span>}
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-center text-[10px] text-slate-400">Toque na data de chegada e depois na de saída · riscado = indisponível</p>
    </div>
  );
}

/* ================================================================
   Página principal do site
   ================================================================ */
export default function PublicSitePage() {
  const { slug } = useParams();
  const { tenant, categories, availability, status } = usePublicTenant(slug);

  const [roomModal, setRoomModal] = useState<PublicCategory | null>(null);
  const [roomPhotoIdx, setRoomPhotoIdx] = useState(0);
  const [roomRange, setRoomRange] = useState<{ checkIn: string; checkOut: string } | null>(null);
  const [bookOpen, setBookOpen] = useState(false);
  const [bookCat, setBookCat] = useState<PublicCategory | null>(null);
  const [search, setSearch] = useState({ checkIn: todayISO(), checkOut: format(addDays(new Date(), 1), 'yyyy-MM-dd') });
  const [showNav, setShowNav] = useState(false);
  const roomsRef = useRef<HTMLDivElement>(null);

  const [guest, setGuest] = useState({ name: '', phone: '', email: '', adults: 2, children: 0, notes: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowNav(window.scrollY > window.innerHeight * 1.8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const openBooking = (cat: PublicCategory | null, range?: { checkIn: string; checkOut: string } | null) => {
    setBookCat(cat);
    if (range?.checkIn && range?.checkOut) setSearch({ checkIn: range.checkIn, checkOut: range.checkOut });
    setSent(false);
    setBookOpen(true);
  };

  const scrollToRooms = () => roomsRef.current?.scrollIntoView({ behavior: 'smooth' });

  const searchValid = search.checkOut > search.checkIn;
  const results = useMemo(
    () =>
      categories.map((c) => ({
        ...c,
        free: searchValid ? freeRooms(c, availability, search.checkIn, search.checkOut) : c.roomIds.length,
        total: searchValid ? stayTotal(c, search.checkIn, search.checkOut) : 0,
      })),
    [categories, availability, search, searchValid]
  );

  const submit = async () => {
    if (!tenant) return;
    if (guest.name.trim().length < 2) return toast.error('Informe seu nome completo.');
    if (guest.phone.trim().length < 8) return toast.error('Informe um telefone válido — é por ele que confirmamos sua reserva.');
    if (!searchValid) return toast.error('Confira as datas escolhidas.');
    setSending(true);
    try {
      await addDoc(collection(db, 'tenants', tenant.id, 'bookingRequests'), {
        guestName: guest.name.trim().slice(0, 119),
        guestPhone: guest.phone.trim().slice(0, 39),
        guestEmail: guest.email.trim(),
        categoryId: bookCat?.id ?? null,
        checkIn: search.checkIn,
        checkOut: search.checkOut,
        adults: guest.adults,
        children: guest.children,
        notes: guest.notes.trim().slice(0, 500),
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      setSent(true);
    } catch {
      toast.error('Não foi possível enviar. Verifique sua conexão e tente novamente.');
    } finally {
      setSending(false);
    }
  };

  if (status === 'loading') {
    return <div className="flex min-h-dvh items-center justify-center bg-slate-900"><Loader2 className="animate-spin text-brand-400" size={36} /></div>;
  }
  if (status === 'not-found' || !tenant || !tenant.publicBookingEnabled) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50 p-6 text-center">
        <div>
          <p className="text-4xl">🏝️</p>
          <h1 className="mt-2 text-xl font-bold text-slate-800">Página não disponível</h1>
          <p className="mt-1 text-sm text-slate-500">Esta pousada não está com reservas online ativas no momento.</p>
        </div>
      </div>
    );
  }

  const firstRoomPhoto = categories.flatMap((c) => c.photos ?? [])[0];
  const nightsCount = searchValid ? nights(search.checkIn, search.checkOut) : 0;
  const roomNights = roomRange?.checkOut ? nights(roomRange.checkIn, roomRange.checkOut) : 0;

  const Chip = ({ icon: Icon, children }: { icon: typeof Wifi; children: ReactNode }) => (
    <span className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-100">
      <Icon size={14} className="text-brand-600" /> {children}
    </span>
  );

  return (
    <div className="min-h-dvh scroll-smooth bg-slate-50">
      {/* Barra fixa (aparece após o hero) */}
      <nav
        className={cn(
          'fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-white/85 px-4 py-3 shadow-sm backdrop-blur transition-all duration-300 sm:px-8',
          showNav ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        )}
      >
        <span className="truncate text-sm font-extrabold text-slate-900 sm:text-base">{tenant.name}</span>
        <div className="flex items-center gap-2">
          <button onClick={scrollToRooms} className="hidden text-xs font-bold text-slate-500 hover:text-slate-800 sm:block cursor-pointer">Quartos</button>
          <button onClick={() => openBooking(null)} className="rounded-xl bg-brand-700 px-4 py-2 text-xs font-extrabold text-white shadow-sm transition hover:bg-brand-800 cursor-pointer">
            Reservar
          </button>
        </div>
      </nav>

      {/* ===== Hero cinematográfico ===== */}
      <CinematicHero tenant={tenant} roomPhoto={firstRoomPhoto} onReserve={scrollToRooms} />

      {/* ===== Comodidades ===== */}
      <section className="mx-auto max-w-4xl px-4 py-12 text-center">
        <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Sua estadia com todo o conforto</h2>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {tenant.wifiSsid && <Chip icon={Wifi}>Wi-Fi grátis</Chip>}
          {tenant.breakfastTime && <Chip icon={Coffee}>Café da manhã {tenant.breakfastTime}</Chip>}
          {tenant.checkinTime && <Chip icon={CalendarDays}>Check-in {tenant.checkinTime}</Chip>}
          {(tenant.amenities ?? []).map((a) => <Chip key={a} icon={BedDouble}>{a}</Chip>)}
        </div>
      </section>

      {/* ===== Busca por datas ===== */}
      <section className="mx-auto max-w-3xl px-4">
        <div className="rounded-3xl bg-white p-5 shadow-xl ring-1 ring-slate-100">
          <h3 className="mb-3 flex items-center gap-2 font-extrabold text-slate-800"><Search size={18} className="text-brand-600" /> Encontre suas datas</h3>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Check-in</span>
              <input type="date" min={todayISO()} value={search.checkIn} onChange={(e) => setSearch((s) => ({ ...s, checkIn: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Check-out</span>
              <input type="date" min={search.checkIn} value={search.checkOut} onChange={(e) => setSearch((s) => ({ ...s, checkOut: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
            </label>
          </div>
          {searchValid && (
            <p className="mt-2 text-center text-xs font-semibold text-slate-400">
              {nightsCount} noite(s) · preços já calculados abaixo 👇
            </p>
          )}
        </div>
      </section>

      {/* ===== Quartos ===== */}
      <section ref={roomsRef} className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="text-center text-2xl font-extrabold text-slate-900 sm:text-3xl">Nossas acomodações</h2>
        <p className="mt-1 text-center text-sm text-slate-500">Toque em um quarto para ver fotos, calendário e preços</p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {results.map((cat) => (
            <article
              key={cat.id}
              onClick={() => { setRoomModal(cat); setRoomPhotoIdx(0); setRoomRange(null); }}
              className="group cursor-pointer overflow-hidden rounded-3xl bg-white shadow-md ring-1 ring-slate-100 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative h-56 overflow-hidden">
                {cat.photos?.[0] ? (
                  <img src={cat.photos[0]} alt={cat.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-slate-100 text-slate-300"><BedDouble size={40} /></div>
                )}
                {(cat.photos?.length ?? 0) > 1 && (
                  <span className="absolute bottom-3 left-3 rounded-full bg-slate-900/60 px-2.5 py-1 text-[11px] font-bold text-white">📷 {cat.photos!.length} fotos</span>
                )}
                <span className={cn('absolute right-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold shadow', cat.free > 0 ? 'bg-white/95 text-emerald-700' : 'bg-white/95 text-red-500')}>
                  {cat.free > 0 ? (searchValid ? `Disponível nas suas datas` : `${cat.free} quarto(s)`) : 'Esgotado nas datas'}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3 p-5">
                <div className="min-w-0">
                  <h3 className="text-lg font-extrabold text-slate-900">{cat.name}</h3>
                  {cat.description && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{cat.description}</p>}
                  <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-slate-400"><Users size={13} /> até {cat.maxGuests} hóspedes</p>
                </div>
                <div className="shrink-0 text-right">
                  {searchValid && cat.free > 0 ? (
                    <>
                      <p className="text-xl font-extrabold text-brand-800">{brl(cat.total)}</p>
                      <p className="text-[11px] text-slate-400">{nightsCount} noite(s)</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xl font-extrabold text-brand-800">{brl(cat.basePrice)}</p>
                      <p className="text-[11px] text-slate-400">por noite</p>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ===== Localização & contato ===== */}
      <section className="bg-slate-900 px-4 py-14 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Como chegar</h2>
          {tenant.address && (
            <>
              <p className="mt-3 flex items-center justify-center gap-2 text-sm text-white/80"><MapPin size={16} className="text-brand-400" /> {tenant.address}</p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${tenant.name} ${tenant.address}`)}`}
                target="_blank" rel="noreferrer"
                className="mt-4 inline-block rounded-xl bg-white/10 px-5 py-2.5 text-sm font-bold backdrop-blur transition hover:bg-white/20"
              >
                🗺️ Abrir no Google Maps
              </a>
            </>
          )}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
            {tenant.phone && <a href={`tel:${tenant.phone}`} className="flex items-center gap-1.5 text-white/70 hover:text-white"><Phone size={15} /> {tenant.phone}</a>}
            {tenant.whatsappNumber && (
              <a href={`https://wa.me/${tenant.whatsappNumber}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 font-bold text-white transition hover:bg-emerald-600">
                <MessageCircle size={15} /> WhatsApp
              </a>
            )}
          </div>
          <p className="mt-10 text-[11px] text-white/30">© {new Date().getFullYear()} {tenant.name} · Reservas online por PousadaGest</p>
        </div>
      </section>

      {/* ===== Modal: detalhes do quarto ===== */}
      {roomModal && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setRoomModal(null)}>
          <div onClick={(e) => e.stopPropagation()} className="flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl">
            {/* Galeria */}
            <div className="relative h-60 shrink-0 bg-slate-100 sm:h-72">
              {roomModal.photos?.[roomPhotoIdx] ? (
                <img src={roomModal.photos[roomPhotoIdx]} alt={roomModal.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-300"><BedDouble size={48} /></div>
              )}
              <button onClick={() => setRoomModal(null)} className="absolute right-3 top-3 rounded-full bg-slate-900/50 p-2 text-white backdrop-blur hover:bg-slate-900/70 cursor-pointer"><X size={18} /></button>
              {(roomModal.photos?.length ?? 0) > 1 && (
                <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5 overflow-x-auto px-3">
                  {roomModal.photos!.map((ph, i) => (
                    <img key={i} src={ph} alt="" onClick={() => setRoomPhotoIdx(i)} className={cn('h-11 w-14 shrink-0 cursor-pointer rounded-lg object-cover shadow', i === roomPhotoIdx ? 'ring-2 ring-white' : 'opacity-60 hover:opacity-100')} />
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">{roomModal.name}</h3>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-400">
                    <span className="flex items-center gap-1"><Users size={13} /> até {roomModal.maxGuests} hóspedes</span>
                    {roomModal.beds && roomModal.beds.double > 0 && <span>🛏️ {roomModal.beds.double} cama(s) de casal</span>}
                    {roomModal.beds && roomModal.beds.single > 0 && <span>🛌 {roomModal.beds.single} de solteiro</span>}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xl font-extrabold text-brand-800">{brl(roomModal.basePrice)}</p>
                  <p className="text-[11px] text-slate-400">a partir de / noite</p>
                </div>
              </div>
              {roomModal.description && <p className="text-sm leading-relaxed text-slate-600">{roomModal.description}</p>}

              {/* Calendário do quarto */}
              <RoomCalendar
                cat={roomModal}
                availability={availability}
                range={roomRange}
                onPick={(iso) => {
                  if (!roomRange || roomRange.checkOut || iso <= roomRange.checkIn) setRoomRange({ checkIn: iso, checkOut: '' });
                  else setRoomRange({ ...roomRange, checkOut: iso });
                }}
              />

              {roomRange?.checkOut && (
                <div className="flex items-center justify-between rounded-2xl bg-brand-50 px-4 py-3">
                  <div className="text-sm">
                    <p className="font-bold text-slate-800">{format(parseISO(roomRange.checkIn), 'dd/MM')} → {format(parseISO(roomRange.checkOut), 'dd/MM')} · {roomNights} noite(s)</p>
                    <p className="text-xs text-slate-500">Total estimado: <strong className="text-brand-800">{brl(stayTotal(roomModal, roomRange.checkIn, roomRange.checkOut))}</strong></p>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 p-4 safe-bottom">
              <button
                onClick={() => { setRoomModal(null); openBooking(roomModal, roomRange?.checkOut ? roomRange : null); }}
                className="w-full rounded-2xl bg-brand-700 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:bg-brand-800 cursor-pointer"
              >
                {roomRange?.checkOut ? `Reservar ${roomNights} noite(s) — ${brl(stayTotal(roomModal, roomRange.checkIn, roomRange.checkOut))}` : 'Solicitar reserva'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Modal: solicitar reserva ===== */}
      {bookOpen && (
        <div className="fixed inset-0 z-[95] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setBookOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="flex max-h-[94dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl">
            {sent ? (
              <div className="p-8 text-center">
                <CalendarCheck size={52} className="mx-auto text-emerald-500" />
                <h3 className="mt-4 text-xl font-extrabold text-slate-900">Pedido enviado! 🎉</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  Recebemos sua solicitação, <strong>{guest.name.split(' ')[0]}</strong>. A equipe da {tenant.name} vai analisar e você receberá a
                  <strong> confirmação da reserva pelo telefone {guest.phone}</strong> em breve. 📲
                </p>
                {tenant.whatsappNumber && (
                  <a
                    href={`https://wa.me/${tenant.whatsappNumber}?text=${encodeURIComponent(`Olá! Acabei de solicitar uma reserva no site em nome de ${guest.name} (${format(parseISO(search.checkIn), 'dd/MM')} a ${format(parseISO(search.checkOut), 'dd/MM')}).`)}`}
                    target="_blank" rel="noreferrer"
                    className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-extrabold text-white shadow-md hover:bg-emerald-600"
                  >
                    <MessageCircle size={16} /> Adiantar pelo WhatsApp
                  </a>
                )}
                <button onClick={() => setBookOpen(false)} className="mt-4 block w-full text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer">Fechar</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <h3 className="font-extrabold text-slate-900">Solicitar reserva{bookCat ? ` — ${bookCat.name}` : ''}</h3>
                  <button onClick={() => setBookOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer"><X size={18} /></button>
                </div>
                <div className="flex-1 space-y-3.5 overflow-y-auto p-5">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-bold uppercase text-slate-400">Check-in</span>
                      <input type="date" min={todayISO()} value={search.checkIn} onChange={(e) => setSearch((s) => ({ ...s, checkIn: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-bold uppercase text-slate-400">Check-out</span>
                      <input type="date" min={search.checkIn} value={search.checkOut} onChange={(e) => setSearch((s) => ({ ...s, checkOut: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" />
                    </label>
                  </div>
                  {bookCat && searchValid && (
                    <p className="rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-800">
                      {nightsCount} noite(s) em {bookCat.name} · estimativa {brl(stayTotal(bookCat, search.checkIn, search.checkOut))} — valor final confirmado pela pousada.
                    </p>
                  )}
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-bold uppercase text-slate-400">Seu nome *</span>
                    <input value={guest.name} onChange={(e) => setGuest((g) => ({ ...g, name: e.target.value }))} placeholder="Nome completo" className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-bold uppercase text-slate-400">Telefone / WhatsApp * <span className="normal-case text-slate-300">(é por ele que confirmamos)</span></span>
                    <input value={guest.phone} onChange={(e) => setGuest((g) => ({ ...g, phone: e.target.value }))} placeholder="(00) 90000-0000" inputMode="tel" className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-bold uppercase text-slate-400">E-mail (opcional)</span>
                    <input type="email" value={guest.email} onChange={(e) => setGuest((g) => ({ ...g, email: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-bold uppercase text-slate-400">Adultos</span>
                      <input type="number" min={1} value={guest.adults} onChange={(e) => setGuest((g) => ({ ...g, adults: Number(e.target.value) }))} className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-bold uppercase text-slate-400">Crianças</span>
                      <input type="number" min={0} value={guest.children} onChange={(e) => setGuest((g) => ({ ...g, children: Number(e.target.value) }))} className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" />
                    </label>
                  </div>
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-bold uppercase text-slate-400">Observações</span>
                    <textarea value={guest.notes} onChange={(e) => setGuest((g) => ({ ...g, notes: e.target.value }))} placeholder="Horário de chegada, pedidos especiais…" className="min-h-20 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                  </label>
                </div>
                <div className="border-t border-slate-100 p-4 safe-bottom">
                  <button onClick={submit} disabled={sending} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-700 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:bg-brand-800 disabled:opacity-60 cursor-pointer">
                    {sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={16} />} Enviar pedido de reserva
                  </button>
                  <p className="mt-2 text-center text-[10px] text-slate-400">Sem pagamento agora · você recebe a confirmação no telefone informado 🔒</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
