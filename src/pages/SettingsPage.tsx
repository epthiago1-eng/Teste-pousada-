import { useEffect, useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { Copy, Globe, Link2, Plus, Settings2, Trash2, UserPlus, UsersRound } from 'lucide-react';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Badge, Button, Card, Field, Input, Modal, PageHeader, Select, Textarea } from '../components/ui';
import type { Role } from '../types';
import { DEFAULT_MESSAGE_TEMPLATES, ROLE_LABELS } from '../types';
import { brl, cn } from '../lib/utils';
import type { ReactNode } from 'react';

/* =============== Moldura de celular para prévia =============== */
function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-[300px] shrink-0">
      <div className="relative rounded-[36px] border-[10px] border-slate-900 bg-slate-900 shadow-2xl">
        {/* Notch fora da área de scroll */}
        <div className="pointer-events-none absolute left-1/2 top-1.5 z-20 h-4 w-24 -translate-x-1/2 rounded-full bg-slate-900" />
        <div className="h-[560px] overflow-y-auto overflow-x-hidden rounded-[26px] bg-slate-100" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
          {children}
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] font-semibold text-slate-400">Prévia ao vivo 📱</p>
    </div>
  );
}

/* =============== Prévia do Portal do Hóspede =============== */
function PortalPreview({ tenant, p }: { tenant: import('../types').Tenant; p: { heroImageUrl: string; portalSubtitle: string; deliveryAddress: string; touristSpots: { id: string; name: string; description?: string }[]; restaurants: { id: string; name: string; cuisine?: string; phone?: string }[]; emergencyContacts: { id: string; name: string; phone: string }[]; tvChannels: { id: string; number: string; name: string }[] } }) {
  const Mini = ({ emoji, title, children }: { emoji: string; title: string; children: ReactNode }) => (
    <div className="rounded-xl bg-white p-2.5 shadow-sm">
      <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-700">{emoji} {title}</p>
      {children}
    </div>
  );
  return (
    <div className="pb-16">
      {/* Hero */}
      <div className="relative overflow-hidden px-3 pb-10 pt-8 text-center text-white">
        {p.heroImageUrl.trim() ? (
          <>
            <img src={p.heroImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 to-slate-100" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-800 to-brand-900" />
        )}
        <div className="relative">
          <p className="text-lg font-extrabold drop-shadow">{tenant.name}</p>
          <p className="text-[10px] text-white/85">{p.portalSubtitle || 'Guia digital do hóspede'} 🌺</p>
        </div>
      </div>
      <div className="-mt-5 space-y-2 px-3">
        {(tenant.wifiSsid || tenant.wifiPassword) && (
          <div className="rounded-xl bg-gradient-to-br from-brand-700 to-brand-900 p-3 text-white shadow">
            <p className="text-[10px] font-extrabold uppercase">📶 Internet sem fio</p>
            <div className="mt-1.5 grid grid-cols-2 gap-1 text-[10px]">
              <div><p className="text-white/60">Rede</p><p className="truncate font-bold">{tenant.wifiSsid || '—'}</p></div>
              <div><p className="text-white/60">Senha</p><p className="truncate font-mono font-bold">{tenant.wifiPassword || '—'}</p></div>
            </div>
            <div className="mt-1.5 rounded-lg bg-white/15 py-1 text-center text-[9px] font-bold">Copiar senha do Wi-Fi</div>
          </div>
        )}
        <Mini emoji="🕐" title="Horários">
          <div className="grid grid-cols-3 gap-1 text-center">
            {[['Check-in', tenant.checkinTime], ['Check-out', tenant.checkoutTime], ['Café', tenant.breakfastTime]].map(([l, v]) => v && (
              <div key={l} className="rounded-lg bg-slate-50 p-1.5">
                <p className="text-[8px] font-bold uppercase text-slate-400">{l}</p>
                <p className="text-[10px] font-extrabold text-slate-800">{v}</p>
              </div>
            ))}
          </div>
        </Mini>
        {tenant.policies && (
          <Mini emoji="📜" title="Políticas da hospedagem">
            <p className="whitespace-pre-line text-[9px] leading-relaxed text-slate-500">{tenant.policies.slice(0, 180)}{tenant.policies.length > 180 ? '…' : ''}</p>
          </Mini>
        )}
        {p.touristSpots.filter((s) => s.name.trim()).length > 0 && (
          <Mini emoji="📍" title="O que fazer na região">
            {p.touristSpots.filter((s) => s.name.trim()).slice(0, 3).map((s) => (
              <p key={s.id} className="mb-1 rounded-lg bg-slate-50 px-2 py-1 text-[9px]"><strong>{s.name}</strong>{s.description && <span className="text-slate-400"> — {s.description}</span>}</p>
            ))}
          </Mini>
        )}
        {p.restaurants.filter((r) => r.name.trim()).length > 0 && (
          <Mini emoji="🍽️" title="Onde comer">
            {p.restaurants.filter((r) => r.name.trim()).slice(0, 3).map((r) => (
              <p key={r.id} className="mb-1 flex justify-between rounded-lg bg-slate-50 px-2 py-1 text-[9px]"><strong>{r.name}</strong><span className="text-brand-700">{r.phone}</span></p>
            ))}
          </Mini>
        )}
        {p.deliveryAddress && (
          <Mini emoji="🛵" title="Endereço para delivery">
            <p className="text-[9px] text-slate-500">{p.deliveryAddress}</p>
          </Mini>
        )}
        {p.tvChannels.filter((c) => c.name.trim()).length > 0 && (
          <Mini emoji="📺" title="Canais de TV">
            <div className="grid grid-cols-2 gap-1">
              {p.tvChannels.filter((c) => c.name.trim()).slice(0, 6).map((c) => (
                <p key={c.id} className="flex items-center gap-1 rounded bg-slate-50 px-1.5 py-0.5 text-[9px]"><span className="rounded bg-brand-700 px-1 font-bold text-white">{c.number}</span><span className="truncate">{c.name}</span></p>
              ))}
            </div>
          </Mini>
        )}
        {p.emergencyContacts.filter((c) => c.name.trim()).length > 0 && (
          <Mini emoji="🚨" title="Emergência">
            {p.emergencyContacts.filter((c) => c.name.trim()).slice(0, 3).map((c) => (
              <p key={c.id} className="mb-1 flex justify-between rounded-lg bg-red-50 px-2 py-1 text-[9px]"><span>{c.name}</span><strong className="text-red-600">{c.phone}</strong></p>
            ))}
          </Mini>
        )}
      </div>
      {tenant.whatsappNumber && (
        <div className="sticky bottom-0 mt-3 bg-gradient-to-t from-slate-100 to-transparent p-3">
          <div className="rounded-xl bg-emerald-500 py-2 text-center text-[10px] font-bold text-white shadow">💬 Falar com a recepção</div>
        </div>
      )}
    </div>
  );
}

/* =============== Modelos de mensagem WhatsApp =============== */
const PLACEHOLDERS: [string, string][] = [
  ['{nome}', 'nome do hóspede'],
  ['{pousada}', 'nome da pousada'],
  ['{quarto}', 'número do quarto'],
  ['{checkin}', 'data de check-in'],
  ['{checkout}', 'data de check-out'],
  ['{noites}', 'nº de noites'],
  ['{valor}', 'valor total'],
  ['{hora_checkin}', 'horário de check-in'],
  ['{hora_checkout}', 'horário de check-out'],
  ['{link_fnrh}', 'link da ficha FNRH'],
  ['{link_portal}', 'link do portal do hóspede'],
];

function MessagesEditor({ tenant }: { tenant: import('../types').Tenant }) {
  const [msgs, setMsgs] = useState<Record<string, string>>(() =>
    Object.fromEntries(DEFAULT_MESSAGE_TEMPLATES.map((t) => [t.key, tenant.messageTemplates?.[t.key] ?? t.text]))
  );

  const saveAll = async () => {
    await setDoc(doc(db, 'tenants', tenant.id), { messageTemplates: msgs }, { merge: true });
    toast.success('Mensagens salvas! Já disponíveis no botão WhatsApp das reservas.');
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="font-bold text-slate-800">💬 Mensagens padrão de WhatsApp</h3>
        <p className="mt-1 text-sm text-slate-500">
          Ao abrir uma reserva, o botão <strong>WhatsApp</strong> monta estas mensagens automaticamente com os dados do hóspede. As variáveis abaixo são substituídas na hora do envio:
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PLACEHOLDERS.map(([k, d]) => (
            <span key={k} className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-800" title={d}>
              <code className="font-mono font-bold">{k}</code> = {d}
            </span>
          ))}
        </div>
      </Card>

      {DEFAULT_MESSAGE_TEMPLATES.map((t) => (
        <Card key={t.key} className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-700">{t.emoji} {t.label}</h4>
            <Button size="sm" variant="ghost" onClick={() => setMsgs((m) => ({ ...m, [t.key]: t.text }))}>Restaurar padrão</Button>
          </div>
          <Textarea
            className="min-h-32 font-mono text-xs"
            value={msgs[t.key]}
            onChange={(e) => setMsgs((m) => ({ ...m, [t.key]: e.target.value }))}
          />
        </Card>
      ))}

      <div className="flex justify-end">
        <Button onClick={saveAll}>Salvar mensagens</Button>
      </div>
    </div>
  );
}

