import { useMemo, useState } from 'react';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { ArrowDownCircle, ArrowUpCircle, DollarSign, Plus, Trash2, TrendingUp } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Badge, Button, Card, ConfirmDialog, EmptyState, Field, Input, Modal, PageHeader, Select, Stat } from '../components/ui';
import type { Transaction } from '../types';
import { TRANSACTION_CATEGORY_LABELS } from '../types';
import { brl, fmtDate, todayISO } from '../lib/utils';

export default function FinancePage() {
  const { transactions, save, remove } = useData();
  const [month, setMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [modal, setModal] = useState<null | 'income' | 'expense'>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const monthOptions = useMemo(
    () => Array.from({ length: 12 }, (_, i) => format(subMonths(new Date(), i), 'yyyy-MM')),
    []
  );

  const monthTx = useMemo(
    () => transactions.filter((t) => t.date.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, month]
  );

  const income = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <>
      <PageHeader
        title="Financeiro"
        subtitle="Receitas e despesas da pousada"
        actions={
          <>
            <Button variant="outline" onClick={() => setModal('expense')}><ArrowDownCircle size={16} className="text-red-500" /> Despesa</Button>
            <Button onClick={() => setModal('income')}><ArrowUpCircle size={16} /> Receita</Button>
          </>
        }
      />

      <div className="mb-4">
        <Select className="w-full sm:w-56" value={month} onChange={(e) => setMonth(e.target.value)}>
          {monthOptions.map((m) => (
            <option key={m} value={m}>{format(new Date(m + '-02'), "MMMM 'de' yyyy", { locale: ptBR })}</option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Receitas" value={brl(income)} icon={ArrowUpCircle} tone="emerald" />
        <Stat label="Despesas" value={brl(expense)} icon={ArrowDownCircle} tone="red" />
        <Stat label="Resultado" value={brl(income - expense)} icon={TrendingUp} tone={income - expense >= 0 ? 'teal' : 'amber'} />
      </div>

      <div className="mt-5">
        {monthTx.length === 0 ? (
          <EmptyState icon={DollarSign} title="Nenhum lançamento neste mês" subtitle="Registre receitas e despesas, ou faça check-outs para lançar hospedagens automaticamente." />
        ) : (
          <div className="space-y-2">
            {monthTx.map((t) => (
              <Card key={t.id} className="flex items-center gap-3 p-3.5">
                <div className={`rounded-xl p-2 ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                  {t.type === 'income' ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-800">{t.description}</p>
                  <p className="text-xs text-slate-400">{fmtDate(t.date)} · <Badge color="gray">{TRANSACTION_CATEGORY_LABELS[t.category]}</Badge></p>
                </div>
                <p className={`font-extrabold ${t.type === 'income' ? 'text-emerald-700' : 'text-red-600'}`}>
                  {t.type === 'income' ? '+' : '−'} {brl(t.amount)}
                </p>
                <button onClick={() => setDeleting(t.id)} className="p-1 text-slate-300 hover:text-red-500 cursor-pointer"><Trash2 size={15} /></button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <TransactionModal
          type={modal}
          onClose={() => setModal(null)}
          onSave={async (data) => { await save('transactions', data); toast.success('Lançamento salvo.'); setModal(null); }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => { if (deleting) { remove('transactions', deleting); toast.success('Lançamento excluído.'); } }}
        title="Excluir lançamento"
        message="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        danger
      />
    </>
  );
}

function TransactionModal({ type, onClose, onSave }: {
  type: 'income' | 'expense';
  onClose: () => void;
  onSave: (data: Partial<Transaction>) => void;
}) {
  const [f, setF] = useState({
    description: '',
    amount: 0,
    category: (type === 'income' ? 'booking' : 'supplies') as Transaction['category'],
    date: todayISO(),
  });
  return (
    <Modal open onClose={onClose} title={type === 'income' ? 'Nova receita' : 'Nova despesa'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => {
            if (!f.description.trim()) return toast.error('Informe a descrição.');
            if (f.amount <= 0) return toast.error('Informe um valor válido.');
            onSave({ ...f, type });
          }}>Salvar</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Descrição" required><Input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder={type === 'income' ? 'Ex.: day use, aluguel de espaço' : 'Ex.: conta de luz, compras do café'} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor" required><Input type="number" min={0} step="0.01" value={f.amount || ''} onChange={(e) => setF({ ...f, amount: Number(e.target.value) })} placeholder="0,00" /></Field>
          <Field label="Data"><Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
        </div>
        <Field label="Categoria">
          <Select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as Transaction['category'] })}>
            {(Object.keys(TRANSACTION_CATEGORY_LABELS) as Transaction['category'][]).map((c) => (
              <option key={c} value={c}>{TRANSACTION_CATEGORY_LABELS[c]}</option>
            ))}
          </Select>
        </Field>
      </div>
    </Modal>
  );
}
