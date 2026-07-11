import { useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BedDouble, CalendarDays, ClipboardList, CloudOff, Cloud, DollarSign, Home, Inbox,
  LogOut, Menu, MoreHorizontal, Package, Palette, Settings, Sparkles, Tags, Users, UsersRound, X, RefreshCw,
} from 'lucide-react';
import { useAuth, canView } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { cn } from '../lib/utils';
import { ROLE_LABELS } from '../types';

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
  area: string;
  badge?: number;
}

export default function AppShell({ children }: { children: ReactNode }) {
  const { profile, tenant, logout } = useAuth();
  const { online, hasPendingWrites, requests } = useData();
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();

  const pendingRequests = requests.filter((r) => !r.status || r.status === 'pending').length;

  const nav: NavItem[] = [
    { to: '/', label: 'Início', icon: Home, area: 'dashboard' },
    { to: '/calendario', label: 'Calendário', icon: CalendarDays, area: 'calendar' },
    { to: '/reservas', label: 'Reservas', icon: ClipboardList, area: 'bookings' },
    { to: '/quartos', label: 'Quartos', icon: BedDouble, area: 'rooms' },
    { to: '/clientes', label: 'Clientes', icon: Users, area: 'clients' },
    { to: '/solicitacoes', label: 'Solicitações', icon: Inbox, area: 'requests', badge: pendingRequests },
    { to: '/governanca', label: 'Governança', icon: Sparkles, area: 'housekeeping' },
    { to: '/produtos', label: 'Produtos', icon: Package, area: 'products' },
    { to: '/financeiro', label: 'Financeiro', icon: DollarSign, area: 'finance' },
    { to: '/tarifas', label: 'Tarifário', icon: Tags, area: 'rates' },
    { to: '/equipe', label: 'Equipe', icon: UsersRound, area: 'staff' },
    { to: '/personalizar', label: 'Personalizar', icon: Palette, area: 'customize' },
    { to: '/configuracoes', label: 'Configurações', icon: Settings, area: 'settings' },
  ].filter((i) => canView(profile?.role, i.area));

  // Mobile: 4 itens principais + "Mais"
  const mobileMain = nav.slice(0, 4);
  const mobileMore = nav.slice(4);

  const SyncBadge = () => (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        !online ? 'bg-amber-100 text-amber-800' : hasPendingWrites ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'
      )}
      title={!online ? 'Sem internet — alterações salvas no dispositivo e sincronizadas depois' : hasPendingWrites ? 'Sincronizando alterações…' : 'Tudo sincronizado'}
    >
      {!online ? <CloudOff size={13} /> : hasPendingWrites ? <RefreshCw size={13} className="animate-spin" /> : <Cloud size={13} />}
      <span className="hidden sm:inline">{!online ? 'Offline' : hasPendingWrites ? 'Sincronizando' : 'Online'}</span>
    </div>
  );

  return (
    <div className="min-h-dvh bg-slate-50">
      {/* ===== Sidebar (desktop) ===== */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-white">
            <BedDouble size={20} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-slate-900">{tenant?.name ?? 'PousadaGest'}</p>
            <p className="text-[11px] font-medium text-slate-400">PousadaGest</p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                  isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                )
              }
            >
              <item.icon size={18} />
              <span className="flex-1">{item.label}</span>
              {!!item.badge && (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{item.badge}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">
              {profile?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-800">{profile?.name}</p>
              <p className="text-[11px] text-slate-400">{profile ? ROLE_LABELS[profile.role] : ''}</p>
            </div>
            <button onClick={logout} title="Sair" className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ===== Topbar (mobile) ===== */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 text-white">
            <BedDouble size={17} />
          </div>
          <span className="max-w-40 truncate text-sm font-extrabold text-slate-900">{tenant?.name ?? 'PousadaGest'}</span>
        </div>
        <div className="flex items-center gap-2">
          <SyncBadge />
          <button onClick={logout} className="rounded-lg p-2 text-slate-400 hover:text-red-600 cursor-pointer" title="Sair">
            <LogOut size={17} />
          </button>
        </div>
      </header>

      {/* ===== Barra de status (desktop) ===== */}
      <div className="fixed right-4 top-4 z-30 hidden lg:block">
        <SyncBadge />
      </div>

      {/* ===== Conteúdo ===== */}
      <main className="px-4 pb-24 pt-4 sm:px-6 lg:ml-60 lg:pb-8 lg:pt-14">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>

      {/* ===== Bottom nav (mobile) ===== */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white safe-bottom lg:hidden">
        <div className="grid grid-cols-5">
          {mobileMain.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn('flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold', isActive ? 'text-brand-700' : 'text-slate-400')
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
          {mobileMore.length > 0 && (
            <button
              onClick={() => setMoreOpen(true)}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold cursor-pointer',
                mobileMore.some((i) => location.pathname === i.to) ? 'text-brand-700' : 'text-slate-400'
              )}
            >
              <MoreHorizontal size={20} />
              Mais
            </button>
          )}
        </div>
      </nav>

      {/* ===== Sheet "Mais" (mobile) ===== */}
      {moreOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-4 safe-bottom" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-800">Mais opções</p>
              <button onClick={() => setMoreOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {mobileMore.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'relative flex flex-col items-center gap-1.5 rounded-xl p-3 text-[11px] font-semibold',
                      isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-500 hover:bg-slate-50'
                    )
                  }
                >
                  <item.icon size={22} />
                  {item.label}
                  {!!item.badge && (
                    <span className="absolute right-2 top-2 rounded-full bg-red-500 px-1.5 text-[9px] font-bold text-white">{item.badge}</span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