/* =============== Aparência da página de reservas (com prévia) =============== */
function BookingPageEditor({ tenant, categories, publicUrl }: { tenant: import('../types').Tenant; categories: import('../types').RoomCategory[]; publicUrl: string }) {
  const [b, setB] = useState({
    heroImageUrl: tenant.heroImageUrl ?? '',
    description: tenant.description ?? '',
  });

  const saveIt = async () => {
    await setDoc(doc(db, 'tenants', tenant.id), b, { merge: true });
    toast.success('Página de reservas atualizada!');
  };

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-slate-800">🎨 Aparência da página de reservas</h3>
          <p className="text-xs text-slate-400">Foto de capa e texto de boas-vindas. As fotos dos quartos vêm do cadastro das categorias.</p>
        </div>
        <a href={publicUrl} target="_blank" rel="noreferrer"><Button variant="outline" size="sm"><Globe size={14} /> Ver página</Button></a>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-4">
          <Field label="Foto de capa (URL)" hint="Uma foto marcante da pousada — fica no topo da página (e do portal do hóspede).">
            <Input value={b.heroImageUrl} onChange={(e) => setB({ ...b, heroImageUrl: e.target.value })} placeholder="https://…/fachada.jpg" />
          </Field>
          <Field label="Texto de boas-vindas">
            <Textarea value={b.description} onChange={(e) => setB({ ...b, description: e.target.value })} placeholder="Pousada pé na areia em Arraial do Cabo, com café da manhã incluso…" />
          </Field>
          {categories.some((c) => !c.photos?.length) && (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
              💡 {categories.filter((c) => !c.photos?.length).map((c) => c.name).join(', ')} ainda {categories.filter((c) => !c.photos?.length).length === 1 ? 'está' : 'estão'} sem foto — adicione em Quartos → Categorias.
            </p>
          )}
          <div className="flex justify-end">
            <Button onClick={saveIt}>Salvar aparência</Button>
          </div>
        </div>

        {/* Prévia */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <PhoneFrame>
            <div className="pb-6">
              <div className="relative overflow-hidden px-3 pb-10 pt-8 text-center text-white">
                {b.heroImageUrl.trim() ? (
                  <>
                    <img src={b.heroImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 to-slate-900/70" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-800 to-brand-900" />
                )}
                <div className="relative">
                  <p className="text-lg font-extrabold drop-shadow">{tenant.name}</p>
                  {b.description && <p className="mt-1 text-[9px] leading-relaxed text-white/85">{b.description.slice(0, 120)}{b.description.length > 120 ? '…' : ''}</p>}
                </div>
              </div>
              <div className="-mt-4 px-3">
                <div className="rounded-xl bg-white p-2.5 shadow">
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="rounded-lg bg-slate-50 px-2 py-1.5"><p className="text-[8px] font-bold uppercase text-slate-400">Check-in</p><p className="text-[10px] font-bold text-slate-700">05/07/2026</p></div>
                    <div className="rounded-lg bg-slate-50 px-2 py-1.5"><p className="text-[8px] font-bold uppercase text-slate-400">Check-out</p><p className="text-[10px] font-bold text-slate-700">06/07/2026</p></div>
                  </div>
                </div>
                <p className="mb-1.5 mt-3 text-[11px] font-extrabold text-slate-800">Acomodações</p>
                <div className="space-y-2">
                  {(categories.length ? categories : [{ id: 'x', name: 'Suíte exemplo', maxGuests: 2, basePrice: 250, description: 'Cadastre suas categorias', photos: [] } as import('../types').RoomCategory]).slice(0, 3).map((c) => (
                    <div key={c.id} className="overflow-hidden rounded-xl bg-white shadow-sm">
                      {c.photos?.[0] ? (
                        <img src={c.photos[0]} alt="" className="h-20 w-full object-cover" />
                      ) : (
                        <div className="flex h-20 w-full items-center justify-center bg-slate-100 text-[9px] font-semibold text-slate-400">sem foto 📷</div>
                      )}
                      <div className="flex items-start justify-between gap-2 p-2">
                        <div className="min-w-0">
                          <p className="truncate text-[10px] font-bold text-slate-800">{c.name}</p>
                          <p className="text-[8px] text-slate-400">até {c.maxGuests} hóspedes</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[11px] font-extrabold text-brand-800">{brl(c.basePrice)}</p>
                          <p className="text-[7px] text-slate-400">por noite</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </PhoneFrame>
        </div>
      </div>
    </Card>
  );
}

/* =============== Editor do Portal do Hóspede =============== */
function PortalEditor({ tenantId, tenant, publicUrl }: { tenantId: string; tenant: import('../types').Tenant; publicUrl: string }) {
  const [sub, setSub] = useState<'identidade' | 'locais' | 'tv'>('identidade');
  const [p, setP] = useState({
    heroImageUrl: tenant.heroImageUrl ?? '',
    portalSubtitle: tenant.portalSubtitle ?? 'Guia digital do hóspede',
    deliveryAddress: tenant.deliveryAddress ?? '',
    touristSpots: tenant.touristSpots ?? [],
    restaurants: tenant.restaurants ?? [],
    emergencyContacts: tenant.emergencyContacts ?? [],
    tvChannels: tenant.tvChannels ?? [],
  });

  const savePortal = async () => {
    await setDoc(doc(db, 'tenants', tenantId), p, { merge: true });
    toast.success('Portal atualizado! As alterações já estão no link.');
  };

  const newId = () => Math.random().toString(36).slice(2, 10);

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center justify-between gap-2 p-4">
        <div>
          <h3 className="font-bold text-slate-800">Editor do Portal do Hóspede</h3>
          <p className="text-xs text-slate-400">As alterações salvas refletem na hora no link do portal.</p>
        </div>
        <div className="flex gap-2">
          <a href={`${publicUrl}/portal`} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm"><Globe size={14} /> Ver portal</Button>
          </a>
          <Button size="sm" variant="secondary" onClick={() => copy(`${publicUrl}/portal`, 'Link do portal')}><Copy size={13} /> Copiar link</Button>
        </div>
      </Card>

      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 sm:w-fit">
            {([['identidade', 'Identidade & regras'], ['locais', 'Turismo & restaurantes'], ['tv', 'TV & emergência']] as const).map(([t, label]) => (
              <button key={t} onClick={() => setSub(t)} className={cn('rounded-lg px-3 py-2 text-xs font-bold transition cursor-pointer', sub === t ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-500')}>
                {label}
              </button>
            ))}
          </div>

      {sub === 'identidade' && (
        <Card className="space-y-4 p-5">
          <Field label="Foto de fundo do portal (URL)" hint="Uma foto bonita da pousada — aparece no topo do portal e da página de reservas.">
            <Input value={p.heroImageUrl} onChange={(e) => setP({ ...p, heroImageUrl: e.target.value })} placeholder="https://…/fachada.jpg" />
          </Field>
          {p.heroImageUrl.trim() && (
            <img src={p.heroImageUrl} alt="Prévia" className="h-36 w-full rounded-xl object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
          )}
          <Field label="Subtítulo do portal">
            <Input value={p.portalSubtitle} onChange={(e) => setP({ ...p, portalSubtitle: e.target.value })} placeholder="Guia digital do hóspede" />
          </Field>
          <Field label="Endereço para delivery" hint="O hóspede copia este endereço para pedir comida por aplicativo.">
            <Input value={p.deliveryAddress} onChange={(e) => setP({ ...p, deliveryAddress: e.target.value })} placeholder="Rua…, nº, bairro, cidade – UF, CEP" />
          </Field>
          <p className="text-xs text-slate-400">💡 Wi-Fi, horários e políticas da casa são editados na aba <strong>Pousada</strong> e aparecem automaticamente no portal.</p>
        </Card>
      )}

      {sub === 'locais' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h4 className="mb-3 text-sm font-bold text-slate-700">📍 Pontos turísticos</h4>
            {p.touristSpots.map((s, i) => (
              <div key={s.id} className="mb-2 flex gap-2">
                <Input className="flex-1" value={s.name} placeholder="Nome do lugar" onChange={(e) => setP({ ...p, touristSpots: p.touristSpots.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
                <Input className="flex-1" value={s.description ?? ''} placeholder="Descrição curta" onChange={(e) => setP({ ...p, touristSpots: p.touristSpots.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)) })} />
                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setP({ ...p, touristSpots: p.touristSpots.filter((_, j) => j !== i) })}><Trash2 size={14} /></Button>
              </div>
            ))}
            <Button size="sm" variant="secondary" onClick={() => setP({ ...p, touristSpots: [...p.touristSpots, { id: newId(), name: '', description: '' }] })}><Plus size={14} /> Adicionar lugar</Button>
          </Card>

          <Card className="p-5">
            <h4 className="mb-3 text-sm font-bold text-slate-700">🍽️ Restaurantes recomendados</h4>
            {p.restaurants.map((r, i) => (
              <div key={r.id} className="mb-2 flex gap-2">
                <Input className="flex-1" value={r.name} placeholder="Nome" onChange={(e) => setP({ ...p, restaurants: p.restaurants.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
                <Input className="w-28" value={r.cuisine ?? ''} placeholder="Cozinha" onChange={(e) => setP({ ...p, restaurants: p.restaurants.map((x, j) => (j === i ? { ...x, cuisine: e.target.value } : x)) })} />
                <Input className="w-32" value={r.phone ?? ''} placeholder="Telefone" onChange={(e) => setP({ ...p, restaurants: p.restaurants.map((x, j) => (j === i ? { ...x, phone: e.target.value } : x)) })} />
                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setP({ ...p, restaurants: p.restaurants.filter((_, j) => j !== i) })}><Trash2 size={14} /></Button>
              </div>
            ))}
            <Button size="sm" variant="secondary" onClick={() => setP({ ...p, restaurants: [...p.restaurants, { id: newId(), name: '', cuisine: '', phone: '' }] })}><Plus size={14} /> Adicionar restaurante</Button>
          </Card>
        </div>
      )}

      {sub === 'tv' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h4 className="mb-3 text-sm font-bold text-slate-700">📺 Canais de TV</h4>
            {p.tvChannels.map((c, i) => (
              <div key={c.id} className="mb-2 flex gap-2">
                <Input className="w-20" value={c.number} placeholder="Nº" onChange={(e) => setP({ ...p, tvChannels: p.tvChannels.map((x, j) => (j === i ? { ...x, number: e.target.value } : x)) })} />
                <Input className="flex-1" value={c.name} placeholder="Nome do canal" onChange={(e) => setP({ ...p, tvChannels: p.tvChannels.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setP({ ...p, tvChannels: p.tvChannels.filter((_, j) => j !== i) })}><Trash2 size={14} /></Button>
              </div>
            ))}
            <Button size="sm" variant="secondary" onClick={() => setP({ ...p, tvChannels: [...p.tvChannels, { id: newId(), number: '', name: '' }] })}><Plus size={14} /> Adicionar canal</Button>
          </Card>

          <Card className="p-5">
            <h4 className="mb-3 text-sm font-bold text-slate-700">🚨 Contatos de emergência</h4>
            {p.emergencyContacts.map((c, i) => (
              <div key={c.id} className="mb-2 flex gap-2">
                <Input className="flex-1" value={c.name} placeholder="Nome (ex.: Hospital)" onChange={(e) => setP({ ...p, emergencyContacts: p.emergencyContacts.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
                <Input className="w-36" value={c.phone} placeholder="Telefone" onChange={(e) => setP({ ...p, emergencyContacts: p.emergencyContacts.map((x, j) => (j === i ? { ...x, phone: e.target.value } : x)) })} />
                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setP({ ...p, emergencyContacts: p.emergencyContacts.filter((_, j) => j !== i) })}><Trash2 size={14} /></Button>
              </div>
            ))}
            <Button size="sm" variant="secondary" onClick={() => setP({ ...p, emergencyContacts: [...p.emergencyContacts, { id: newId(), name: '', phone: '' }] })}><Plus size={14} /> Adicionar contato</Button>
          </Card>
        </div>
      )}

          <div className="flex justify-end">
            <Button onClick={savePortal}>Salvar alterações do portal</Button>
          </div>
        </div>

        {/* Prévia ao vivo */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <PhoneFrame>
            <PortalPreview tenant={tenant} p={p} />
          </PhoneFrame>
        </div>
      </div>
    </div>
  );
}

function copy(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => toast.success(`${label} copiado!`)).catch(() => toast.error('Não foi possível copiar.'));
}

export default function SettingsPage() {
  const { tenant, profile } = useAuth();
  const { users, invites, categories, save, remove, update } = useData();
  const [tab, setTab] = useState<'general' | 'public' | 'portal' | 'messages' | 'team'>('general');
  const [inviteOpen, setInviteOpen] = useState(false);
  const isAdmin = profile?.role === 'admin';

  const [f, setF] = useState({
    name: '', address: '', phone: '', email: '', whatsappNumber: '', description: '',
    checkinTime: '14:00', checkoutTime: '12:00', breakfastTime: '', wifiSsid: '', wifiPassword: '',
    policies: '', publicBookingEnabled: false, guestPortalEnabled: true,
  });

  useEffect(() => {
    if (!tenant) return;
    setF({
      name: tenant.name ?? '',
      address: tenant.address ?? '',
      phone: tenant.phone ?? '',
      email: tenant.email ?? '',
      whatsappNumber: tenant.whatsappNumber ?? '',
      description: tenant.description ?? '',
      checkinTime: tenant.checkinTime ?? '14:00',
      checkoutTime: tenant.checkoutTime ?? '12:00',
      breakfastTime: tenant.breakfastTime ?? '',
      wifiSsid: tenant.wifiSsid ?? '',
      wifiPassword: tenant.wifiPassword ?? '',
      policies: tenant.policies ?? '',
      publicBookingEnabled: tenant.publicBookingEnabled ?? false,
      guestPortalEnabled: tenant.guestPortalEnabled ?? true,
    });
  }, [tenant?.id]);

  const saveTenant = async () => {
    if (!tenant) return;
    if (!f.name.trim()) return toast.error('O nome da pousada é obrigatório.');
    await setDoc(doc(db, 'tenants', tenant.id), { ...f, name: f.name.trim() }, { merge: true });
    toast.success('Configurações salvas.');
  };

  const base = window.location.origin;
  const publicUrl = `${base}/p/${tenant?.slug}`;

  const genInvite = async (role: Role) => {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    await save('invites', { id: code, role, used: false, createdAt: new Date().toISOString() });
    setInviteOpen(false);
    copy(code, 'Código de convite');
  };

  return (
    <>
      <PageHeader title="Configurações" subtitle={tenant?.name} />

      <div className="mb-4 flex gap-1 rounded-xl bg-slate-100 p-1 sm:w-fit">
        {([['general', 'Pousada'], ['public', 'Páginas públicas'], ['portal', 'Portal do hóspede'], ['messages', 'Mensagens'], ['team', 'Usuários']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 rounded-lg px-4 py-2 text-sm font-bold transition cursor-pointer sm:flex-none', tab === t ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-500')}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <Card className="p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome da pousada" required><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Telefone"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
            <Field label="WhatsApp (com DDI, só números)" hint="Ex.: 5511999998888"><Input value={f.whatsappNumber} onChange={(e) => setF({ ...f, whatsappNumber: e.target.value })} /></Field>
            <Field label="E-mail"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
            <div className="sm:col-span-2"><Field label="Endereço"><Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field></div>
            <Field label="Horário de check-in"><Input type="time" value={f.checkinTime} onChange={(e) => setF({ ...f, checkinTime: e.target.value })} /></Field>
            <Field label="Horário de check-out"><Input type="time" value={f.checkoutTime} onChange={(e) => setF({ ...f, checkoutTime: e.target.value })} /></Field>
            <Field label="Café da manhã" hint="Ex.: 07:30 às 10:00"><Input value={f.breakfastTime} onChange={(e) => setF({ ...f, breakfastTime: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Wi-Fi (rede)"><Input value={f.wifiSsid} onChange={(e) => setF({ ...f, wifiSsid: e.target.value })} /></Field>
              <Field label="Wi-Fi (senha)"><Input value={f.wifiPassword} onChange={(e) => setF({ ...f, wifiPassword: e.target.value })} /></Field>
            </div>
            <div className="sm:col-span-2"><Field label="Descrição (aparece na página pública)"><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field></div>
            <div className="sm:col-span-2"><Field label="Políticas da casa"><Textarea value={f.policies} onChange={(e) => setF({ ...f, policies: e.target.value })} placeholder="Horários de silêncio, animais, cancelamento…" /></Field></div>
          </div>
          <div className="mt-4 flex justify-end"><Button onClick={saveTenant}>Salvar alterações</Button></div>
        </Card>
      )}

      {tab === 'public' && (
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 font-bold text-slate-800"><Globe size={17} className="text-brand-600" /> Página de reservas online</h3>
                <p className="mt-1 text-sm text-slate-500">Seus hóspedes consultam disponibilidade e enviam pedidos de reserva. Você aprova cada pedido antes de virar reserva.</p>
              </div>
              <button
                onClick={() => { setF((x) => ({ ...x, publicBookingEnabled: !x.publicBookingEnabled })); if (tenant) setDoc(doc(db, 'tenants', tenant.id), { publicBookingEnabled: !f.publicBookingEnabled }, { merge: true }); }}
                className={cn('h-7 w-12 shrink-0 rounded-full p-1 transition-colors cursor-pointer', f.publicBookingEnabled ? 'bg-brand-600' : 'bg-slate-300')}
              >
                <span className={cn('block h-5 w-5 rounded-full bg-white transition-transform', f.publicBookingEnabled && 'translate-x-5')} />
              </button>
            </div>
            {f.publicBookingEnabled && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 p-3">
                <Link2 size={15} className="shrink-0 text-slate-400" />
                <code className="min-w-0 flex-1 truncate text-xs text-slate-600">{publicUrl}</code>
                <Button size="sm" variant="outline" onClick={() => copy(publicUrl, 'Link')}><Copy size={13} /> Copiar</Button>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 font-bold text-slate-800"><Settings2 size={17} className="text-brand-600" /> Portal do hóspede</h3>
                <p className="mt-1 text-sm text-slate-500">Página com Wi-Fi, horários, políticas e contatos. Compartilhe com quem já fez check-in.</p>
              </div>
              <button
                onClick={() => { setF((x) => ({ ...x, guestPortalEnabled: !x.guestPortalEnabled })); if (tenant) setDoc(doc(db, 'tenants', tenant.id), { guestPortalEnabled: !f.guestPortalEnabled }, { merge: true }); }}
                className={cn('h-7 w-12 shrink-0 rounded-full p-1 transition-colors cursor-pointer', f.guestPortalEnabled ? 'bg-brand-600' : 'bg-slate-300')}
              >
                <span className={cn('block h-5 w-5 rounded-full bg-white transition-transform', f.guestPortalEnabled && 'translate-x-5')} />
              </button>
            </div>
            {f.guestPortalEnabled && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 p-3">
                <Link2 size={15} className="shrink-0 text-slate-400" />
                <code className="min-w-0 flex-1 truncate text-xs text-slate-600">{publicUrl}/portal</code>
                <Button size="sm" variant="outline" onClick={() => copy(`${publicUrl}/portal`, 'Link')}><Copy size={13} /> Copiar</Button>
              </div>
            )}
          </Card>

          {tenant && <BookingPageEditor tenant={tenant} categories={categories} publicUrl={publicUrl} />}

          <Card className="p-5">
            <h3 className="font-bold text-slate-800">Ficha FNRH digital</h3>
            <p className="mt-1 text-sm text-slate-500">Envie este link para o hóspede preencher a Ficha Nacional de Registro de Hóspedes antes do check-in.</p>
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 p-3">
              <Link2 size={15} className="shrink-0 text-slate-400" />
              <code className="min-w-0 flex-1 truncate text-xs text-slate-600">{publicUrl}/fnrh</code>
              <Button size="sm" variant="outline" onClick={() => copy(`${publicUrl}/fnrh`, 'Link')}><Copy size={13} /> Copiar</Button>
            </div>
          </Card>
        </div>
      )}

      {tab === 'portal' && tenant && <PortalEditor tenantId={tenant.id} tenant={tenant} publicUrl={publicUrl} />}

      {tab === 'messages' && tenant && <MessagesEditor tenant={tenant} />}

      {tab === 'team' && (
        <div className="space-y-4">
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-bold text-slate-800"><UsersRound size={17} className="text-brand-600" /> Usuários do sistema</h3>
              {isAdmin && <Button size="sm" onClick={() => setInviteOpen(true)}><UserPlus size={14} /> Convidar</Button>}
            </div>
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800">{u.name} {u.id === profile?.id && <span className="text-xs font-normal text-slate-400">(você)</span>}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                  {isAdmin && u.id !== profile?.id ? (
                    <>
                      <Select
                        className="h-8 w-40 text-xs"
                        value={u.role}
                        onChange={async (e) => {
                          const { updateDoc, doc: d } = await import('firebase/firestore');
                          await updateDoc(d(db, 'users', u.id), { role: e.target.value });
                          toast.success('Função atualizada.');
                        }}
                      >
                        {(Object.keys(ROLE_LABELS) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                      </Select>
                      <button
                        onClick={async () => {
                          const { updateDoc, doc: d } = await import('firebase/firestore');
                          await updateDoc(d(db, 'users', u.id), { status: u.status === 'active' ? 'inactive' : 'active' });
                        }}
                        className="cursor-pointer"
                      >
                        <Badge color={u.status === 'active' ? 'green' : 'red'}>{u.status === 'active' ? 'Ativo' : 'Inativo'}</Badge>
                      </button>
                    </>
                  ) : (
                    <Badge color="teal">{ROLE_LABELS[u.role]}</Badge>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {isAdmin && (
            <Card className="p-5">
              <h3 className="mb-1 font-bold text-slate-800">Convites pendentes</h3>
              <p className="mb-3 text-xs text-slate-400">
                Passe o <strong>ID da pousada</strong> ({tenant?.id ? <button onClick={() => copy(tenant.id, 'ID da pousada')} className="font-mono text-brand-700 underline cursor-pointer">{tenant.id.slice(0, 12)}…</button> : '—'}) e o código para a pessoa criar a conta em "Tenho um código de convite".
              </p>
              {invites.filter((i) => !i.used).length === 0 ? (
                <p className="text-sm text-slate-400">Nenhum convite ativo.</p>
              ) : (
                <div className="space-y-2">
                  {invites.filter((i) => !i.used).map((i) => (
                    <div key={i.id} className="flex items-center gap-2 rounded-xl border border-slate-100 px-3 py-2">
                      <code className="font-mono text-sm font-bold text-brand-800">{i.id}</code>
                      <Badge color="gray">{ROLE_LABELS[i.role]}</Badge>
                      <span className="flex-1" />
                      <Button size="sm" variant="ghost" onClick={() => copy(i.id, 'Código')}><Copy size={13} /></Button>
                      <Button size="sm" variant="ghost" className="text-red-500" onClick={() => remove('invites', i.id)}><Trash2 size={13} /></Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Convidar para a equipe">
        <p className="mb-4 text-sm text-slate-500">Escolha a função do novo usuário. Um código será gerado e copiado — envie junto com o ID da pousada.</p>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(ROLE_LABELS) as Role[]).filter((r) => r !== 'admin').map((r) => (
            <Button key={r} variant="secondary" onClick={() => genInvite(r)}><Plus size={14} /> {ROLE_LABELS[r]}</Button>
          ))}
        </div>
      </Modal>
    </>
  );
}
