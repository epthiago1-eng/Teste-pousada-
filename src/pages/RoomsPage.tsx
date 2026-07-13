import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BedDouble, Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Badge, Button, Card, ConfirmDialog, EmptyState, Field, ImageUrlField, Input, Modal, PageHeader, Select, Textarea, UploadPhotoButton } from '../components/ui';
import type { Room, RoomCategory, RoomStatus } from '../types';
import { ROOM_STATUS_LABELS } from '../types';
import { brl, cn, isActiveBooking, todayISO } from '../lib/utils';

const statusColor: Record<RoomStatus, 'green' | 'red' | 'yellow' | 'blue' | 'gray'> = {
  clean: 'green',
  dirty: 'red',
  cleaning: 'yellow',
  inspected: 'blue',
  maintenance: 'gray',
};

export default function RoomsPage() {
  const { profile } = useAuth();
  const { rooms, categories, bookings, save, remove } = useData();
  const [tab, setTab] = useState<'rooms' | 'categories'>('rooms');
  const [roomModal, setRoomModal] = useState<Room | 'new' | null>(null);
  const [catModal, setCatModal] = useState<RoomCategory | 'new' | null>(null);
  const [deleting, setDeleting] = useState<{ type: 'room' | 'cat'; id: string } | null>(null);

  const canManage = profile?.role === 'admin' || profile?.role === 'manager';
  const today = todayISO();

  const occupiedRoomIds = useMemo(
    () => new Set(bookings.filter((b) => isActiveBooking(b) && b.checkIn <= today && b.checkOut > today && b.status !== 'pre-booking').map((b) => b.roomId)),
    [bookings, today]
  );

  const sortedRooms = rooms.slice().sort((a, b) => a.number.localeCompare(b.number, 'pt-BR', { numeric: true }));

  return (
    <>
      <PageHeader
        title="Quartos"
        subtitle={`${rooms.length} quarto(s) em ${categories.length} categoria(s)`}
        actions={
          canManage && (
            tab === 'rooms'
              ? <Button onClick={() => setRoomModal('new')}><Plus size={16} /> Novo quarto</Button>
              : <Button onClick={() => setCatModal('new')}><Plus size={16} /> Nova categoria</Button>
          )
        }
      />

      <div className="mb-4 flex gap-1 rounded-xl bg-slate-100 p-1 sm:w-fit">
        {(['rooms', 'categories'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 rounded-lg px-4 py-2 text-sm font-bold transition cursor-pointer sm:flex-none',
              tab === t ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {t === 'rooms' ? 'Quartos' : 'Categorias'}
          </button>
        ))}
      </div>

      {tab === 'rooms' ? (
        sortedRooms.length === 0 ? (
          <EmptyState
            icon={BedDouble}
            title="Nenhum quarto cadastrado"
            subtitle={categories.length === 0 ? 'Crie primeiro uma categoria (ex.: Standard, Suíte) e depois adicione os quartos.' : 'Adicione os quartos da sua pousada.'}
            action={canManage ? (categories.length === 0 ? <Button onClick={() => { setTab('categories'); setCatModal('new'); }}>Criar categoria</Button> : <Button onClick={() => setRoomModal('new')}>Novo quarto</Button>) : undefined}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {sortedRooms.map((room) => {
              const cat = categories.find((c) => c.id === room.categoryId);
              const occupied = occupiedRoomIds.has(room.id);
              return (
                <Card key={room.id} className="p-4" onClick={canManage ? () => setRoomModal(room) : undefined}>
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-lg font-extrabold text-brand-800">
                      {room.number}
                    </div>
                    <Badge color={occupied ? 'purple' : 'teal'}>{occupied ? 'Ocupado' : 'Livre'}</Badge>
                  </div>
                  <p className="text-sm font-bold text-slate-800">{cat?.name ?? 'Sem categoria'}</p>
                  <p className="text-xs text-slate-400">{brl(room.price ?? cat?.basePrice ?? 0)}/noite</p>
                  <div className="mt-2">
                    <Badge color={statusColor[room.status]}>{ROOM_STATUS_LABELS[room.status]}</Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : categories.length === 0 ? (
        <EmptyState icon={Layers} title="Nenhuma categoria" subtitle='Categorias agrupam quartos parecidos (ex.: "Standard", "Suíte Master") e definem o preço base.' action={canManage ? <Button onClick={() => setCatModal('new')}>Nova categoria</Button> : undefined} />
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <Card key={cat.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-bold text-slate-800">{cat.name}</p>
                <p className="text-xs text-slate-400">
                  Até {cat.maxGuests} hóspedes · {brl(cat.basePrice)}/noite · {rooms.filter((r) => r.categoryId === cat.id).length} quarto(s)
                </p>
              </div>
              {canManage && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setCatModal(cat)}><Pencil size={15} /></Button>
                  <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setDeleting({ type: 'cat', id: cat.id })}><Trash2 size={15} /></Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {roomModal && (
        <RoomModal
          room={roomModal === 'new' ? null : roomModal}
          categories={categories}
          tenantId={profile?.tenantId}
          onClose={() => setRoomModal(null)}
          onSave={async (data) => { await save('rooms', data); toast.success('Quarto salvo.'); setRoomModal(null); }}
          onDelete={roomModal !== 'new' ? () => { setDeleting({ type: 'room', id: (roomModal as Room).id }); setRoomModal(null); } : undefined}
        />
      )}
      {catModal && (
        <CategoryModal
          category={catModal === 'new' ? null : catModal}
          tenantId={profile?.tenantId}
          onClose={() => setCatModal(null)}
          onSave={async (data) => { await save('categories', data); toast.success('Categoria salva.'); setCatModal(null); }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          if (deleting.type === 'cat' && rooms.some((r) => r.categoryId === deleting.id)) {
            toast.error('Há quartos nesta categoria. Mova-os antes de excluir.');
            return;
          }
          remove(deleting.type === 'room' ? 'rooms' : 'categories', deleting.id);
          toast.success('Excluído.');
        }}
        title="Confirmar exclusão"
        message="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        danger
      />
    </>
  );
}

const MAX_ROOM_PHOTOS = 6;

function RoomModal({ room, categories, tenantId, onClose, onSave, onDelete }: {
  room: Room | null;
  categories: RoomCategory[];
  tenantId: string | undefined;
  onClose: () => void;
  onSave: (data: Partial<Room> & { id?: string }) => void;
  onDelete?: () => void;
}) {
  const [modalTab, setModalTab] = useState<'dados' | 'fotos'>('dados');
  const [photos, setPhotos] = useState<string[]>(room?.photos ?? []);
  const [newUrl, setNewUrl] = useState('');
  const [f, setF] = useState({
    number: room?.number ?? '',
    categoryId: room?.categoryId ?? categories[0]?.id ?? '',
    status: room?.status ?? ('clean' as RoomStatus),
    price: room?.price ?? 0,
    description: room?.description ?? '',
    singleBeds: room?.singleBeds ?? 0,
    doubleBeds: room?.doubleBeds ?? 1,
  });

  const addPhoto = () => {
    const url = newUrl.trim();
    if (!url) return;
    if (photos.length >= MAX_ROOM_PHOTOS) return toast.error(`Máximo de ${MAX_ROOM_PHOTOS} fotos por quarto.`);
    setPhotos([...photos, url]);
    setNewUrl('');
  };
  const makeMain = (i: number) => setPhotos([photos[i], ...photos.filter((_, j) => j !== i)]);

  return (
    <Modal open onClose={onClose} title={room ? `Editar quarto ${room.number}` : 'Novo quarto'} wide
      footer={
        <>
          {onDelete && <Button variant="ghost" className="mr-auto text-red-600" onClick={onDelete}><Trash2 size={15} /> Excluir</Button>}
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => {
            if (!f.number.trim()) return toast.error('Informe o número do quarto.');
            if (!f.categoryId) return toast.error('Selecione a categoria.');
            onSave({ id: room?.id, ...f, price: f.price || undefined, photos });
          }}>Salvar</Button>
        </>
      }
    >
      {/* Abas */}
      <div className="mb-4 flex gap-1 rounded-xl bg-slate-100 p-1">
        {([['dados', '🛏️ Dados'], ['fotos', `📷 Fotos (${photos.length})`]] as const).map(([t, label]) => (
          <button key={t} onClick={() => setModalTab(t)} className={cn('flex-1 rounded-lg px-3 py-2 text-sm font-bold transition cursor-pointer', modalTab === t ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-500')}>
            {label}
          </button>
        ))}
      </div>

      {modalTab === 'fotos' ? (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Adicione até {MAX_ROOM_PHOTOS} fotos — envie direto do celular ou cole um link. A <strong>primeira é a principal</strong> — é ela que aparece em destaque na página de reservas.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://…/foto-do-quarto.jpg" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPhoto())} />
            <div className="flex gap-2">
              <Button variant="secondary" onClick={addPhoto} disabled={photos.length >= MAX_ROOM_PHOTOS}><Plus size={15} /> Adicionar link</Button>
              <UploadPhotoButton
                tenantId={tenantId}
                folder="rooms"
                onUploaded={(url) => {
                  if (photos.length >= MAX_ROOM_PHOTOS) return toast.error(`Máximo de ${MAX_ROOM_PHOTOS} fotos por quarto.`);
                  setPhotos((prev) => [...prev, url]);
                }}
              />
            </div>
          </div>
          {photos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
              Nenhuma foto ainda. Envie do celular ou cole o link de uma imagem acima. 📷
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((url, i) => (
                <div key={i} className={cn('group relative overflow-hidden rounded-xl border-2', i === 0 ? 'border-brand-600' : 'border-transparent')}>
                  <img src={url} alt={`Foto ${i + 1}`} className="h-28 w-full bg-slate-100 object-cover" onError={(e) => ((e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f1f5f9" width="100" height="100"/><text x="50" y="55" font-size="10" text-anchor="middle" fill="%2394a3b8">link inválido</text></svg>')} />
                  {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-brand-700 px-2 py-0.5 text-[10px] font-bold text-white shadow">⭐ Principal</span>}
                  <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-slate-900/70 to-transparent p-1.5 opacity-0 transition group-hover:opacity-100">
                    {i !== 0 ? (
                      <button onClick={() => makeMain(i)} className="rounded-lg bg-white/90 px-2 py-1 text-[10px] font-bold text-slate-700 cursor-pointer">⭐ Tornar principal</button>
                    ) : <span />}
                    <button onClick={() => setPhotos(photos.filter((_, j) => j !== i))} className="rounded-lg bg-red-500/90 px-2 py-1 text-[10px] font-bold text-white cursor-pointer">Remover</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Número / nome" required><Input value={f.number} onChange={(e) => setF({ ...f, number: e.target.value })} placeholder="101" /></Field>
        <Field label="Categoria" required>
          <Select value={f.categoryId} onChange={(e) => setF({ ...f, categoryId: e.target.value })}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Status de limpeza">
          <Select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as RoomStatus })}>
            {(Object.keys(ROOM_STATUS_LABELS) as RoomStatus[]).map((s) => <option key={s} value={s}>{ROOM_STATUS_LABELS[s]}</option>)}
          </Select>
        </Field>
        <Field label="Preço próprio (opcional)" hint="Se vazio, usa o preço da categoria/tarifa">
          <Input type="number" min={0} step="0.01" value={f.price || ''} onChange={(e) => setF({ ...f, price: Number(e.target.value) })} placeholder="0,00" />
        </Field>
        <Field label="Camas de casal"><Input type="number" min={0} value={f.doubleBeds} onChange={(e) => setF({ ...f, doubleBeds: Number(e.target.value) })} /></Field>
        <Field label="Camas de solteiro"><Input type="number" min={0} value={f.singleBeds} onChange={(e) => setF({ ...f, singleBeds: Number(e.target.value) })} /></Field>
        <div className="sm:col-span-2">
          <Field label="Descrição"><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Vista para o mar, varanda…" /></Field>
        </div>
      </div>
      )}
    </Modal>
  );
}

function CategoryModal({ category, tenantId, onClose, onSave }: {
  category: RoomCategory | null;
  tenantId: string | undefined;
  onClose: () => void;
  onSave: (data: Partial<RoomCategory> & { id?: string }) => void;
}) {
  const [f, setF] = useState({
    name: category?.name ?? '',
    maxGuests: category?.maxGuests ?? 2,
    basePrice: category?.basePrice ?? 0,
    description: category?.description ?? '',
    photoUrl: category?.photos?.[0] ?? '',
  });
  return (
    <Modal open onClose={onClose} title={category ? 'Editar categoria' : 'Nova categoria'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => {
            if (!f.name.trim()) return toast.error('Informe o nome.');
            if (f.basePrice <= 0) return toast.error('Informe o preço base por noite.');
            const { photoUrl, ...rest } = f;
            onSave({ id: category?.id, ...rest, photos: photoUrl.trim() ? [photoUrl.trim()] : [] });
          }}>Salvar</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Nome" required><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Suíte Master" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Máx. de hóspedes"><Input type="number" min={1} value={f.maxGuests} onChange={(e) => setF({ ...f, maxGuests: Number(e.target.value) })} /></Field>
          <Field label="Preço base/noite" required><Input type="number" min={0} step="0.01" value={f.basePrice || ''} onChange={(e) => setF({ ...f, basePrice: Number(e.target.value) })} placeholder="250,00" /></Field>
        </div>
        <Field label="Descrição (aparece na página pública)"><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Quarto amplo com ar-condicionado, frigobar…" /></Field>
        <Field label="Foto do quarto" hint="Envie do celular ou cole o link de uma imagem. Aparece na página de reservas.">
          <ImageUrlField value={f.photoUrl} onChange={(url) => setF({ ...f, photoUrl: url })} tenantId={tenantId} folder="categories" placeholder="https://…/foto-do-quarto.jpg" />
        </Field>
        {f.photoUrl.trim() && (
          <img src={f.photoUrl} alt="Prévia da foto" className="h-32 w-full rounded-xl object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
        )}
      </div>
    </Modal>
  );
}
