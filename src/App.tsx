import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth, canView } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import AppShell from './components/AppShell';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CalendarPage from './pages/CalendarPage';
import BookingsPage from './pages/BookingsPage';
import RoomsPage from './pages/RoomsPage';
import ClientsPage from './pages/ClientsPage';
import FinancePage from './pages/FinancePage';
import StaffPage from './pages/StaffPage';
import ProductsPage from './pages/ProductsPage';
import HousekeepingPage from './pages/HousekeepingPage';
import RatesPage from './pages/RatesPage';
import RequestsPage from './pages/RequestsPage';
import SettingsPage from './pages/SettingsPage';
import CustomizePage from './pages/CustomizePage';
import PublicSitePage from './pages/public/PublicSitePage';
import GuestPortalPage from './pages/public/GuestPortalPage';
import FnrhPage from './pages/public/FnrhPage';

function FullLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={32} className="animate-spin text-brand-600" />
        <p className="text-sm font-medium text-slate-500">Carregando PousadaGest…</p>
      </div>
    </div>
  );
}

function Protected({ area, children }: { area: string; children: ReactNode }) {
  const { profile } = useAuth();
  if (!canView(profile?.role, area)) {
    const fallback = profile?.role === 'housekeeper' ? '/governanca' : '/';
    return <Navigate to={fallback} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const { firebaseUser, profile, loading } = useAuth();

  return (
    <Routes>
      {/* Páginas públicas (sem login) */}
      <Route path="/p/:slug" element={<PublicSitePage />} />
      <Route path="/p/:slug/portal" element={<GuestPortalPage />} />
      <Route path="/p/:slug/fnrh" element={<FnrhPage />} />

      {/* App interno */}
      <Route
        path="/*"
        element={
          loading ? (
            <FullLoader />
          ) : !firebaseUser || !profile ? (
            <LoginPage />
          ) : (
            <DataProvider>
              <AppShell>
                <Routes>
                  <Route path="/" element={profile.role === 'housekeeper' ? <Navigate to="/governanca" replace /> : <Protected area="dashboard"><DashboardPage /></Protected>} />
                  <Route path="/calendario" element={<Protected area="calendar"><CalendarPage /></Protected>} />
                  <Route path="/reservas" element={<Protected area="bookings"><BookingsPage /></Protected>} />
                  <Route path="/quartos" element={<Protected area="rooms"><RoomsPage /></Protected>} />
                  <Route path="/clientes" element={<Protected area="clients"><ClientsPage /></Protected>} />
                  <Route path="/financeiro" element={<Protected area="finance"><FinancePage /></Protected>} />
                  <Route path="/equipe" element={<Protected area="staff"><StaffPage /></Protected>} />
                  <Route path="/produtos" element={<Protected area="products"><ProductsPage /></Protected>} />
                  <Route path="/governanca" element={<Protected area="housekeeping"><HousekeepingPage /></Protected>} />
                  <Route path="/tarifas" element={<Protected area="rates"><RatesPage /></Protected>} />
                  <Route path="/solicitacoes" element={<Protected area="requests"><RequestsPage /></Protected>} />
                  <Route path="/personalizar" element={<Protected area="customize"><CustomizePage /></Protected>} />
                  <Route path="/configuracoes" element={<Protected area="settings"><SettingsPage /></Protected>} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AppShell>
            </DataProvider>
          )
        }
      />
    </Routes>
  );
}
