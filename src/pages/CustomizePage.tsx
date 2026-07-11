import { Check, LayoutDashboard, Palette, Sparkles } from 'lucide-react';
import { Card, PageHeader } from '../components/ui';
import { DASHBOARD_CARDS, THEMES, usePrefs } from '../context/PrefsContext';
import { cn } from '../lib/utils';

export default function CustomizePage() {
  const prefs = usePrefs();

  return (
    <>
      <PageHeader title="Personalizar" subtitle="Deixe o app com a sua cara — as preferências ficam salvas neste dispositivo" />

      {/* ===== Paleta de cores ===== */}
      <Card className="anim-card p-5">
        <h3 className="flex items-center gap-2 font-bold text-slate-800"><Palette size={18} className="text-brand-600" /> Paleta de cores</h3>
        <p className="mt-1 text-sm text-slate-500">A cor escolhida vale para todo o app: menus, botões, calendário e destaques.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {THEMES.map((t) => (
            <button
              key={t.key}
              onClick={() => prefs.setTheme(t.key)}
              className={cn(
                'rounded-2xl border-2 p-4 text-left transition cursor-pointer',
                prefs.theme === t.key ? 'border-brand-600 bg-brand-50/50 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="flex gap-1">
                  {t.swatch.map((c) => <span key={c} className="h-6 w-6 rounded-full border border-white shadow-sm" style={{ backgroundColor: c }} />)}
                </span>
                {prefs.theme === t.key && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white"><Check size={12} strokeWidth={3} /></span>
                )}
              </div>
              <p className="mt-2.5 text-sm font-bold text-slate-800">{t.emoji} {t.label}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* ===== Animações ===== */}
      <Card className="anim-card mt-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 font-bold text-slate-800"><Sparkles size={18} className="text-brand-600" /> Animações e transições</h3>
            <p className="mt-1 text-sm text-slate-500">
              Cards e janelas aparecem com movimentos suaves. Desative se preferir tudo instantâneo (ou num aparelho mais lento).
            </p>
          </div>
          <button
            onClick={() => prefs.setAnimations(!prefs.animations)}
            className={cn('h-7 w-12 shrink-0 rounded-full p-1 transition-colors cursor-pointer', prefs.animations ? 'bg-brand-600' : 'bg-slate-300')}
          >
            <span className={cn('block h-5 w-5 rounded-full bg-white shadow transition-transform', prefs.animations && 'translate-x-5')} />
          </button>
        </div>
      </Card>

      {/* ===== Cards do dashboard ===== */}
      <Card className="anim-card mt-4 p-5">
        <h3 className="flex items-center gap-2 font-bold text-slate-800"><LayoutDashboard size={18} className="text-brand-600" /> Cards do Início</h3>
        <p className="mt-1 text-sm text-slate-500">Escolha o que aparece na tela inicial — inclusive cards extras que vêm desligados.</p>
        <div className="mt-4 space-y-2">
          {DASHBOARD_CARDS.map((c) => {
            const on = prefs.cardEnabled(c.key);
            return (
              <button
                key={c.key}
                onClick={() => prefs.toggleCard(c.key)}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition cursor-pointer',
                  on ? 'border-brand-200 bg-brand-50/40' : 'border-slate-200 bg-white hover:bg-slate-50'
                )}
              >
                <div>
                  <p className="text-sm font-bold text-slate-800">{c.label}</p>
                  <p className="text-xs text-slate-400">{c.description}</p>
                </div>
                <span className={cn('h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors', on ? 'bg-brand-600' : 'bg-slate-300')}>
                  <span className={cn('block h-5 w-5 rounded-full bg-white shadow transition-transform', on && 'translate-x-5')} />
                </span>
              </button>
            );
          })}
        </div>
      </Card>
    </>
  );
}
