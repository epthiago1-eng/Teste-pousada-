import { useMemo, useState, type ChangeEvent } from 'react';
import { toast } from 'sonner';
import { Phone, Plus, Search, Trash2, UserRound, Users } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Badge, Button, Card, ConfirmDialog, EmptyState, Field, Input, Modal, PageHeader, Textarea } from '../components/ui';
import type { Client } from '../types';
import { fmtDate } from '../lib/utils';

export default function ClientsPage() {
  const { clients, bookings, save, remove } = useData();
  const [q, setQ] = useState('');
  const [modal, setModal] = useState<Client | 'new' | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return clients
      .filter((c) => !term || c.name.toLowerCase().includes(term) || c.phone?.includes(term) || c.document?.includes(term) || c.email?.toLowerCase().includes(term))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [clients, q]);

  const staysCount = (id: string) => bookings.filter((b) => b.clientId === id && !['cancelled', 'no-show', 'blocked'].includes(b.status)).length;

  return (
    <>
      <PageHeader title="Clientes" subtitle={`${clients.length} cadastrado(s)`} actions={<Button onClick={() => setModal('new')}><Plus size={16} /> Novo cliente</Button>} />

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input className="pl-9" placeholder="Buscar por nome, telefone, documento…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum cliente encontrado" action={<Button onClick={() => setModal('new')}>Novo cliente</Button>} />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {filtered.map((c) => {
            const stays = staysCount(c.id);
            return (
              <Card key={c.id} onClick={() => setModal(c)} className="flex items-center gap-3 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-800">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-slate-800">{c.name}</p>
                  <p className="flex items-center gap-1 text-xs text-slate-400">
                    {c.phone && <><Phone size={11} /> {c.phone}</>}
                    {c.city && <span>· {c.city}{c.state ? `/${c.state}` : ''}</span>}
                  </p>
                </div>
                {stays > 1 && <Badge color="teal">{stays} estadias</Badge>}
              </Card>
            );
          })}
        </div>
      )}

      {modal && (
        <ClientModal
          client={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={async (data) => { await save('clients', data); toast.success('Cliente salvo.'); setModal(null); }}
          onDelete={modal !== 'new' ? () => { setDeleting((modal as Client).id); setModal(null); } : undefined}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => { if (deleting) { remove('clients', deleting); toast.success('Cliente excluído.'); } }}
        title="Excluir cliente"
        message="O histórico de reservas será mantido, mas sem o vínculo com o cadastro. Continuar?"
        confirmLabel="Excluir"
        danger
      />
    </>
  );
}

function ClientModal({ client, onClose, onSave, onDelete }: {
  client: Client | null;
  onClose: () => void;
  onSave: (data: Partial<Client> & { id?: string }) => void;
  onDelete?: () => void;
}) {
  const [f, setF] = useState({
    name: client?.name ?? '',
    phone: client?.phone ?? '',
    email: client?.email ?? '',
    document: client?.document ?? '',
    birthDate: client?.birthDate ?? '',
    nationality: client?.nationality ?? 'Brasileira',
    city: client?.city ?? '',
    state: client?.state ?? '',
    address: client?.address ?? '',
    notes: client?.notes ?? '',
  });
  const set = (k: keyof typeof f) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <Modal open onClose={onClose} title={client ? client.name : 'Novo cliente'} wide
      footer={
        <>
          {onDelete && <Button variant="ghost" className="mr-auto text-red-600" onClick={onDelete}><Trash2 size={15} /> Excluir</Button>}
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => {
            if (!f.name.trim()) return toast.error('Informe o nome.');
            if (!f.phone.trim()) return toast.error('Informe o telefone.');
            if (!f.document.trim()) return toast.error('Informe o documento (CPF/RG).');
            onSave({ id: client?.id, ...f, createdAt: client?.createdAt ?? new Date().toISOString() });
          }}>Salvar</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Nome completo" required><Input value={f.name} onChange={set('name')} /></Field></div>
        <Field label="Telefone / WhatsApp" required><Input value={f.phone} onChange={set('phone')} placeholder="(00) 90000-0000" /></Field>
        <Field label="E-mail"><Input type="email" value={f.email} onChange={set('email')} /></Field>
        <Field label="CPF / documento" required><Input value={f.document} onChange={set('document')} /></Field>
        <Field label="Data de nascimento"><Input type="date" value={f.birthDate} onChange={set('birthDate')} /></Field>
        <Field label="Nacionalidade"><Input value={f.nationality} onChange={set('nationality')} /></Field>
        <Field label="Cidade"><Input value={f.city} onChange={set('city')} /></Field>
        <Field label="UF"><Input value={f.state} onChange={set('state')} maxLength={2} placeholder="SP" /></Field>
        <Field label="Endereço"><Input value={f.address} onChange={set('address')} /></Field>
        <div className="sm:col-span-2">
          <Field label="Observações"><Textarea value={f.notes} onChange={set('notes')} placeholder="Preferências, alergias, cliente VIP…" /></Field>
        </div>
      </div>
    </Modal>
  );
}
