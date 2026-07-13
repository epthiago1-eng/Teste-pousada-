import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BedDouble, CalendarDays, LogIn, LogOut, MessageCircle, Pencil, Plus, Send, ShoppingBasket, Trash2, Wallet, XCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Badge, Button, ConfirmDialog, Field, Input, Modal, Select } from './ui';
import type { Booking, Payment } from '../types';
import { BOOKING_STATUS_LABELS, CHANNEL_LABELS, DEFAULT_MESSAGE_TEMPLATES, PAYMENT_METHOD_LABELS } from '../types';
import { bookingBalance, bookingPaid, bookingTotal, brl, fillTemplate, fmtDate, nights, todayISO, uid, waPhone } from '../lib/utils';

const statusColor: Record<Booking['status'], 'yellow' | 'blue' | 'green' | 'gray' | 'red' | 'purple' | 'orange'> = {
  'pre-booking': 'yellow',
  confirmed: 'blue',
  'checked-in': 'green',
  'checked-out': 'gray',
  cancelled: 'red',
  'no-show': 'orange',
  blocked: 'purple',
};

export default function BookingDetailsModal({
  bookingId,
  onClose,
  onEdit,
}: {
  bookingId: string | null;
  onClose: () => void;
  onEdit: (b: Booking) => void;
}) {
  const { bookings, rooms, clients, categories, products, save, update, remove } = useData();
  const { profile, tenant } = useAuth();
  const [waOpen, setWaOpen] = useState(false);
  const booking = bookings.find((b) => b.id === bookingId) ?? null;
  const [payOpen, setPayOpen] = useState(false);
  const [consOpen, setConsOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pay, setPay] = useState({ amount: 0, method: 'pix' as Payment['method'] });
  const [cons, setCons] = useState({ productId: '', description: '', quantity: 1, unitPrice: 0 });

  const room = rooms.find((r) => r.id === booking?.roomId);
  const client = clients.find((c) => c.id === booking?.clientId);
  const category = categories.find((c) => c.id === room?.categoryId);

  const total = booking ? bookingTotal(booking) : 0;
  const paid = booking ? bookingPaid(booking) : 0;
  const balance = booking ? bookingBalance(booking) : 0;

  const canDelete = profile?.role === 'admin' || profile?.role === 'manager';

  if (!booking) return null;

  const setStatus = async (status: Booking['status']) => {
    await update('bookings', booking.id, { status });
    if (status === 'checked-in' && room) {
      // nada a mudar no quarto além do vínculo pela reserva
    }
    if (status === 'checked-out' && room) {
      await update('rooms', room.id, { status: 'dirty' });
      // Lança a receita no financeiro
      try {
        await save('transactions', {
          type: 'income',
          category: 'booking',
          amount: total,
          description: `Hospedagem ${booking.reservationNumber} — ${client?.name ?? 'Hóspede'}`,
          date: todayISO(),
          bookingId: booking.id,
        });
      } catch (e) {
        console.warn('transaction on checkout', e);
      }
    }
    toast.success(`Status atualizado: ${BOOKING_STATUS_LABELS[status]}`);
  };

  const addPayment = async () => {
    if (pay.amount <= 0) return toast.error('Informe um valor válido.');
    await update('bookings', booking.id, {
      payments: [...(booking.payments ?? []), { id: uid(), amount: pay.amount, method: pay.method, date: new Date().toISOString() }],
    });
    setPayOpen(false);
    setPay({ amount: 0, method: 'pix' });
    toast.success('Pagamento registrado.');
  };

  const addConsumption = async () => {
    const desc = cons.productId ? products.find((p) => p.id === cons.productId)?.name ?? cons.description : cons.description;
    if (!desc.trim()) return toast.error('Descreva o item.');
    if (cons.quantity <= 0 || cons.unitPrice < 0) return toast.error('Quantidade/valor inválidos.');
    await update('bookings', booking.id, {
      consumption: [
        ...(booking.consumption ?? []),
        { id: uid(), productId: cons.productId || undefined, description: desc, quantity: cons.quantity, unitPrice: cons.unitPrice, date: new Date().toISOString() },
      ],
    });
    // Baixa de estoque
    if (cons.productId) {
      const p = products.find((x) => x.id === cons.productId);
      if (p?.type === 'product' && typeof p.stockQuantity === 'number') {
        await update('products', p.id, { stockQuantity: Math.max(0, p.stockQuantity - cons.quantity) });
      }
    }
    setConsOpen(false);
    setCons({ productId: '', description: '', quantity: 1, unitPrice: 0 });
    toast.success('Consumo adicionado.');
  };

  const removeConsumption = async (id: string) => {
    await update('bookings', booking.id, { consumption: (booking.consumption ?? []).filter((c) => c.id !== id) });
  };

  const isBlock = booking.status === 'blocked';

  /** Variáveis da reserva para os modelos de mensagem. */
  const msgVars: Record<string, string> = {
    nome: client?.name?.split(' ')[0] ?? 'Hóspede',
    pousada: tenant?.name ?? 'nossa pousada',
    quarto: room?.number ?? '?',
    checkin: fmtDate(booking.checkIn),
    checkout: fmtDate(booking.checkOut),
    noites: String(nights(booking.checkIn, booking.checkOut)),
    valor: brl(total),
    hora_checkin: tenant?.checkinTime ?? '14:00',
    hora_checkout: tenant?.checkoutTime ?? '12:00',
    link_fnrh: `${window.location.origin}/p/${tenant?.slug ?? ''}/fnrh`,
    link_portal: `${window.location.origin}/p/${tenant?.slug ?? ''}/portal`,
  };

  const sendWhatsApp = (templateKey: string) => {
    if (!client?.phone) return toast.error('Este hóspede não tem telefone cadastrado.');
    const tpl = tenant?.messageTemplates?.[templateKey] ?? DEFAULT_MESSAGE_TEMPLATES.find((t) => t.key === templateKey)?.text ?? '';
    const text = fillTemplate(tpl, msgVars);
    window.open(`https://wa.me/${waPhone(client.phone)}?text=${encodeURIComponent(text)}`, '_blank');
    setWaOpen(false);
  };

  return (
    <>
      <Modal open onClose={onClose} title={isBlock ? 'Bloqueio de quarto' : `${client?.name ?? 'Cliente removido'} · Reserva ${booking.reservationNumber}`} wide
        footer={
          <>
            {canDelete && (
              <Button variant="ghost" className="mr-auto text-red-600" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={15} /> Excluir
              </Button>
            )}
            <Button variant="outline" onClick={() => onEdit(booking)}><Pencil size={15} /> Editar</Button>
            {booking.status === 'confirmed' && (
              <Button onClick={() => setStatus('checked-in')}><LogIn size={15} /> Fazer check-in</Button>
            )}
            {booking.status === 'pre-booking' && (
              <Button onClick={() => setStatus('confirmed')}>Confirmar reserva</Button>
            )}
            {booking.status === 'checked-in' && (
              <Button onClick={() => setStatus('checked-out')}><LogOut size={15} /> Fazer check-out</Button>
            )}
          </>
        }
      >
        <div className="space-y-5">
          {/* Resumo */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge color={statusColor[booking.status]}>{BOOKING_STATUS_LABELS[booking.status]}</Badge>
            <Badge color="gray">{CHANNEL_LABELS[booking.channel]}</Badge>
            {!isBlock && (
              <Badge color={balance <= 0 ? 'green' : paid > 0 ? 'yellow' : 'red'}>
                {balance <= 0 ? 'Pago' : paid > 0 ? `Falta ${brl(balance)}` : 'Não pago'}
              </Badge>
            )}
          </div>

          <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
            <p className="flex items-center gap-2 text-slate-700">
              <BedDouble size={16} className="text-brand-600" />
              <strong>Quarto {room?.number ?? '?'}</strong>&nbsp;{category?.name}
            </p>
            <p className="flex items-center gap-2 text-slate-700">
              <CalendarDays size={16} className="text-brand-600" />
              {fmtDate(booking.checkIn)} → {fmtDate(booking.checkOut)} ({nights(booking.checkIn, booking.checkOut)} noites)
            </p>
            {!isBlock && (
              <>
                <p className="flex items-center gap-2 text-slate-700">
                  <strong>{client?.name ?? 'Cliente removido'}</strong>{client?.phone ? ` · ${client.phone}` : ''}
                  {client?.phone && (
                    <button
                      onClick={() => setWaOpen(true)}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm transition hover:bg-emerald-600 cursor-pointer"
                      title="Enviar mensagem pronta no WhatsApp"
                    >
                      <MessageCircle size={12} /> WhatsApp
                    </button>
                  )}
                </p>
                <p className="text-slate-700">{booking.adults} adulto(s){booking.children ? `, ${booking.children} criança(s)` : ''}</p>
              </>
            )}
            {booking.notes && <p className="text-slate-500 sm:col-span-2">📝 {booking.notes}</p>}
          </div>

          {!isBlock && (
            <>
              {/* Financeiro da reserva */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="flex items-center gap-1.5 text-sm font-bold text-slate-700"><Wallet size={15} /> Pagamentos</h4>
                  <Button size="sm" variant="secondary" onClick={() => setPayOpen(true)}><Plus size={14} /> Registrar</Button>
                </div>
                {(booking.payments ?? []).length === 0 ? (
                  <p className="text-sm text-slate-400">Nenhum pagamento registrado.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {(booking.payments ?? []).map((p) => (
                      <li key={p.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                        <span>{PAYMENT_METHOD_LABELS[p.method]} · {fmtDate(p.date.slice(0, 10))}</span>
                        <strong className="text-emerald-700">{brl(p.amount)}</strong>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Consumo */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="flex items-center gap-1.5 text-sm font-bold text-slate-700"><ShoppingBasket size={15} /> Consumo</h4>
                  <Button size="sm" variant="secondary" onClick={() => setConsOpen(true)}><Plus size={14} /> Adicionar</Button>
                </div>
                {(booking.consumption ?? []).length === 0 ? (
                  <p className="text-sm text-slate-400">Nenhum consumo lançado.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {(booking.consumption ?? []).map((c) => (
                      <li key={c.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                        <span>{c.quantity}× {c.description}</span>
                        <span className="flex items-center gap-2">
                          <strong>{brl(c.quantity * c.unitPrice)}</strong>
                          <button onClick={() => removeConsumption(c.id)} className="text-slate-300 hover:text-red-500 cursor-pointer"><Trash2 size={14} /></button>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Totais */}
              <div className="rounded-xl border border-slate-200 p-4 text-sm">
                <div className="flex justify-between text-slate-600"><span>Hospedagem</span><span>{brl(booking.totalPrice)}</span></div>
                <div className="flex justify-between text-slate-600"><span>Consumo</span><span>{brl(total - booking.totalPrice)}</span></div>
                <div className="flex justify-between text-slate-600"><span>Pago</span><span className="text-emerald-700">− {brl(paid)}</span></div>
                <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 text-base font-extrabold text-slate-900">
                  <span>Saldo</span><span className={balance > 0 ? 'text-red-600' : 'text-emerald-700'}>{brl(balance)}</span>
                </div>
              </div>

              {['pre-booking', 'confirmed', 'checked-in'].includes(booking.status) && (
                <div className="flex gap-2">
                  <Button variant="ghost" className="text-red-600" onClick={() => setConfirmCancel(true)}>
                    <XCircle size={15} /> Cancelar reserva
                  </Button>
                  {booking.status !== 'checked-in' && (
                    <Button variant="ghost" className="text-orange-600" onClick={() => setStatus('no-show')}>No-show</Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </Modal>

      {/* Enviar WhatsApp com mensagem pronta */}
      <Modal open={waOpen} onClose={() => setWaOpen(false)} title={`💬 WhatsApp para ${client?.name?.split(' ')[0] ?? 'o hóspede'}`} wide>
        <p className="mb-3 text-sm text-slate-500">
          Escolha a mensagem — ela abre no WhatsApp já preenchida com nome, datas, quarto e valores. Personalize os textos em <strong>Configurações → Mensagens</strong>.
        </p>
        <div className="space-y-2.5">
          {DEFAULT_MESSAGE_TEMPLATES.map((t) => {
            const tpl = tenant?.messageTemplates?.[t.key] ?? t.text;
            const preview = fillTemplate(tpl, msgVars);
            return (
              <div key={t.key} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-700">{t.emoji} {t.label}</p>
                  <Button size="sm" onClick={() => sendWhatsApp(t.key)} className="bg-emerald-500 hover:bg-emerald-600">
                    <Send size={13} /> Enviar
                  </Button>
                </div>
                <p className="mt-2 line-clamp-3 whitespace-pre-line rounded-lg bg-emerald-50/60 px-2.5 py-1.5 text-[11px] leading-relaxed text-slate-500">
                  {preview}
                </p>
              </div>
            );
          })}
        </div>
      </Modal>

      {/* Registrar pagamento */}
      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Registrar pagamento"
        footer={<><Button variant="outline" onClick={() => setPayOpen(false)}>Cancelar</Button><Button onClick={addPayment}>Salvar</Button></>}>
        <div className="space-y-4">
          <Field label="Valor" required>
            <Input type="number" min={0} step="0.01" value={pay.amount || ''} onChange={(e) => setPay((p) => ({ ...p, amount: Number(e.target.value) }))} placeholder="0,00" />
          </Field>
          <Field label="Forma de pagamento">
            <Select value={pay.method} onChange={(e) => setPay((p) => ({ ...p, method: e.target.value as Payment['method'] }))}>
              {(Object.keys(PAYMENT_METHOD_LABELS) as Payment['method'][]).map((m) => (
                <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>
              ))}
            </Select>
          </Field>
          {balance > 0 && (
            <Button variant="secondary" size="sm" onClick={() => setPay((p) => ({ ...p, amount: balance }))}>
              Preencher saldo total ({brl(balance)})
            </Button>
          )}
        </div>
      </Modal>

      {/* Adicionar consumo */}
      <Modal open={consOpen} onClose={() => setConsOpen(false)} title="Adicionar consumo"
        footer={<><Button variant="outline" onClick={() => setConsOpen(false)}>Cancelar</Button><Button onClick={addConsumption}>Adicionar</Button></>}>
        <div className="space-y-4">
          <Field label="Produto / serviço">
            <Select
              value={cons.productId}
              onChange={(e) => {
                const p = products.find((x) => x.id === e.target.value);
                setCons((c) => ({ ...c, productId: e.target.value, unitPrice: p?.price ?? c.unitPrice, description: p?.name ?? c.description }));
              }}
            >
              <option value="">Item avulso…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {brl(p.price)}{p.type === 'product' && typeof p.stockQuantity === 'number' ? ` (${p.stockQuantity} em estoque)` : ''}</option>
              ))}
            </Select>
          </Field>
          {!cons.productId && (
            <Field label="Descrição" required>
              <Input value={cons.description} onChange={(e) => setCons((c) => ({ ...c, description: e.target.value }))} placeholder="Ex.: taxa de lavanderia" />
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantidade">
              <Input type="number" min={1} value={cons.quantity} onChange={(e) => setCons((c) => ({ ...c, quantity: Number(e.target.value) }))} />
            </Field>
            <Field label="Preço unitário">
              <Input type="number" min={0} step="0.01" value={cons.unitPrice || ''} onChange={(e) => setCons((c) => ({ ...c, unitPrice: Number(e.target.value) }))} />
            </Field>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => setStatus('cancelled')}
        title="Cancelar reserva"
        message={`Cancelar a reserva ${booking.reservationNumber}? O quarto ficará disponível para as datas.`}
        confirmLabel="Cancelar reserva"
        danger
      />
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => { remove('bookings', booking.id); onClose(); toast.success('Reserva excluída.'); }}
        title="Excluir reserva"
        message="Esta ação não pode ser desfeita. Excluir permanentemente?"
        confirmLabel="Excluir"
        danger
      />
    </>
  );
}
