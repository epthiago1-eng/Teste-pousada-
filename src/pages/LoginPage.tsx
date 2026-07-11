import { useState, type ChangeEvent, type FormEvent } from 'react';
import { toast } from 'sonner';
import { BedDouble, KeyRound, Loader2, Building2, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Field, Input } from '../components/ui';
import { isFirebaseConfigured } from '../lib/firebase';

type Mode = 'login' | 'register' | 'invite' | 'reset';

function friendlyAuthError(code: string) {
  const map: Record<string, string> = {
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/user-not-found': 'Usuário não encontrado.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
    'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
    'auth/invalid-email': 'E-mail inválido.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos.',
    'auth/network-request-failed': 'Sem conexão. Verifique sua internet.',
  };
  return map[code] ?? 'Não foi possível concluir. Tente novamente.';
}

export default function LoginPage() {
  const { login, registerWithNewTenant, registerWithInvite, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', tenantName: '', tenantId: '', code: '' });

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else if (mode === 'register') {
        if (!form.tenantName.trim()) throw { code: 'custom', message: 'Informe o nome da pousada.' };
        await registerWithNewTenant(form.name, form.email, form.password, form.tenantName);
        toast.success('Pousada criada! Bem-vindo(a).');
      } else if (mode === 'invite') {
        await registerWithInvite(form.name, form.email, form.password, form.tenantId, form.code);
        toast.success('Conta criada! Bem-vindo(a) à equipe.');
      } else if (mode === 'reset') {
        await resetPassword(form.email);
        toast.success('Enviamos um link de redefinição para seu e-mail.');
        setMode('login');
      }
    } catch (err: any) {
      toast.error(err?.message && err?.code === 'custom' ? err.message : err?.message?.includes('convite') ? err.message : friendlyAuthError(err?.code ?? ''));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-brand-900 via-brand-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
            <BedDouble size={32} className="text-brand-300" />
          </div>
          <h1 className="text-3xl font-extrabold text-white">PousadaGest</h1>
          <p className="mt-1 text-sm text-brand-200">Gestão completa para pousadas e pequenos hotéis</p>
        </div>

        {!isFirebaseConfigured && (
          <div className="mb-4 rounded-xl bg-amber-500/20 border border-amber-400/40 p-3 text-sm text-amber-100">
            ⚠️ Firebase não configurado. Copie <code>.env.example</code> para <code>.env.local</code> e preencha as chaves do seu projeto Firebase.
          </div>
        )}

        <div className="rounded-2xl bg-white p-6 shadow-2xl">
          <form onSubmit={submit} className="space-y-4">
            {(mode === 'register' || mode === 'invite') && (
              <Field label="Seu nome" required>
                <Input value={form.name} onChange={set('name')} required placeholder="Maria Silva" autoComplete="name" />
              </Field>
            )}
            {mode === 'register' && (
              <Field label="Nome da pousada" required>
                <Input value={form.tenantName} onChange={set('tenantName')} required placeholder="Pousada Mar Azul" />
              </Field>
            )}
            {mode === 'invite' && (
              <>
                <Field label="ID da pousada" required hint="Peça ao administrador da pousada">
                  <Input value={form.tenantId} onChange={set('tenantId')} required placeholder="ex.: a1b2c3..." />
                </Field>
                <Field label="Código de convite" required>
                  <Input value={form.code} onChange={set('code')} required placeholder="ex.: ABC123" className="uppercase" />
                </Field>
              </>
            )}
            <Field label="E-mail" required>
              <Input type="email" value={form.email} onChange={set('email')} required placeholder="voce@email.com" autoComplete="email" />
            </Field>
            {mode !== 'reset' && (
              <Field label="Senha" required hint={mode !== 'login' ? 'Mínimo de 6 caracteres' : undefined}>
                <Input type="password" value={form.password} onChange={set('password')} required minLength={6} placeholder="••••••••" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
              </Field>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy && <Loader2 size={18} className="animate-spin" />}
              {mode === 'login' && 'Entrar'}
              {mode === 'register' && 'Criar minha pousada'}
              {mode === 'invite' && 'Entrar na equipe'}
              {mode === 'reset' && 'Enviar link de redefinição'}
            </Button>
          </form>

          <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-center text-sm">
            {mode === 'login' ? (
              <>
                <button onClick={() => setMode('register')} className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
                  <Building2 size={16} className="text-brand-600" /> Criar uma nova pousada
                </button>
                <button onClick={() => setMode('invite')} className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
                  <UserPlus size={16} className="text-brand-600" /> Tenho um código de convite
                </button>
                <button onClick={() => setMode('reset')} className="mt-1 text-xs text-slate-400 hover:text-slate-600 cursor-pointer">
                  <KeyRound size={12} className="mr-1 inline" /> Esqueci minha senha
                </button>
              </>
            ) : (
              <button onClick={() => setMode('login')} className="font-semibold text-brand-700 hover:underline cursor-pointer">
                ← Voltar para o login
              </button>
            )}
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-brand-200/60">
          Seus dados são protegidos por autenticação e regras de acesso por função.
        </p>
      </div>
    </div>
  );
}
