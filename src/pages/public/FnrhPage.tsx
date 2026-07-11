import { useState, type ChangeEvent } from 'react';
import { useParams } from 'react-router-dom';
import { addDoc, collection } from 'firebase/firestore';
import { toast } from 'sonner';
import { CheckCircle2, FileText, Loader2, Send } from 'lucide-react';
import { db } from '../../lib/firebase';
import { usePublicTenant } from './usePublicTenant';
import { Button, Field, Input, Select } from '../../components/ui';

export default function FnrhPage() {
  const { slug } = useParams();
  const { tenant, status } = usePublicTenant(slug);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const [f, setF] = useState({
    name: '', documentType: 'CPF', document: '', nationality: 'Brasileira', birthDate: '',
    profession: '', phone: '', email: '', address: '', city: '', state: '', country: 'Brasil',
    lastCity: '', nextCity: '', transport: 'Automóvel', travelReason: 'Lazer',
  });
  const set = (k: keyof typeof f) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async () => {
    if (!tenant) return;
    if (!f.name.trim() || f.name.trim().length < 2) return toast.error('Informe seu nome completo.');
    if (!f.document.trim()) return toast.error('Informe o número do documento.');
    setSending(true);
    try {
      await addDoc(collection(db, 'tenants', tenant.id, 'fnrh'), {
        ...f,
        name: f.name.trim().slice(0, 149),
        document: f.document.trim(),
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
  if (status === 'not-found' || !tenant) {
    return <div className="flex min-h-dvh items-center justify-center bg-slate-50 p-6"><p className="font-bold text-slate-600">Página não encontrada.</p></div>;
  }

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="bg-gradient-to-br from-brand-800 to-brand-900 px-4 py-8 text-center text-white">
        <FileText size={28} className="mx-auto text-brand-300" />
        <h1 className="mt-2 text-xl font-extrabold">{tenant.name}</h1>
        <p className="mt-1 text-sm text-brand-200">Ficha de registro de hóspede (FNRH)</p>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 pb-16">
        {sent ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <CheckCircle2 size={44} className="mx-auto text-emerald-500" />
            <h2 className="mt-3 text-xl font-extrabold text-slate-800">Ficha enviada!</h2>
            <p className="mt-2 text-sm text-slate-500">Obrigado, {f.name.split(' ')[0]}. Seu check-in será mais rápido. 🌺</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="mb-4 text-xs text-slate-400">Preencha antes do check-in para agilizar sua chegada. Seus dados são enviados diretamente à pousada.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Field label="Nome completo" required><Input value={f.name} onChange={set('name')} /></Field></div>
              <Field label="Tipo de documento">
                <Select value={f.documentType} onChange={set('documentType')}>
                  <option>CPF</option><option>RG</option><option>Passaporte</option><option>CNH</option>
                </Select>
              </Field>
              <Field label="Número do documento" required><Input value={f.document} onChange={set('document')} /></Field>
              <Field label="Nascimento"><Input type="date" value={f.birthDate} onChange={set('birthDate')} /></Field>
              <Field label="Nacionalidade"><Input value={f.nationality} onChange={set('nationality')} /></Field>
              <Field label="Profissão"><Input value={f.profession} onChange={set('profession')} /></Field>
              <Field label="Telefone"><Input value={f.phone} onChange={set('phone')} /></Field>
              <div className="sm:col-span-2"><Field label="E-mail"><Input type="email" value={f.email} onChange={set('email')} /></Field></div>
              <div className="sm:col-span-2"><Field label="Endereço"><Input value={f.address} onChange={set('address')} /></Field></div>
              <Field label="Cidade"><Input value={f.city} onChange={set('city')} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="UF"><Input value={f.state} onChange={set('state')} maxLength={2} /></Field>
                <Field label="País"><Input value={f.country} onChange={set('country')} /></Field>
              </div>
              <Field label="Última cidade (origem)"><Input value={f.lastCity} onChange={set('lastCity')} /></Field>
              <Field label="Próxima cidade (destino)"><Input value={f.nextCity} onChange={set('nextCity')} /></Field>
              <Field label="Meio de transporte">
                <Select value={f.transport} onChange={set('transport')}>
                  <option>Automóvel</option><option>Avião</option><option>Ônibus</option><option>Navio</option><option>Outro</option>
                </Select>
              </Field>
              <Field label="Motivo da viagem">
                <Select value={f.travelReason} onChange={set('travelReason')}>
                  <option>Lazer</option><option>Negócios</option><option>Congresso/Feira</option><option>Saúde</option><option>Outro</option>
                </Select>
              </Field>
            </div>
            <Button size="lg" className="mt-5 w-full" onClick={submit} disabled={sending}>
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={17} />} Enviar ficha
            </Button>
          </div>
        )}
        <p className="mt-8 text-center text-[11px] text-slate-300">FNRH digital por PousadaGest</p>
      </main>
    </div>
  );
}
