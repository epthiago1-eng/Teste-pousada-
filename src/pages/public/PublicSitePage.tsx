import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { addDays, format } from 'date-fns';
import {
  ArrowLeft, BedDouble, Building2, CalendarDays, Check, ChevronDown, ChevronRight, Coffee, Home,
  Loader2, MapPin, MessageCircle, Navigation, Phone, Search, Users, Wifi,
} from 'lucide-react';
import { usePublicTenant, type PublicCategory } from './usePublicTenant';
import type { Tenant } from '../../types';
import { BookingSheet } from './BookingSheet';
import { freeRooms, priceFrom, stayTotal } from './publicPricing';
import { brl, cn, nights, todayISO, waPhone } from '../../lib/utils';

/* ================================================================
   Sequência de frames (vídeo da pousada convertido em imagens),
   pré-carregada e desenhada num <canvas> conforme o progresso do scroll.
   ================================================================ */
const HERO_FRAME_COUNT = 65;
/**
 * Fração do scroll em que a sequência chega ao último frame. O trecho restante
 * segura esse frame — a fachada da pousada, onde o vídeo termina — para dar
 * tempo de olhar antes de a foto do quarto entrar.
 */
const HERO_FRAMES_END = 0.7;
const frameName = (i: number) => `frame-${String(i).padStart(3, '0')}`;
/**
 * Duas qualidades do mesmo vídeo. A escolha é feita em runtime (ver `decideTier`):
 * `hd` 1600x900 (~53KB/frame) para conexões folgadas em telas grandes,
 * `sd` 1024x576 (~28KB/frame) no resto. `webp` só socorre navegadores sem AVIF.
 */
const heroTiers = {
  hd: (i: number) => `/booking-scroll/hd/${frameName(i)}.avif`,
  sd: (i: number) => `/booking-scroll/${frameName(i)}.avif`,
  webp: (i: number) => `/booking-scroll/${frameName(i)}.webp`,
};
type HeroTier = 'hd' | 'sd';

/** Banda mínima estimada para valer a pena puxar a sequência HD (~3,4MB). */
const HD_MIN_MBPS = 4;

/** Mbps estimados a partir do download já feito de `url`; null se não dá para medir. */
function measuredMbps(url: string): number | null {
  const entry = performance.getEntriesByName(url).pop() as PerformanceResourceTiming | undefined;
  if (!entry || !entry.duration || !entry.transferSize) return null; // sem dado ou veio do cache
  return (entry.transferSize * 8) / (entry.duration * 1000);
}

/**
 * Escolhe a qualidade da sequência: respeita economia de dados, evita gastar
 * banda com HD em tela pequena (onde não aparece nitidez) e, quando o navegador
 * expõe a informação, usa a velocidade real medida no primeiro frame.
 */
function decideTier(probeUrl: string): HeroTier {
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (conn?.saveData) return 'sd';
  if (conn?.effectiveType && ['slow-2g', '2g', '3g'].includes(conn.effectiveType)) return 'sd';
  if (window.innerWidth * Math.min(window.devicePixelRatio || 1, 2) < 1100) return 'sd';
  const mbps = measuredMbps(probeUrl);
  return mbps !== null && mbps < HD_MIN_MBPS ? 'sd' : 'hd';
}

/** Imagem já pronta para desenhar? */
const frameReady = (img?: HTMLImageElement) => Boolean(img && img.complete && img.naturalWidth > 0);

/** O frame `idx` se já carregou; senão, o carregado mais próximo dele (antes ou depois). */
function nearestLoaded(images: HTMLImageElement[], idx: number): HTMLImageElement | null {
  if (frameReady(images[idx])) return images[idx];
  for (let d = 1; d < images.length; d++) {
    if (frameReady(images[idx - d])) return images[idx - d];
    if (frameReady(images[idx + d])) return images[idx + d];
  }
  return null;
}

