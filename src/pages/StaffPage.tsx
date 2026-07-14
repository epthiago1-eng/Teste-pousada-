import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, UsersRound, Wallet } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Button, Card, ConfirmDialog, EmptyState, Field, Input, Modal, PageHeader, Textarea } from '../components/ui';
import type { Staff } from '../types';
import { brl, fmtDate, formatPhoneBR, todayISO } from '../lib/utils';

export default function StaffPage() {
  const { staff, save, remove } = useData();
  const [modal, setModal] = useState<Staff | 'new' | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [paying, setPaying] = useState<Staff | null>(null);

  const paySalary = async (s: Staff) => {
    await save('transactions', {
      type: 'expense',
      category: 'staff',
      amount: s.salary ?? 0,
      description: `Salário — ${s.name}`,
      date: todayISO(),
    });
    await save('staff', { id: s.id, lastPaymentDate: todayISO() });
    toast.success(`Pagamento de ${s.name} registrado no financeiro.`);
  };

  return (
    <>
      <PageHeader title="Equipe" subtitle={`${staff.length} funcionário(s)`} actions={<Button onClick={() => setModal('new')}><Plus size={16} /> Novo funcionário</Button>} />

      {staff.length === 0 ? (
        <EmptyState icon={UsersRound} title="Nenhum funcionário cadastrado" subtitle="Cadastre sua equipe para controlar funções e pagamentos." action={<Button onClick={() => setModal('new')}>Novo funcionário</Button>} />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {staff.slice().sort((a, b) => a.name.localeCompare(b.name)).map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3" onClick={() => setModal(s)} role="button">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-100 font-bold text-violet-700">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.role}{s.phone ? ` · ${s.phone}` : ''}</p>
                  </div>
                </div>
                <button onClick={() => setDeleting(s.id)} className="p-1 text-slate-300 hover:text-red-500 cursor-pointer"><Trash2 size={15} /></button>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <div className="text-xs text-slate-500">
                  {s.salary ? <><strong>{brl(s.salary)}</strong>/mês</> : 'Sem salário definido'}
                  {s.lastPaymentDate && <span className="block text-slate-400">Último pgto: {fmtDate(s.lastPaymentDate)}</span>}
                </div>
                {!!s.salary && <Button size="sm" variant="secondary" onClick={() => setPaying(s)}><Wallet size={14} /> Pagar</Button>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {modal && (
        <StaffModal
          member={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={async (data) => { await save('staff', data); toast.success('Funcionário salvo.'); setModal(null); }}
        />
      )}

      <ConfirmDialog
        open={Boolean(paying)}
        onClose={() => setPaying(null)}
        onConfirm={() => paying && paySalary(paying)}
        title="Registrar pagamento de salário"
        message={paying ? `Registrar despesa de ${brl(paying.salary ?? 0)} para ${paying.name}?` : ''}
        confirmLabel="Registrar"
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => { if (deleting) { remove('staff', deleting); toast.success('Funcionário removido.'); } }}
        title="Remover funcionário"
        message="Esta ação não pode ser desfeita."
        confirmLabel="Remover"
        danger
      />
    </>
  );
}

function StaffModal({ member, onClose, onSave }: {
  member: Staff | null;
  onClose: () => void;
  onSave: (data: Partial<Staff> & { id?: string }) => void;
}) {
  const [f, setF] = useState({
    name: member?.name ?? '',
    role: member?.role ?? '',
    phone: member?.phone ?? '',
    salary: member?.salary ?? 0,
    notes: member?.notes ?? '',
  });
  return (
    <Modal open onClose={onClose} title={member ? member.name : 'Novo funcionário'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => {
            if (!f.name.trim()) return toast.error('Informe o nome.');
            if (!f.role.trim()) return toast.error('Informe a função.');
            onSave({ id: member?.id, ...f });
          }}>Salvar</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Nome" required><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Função" required><Input value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} placeholder="Camareira, recepção…" /></Field>
          <Field label="Telefone"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: formatPhoneBR(e.target.value) })} inputMode="tel" /></Field>
        </div>
        <Field label="Salário mensal"><Input type="number" min={0} step="0.01" value={f.salary || ''} onChange={(e) => setF({ ...f, salary: Number(e.target.value) })} placeholder="0,00" /></Field>
        <Field label="Observações"><Textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}
