import { Fragment, useMemo, useState } from 'react';
import { addDays, format, isToday, isWeekend, parseISO, startOfDay, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  ArrowLeft, ArrowRight, Calendar as CalendarIcon, ChevronDown, ChevronRight, Pencil, PencilRuler,
  Plus, Tags, Trash2,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { Badge, Button, ConfirmDialog, EmptyState, Field, Input, Modal, PageHeader, Select, Textarea } from '../components/ui';
import type { RatePlan, RoomCategory } from '../types';
import { brl, cn, planPriceForDate, todayISO } from '../lib/utils';

const NUM_DAYS = 15;
const CELL = 82;

const MEAL_LABELS: Record<NonNullable<RatePlan['mealPlan']>, string> = {
  'room-only': 'Só hospedagem',
  breakfast: 'Com café da manhã',
  'half-board': 'Meia pensão',
  'full-board': 'Pensão completa',
};

/** Dia em que a NOITE começa (padrão hoteleiro: seg = noite de 2ª → 3ª). */
const DOW: { key: number; label: string }[] = [
  { key: 1, label: 'Seg → Ter' },
  { key: 2, label: 'Ter → Qua' },
  { key: 3, label: 'Qua → Qui' },
  { key: 4, label: 'Qui → Sex' },
  { key: 5, label: 'Sex → Sáb' },
  { key: 6, label: 'Sáb → Dom' },
  { key: 0, label: 'Dom → Seg' },
];

export default function RatesPage() {
  const { ratePlans, categories, save, remove, update } = useData();
  const [startDate, setStartDate] = useState(() => startOfDay(new Date()));
  const [planModal, setPlanModal] = useState<RatePlan | 'new' | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [cellEdit, setCellEdit] = useState<{ plan: RatePlan; date: string } | null>(null);

  const days = useMemo(() => Array.from({ length: NUM_DAYS }, (_, i) => addDays(startDate, i)), [startDate]);

  const monthSpans = useMemo(() => {
    const spans: { label: string; span: number }[] = [];
    for (const d of days) {
      const label = format(d, 'MMMM yyyy', { locale: ptBR });
      const last = spans[spans.length - 1];
      if (last && last.label === label) last.span++;
      else spans.push({ label, span: 1 });
    }
    return spans;
  }, [days]);

  const groups = useMemo(
    () => categories.map((cat) => ({ cat, plans: ratePlans.filter((p) => p.categoryId === cat.id) })),
    [categories, ratePlans]
  );

  return (
    <>
      <PageHeader
        title="Calendário Tarifário"
        actions={
          <>
            <Button variant="outline" onClick={() => setBulkOpen(true)} disabled={ratePlans.length === 0}>
              <PencilRuler size={15} /> <span className="hidden sm:inline">Editar preços em massa</span><span className="sm:hidden">Em massa</span>
            </Button>
            <Button onClick={() => setPlanModal('new')} disabled={categories.length === 0}>
              <Plus size={16} /> <span className="hidden sm:inline">Novo Plano Tarifário</span><span className="sm:hidden">Novo plano</span>
            </Button>
          </>
        }
      />

      {/* Navegação */}
      <div className="mb-3 flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1 shadow-sm sm:w-fit">
        <button onClick={() => setStartDate(subDays(startDate, 7))} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-white hover:shadow-sm cursor-pointer">
          <ArrowLeft size={16} strokeWidth={2.5} /> <span className="hidden sm:inline">Voltar 7 dias</span>
        </button>
        <div className="relative">
          <input
            type="date"
            value={format(startDate, 'yyyy-MM-dd')}
            onChange={(e) => e.target.value && setStartDate(startOfDay(parseISO(e.target.value)))}
            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
          />
          <div className="pointer-events-none px-3 py-2 text-slate-500"><CalendarIcon size={18} strokeWidth={2.5} /></div>
        </div>
        <button onClick={() => setStartDate(startOfDay(new Date()))} className="rounded-xl px-3 py-2 text-sm font-bold text-brand-700 transition hover:bg-white hover:shadow-sm cursor-pointer">Hoje</button>
        <button onClick={() => setStartDate(addDays(startDate, 7))} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-white hover:shadow-sm cursor-pointer">
          <span className="hidden sm:inline">Próximos 7 dias</span> <ArrowRight size={16} strokeWidth={2.5} />
        </button>
      </div>

      {categories.length === 0 ? (
        <EmptyState icon={Tags} title="Cadastre categorias de quarto primeiro" subtitle="Os planos tarifários são vinculados às categorias (aba Quartos → Categorias)." />
      ) : (
        <div className="overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm" style={{ maxHeight: 'calc(100dvh - 230px)' }}>
          <table className="min-w-max table-fixed border-separate border-spacing-0">
            <colgroup>
              <col className="w-[130px] sm:w-[170px]" />
              {days.map((d) => <col key={d.toISOString()} style={{ width: CELL }} />)}
            </colgroup>
            <thead>
              <tr className="sticky top-0 z-[60]">
                <th rowSpan={2} className="sticky left-0 z-[70] border-b border-r border-slate-200 bg-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]" />
                {monthSpans.map((m, i) => (
                  <th key={i} colSpan={m.span} className="h-8 border-b border-r border-slate-200 bg-slate-100 px-2 text-left align-middle">
                    <span className="whitespace-nowrap text-[11px] font-bold capitalize text-slate-500">{m.label}</span>
                  </th>
                ))}
              </tr>
              <tr className="sticky top-8 z-[55] shadow-[0_4px_10px_-4px_rgba(0,0,0,0.06)]">
                {days.map((d) => (
                  <th key={d.toISOString()} className={cn('h-[44px] border-b border-r border-slate-100 p-0 text-center', isToday(d) ? 'bg-brand-50' : isWeekend(d) ? 'bg-slate-50' : 'bg-white')}>
                    <div className="flex h-full flex-col items-center justify-center gap-0.5">
                      <span className={cn('text-[9px] font-bold uppercase tracking-widest leading-none', isToday(d) ? 'text-brand-700' : 'text-slate-400')}>{format(d, 'EEE', { locale: ptBR }).replace('.', '')}</span>
                      <span className={cn('text-sm font-bold leading-none', isToday(d) ? 'text-brand-800' : 'text-slate-700')}>{format(d, 'dd')}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map(({ cat, plans }) => {
                const isCollapsed = collapsed.includes(cat.id);
                return (
                  <Fragment key={cat.id}>
                    {/* Categoria */}
                    <tr>
                      <td
                        onClick={() => setCollapsed((c) => (isCollapsed ? c.filter((x) => x !== cat.id) : [...c, cat.id]))}
                        className="sticky left-0 z-50 h-[40px] cursor-pointer border-b border-r border-slate-200 bg-slate-50/95 px-2.5 shadow-[2px_0_8px_-2px_rgba(0,0,0,0.05)] backdrop-blur transition hover:bg-slate-100"
                      >
                        <div className="flex items-center gap-1.5 whitespace-nowrap text-[11px] font-bold uppercase tracking-wider text-slate-600">
                          {isCollapsed ? <ChevronRight size={15} className="shrink-0 text-slate-400" /> : <ChevronDown size={15} className="shrink-0 text-slate-400" />}
                          <span className="truncate">{cat.name}</span>
                        </div>
                      </td>
                      <td colSpan={NUM_DAYS} className="border-b border-slate-100 bg-slate-50/40 px-3 text-[11px] text-slate-400">
                        {plans.length === 0 && !isCollapsed && (
                          <button onClick={() => setPlanModal('new')} className="font-semibold text-brand-700 hover:underline cursor-pointer">
                            + Criar plano tarifário para {cat.name} (hoje usa o preço base: {brl(cat.basePrice)})
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Planos */}
                    {!isCollapsed && plans.map((plan) => (
                      <tr key={plan.id} className="group h-[46px] hover:bg-slate-50/50">
                        <td
                          onClick={() => setPlanModal(plan)}
                          className="sticky left-0 z-50 cursor-pointer border-b border-r border-slate-100 bg-white px-2.5 shadow-[2px_0_8px_-4px_rgba(0,0,0,0.05)] transition group-hover:bg-slate-50"
                          title="Clique para editar o plano"
                        >
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <span className={cn('h-2 w-2 shrink-0 rounded-full', plan.active ? 'bg-emerald-500' : 'bg-slate-300')} title={plan.active ? 'Ativo' : 'Inativo'} />
                            <span className="truncate text-xs font-bold text-slate-700 group-hover:text-brand-700">{plan.name}</span>
                            <Pencil size={11} className="shrink-0 text-slate-300 opacity-0 transition group-hover:opacity-100" />
                          </div>
                        </td>
                        {days.map((d) => {
                          const iso = format(d, 'yyyy-MM-dd');
                          const price = planPriceForDate(plan, iso);
                          const isOverride = plan.dailyOverrides?.[iso] != null;
                          return (
                            <td
                              key={iso}
                              onClick={() => setCellEdit({ plan, date: iso })}
                              className={cn(
                                'cursor-pointer border-b border-r border-slate-100 p-0 text-center transition hover:bg-brand-50',
                                isToday(d) ? 'bg-brand-50/40' : isWeekend(d) ? 'bg-slate-50/60' : 'bg-white'
                              )}
                              title="Clique para definir preço especial desta data"
                            >
                              {price == null ? (
                                <span className="text-xs text-slate-300">—</span>
                              ) : (
                                <span className={cn('text-xs font-bold', isOverride ? 'rounded-md bg-amber-100 px-1.5 py-0.5 text-amber-800' : 'text-slate-700')}>
                                  {brl(price)}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
          <div className="sticky bottom-0 left-0 flex flex-wrap items-center gap-3 border-t border-slate-100 bg-white px-4 py-2 text-[11px] font-semibold text-slate-500">
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-md bg-amber-200" /> Preço especial da data</span>
            <span className="ml-auto hidden text-slate-400 sm:inline">Clique num preço para alterar aquela data · clique no nome do plano para editá-lo</span>
          </div>
        </div>
      )}

      {/* Editar preço de uma data */}
      {cellEdit && (
        <CellPriceModal
          plan={cellEdit.plan}
          date={cellEdit.date}
          onClose={() => setCellEdit(null)}
          onSave={async (price) => {
            const overrides = { ...(cellEdit.plan.dailyOverrides ?? {}) };
            if (price == null) delete overrides[cellEdit.date];
            else overrides[cellEdit.date] = price;
            await update('ratePlans', cellEdit.plan.id, { dailyOverrides: overrides });
            toast.success(price == null ? 'Preço especial removido.' : `Preço de ${format(parseISO(cellEdit.date), 'dd/MM')} atualizado.`);
            setCellEdit(null);
          }}
        />
      )}

      {/* Criar/editar plano */}
      {planModal && (
        <PlanModal
          plan={planModal === 'new' ? null : planModal}
          categories={categories}
          onClose={() => setPlanModal(null)}
          onSave={async (data) => {
            // update() substitui os campos por completo (necessário ao limpar preços por dia da semana)
            if (data.id) await update('ratePlans', data.id, { ...data, id: undefined });
            else await save('ratePlans', data);
            toast.success('Plano tarifário salvo.');
            setPlanModal(null);
          }}
          onDelete={planModal !== 'new' ? () => { setDeleting((planModal as RatePlan).id); setPlanModal(null); } : undefined}
          onToggleActive={planModal !== 'new' ? async () => { const p = planModal as RatePlan; await update('ratePlans', p.id, { active: !p.active }); setPlanModal(null); } : undefined}
        />
      )}

      {/* Edição em massa */}
      {bulkOpen && (
        <BulkEditModal
          plans={ratePlans}
          categories={categories}
          onClose={() => setBulkOpen(false)}
          onApply={async (planId, from, to, weekdays, price, clear) => {
            const plan = ratePlans.find((p) => p.id === planId);
            if (!plan) return;
            const overrides = { ...(plan.dailyOverrides ?? {}) };
            let count = 0;
            for (let d = parseISO(from); format(d, 'yyyy-MM-dd') <= to; d = addDays(d, 1)) {
              if (!weekdays.includes(d.getDay())) continue;
              const iso = format(d, 'yyyy-MM-dd');
              if (clear) delete overrides[iso];
              else overrides[iso] = price;
              count++;
            }
            await update('ratePlans', planId, { dailyOverrides: overrides });
            toast.success(clear ? `Preços especiais removidos de ${count} data(s).` : `Preço aplicado a ${count} data(s).`);
            setBulkOpen(false);
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => { if (deleting) { remove('ratePlans', deleting); toast.success('Plano excluído.'); } }}
        title="Excluir plano tarifário"
        message="Esta ação não pode ser desfeita. As reservas existentes não são alteradas."
        confirmLabel="Excluir"
        danger
      />
    </>
  );
}

/* ---------------- Modal: preço de uma data ---------------- */
function CellPriceModal({ plan, date, onClose, onSave }: {
  plan: RatePlan;
  date: string;
  onClose: () => void;
  onSave: (price: number | null) => void;
}) {
  const current = planPriceForDate(plan, date);
  const isOverride = plan.dailyOverrides?.[date] != null;
  const [price, setPrice] = useState(current ?? plan.basePrice);
  return (
    <Modal open onClose={onClose} title={`${plan.name} — ${format(parseISO(date), "EEEE, dd 'de' MMMM", { locale: ptBR })}`}
      footer={
        <>
          {isOverride && <Button variant="ghost" className="mr-auto text-red-600" onClick={() => onSave(null)}><Trash2 size={14} /> Remover preço especial</Button>}
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => { if (price <= 0) return toast.error('Informe um preço válido.'); onSave(price); }}>Salvar</Button>
        </>
      }
    >
      <Field label="Preço da diária nesta data" required hint={isOverride ? 'Esta data já tem um preço especial.' : `Preço padrão: ${current != null ? brl(current) : '—'}`}>
        <Input type="number" min={0} step="0.01" value={price || ''} onChange={(e) => setPrice(Number(e.target.value))} autoFocus />
      </Field>
    </Modal>
  );
}

/* ---------------- Modal: criar/editar plano ---------------- */
function PlanModal({ plan, categories, onClose, onSave, onDelete, onToggleActive }: {
  plan: RatePlan | null;
  categories: RoomCategory[];
  onClose: () => void;
  onSave: (data: Partial<RatePlan> & { id?: string }) => void;
  onDelete?: () => void;
  onToggleActive?: () => void;
}) {
  const [f, setF] = useState({
    name: plan?.name ?? '',
    categoryId: plan?.categoryId ?? categories[0]?.id ?? '',
    basePrice: plan?.basePrice ?? 0,
    minStay: plan?.minStay ?? 1,
    maxStay: plan?.maxStay ?? 0,
    mealPlan: plan?.mealPlan ?? ('breakfast' as NonNullable<RatePlan['mealPlan']>),
    cancellationPolicy: plan?.cancellationPolicy ?? ('flexible' as NonNullable<RatePlan['cancellationPolicy']>),
    validFrom: plan?.validFrom ?? todayISO(),
    validTo: plan?.validTo ?? '',
    notes: plan?.notes ?? '',
    variesByDow: Boolean(plan?.pricesByDayOfWeek && Object.keys(plan.pricesByDayOfWeek).length > 0),
    dow: Object.fromEntries(DOW.map(({ key }) => [key, plan?.pricesByDayOfWeek?.[key] ?? plan?.basePrice ?? 0])) as Record<number, number>,
  });

  const submit = () => {
    if (!f.name.trim()) return toast.error('Informe o nome do plano.');
    if (!f.categoryId) return toast.error('Selecione a categoria de quarto.');
    if (f.variesByDow) {
      if (DOW.some(({ key }) => !f.dow[key] || f.dow[key] <= 0)) return toast.error('Preencha o preço de todos os dias da semana.');
    } else if (f.basePrice <= 0) {
      return toast.error('Informe o preço base.');
    }
    onSave({
      id: plan?.id,
      name: f.name.trim(),
      categoryId: f.categoryId,
      basePrice: f.variesByDow ? f.dow[1] : f.basePrice,
      minStay: f.minStay || 1,
      ...(f.maxStay > 0 ? { maxStay: f.maxStay } : {}),
      mealPlan: f.mealPlan,
      cancellationPolicy: f.cancellationPolicy,
      validFrom: f.validFrom || undefined,
      validTo: f.validTo || undefined,
      notes: f.notes.trim() || undefined,
      pricesByDayOfWeek: f.variesByDow ? f.dow : {},
      dailyOverrides: plan?.dailyOverrides ?? {},
      active: plan?.active ?? true,
    });
  };

  return (
    <Modal open onClose={onClose} title={plan ? `Editar plano — ${plan.name}` : 'Novo Plano Tarifário'} wide
      footer={
        <>
          {onDelete && <Button variant="ghost" className="mr-auto text-red-600" onClick={onDelete}><Trash2 size={14} /> Excluir</Button>}
          {onToggleActive && <Button variant="outline" onClick={onToggleActive}>{plan?.active ? 'Desativar' : 'Ativar'}</Button>}
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit}>Salvar plano</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome do plano" required><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Tarifa padrão" /></Field>
          <Field label="Categoria de quarto" required>
            <Select value={f.categoryId} onChange={(e) => setF({ ...f, categoryId: e.target.value })}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Válido de" required><Input type="date" value={f.validFrom} onChange={(e) => setF({ ...f, validFrom: e.target.value })} /></Field>
          <Field label="Válido até (deixe vazio = sempre)"><Input type="date" value={f.validTo} min={f.validFrom} onChange={(e) => setF({ ...f, validTo: e.target.value })} /></Field>
        </div>

        {/* Preço por dia da semana */}
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="mb-2 text-sm font-bold text-slate-700">☀️ O preço muda dependendo do dia da semana?</p>
          <div className="space-y-1.5 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={!f.variesByDow} onChange={() => setF({ ...f, variesByDow: false })} className="accent-brand-700" />
              Não, o preço é o mesmo todos os dias
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={f.variesByDow} onChange={() => setF({ ...f, variesByDow: true })} className="accent-brand-700" />
              Sim, os preços variam por dia da semana
            </label>
          </div>

          {!f.variesByDow ? (
            <div className="mt-3 max-w-xs">
              <Field label="Preço base por noite" required>
                <Input type="number" min={0} step="0.01" value={f.basePrice || ''} onChange={(e) => setF({ ...f, basePrice: Number(e.target.value) })} placeholder="0,00" />
              </Field>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {DOW.map(({ key, label }) => (
                <Field key={key} label={`🌙 ${label}`}>
                  <Input type="number" min={0} step="0.01" value={f.dow[key] || ''} onChange={(e) => setF({ ...f, dow: { ...f.dow, [key]: Number(e.target.value) } })} placeholder="0,00" />
                </Field>
              ))}
            </div>
          )}
          <p className="mt-2 text-xs text-slate-400">Para feriados e datas específicas, use o calendário tarifário (clique no preço da data) ou "Editar preços em massa".</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Estadia mínima (noites)"><Input type="number" min={1} value={f.minStay} onChange={(e) => setF({ ...f, minStay: Number(e.target.value) })} /></Field>
          <Field label="Estadia máxima (0 = sem limite)"><Input type="number" min={0} value={f.maxStay} onChange={(e) => setF({ ...f, maxStay: Number(e.target.value) })} /></Field>
          <Field label="Refeições incluídas">
            <Select value={f.mealPlan} onChange={(e) => setF({ ...f, mealPlan: e.target.value as NonNullable<RatePlan['mealPlan']> })}>
              {(Object.keys(MEAL_LABELS) as (keyof typeof MEAL_LABELS)[]).map((m) => <option key={m} value={m}>{MEAL_LABELS[m]}</option>)}
            </Select>
          </Field>
          <Field label="Política de cancelamento">
            <Select value={f.cancellationPolicy} onChange={(e) => setF({ ...f, cancellationPolicy: e.target.value as NonNullable<RatePlan['cancellationPolicy']> })}>
              <option value="flexible">Flexível</option>
              <option value="non-refundable">Não reembolsável</option>
            </Select>
          </Field>
        </div>

        <Field label="Notas"><Textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Condições, observações internas…" /></Field>
      </div>
    </Modal>
  );
}

/* ---------------- Modal: edição em massa ---------------- */
function BulkEditModal({ plans, categories, onClose, onApply }: {
  plans: RatePlan[];
  categories: RoomCategory[];
  onClose: () => void;
  onApply: (planId: string, from: string, to: string, weekdays: number[], price: number, clear: boolean) => void;
}) {
  const [f, setF] = useState({
    planId: plans[0]?.id ?? '',
    from: todayISO(),
    to: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    weekdays: [0, 1, 2, 3, 4, 5, 6] as number[],
    price: 0,
    clear: false,
  });
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const toggleDay = (d: number) =>
    setF((x) => ({ ...x, weekdays: x.weekdays.includes(d) ? x.weekdays.filter((y) => y !== d) : [...x.weekdays, d] }));

  return (
    <Modal open onClose={onClose} title="Editar preços em massa"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => {
            if (!f.planId) return toast.error('Selecione um plano.');
            if (f.to < f.from) return toast.error('O período é inválido.');
            if (f.weekdays.length === 0) return toast.error('Selecione ao menos um dia da semana.');
            if (!f.clear && f.price <= 0) return toast.error('Informe o preço.');
            onApply(f.planId, f.from, f.to, f.weekdays, f.price, f.clear);
          }}>Aplicar</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Plano tarifário" required>
          <Select value={f.planId} onChange={(e) => setF({ ...f, planId: e.target.value })}>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {categories.find((c) => c.id === p.categoryId)?.name ?? '?'}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="De" required><Input type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></Field>
          <Field label="Até (incluindo)" required><Input type="date" value={f.to} min={f.from} onChange={(e) => setF({ ...f, to: e.target.value })} /></Field>
        </div>
        <Field label="Dias da semana">
          <div className="flex flex-wrap gap-1.5">
            {dayNames.map((n, d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(d)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer',
                  f.weekdays.includes(d) ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </Field>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" checked={f.clear} onChange={(e) => setF({ ...f, clear: e.target.checked })} className="accent-brand-700" />
          Remover preços especiais do período (voltar ao preço padrão do plano)
        </label>
        {!f.clear && (
          <Field label="Novo preço por noite" required>
            <Input type="number" min={0} step="0.01" value={f.price || ''} onChange={(e) => setF({ ...f, price: Number(e.target.value) })} placeholder="0,00" />
          </Field>
        )}
        <p className="text-xs text-slate-400">Ideal para alta/baixa temporada, feriados e fins de semana. O preço será gravado como "preço especial" em cada data do período.</p>
      </div>
    </Modal>
  );
}
