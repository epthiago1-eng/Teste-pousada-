import { useMemo, useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { addDoc, collection } from 'firebase/firestore';
import { addDays, format } from 'date-fns';
import { toast } from 'sonner';
import { BedDouble, CalendarCheck, Loader2, MapPin, Phone, Send, Users } from 'lucide-react';
import { db } from '../../lib/firebase';
import { usePublicTenant } from './usePublicTenant';
import { Button, Field, Input, Textarea } from '../../components/ui';
import { brl, nights, rangesOverlap, todayISO } from '../../lib/utils';
import { ScrollFrameHero } from '../../components/ScrollFrameHero';

const SCROLL_HERO_FRAME_COUNT = 65;
const scrollHeroFramePath = (i: number) => `/booking-scroll/frame-${String(i).padStart(3, '0')}.webp`;

/** Galeria: foto principal + miniaturas clicáveis. */
function Gallery({ photos, name, badge }: { photos: string[]; name: string; badge: ReactNode }) {
  const [idx, setIdx] = useState(0);
  if (photos.length === 0) return null;
  return (
    <div>
      <div className="relative h-44 w-full sm:h-52">
        <img src={photos[idx]} alt={name} className="h-full w-full object-cover" loading="lazy" />
        {badge}
        {photos.length > 1 && (
          <span className="absolute bottom-2 right-2 rounded-full bg-slate-900/60 px-2 py-0.5 text-[10px] font-bold text-white">
            {idx + 1}/{photos.length} 📷
          </span>
        )}
      </div>
      {photos.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto bg-slate-50 p-1.5">
          {photos.map((p, i) => (
            <img
              key={i}
              src={p}
              alt=""
              onClick={(e) => { e.stopPropagation(); setIdx(i); }}
              className={`h-12 w-16 shrink-0 cursor-pointer rounded-lg object-cover transition ${i === idx ? 'ring-2 ring-brand-600' : 'opacity-70 hover:opacity-100'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PublicBookingPage() {
  const { slug } = useParams();
  const { tenant, categories, availability, status } = usePublicTenant(slug);

  const [dates, setDates] = useState({ checkIn: todayISO(), checkOut: format(addDays(new Date(), 1), 'yyyy-MM-dd') });
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [guest, setGuest] = useState({ name: '', phone: '', email: '', adults: 2, children: 0, notes: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const results = useMemo(() => {
    if (dates.checkOut <= dates.checkIn) return [];
    return categories.map((cat) => {
      const busyRooms = new Set(
        (availability?.ranges ?? [])
          .filter((r) => cat.roomIds.includes(r.roomId) && rangesOverlap(dates.checkIn, dates.checkOut, r.start, r.end))
          .map((r) => r.roomId)
      );
      const free = cat.roomIds.length - busyRooms.size;
      return { ...cat, free };
    });
  }, [categories, availability, dates]);

  const numNights = dates.checkOut > dates.checkIn ? nights(dates.checkIn, dates.checkOut) : 0;

  const submit = async () => {
    if (!tenant) return;
    if (!guest.name.trim() || guest.name.trim().length < 2) return toast.error('Informe seu nome.');
    if (!guest.phone.trim()) return toast.error('Informe seu telefone/WhatsApp.');
    setSending(true);
    try {
      await addDoc(collection(db, 'tenants', tenant.id, 'bookingRequests'), {
        guestName: guest.name.trim().slice(0, 119),
        guestPhone: guest.phone.trim().slice(0, 39),
        guestEmail: guest.email.trim(),
        categoryId: selectedCat,
        checkIn: dates.checkIn,
        checkOut: dates.checkOut,
        adults: guest.adults,
        children: guest.children,
        notes: guest.notes.trim().slice(0, 500),
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      setSent(true);
    } catch {
      toast.error('Não foi possível enviar. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  if (status === 'loading') {
    return <div className="flex min-h-dvh items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-brand-600" size={32} /></div>;
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

  const selectedCategory = results.find((c) => c.id === selectedCat);

  return (
    <div className="min-h-dvh bg-slate-50">
      {/* Hero cinemático: animação controlada pelo scroll */}
      <ScrollFrameHero frameCount={SCROLL_HERO_FRAME_COUNT} framePath={scrollHeroFramePath}>
        {tenant.logoUrl && <img src={tenant.logoUrl} alt="" className="mx-auto mb-3 h-14 w-14 rounded-2xl object-cover shadow-lg" />}
        <h1 className="text-3xl font-extrabold drop-shadow sm:text-5xl">{tenant.name}</h1>
        {tenant.description && <p className="mx-auto mt-3 max-w-lg text-sm text-white/85 drop-shadow sm:text-base">{tenant.description}</p>}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-white/75 sm:text-sm">
          {tenant.address && <span className="flex items-center gap-1"><MapPin size={13} /> {tenant.address}</span>}
          {tenant.phone && <span className="flex items-center gap-1"><Phone size={13} /> {tenant.phone}</span>}
        </div>
        <div className="mt-8 animate-bounce text-white/60">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M19 12l-7 7-7-7" /></svg>
        </div>
      </ScrollFrameHero>

      <main className="mx-auto max-w-2xl px-4 pb-16">
        {sent ? (
          <div className="mt-10 rounded-2xl bg-white p-8 text-center shadow-sm">
            <CalendarCheck size={44} className="mx-auto text-emerald-500" />
            <h2 className="mt-3 text-xl font-extrabold text-slate-800">Pedido enviado! 🎉</h2>
            <p className="mt-2 text-sm text-slate-500">
              Recebemos sua solicitação de {nights(dates.checkIn, dates.checkOut)} noite(s). A equipe da {tenant.name} vai confirmar sua reserva
              {guest.phone && <> pelo telefone <strong>{guest.phone}</strong></>} em breve.
            </p>
            {tenant.whatsappNumber && (
              <a
                href={`https://wa.me/${tenant.whatsappNumber}?text=${encodeURIComponent(`Olá! Acabei de enviar um pedido de reserva em nome de ${guest.name}.`)}`}
                target="_blank" rel="noreferrer"
                className="mt-4 inline-block rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-600"
              >
                Falar no WhatsApp
              </a>
            )}
          </div>
        ) : (
          <>
            {/* Datas */}
            <div className="-mt-6 rounded-2xl bg-white p-4 shadow-lg">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Check-in"><Input type="date" min={todayISO()} value={dates.checkIn} onChange={(e) => setDates((d) => ({ ...d, checkIn: e.target.value }))} /></Field>
                <Field label="Check-out"><Input type="date" min={dates.checkIn} value={dates.checkOut} onChange={(e) => setDates((d) => ({ ...d, checkOut: e.target.value }))} /></Field>
              </div>
            </div>

            {/* Categorias */}
            <h2 className="mb-3 mt-8 text-lg font-extrabold text-slate-800">Acomodações {numNights > 0 && <span className="text-sm font-semibold text-slate-400">· {numNights} noite(s)</span>}</h2>
            {results.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma acomodação publicada ainda.</p>
            ) : (
              <div className="space-y-4">
                {results.map((cat) => {
                  const photo = cat.photos?.[0];
                  const selected = selectedCat === cat.id;
                  return (
                    <button
                      key={cat.id}
                      disabled={cat.free <= 0}
                      onClick={() => setSelectedCat(cat.id === selectedCat ? null : cat.id)}
                      className={`w-full overflow-hidden rounded-2xl border-2 bg-white text-left transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${selected ? 'border-brand-600 shadow-lg' : 'border-transparent shadow-sm hover:border-brand-200 hover:shadow-md'}`}
                    >
                      {photo && (
                        <Gallery
                          photos={cat.photos ?? []}
                          name={cat.name}
                          badge={
                            <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold shadow ${cat.free > 0 ? 'bg-white/95 text-emerald-700' : 'bg-white/95 text-red-500'}`}>
                              {cat.free > 0 ? `${cat.free} disponível(is)` : 'Esgotado'}
                            </span>
                          }
                        />
                      )}
                      <div className="flex items-start justify-between gap-3 p-4">
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 font-bold text-slate-800"><BedDouble size={17} className="shrink-0 text-brand-600" /> {cat.name}</p>
                          {cat.description && <p className="mt-1 text-xs leading-relaxed text-slate-500">{cat.description}</p>}
                          <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-400"><Users size={12} /> até {cat.maxGuests} hóspedes</p>
                          {!photo && (
                            <p className={`mt-1 text-[11px] font-bold ${cat.free > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {cat.free > 0 ? `${cat.free} disponível(is)` : 'Esgotado'}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xl font-extrabold text-brand-800">{brl(cat.basePrice)}</p>
                          <p className="text-[11px] text-slate-400">por noite</p>
                          {selected && <p className="mt-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">✓ Selecionado</p>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Formulário */}
            {selectedCat && (
              <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm">
                <h3 className="mb-1 font-extrabold text-slate-800">Solicitar reserva — {selectedCategory?.name}</h3>
                {numNights > 0 && selectedCategory && (
                  <p className="mb-4 text-sm text-slate-500">
                    Estimativa: <strong className="text-brand-800">{brl(selectedCategory.basePrice * numNights)}</strong> ({numNights} noite(s)) — valor final confirmado pela pousada.
                  </p>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2"><Field label="Seu nome" required><Input value={guest.name} onChange={(e) => setGuest((g) => ({ ...g, name: e.target.value }))} /></Field></div>
                  <Field label="Telefone / WhatsApp" required><Input value={guest.phone} onChange={(e) => setGuest((g) => ({ ...g, phone: e.target.value }))} placeholder="(00) 90000-0000" /></Field>
                  <Field label="E-mail"><Input type="email" value={guest.email} onChange={(e) => setGuest((g) => ({ ...g, email: e.target.value }))} /></Field>
                  <Field label="Adultos"><Input type="number" min={1} value={guest.adults} onChange={(e) => setGuest((g) => ({ ...g, adults: Number(e.target.value) }))} /></Field>
                  <Field label="Crianças"><Input type="number" min={0} value={guest.children} onChange={(e) => setGuest((g) => ({ ...g, children: Number(e.target.value) }))} /></Field>
                  <div className="sm:col-span-2"><Field label="Observações"><Textarea value={guest.notes} onChange={(e) => setGuest((g) => ({ ...g, notes: e.target.value }))} placeholder="Horário de chegada, pedidos especiais…" /></Field></div>
                </div>
                <Button size="lg" className="mt-4 w-full" onClick={submit} disabled={sending}>
                  {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={17} />} Enviar pedido de reserva
                </Button>
                <p className="mt-2 text-center text-[11px] text-slate-400">Sem pagamento agora — a pousada confirma com você.</p>
              </div>
            )}
          </>
        )}
        <p className="mt-10 text-center text-[11px] text-slate-300">Reservas online por PousadaGest</p>
      </main>
    </div>
  );
}
