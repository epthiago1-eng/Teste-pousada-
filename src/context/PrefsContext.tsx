import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type ThemeKey = 'teal' | 'blue' | 'green' | 'amber';

export const THEMES: { key: ThemeKey; label: string; swatch: string[]; emoji: string }[] = [
  { key: 'teal', label: 'Verde-água (padrão)', emoji: '🌊', swatch: ['#0f766e', '#14b8a6', '#ccfbf1'] },
  { key: 'blue', label: 'Azul moderno', emoji: '💙', swatch: ['#1d4ed8', '#3b82f6', '#dbeafe'] },
  { key: 'green', label: 'Verde moderno', emoji: '🌿', swatch: ['#047857', '#10b981', '#d1fae5'] },
  { key: 'amber', label: 'Amarelo moderno', emoji: '🌅', swatch: ['#b45309', '#f59e0b', '#fef3c7'] },
];

export const DASHBOARD_CARDS: { key: string; label: string; description: string }[] = [
  { key: 'stats', label: 'Indicadores do dia', description: 'Ocupação, hóspedes na casa, receita do mês e quartos a limpar' },
  { key: 'requests', label: 'Alerta de solicitações', description: 'Aviso quando há pedidos de reserva online aguardando' },
  { key: 'arrivals', label: 'Chegadas de hoje', description: 'Check-ins previstos para hoje' },
  { key: 'departures', label: 'Saídas de hoje', description: 'Check-outs previstos para hoje' },
  { key: 'inhouse', label: 'Hospedados agora', description: 'Quem está na casa neste momento' },
  { key: 'pendingPayments', label: 'Pagamentos pendentes', description: 'Reservas ativas com saldo em aberto' },
  { key: 'upcoming', label: 'Próximas chegadas (7 dias)', description: 'Check-ins confirmados da semana' },
];

interface Prefs {
  theme: ThemeKey;
  animations: boolean;
  dashboardCards: Record<string, boolean>;
}

const DEFAULT_PREFS: Prefs = {
  theme: 'teal',
  animations: true,
  dashboardCards: { stats: true, requests: true, arrivals: true, departures: true, inhouse: true, pendingPayments: false, upcoming: false },
};

interface PrefsContextValue extends Prefs {
  setTheme: (t: ThemeKey) => void;
  setAnimations: (on: boolean) => void;
  toggleCard: (key: string) => void;
  cardEnabled: (key: string) => boolean;
}

const PrefsContext = createContext<PrefsContextValue | null>(null);

const STORAGE_KEY = 'pousadagest-prefs';

function load(): Prefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PREFS,
      ...parsed,
      dashboardCards: { ...DEFAULT_PREFS.dashboardCards, ...(parsed.dashboardCards ?? {}) },
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    document.documentElement.dataset.theme = prefs.theme;
    document.documentElement.dataset.anim = prefs.animations ? 'on' : 'off';
  }, [prefs]);

  const value: PrefsContextValue = {
    ...prefs,
    setTheme: (theme) => setPrefs((p) => ({ ...p, theme })),
    setAnimations: (animations) => setPrefs((p) => ({ ...p, animations })),
    toggleCard: (key) => setPrefs((p) => ({ ...p, dashboardCards: { ...p.dashboardCards, [key]: !p.dashboardCards[key] } })),
    cardEnabled: (key) => prefs.dashboardCards[key] !== false,
  };

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error('usePrefs deve ser usado dentro de PrefsProvider');
  return ctx;
}
