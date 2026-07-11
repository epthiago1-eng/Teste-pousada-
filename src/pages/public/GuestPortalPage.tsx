import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Clock, Coffee, Copy, Loader2, LogIn, LogOut, MapPin, MessageCircle, Phone, ScrollText, Tv, Utensils, Wifi,
} from 'lucide-react';
import { usePublicTenant } from './usePublicTenant';

function copyText(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => toast.success(`${label} copiado!`)).catch(() => {});
}

export default function GuestPortalPage() {
  const { slug } = useParams();
  const { tenant, status } = usePublicTenant(slug);

  if (status === 'loading') {
    return <div className="flex min-h-dvh items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-brand-600" size={32} /></div>;
  }
  if (status === 'not-found' || !tenant || tenant.guestPortalEnabled === false) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50 p-6 text-center">
        <div>
          <p className="text-4xl">🔒</p>
          <h1 className="mt-2 text-xl font-bold text-slate-800">Portal indisponível</h1>
        </div>
      </div>
    );
  }

  const Section = ({ icon: Icon, title, children, tone = 'brand' }: { icon: typeof Wifi; title: string; children: ReactNode; tone?: 'brand' | 'red' }) => (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <h2 className="mb-2.5 flex items-center gap-2 text-sm font-extrabold text-slate-800">
        <span className={`rounded-xl p-2 ${tone === 'red' ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-700'}`}><Icon size={16} /></span> {title}
      </h2>
      {children}
    </div>
  );

  const hasHero = Boolean(tenant.heroImageUrl?.trim());

  return (
    <div className="min-h-dvh bg-slate-100">
      {/* Hero com foto de fundo */}
      <header className="relative overflow-hidden px-4 pb-16 pt-14 text-center text-white">
        {hasHero ? (
          <>
            <img src={tenant.heroImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/50 to-slate-100" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-800 to-brand-900" />
        )}
        <div className="relative">
          {tenant.logoUrl && <img src={tenant.logoUrl} alt="" className="mx-auto mb-3 h-16 w-16 rounded-2xl object-cover shadow-lg" />}
          <h1 className="text-3xl font-extrabold drop-shadow">{tenant.name}</h1>
          <p className="mt-1 text-sm font-medium text-white/85 drop-shadow">{tenant.portalSubtitle || 'Guia digital do hóspede'} 🌺</p>
        </div>
      </header>

      <main className="relative mx-auto -mt-8 max-w-lg space-y-3 px-4 pb-28">
        {/* Wi-Fi em destaque */}
        {(tenant.wifiSsid || tenant.wifiPassword) && (
          <div className="rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 p-5 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide"><Wifi size={18} /> Internet sem fio</h2>
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase">Hóspedes</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              {tenant.wifiSsid && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Rede (SSID)</p>
                  <p className="truncate font-bold">{tenant.wifiSsid}</p>
                </div>
              )}
              {tenant.wifiPassword && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Senha</p>
                  <p className="truncate font-mono font-bold">{tenant.wifiPassword}</p>
                </div>
              )}
            </div>
            {tenant.wifiPassword && (
              <button
                onClick={() => copyText(tenant.wifiPassword!, 'Senha do Wi-Fi')}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white/15 py-2.5 text-sm font-bold backdrop-blur transition hover:bg-white/25 cursor-pointer"
              >
                <Copy size={15} /> Copiar senha do Wi-Fi
              </button>
            )}
          </div>
        )}

        {/* Horários */}
        <Section icon={Clock} title="Horários">
          <div className="grid grid-cols-3 gap-2 text-center">
            {tenant.checkinTime && (
              <div className="rounded-xl bg-slate-50 p-3">
                <LogIn size={16} className="mx-auto text-brand-600" />
                <p className="mt-1 text-[10px] font-bold uppercase text-slate-400">Check-in</p>
                <p className="text-sm font-extrabold text-slate-800">{tenant.checkinTime}</p>
              </div>
            )}
            {tenant.checkoutTime && (
              <div className="rounded-xl bg-slate-50 p-3">
                <LogOut size={16} className="mx-auto text-orange-500" />
                <p className="mt-1 text-[10px] font-bold uppercase text-slate-400">Check-out</p>
                <p className="text-sm font-extrabold text-slate-800">{tenant.checkoutTime}</p>
              </div>
            )}
            {tenant.breakfastTime && (
              <div className="rounded-xl bg-slate-50 p-3">
                <Coffee size={16} className="mx-auto text-amber-600" />
                <p className="mt-1 text-[10px] font-bold uppercase text-slate-400">Café</p>
                <p className="text-sm font-extrabold text-slate-800">{tenant.breakfastTime}</p>
              </div>
            )}
          </div>
        </Section>

        {tenant.policies && (
          <Section icon={ScrollText} title="Políticas da hospedagem">
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{tenant.policies}</p>
          </Section>
        )}

        {(tenant.touristSpots?.filter((s) => s.name.trim()).length ?? 0) > 0 && (
          <Section icon={MapPin} title="O que fazer na região">
            <ul className="space-y-2.5">
              {tenant.touristSpots!.filter((s) => s.name.trim()).map((s) => (
                <li key={s.id} className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
                  <strong className="text-slate-800">{s.name}</strong>
                  {s.description && <p className="mt-0.5 text-xs text-slate-500">{s.description}</p>}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {(tenant.restaurants?.filter((r) => r.name.trim()).length ?? 0) > 0 && (
          <Section icon={Utensils} title="Onde comer">
            <ul className="space-y-2.5">
              {tenant.restaurants!.filter((r) => r.name.trim()).map((r) => (
                <li key={r.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
                  <div>
                    <strong className="text-slate-800">{r.name}</strong>
                    {r.cuisine && <span className="text-xs text-slate-400"> · {r.cuisine}</span>}
                  </div>
                  {r.phone && <a href={`tel:${r.phone}`} className="text-xs font-bold text-brand-700">{r.phone}</a>}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {tenant.deliveryAddress && (
          <Section icon={MapPin} title="Endereço para delivery">
            <p className="text-sm text-slate-600">{tenant.deliveryAddress}</p>
            <button
              onClick={() => copyText(tenant.deliveryAddress!, 'Endereço')}
              className="mt-2 flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 cursor-pointer"
            >
              <Copy size={13} /> Copiar endereço
            </button>
          </Section>
        )}

        {(tenant.tvChannels?.filter((c) => c.name.trim()).length ?? 0) > 0 && (
          <Section icon={Tv} title="Canais de TV">
            <div className="grid grid-cols-2 gap-1.5">
              {tenant.tvChannels!.filter((c) => c.name.trim()).map((c) => (
                <div key={c.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs">
                  <span className="min-w-8 rounded-md bg-brand-700 px-1.5 py-0.5 text-center font-bold text-white">{c.number}</span>
                  <span className="truncate font-semibold text-slate-700">{c.name}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {(tenant.emergencyContacts?.filter((c) => c.name.trim()).length ?? 0) > 0 && (
          <Section icon={Phone} title="Contatos de emergência" tone="red">
            <ul className="space-y-1.5">
              {tenant.emergencyContacts!.filter((c) => c.name.trim()).map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded-xl bg-red-50/60 px-3 py-2 text-sm">
                  <span className="font-semibold text-slate-700">{c.name}</span>
                  <a className="font-extrabold text-red-600" href={`tel:${c.phone}`}>{c.phone}</a>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <p className="pt-4 text-center text-[11px] text-slate-300">Portal do hóspede por PousadaGest</p>
      </main>

      {/* Botão fixo: falar com a recepção */}
      {tenant.whatsappNumber && (
        <div className="fixed inset-x-0 bottom-0 z-50 bg-gradient-to-t from-slate-100 via-slate-100/95 to-transparent p-4 safe-bottom">
          <a
            href={`https://wa.me/${tenant.whatsappNumber}`}
            target="_blank" rel="noreferrer"
            className="mx-auto flex max-w-lg items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 font-bold text-white shadow-lg transition hover:bg-emerald-600"
          >
            <MessageCircle size={18} /> Falar com a recepção
          </a>
        </div>
      )}
    </div>
  );
}