function useFrameSequence(frameCount: number) {
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [firstFrameLoaded, setFirstFrameLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const images: HTMLImageElement[] = new Array(frameCount);
    imagesRef.current = images;

    const load = (i: number, url: string) => {
      const img = new Image();
      // Prioriza os primeiros frames (visíveis logo de cara); o resto carrega em segundo plano.
      img.fetchPriority = i <= 4 ? 'high' : 'low';
      img.decoding = 'async';
      // AVIF é bem mais leve; se o navegador não suportar, cai pro WebP automaticamente.
      img.onerror = () => {
        if (img.src.endsWith('.avif')) img.src = heroTiers.webp(i);
      };
      img.src = url;
      return img;
    };

    // O primeiro frame vem sempre na versão leve: pinta a tela quase de imediato
    // e serve de sonda para medir a banda antes de comprometer o resto.
    const probeUrl = heroTiers.sd(1);
    const probe = load(1, probeUrl);
    images[0] = probe;

    probe.onload = () => {
      if (cancelled) return;
      setFirstFrameLoaded(true);
      // Se a sonda caiu pro WebP, o navegador não lê AVIF — não adianta pedir HD.
      const tier: HeroTier = probe.src.endsWith('.webp') ? 'sd' : decideTier(probeUrl);
      for (let i = 2; i <= frameCount; i++) images[i - 1] = load(i, heroTiers[tier](i));
      if (tier === 'hd') {
        // Repõe o frame 1 em HD, trocando só quando chegar para não piscar.
        const hd = load(1, heroTiers.hd(1));
        hd.onload = () => { if (!cancelled) images[0] = hd; };
      }
    };

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
  const { imagesRef, firstFrameLoaded } = useFrameSequence(HERO_FRAME_COUNT);
  const [p, setP] = useState(0); // progresso 0..1 dentro do trilho

  const drawFrame = (progress: number) => {
    const canvas = canvasRef.current;
    const seq = Math.min(1, progress / HERO_FRAMES_END);
    const idx = Math.min(HERO_FRAME_COUNT - 1, Math.max(0, Math.round(seq * (HERO_FRAME_COUNT - 1))));
    // Enquanto a sequência ainda está baixando, usa o frame carregado mais próximo:
    // assim a animação já acompanha o scroll em vez de congelar num quadro antigo.
    const img = nearestLoaded(imagesRef.current, idx);
    if (!canvas || !img) return;
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

  // Fases: 0–0.3 vista distante · 0.3–0.7 voo de aproximação · 0.7–0.9 a pousada em tela
  // cheia (último frame segurado, com o convite já legível) · 0.9–1 "entrando" (foto do quarto)
  const fade2 = Math.min(1, Math.max(0, (p - 0.9) / 0.1)); // camada interna
  // A baleia domina o quadro ate por volta do frame 26 de 65 (0.28 do trilho): a
  // legenda fica firme enquanto isso e some junto com a virada da camera.
  const t1 = 1 - Math.min(1, Math.max(0, (p - 0.12) / 0.15)); // legenda do monumento
  // A fachada da pousada se firma por volta do frame 40 de 65 — ou seja, em 0.44 do
  // trilho — e é aí que a apresentação da pousada entra. Entre 0.22 e 0.44 o voo
  // atravessa as palmeiras sem texto competindo com a imagem.
  // Entra junto com a fachada: comeca a surgir quando ela desponta (frame ~35) e
  // esta inteira quando a camera assenta nela (frame ~42).
  const t3 = Math.min(1, Math.max(0, (p - 0.38) / 0.08)); // apresentação da pousada

  return (
    <div ref={trackRef} style={{ height: '320vh' }} className="relative">
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
          {/* Abertura: legenda do monumento, sobre a tomada da baleia */}
          <div style={{ opacity: t1, transform: `translateY(${(1 - t1) * -22}px)` }}>
            <MapPin size={32} className="mx-auto mb-3 text-brand-300 drop-shadow" />
            <h1 className="text-3xl italic text-white drop-shadow-lg sm:text-5xl" style={{ fontFamily: "'Playfair Display', serif" }}>
              Em frente à Praça da Baleia 🐋
            </h1>
            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.25em] text-white/75 drop-shadow sm:text-base">
              O monumento mais famoso da cidade
            </p>
          </div>
          {/* Chegada: a fachada entra em cena e a pousada se apresenta */}
          <div className="absolute" style={{ opacity: t3, transform: `translateY(${(1 - t3) * 26}px)` }}>
            {tenant.logoUrl && <img src={tenant.logoUrl} alt="" className="mx-auto mb-4 h-16 w-16 rounded-2xl object-cover shadow-2xl sm:h-20 sm:w-20" />}
            <p className="text-4xl italic text-white drop-shadow-lg sm:text-7xl" style={{ fontFamily: "'Playfair Display', serif" }}>{tenant.name}</p>
            <p className="mt-3 text-xl font-bold drop-shadow sm:text-3xl">Seja bem-vindo</p>
            <p className="mt-1.5 text-sm text-white/85 drop-shadow sm:text-lg">Seu refúgio de Rio das Ostras</p>
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
   Peças da vitrine
   ================================================================ */
function Chip({ icon: Icon, children }: { icon: typeof Wifi; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-100">
      <Icon size={14} className="text-brand-600" /> {children}
    </span>
  );
}

/**
 * Foto com rede de segurança: se a URL falhar (foto removida do storage, link
 * quebrado), mostra o lugar-guardado em vez do ícone de imagem quebrada.
 */
function Photo({ src, alt, className, emojiClass }: { src?: string; alt: string; className?: string; emojiClass?: string }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <span className={cn('flex items-center justify-center bg-slate-100 text-slate-300', className, emojiClass)}>🛏️</span>
    );
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setBroken(true)} className={className} />;
}

/** Cartão de acomodação. `stay` só aparece depois de uma busca por datas. */
function RoomCard({ cat, stay, onOpen }: {
  cat: PublicCategory;
  stay: { nights: number; total: number; free: number } | null;
  onOpen: () => void;
}) {
  const soldOut = stay !== null && stay.free <= 0;
  return (
    <article
      onClick={onOpen}
      className={cn(
        'group cursor-pointer overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg',
        soldOut && 'opacity-60'
      )}
    >
      <div className="flex gap-3 p-3">
        <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
          <Photo
            src={cat.photos?.[0]}
            alt={cat.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            emojiClass="text-2xl"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="truncate font-extrabold text-slate-800">{cat.name}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
            <Users size={12} className="text-slate-400" /> {cat.maxGuests} hóspede{cat.maxGuests === 1 ? '' : 's'}
            {cat.beds && (cat.beds.double + cat.beds.single > 0) && (
              <> · {cat.beds.double ? `${cat.beds.double} casal` : ''}{cat.beds.double && cat.beds.single ? ' + ' : ''}{cat.beds.single ? `${cat.beds.single} solteiro` : ''}</>
            )}
          </p>

          <div className="mt-auto flex items-end justify-between gap-2">
            {stay ? (
              soldOut ? (
                <span className="text-xs font-bold text-rose-500">Sem disponibilidade</span>
              ) : (
                <span className="text-xs font-semibold text-emerald-600">
                  {stay.free} {stay.free === 1 ? 'disponível' : 'disponíveis'}
                </span>
              )
            ) : (
              <span className="text-[11px] text-slate-400">A partir de</span>
            )}
            <span className="shrink-0 text-right">
              <span className="text-base font-extrabold text-slate-900">{brl(stay && !soldOut ? stay.total : priceFrom(cat))}</span>
              <span className="block text-[10px] font-semibold text-slate-400">
                {stay && !soldOut ? `${stay.nights} noite${stay.nights === 1 ? '' : 's'}` : '/ noite'}
              </span>
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ================================================================
   Detalhe da acomodação (fotos, o que tem, e a porta pro calendário)
   ================================================================ */
function RoomDetail({ tenant, cat, onBook, onClose }: {
  tenant: Tenant;
  cat: PublicCategory;
  onBook: () => void;
  onClose: () => void;
}) {
  const photos = cat.photos ?? [];
  const [idx, setIdx] = useState(0);
  // Miniatura que não carrega sai da fita — não faz sentido oferecer para clicar.
  const [brokenThumbs, setBrokenThumbs] = useState<Set<number>>(new Set());

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-slate-50">
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <button type="button" onClick={onClose} className="rounded-xl p-1.5 text-slate-500 transition hover:bg-slate-100 cursor-pointer" aria-label="Voltar">
          <ArrowLeft size={20} />
        </button>
        <p className="flex-1 truncate text-center text-sm font-extrabold text-slate-800">{cat.name}</p>
        <span className="w-8" />
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-lg pb-6">
          {/* Foto principal + miniaturas */}
          <div className="relative aspect-[4/3] w-full bg-slate-200">
            <Photo src={photos[idx]} alt={cat.name} className="h-full w-full object-cover" emojiClass="text-5xl" />
            {photos.length > 1 && (
              <span className="absolute bottom-3 right-3 rounded-full bg-slate-900/60 px-2.5 py-1 text-[11px] font-bold text-white">
                {idx + 1}/{photos.length}
              </span>
            )}
          </div>
          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto px-4 py-3">
              {photos.map((p, i) =>
                brokenThumbs.has(i) ? null : (
                  <img
                    key={i}
                    src={p}
                    alt=""
                    onClick={() => setIdx(i)}
                    onError={() => setBrokenThumbs((s) => new Set(s).add(i))}
                    className={cn(
                      'h-16 w-20 shrink-0 cursor-pointer rounded-xl object-cover transition',
                      i === idx ? 'ring-2 ring-brand-600' : 'opacity-70 hover:opacity-100'
                    )}
                  />
                )
              )}
            </div>
          )}

          <div className="space-y-3 px-4 pt-1">
            {/* Ficha rápida */}
            <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <h2 className="text-lg font-extrabold text-slate-900">{cat.name}</h2>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                <span className="flex items-center gap-1.5"><Users size={15} className="text-brand-600" /> {cat.maxGuests} hóspede{cat.maxGuests === 1 ? '' : 's'}</span>
                {cat.beds?.double ? <span className="flex items-center gap-1.5"><BedDouble size={15} className="text-brand-600" /> {cat.beds.double} cama{cat.beds.double === 1 ? '' : 's'} de casal</span> : null}
                {cat.beds?.single ? <span className="flex items-center gap-1.5"><BedDouble size={15} className="text-brand-600" /> {cat.beds.single} de solteiro</span> : null}
              </div>
              {cat.description && <p className="mt-3 border-t border-slate-100 pt-3 text-sm leading-relaxed text-slate-600">{cat.description}</p>}
            </div>

            {/* Comodidades da pousada (valem para todas as acomodações) */}
            {((tenant.amenities?.length ?? 0) > 0 || tenant.wifiSsid || tenant.breakfastTime) && (
              <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Comodidades</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {tenant.wifiSsid && <Chip icon={Wifi}>Wi-Fi grátis</Chip>}
                  {tenant.breakfastTime && <Chip icon={Coffee}>Café da manhã</Chip>}
                  {(tenant.amenities ?? []).map((a) => <Chip key={a} icon={Check}>{a}</Chip>)}
                </div>
              </div>
            )}

            {/* Horários */}
            {(tenant.checkinTime || tenant.checkoutTime) && (
              <div className="flex gap-3 rounded-3xl bg-white p-4 text-sm shadow-sm ring-1 ring-slate-100">
                {tenant.checkinTime && (
                  <div className="flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Check-in</p>
                    <p className="mt-0.5 font-bold text-slate-800">a partir das {tenant.checkinTime}</p>
                  </div>
                )}
                {tenant.checkoutTime && (
                  <div className="flex-1 border-l border-slate-100 pl-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Check-out</p>
                    <p className="mt-0.5 font-bold text-slate-800">até as {tenant.checkoutTime}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rodapé fixo: preço + ir para o calendário */}
      <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 safe-bottom">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-slate-400">A partir de</p>
            <p className="truncate text-lg font-extrabold text-slate-900">
              {brl(priceFrom(cat))} <span className="text-xs font-semibold text-slate-400">/noite</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onBook}
            className="flex shrink-0 items-center gap-2 rounded-2xl bg-brand-700 px-6 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-brand-800 cursor-pointer"
          >
            <CalendarDays size={16} /> Ver datas
          </button>
        </div>
      </footer>
    </div>
  );
}

/* ================================================================
   Página pública: hero + abas (Início · Quartos · Pousada · Local)
   ================================================================ */
type Tab = 'inicio' | 'quartos' | 'pousada' | 'local';

const TABS: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'inicio', label: 'Início', icon: Home },
  { id: 'quartos', label: 'Quartos', icon: BedDouble },
  { id: 'pousada', label: 'Pousada', icon: Building2 },
  { id: 'local', label: 'Local', icon: MapPin },
];

export default function PublicSitePage() {
  const { slug } = useParams();
  const { tenant, categories, availability, status } = usePublicTenant(slug);

  const [tab, setTab] = useState<Tab>('inicio');
  const [search, setSearch] = useState({
    checkIn: todayISO(),
    checkOut: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    adults: 2,
    children: 0,
  });
  const [searched, setSearched] = useState(false);
  const [detail, setDetail] = useState<PublicCategory | null>(null);
  const [booking, setBooking] = useState<PublicCategory | null>(null);
  const [showNav, setShowNav] = useState(false);
  // Âncora do início do conteúdo (logo abaixo do hero) — usada pelas duas barras de
  // abas para rolar até lá, em vez de depender da altura do hero em vh.
  const contentRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setShowNav(window.scrollY > window.innerHeight * 1.8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const searchValid = search.checkOut > search.checkIn;
  const numNights = searchValid ? nights(search.checkIn, search.checkOut) : 0;

  /** Disponibilidade e total por categoria — só depois que o hóspede busca datas. */
  const stayByCat = useMemo(() => {
    if (!searched || !searchValid) return null;
    const map = new Map<string, { nights: number; total: number; free: number }>();
    for (const c of categories) {
      map.set(c.id, {
        nights: numNights,
        total: stayTotal(c, search.checkIn, search.checkOut),
        free: freeRooms(c, availability, search.checkIn, search.checkOut),
      });
    }
    return map;
  }, [categories, availability, search, searched, searchValid, numNights]);

  const goToRooms = () => {
    setTab('quartos');
    requestAnimationFrame(() => contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const runSearch = () => {
    if (!searchValid) return;
    setSearched(true);
    goToRooms();
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
  const mapsUrl = tenant.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${tenant.name} ${tenant.address}`)}`
    : null;

  return (
    <div className="min-h-dvh bg-slate-50">
      {/* Barra fixa (aparece depois do hero) */}
      <nav
        className={cn(
          'fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-white/90 px-4 py-3 shadow-sm backdrop-blur transition-all duration-300 sm:px-8',
          showNav ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {tenant.logoUrl && <img src={tenant.logoUrl} alt="" className="h-7 w-7 shrink-0 rounded-lg object-cover" />}
          <span className="truncate text-sm font-extrabold text-slate-900 sm:text-base">{tenant.name}</span>
        </span>
        <button onClick={goToRooms} className="rounded-xl bg-brand-700 px-4 py-2 text-xs font-extrabold text-white shadow-sm transition hover:bg-brand-800 cursor-pointer">
          Reservar
        </button>
      </nav>

      {/* ===== Hero cinematográfico (boas-vindas) ===== */}
      <CinematicHero tenant={tenant} roomPhoto={firstRoomPhoto} onReserve={goToRooms} />

      {/* ===== Abas (desktop) ===== */}
      <div className="sticky top-0 z-40 hidden border-b border-slate-200 bg-white/95 backdrop-blur lg:block">
        <div className="mx-auto flex max-w-5xl gap-1 px-4">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'flex items-center gap-2 border-b-2 px-4 py-3.5 text-sm font-bold transition cursor-pointer',
                tab === id ? 'border-brand-700 text-brand-800' : 'border-transparent text-slate-500 hover:text-slate-800'
              )}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>
      </div>

      <main ref={contentRef} className="mx-auto max-w-5xl px-4 pb-28 pt-6 lg:pb-16">
        {/* ---------- Início ---------- */}
        {tab === 'inicio' && (
          <div className="space-y-6">
            {/* Busca */}
            <section className="rounded-3xl bg-white p-4 shadow-lg ring-1 ring-slate-100 sm:p-5">
              <h2 className="mb-3 flex items-center gap-2 font-extrabold text-slate-800">
                <Search size={18} className="text-brand-600" /> Quando você vem?
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Check-in</span>
                  <input
                    type="date"
                    min={todayISO()}
                    value={search.checkIn}
                    onChange={(e) => setSearch((s) => ({ ...s, checkIn: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Check-out</span>
                  <input
                    type="date"
                    min={format(addDays(new Date(search.checkIn + 'T12:00:00'), 1), 'yyyy-MM-dd')}
                    value={search.checkOut}
                    onChange={(e) => setSearch((s) => ({ ...s, checkOut: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Adultos</span>
                  <input
                    type="number"
                    min={1}
                    value={search.adults}
                    onChange={(e) => setSearch((s) => ({ ...s, adults: Math.max(1, Number(e.target.value) || 1) }))}
                    className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Crianças</span>
                  <input
                    type="number"
                    min={0}
                    value={search.children}
                    onChange={(e) => setSearch((s) => ({ ...s, children: Math.max(0, Number(e.target.value) || 0) }))}
                    className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={runSearch}
                disabled={!searchValid}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-700 py-3.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-brand-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <Search size={16} /> Buscar acomodações
              </button>
              {searchValid && (
                <p className="mt-2 text-center text-xs font-semibold text-slate-400">
                  {numNights} noite{numNights === 1 ? '' : 's'}
                </p>
              )}
            </section>

            {/* Comodidades */}
            {((tenant.amenities?.length ?? 0) > 0 || tenant.wifiSsid || tenant.breakfastTime) && (
              <section>
                <h2 className="mb-3 font-extrabold text-slate-800">Sua estadia com todo o conforto</h2>
                <div className="flex flex-wrap gap-2">
                  {tenant.wifiSsid && <Chip icon={Wifi}>Wi-Fi grátis</Chip>}
                  {tenant.breakfastTime && <Chip icon={Coffee}>Café da manhã {tenant.breakfastTime}</Chip>}
                  {tenant.checkinTime && <Chip icon={CalendarDays}>Check-in {tenant.checkinTime}</Chip>}
                  {(tenant.amenities ?? []).map((a) => <Chip key={a} icon={Check}>{a}</Chip>)}
                </div>
              </section>
            )}

            {/* Prévia dos quartos */}
            {categories.length > 0 && (
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-extrabold text-slate-800">Nossas acomodações</h2>
                  <button onClick={goToRooms} className="flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-800 cursor-pointer">
                    Ver todas <ChevronRight size={14} />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {categories.slice(0, 2).map((cat) => (
                    <RoomCard key={cat.id} cat={cat} stay={stayByCat?.get(cat.id) ?? null} onOpen={() => setDetail(cat)} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ---------- Quartos ---------- */}
        {tab === 'quartos' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-extrabold text-slate-800">Nossas acomodações</h2>
              {searched && searchValid && (
                <span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-800">
                  {format(new Date(search.checkIn + 'T12:00:00'), 'dd/MM')} – {format(new Date(search.checkOut + 'T12:00:00'), 'dd/MM')} · {numNights} noite{numNights === 1 ? '' : 's'}
                </span>
              )}
            </div>
            {!searched && (
              <p className="rounded-2xl bg-white p-3 text-xs text-slate-500 shadow-sm ring-1 ring-slate-100">
                Escolha suas datas em <button onClick={() => setTab('inicio')} className="font-bold text-brand-700 cursor-pointer">Início</button> para ver disponibilidade e o valor da estadia.
              </p>
            )}
            {categories.length === 0 ? (
              <p className="rounded-3xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
                As acomodações desta pousada ainda não foram publicadas.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {categories.map((cat) => (
                  <RoomCard key={cat.id} cat={cat} stay={stayByCat?.get(cat.id) ?? null} onOpen={() => setDetail(cat)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------- Pousada ---------- */}
        {tab === 'pousada' && (
          <div className="space-y-4">
            {(tenant.heroImageUrl || firstRoomPhoto) && (
              <img src={tenant.heroImageUrl || firstRoomPhoto} alt={tenant.name} className="aspect-[16/9] w-full rounded-3xl object-cover shadow-sm" />
            )}
            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h2 className="text-lg font-extrabold text-slate-900">{tenant.name}</h2>
              {tenant.description && <p className="mt-2 text-sm leading-relaxed text-slate-600">{tenant.description}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {tenant.wifiSsid && <Chip icon={Wifi}>Wi-Fi grátis</Chip>}
                {tenant.breakfastTime && <Chip icon={Coffee}>Café da manhã {tenant.breakfastTime}</Chip>}
                {(tenant.amenities ?? []).map((a) => <Chip key={a} icon={Check}>{a}</Chip>)}
              </div>
            </section>

            {(tenant.checkinTime || tenant.checkoutTime || tenant.policies) && (
              <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Regras da casa</p>
                <div className="mt-3 flex gap-4 text-sm">
                  {tenant.checkinTime && (
                    <div className="flex-1">
                      <p className="text-xs text-slate-400">Check-in</p>
                      <p className="font-bold text-slate-800">a partir das {tenant.checkinTime}</p>
                    </div>
                  )}
                  {tenant.checkoutTime && (
                    <div className="flex-1 border-l border-slate-100 pl-4">
                      <p className="text-xs text-slate-400">Check-out</p>
                      <p className="font-bold text-slate-800">até as {tenant.checkoutTime}</p>
                    </div>
                  )}
                </div>
                {tenant.policies && <p className="mt-3 whitespace-pre-line border-t border-slate-100 pt-3 text-sm leading-relaxed text-slate-600">{tenant.policies}</p>}
              </section>
            )}

            {(tenant.phone || tenant.whatsappNumber) && (
              <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Fale com a gente</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {tenant.whatsappNumber && (
                    <a
                      href={`https://wa.me/${waPhone(tenant.whatsappNumber)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600"
                    >
                      <MessageCircle size={15} /> WhatsApp
                    </a>
                  )}
                  {tenant.phone && (
                    <a
                      href={`tel:${tenant.phone.replace(/\D/g, '')}`}
                      className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Phone size={15} /> {tenant.phone}
                    </a>
                  )}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ---------- Local ---------- */}
        {tab === 'local' && (
          <div className="space-y-4">
            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Onde estamos</p>
              {tenant.address ? (
                <>
                  <p className="mt-2 flex items-start gap-2 text-sm font-semibold text-slate-800">
                    <MapPin size={16} className="mt-0.5 shrink-0 text-brand-600" /> {tenant.address}
                  </p>
                  {mapsUrl && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-brand-700 py-3 text-sm font-extrabold text-white transition hover:bg-brand-800"
                    >
                      <Navigation size={15} /> Como chegar
                    </a>
                  )}
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-500">O endereço ainda não foi informado pela pousada.</p>
              )}
            </section>

            {(tenant.touristSpots?.length ?? 0) > 0 && (
              <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Por perto</p>
                <ul className="mt-3 divide-y divide-slate-100">
                  {(tenant.touristSpots ?? []).map((s) => (
                    <li key={s.id} className="flex items-start gap-3 py-2.5">
                      <MapPin size={15} className="mt-0.5 shrink-0 text-brand-600" />
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-slate-800">{s.name}</span>
                        {s.description && <span className="block text-xs text-slate-500">{s.description}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {(tenant.restaurants?.length ?? 0) > 0 && (
              <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Onde comer</p>
                <ul className="mt-3 divide-y divide-slate-100">
                  {(tenant.restaurants ?? []).map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-slate-800">{r.name}</span>
                        {r.cuisine && <span className="block text-xs text-slate-500">{r.cuisine}</span>}
                      </span>
                      {r.phone && <a href={`tel:${r.phone.replace(/\D/g, '')}`} className="shrink-0 text-xs font-bold text-brand-700">{r.phone}</a>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </main>

      {/* ===== Abas (mobile, estilo app) ===== */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white safe-bottom lg:hidden">
        <div className="grid grid-cols-4">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setTab(id); requestAnimationFrame(() => contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })); }}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold transition cursor-pointer',
                tab === id ? 'text-brand-700' : 'text-slate-400'
              )}
            >
              <Icon size={20} /> {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Rodapé */}
      <footer className="border-t border-slate-200 bg-white px-4 py-6 pb-24 text-center text-xs text-slate-400 lg:pb-6">
        {tenant.name}{tenant.address ? ` · ${tenant.address}` : ''}
      </footer>

      {/* Detalhe da acomodação */}
      {detail && (
        <RoomDetail
          tenant={tenant}
          cat={detail}
          onClose={() => setDetail(null)}
          onBook={() => setBooking(detail)}
        />
      )}

      {/* Fluxo de reserva */}
      {booking && (
        <BookingSheet
          tenant={tenant}
          cat={booking}
          availability={availability}
          initialRange={searched && searchValid ? { checkIn: search.checkIn, checkOut: search.checkOut } : null}
          initialGuests={{ adults: search.adults, children: search.children }}
          onClose={() => { setBooking(null); setDetail(null); }}
        />
      )}
    </div>
  );
}
