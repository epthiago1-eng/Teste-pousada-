import { useState } from 'react';
import { toast } from 'sonner';
import { Check, FileText, Inbox, X } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Badge, Button, Card, EmptyState, PageHeader } from '../components/ui';
import BookingModal from '../components/BookingModal';
import type { Booking, BookingRequest } from '../types';
import { cn, fmtDate } from '../lib/utils';

export default function RequestsPage() {
  const { requests, fnrhForms, categories, update, save, clients } = useData();
  const [tab, setTab] = useState<'requests' | 'fnrh'>('requests');
  const [approving, setApproving] = useState<BookingRequest | null>(null);
  const [prefill, setPrefill] = useState<Partial<Booking> | null>(null);

  const pending = requests.filter((r) => !r.status || r.status === 'pending').sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  const answered = requests.filter((r) => r.status && r.status !== 'pending').sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));

  const approve = async (r: BookingRequest) => {
    // Cria (ou acha) o cliente e abre o modal de reserva pré-preenchido
    let clientId = clients.find((c) => c.phone && c.phone === r.guestPhone)?.id;
    if (!clientId) {
      clientId = await save('clients', {
        name: r.guestName,
        phone: r.guestPhone,
        email: r.guestEmail ?? '',
        createdAt: new Date().toISOString(),
      });
    }
    setApproving(r);
    setPrefill({ clientId, checkIn: r.checkIn, checkOut: r.checkOut, status: 'confirmed' });
  };

  const reject = async (r: BookingRequest) => {
    await update('bookingRequests', r.id, { status: 'rejected' });
    toast.success('Solicitação recusada.');
  };

  return (
    <>
      <PageHeader title="Solicitações" subtitle="Pedidos de reserva e fichas FNRH recebidos online" />

      <div className="mb-4 flex gap-1 rounded-xl bg-slate-100 p-1 sm:w-fit">
        <button onClick={() => setTab('requests')} className={cn('flex-1 rounded-lg px-4 py-2 text-sm font-bold transition cursor-pointer sm:flex-none', tab === 'requests' ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-500')}>
          Reservas {pending.length > 0 && <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">{pending.length}</span>}
        </button>
        <button onClick={() => setTab('fnrh')} className={cn('flex-1 rounded-lg px-4 py-2 text-sm font-bold transition cursor-pointer sm:flex-none', tab === 'fnrh' ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-500')}>
          Fichas FNRH ({fnrhForms.length})
        </button>
      </div>

      {tab === 'requests' ? (
        pending.length === 0 && answered.length === 0 ? (
          <EmptyState icon={Inbox} title="Nenhuma solicitação" subtitle="Quando alguém pedir reserva pela sua página pública, aparecerá aqui." />
        ) : (
          <div className="space-y-2">
            {[...pending, ...answered].map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800">{r.guestName}</p>
                    <p className="text-xs text-slate-400">
                      {r.guestPhone} {r.guestEmail && `· ${r.guestEmail}`}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-600">
                      {fmtDate(r.checkIn)} → {fmtDate(r.checkOut)}
                      {r.categoryId && <> · {categories.find((c) => c.id === r.categoryId)?.name}</>}
                      {r.adults != null && <> · {r.adults} adulto(s){r.children ? `, ${r.children} criança(s)` : ''}</>}
                    </p>
                    {r.notes && <p className="mt-1 text-xs text-slate-400">📝 {r.notes}</p>}
                  </div>
                  {!r.status || r.status === 'pending' ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-red-600" onClick={() => reject(r)}><X size={14} /> Recusar</Button>
                      <Button size="sm" onClick={() => approve(r)}><Check size={14} /> Aprovar</Button>
                    </div>
                  ) : (
                    <Badge color={r.status === 'approved' ? 'green' : 'red'}>{r.status === 'approved' ? 'Aprovada' : 'Recusada'}</Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )
      ) : fnrhForms.length === 0 ? (
        <EmptyState icon={FileText} title="Nenhuma ficha recebida" subtitle="Envie o link da FNRH digital para o hóspede preencher antes do check-in." />
      ) : (
        <div className="space-y-2">
          {fnrhForms.slice().sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')).map((f) => (
            <Card key={f.id} className="p-4">
              <p className="font-bold text-slate-800">{f.name}</p>
              <p className="text-xs text-slate-400">
                {f.documentType ?? 'Doc'}: {f.document} · {f.nationality ?? '—'} · recebida em {fmtDate(f.createdAt?.slice(0, 10))}
              </p>
              <div className="mt-2 grid gap-x-4 gap-y-1 text-xs text-slate-500 sm:grid-cols-2">
                {f.phone && <span>📞 {f.phone}</span>}
                {f.email && <span>✉️ {f.email}</span>}
                {f.city && <span>🏠 {f.city}{f.state ? `/${f.state}` : ''} {f.country && `— ${f.country}`}</span>}
                {f.profession && <span>💼 {f.profession}</span>}
                {f.lastCity && <span>Veio de: {f.lastCity}</span>}
                {f.nextCity && <span>Vai para: {f.nextCity}</span>}
                {f.transport && <span>Transporte: {f.transport}</span>}
                {f.travelReason && <span>Motivo: {f.travelReason}</span>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <BookingModal
        open={Boolean(prefill)}
        onClose={async () => {
          if (approving) {
            await update('bookingRequests', approving.id, { status: 'approved' });
            setApproving(null);
          }
          setPrefill(null);
        }}
        defaults={prefill ?? undefined}
      />
    </>
  );
}
