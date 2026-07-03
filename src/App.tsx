import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  Calendar as CalendarIcon, 
  Bed, Target, PlusCircle,
  Users, 
  DollarSign, 
  UserCircle, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Settings,
  LogOut,
  Menu,
  X,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Coffee,
  Search,
  Filter,
  Moon,
  ChevronDown,
  Trash2,
  UserPlus,
  FileText,
  CreditCard,
  Check,
  Star,
  List,
  UserCheck,
  CheckSquare,
  Edit2,
  User,
  ArrowUpDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  EyeOff,
  Bell,
  ChevronsLeft,
  ChevronsRight,
  Package,
  ShoppingCart,
  Image as ImageIcon,
  Lock,
  CircleOff,
  PlaneLanding,
  PlaneTakeoff,
  LayoutDashboard,
  ChevronRightCircle,
  Clock,
  Shield,
  Paperclip,
  XCircle,
  Building,
  Mail,
  Phone,
  MapPin,
  Save,
  UserPlus2,
  Globe,
  ExternalLink,
  GripVertical,
  Wine,
  History,
  Printer,
  MessageCircle,
  Diamond,
  LockOpen,
  BedDouble,
  AlertTriangle,
  Info,
  TrendingUp,
  Percent,
  Link as LinkIcon,
  Copy,
  Truck,
  Utensils,
  Tv,
  ShieldCheck,
  Key,
  Smartphone,
  Minus,
  Baby,
  Car,
  Sun,
  Smile,
  Tag
} from 'lucide-react';
import { 
  format, 
  addDays,
  subDays,
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  startOfToday,
  startOfDay,
  isToday,
  isWeekend,
  parseISO,
  isBefore,
  isAfter,
  isWithinInterval,
  addMonths,
  subMonths,
  differenceInDays,
  differenceInCalendarDays,
  addHours,
  areIntervalsOverlapping
} from 'date-fns';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  useParams, 
  useNavigate,
  Link
} from 'react-router-dom';
import { ToastProvider, toast } from './components/ui/Toast';
import { Preloader } from './components/ui/Preloader';
import { PublicBookingPage } from './components/PublicBookingPage';
import { PublicBookingConsultation } from './components/PublicBookingConsultation';
import { PublicFNRHForm } from './components/PublicFNRHForm';
import { GuestPortalPage } from './components/GuestPortalPage';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { Room, Booking, Client, Transaction, Staff, RoomStatus, RoomCategory, Product, ConsumptionItem, Establishment, SystemUser, YieldRule, GuestPortalConfig, RatePlan, DailyRate, View } from './types';
import { INITIAL_ROOMS, INITIAL_BOOKINGS, INITIAL_CLIENTS, INITIAL_STAFF, INITIAL_TRANSACTIONS, INITIAL_ROOM_CATEGORIES, INITIAL_PRODUCTS, INITIAL_YIELD_RULES, INITIAL_GUEST_PORTAL_CONFIG, INITIAL_RATE_PLANS, INITIAL_DAILY_RATES } from './constants';
import { channelSyncService, SyncLog } from './services/ChannelSyncService';
import { YieldService } from './services/YieldService';
import { PaymentService, PaymentLink } from './services/PaymentService';
import { checkBookingConflict } from './lib/bookingUtils';

import { HousekeepingView } from './components/HousekeepingView';

import { useLocalStorage } from './hooks/useLocalStorage';
import { useNavigation } from './hooks/useNavigation';
import { useHotelData } from './hooks/useHotelData';
import { useCalendar } from './hooks/useCalendar';
import { useBookingForm } from './hooks/useBookingForm';
import { useUIState } from './hooks/useUIState';
import { useAuth } from './components/AuthProvider';
import { Login } from './components/Login';
import { auth } from './lib/firebase';
import { signOut } from 'firebase/auth';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NewProductViewProps {
  selectedProductId: string | null;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setSelectedProductId: React.Dispatch<React.SetStateAction<string | null>>;
  setCurrentView: React.Dispatch<React.SetStateAction<View>>;
}

const NewProductView = ({ 
  selectedProductId, 
  products, 
  setProducts, 
  setSelectedProductId, 
  setCurrentView 
}: NewProductViewProps) => {
  const existingProduct = selectedProductId ? products.find(p => p.id === selectedProductId) : null;
  
  const [name, setName] = useState(existingProduct?.name || '');
  const [type, setType] = useState<'product' | 'service'>(existingProduct?.type || 'product');
  const [price, setPrice] = useState(existingProduct?.price.toString() || '');
  const [stockQuantity, setStockQuantity] = useState(existingProduct?.stockQuantity?.toString() || '');
  const [minStockAlert, setMinStockAlert] = useState(existingProduct?.minStockAlert?.toString() || '');
  const [imageUrl, setImageUrl] = useState(existingProduct?.imageUrl || '');

  const handleSave = () => {
    if (!name || !price) return;
    
    const productData: Product = {
      id: existingProduct ? existingProduct.id : Math.random().toString(36).substr(2, 9),
      name,
      type,
      price: parseFloat(price),
      stockQuantity: type === 'product' ? parseInt(stockQuantity) || 0 : undefined,
      minStockAlert: type === 'product' ? parseInt(minStockAlert) || 0 : undefined,
      imageUrl: imageUrl || undefined
    };
    
    if (existingProduct) {
      setProducts(products.map(p => p.id === existingProduct.id ? productData : p));
    } else {
      setProducts([...products, productData]);
    }
    
    setSelectedProductId(null);
    setCurrentView('products');
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center gap-4">
        <button 
          onClick={() => {
            setSelectedProductId(null);
            setCurrentView('products');
          }}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-semibold text-slate-800">{existingProduct ? 'Editar Produto/Serviço' : 'Novo Produto/Serviço'}</h2>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Item</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" 
              placeholder="Ex: Água Mineral 500ml" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
            <select 
              value={type}
              onChange={(e) => setType(e.target.value as 'product' | 'service')}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white"
            >
              <option value="product">Produto Físico</option>
              <option value="service">Serviço</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Preço (R$)</label>
            <input 
              type="number" 
              step="0.01" 
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" 
              placeholder="0.00" 
            />
          </div>
          
          {type === 'product' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade em Estoque</label>
                <input 
                  type="number" 
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" 
                  placeholder="0" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Alerta de Estoque Mínimo</label>
                <input 
                  type="number" 
                  value={minStockAlert}
                  onChange={(e) => setMinStockAlert(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" 
                  placeholder="10" 
                />
              </div>
            </>
          )}
          
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">URL da Imagem (Opcional)</label>
            <input 
              type="text" 
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" 
              placeholder="https://..." 
            />
          </div>
        </div>
      </div>
      
      <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
        <button 
          onClick={() => {
            setSelectedProductId(null);
            setCurrentView('products');
          }}
          className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button 
          onClick={handleSave}
          disabled={!name || !price}
          className="px-6 py-2.5 bg-emerald-600 text-white font-medium hover:bg-emerald-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Salvar Item
        </button>
      </div>
    </div>
  );
};

interface NewStaffViewProps {
  selectedStaffId: string | null;
  staff: Staff[];
  setStaff: React.Dispatch<React.SetStateAction<Staff[]>>;
  setSelectedStaffId: React.Dispatch<React.SetStateAction<string | null>>;
  setCurrentView: React.Dispatch<React.SetStateAction<View>>;
}

const NewStaffView = ({ 
  selectedStaffId, 
  staff, 
  setStaff, 
  setSelectedStaffId, 
  setCurrentView 
}: NewStaffViewProps) => {
  const existingStaff = selectedStaffId ? staff.find(s => s.id === selectedStaffId) : null;
  
  const [name, setName] = useState(existingStaff?.name || '');
  const [role, setRole] = useState(existingStaff?.role || '');
  const [salary, setSalary] = useState(existingStaff?.salary.toString() || '');

  const handleSave = () => {
    if (!name || !role || !salary) return;
    
    const staffData: Staff = {
      id: existingStaff ? existingStaff.id : Math.random().toString(36).substr(2, 9),
      name,
      role,
      salary: parseFloat(salary),
      lastPaymentDate: existingStaff?.lastPaymentDate
    };
    
    if (existingStaff) {
      setStaff(staff.map(s => s.id === existingStaff.id ? staffData : s));
    } else {
      setStaff([...staff, staffData]);
    }
    
    setSelectedStaffId(null);
    setCurrentView('staff');
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center gap-4">
        <button 
          onClick={() => {
            setSelectedStaffId(null);
            setCurrentView('staff');
          }}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-semibold text-slate-800">{existingStaff ? 'Editar Funcionário' : 'Novo Funcionário'}</h2>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" 
              placeholder="Ex: João Silva" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cargo / Função</label>
            <input 
              type="text" 
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" 
              placeholder="Ex: Recepcionista" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Salário Mensal (R$)</label>
            <input 
              type="number" 
              step="0.01" 
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" 
              placeholder="0.00" 
            />
          </div>
        </div>
      </div>
      
      <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
        <button 
          onClick={() => {
            setSelectedStaffId(null);
            setCurrentView('staff');
          }}
          className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button 
          onClick={handleSave}
          disabled={!name || !role || !salary}
          className="px-6 py-2.5 bg-emerald-600 text-white font-medium hover:bg-emerald-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Salvar Funcionário
        </button>
      </div>
    </div>
  );
};

interface SettingsViewProps {
  establishment: Establishment;
  setEstablishment: (e: Establishment) => void;
  systemUsers: SystemUser[];
  setSystemUsers: (u: SystemUser[]) => void;
  paymentMethods: string[];
  setPaymentMethods: (methods: string[]) => void;
  whatsappTemplate: string;
  setWhatsappTemplate: (t: string) => void;
  depositTemplate: string;
  setDepositTemplate: (t: string) => void;
  fnrhTemplate: string;
  setFnrhTemplate: (t: string) => void;
  invoiceTemplate: string;
  setInvoiceTemplate: (t: string) => void;
  yieldRules: YieldRule[];
  setYieldRules: (rules: YieldRule[]) => void;
  guestPortalConfig: GuestPortalConfig;
  setGuestPortalConfig: (config: GuestPortalConfig) => void;
}

const SettingsView = ({ 
  establishment, 
  setEstablishment, 
  systemUsers, 
  setSystemUsers, 
  paymentMethods, 
  setPaymentMethods,
  whatsappTemplate,
  setWhatsappTemplate,
  depositTemplate,
  setDepositTemplate,
  fnrhTemplate,
  setFnrhTemplate,
  invoiceTemplate,
  setInvoiceTemplate,
  yieldRules,
  setYieldRules,
  guestPortalConfig,
  setGuestPortalConfig
}: SettingsViewProps) => {
  const [activeTab, setActiveTab] = useState<'establishment' | 'users' | 'room-features' | 'payments' | 'templates' | 'yield' | 'guest-portal'>('establishment');
  const [editEstablishment, setEditEstablishment] = useState(establishment);
  const [editGuestPortal, setEditGuestPortal] = useState(guestPortalConfig);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState<Partial<SystemUser>>({ role: 'receptionist', status: 'active' });
  const [newFeature, setNewFeature] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState('');
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  const handleSaveEstablishment = () => {
    setEstablishment(editEstablishment);
    toast.success('Configurações do estabelecimento salvas com sucesso!');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditEstablishment({ ...editEstablishment, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddUser = () => {
    if (newUser.name && newUser.email) {
      const user: SystemUser = {
        id: Math.random().toString(36).substr(2, 9),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role as any,
        status: 'active'
      };
      setSystemUsers([...systemUsers, user]);
      setIsAddingUser(false);
      setNewUser({ role: 'receptionist', status: 'active' });
    }
  };

  const handleDeleteUser = (id: string) => {
    setSystemUsers(systemUsers.filter(u => u.id !== id));
  };

  const handleToggleUserStatus = (id: string) => {
    setSystemUsers(systemUsers.map(u => 
      u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u
    ));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-slate-800">Configurações</h2>
        <p className="text-slate-500">Gerencie as informações do estabelecimento e usuários do sistema.</p>
      </div>

      <div className="flex gap-4 border-b border-slate-200 overflow-x-auto whitespace-nowrap scrollbar-hide pb-1">
        <button 
          onClick={() => setActiveTab('establishment')}
          className={cn(
            "px-2 sm:px-6 py-3 font-semibold text-sm transition-all relative break-keep",
            activeTab === 'establishment' ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Estabelecimento
          {activeTab === 'establishment' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={cn(
            "px-2 sm:px-6 py-3 font-semibold text-sm transition-all relative break-keep",
            activeTab === 'users' ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Usuários e Permissões
          {activeTab === 'users' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
        </button>
        <button 
          onClick={() => setActiveTab('room-features')}
          className={cn(
            "px-2 sm:px-6 py-3 font-semibold text-sm transition-all relative break-keep",
            activeTab === 'room-features' ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Recursos dos Quartos
          {activeTab === 'room-features' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
        </button>
        <button 
          onClick={() => setActiveTab('payments')}
          className={cn(
            "px-2 sm:px-6 py-3 font-semibold text-sm transition-all relative break-keep",
            activeTab === 'payments' ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Pagamentos
          {activeTab === 'payments' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
        </button>
        <button 
          onClick={() => setActiveTab('templates')}
          className={cn(
            "px-2 sm:px-6 py-3 font-semibold text-sm transition-all relative break-keep",
            activeTab === 'templates' ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Mensagens e Modelos
          {activeTab === 'templates' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
        </button>
        <button 
          onClick={() => setActiveTab('yield')}
          className={cn(
            "px-2 sm:px-6 py-3 font-semibold text-sm transition-all relative break-keep",
            activeTab === 'yield' ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Yield Management
          {activeTab === 'yield' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
        </button>
        <button 
          onClick={() => setActiveTab('guest-portal')}
          className={cn(
            "px-2 sm:px-6 py-3 font-semibold text-sm transition-all relative break-keep",
            activeTab === 'guest-portal' ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Portal do Hóspede
          {activeTab === 'guest-portal' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
        </button>
      </div>

      {activeTab === 'establishment' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
              <div className="flex items-center gap-3 text-indigo-600">
                <Building size={20} />
                <h3 className="font-bold">Dados Gerais</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Nome do Estabelecimento</label>
                  <input 
                    type="text" 
                    value={editEstablishment.name}
                    onChange={e => setEditEstablishment({...editEstablishment, name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">E-mail de Contato</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email" 
                      value={editEstablishment.email}
                      onChange={e => setEditEstablishment({...editEstablishment, email: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={editEstablishment.phone}
                      onChange={e => setEditEstablishment({...editEstablishment, phone: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Endereço Completo</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={editEstablishment.address}
                      onChange={e => setEditEstablishment({...editEstablishment, address: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={handleSaveEstablishment}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                >
                  <Save size={18} />
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
              <div className="flex items-center gap-3 text-indigo-600">
                <ImageIcon size={20} />
                <h3 className="font-bold">Logotipo</h3>
              </div>
              <div className="flex flex-col items-center gap-4">
                <label className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 group relative cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg" 
                    className="hidden" 
                    onChange={handleLogoUpload}
                  />
                  {editEstablishment.logoUrl ? (
                    <img src={editEstablishment.logoUrl} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <Plus size={32} className="text-slate-300" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                    Alterar Logo
                  </div>
                </label>
                <p className="text-xs text-slate-400 text-center">Recomendado: 512x512px (PNG ou JPG)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800">Usuários do Sistema</h3>
            <button 
              onClick={() => setIsAddingUser(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20"
            >
              <UserPlus2 size={18} />
              Novo Usuário
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Usuário</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Cargo / Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {systemUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{user.name}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Shield size={14} className={cn(
                          user.role === 'admin' ? "text-red-500" : 
                          user.role === 'manager' ? "text-amber-500" : "text-blue-500"
                        )} />
                        <span className="text-sm font-medium text-slate-700 capitalize">{user.role}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        user.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                      )}>
                        {user.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleToggleUserStatus(user.id)}
                          className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                          title={user.status === 'active' ? "Desativar" : "Ativar"}
                        >
                          {user.status === 'active' ? <EyeOff size={18} /> : <CheckCircle2 size={18} />}
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New User Modal */}
      <AnimatePresence>
        {isAddingUser && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
                <h3 className="text-xl font-bold text-slate-800">Novo Usuário</h3>
                <button onClick={() => setIsAddingUser(false)} className="p-2 hover:bg-white rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Nome Completo</label>
                  <input 
                    type="text" 
                    value={newUser.name || ''}
                    onChange={e => setNewUser({...newUser, name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Ex: Carlos Silva"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">E-mail</label>
                  <input 
                    type="email" 
                    value={newUser.email || ''}
                    onChange={e => setNewUser({...newUser, email: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="carlos@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Cargo / Role</label>
                  <select 
                    value={newUser.role}
                    onChange={e => setNewUser({...newUser, role: e.target.value as any})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="admin">Administrador</option>
                    <option value="manager">Gerente</option>
                    <option value="receptionist">Recepcionista</option>
                  </select>
                </div>
                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => setIsAddingUser(false)}
                    className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleAddUser}
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                  >
                    Criar Usuário
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {activeTab === 'room-features' && (
        <div className="max-w-2xl space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
            <div className="flex items-center gap-3 text-indigo-600">
              <CheckSquare size={20} />
              <h3 className="font-bold">Recursos Disponíveis para Quartos</h3>
            </div>
            
            <p className="text-sm text-slate-500">
              Cadastre aqui os recursos (TV, Wi-Fi, Frigobar, etc) que podem ser atribuídos aos quartos individualmente.
            </p>

            <div className="flex gap-2">
              <input 
                type="text" 
                value={newFeature}
                onChange={e => setNewFeature(e.target.value)}
                placeholder="Ex: Banheira de Hidromassagem"
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button 
                onClick={() => {
                  if (newFeature.trim()) {
                    setEditEstablishment({
                      ...editEstablishment,
                      roomFeatures: [...editEstablishment.roomFeatures, newFeature.trim()]
                    });
                    setNewFeature('');
                  }
                }}
                className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all"
              >
                Adicionar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {editEstablishment.roomFeatures.map((feature, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                  <span className="text-sm font-medium text-slate-700">{feature}</span>
                  <button 
                    onClick={() => {
                      setEditEstablishment({
                        ...editEstablishment,
                        roomFeatures: editEstablishment.roomFeatures.filter((_, i) => i !== index)
                      });
                    }}
                    className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button 
                onClick={handleSaveEstablishment}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
              >
                <Save size={18} />
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="max-w-2xl space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
            <div className="flex items-center gap-3 text-indigo-600">
              <CreditCard size={20} />
              <h3 className="font-bold">Métodos de Pagamento</h3>
            </div>
            
            <p className="text-sm text-slate-500">
              Cadastre aqui os métodos de pagamento que estarão disponíveis no momento da reserva e do check-out.
            </p>

            <div className="flex gap-2">
              <input 
                type="text" 
                value={newPaymentMethod}
                onChange={e => setNewPaymentMethod(e.target.value)}
                placeholder="Ex: Cartão de Crédito, PIX, Dinheiro"
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button 
                onClick={() => {
                  if (newPaymentMethod.trim() && !paymentMethods.includes(newPaymentMethod.trim())) {
                    setPaymentMethods([...paymentMethods, newPaymentMethod.trim()]);
                    setNewPaymentMethod('');
                  }
                }}
                className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all"
              >
                Adicionar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {paymentMethods.map((method, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                  <span className="text-sm font-medium text-slate-700">{method}</span>
                  <button 
                    onClick={() => {
                      setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
                    }}
                    className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="max-w-3xl space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
            <div className="flex items-center gap-3 text-indigo-600">
              <FileText size={20} />
              <h3 className="font-bold">Modelos de Mensagens e Faturas</h3>
            </div>
            
            <p className="text-sm text-slate-500">
              Configure as mensagens padrão enviadas aos hóspedes e o modelo de fatura.
              Use variáveis como {'{nome}'}, {'{data_checkin}'}, {'{data_checkout}'}, {'{link_fnrh}'}, {'{link_pagamento}'}, {'{valor_deposito}'} para personalizar.
            </p>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Mensagem de Confirmação (WhatsApp)</label>
                <textarea 
                  value={whatsappTemplate}
                  onChange={e => setWhatsappTemplate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Mensagem para Pedir Depósito</label>
                <textarea 
                  value={depositTemplate}
                  onChange={e => setDepositTemplate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Mensagem para Pedir FNRH</label>
                <textarea 
                  value={fnrhTemplate}
                  onChange={e => setFnrhTemplate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Modelo de Fatura</label>
                <textarea 
                  value={invoiceTemplate}
                  onChange={e => setInvoiceTemplate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-32"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button 
                onClick={() => toast.success('Modelos salvos com sucesso!')}
                className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
              >
                Salvar Modelos
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'yield' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-800">Automação de Yield (Revenue Management)</h3>
              <p className="text-sm text-slate-500">Configure regras para ajuste automático de tarifas baseado em ocupação, antecedência e sazonalidade.</p>
            </div>
            <button 
              onClick={() => {
                const newRule: YieldRule = {
                  id: Math.random().toString(36).substr(2, 9),
                  name: 'Nova Regra de Ocupação',
                  type: 'occupancy',
                  config: { minOccupancy: 50 },
                  adjustmentType: 'percentage',
                  adjustmentValue: 10,
                  isActive: true
                };
                setYieldRules([...yieldRules, newRule]);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20"
            >
              <Plus size={18} />
              Nova Regra
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {yieldRules.map(rule => (
              <div key={rule.id}>
                {editingRuleId === rule.id ? (
                  <div className="bg-white rounded-2xl shadow-md border-2 border-indigo-500 p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-800">Editar Regra</h4>
                      <button onClick={() => setEditingRuleId(null)} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome da Regra</label>
                        <input 
                          type="text" 
                          value={rule.name}
                          onChange={(e) => setYieldRules(yieldRules.map(r => r.id === rule.id ? { ...r, name: e.target.value } : r))}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo</label>
                        <select 
                          value={rule.type}
                          onChange={(e) => setYieldRules(yieldRules.map(r => r.id === rule.id ? { ...r, type: e.target.value as any, config: {} } : r))}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400"
                        >
                          <option value="occupancy">Ocupação</option>
                          <option value="seasonality">Sazonalidade</option>
                          <option value="lead-time">Antecedência</option>
                          <option value="competitor">Concorrência</option>
                        </select>
                      </div>
                    </div>

                    {/* Conditionally rendered config fields based on rule type */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      {rule.type === 'occupancy' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ocupação Mínima (%)</label>
                            <input 
                              type="number" 
                              min="0"
                              max="100"
                              value={rule.config.minOccupancy || ''}
                              onChange={(e) => setYieldRules(yieldRules.map(r => r.id === rule.id ? { ...r, config: { ...r.config, minOccupancy: e.target.value === '' ? undefined : Number(e.target.value) } } : r))}
                              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ocupação Máxima (%)</label>
                            <input 
                              type="number" 
                              min="0"
                              max="100"
                              value={rule.config.maxOccupancy || ''}
                              onChange={(e) => setYieldRules(yieldRules.map(r => r.id === rule.id ? { ...r, config: { ...r.config, maxOccupancy: e.target.value === '' ? undefined : Number(e.target.value) } } : r))}
                              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400"
                              placeholder="100 (Opcional)"
                            />
                          </div>
                        </div>
                      )}
                      {rule.type === 'seasonality' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data de Início</label>
                            <input 
                              type="date" 
                              value={rule.config.startDate || ''}
                              onChange={(e) => setYieldRules(yieldRules.map(r => r.id === rule.id ? { ...r, config: { ...r.config, startDate: e.target.value } } : r))}
                              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data de Término</label>
                            <input 
                              type="date" 
                              value={rule.config.endDate || ''}
                              onChange={(e) => setYieldRules(yieldRules.map(r => r.id === rule.id ? { ...r, config: { ...r.config, endDate: e.target.value } } : r))}
                              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400"
                            />
                          </div>
                        </div>
                      )}
                      {rule.type === 'lead-time' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Antecedência Mínima (Dias)</label>
                            <input 
                              type="number" 
                              min="0"
                              value={rule.config.minDaysLead || ''}
                              onChange={(e) => setYieldRules(yieldRules.map(r => r.id === rule.id ? { ...r, config: { ...r.config, minDaysLead: e.target.value === '' ? undefined : Number(e.target.value) } } : r))}
                              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Antecedência Máxima (Dias)</label>
                            <input 
                              type="number" 
                              min="0"
                              value={rule.config.maxDaysLead || ''}
                              onChange={(e) => setYieldRules(yieldRules.map(r => r.id === rule.id ? { ...r, config: { ...r.config, maxDaysLead: e.target.value === '' ? undefined : Number(e.target.value) } } : r))}
                              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400"
                              placeholder="Opcional"
                            />
                          </div>
                        </div>
                      )}
                      {rule.type === 'competitor' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Operador Lógico</label>
                            <select 
                              value={rule.config.competitorOperator || '>'}
                              onChange={(e) => setYieldRules(yieldRules.map(r => r.id === rule.id ? { ...r, config: { ...r.config, competitorOperator: e.target.value as any } } : r))}
                              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400"
                            >
                              <option value=">">Maior que (&gt;)</option>
                              <option value="<">Menor que (&lt;)</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preço do Concorrente</label>
                            <input 
                              type="number" 
                              value={rule.config.competitorPriceThreshold || ''}
                              onChange={(e) => setYieldRules(yieldRules.map(r => r.id === rule.id ? { ...r, config: { ...r.config, competitorPriceThreshold: e.target.value === '' ? undefined : Number(e.target.value) } } : r))}
                              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo de Ajuste</label>
                        <select 
                          value={rule.adjustmentType}
                          onChange={(e) => setYieldRules(yieldRules.map(r => r.id === rule.id ? { ...r, adjustmentType: e.target.value as any } : r))}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400"
                        >
                          <option value="percentage">Porcentagem (%)</option>
                          <option value="fixed">Valor Fixo (BRL)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Valor do Ajuste</label>
                        <input 
                          type="number" 
                          value={rule.adjustmentValue}
                          onChange={(e) => setYieldRules(yieldRules.map(r => r.id === rule.id ? { ...r, adjustmentValue: Number(e.target.value) } : r))}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => setEditingRuleId(null)}
                        className="px-6 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
                      >
                        Concluir
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center justify-between group hover:border-indigo-200 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        rule.isActive ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-400"
                      )}>
                        {rule.type === 'occupancy' && <Users size={24} />}
                        {rule.type === 'seasonality' && <Moon size={24} />}
                        {rule.type === 'lead-time' && <Clock size={24} />}
                        {rule.type === 'competitor' && <TrendingUp size={24} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800">{rule.name}</h4>
                          {!rule.isActive && <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">Inativo</span>}
                        </div>
                        <p className="text-sm text-slate-500">
                          {rule.type === 'occupancy' && (
                            <>
                              {rule.config.minOccupancy !== undefined && `Ocupação ≥ ${rule.config.minOccupancy}%`}
                              {rule.config.minOccupancy !== undefined && rule.config.maxOccupancy !== undefined && ' e '}
                              {rule.config.maxOccupancy !== undefined && `Ocupação ≤ ${rule.config.maxOccupancy}%`}
                            </>
                          )}
                          {rule.type === 'seasonality' && `Entre ${rule.config.startDate} e ${rule.config.endDate}`}
                          {rule.type === 'lead-time' && (
                            <>
                              {rule.config.minDaysLead !== undefined && `Antecedência ≥ ${rule.config.minDaysLead} dias`}
                              {rule.config.minDaysLead !== undefined && rule.config.maxDaysLead !== undefined && ' e '}
                              {rule.config.maxDaysLead !== undefined && `Antecedência ≤ ${rule.config.maxDaysLead} dias`}
                            </>
                          )}
                          {rule.type === 'competitor' && `Comparação com concorrente (${rule.config.competitorOperator} ${rule.config.competitorPriceThreshold})`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className={cn(
                          "font-bold text-lg",
                          rule.adjustmentValue > 0 ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {rule.adjustmentValue > 0 ? '+' : ''}{rule.adjustmentValue}{rule.adjustmentType === 'percentage' ? '%' : ' BRL'}
                        </div>
                        <div className="text-xs text-slate-400">Ajuste na tarifa</div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setEditingRuleId(rule.id)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={20} />
                        </button>
                        <button 
                          onClick={() => {
                            setYieldRules(yieldRules.map(r => r.id === rule.id ? { ...r, isActive: !r.isActive } : r));
                          }}
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            rule.isActive ? "text-indigo-600 hover:bg-indigo-50" : "text-slate-400 hover:bg-slate-100"
                          )}
                          title={rule.isActive ? "Desativar" : "Ativar"}
                        >
                          {rule.isActive ? <CheckCircle2 size={20} /> : <CircleOff size={20} />}
                        </button>
                        <button 
                          onClick={() => {
                            setYieldRules(yieldRules.filter(r => r.id !== rule.id));
                          }}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 flex items-start gap-4">
            <div className="p-2 bg-white rounded-lg text-indigo-600 shadow-sm">
              <Info size={20} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-indigo-900 text-sm">Como funciona o Yield Management?</h4>
              <p className="text-indigo-700 text-xs leading-relaxed">
                O sistema analisa cada reserva no momento da criação ou alteração. Se múltiplas regras forem aplicáveis, os ajustes são somados. 
                Por exemplo: Alta Ocupação (+20%) + Reserva Antecipada (-10%) = Ajuste final de +10% sobre a tarifa base.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'guest-portal' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-indigo-600">
                <Globe size={20} />
                <h3 className="font-bold">Configuração do Portal do Hóspede</h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-500">Status do Portal:</span>
                <button 
                  onClick={() => setEditGuestPortal({...editGuestPortal, isActive: !editGuestPortal.isActive})}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                    editGuestPortal.isActive ? "bg-emerald-500" : "bg-slate-200"
                  )}
                >
                  <span className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    editGuestPortal.isActive ? "translate-x-6" : "translate-x-1"
                  )} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                {/* Wi-Fi */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 border-b pb-2">Informações de Wi-Fi</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Rede (SSID)</label>
                      <input 
                        type="text" 
                        value={editGuestPortal.wifiSsid || ''}
                        onChange={e => setEditGuestPortal({...editGuestPortal, wifiSsid: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Senha do Wi-Fi</label>
                      <input 
                        type="text" 
                        value={editGuestPortal.wifiPassword || ''}
                        onChange={e => setEditGuestPortal({...editGuestPortal, wifiPassword: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Horários */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 border-b pb-2">Horários</h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">Check-in</label>
                        <input 
                          type="text" 
                          placeholder="Ex: 14:00"
                          value={editGuestPortal.checkinTime || ''}
                          onChange={e => setEditGuestPortal({...editGuestPortal, checkinTime: e.target.value})}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">Check-out</label>
                        <input 
                          type="text" 
                          placeholder="Ex: 12:00"
                          value={editGuestPortal.checkoutTime || ''}
                          onChange={e => setEditGuestPortal({...editGuestPortal, checkoutTime: e.target.value})}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">Café da Manhã</label>
                      <input 
                        type="text" 
                        placeholder="Ex: 07:30 às 10:00"
                        value={editGuestPortal.breakfastTime || ''}
                        onChange={e => setEditGuestPortal({...editGuestPortal, breakfastTime: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Políticas */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Políticas da Hospedagem</label>
                  <textarea 
                    value={editGuestPortal.policies}
                    onChange={e => setEditGuestPortal({...editGuestPortal, policies: e.target.value})}
                    placeholder="Regras de check-in, check-out, silêncio, etc."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-32"
                  />
                </div>

                {/* Endereço */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Endereço para Delivery</label>
                  <input 
                    type="text" 
                    value={editGuestPortal.deliveryAddress}
                    onChange={e => setEditGuestPortal({...editGuestPortal, deliveryAddress: e.target.value})}
                    placeholder="Endereço completo para o hóspede pedir comida"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-6">
                {/* Contatos */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 border-b pb-2">Contatos de Recepção</h4>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">WhatsApp (com DDI)</label>
                    <input 
                      type="text" 
                      value={editGuestPortal.whatsappNumber}
                      onChange={e => setEditGuestPortal({...editGuestPortal, whatsappNumber: e.target.value})}
                      placeholder="Ex: 5511998877665"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Telefone Fixo / Ligação</label>
                    <input 
                      type="text" 
                      value={editGuestPortal.phoneNumber || ''}
                      onChange={e => setEditGuestPortal({...editGuestPortal, phoneNumber: e.target.value})}
                      placeholder="Ex: 551133334444"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                {/* Link Compartilhar */}
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <ExternalLink size={16} className="text-indigo-600" />
                    Link de Acesso Direto
                  </h4>
                  <p className="text-xs text-slate-500">Compartilhe este link com seus hóspedes ou coloque um QR Code no quarto.</p>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={`${window.location.origin}/guest-portal/${establishment.slug}`}
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-600"
                    />
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/guest-portal/${establishment.slug}`);
                        toast.success('Link copiado!');
                      }}
                      className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold"
                    >
                      Copiar
                    </button>
                  </div>
                  <div className="pt-2">
                    <button 
                      onClick={() => window.open(`/guest-portal/${establishment.slug}`, '_blank')}
                      className="text-xs font-bold text-indigo-600 flex items-center gap-1"
                    >
                      Visualizar Portal <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="font-bold text-slate-800">Pontos Turísticos</h4>
                  <button 
                    onClick={() => {
                      const newSpot = { id: Date.now().toString(), name: 'Novo Local', description: '', link: '' };
                      setEditGuestPortal({...editGuestPortal, touristSpots: [...editGuestPortal.touristSpots, newSpot]});
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >+ Adicionar</button>
                </div>
                <div className="space-y-3">
                  {editGuestPortal.touristSpots.map((spot, i) => (
                    <div key={spot.id} className="p-4 bg-slate-50 rounded-xl space-y-2 relative border border-slate-100">
                      <button 
                        onClick={() => setEditGuestPortal({
                          ...editGuestPortal, 
                          touristSpots: editGuestPortal.touristSpots.filter(s => s.id !== spot.id)
                        })}
                        className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                      ><X size={14} /></button>
                      <input 
                        type="text" value={spot.name} placeholder="Nome"
                        onChange={(e) => {
                          const spots = [...editGuestPortal.touristSpots];
                          spots[i].name = e.target.value;
                          setEditGuestPortal({...editGuestPortal, touristSpots: spots});
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-sm outline-none"
                      />
                      <input 
                        type="text" value={spot.description} placeholder="Descrição curta"
                        onChange={(e) => {
                          const spots = [...editGuestPortal.touristSpots];
                          spots[i].description = e.target.value;
                          setEditGuestPortal({...editGuestPortal, touristSpots: spots});
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-sm outline-none"
                      />
                      <input 
                        type="text" value={spot.link || ''} placeholder="Link do Mapa (Opcional)"
                        onChange={(e) => {
                          const spots = [...editGuestPortal.touristSpots];
                          spots[i].link = e.target.value;
                          setEditGuestPortal({...editGuestPortal, touristSpots: spots});
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-sm outline-none"
                      />
                    </div>
                  ))}
                  {editGuestPortal.touristSpots.length === 0 && <p className="text-xs text-slate-500 text-center py-4">Nenhum ponto turístico adicionado.</p>}
                </div>

                <div className="flex items-center justify-between border-b pb-2 pt-4">
                  <h4 className="font-bold text-slate-800">Restaurantes</h4>
                  <button 
                    onClick={() => {
                      const newRest = { id: Date.now().toString(), name: 'Novo Restaurante', cuisine: '', phone: '', link: '' };
                      setEditGuestPortal({...editGuestPortal, restaurants: [...editGuestPortal.restaurants, newRest]});
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >+ Adicionar</button>
                </div>
                <div className="space-y-3">
                  {editGuestPortal.restaurants.map((rest, i) => (
                    <div key={rest.id} className="p-4 bg-slate-50 rounded-xl space-y-2 relative border border-slate-100">
                      <button 
                        onClick={() => setEditGuestPortal({
                          ...editGuestPortal, 
                          restaurants: editGuestPortal.restaurants.filter(r => r.id !== rest.id)
                        })}
                        className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                      ><X size={14} /></button>
                      <input 
                        type="text" value={rest.name} placeholder="Nome"
                        onChange={(e) => {
                          const rests = [...editGuestPortal.restaurants];
                          rests[i].name = e.target.value;
                          setEditGuestPortal({...editGuestPortal, restaurants: rests});
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-sm outline-none"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          type="text" value={rest.cuisine} placeholder="Culinária"
                          onChange={(e) => {
                            const rests = [...editGuestPortal.restaurants];
                            rests[i].cuisine = e.target.value;
                            setEditGuestPortal({...editGuestPortal, restaurants: rests});
                          }}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-sm outline-none"
                        />
                        <input 
                          type="text" value={rest.phone || ''} placeholder="Telefone"
                          onChange={(e) => {
                            const rests = [...editGuestPortal.restaurants];
                            rests[i].phone = e.target.value;
                            setEditGuestPortal({...editGuestPortal, restaurants: rests});
                          }}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-sm outline-none"
                        />
                      </div>
                    </div>
                  ))}
                  {editGuestPortal.restaurants.length === 0 && <p className="text-xs text-slate-500 text-center py-4">Nenhum restaurante adicionado.</p>}
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="font-bold text-slate-800">Canais de TV</h4>
                  <button 
                    onClick={() => {
                      const newCh = { id: Date.now().toString(), number: '', name: 'Novo Canal', category: '' };
                      setEditGuestPortal({...editGuestPortal, tvChannels: [...editGuestPortal.tvChannels, newCh]});
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >+ Adicionar</button>
                </div>
                <div className="space-y-3">
                  {editGuestPortal.tvChannels.map((ch, i) => (
                    <div key={ch.id} className="p-3 bg-slate-50 rounded-xl flex gap-2 relative border border-slate-100 pr-8">
                      <button 
                        onClick={() => setEditGuestPortal({
                          ...editGuestPortal, 
                          tvChannels: editGuestPortal.tvChannels.filter(c => c.id !== ch.id)
                        })}
                        className="absolute top-1/2 -translate-y-1/2 right-2 text-slate-400 hover:text-red-500"
                      ><X size={14} /></button>
                      <input 
                        type="text" value={ch.number} placeholder="Nº"
                        onChange={(e) => {
                          const chs = [...editGuestPortal.tvChannels];
                          chs[i].number = e.target.value;
                          setEditGuestPortal({...editGuestPortal, tvChannels: chs});
                        }}
                        className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded text-sm outline-none text-center"
                      />
                      <input 
                        type="text" value={ch.name} placeholder="Nome do Canal"
                        onChange={(e) => {
                          const chs = [...editGuestPortal.tvChannels];
                          chs[i].name = e.target.value;
                          setEditGuestPortal({...editGuestPortal, tvChannels: chs});
                        }}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded text-sm outline-none"
                      />
                      <input 
                        type="text" value={ch.category} placeholder="Categoria"
                        onChange={(e) => {
                          const chs = [...editGuestPortal.tvChannels];
                          chs[i].category = e.target.value;
                          setEditGuestPortal({...editGuestPortal, tvChannels: chs});
                        }}
                        className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded text-sm outline-none"
                      />
                    </div>
                  ))}
                  {editGuestPortal.tvChannels.length === 0 && <p className="text-xs text-slate-500 text-center py-4">Nenhum canal adicionado.</p>}
                </div>

                <div className="flex items-center justify-between border-b pb-2 pt-4">
                  <h4 className="font-bold text-slate-800">Contatos de Emergência</h4>
                  <button 
                    onClick={() => {
                      const newEm = { id: Date.now().toString(), name: 'Novo Contato', phone: '' };
                      setEditGuestPortal({...editGuestPortal, emergencyContacts: [...(editGuestPortal.emergencyContacts || []), newEm]});
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >+ Adicionar</button>
                </div>
                <div className="space-y-3">
                  {(editGuestPortal.emergencyContacts || []).map((em, i) => (
                    <div key={em.id} className="p-3 bg-slate-50 rounded-xl flex gap-2 relative border border-slate-100 pr-8">
                      <button 
                        onClick={() => setEditGuestPortal({
                          ...editGuestPortal, 
                          emergencyContacts: editGuestPortal.emergencyContacts?.filter(c => c.id !== em.id)
                        })}
                        className="absolute top-1/2 -translate-y-1/2 right-2 text-slate-400 hover:text-red-500"
                      ><X size={14} /></button>
                      <input 
                        type="text" value={em.name} placeholder="Nome (Ex: Polícia)"
                        onChange={(e) => {
                          const ems = [...(editGuestPortal.emergencyContacts || [])];
                          ems[i].name = e.target.value;
                          setEditGuestPortal({...editGuestPortal, emergencyContacts: ems});
                        }}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded text-sm outline-none"
                      />
                      <input 
                        type="text" value={em.phone} placeholder="Telefone"
                        onChange={(e) => {
                          const ems = [...(editGuestPortal.emergencyContacts || [])];
                          ems[i].phone = e.target.value;
                          setEditGuestPortal({...editGuestPortal, emergencyContacts: ems});
                        }}
                        className="w-32 px-3 py-1.5 bg-white border border-slate-200 rounded text-sm outline-none"
                      />
                    </div>
                  ))}
                  {(!editGuestPortal.emergencyContacts || editGuestPortal.emergencyContacts.length === 0) && <p className="text-xs text-slate-500 text-center py-4">Nenhum contato adicionado.</p>}
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => {
                  setGuestPortalConfig(editGuestPortal);
                  toast.success('Configurações do portal salvas!');
                }}
                className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
              >
                <Save size={18} />
                Salvar Configurações do Portal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PublicWrapper = ({ establishment, rooms, bookings, dailyRates, ratePlans, handlePublicBookingComplete }: any) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  if (slug !== establishment.slug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">404</h1>
          <p className="text-slate-500">Estabelecimento não encontrado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="fixed top-4 right-4 z-50">
        <button 
          onClick={() => navigate(`/b/${slug}/consult`)}
          className="bg-white/90 backdrop-blur shadow-lg text-indigo-600 font-bold px-6 py-3 rounded-full hover:bg-white transition-all flex items-center gap-2"
        >
          <Search size={18} />
          Minhas Reservas
        </button>
      </div>
      <PublicBookingPage 
        establishment={establishment} 
        rooms={rooms} 
        bookings={bookings}
        dailyRates={dailyRates}
        ratePlans={ratePlans}
        onBookingComplete={handlePublicBookingComplete} 
      />
    </div>
  );
};

const ConsultationWrapper = ({ bookings, clients, rooms, establishment }: any) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  // Simulated validation of token/slug
  useEffect(() => {
    try {
      // In a real scenario, the slug/token is a JWT verified on the backend.
      // Here we simulate the logic: checking if any active bookings exist for this "token".
      // If none exist (or if checkout date passed), we lock the user out.
      const hasActiveBookings = bookings.some((b: Booking) => {
        const checkOut = parseISO(b.checkOut);
        return isAfter(checkOut, startOfToday()) || isSameDay(checkOut, startOfToday());
      });

      if (!hasActiveBookings && bookings.length > 0) {
         // Se todas as reservas passaram da data de checkout, simula expiração do JWT.
         setError("Acesso expirado. A sua reserva já foi concluída e o link não é mais válido por motivos de segurança.");
      }
    } catch (e) {
      setError("Token inválido.");
    }
  }, [bookings]);

  if (slug !== establishment.slug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">404</h1>
          <p className="text-slate-500">Estabelecimento não encontrado.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
       <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-xl">
          <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Acesso Expirado</h1>
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <PublicBookingConsultation 
      bookings={bookings}
      clients={clients}
      rooms={rooms}
      establishment={establishment}
      onBack={() => navigate(`/b/${slug}`)}
    />
  );
};

const FNRHWrapper = ({ bookings, clients, establishment, setClients }: any) => {
  const { slug } = useParams<{ slug: string }>();

  if (slug !== establishment.slug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">404</h1>
          <p className="text-slate-500">Estabelecimento não encontrado.</p>
        </div>
      </div>
    );
  }

  const handleFNRHComplete = (clientData: Partial<Client>) => {
    // Update client data in the main state if needed
    console.log('FNRH Completed:', clientData);
  };

  return (
    <PublicFNRHForm 
      establishment={establishment}
      bookings={bookings}
      clients={clients}
      onComplete={handleFNRHComplete}
    />
  );
};

const GuestPortalWrapper = ({ config, establishment }: any) => {
  const { slug } = useParams<{ slug: string }>();

  if (slug !== establishment.slug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">404</h1>
          <p className="text-slate-500">Estabelecimento não encontrado.</p>
        </div>
      </div>
    );
  }

  return (
    <GuestPortalPage 
      config={config}
      establishment={establishment}
    />
  );
};

interface RatesCalendarViewProps {
  ratePlans: RatePlan[];
  dailyRates: DailyRate[];
  setDailyRates: React.Dispatch<React.SetStateAction<DailyRate[]>>;
  setRatePlans: React.Dispatch<React.SetStateAction<RatePlan[]>>;
  roomCategories: RoomCategory[];
  rooms: Room[];
  bookings: Booking[];
  clients: Client[];
  onNavigateToCalendar?: () => void;
}

const RatesCalendarView = ({ 
  ratePlans, 
  dailyRates, 
  setDailyRates, 
  setRatePlans,
  roomCategories,
  rooms,
  bookings,
  clients,
  onNavigateToCalendar
}: RatesCalendarViewProps) => {
  const [startDate, setStartDate] = useState(startOfToday());
  const [cellMenu, setCellMenu] = useState<{ planId: string, date: string, x: number, y: number } | null>(null);
  const [editRateModal, setEditRateModal] = useState<{ planId: string, date: string } | null>(null);
  const [editRateData, setEditRateData] = useState<{ price: string, minStay: string }>({ price: '', minStay: '' });
  const [selectedCategoryModal, setSelectedCategoryModal] = useState<RoomCategory | null>(null);
  
  // New Plan Modal State
  const [isNewPlanModalOpen, setIsNewPlanModalOpen] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [newPlanData, setNewPlanData] = useState<Partial<RatePlan>>({
    category: '',
    name: '',
    basePrice: 0,
    cancellationPolicy: 'flexible',
    mealPlan: 'room-only',
    minStay: 1,
    maxStay: 30,
    priceVariesByDayOfWeek: false,
    pricesByDayOfWeek: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    priceVariesByGuests: false,
    normalOccupancy: 1,
    guestAdjustments: {},
    chargesForChildren: false,
    childrenAgeFrom: 0,
    childrenAgeTo: 0,
    childrenFee: 0,
    chargesMandatoryFee: false,
    mandatoryFeeName: '',
    mandatoryFeeAmount: 0,
    mandatoryFeeType: 'per-reservation',
    hasMaxStay: false,
    notes: '',
    validFrom: format(new Date(), 'yyyy-MM-dd'),
    validTo: ''
  });

  // Bulk Edit Modal State
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({
    planIds: [] as string[],
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // 0 = Sunday, 1 = Monday, etc.
    action: 'set' as 'set' | 'increase' | 'decrease',
    value: 0,
    valueType: 'fixed' as 'fixed' | 'percentage',
    updateMinStay: false,
    minStay: 1,
    updateMaxStay: false,
    maxStay: 30,
    updateClosedForSale: false,
    closedForSale: false,
    updateClosedForArrival: false,
    closedForArrival: false,
    updateClosedForDeparture: false,
    closedForDeparture: false,
    removeOverrides: false
  });

  const daysToShow = 14;
  const dateRange = Array.from({ length: daysToShow }).map((_, i) => addDays(startDate, i));

  const getPrice = (planId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const rate = dailyRates.find(r => r.ratePlanId === planId && r.date === dateStr);
    if (rate) return rate.price;
    const plan = ratePlans.find(p => p.id === planId);
    if (!plan) return 150;
    if (plan.priceVariesByDayOfWeek && plan.pricesByDayOfWeek) {
      return plan.pricesByDayOfWeek[date.getDay()] || plan.basePrice || 0;
    }
    return plan.basePrice || 0;
  };

  const getMinMaxStay = (planId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const rate = dailyRates.find(r => r.ratePlanId === planId && r.date === dateStr);
    const plan = ratePlans.find(p => p.id === planId);
    return {
      minStay: rate?.minStay ?? plan?.minStay ?? 1,
      maxStay: rate?.maxStay ?? plan?.maxStay
    };
  };

  const getClosedStatus = (planId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const rate = dailyRates.find(r => r.ratePlanId === planId && r.date === dateStr);
    return {
      closedForSale: rate?.closedForSale ?? false,
      closedForArrival: rate?.closedForArrival ?? false,
      closedForDeparture: rate?.closedForDeparture ?? false
    };
  };

  const handleToggleClosedStatus = (planId: string, dateStr: string, type: 'sale' | 'arrival' | 'departure') => {
    setDailyRates(prev => {
      const existing = prev.find(r => r.ratePlanId === planId && r.date === dateStr);
      if (existing) {
        return prev.map(r => r.id === existing.id ? {
          ...r,
          closedForSale: type === 'sale' ? !r.closedForSale : r.closedForSale,
          closedForArrival: type === 'arrival' ? !r.closedForArrival : r.closedForArrival,
          closedForDeparture: type === 'departure' ? !r.closedForDeparture : r.closedForDeparture
        } : r);
      } else {
        const plan = ratePlans.find(p => p.id === planId);
        const date = parseISO(dateStr);
        const price = plan ? (plan.pricesByDayOfWeek?.[date.getDay()] || plan.basePrice || 0) : 0;
        return [...prev, {
          id: `dr-${planId}-${dateStr.replace(/-/g, '')}`,
          ratePlanId: planId,
          date: dateStr,
          price,
          closedForSale: type === 'sale',
          closedForArrival: type === 'arrival',
          closedForDeparture: type === 'departure'
        }];
      }
    });
    toast.success('Preços e restrições atualizados com sucesso.');
    setCellMenu(null);
  };

  const handleSaveEditRateModal = () => {
    if (!editRateModal) return;
    const { planId, date } = editRateModal;
    const numValue = parseFloat(editRateData.price.replace(',', '.'));
    const minStayValue = parseInt(editRateData.minStay, 10);
    
    if (!isNaN(numValue)) {
      setDailyRates(prev => {
        const existing = prev.find(r => r.ratePlanId === planId && r.date === date);
        if (existing) {
          return prev.map(r => r.id === existing.id ? { 
            ...r, 
            price: numValue,
            minStay: isNaN(minStayValue) ? r.minStay : minStayValue
          } : r);
        } else {
          return [...prev, { 
            id: `dr-${planId}-${date.replace(/-/g, '')}`, 
            ratePlanId: planId, 
            date: date, 
            price: numValue,
            minStay: isNaN(minStayValue) ? undefined : minStayValue
          }];
        }
      });
      toast.success('Preços e restrições atualizados com sucesso.');
    }
    setEditRateModal(null);
  };

  const handleRemoveOverride = (planId: string, dateStr: string) => {
    setDailyRates(prev => prev.filter(r => !(r.ratePlanId === planId && r.date === dateStr)));
    toast.success('Personalização removida com sucesso.');
    setCellMenu(null);
  };

  const handleAddPlan = () => {
    if (newPlanData.name && newPlanData.category) {
      if (newPlanData.id) {
        // Edit existing plan
        setRatePlans(prev => prev.map(p => p.id === newPlanData.id ? { ...p, ...newPlanData } as RatePlan : p));
        toast.success('Plano tarifário atualizado com sucesso!');
      } else {
        // Create new plan
        const newPlan: RatePlan = {
          id: `rp-${Date.now()}`,
          name: newPlanData.name,
          category: newPlanData.category,
          basePrice: newPlanData.basePrice,
          cancellationPolicy: newPlanData.cancellationPolicy,
          mealPlan: newPlanData.mealPlan,
          minStay: newPlanData.minStay,
          maxStay: newPlanData.hasMaxStay ? newPlanData.maxStay : undefined,
          priceVariesByDayOfWeek: newPlanData.priceVariesByDayOfWeek,
          pricesByDayOfWeek: newPlanData.priceVariesByDayOfWeek ? newPlanData.pricesByDayOfWeek : undefined,
          priceVariesByGuests: newPlanData.priceVariesByGuests,
          normalOccupancy: newPlanData.priceVariesByGuests ? newPlanData.normalOccupancy : undefined,
          guestAdjustments: newPlanData.priceVariesByGuests ? newPlanData.guestAdjustments : undefined,
          chargesForChildren: newPlanData.chargesForChildren,
          childrenAgeFrom: newPlanData.chargesForChildren ? newPlanData.childrenAgeFrom : undefined,
          childrenAgeTo: newPlanData.chargesForChildren ? newPlanData.childrenAgeTo : undefined,
          childrenFee: newPlanData.chargesForChildren ? newPlanData.childrenFee : undefined,
          chargesMandatoryFee: newPlanData.chargesMandatoryFee,
          mandatoryFeeName: newPlanData.chargesMandatoryFee ? newPlanData.mandatoryFeeName : undefined,
          mandatoryFeeAmount: newPlanData.chargesMandatoryFee ? newPlanData.mandatoryFeeAmount : undefined,
          mandatoryFeeType: newPlanData.chargesMandatoryFee ? newPlanData.mandatoryFeeType : undefined,
          notes: newPlanData.notes,
          validFrom: newPlanData.validFrom,
          validTo: newPlanData.validTo
        };
        setRatePlans(prev => [...prev, newPlan]);
        toast.success('Plano tarifário criado com sucesso!');
      }
      setIsNewPlanModalOpen(false);
      setNewPlanData({
        category: '', name: '', basePrice: 0, cancellationPolicy: 'flexible', mealPlan: 'room-only', minStay: 1, maxStay: 30, priceVariesByDayOfWeek: false, pricesByDayOfWeek: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }, priceVariesByGuests: false, normalOccupancy: 1, guestAdjustments: {}, chargesForChildren: false, childrenAgeFrom: 0, childrenAgeTo: 0, childrenFee: 0, chargesMandatoryFee: false, mandatoryFeeName: '', mandatoryFeeAmount: 0, mandatoryFeeType: 'per-reservation', hasMaxStay: false, notes: '', validFrom: format(new Date(), 'yyyy-MM-dd'), validTo: ''
      });
    }
  };

  const handleDeletePlan = (planId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este plano tarifário?')) {
      setRatePlans(prev => prev.filter(p => p.id !== planId));
      setDailyRates(prev => prev.filter(r => r.ratePlanId !== planId));
      setIsNewPlanModalOpen(false);
      toast.success('Plano tarifário excluído com sucesso!');
    }
  };

  const handleBulkEdit = () => {
    if (bulkEditData.planIds.length === 0 || !bulkEditData.startDate || !bulkEditData.endDate) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }

    const start = parseISO(bulkEditData.startDate);
    const end = parseISO(bulkEditData.endDate);
    
    if (start > end) {
      toast.error('A data de início deve ser anterior à data de fim.');
      return;
    }

    setDailyRates(prev => {
      // Remove old rates for the affected dates and plans
      const filtered = prev.filter(r => {
        if (!bulkEditData.planIds.includes(r.ratePlanId)) return true;
        const rDate = parseISO(r.date);
        return rDate < start || rDate > end || !bulkEditData.daysOfWeek.includes(rDate.getDay());
      });

      if (bulkEditData.removeOverrides) {
        return filtered;
      }

      const newRates: DailyRate[] = [];
      let currentDate = start;

      while (currentDate <= end) {
        if (bulkEditData.daysOfWeek.includes(currentDate.getDay())) {
          const dateStr = format(currentDate, 'yyyy-MM-dd');
          
          bulkEditData.planIds.forEach(planId => {
            const currentPrice = getPrice(planId, currentDate);
            let newPrice = currentPrice;

            const val = Number(bulkEditData.value);

            if (bulkEditData.action === 'set') {
              newPrice = val;
            } else if (bulkEditData.action === 'increase') {
              newPrice = bulkEditData.valueType === 'fixed' ? currentPrice + val : currentPrice * (1 + val / 100);
            } else if (bulkEditData.action === 'decrease') {
              newPrice = bulkEditData.valueType === 'fixed' ? currentPrice - val : currentPrice * (1 - val / 100);
            }

            newRates.push({
              id: `dr-${planId}-${dateStr.replace(/-/g, '')}`,
              ratePlanId: planId,
              date: dateStr,
              price: Math.max(0, newPrice), // Prevent negative prices
              ...(bulkEditData.updateMinStay && { minStay: bulkEditData.minStay }),
              ...(bulkEditData.updateMaxStay && { maxStay: bulkEditData.maxStay }),
              ...(bulkEditData.updateClosedForSale && { closedForSale: bulkEditData.closedForSale }),
              ...(bulkEditData.updateClosedForArrival && { closedForArrival: bulkEditData.closedForArrival }),
              ...(bulkEditData.updateClosedForDeparture && { closedForDeparture: bulkEditData.closedForDeparture }),
            });
          });
        }
        currentDate = addDays(currentDate, 1);
      }

      return [...filtered, ...newRates];
    });

    setIsBulkEditModalOpen(false);
    toast.success(bulkEditData.removeOverrides ? 'Personalizações removidas com sucesso!' : 'Preços atualizados em massa com sucesso!');
  };

  // Group rate plans by category
  const plansByCategory = ratePlans.reduce((acc, plan) => {
    if (!acc[plan.category]) acc[plan.category] = [];
    acc[plan.category].push(plan);
    return acc;
  }, {} as Record<string, typeof ratePlans>);

  // Group dates by month
  const months = dateRange.reduce((acc, date) => {
    const monthKey = format(date, 'MMMM yyyy', { locale: ptBR });
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(date);
    return acc;
  }, {} as Record<string, Date[]>);

  const toggleDayOfWeek = (day: number) => {
    setBulkEditData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day) 
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day]
    }));
  };

  const weekDays = [
    { id: 0, label: 'Dom → 2ª' }, { id: 1, label: '2ª → 3ª' }, { id: 2, label: '3ª → 4ª' },
    { id: 3, label: '4ª → 5ª' }, { id: 4, label: '5ª → 6ª' }, { id: 5, label: '6ª → Sáb' }, { id: 6, label: 'Sáb → Dom' }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Calendário Tarifário</h2>
          <p className="text-slate-500 mt-1 font-medium">Gerencie preços e planos tarifários do seu estabelecimento</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {onNavigateToCalendar && (
            <button 
              onClick={onNavigateToCalendar}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2"
            >
              <CalendarIcon size={16} className="text-slate-500" />
              Mapa de Reservas
            </button>
          )}
          <button 
            onClick={() => setIsBulkEditModalOpen(true)}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <Edit2 size={16} className="text-indigo-500" />
            Edição em Massa
          </button>
          <button 
            onClick={() => {
              setIsNewPlanModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2"
          >
            <Plus size={16} strokeWidth={2.5} />
            Novo Plano Tarifário
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50 z-20">
          <div className="flex items-center bg-white border border-slate-200/60 p-1 rounded-2xl overflow-hidden shadow-sm">
            <button 
              onClick={() => setStartDate(startOfToday())}
              className="px-5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-all"
            >
              Hoje
            </button>
            <div className="w-[1px] h-6 bg-slate-200 mx-1" />
            <button 
              onClick={() => setStartDate(subDays(startDate, 7))}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-colors"
              title="Voltar 7 dias"
            >
              <ArrowLeft size={18} strokeWidth={2.5} />
            </button>
            <div className="w-[1px] h-6 bg-slate-200 mx-1" />
            <div className="relative flex items-center hover:bg-slate-50 rounded-xl transition-colors cursor-pointer" title="Escolher data">
              <input 
                type="date"
                value={format(startDate, 'yyyy-MM-dd')}
                onChange={(e) => {
                  if (e.target.value) setStartDate(parseISO(e.target.value));
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />
              <div className="px-3 py-2 text-slate-700 pointer-events-none flex items-center gap-2 text-sm font-bold tracking-tight">
                <CalendarIcon size={18} strokeWidth={2.5} className="text-indigo-500" />
                {format(startDate, 'dd MMM', { locale: ptBR })} - {format(addDays(startDate, daysToShow - 1), 'dd MMM', { locale: ptBR })}
              </div>
            </div>
            <div className="w-[1px] h-6 bg-slate-200 mx-1" />
            <button 
              onClick={() => setStartDate(addDays(startDate, 7))}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-colors"
              title="Avançar 7 dias"
            >
              <ArrowRight size={18} strokeWidth={2.5} />
            </button>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500 font-bold bg-white px-4 py-2.5 rounded-2xl border border-slate-200/60 shadow-sm">
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-50 border border-indigo-200 shadow-sm"></div> 
              Hoje
            </span>
            <div className="w-[1px] h-4 bg-slate-200 mx-1" />
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-50 border border-slate-200 shadow-sm"></div> 
              Fim de semana
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[1000px] text-sm">
            <thead>
              <tr>
                <th className="w-56 bg-white border-b border-r border-slate-100 p-3 text-left sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Planos Tarifários</span>
                </th>
                {Object.entries(months).map(([month, dates]) => (
                  <th 
                    key={month} 
                    colSpan={(dates as Date[]).length} 
                    className="bg-slate-50 border-b border-r border-slate-100 p-2 text-center text-xs font-bold text-slate-700 uppercase tracking-wider"
                  >
                    {month}
                  </th>
                ))}
              </tr>
              <tr>
                <th className="bg-white border-b border-r border-slate-100 p-3 text-left sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]"></th>
                {dateRange.map((date, i) => {
                  const isWeekendDay = date.getDay() === 0 || date.getDay() === 6;
                  return (
                    <th 
                      key={i} 
                      className={cn(
                        "border-b border-r border-slate-100 p-2 text-center transition-colors min-w-[70px]",
                        isToday(date) ? "bg-indigo-50/50" : 
                        isWeekendDay ? "bg-slate-50/50" : "bg-white"
                      )}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span className={cn("text-[10px] font-bold uppercase tracking-widest leading-none mt-1", isToday(date) ? "text-indigo-600" : "text-slate-400")}>
                          {format(date, 'E', { locale: ptBR }).substring(0, 3)}
                        </span>
                        <span className={cn("text-xs font-bold leading-none mt-1", isToday(date) ? "text-indigo-700" : "text-slate-700")}>
                          {format(date, 'dd')}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {Object.entries(plansByCategory).map(([category, plans]) => (
                <React.Fragment key={category}>
                  <tr>
                    <td 
                      colSpan={daysToShow + 1} 
                      className="bg-slate-50/80 backdrop-blur-md border-b border-slate-100 p-3 text-xs font-bold text-slate-700 uppercase tracking-wider sticky left-0 z-10"
                    >
                      <div 
                        className="flex items-center gap-2 cursor-pointer hover:text-indigo-600 transition-colors w-fit"
                        onClick={() => {
                          const categoryObj = roomCategories.find(c => c.name === category);
                          if (categoryObj) setSelectedCategoryModal(categoryObj);
                        }}
                      >
                        <ChevronDown size={16} className="text-slate-400" />
                        {category}
                      </div>
                    </td>
                  </tr>
                  {plans.map(plan => (
                    <tr key={plan.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="border-b border-r border-slate-100 p-4 bg-white sticky left-0 z-10 shadow-[2px_0_10px_-4px_rgba(0,0,0,0.05)] group-hover:bg-slate-50 transition-colors">
                        <div className="flex flex-col">
                          <span 
                            className="font-bold text-slate-700 cursor-pointer group-hover:text-indigo-600 transition-colors w-fit text-xs"
                            onClick={() => {
                              setNewPlanData(plan);
                              setIsNewPlanModalOpen(true);
                            }}
                          >
                            {plan.name}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-2 font-semibold">
                            {plan.normalOccupancy && (
                              <span className="flex items-center gap-1" title={`Ocupação Base: ${plan.normalOccupancy}`}>
                                <Users size={12} /> x{plan.normalOccupancy}
                              </span>
                            )}
                            {plan.minStay && plan.minStay > 1 && (
                              <span className="flex items-center gap-1" title={`Estadia Mínima Base: ${plan.minStay}`}>
                                <Moon size={12} /> x{plan.minStay}
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      {dateRange.map((date, i) => {
                        const dateStr = format(date, 'yyyy-MM-dd');
                        const isWeekendDay = date.getDay() === 0 || date.getDay() === 6;
                        const closedStatus = getClosedStatus(plan.id, date);
                        const isClosed = closedStatus.closedForSale;
                        
                        return (
                          <td 
                            key={i} 
                            className={cn(
                              "border-b border-r border-slate-100 p-0 text-center relative transition-colors group/cell h-[60px]",
                              isClosed ? "bg-slate-100/80 text-slate-500" :
                              isToday(date) ? "bg-indigo-50/10 hover:bg-indigo-50/30" :
                              isWeekendDay ? "bg-slate-50/30 hover:bg-slate-100" : "bg-white hover:bg-slate-50"
                            )}
                            onClick={(e) => {
                              e.preventDefault();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setCellMenu({ planId: plan.id, date: dateStr, x: rect.left, y: rect.bottom });
                            }}
                          >
                            <div className="p-2 w-full h-full flex flex-col items-center justify-center cursor-pointer">
                              {isClosed ? (
                                <span className="font-bold text-[11px] text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md">Fechado</span>
                              ) : (
                                <>
                                  <span className={cn("text-xs font-bold", closedStatus.closedForArrival || closedStatus.closedForDeparture ? "text-amber-600" : "text-slate-700")}>
                                    R$ {(getPrice(plan.id, date) || 0).toFixed(2).replace('.', ',')}
                                  </span>
                                  {(() => {
                                    const { minStay, maxStay } = getMinMaxStay(plan.id, date);
                                    if (minStay > 1 || maxStay || closedStatus.closedForArrival || closedStatus.closedForDeparture) {
                                      return (
                                        <div className="flex gap-1 mt-1 text-[9px] font-bold text-slate-500 flex-wrap justify-center">
                                          {minStay > 1 && <span title={`Estadia Mínima: ${minStay} noites`} className="px-1 bg-slate-100 rounded text-slate-600">M{minStay}</span>}
                                          {maxStay && <span title={`Estadia Máxima: ${maxStay} noites`} className="px-1 bg-slate-100 rounded text-slate-600">X{maxStay}</span>}
                                          {closedStatus.closedForArrival && <span title="Fechado para chegada" className="px-1 bg-amber-100 text-amber-700 rounded">FC</span>}
                                          {closedStatus.closedForDeparture && <span title="Fechado para saída" className="px-1 bg-amber-100 text-amber-700 rounded">FS</span>}
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                </>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Plan Modal */}
      {isNewPlanModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-4">
                <h3 className="text-2xl font-semibold text-slate-800">
                  {newPlanData.id ? 'Atualizar Plano Tarifário' : 'Novo Plano Tarifário'}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                {newPlanData.id && (
                  <button 
                    onClick={() => handleDeletePlan(newPlanData.id!)}
                    className="px-4 py-2 bg-[#dc3545] text-white text-sm font-medium rounded-lg hover:bg-[#c82333] transition-colors"
                  >
                    Deletar plano tarifário
                  </button>
                )}
                <button onClick={() => setIsNewPlanModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-white">
              {/* Form Fields */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nome*</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={newPlanData.name}
                    onChange={(e) => setNewPlanData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Tarifa Padrão"
                  />
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Válido de*</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none border-r border-slate-300 pr-3 bg-slate-50 rounded-l-lg">
                        <CalendarIcon size={18} className="text-slate-500" />
                      </div>
                      <input 
                        type="date" 
                        className="w-full pl-14 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        value={newPlanData.validFrom || format(new Date(), 'yyyy-MM-dd')}
                        onChange={(e) => setNewPlanData(prev => ({ ...prev, validFrom: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1">
                      Válido até (incluindo) <Info size={14} className="text-slate-400" />
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none border-r border-slate-300 pr-3 bg-slate-50 rounded-l-lg">
                        <CalendarIcon size={18} className="text-slate-500" />
                      </div>
                      <input 
                        type="date" 
                        className="w-full pl-14 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        value={newPlanData.validTo || ''}
                        onChange={(e) => setNewPlanData(prev => ({ ...prev, validTo: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Categoria de quarto*</label>
                  <select 
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    value={newPlanData.category || ''}
                    onChange={(e) => setNewPlanData(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="" disabled>Selecione uma categoria</option>
                    {roomCategories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Estadia mínima*</label>
                  <div className="flex">
                    <input 
                      type="number" 
                      min="1"
                      className="flex-1 px-4 py-2.5 border border-slate-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      value={newPlanData.minStay || 1}
                      onChange={(e) => setNewPlanData(prev => ({ ...prev, minStay: parseInt(e.target.value) }))}
                    />
                    <div className="px-4 py-2.5 bg-slate-100 border-y border-r border-slate-300 rounded-r-lg text-slate-600 flex items-center gap-2">
                      <Moon size={16} /> noites
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <h4 className="text-xl font-semibold text-slate-800 mb-4">Tarifário</h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Preço base*</label>
                          <div className="flex">
                            <div className="px-4 py-2.5 bg-slate-100 border-y border-l border-slate-300 rounded-l-lg text-slate-600 flex items-center">
                              R$
                            </div>
                            <input 
                              type="number" 
                              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                              placeholder="0"
                              value={newPlanData.basePrice || ''}
                              onChange={(e) => setNewPlanData(prev => ({ ...prev, basePrice: parseFloat(e.target.value) }))}
                            />
                          </div>
                        </div>

                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                          <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center gap-2">
                            <Sun size={16} className="text-slate-500" />
                            <span className="font-medium text-slate-700 text-sm">O preço do quarto muda dependendo do dia da semana?</span>
                            <Info size={14} className="text-slate-400" />
                          </div>
                          <div className="p-4 space-y-3 bg-white">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input 
                                type="radio" 
                                name="priceVariesByDayOfWeek" 
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                                checked={newPlanData.priceVariesByDayOfWeek === true}
                                onChange={() => setNewPlanData(prev => ({ ...prev, priceVariesByDayOfWeek: true }))}
                              />
                              <span className="text-slate-700 text-sm">Sim, os preços variam de acordo com o dia da semana</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input 
                                type="radio" 
                                name="priceVariesByDayOfWeek" 
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                                checked={newPlanData.priceVariesByDayOfWeek !== true}
                                onChange={() => setNewPlanData(prev => ({ ...prev, priceVariesByDayOfWeek: false }))}
                              />
                              <span className="text-slate-700 text-sm">Não, os preços são os mesmos todos os dias</span>
                            </label>

                            {newPlanData.priceVariesByDayOfWeek && (
                              <div className="pt-4 mt-4 border-t border-slate-100">
                                <div className="grid grid-cols-2 gap-4 mb-2">
                                  <div className="text-sm font-bold text-slate-700">Dia da semana</div>
                                  <div className="text-sm font-bold text-slate-700">Preço</div>
                                </div>
                                <div className="space-y-3">
                                  {[
                                    { label: '2ª → 3ª', key: 1 },
                                    { label: '3ª → 4ª', key: 2 },
                                    { label: '4ª → 5ª', key: 3 },
                                    { label: '5ª → 6ª', key: 4 },
                                    { label: '6ª → Sáb', key: 5 },
                                    { label: 'Sáb → Dom', key: 6 },
                                    { label: 'Dom → 2ª', key: 0 },
                                  ].map((day) => (
                                    <div key={day.key} className="grid grid-cols-2 gap-4 items-center">
                                      <div className="flex items-center gap-2 text-sm text-slate-700">
                                        <Moon size={14} className="text-slate-400" />
                                        {day.label}
                                      </div>
                                      <div className="flex">
                                        <div className="px-3 py-2 bg-slate-100 border-y border-l border-slate-300 rounded-l-lg text-slate-600 flex items-center text-sm">
                                          R$
                                        </div>
                                        <input 
                                          type="number" 
                                          min="0"
                                          className="w-full px-3 py-2 border border-slate-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                          value={newPlanData.pricesByDayOfWeek?.[day.key] || 0}
                                          onChange={(e) => setNewPlanData(prev => ({ 
                                            ...prev, 
                                            pricesByDayOfWeek: { 
                                              ...(prev.pricesByDayOfWeek || { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }), 
                                              [day.key]: parseFloat(e.target.value) || 0 
                                            } 
                                          }))}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center gap-2">
                        <Users size={16} className="text-slate-500" />
                        <span className="font-medium text-slate-700 text-sm">O preço do quarto muda dependendo do número de hóspedes?</span>
                      </div>
                      <div className="p-4 space-y-3 bg-white">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                            type="radio" 
                            name="priceVariesByGuests" 
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                            checked={newPlanData.priceVariesByGuests === true}
                            onChange={() => setNewPlanData(prev => ({ ...prev, priceVariesByGuests: true }))}
                          />
                          <span className="text-slate-700 text-sm">Sim, mais hóspedes custam mais</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                            type="radio" 
                            name="priceVariesByGuests" 
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                            checked={newPlanData.priceVariesByGuests !== true}
                            onChange={() => setNewPlanData(prev => ({ ...prev, priceVariesByGuests: false }))}
                          />
                          <span className="text-slate-700 text-sm">Não, o preço é o mesmo para qualquer número de hóspedes</span>
                        </label>

                        {newPlanData.priceVariesByGuests && (
                          <div className="pt-4 mt-4 border-t border-slate-100 space-y-4">
                            <div>
                              <p className="text-sm font-bold text-slate-700 mb-1">Qual é a ocupação normal que você deseja usar para esta tarifa?</p>
                              <p className="text-sm text-slate-600 mb-3">A ocupação normal é quantos hóspedes você deseja incluir no preço base. O preço base é a base para seus cálculos de preços por hóspede.</p>
                              <label className="block text-sm font-bold text-slate-700 mb-1">Ocupação normal</label>
                              <select 
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                value={newPlanData.normalOccupancy || 1}
                                onChange={(e) => setNewPlanData(prev => ({ ...prev, normalOccupancy: parseInt(e.target.value) }))}
                              >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                  <option key={num} value={num}>{num} {num === 1 ? 'hóspede' : 'hóspedes'}</option>
                                ))}
                              </select>
                            </div>
                            
                            <div className="pt-2">
                              <div className="grid grid-cols-12 gap-4 mb-2">
                                <div className="col-span-3 text-sm font-bold text-slate-700">Ocupação</div>
                                <div className="col-span-6 text-sm font-bold text-slate-700">Ajuste</div>
                                <div className="col-span-3 text-sm font-bold text-slate-700 text-right">Preço</div>
                              </div>
                              <div className="space-y-3">
                                {/* Base Occupancy Row */}
                                <div className="grid grid-cols-12 gap-4 items-center border-b border-slate-100 pb-3">
                                  <div className="col-span-3 flex items-center gap-2 text-sm text-slate-700">
                                    <Users size={14} className="text-slate-400" />
                                    {newPlanData.normalOccupancy || 1} {(newPlanData.normalOccupancy || 1) === 1 ? 'hóspede' : 'hóspedes'}
                                  </div>
                                  <div className="col-span-6 text-sm text-slate-600">
                                    Preço base
                                  </div>
                                  <div className="col-span-3 text-sm text-slate-700 text-right">
                                    {/* Empty for base price */}
                                  </div>
                                </div>

                                {/* Additional Guests Rows */}
                                {Array.from({ length: Math.max(0, 4 - (newPlanData.normalOccupancy || 1)) }).map((_, idx) => {
                                  const guestCount = (newPlanData.normalOccupancy || 1) + idx + 1;
                                  return (
                                    <div key={guestCount} className="grid grid-cols-12 gap-4 items-center border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                                      <div className="col-span-3 flex items-center gap-2 text-sm text-slate-700">
                                        <Users size={14} className="text-slate-400" />
                                        {guestCount} hóspedes
                                      </div>
                                      <div className="col-span-6">
                                        <div className="text-sm text-slate-600 mb-1">Preço base <span className="font-semibold text-slate-800">aumentado</span> em</div>
                                        <div className="flex gap-2">
                                          <input 
                                            type="number" 
                                            min="0"
                                            className="w-20 px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                            value={newPlanData.guestAdjustments?.[guestCount]?.amount || 0}
                                            onChange={(e) => setNewPlanData(prev => ({ 
                                              ...prev, 
                                              guestAdjustments: { 
                                                ...(prev.guestAdjustments || {}),
                                                [guestCount]: { 
                                                  amount: parseFloat(e.target.value) || 0, 
                                                  type: prev.guestAdjustments?.[guestCount]?.type || 'percentage' 
                                                } 
                                              } 
                                            }))}
                                          />
                                          <select 
                                            className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
                                            value={newPlanData.guestAdjustments?.[guestCount]?.type || 'percentage'}
                                            onChange={(e) => setNewPlanData(prev => ({ 
                                              ...prev, 
                                              guestAdjustments: { 
                                                ...(prev.guestAdjustments || {}),
                                                [guestCount]: { 
                                                  amount: prev.guestAdjustments?.[guestCount]?.amount || 0, 
                                                  type: e.target.value as 'percentage' | 'fixed' 
                                                } 
                                              } 
                                            }))}
                                          >
                                            <option value="percentage">Porcentagem</option>
                                            <option value="fixed">Valor fixo</option>
                                          </select>
                                        </div>
                                      </div>
                                      <div className="col-span-3 text-sm text-slate-700 text-right">
                                        {/* Calculate price based on base price and adjustment */}
                                        {(() => {
                                          const basePrice = newPlanData.basePrice || 0;
                                          const adj = newPlanData.guestAdjustments?.[guestCount] || { amount: 0, type: 'percentage' };
                                          let finalPrice = basePrice;
                                          if (adj.type === 'percentage') {
                                            finalPrice = basePrice * (1 + adj.amount / 100);
                                          } else {
                                            finalPrice = basePrice + adj.amount;
                                          }
                                          return `R$${(finalPrice || 0).toFixed(2).replace('.', ',')}`;
                                        })()}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Notas</label>
                      <textarea 
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-h-[100px] resize-y"
                        value={newPlanData.notes || ''}
                        onChange={(e) => setNewPlanData(prev => ({ ...prev, notes: e.target.value }))}
                      ></textarea>
                    </div>

                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <button 
                          onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                          className="w-full bg-white p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-2 font-medium text-slate-700">
                            <Settings size={18} className="text-slate-500" />
                            Configurações avançadas
                          </div>
                          {showAdvancedSettings ? (
                            <ChevronUp size={20} className="text-slate-400" />
                          ) : (
                            <ChevronDown size={20} className="text-slate-400" />
                          )}
                        </button>
                        
                        {showAdvancedSettings && (
                          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-4">
                            {/* Children Fee */}
                            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                              <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center gap-2">
                                <Smile size={16} className="text-slate-500" />
                                <span className="font-medium text-slate-700 text-sm">Você cobra alguma taxa para crianças hospedadas em um quarto?</span>
                              </div>
                              <div className="p-4 space-y-3">
                                <label className="flex items-center gap-3 cursor-pointer">
                                  <input 
                                    type="radio" 
                                    name="chargesForChildren" 
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                                    checked={newPlanData.chargesForChildren === true}
                                    onChange={() => setNewPlanData(prev => ({ ...prev, chargesForChildren: true }))}
                                  />
                                  <span className="text-slate-700 text-sm">Sim, crianças pagam uma taxa adicional</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                  <input 
                                    type="radio" 
                                    name="chargesForChildren" 
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                                    checked={newPlanData.chargesForChildren !== true}
                                    onChange={() => setNewPlanData(prev => ({ ...prev, chargesForChildren: false }))}
                                  />
                                  <span className="text-slate-700 text-sm">Não, crianças de qualquer idade não pagam pela estadia</span>
                                </label>
                                
                                {newPlanData.chargesForChildren && (
                                  <div className="pt-4 border-t border-slate-100 space-y-4">
                                    <div>
                                      <label className="block text-sm font-bold text-slate-700 mb-2">Faixa etária</label>
                                      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
                                        <span>De</span>
                                        <input 
                                          type="number" 
                                          min="0"
                                          className="w-16 px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-center"
                                          value={newPlanData.childrenAgeFrom || 0}
                                          onChange={(e) => setNewPlanData(prev => ({ ...prev, childrenAgeFrom: parseInt(e.target.value) || 0 }))}
                                        />
                                        <span>até (incluindo)</span>
                                        <input 
                                          type="number" 
                                          min="0"
                                          className="w-16 px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-center"
                                          value={newPlanData.childrenAgeTo || 0}
                                          onChange={(e) => setNewPlanData(prev => ({ ...prev, childrenAgeTo: parseInt(e.target.value) || 0 }))}
                                        />
                                        <span>anos de idade pagam uma taxa por criança</span>
                                      </div>
                                      <ul className="list-disc pl-5 mt-2 text-sm text-slate-600">
                                        <li>Crianças de {(newPlanData.childrenAgeTo || 0) + 1} anos de idade ou mais pagam o mesmo que adultos.</li>
                                      </ul>
                                    </div>
                                    
                                    <div>
                                      <label className="block text-sm font-bold text-slate-700 mb-2">Taxa por criança</label>
                                      <div className="flex items-center gap-2">
                                        <div className="flex w-32">
                                          <div className="px-3 py-2 bg-slate-100 border-y border-l border-slate-300 rounded-l-lg text-slate-600 flex items-center">
                                            R$
                                          </div>
                                          <input 
                                            type="number" 
                                            min="0"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            value={newPlanData.childrenFee || 0}
                                            onChange={(e) => setNewPlanData(prev => ({ ...prev, childrenFee: parseFloat(e.target.value) || 0 }))}
                                          />
                                        </div>
                                        <span className="text-sm text-slate-600">por criança, por noite</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Mandatory Fee */}
                            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                              <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center gap-2">
                                <Tag size={16} className="text-slate-500" />
                                <span className="font-medium text-slate-700 text-sm">Você cobra alguma taxa obrigatória adicional (como taxa de cidade, limpeza, roupa de cama, eletricidade, etc)?</span>
                              </div>
                              <div className="p-4 space-y-3">
                                <label className="flex items-center gap-3 cursor-pointer">
                                  <input 
                                    type="radio" 
                                    name="chargesMandatoryFee" 
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                                    checked={newPlanData.chargesMandatoryFee === true}
                                    onChange={() => setNewPlanData(prev => ({ ...prev, chargesMandatoryFee: true }))}
                                  />
                                  <span className="text-slate-700 text-sm">Sim, os hóspedes precisam pagar uma taxa adicional</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                  <input 
                                    type="radio" 
                                    name="chargesMandatoryFee" 
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                                    checked={newPlanData.chargesMandatoryFee !== true}
                                    onChange={() => setNewPlanData(prev => ({ ...prev, chargesMandatoryFee: false }))}
                                  />
                                  <span className="text-slate-700 text-sm">Não, não há taxa adicional</span>
                                </label>
                                
                                {newPlanData.chargesMandatoryFee && (
                                  <div className="pt-4 border-t border-slate-100 space-y-4">
                                    <div>
                                      <label className="block text-sm font-bold text-slate-700 mb-1">Nome da taxa</label>
                                      <input 
                                        type="text" 
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        value={newPlanData.mandatoryFeeName || ''}
                                        onChange={(e) => setNewPlanData(prev => ({ ...prev, mandatoryFeeName: e.target.value }))}
                                      />
                                    </div>
                                    
                                    <div>
                                      <div className="flex items-center gap-1 mb-1">
                                        <label className="block text-sm font-bold text-slate-700">Taxa adicional</label>
                                        <Info size={14} className="text-slate-400" />
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="flex w-32">
                                          <div className="px-3 py-2 bg-slate-100 border-y border-l border-slate-300 rounded-l-lg text-slate-600 flex items-center">
                                            R$
                                          </div>
                                          <input 
                                            type="number" 
                                            min="0"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            value={newPlanData.mandatoryFeeAmount || 0}
                                            onChange={(e) => setNewPlanData(prev => ({ ...prev, mandatoryFeeAmount: parseFloat(e.target.value) || 0 }))}
                                          />
                                        </div>
                                        <select 
                                          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                                          value={newPlanData.mandatoryFeeType || 'per-reservation'}
                                          onChange={(e) => setNewPlanData(prev => ({ ...prev, mandatoryFeeType: e.target.value as any }))}
                                        >
                                          <option value="per-reservation">Por Reserva</option>
                                          <option value="per-person">Por Pessoa</option>
                                          <option value="per-night">Por Noite</option>
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Max Stay */}
                            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                              <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center gap-2">
                                <Clock size={16} className="text-slate-500" />
                                <span className="font-medium text-slate-700 text-sm">Existe uma duração máxima de estadia?</span>
                              </div>
                              <div className="p-4 space-y-4">
                                <div className="space-y-3">
                                  <label className="flex items-center gap-3 cursor-pointer">
                                    <input 
                                      type="radio" 
                                      name="hasMaxStay" 
                                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                                      checked={newPlanData.hasMaxStay === true}
                                      onChange={() => setNewPlanData(prev => ({ ...prev, hasMaxStay: true }))}
                                    />
                                    <span className="text-slate-700 text-sm">Sim</span>
                                  </label>
                                  <label className="flex items-center gap-3 cursor-pointer">
                                    <input 
                                      type="radio" 
                                      name="hasMaxStay" 
                                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                                      checked={newPlanData.hasMaxStay !== true}
                                      onChange={() => setNewPlanData(prev => ({ ...prev, hasMaxStay: false }))}
                                    />
                                    <span className="text-slate-700 text-sm">Não</span>
                                  </label>
                                </div>
                                
                                {newPlanData.hasMaxStay && (
                                  <div className="pt-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Duração máxima da estadia</label>
                                    <div className="flex">
                                      <input 
                                        type="number" 
                                        min="1"
                                        className="flex-1 px-4 py-2 border border-slate-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        value={newPlanData.maxStay || ''}
                                        onChange={(e) => setNewPlanData(prev => ({ ...prev, maxStay: parseInt(e.target.value) || 0 }))}
                                      />
                                      <div className="px-4 py-2 bg-slate-100 border-y border-r border-slate-300 rounded-r-lg text-slate-600 flex items-center gap-1">
                                        <Moon size={16} /> noites
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
            </div>
            
            <div className="p-6 border-t border-slate-200 bg-white flex items-center gap-3">
              <button 
                onClick={handleAddPlan}
                disabled={!newPlanData.name || !newPlanData.category || !newPlanData.basePrice}
                className="px-6 py-2.5 bg-[#0F9D58] text-white font-medium rounded-lg hover:bg-[#0B8043] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Check size={18} /> Enviar
              </button>
              <button 
                onClick={() => setIsNewPlanModalOpen(false)}
                className="px-6 py-2.5 text-slate-600 font-medium border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {isBulkEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Edição em Massa de Preços</h3>
                <p className="text-sm text-slate-500 mt-1">Atualize tarifas para múltiplos dias simultaneamente</p>
              </div>
              <button onClick={() => setIsBulkEditModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-slate-700">Selecione os Planos Tarifários *</label>
                  <button 
                    onClick={() => setBulkEditData(prev => ({ ...prev, planIds: prev.planIds.length === ratePlans.length ? [] : ratePlans.map(p => p.id) }))}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {bulkEditData.planIds.length === ratePlans.length ? 'Desmarcar todos' : 'Selecionar todos'}
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-white space-y-1">
                  {ratePlans.map(plan => (
                    <label key={plan.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bulkEditData.planIds.includes(plan.id)}
                        onChange={(e) => {
                          setBulkEditData(prev => ({
                            ...prev,
                            planIds: e.target.checked
                              ? [...prev.planIds, plan.id]
                              : prev.planIds.filter(id => id !== plan.id)
                          }))
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700 font-medium">{plan.name} <span className="text-slate-400 text-xs font-normal">({plan.category})</span></span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data Inicial *</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={bulkEditData.startDate}
                    onChange={(e) => setBulkEditData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data Final *</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={bulkEditData.endDate}
                    onChange={(e) => setBulkEditData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Dias da Semana *</label>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map(day => (
                    <button
                      key={day.id}
                      onClick={() => toggleDayOfWeek(day.id)}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
                        bulkEditData.daysOfWeek.includes(day.id)
                          ? "bg-blue-50 border-blue-200 text-blue-700"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={cn("space-y-6 transition-opacity", bulkEditData.removeOverrides && "opacity-50 pointer-events-none")}>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                  <h4 className="font-medium text-slate-800">Ação de Preço</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">O que fazer?</label>
                    <select 
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                      value={bulkEditData.action}
                      onChange={(e) => setBulkEditData(prev => ({ ...prev, action: e.target.value as any }))}
                    >
                      <option value="set">Definir preço exato para</option>
                      <option value="increase">Aumentar preço em</option>
                      <option value="decrease">Reduzir preço em</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Valor</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        value={bulkEditData.value || ''}
                        onChange={(e) => setBulkEditData(prev => ({ ...prev, value: parseFloat(e.target.value) }))}
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                        {bulkEditData.action === 'set' ? 'R$' : bulkEditData.valueType === 'fixed' ? 'R$' : '%'}
                      </span>
                    </div>
                  </div>
                </div>
                {bulkEditData.action !== 'set' && (
                  <div className="flex gap-4 pt-2">
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input 
                        type="radio" 
                        name="valueType" 
                        value="fixed"
                        checked={bulkEditData.valueType === 'fixed'}
                        onChange={() => setBulkEditData(prev => ({ ...prev, valueType: 'fixed' }))}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      Valor Fixo (R$)
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input 
                        type="radio" 
                        name="valueType" 
                        value="percentage"
                        checked={bulkEditData.valueType === 'percentage'}
                        onChange={() => setBulkEditData(prev => ({ ...prev, valueType: 'percentage' }))}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      Porcentagem (%)
                    </label>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <h4 className="font-medium text-slate-800">Restrições de Estadia</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={bulkEditData.updateMinStay}
                        onChange={(e) => setBulkEditData(prev => ({ ...prev, updateMinStay: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      Atualizar Estadia Mínima
                    </label>
                    {bulkEditData.updateMinStay && (
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          min="1"
                          className="w-24 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          value={bulkEditData.minStay}
                          onChange={(e) => setBulkEditData(prev => ({ ...prev, minStay: parseInt(e.target.value) || 1 }))}
                        />
                        <span className="text-sm text-slate-500">noites</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={bulkEditData.updateMaxStay}
                        onChange={(e) => setBulkEditData(prev => ({ ...prev, updateMaxStay: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      Atualizar Estadia Máxima
                    </label>
                    {bulkEditData.updateMaxStay && (
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          min="1"
                          className="w-24 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          value={bulkEditData.maxStay}
                          onChange={(e) => setBulkEditData(prev => ({ ...prev, maxStay: parseInt(e.target.value) || 1 }))}
                        />
                        <span className="text-sm text-slate-500">noites</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <h4 className="font-medium text-slate-800">Disponibilidade</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={bulkEditData.updateClosedForSale}
                        onChange={(e) => setBulkEditData(prev => ({ ...prev, updateClosedForSale: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      Venda
                    </label>
                    {bulkEditData.updateClosedForSale && (
                      <select
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                        value={bulkEditData.closedForSale ? 'closed' : 'open'}
                        onChange={(e) => setBulkEditData(prev => ({ ...prev, closedForSale: e.target.value === 'closed' }))}
                      >
                        <option value="open">Aberto para venda</option>
                        <option value="closed">Fechado para venda</option>
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={bulkEditData.updateClosedForArrival}
                        onChange={(e) => setBulkEditData(prev => ({ ...prev, updateClosedForArrival: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      Chegada
                    </label>
                    {bulkEditData.updateClosedForArrival && (
                      <select
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                        value={bulkEditData.closedForArrival ? 'closed' : 'open'}
                        onChange={(e) => setBulkEditData(prev => ({ ...prev, closedForArrival: e.target.value === 'closed' }))}
                      >
                        <option value="open">Aberto para chegada</option>
                        <option value="closed">Fechado para chegada</option>
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={bulkEditData.updateClosedForDeparture}
                        onChange={(e) => setBulkEditData(prev => ({ ...prev, updateClosedForDeparture: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      Saída
                    </label>
                    {bulkEditData.updateClosedForDeparture && (
                      <select
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                        value={bulkEditData.closedForDeparture ? 'closed' : 'open'}
                        onChange={(e) => setBulkEditData(prev => ({ ...prev, closedForDeparture: e.target.value === 'closed' }))}
                      >
                        <option value="open">Aberto para saída</option>
                        <option value="closed">Fechado para saída</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>
              </div>

              <div className="p-4 bg-red-50 rounded-xl border border-red-200 space-y-4">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={bulkEditData.removeOverrides}
                    onChange={(e) => setBulkEditData(prev => ({ ...prev, removeOverrides: e.target.checked }))}
                    className="w-4 h-4 text-red-600 rounded border-red-300 focus:ring-red-500"
                  />
                  <span className="text-red-700">Remover todas as alterações e restaurar valores padrão</span>
                </label>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsBulkEditModalOpen(false)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleBulkEdit}
                disabled={bulkEditData.planIds.length === 0 || bulkEditData.daysOfWeek.length === 0}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Check size={16} /> Aplicar Alterações
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Context Menu */}
      {cellMenu && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setCellMenu(null)}
          />
          <div 
            className="fixed z-50 bg-white rounded-lg shadow-xl border border-slate-200 py-1 min-w-[200px]"
            style={{ top: cellMenu.y, left: cellMenu.x }}
          >
            <button 
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              onClick={() => {
                const plan = ratePlans.find(p => p.id === cellMenu.planId);
                const { minStay } = getMinMaxStay(cellMenu.planId, parseISO(cellMenu.date));
                setEditRateData({
                  price: (getPrice(cellMenu.planId, parseISO(cellMenu.date)) || 0).toFixed(2).replace('.', ','),
                  minStay: minStay.toString()
                });
                setEditRateModal({ planId: cellMenu.planId, date: cellMenu.date });
                setCellMenu(null);
              }}
            >
              <Edit2 size={14} /> Mudar preço e restrições
            </button>
            <button 
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              onClick={() => handleToggleClosedStatus(cellMenu.planId, cellMenu.date, 'sale')}
            >
              <X size={14} /> {getClosedStatus(cellMenu.planId, parseISO(cellMenu.date)).closedForSale ? 'Abrir para venda' : 'Fechar para venda'}
            </button>
            <div className="relative group/submenu">
              <button 
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center justify-between"
              >
                <span className="flex items-center gap-2"><Settings size={14} /> Avançado</span>
                <ChevronDown size={14} className="rotate-[-90deg]" />
              </button>
              <div className="absolute left-full top-0 hidden group-hover/submenu:block bg-white rounded-lg shadow-xl border border-slate-200 py-1 min-w-[200px]">
                <button 
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => handleToggleClosedStatus(cellMenu.planId, cellMenu.date, 'arrival')}
                >
                  {getClosedStatus(cellMenu.planId, parseISO(cellMenu.date)).closedForArrival ? 'Abrir para chegada' : 'Fechar para chegada'}
                </button>
                <button 
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => handleToggleClosedStatus(cellMenu.planId, cellMenu.date, 'departure')}
                >
                  {getClosedStatus(cellMenu.planId, parseISO(cellMenu.date)).closedForDeparture ? 'Abrir para saída' : 'Fechar para saída'}
                </button>
              </div>
            </div>
            <button 
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100 mt-1 pt-2"
              onClick={() => {
                const plan = ratePlans.find(p => p.id === cellMenu.planId);
                if (plan) {
                  setNewPlanData(plan);
                  setIsNewPlanModalOpen(true);
                }
                setCellMenu(null);
              }}
            >
              <Settings size={14} /> Atualizar plano tarifário
            </button>
            {dailyRates.some(r => r.ratePlanId === cellMenu.planId && r.date === cellMenu.date) && (
              <button 
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-100 mt-1 pt-2"
                onClick={() => handleRemoveOverride(cellMenu.planId, cellMenu.date)}
              >
                <Trash2 size={14} /> Remover personalização
              </button>
            )}
          </div>
        </>
      )}

      {/* Edit Rate Modal */}
      {editRateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-semibold text-slate-800">Substituir tarifa do dia</h2>
              <button onClick={() => setEditRateModal(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Plano tarifário:</span>
                <span className="font-medium text-slate-800">{ratePlans.find(p => p.id === editRateModal.planId)?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Data:</span>
                <span className="font-medium text-slate-800">{format(parseISO(editRateModal.date), 'dd/MM/yyyy')}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Preço (R$)</label>
                  <input 
                    type="text" 
                    value={editRateData.price}
                    onChange={(e) => setEditRateData({ ...editRateData, price: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estadia mínima (diárias)</label>
                  <input 
                    type="number" 
                    min="1"
                    value={editRateData.minStay}
                    onChange={(e) => setEditRateData({ ...editRateData, minStay: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setEditRateModal(null)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveEditRateModal}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                OK
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Category Details Modal */}
      {selectedCategoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h3 className="text-2xl font-bold text-slate-800">Categoria de Quarto</h3>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    // Close the modal for now, could navigate to settings if needed
                    setSelectedCategoryModal(null);
                  }}
                  className="px-4 py-2 bg-[#17a2b8] text-white text-sm font-medium rounded-lg hover:bg-[#138496] transition-colors flex items-center gap-2"
                >
                  <Edit2 size={16} /> Atualizar
                </button>
                <button 
                  onClick={() => setSelectedCategoryModal(null)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 w-48">Nome:</span>
                  <span className="text-slate-600">{selectedCategoryModal.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 w-48">Máximo De Hóspedes:</span>
                  <span className="text-slate-600">{selectedCategoryModal.maxGuests}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 w-48">Máximo De Adultos:</span>
                  <span className="text-slate-600">{selectedCategoryModal.maxAdults}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 w-48">Máximo De Crianças:</span>
                  <span className="text-slate-600">{selectedCategoryModal.maxChildren}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xl font-bold text-slate-800 mb-4">Quartos</h4>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white border-b border-slate-200">
                        <th className="p-4 text-sm font-semibold text-blue-600 whitespace-nowrap">Nome ⇅</th>
                        <th className="p-4 text-sm font-semibold text-blue-600 whitespace-nowrap">Categoria de quarto ⇅</th>
                        <th className="p-4 text-sm font-semibold text-blue-600 whitespace-nowrap">Estado ⇅</th>
                        <th className="p-4 text-sm font-semibold text-slate-800 whitespace-nowrap">Reserva atual</th>
                        <th className="p-4 text-sm font-semibold text-slate-800 whitespace-nowrap">Hóspede atual</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rooms.filter(r => r.category === selectedCategoryModal.name).map((room, idx) => {
                        const today = new Date();
                        const currentBooking = bookings.find(b => 
                          b.roomId === room.id && 
                          b.status !== 'cancelled' && 
                          new Date(b.checkIn) <= today && 
                          new Date(b.checkOut) >= today
                        );
                        const currentGuest = currentBooking ? clients.find(c => c.id === currentBooking.clientId) : null;

                        return (
                          <tr key={room.id} className={idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
                            <td className="p-4 text-sm text-blue-600">{room.number}</td>
                            <td className="p-4 text-sm text-blue-600">{selectedCategoryModal.name}</td>
                            <td className="p-4">
                              {room.availability === 'occupied' ? (
                                <span className="px-3 py-1 rounded-md text-xs font-bold bg-[#17a2b8] text-white flex items-center gap-1.5 w-fit">
                                  <User size={12} /> Ocupado
                                </span>
                              ) : room.availability === 'reserved' ? (
                                <span className="px-3 py-1 rounded-md text-xs font-bold bg-indigo-500 text-white flex items-center gap-1.5 w-fit">
                                  <CalendarIcon size={12} /> Reservado
                                </span>
                              ) : room.availability === 'blocked' ? (
                                <span className="px-3 py-1 rounded-md text-xs font-bold bg-amber-500 text-white flex items-center gap-1.5 w-fit">
                                  <Lock size={12} /> Bloqueado
                                </span>
                              ) : (
                                <span className={cn(
                                  "px-3 py-1 rounded-md text-xs font-bold text-white flex items-center gap-1.5 w-fit",
                                  room.status === 'clean' ? "bg-emerald-500" : 
                                  room.status === 'dirty' ? "bg-[#dc3545]" : 
                                  room.status === 'cleaning' ? "bg-blue-500" :
                                  room.status === 'inspected' ? "bg-indigo-500" : "bg-amber-500"
                                )}>
                                  {room.status === 'dirty' && <Trash2 size={12} />}
                                  {room.status === 'clean' ? 'Limpo' : 
                                   room.status === 'dirty' ? 'Sujo' : 
                                   room.status === 'cleaning' ? 'Limpando' :
                                   room.status === 'inspected' ? 'Inspecionado' : 'Manutenção'}
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-sm text-slate-600">
                              {currentBooking ? currentBooking.reservationNumber : ''}
                            </td>
                            <td className="p-4 text-sm text-slate-600">
                              {currentGuest ? currentGuest.name : ''}
                            </td>
                          </tr>
                        );
                      })}
                      {rooms.filter(r => r.category === selectedCategoryModal.name).length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-sm text-slate-500">
                            Nenhum quarto encontrado para esta categoria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// Helper hook for localStorage
interface BulkUpdateRoomsViewProps {
  roomCategories: RoomCategory[];
  rooms: Room[];
  setRoomCategories: (categories: RoomCategory[]) => void;
  setRooms: (rooms: Room[]) => void;
  setCurrentView: (view: string) => void;
}

const BulkUpdateRoomsView = ({
  roomCategories,
  rooms,
  setRoomCategories,
  setRooms,
  setCurrentView
}: BulkUpdateRoomsViewProps) => {
  const [localCategories, setLocalCategories] = useState(roomCategories.map(c => ({...c})));
  const [localRooms, setLocalRooms] = useState(rooms.map(r => ({...r})));

  const handleSave = () => {
    setRoomCategories(localCategories);
    setRooms(localRooms);
    toast.success('Acomodações atualizadas com sucesso!');
    setCurrentView('rooms');
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full pb-20">
      <div>
        <h2 className="text-2xl font-semibold text-slate-800 mb-2">Configuração de Acomodações</h2>
        <p className="text-slate-500 text-sm">Renomeie suas categorias e quartos, e atribua os quartos às categorias corretas.</p>
      </div>
      
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Categorias de Quartos</h3>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">Nome da Categoria*</label>
            {localCategories.map((cat, index) => (
              <input 
                key={cat.id} 
                type="text" 
                value={cat.name} 
                onChange={(e) => {
                  const newCats = [...localCategories];
                  newCats[index].name = e.target.value;
                  setLocalCategories(newCats);
                }}
                className="w-full border border-slate-300 rounded-xl p-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
              />
            ))}
          </div>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Quartos</h3>
          <div className="grid grid-cols-2 gap-4 mb-2">
            <label className="text-sm font-medium text-slate-700">Nome do quarto*</label>
            <label className="text-sm font-medium text-slate-700">Categoria*</label>
          </div>
          <div className="space-y-3">
            {localRooms.map((room, index) => (
              <div key={room.id} className="grid grid-cols-2 gap-4">
                <input 
                  type="text" 
                  value={room.number} 
                  onChange={(e) => {
                    const newRooms = [...localRooms];
                    newRooms[index].number = e.target.value;
                    setLocalRooms(newRooms);
                  }}
                  className="w-full border border-slate-300 rounded-xl p-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                />
                <select 
                  value={room.category} 
                  onChange={(e) => {
                    const newRooms = [...localRooms];
                    newRooms[index].category = e.target.value;
                    setLocalRooms(newRooms);
                  }}
                  className="w-full border border-slate-300 rounded-xl p-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white"
                >
                  {localCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col gap-3 pt-4">
          <button 
            onClick={() => setCurrentView('rooms')}
            className="w-full bg-white text-slate-700 border border-slate-300 px-6 py-3.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors flex items-center justify-center"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            className="w-full bg-[#10b981] text-white px-6 py-3.5 rounded-xl text-sm font-medium hover:bg-[#059669] transition-colors flex items-center justify-center gap-2"
          >
            <Check size={18} /> Enviar
          </button>
        </div>
      </div>
    </div>
  );
};

interface NewRoomCategoryViewProps {
  roomCategories: RoomCategory[];
  setRoomCategories: (categories: RoomCategory[]) => void;
  setCurrentView: (view: string) => void;
}

const NewRoomCategoryView = ({
  roomCategories,
  setRoomCategories,
  setCurrentView
}: NewRoomCategoryViewProps) => {
  const [name, setName] = useState('');
  const [maxGuests, setMaxGuests] = useState('2');
  const [maxAdults, setMaxAdults] = useState('2');
  const [maxChildren, setMaxChildren] = useState('0');

  const handleSave = () => {
    if (!name) {
      toast.error('O nome da categoria é obrigatório.');
      return;
    }
    const newCategory: RoomCategory = {
      id: `cat-${Date.now()}`,
      name,
      maxGuests: parseInt(maxGuests) || 2,
      maxAdults: parseInt(maxAdults) || 2,
      maxChildren: parseInt(maxChildren) || 0
    };
    setRoomCategories([...roomCategories, newCategory]);
    toast.success('Categoria criada com sucesso!');
    setCurrentView('room-categories');
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-3xl font-semibold text-slate-800 mb-8">Criar Categoria de Quarto</h2>
        
        <div className="space-y-6 max-w-md">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Categoria de Quarto*</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
            />
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-slate-800 mb-4">Configurações de ocupação</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">Máximo de hóspedes* <AlertCircle size={14} className="text-slate-400" /></label>
                <input 
                  type="number" 
                  value={maxGuests}
                  onChange={(e) => setMaxGuests(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">Máximo de adultos <AlertCircle size={14} className="text-slate-400" /></label>
                <input 
                  type="number" 
                  value={maxAdults}
                  onChange={(e) => setMaxAdults(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">Máximo de crianças <AlertCircle size={14} className="text-slate-400" /></label>
                <input 
                  type="number" 
                  value={maxChildren}
                  onChange={(e) => setMaxChildren(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button 
              onClick={handleSave}
              className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <Check size={16} /> Enviar
            </button>
            <button 
              onClick={() => setCurrentView('room-categories')}
              className="bg-white text-slate-700 border border-slate-300 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface UpdateRoomCategoryViewProps {
  roomCategories: RoomCategory[];
  setRoomCategories: (categories: RoomCategory[]) => void;
  setCurrentView: (view: string) => void;
  selectedRoomCategoryId: string | null;
  rooms: Room[];
  setRooms: (rooms: Room[]) => void;
}

const UpdateRoomCategoryView = ({
  roomCategories,
  setRoomCategories,
  setCurrentView,
  selectedRoomCategoryId,
  rooms,
  setRooms
}: UpdateRoomCategoryViewProps) => {
  const category = roomCategories.find(c => c.id === selectedRoomCategoryId);
  
  const [name, setName] = useState(category?.name || '');
  const [maxGuests, setMaxGuests] = useState(category?.maxGuests?.toString() || '2');
  const [maxAdults, setMaxAdults] = useState(category?.maxAdults?.toString() || '2');
  const [maxChildren, setMaxChildren] = useState(category?.maxChildren?.toString() || '0');

  if (!category) return null;

  const handleSave = () => {
    if (!name) {
      toast.error('O nome da categoria é obrigatório.');
      return;
    }
    
    const updatedCategories = roomCategories.map(c => 
      c.id === category.id 
        ? { ...c, name, maxGuests: parseInt(maxGuests) || 2, maxAdults: parseInt(maxAdults) || 2, maxChildren: parseInt(maxChildren) || 0 }
        : c
    );
    setRoomCategories(updatedCategories);

    if (name !== category.name) {
      setRooms(rooms.map(r => r.category === category.name ? { ...r, category: name } : r));
    }

    toast.success('Categoria atualizada com sucesso!');
    setCurrentView('room-category-details');
  };

  const handleDelete = () => {
    toast('Tem certeza que deseja excluir esta categoria?', {
      action: {
        label: 'Excluir',
        onClick: () => {
          setRoomCategories(roomCategories.filter(c => c.id !== category.id));
          setCurrentView('room-categories');
          toast.success('Categoria excluída com sucesso!');
        },
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-start mb-8">
          <h2 className="text-3xl font-semibold text-slate-800">Atualizar Categoria de Quarto</h2>
          <button 
            onClick={handleDelete}
            className="bg-[#dc3545] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#c82333] transition-colors text-center"
          >
            Deletar<br/>categoria de<br/>quarto
          </button>
        </div>
        
        <div className="space-y-6 max-w-md">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Categoria de Quarto*</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
            />
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-slate-800 mb-4">Configurações de ocupação</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">Máximo de hóspedes* <AlertCircle size={14} className="text-slate-400" /></label>
                <input 
                  type="number" 
                  value={maxGuests}
                  onChange={(e) => setMaxGuests(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">Máximo de adultos <AlertCircle size={14} className="text-slate-400" /></label>
                <input 
                  type="number" 
                  value={maxAdults}
                  onChange={(e) => setMaxAdults(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">Máximo de crianças <AlertCircle size={14} className="text-slate-400" /></label>
                <input 
                  type="number" 
                  value={maxChildren}
                  onChange={(e) => setMaxChildren(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              onClick={handleSave}
              className="bg-[#28a745] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#218838] transition-colors flex items-center gap-2"
            >
              <Check size={16} /> Enviar
            </button>
            <button 
              onClick={() => setCurrentView('room-category-details')}
              className="bg-white text-slate-700 border border-slate-300 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function AppContent() {
  const [userRole, setUserRole] = useState<'admin' | 'receptionist'>('admin');
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [focusedBookingId, setFocusedBookingId] = useState<string | null>(null);
  const [showPastBookings, setShowPastBookings] = useState(false);
  const [calendarSuccessMessage, setCalendarSuccessMessage] = useState<string | null>(null);
  const [hoveredBooking, setHoveredBooking] = useState<{ booking: Booking, rect: DOMRect } | null>(null);
  const hasLongPressed = useRef(false);

  useEffect(() => {
    // Simulate initial loading and login
    const timer = setTimeout(() => {
      setIsAppLoading(false);
      toast.success(`Bem-vindo de volta, ${userRole === 'admin' ? 'Administrador' : 'Recepcionista'}!`, {
        description: 'Sistema carregado com sucesso.'
      });
      
      // Handle deep linking after load
      const urlParams = new URLSearchParams(window.location.search);
      const focusId = urlParams.get('focus');
      if (focusId) {
        setFocusedBookingId(focusId);
        // Remove focus param from URL without reloading
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
        // Clear focus after 3 seconds
        setTimeout(() => setFocusedBookingId(null), 3000);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [userRole]);

  const {
    currentView, setCurrentView,
    viewHistory, setViewHistory,
    handleBack, handleNavigate
  } = useNavigation();

  const {
    rooms, setRooms,
    roomCategories, setRoomCategories,
    bookings, setBookings,
    clients, setClients,
    transactions, setTransactions,
    staff, setStaff,
    products, setProducts,
    yieldRules, setYieldRules,
    guestPortalConfig, setGuestPortalConfig,
    paymentLinks, setPaymentLinks,
    ratePlans, setRatePlans,
    dailyRates, setDailyRates,
    systemUsers, setSystemUsers,
    establishment, setEstablishment,
    syncLogs, setSyncLogs,
    notifications
  } = useHotelData();

  useEffect(() => {
    if (establishment.logoUrl) {
      // Update favicon
      let iconLink = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!iconLink) {
        iconLink = document.createElement('link');
        iconLink.rel = 'icon';
        document.head.appendChild(iconLink);
      }
      iconLink.href = establishment.logoUrl;

      // Update apple-touch-icon
      let appleIconLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
      if (!appleIconLink) {
        appleIconLink = document.createElement('link');
        appleIconLink.rel = 'apple-touch-icon';
        document.head.appendChild(appleIconLink);
      }
      appleIconLink.href = establishment.logoUrl;

      // Update title
      if (establishment.name) {
        document.title = establishment.name;
      }

      // Create dynamic manifest for PWA
      const manifest = {
        name: establishment.name || 'PousadaGest',
        short_name: establishment.name || 'PousadaGest',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#4f46e5',
        icons: [
          {
            src: establishment.logoUrl,
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: establishment.logoUrl,
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      };

      const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
      const manifestUrl = URL.createObjectURL(manifestBlob);

      let manifestLink = document.querySelector("link[rel='manifest']") as HTMLLinkElement;
      if (!manifestLink) {
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        document.head.appendChild(manifestLink);
      }
      manifestLink.href = manifestUrl;
    }
  }, [establishment.logoUrl, establishment.name]);

  const {
    isSidebarOpen, setIsSidebarOpen,
    isNotificationsOpen, setIsNotificationsOpen,
    isRoomsColumnCollapsed, setIsRoomsColumnCollapsed,
    isAddPaymentModalOpen, setIsAddPaymentModalOpen,
    isAddTransactionModalOpen, setIsAddTransactionModalOpen,
    expandedBookingId, setExpandedBookingId,
    isSyncing, setIsSyncing,
    isSubmenuOpen, setIsSubmenuOpen,
    isActionsMenuOpen, setIsActionsMenuOpen,
    activeBookingForConsumption, setActiveBookingForConsumption,
    isCancelBookingModalOpen, setIsCancelBookingModalOpen,
    bookingToCancel, setBookingToCancel
  } = useUIState();

  const {
    currentDate, setCurrentDate,
    daysToShow, setDaysToShow,
    calendarSearchQuery, setCalendarSearchQuery,
    calendarStatusFilter, setCalendarStatusFilter,
    calendarStartDate, setCalendarStartDate,
    calendarEndDate, setCalendarEndDate,
    isCalendarSearchOpen, setIsCalendarSearchOpen,
    isCalendarFilterOpen, setIsCalendarFilterOpen,
    calendarSelection, setCalendarSelection,
    selectionPopover, setSelectionPopover,
    draggedBooking, setDraggedBooking,
    dropTarget, setDropTarget,
    dragOverTarget, setDragOverTarget,
    isConfirmingMove, setIsConfirmingMove,
    cellPopover, setCellPopover,
    touchDragInfo, setTouchDragInfo,
    touchTimer,
    collapsedCategories, setCollapsedCategories,
    currentTime,
    selectedBooking, setSelectedBooking,
    isLegendOpen, setIsLegendOpen
  } = useCalendar(isSidebarOpen, isRoomsColumnCollapsed, rooms);

  const {
    bookingClient, setBookingClient,
    bookingCheckIn, setBookingCheckIn,
    bookingCheckOut, setBookingCheckOut,
    bookingRooms, setBookingRooms,
    bookingStatus, setBookingStatus,
    bookingPaymentStatus, setBookingPaymentStatus,
    bookingNotes, setBookingNotes,
    bookingKeyControl, setBookingKeyControl,
    prePaymentAmount, setPrePaymentAmount,
    prePaymentMethod, setPrePaymentMethod,
    isAdvancePayment, setIsAdvancePayment,
    isSplitPayment, setIsSplitPayment,
    splitPayments, setSplitPayments,
    selectingDate, setSelectingDate,
    roomSearchQuery, setRoomSearchQuery,
    productSearchQuery, setProductSearchQuery,
    manualConsumptionDescription, setManualConsumptionDescription,
    manualConsumptionAmount, setManualConsumptionAmount,
    editingConsumptionId, setEditingConsumptionId,
    editingConsumptionAmount, setEditingConsumptionAmount,
    guestSearchQuery, setGuestSearchQuery,
    isNewGuestModalOpen, setIsNewGuestModalOpen,
    isCheckoutConfirmModalOpen, setIsCheckoutConfirmModalOpen,
    newGuestData, setNewGuestData,
    isDatePickerOpen, setIsDatePickerOpen,
    isRoomSearchVisible, setIsRoomSearchVisible,
    roomSelectionMessage, setRoomSelectionMessage,
    resetForm,
    getDefaultRatePlanId,
    calculateRoomPrice,
    bookingNights,
    bookingTotal
  } = useBookingForm(ratePlans, dailyRates, yieldRules, bookings, rooms, currentView);

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [paymentBookingId, setPaymentBookingId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentNotes, setPaymentNotes] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [bookingChannel, setBookingChannel] = useState<'direct' | 'website' | 'booking.com' | 'expedia' | 'airbnb'>('direct');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedRoomCategoryId, setSelectedRoomCategoryId] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<string[]>(['Cartão de Crédito', 'Cartão de Débito', 'PIX', 'Dinheiro', 'Transferência']);
  const [datePickerMonth, setDatePickerMonth] = useState(startOfMonth(new Date()));

  const [whatsappTemplate, setWhatsappTemplate] = useState('Olá {nome}, sua reserva para o dia {data_checkin} está confirmada!');
  const [depositTemplate, setDepositTemplate] = useState('Olá {nome}, para garantir sua reserva no {quarto} de {data_checkin} a {data_checkout}, solicitamos o depósito de {valor_deposito}. Realize o pagamento pelo link: {link_pagamento}');
  const [fnrhTemplate, setFnrhTemplate] = useState('Por favor, preencha a FNRH no link a seguir: {link_fnrh}');
  const [invoiceTemplate, setInvoiceTemplate] = useState('Fatura referente à hospedagem de {data_checkin} a {data_checkout}.');
  
  const [roomsSearchFilter, setRoomsSearchFilter] = useState('');
  const [roomsStatusFilter, setRoomsStatusFilter] = useState('all');

  const closeAllPopovers = useCallback(() => {
    setSelectedBooking(null);
    setCellPopover(null);
    setIsSubmenuOpen(false);
    setIsActionsMenuOpen(false);
    setIsLegendOpen(false);
    setIsCalendarSearchOpen(false);
    setIsCalendarFilterOpen(false);
    setIsNotificationsOpen(false);
    setSelectionPopover(null);
    setHoveredBooking(null);
    setIsDatePickerOpen(false);
  }, []);

  React.useEffect(() => {
    const handleClickOutside = () => {
      closeAllPopovers();
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [closeAllPopovers]);

  const updateBookingStatus = (bookingId: string, status: Booking['status']) => {
    const booking = bookings.find(b => b.id === bookingId);
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));
    
    if (booking) {
      if (status === 'checked-in') {
        setRooms(prev => prev.map(r => r.id === booking.roomId ? { ...r, availability: 'occupied', status: 'clean' } : r));
      } else if (status === 'checked-out') {
        setRooms(prev => prev.map(r => r.id === booking.roomId ? { ...r, availability: 'available', status: 'dirty' } : r));
      }
    }
    
    setSelectedBooking(null);
  };

  const handleGeneratePaymentLink = (booking: Booking, amount: number, type: PaymentLink['type'] = 'deposit') => {
    const newLink = PaymentService.generatePaymentLink(booking, amount, type);
    setPaymentLinks(prev => [...prev, newLink]);
    
    // Update booking with payment link ID and deposit status
    setBookings(prev => prev.map(b => 
      b.id === booking.id 
        ? { ...b, paymentLinkId: newLink.id, depositStatus: 'pending', depositAmount: amount } 
        : b
    ));
    
    toast.success('Link de pagamento gerado!', {
      description: `Link enviado para ${clients.find(c => c.id === booking.clientId)?.name}`,
    });
  };

  const handleSimulatePayment = (linkId: string) => {
    const link = paymentLinks.find(l => l.id === linkId);
    if (!link) return;

    const success = PaymentService.simulatePayment(linkId);
    if (success) {
      setPaymentLinks(prev => prev.map(l => l.id === linkId ? { ...l, status: 'paid' } : l));
      
      const booking = bookings.find(b => b.id === link.bookingId);
      if (!booking) return;

      // Update booking status
      setBookings(prev => prev.map(b => {
        if (b.id === link.bookingId) {
          if (link.type === 'deposit') {
            return { ...b, depositStatus: 'paid', paymentStatus: 'partial', status: 'confirmed' };
          } else if (link.type === 'full_payment') {
            return { ...b, paymentStatus: 'full', status: 'confirmed' };
          } else if (link.type === 'cancellation_fee') {
            return { ...b, paymentStatus: 'partial' };
          }
        }
        return b;
      }));

      // Add transaction
      const newTransaction: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'income',
        category: 'booking',
        amount: link.amount,
        description: `Pagamento via link (${link.type}) - Reserva #${booking.reservationNumber || booking.id.substring(0, 8).toUpperCase()}`,
        date: format(new Date(), 'yyyy-MM-dd'),
        bookingId: link.bookingId
      };
      setTransactions(prev => [...prev, newTransaction]);

      toast.success('Pagamento confirmado!', {
        description: `O depósito de R$ ${(link.amount || 0).toFixed(2)} foi recebido.`,
      });
    }
  };

  const handleCancelBooking = (booking: Booking) => {
    setBookingToCancel(booking);
    setIsCancelBookingModalOpen(true);
  };

  const confirmCancelBooking = () => {
    if (!bookingToCancel) return;
    
    const booking = bookingToCancel;
    const fee = PaymentService.calculateCancellationFee(booking, 'moderate');
    
    if (fee > 0) {
      const link = PaymentService.generatePaymentLink(booking, fee, 'cancellation_fee');
      setPaymentLinks(prev => [...prev, link]);
      setBookings(prev => prev.map(b => 
        b.id === booking.id 
          ? { ...b, status: 'cancelled', cancellationFee: fee, paymentLinkId: link.id } 
          : b
      ));
      toast.warning('Reserva cancelada com taxa', {
        description: `Taxa de cancelamento de R$ ${(fee || 0).toFixed(2)} aplicada. Link enviado.`,
      });
    } else {
      setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: 'cancelled' } : b));
      toast.success('Reserva cancelada sem taxas');
    }
    
    setIsCancelBookingModalOpen(false);
    setBookingToCancel(null);
    setSelectedBookingId(null);
    handleBack();
  };

  const handleEditBooking = (booking: Booking) => {
    const client = clients.find(c => c.id === booking.clientId);
    const room = rooms.find(r => r.id === booking.roomId);
    
    if (client && room) {
      setBookingClient(client);
      setBookingCheckIn(parseISO(booking.checkIn));
      setBookingCheckOut(parseISO(booking.checkOut));
      const nights = differenceInCalendarDays(parseISO(booking.checkOut), parseISO(booking.checkIn)) || 1;
      const ratePlanId = booking.ratePlanId || getDefaultRatePlanId(room);
      const plan = ratePlans.find(p => p.id === ratePlanId);
      const adults = booking.adults || 2;
      const children = booking.children || 0;
      const extraAdultFee = adults > (plan?.normalOccupancy || 2) ? (plan?.guestAdjustments?.[adults]?.amount || plan?.guestAdjustments?.[3]?.amount || 0) : 0;
      const extraChildFee = children > (plan?.chargesForChildren ? 0 : 1) ? (plan?.childrenFee || plan?.guestAdjustments?.[3]?.amount || 0) : 0;

      setBookingRooms([{ 
        room, 
        adults,
        children,
        extraAdultFee,
        extraChildFee,
        ratePlanId, 
        price: booking.totalPrice / nights
      }]);
      setBookingStatus(booking.status);
      setBookingPaymentStatus(booking.paymentStatus);
      setBookingNotes(booking.notes || '');
      setBookingKeyControl(booking.keyControl || { keysGiven: false, gateControlsGiven: 0, keysReturned: false, gateControlsReturned: false });
      
      if (booking.depositAmount && booking.depositAmount > 0) {
        setIsAdvancePayment(true);
        setPrePaymentAmount(booking.depositAmount.toString());
      } else {
        setIsAdvancePayment(false);
        setPrePaymentAmount('');
      }

      setSelectedBookingId(booking.id);
      handleNavigate('new-booking');
      setIsActionsMenuOpen(false);
    }
  };

  const replaceTemplateVariables = (template: string, booking: Booking, client: Client | undefined) => {
    if (!client) return template;
    const checkInDate = parseISO(booking.checkIn);
    const checkOutDate = parseISO(booking.checkOut);
    const room = rooms.find(r => r.id === booking.roomId);
    
    // Find active payment link for this booking
    const activeLink = paymentLinks.find(l => l.bookingId === booking.id && l.status === 'active');
    
    return template
      .replace(/{nome}/g, client.name)
      .replace(/{data_checkin}/g, format(checkInDate, 'dd/MM/yyyy'))
      .replace(/{data_checkout}/g, format(checkOutDate, 'dd/MM/yyyy'))
      .replace(/{quarto}/g, room?.number || '---')
      .replace(/{numero_reserva}/g, booking.reservationNumber || booking.id.substring(0, 8).toUpperCase())
      .replace(/{valor_total}/g, `R$ ${(booking.totalPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
      .replace(/{link_fnrh}/g, `${window.location.origin}/b/${establishment.slug}/fnrh?b=${booking.id}`)
      .replace(/{link_pagamento}/g, activeLink?.url || '---')
      .replace(/{valor_deposito}/g, `R$ ${(booking.depositAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  };

  const handleSendWhatsApp = (booking: Booking, templateType: 'confirmation' | 'deposit' | 'fnrh') => {
    const client = clients.find(c => c.id === booking.clientId);
    if (!client || !client.phone) {
      toast.error('Hóspede não possui telefone cadastrado.');
      return;
    }

    let template = whatsappTemplate;
    if (templateType === 'deposit') template = depositTemplate;
    if (templateType === 'fnrh') template = fnrhTemplate;

    const message = replaceTemplateVariables(template, booking, client);
    const phone = client.phone.replace(/\D/g, '');
    const url = `https://wa.me/${phone.startsWith('55') ? phone : '55' + phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    setIsActionsMenuOpen(false);
  };

  const handleSendEmail = (booking: Booking) => {
    const client = clients.find(c => c.id === booking.clientId);
    if (!client || !client.email) {
      toast.error('Hóspede não possui e-mail cadastrado.');
      return;
    }

    const subject = `Confirmação de Reserva - ${establishment.name}`;
    const body = replaceTemplateVariables(whatsappTemplate, booking, client);
    const mailtoUrl = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    setIsActionsMenuOpen(false);
  };

  const handlePrintInvoice = (booking: Booking) => {
    const client = clients.find(c => c.id === booking.clientId);
    const room = rooms.find(r => r.id === booking.roomId);
    
    const bookingTransactions = transactions.filter(t => t.bookingId === booking.id);
    const totalPaid = bookingTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    const consumptionTotal = (booking.consumption || []).reduce((sum, c) => sum + (c.amount || (c.quantity || 0) * (c.unitPrice || 0)), 0);
    const grandTotal = booking.totalPrice + consumptionTotal;
    const balanceDue = grandTotal - totalPaid;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = `
      <html>
        <head>
          <title>Fatura - ${booking.reservationNumber}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #334155; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
            .establishment-info h1 { margin: 0; color: #4f46e5; }
            .invoice-details { text-align: right; }
            .section { margin-bottom: 30px; }
            .section-title { font-weight: bold; text-transform: uppercase; font-size: 12px; color: #64748b; margin-bottom: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 5px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .label { font-size: 12px; color: #94a3b8; }
            .value { font-weight: 500; }
            .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="establishment-info">
              <h1>${establishment.name}</h1>
              <p>${establishment.address}<br>${establishment.phone} | ${establishment.email}</p>
            </div>
            <div class="invoice-details">
              <h2>FATURA / VOUCHER</h2>
              <p>Nº: ${booking.reservationNumber}<br>Data: ${format(new Date(), 'dd/MM/yyyy')}</p>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Informações do Hóspede</div>
            <div class="grid">
              <div>
                <div class="label">Nome</div>
                <div class="value">${client?.name || '---'}</div>
              </div>
              <div>
                <div class="label">CPF/Documento</div>
                <div class="value">${client?.document || '---'}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Detalhes da Hospedagem</div>
            <div class="grid">
              <div>
                <div class="label">Quarto</div>
                <div class="value">${room?.number || '---'} (${room?.category || '---'})</div>
              </div>
              <div>
                <div class="label">Status</div>
                <div class="value">${booking.status.toUpperCase()}</div>
              </div>
              <div>
                <div class="label">Check-in</div>
                <div class="value">${format(parseISO(booking.checkIn), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</div>
              </div>
              <div>
                <div class="label">Check-out</div>
                <div class="value">${format(parseISO(booking.checkOut), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Resumo Financeiro</div>
            <div class="grid">
              <div>
                <div class="label">Valor Reserva</div>
                <div class="value">R$ ${(booking.totalPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div class="label">Consumo</div>
                <div class="value">R$ ${(consumptionTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div class="label">Valor Total</div>
                <div class="value">R$ ${(grandTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div class="label">Valor Pago</div>
                <div class="value">R$ ${(totalPaid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div class="label">Saldo Devedor</div>
                <div class="value" style="color: ${balanceDue > 0 ? '#e11d48' : '#059669'}">
                  R$ ${(balanceDue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Descrição / Observações</div>
            <div class="value" style="font-size: 14px; line-height: 1.5; white-space: pre-wrap;">
              ${replaceTemplateVariables(invoiceTemplate, booking, client)}
            </div>
          </div>

          <div class="footer">
            <p>Obrigado pela preferência!<br>${establishment.name} - ${establishment.phone}</p>
          </div>

          <script>
            window.onload = () => { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    setIsActionsMenuOpen(false);
  };

  const handleAddPayment = () => {
    if (!paymentBookingId || !paymentAmount) return;
    
    const amount = parseFloat(paymentAmount);
    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'income',
      category: 'booking',
      amount: amount,
      description: `Pagamento Reserva #${bookings.find(b => b.id === paymentBookingId)?.reservationNumber || paymentBookingId} - ${paymentMethod} ${paymentNotes ? `(${paymentNotes})` : ''}`,
      date: paymentDate,
      bookingId: paymentBookingId,
    };

    const updatedTransactions = [...transactions, newTransaction];
    setTransactions(updatedTransactions);
    
    // Update booking payment status
    setBookings(prev => prev.map(b => {
      if (b.id === paymentBookingId) {
        const bTransactions = updatedTransactions.filter(t => t.bookingId === b.id);
        const totalPaid = bTransactions.reduce((sum, t) => sum + t.amount, 0);
        const consumptionTotal = (b.consumption || []).reduce((sum, c) => sum + (c.amount || (c.quantity || 0) * (c.unitPrice || 0)), 0);
        const grandTotal = b.totalPrice + consumptionTotal;
        
        let newPaymentStatus: Booking['paymentStatus'] = 'none';
        if (totalPaid > 0) {
          newPaymentStatus = totalPaid >= grandTotal ? 'full' : 'partial';
        }
        
        return { ...b, paymentStatus: newPaymentStatus };
      }
      return b;
    }));

    // Reset and close
    setPaymentAmount('');
    setPaymentMethod('credit_card');
    setPaymentDate(format(new Date(), 'yyyy-MM-dd'));
    setPaymentNotes('');
    setIsAddPaymentModalOpen(false);
    setPaymentBookingId(null);
  };

  const handleCalendarMouseDown = (e: React.MouseEvent, roomId: string, day: Date) => {
    // Only handle left click
    if (e.button !== 0) return;
    
    closeAllPopovers();

    // Check if there's already a booking in this cell
    const dayBookings = getBookingsForRoomAndDay(roomId, day);
    if (dayBookings.some(b => (b.type === 'checkin' || b.type === 'stay') && b.booking.status !== 'cancelled' && b.booking.status !== 'no-show')) {
      return;
    }

    setCalendarSelection({
      roomId,
      startDate: day,
      endDate: day,
      isDragging: true
    });
    setSelectionPopover(null);
    setCellPopover(null);
  };

  const handleCalendarMouseEnter = (roomId: string, day: Date) => {
    if (!calendarSelection || !calendarSelection.isDragging) return;
    if (calendarSelection.roomId !== roomId) return;

    setCalendarSelection(prev => {
      if (!prev) return null;
      // We always want the selection to be from the original start date to the current day
      // But we need to handle dragging backwards too
      const newStart = isBefore(day, prev.startDate) ? day : prev.startDate;
      const newEnd = isAfter(day, prev.startDate) ? day : prev.startDate;
      
      return {
        ...prev,
        startDate: newStart,
        endDate: newEnd
      };
    });
  };

  const handleCalendarMouseUp = (e: React.MouseEvent) => {
    if (!calendarSelection || !calendarSelection.isDragging) return;

    setCalendarSelection(prev => prev ? { ...prev, isDragging: false } : null);
    
    // Only show selection popover if it's a range (more than one day)
    if (calendarSelection.startDate.getTime() !== calendarSelection.endDate.getTime()) {
      setSelectionPopover({
        x: e.clientX,
        y: e.clientY
      });
    }
  };

  const handleBlockDates = () => {
    if (!calendarSelection) return;

    const { roomId, startDate, endDate } = calendarSelection;
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    const newBooking: Booking = {
      id: Math.random().toString(36).substr(2, 9),
      reservationNumber: `BLOQ-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      clientId: 'system',
      roomId: roomId,
      checkIn: format(startDate, 'yyyy-MM-dd'),
      checkOut: format(addDays(endDate, 1), 'yyyy-MM-dd'),
      status: 'blocked',
      totalPrice: 0,
      paymentStatus: 'full',
      consumption: [],
      guests: 0,
      channel: 'direct'
    };

    setBookings(prev => [...prev, newBooking]);
    setCalendarSelection(null);
    setSelectionPopover(null);
  };

  const handleCreateBookingFromSelection = () => {
    if (!calendarSelection) return;
    resetForm();

    const { roomId, startDate, endDate } = calendarSelection;
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    const checkIn = startDate;
    const checkOut = addDays(endDate, 1);
    
    const yieldPrice = calculateRoomPrice(
      room,
      checkIn,
      checkOut,
      getDefaultRatePlanId(room)
    );

    setBookingCheckIn(checkIn);
    setBookingCheckOut(checkOut);
    const plan = ratePlans.find(p => p.id === getDefaultRatePlanId(room));
    const adults = 2;
    const children = 0;
    const extraAdultFee = adults > (plan?.normalOccupancy || 2) ? (plan?.guestAdjustments?.[adults]?.amount || plan?.guestAdjustments?.[3]?.amount || 0) : 0;
    const extraChildFee = children > (plan?.chargesForChildren ? 0 : 1) ? (plan?.childrenFee || plan?.guestAdjustments?.[3]?.amount || 0) : 0;
    setBookingRooms([{ room, adults, children, extraAdultFee, extraChildFee, ratePlanId: getDefaultRatePlanId(room), price: yieldPrice }]);
    setSelectedBookingId(null);
    setCurrentView('new-booking');
    
    setCalendarSelection(null);
    setSelectionPopover(null);
  };

  const handleBookingClick = (e: React.MouseEvent, booking: Booking) => {
    e.stopPropagation();
    closeAllPopovers();
    const rect = e.currentTarget.getBoundingClientRect();
    setSelectedBooking({
      booking,
      x: e.clientX,
      y: e.clientY
    });
    setIsSubmenuOpen(false);
  };

  const handleDragStart = (e: React.DragEvent, booking: Booking) => {
    setDraggedBooking(booking);
    // Set a ghost image or just let it be
    e.dataTransfer.setData('bookingId', booking.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, roomId: string, day: Date) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTarget?.roomId !== roomId || !isSameDay(dragOverTarget.day, day)) {
      setDragOverTarget({ roomId, day });
    }
  };

  const handleDragLeave = () => {
    setDragOverTarget(null);
  };

  const handleDrop = (e: React.DragEvent, roomId: string, day: Date) => {
    e.preventDefault();
    setDragOverTarget(null);
    if (!draggedBooking) return;
    
    setDropTarget({ roomId, day });
    setIsConfirmingMove(true);
  };

  const handleTouchStart = (e: React.TouchEvent, booking: Booking) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    hasLongPressed.current = false;

    // Set a timer for long press
    touchTimer.current = setTimeout(() => {
      hasLongPressed.current = true;
      setHoveredBooking({ booking, rect });
      // Vibrate if supported
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }, 400); // 400ms for long press
  };

  const [bookingError, setBookingError] = useState<string | null>(null);
  const [overbookingConflict, setOverbookingConflict] = useState<{
    type: 'new' | 'move';
    bookingId?: string;
    roomId: string;
    roomNumber: string;
    checkIn: Date;
    checkOut: Date;
    suggestions: Room[];
  } | null>(null);

  const confirmMove = () => {
    if (!draggedBooking || !dropTarget) return;

    const duration = Math.max(1, differenceInCalendarDays(parseISO(draggedBooking.checkOut), parseISO(draggedBooking.checkIn)));
    const newCheckIn = addHours(startOfDay(dropTarget.day), 14);
    const newCheckOut = addHours(startOfDay(addDays(dropTarget.day, duration)), 12);
    
    // Check for conflicts
    if (checkBookingConflict(bookings, dropTarget.roomId, newCheckIn, newCheckOut, draggedBooking.id)) {
      const suggestions = rooms.filter(r => 
        r.id !== dropTarget.roomId && 
        !checkBookingConflict(bookings, r.id, newCheckIn, newCheckOut, draggedBooking.id)
      ).slice(0, 3);

      const room = rooms.find(r => r.id === dropTarget.roomId);

      setOverbookingConflict({
        type: 'move',
        bookingId: draggedBooking.id,
        roomId: dropTarget.roomId,
        roomNumber: room?.number || 'Desconhecido',
        checkIn: newCheckIn,
        checkOut: newCheckOut,
        suggestions
      });

      setBookingError("Este quarto já está reservado para este período.");
      setIsConfirmingMove(false);
      setDraggedBooking(null);
      setDropTarget(null);
      return;
    }

    const newCheckInStr = format(newCheckIn, "yyyy-MM-dd'T'HH:mm:ss");
    const newCheckOutStr = format(newCheckOut, "yyyy-MM-dd'T'HH:mm:ss");
    
    const newRoom = rooms.find(r => r.id === dropTarget.roomId);
    const newTotalPrice = (newRoom?.price || 0) * duration;

    const updatedBookings = bookings.map(b => 
      b.id === draggedBooking.id 
        ? { 
            ...b, 
            roomId: dropTarget.roomId, 
            checkIn: newCheckInStr, 
            checkOut: newCheckOutStr,
            totalPrice: newTotalPrice
          } 
        : b
    );
    
    setBookings(updatedBookings);
    setCalendarSuccessMessage("Reserva atualizada com sucesso.");
    setTimeout(() => setCalendarSuccessMessage(null), 3000);
    
    const movedBooking = updatedBookings.find(b => b.id === draggedBooking.id);
    if (movedBooking) {
      setIsSyncing(true);
      channelSyncService.syncBookingToExternalChannels(movedBooking).then(() => setIsSyncing(false));
    }

    setIsConfirmingMove(false);
    setDraggedBooking(null);
    setDropTarget(null);
  };

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => 
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const daysInView = useMemo(() => {
    return eachDayOfInterval({
      start: currentDate,
      end: addDays(currentDate, daysToShow - 1)
    });
  }, [currentDate, daysToShow]);

  const categories = useMemo(() => {
    return Array.from(new Set(rooms.map(r => r.category)));
  }, [rooms]);

  const getBookingsForRoomAndDay = (roomId: string, day: Date) => {
    const dayBookings = bookings.filter(b => {
      if (b.roomId !== roomId) return false;

      // Apply Status Filter
      if (calendarStatusFilter !== 'all' && b.status !== calendarStatusFilter) return false;

      // Apply Search Filter (Guest Name)
      if (calendarSearchQuery) {
        const client = clients.find(c => c.id === b.clientId);
        if (!client?.name.toLowerCase().includes(calendarSearchQuery.toLowerCase())) return false;
      }

      // Apply Period Filter
      if (calendarStartDate || calendarEndDate) {
        const checkIn = parseISO(b.checkIn);
        const checkOut = parseISO(b.checkOut);
        const filterStart = calendarStartDate ? parseISO(calendarStartDate) : null;
        const filterEnd = calendarEndDate ? parseISO(calendarEndDate) : null;

        if (filterStart && checkOut < filterStart) return false;
        if (filterEnd && checkIn > filterEnd) return false;
      }

      const checkIn = parseISO(b.checkIn);
      const checkOut = parseISO(b.checkOut);
      // A booking is relevant if it starts, ends, or spans this day
      return (isSameDay(day, checkIn) || isSameDay(day, checkOut) || (day > checkIn && day < checkOut));
    });
    
    return dayBookings.map(b => {
      const checkIn = parseISO(b.checkIn);
      const checkOut = parseISO(b.checkOut);
      let type: 'checkin' | 'checkout' | 'stay' = 'stay';
      if (isSameDay(day, checkIn)) type = 'checkin';
      else if (isSameDay(day, checkOut)) type = 'checkout';
      
      return { booking: b, type };
    });
  };

  const renderPublicPageSettings = () => {
    const publicUrl = `${window.location.origin}/b/${establishment.slug}`;

    return (
      <div className="max-w-4xl space-y-8">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Configuração da Página Pública</h2>
              <p className="text-slate-500">Personalize como seus hóspedes veem sua página de reservas.</p>
            </div>
            <a 
              href={publicUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-100 transition-all"
            >
              <ExternalLink size={18} />
              Ver Página
            </a>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Slug da URL</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">/b/</span>
                  <input 
                    type="text" 
                    value={establishment.slug}
                    onChange={e => setEstablishment({...establishment, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Este é o link que você compartilhará com seus hóspedes.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Título Curto (Hero)</label>
                <input 
                  type="text" 
                  value={establishment.description}
                  onChange={e => setEstablishment({...establishment, description: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ex: O melhor refúgio no coração da cidade"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">URL da Imagem de Capa (Hero)</label>
              <input 
                type="text" 
                value={establishment.heroImageUrl}
                onChange={e => setEstablishment({...establishment, heroImageUrl: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="https://images.unsplash.com/..."
              />
              {establishment.heroImageUrl && (
                <div className="mt-2 h-32 rounded-xl overflow-hidden border border-slate-200">
                  <img src={establishment.heroImageUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Sobre o Estabelecimento (HTML)</label>
              <textarea 
                value={establishment.aboutHtml}
                onChange={e => setEstablishment({...establishment, aboutHtml: e.target.value})}
                rows={6}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                placeholder="<p>Descreva seu hotel aqui...</p>"
              />
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-700">Comodidades</label>
              <div className="flex flex-wrap gap-2">
                {establishment.amenities.map((amenity, index) => (
                  <div key={index} className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-sm text-slate-700">
                    {amenity}
                    <button 
                      onClick={() => setEstablishment({
                        ...establishment, 
                        amenities: establishment.amenities.filter((_, i) => i !== index)
                      })}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => {
                    const name = prompt('Nome da comodidade:');
                    if (name) setEstablishment({...establishment, amenities: [...establishment.amenities, name]});
                  }}
                  className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-indigo-100"
                >
                  <Plus size={14} />
                  Adicionar
                </button>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-100 flex justify-end">
            <button 
              onClick={() => toast.success('Configurações salvas com sucesso!')}
              className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAccessDenied = () => (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-6">
        <Shield size={40} />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Acesso Negado</h2>
      <p className="text-slate-500 max-w-md mb-8">
        Você não tem permissão para acessar esta área. Entre em contato com o administrador do sistema se acreditar que isso é um erro.
      </p>
      <button 
        onClick={() => setCurrentView('home')}
        className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
      >
        Voltar para o Início
      </button>
    </div>
  );

  const handleUpdateRoomStatus = (roomId: string, status: RoomStatus) => {
    setRooms(prev => prev.map(room => 
      room.id === roomId ? { ...room, status } : room
    ));
    toast.success(`Status do quarto atualizado para ${status}`);
  };

  const renderHousekeeping = () => (
    <HousekeepingView 
      rooms={rooms} 
      onUpdateRoomStatus={handleUpdateRoomStatus} 
    />
  );

  const renderHome = () => {
    const todayCheckIns = bookings.filter(b => isToday(parseISO(b.checkIn)) && b.status !== 'checked-in' && b.status !== 'cancelled' && b.status !== 'no-show' && b.status !== 'blocked');
    const todayCheckOuts = bookings.filter(b => isToday(parseISO(b.checkOut)) && (b.status === 'checked-in' || b.status === 'overdue-checkout'));
    
    const handleQuickCheckIn = (bookingId: string) => {
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'checked-in' } : b));
        setRooms(prev => prev.map(r => r.id === booking.roomId ? { ...r, availability: 'occupied', status: 'clean' } : r));
        toast.success(`Check-in realizado para o quarto ${rooms.find(r => r.id === booking.roomId)?.number}`);
      }
    };

    const handleQuickCheckOut = (bookingId: string) => {
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'checked-out' } : b));
        setRooms(prev => prev.map(r => r.id === booking.roomId ? { ...r, availability: 'available', status: 'dirty' } : r));
        toast.success(`Check-out realizado para o quarto ${rooms.find(r => r.id === booking.roomId)?.number}`);
      }
    };

    return (
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold text-slate-800">Bem-vindo!</h2>
          <p className="text-slate-500">Aqui está o resumo para hoje, {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Check-ins of the Day Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[400px]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                  <PlaneLanding size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Check-ins do Dia</h3>
                  <p className="text-xs text-slate-500">{todayCheckIns.length} chegadas previstas</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100 flex-1 flex flex-col overflow-y-auto">
              {todayCheckIns.length > 0 ? (
                todayCheckIns.map(booking => {
                  const client = clients.find(c => c.id === booking.clientId);
                  const room = rooms.find(r => r.id === booking.roomId);
                  const isExpanded = expandedBookingId === booking.id;

                  return (
                    <div key={booking.id} className={cn(
                      "p-4 transition-colors",
                      booking.status === 'no-show' ? "bg-rose-50/30 hover:bg-rose-100/50" :
                      booking.status === 'confirmed' ? "bg-emerald-50/30 hover:bg-emerald-100/50" :
                      booking.status === 'pre-booking' ? "bg-amber-50/30 hover:bg-amber-100/50" :
                      booking.status === 'checked-in' ? "bg-blue-50/30 hover:bg-blue-100/50" :
                      booking.status === 'checked-out' ? "bg-slate-50/30 hover:bg-slate-100/50" :
                      "hover:bg-slate-50"
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-semibold text-slate-800 text-sm">{client?.name}</div>
                            <div className="flex items-center gap-2">
                              <div className="text-xs text-slate-500">Quarto {room?.number} • {room?.category}</div>
                              <div className={cn(
                                "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                                booking.status === 'no-show' ? "bg-rose-100 text-rose-600" :
                                booking.status === 'confirmed' ? "bg-emerald-100 text-emerald-600" :
                                booking.status === 'pre-booking' ? "bg-amber-100 text-amber-600" :
                                "bg-slate-100 text-slate-600"
                              )}>
                                {booking.status === 'no-show' ? 'NO-SHOW' : booking.status}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          >
                            <ChevronRightCircle size={18} className={cn("transition-transform", isExpanded && "rotate-90")} />
                          </button>
                          <div className="relative group">
                            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                              <Edit2 size={18} />
                            </button>
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                              <button 
                                onClick={() => {
                                  handleEditBooking(booking);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                              >
                                <PlaneLanding size={16} className="text-emerald-500" />
                                Check-in
                              </button>
                              <button 
                                onClick={() => handleSendWhatsApp(booking, 'fnrh')}
                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                              >
                                <MessageCircle size={16} className="text-indigo-500" />
                                Pedir FNRH
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedBookingId(booking.id);
                                  handleNavigate('booking-details');
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                              >
                                <Bed size={16} className="text-blue-500" />
                                Detalhes da Reserva
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedClientId(booking.clientId);
                                  handleNavigate('guest-details');
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                              >
                                <User size={16} className="text-purple-500" />
                                Detalhes do Hóspede
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="text-slate-400 block mb-1">Check-in</span>
                                <span className="font-medium text-slate-700">{format(parseISO(booking.checkIn), "dd/MM/yyyy HH:mm")}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block mb-1">Check-out</span>
                                <span className="font-medium text-slate-700">{format(parseISO(booking.checkOut), "dd/MM/yyyy HH:mm")}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block mb-1">Valor Total</span>
                                <span className="font-bold text-emerald-600">R$ {(booking.totalPrice || 0).toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block mb-1">Pagamento</span>
                                <span className={cn(
                                  "font-medium",
                                  booking.paymentStatus === 'full' ? "text-emerald-600" : 
                                  booking.paymentStatus === 'partial' ? "text-blue-600" : "text-amber-600"
                                )}>
                                  {booking.paymentStatus === 'full' ? 'Completo' : 
                                   booking.paymentStatus === 'partial' ? 'Parcial' : 'Pendente'}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 py-8 text-center h-full flex flex-col justify-center items-center">
                  <p className="text-slate-400 text-sm">Nenhum check-in previsto para hoje.</p>
                </div>
              )}
            </div>
          </div>

          {/* Check-outs of the Day Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[400px]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-blue-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                  <PlaneTakeoff size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Check-outs do Dia</h3>
                  <p className="text-xs text-slate-500">{todayCheckOuts.length} saídas previstas</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100 flex-1 flex flex-col overflow-y-auto">
              {todayCheckOuts.length > 0 ? (
                todayCheckOuts.map(booking => {
                  const client = clients.find(c => c.id === booking.clientId);
                  const room = rooms.find(r => r.id === booking.roomId);
                  const isExpanded = expandedBookingId === booking.id;

                  return (
                    <div key={booking.id} className={cn(
                      "p-4 transition-colors",
                      booking.status === 'overdue-checkout' ? "bg-purple-50/30 hover:bg-purple-100/50" :
                      booking.status === 'checked-out' ? "bg-slate-50/30 hover:bg-slate-100/50" :
                      "bg-blue-50/30 hover:bg-blue-100/50"
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-semibold text-slate-800 text-sm">{client?.name}</div>
                            <div className="flex items-center gap-2">
                              <div className="text-xs text-slate-500">Quarto {room?.number} • {room?.category}</div>
                              <div className={cn(
                                "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                                booking.status === 'overdue-checkout' ? "bg-purple-100 text-purple-600" :
                                "bg-blue-100 text-blue-600"
                              )}>
                                {booking.status === 'overdue-checkout' ? 'ATRASADO' : 'HOSPEDADO'}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <ChevronRightCircle size={18} className={cn("transition-transform", isExpanded && "rotate-90")} />
                          </button>
                          <div className="relative group">
                            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                              <Edit2 size={18} />
                            </button>
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                              <button 
                                onClick={() => handleQuickCheckOut(booking.id)}
                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                              >
                                <PlaneTakeoff size={16} className="text-blue-500" />
                                Check-out Rápido
                              </button>
                              <button 
                                onClick={() => handleSendWhatsApp(booking, 'fnrh')}
                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                              >
                                <MessageCircle size={16} className="text-indigo-500" />
                                Pedir FNRH
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedBookingId(booking.id);
                                  handleNavigate('booking-details');
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                              >
                                <Bed size={16} className="text-blue-500" />
                                Detalhes da Reserva
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedClientId(booking.clientId);
                                  handleNavigate('guest-details');
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                              >
                                <User size={16} className="text-purple-500" />
                                Detalhes do Hóspede
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="text-slate-400 block mb-1">Check-in</span>
                                <span className="font-medium text-slate-700">{format(parseISO(booking.checkIn), "dd/MM/yyyy HH:mm")}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block mb-1">Check-out</span>
                                <span className="font-medium text-slate-700">{format(parseISO(booking.checkOut), "dd/MM/yyyy HH:mm")}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block mb-1">Valor Total</span>
                                <span className="font-bold text-emerald-600">R$ {(booking.totalPrice || 0).toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block mb-1">Pagamento</span>
                                <span className={cn(
                                  "font-medium",
                                  booking.paymentStatus === 'full' ? "text-emerald-600" : 
                                  booking.paymentStatus === 'partial' ? "text-blue-600" : "text-amber-600"
                                )}>
                                  {booking.paymentStatus === 'full' ? 'Completo' : 
                                   booking.paymentStatus === 'partial' ? 'Parcial' : 'Pendente'}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 py-8 text-center h-full flex flex-col justify-center items-center">
                  <p className="text-slate-400 text-sm">Nenhum check-out previsto para hoje.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Calendar Consultation */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800">Calendário de Reservas</h3>
            <button 
              onClick={() => setCurrentView('calendar')}
              className="text-sm text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
            >
              Ver calendário completo
            </button>
          </div>
          <div className="h-[600px] bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col">
            {renderCalendar()}
          </div>
        </div>
      </div>
    );
  };

  const renderBookingDetails = () => {
    const booking = bookings.find(b => b.id === selectedBookingId);
    if (!booking) return null;
    const client = clients.find(c => c.id === booking.clientId);
    const room = rooms.find(r => r.id === booking.roomId);
    
    const bookingTransactions = transactions.filter(t => t.bookingId === booking.id);
    const totalPaid = bookingTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    const consumptionTotal = (booking.consumption || []).reduce((sum, c) => sum + (c.amount || (c.quantity || 0) * (c.unitPrice || 0)), 0);
    const grandTotal = booking.totalPrice + consumptionTotal;
    const balanceDue = grandTotal - totalPaid;

    return (
      <div className="max-w-3xl mx-auto pb-20">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <button 
            onClick={() => handleBack()} 
            className="p-2 hover:bg-slate-100 rounded-full transition-colors mt-1"
          >
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Reserva</h1>
                <h2 className="text-xl text-slate-600">#{booking.reservationNumber || booking.id.substring(0, 8).toUpperCase()}</h2>
                
                <div className="mt-6 flex flex-wrap items-center gap-3 relative">
                  {(booking.status === 'confirmed' || booking.status === 'pre-booking') && (
                    <button 
                      onClick={() => {
                        const updatedBooking = { ...booking, status: 'checked-in' as const };
                        setBookings(bookings.map(b => b.id === booking.id ? updatedBooking : b));
                        
                        const updatedRoom = { ...room!, status: 'occupied' as const };
                        setRooms(rooms.map(r => r.id === updatedRoom.id ? updatedRoom : r));
                        
                        toast.success('Check-in realizado com sucesso!');
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-sm shadow-blue-500/30 hover:bg-blue-700 transition-all"
                    >
                      <User size={18} />
                      Realizar Check-in
                    </button>
                  )}
                  
                  {(booking.status === 'checked-in' || booking.status === 'overdue-checkout') && (
                    <>
                      <button 
                        onClick={() => {
                          setActiveBookingForConsumption(booking);
                          handleNavigate('booking-consumption');
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm shadow-indigo-500/30 hover:bg-indigo-700 transition-all"
                      >
                        <Wine size={18} />
                        Lançar Consumo
                      </button>
                      <button 
                        onClick={() => {
                          setActiveBookingForConsumption(booking);
                          handleNavigate('checkout');
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-sm shadow-emerald-500/30 hover:bg-emerald-700 transition-all"
                      >
                        <CheckCircle2 size={18} />
                        Ir para Check-out
                      </button>
                    </>
                  )}

                  <div className="relative">
                    <button 
                      className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsActionsMenuOpen(!isActionsMenuOpen);
                      }}
                    >
                      <Settings size={18} className="text-slate-500" />
                      Mais Opções
                    </button>
                    
                    {isActionsMenuOpen && (
                      <div 
                        className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                      <button 
                        onClick={() => handleEditBooking(booking)}
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                      >
                        <Edit2 size={16} className="text-slate-400" />
                        Atualizar
                      </button>
                      <div className="h-px bg-slate-100 my-1"></div>
                      <button 
                        onClick={() => handleSendEmail(booking)}
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                      >
                        <Mail size={16} className="text-slate-400" />
                        Enviar email de confirmação
                      </button>
                      <button 
                        onClick={() => handleSendWhatsApp(booking, 'confirmation')}
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                      >
                        <MessageCircle size={16} className="text-slate-400" />
                        Enviar confirmação por WhatsApp
                      </button>
                      <div className="h-px bg-slate-100 my-1"></div>
                      <button 
                        onClick={() => handleSendWhatsApp(booking, 'deposit')}
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                      >
                        <DollarSign size={16} className="text-slate-400" />
                        Pedir um depósito
                      </button>
                      <button 
                        onClick={() => handleSendWhatsApp(booking, 'fnrh')}
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                      >
                        <User size={16} className="text-slate-400" />
                        Pedir FNRH
                      </button>
                      <div className="h-px bg-slate-100 my-1"></div>
                      <button 
                        onClick={() => handlePrintInvoice(booking)}
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Printer size={16} className="text-slate-400" />
                          Imprimir fatura / voucher
                        </div>
                        <Diamond size={14} className="text-orange-500" />
                      </button>
                      <div className="h-px bg-slate-100 my-1"></div>
                      <button 
                        onClick={() => handleCancelBooking(booking)}
                        className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                      >
                        <X size={16} className="text-red-400" />
                        Cancelar Reserva
                      </button>
                    </div>
                  )}
                  </div>
                </div>
              </div>
              
              <div className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2",
                booking.status === 'checked-out' ? "bg-emerald-500 text-white" : 
                booking.status === 'confirmed' ? "bg-emerald-500 text-white" :
                booking.status === 'checked-in' ? "bg-blue-500 text-white" :
                booking.status === 'pre-booking' ? "bg-amber-500 text-white" :
                booking.status === 'no-show' ? "bg-rose-500 text-white" :
                booking.status === 'overdue-checkout' ? "bg-purple-500 text-white" :
                "bg-slate-500 text-white"
              )}>
                <Lock size={14} />
                {booking.status === 'checked-out' ? 'Finalizado' : 
                 booking.status === 'no-show' ? 'No-Show' : 
                 booking.status === 'overdue-checkout' ? 'Check-out Atrasado' : 
                 booking.status === 'confirmed' ? 'Confirmado' :
                 booking.status === 'checked-in' ? 'Hospedado' :
                 booking.status === 'pre-booking' ? 'Pré-reserva' :
                 booking.status === 'cancelled' ? 'Cancelado' :
                 booking.status}
              </div>
            </div>
          </div>
        </div>

        {/* Hóspede Principal */}
        <div className={cn(
          "rounded-2xl p-6 shadow-sm border border-slate-100 mb-8 transition-colors",
          booking.status === 'no-show' ? "bg-rose-50/30" :
          booking.status === 'confirmed' ? "bg-emerald-50/30" :
          booking.status === 'pre-booking' ? "bg-amber-50/30" :
          booking.status === 'checked-in' ? "bg-blue-50/30" :
          booking.status === 'checked-out' ? "bg-slate-50/30" :
          "bg-white"
        )}>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Hóspede Principal</h3>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h4 className="text-xl font-bold text-slate-800">{client?.name}</h4>
              <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                <User size={14} />
                <span>{booking.adults || booking.guests || 2} adultos{booking.children ? `, ${booking.children} crianças` : ''}</span>
              </div>
            </div>
            <button 
              onClick={() => {
                setSelectedClientId(booking.clientId);
                handleNavigate('guest-details');
              }}
              className="px-4 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-2 text-sm"
            >
              <User size={16} />
              Completar / Revisar Dados
            </button>
          </div>
          
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Datas da Estadia</h3>
          <div>
            <h4 className="text-lg font-bold text-slate-800">
              {format(parseISO(booking.checkIn), 'dd MMM', { locale: ptBR })} - {format(parseISO(booking.checkOut), 'dd MMM, yyyy', { locale: ptBR })}
            </h4>
            <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
              <Moon size={14} />
              <span>{differenceInCalendarDays(parseISO(booking.checkOut), parseISO(booking.checkIn))} noites</span>
            </div>
          </div>
        </div>

        {/* Controle de Acesso */}
        {(booking.status === 'confirmed' || booking.status === 'pre-booking' || booking.status === 'checked-in' || booking.status === 'overdue-checkout') && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4 text-slate-600">
              <Key size={20} />
              <h3 className="text-lg font-bold">Controle de Acesso</h3>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2.5 rounded-xl", 
                      booking.keyControl?.keysGiven ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-400"
                    )}>
                      <Key size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Chaves do Quarto</p>
                      <p className="text-xs text-slate-500">{booking.keyControl?.keysGiven ? 'Entregues' : 'Não entregues'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const current = booking.keyControl || { 
                        keysGiven: false, 
                        gateControlsGiven: 0, 
                        keysReturned: false, 
                        gateControlsReturned: false 
                      };
                      const updatedKeyControl = { 
                        ...current,
                        keysGiven: !current.keysGiven 
                      };
                      setBookings(bookings.map(b => b.id === booking.id ? { ...b, keyControl: updatedKeyControl } : b));
                    }}
                    className={cn(
                      "px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm",
                      booking.keyControl?.keysGiven 
                        ? "bg-emerald-500 text-white hover:bg-emerald-600" 
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {booking.keyControl?.keysGiven ? 'Cancelar' : 'Marcar Entrega'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2.5 rounded-xl", 
                      (booking.keyControl?.gateControlsGiven || 0) > 0 ? "bg-blue-100 text-blue-600" : "bg-slate-200 text-slate-400"
                    )}>
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Controles do Portão</p>
                      <p className="text-xs text-slate-500">Quantidade: {booking.keyControl?.gateControlsGiven || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        const current = booking.keyControl || { 
                          keysGiven: false, 
                          gateControlsGiven: 0, 
                          keysReturned: false, 
                          gateControlsReturned: false 
                        };
                        if (current.gateControlsGiven > 0) {
                          const updatedKeyControl = { 
                            ...current,
                            gateControlsGiven: current.gateControlsGiven - 1 
                          };
                          setBookings(bookings.map(b => b.id === booking.id ? { ...b, keyControl: updatedKeyControl } : b));
                        }
                      }}
                      className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all shadow-sm"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-6 text-center font-bold text-slate-700 text-lg">{booking.keyControl?.gateControlsGiven || 0}</span>
                    <button 
                      onClick={() => {
                        const current = booking.keyControl || { 
                          keysGiven: false, 
                          gateControlsGiven: 0, 
                          keysReturned: false, 
                          gateControlsReturned: false 
                        };
                        const updatedKeyControl = { 
                          ...current,
                          gateControlsGiven: current.gateControlsGiven + 1 
                        };
                        setBookings(bookings.map(b => b.id === booking.id ? { ...b, keyControl: updatedKeyControl } : b));
                      }}
                      className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all shadow-sm"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quartos */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 text-slate-600">
            <Bed size={20} />
            <h3 className="text-lg font-bold">Quartos</h3>
          </div>
          
          <div className={cn(
            "rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-colors",
            booking.status === 'no-show' ? "bg-rose-50/30" :
            booking.status === 'confirmed' ? "bg-emerald-50/30" :
            booking.status === 'pre-booking' ? "bg-amber-50/30" :
            booking.status === 'checked-in' ? "bg-blue-50/30" :
            booking.status === 'checked-out' ? "bg-slate-50/30" :
            "bg-white"
          )}>
            <div className="p-6 border-b border-slate-100 last:border-0">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <Bed size={16} />
                  <span>{room?.number}</span>
                </div>
                <div className="font-bold text-slate-800">
                  R${(booking.totalPrice || 0).toFixed(2).replace('.', ',')}
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 uppercase text-xs font-bold tracking-wider">Ocupação</span>
                  <span className="text-slate-700">{booking.guests} adultos</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 uppercase text-xs font-bold tracking-wider">Plano Tarifário</span>
                  <span className="text-slate-700">Padrão</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Consumação */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 text-slate-600">
              <Wine size={20} />
              <h3 className="text-lg font-bold">Consumação</h3>
            </div>
            <button 
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-full text-sm font-medium hover:bg-emerald-600 transition-colors"
              onClick={() => {
                setActiveBookingForConsumption(booking);
                handleNavigate('booking-consumption');
              }}
            >
              <Plus size={16} />
              Adicionar
            </button>
          </div>
          
          {booking.consumption && booking.consumption.length > 0 ? (
            <div className={cn(
              "rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-colors",
              booking.status === 'no-show' ? "bg-rose-50/30" :
              booking.status === 'confirmed' ? "bg-emerald-50/30" :
              booking.status === 'pre-booking' ? "bg-amber-50/30" :
              booking.status === 'checked-in' ? "bg-blue-50/30" :
              booking.status === 'checked-out' ? "bg-slate-50/30" :
              "bg-white"
            )}>
              {booking.consumption.map((c, i) => {
                const product = products.find(p => p.id === c.productId);
                return (
                  <div key={c.id} className={cn("p-4 flex justify-between items-center", i !== booking.consumption!.length - 1 && "border-b border-slate-100")}>
                    <div>
                      <div className="font-medium text-slate-800">{product?.name || c.description}</div>
                      <div className="text-sm text-slate-500">{c.quantity || 1}x R${((c.unitPrice || c.amount) || 0).toFixed(2).replace('.', ',')}</div>
                    </div>
                    <div className="font-bold text-slate-800">
                      R${(c.amount || (c.quantity || 1) * (c.unitPrice || 0) || 0).toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center text-slate-500 italic">
              Nenhum consumo.
            </div>
          )}
        </div>

        {/* Pagamentos */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 text-slate-600">
              <CreditCard size={20} />
              <h3 className="text-lg font-bold">Pagamentos</h3>
            </div>
            <button 
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-full text-sm font-medium hover:bg-emerald-600 transition-colors"
              onClick={() => {
                setPaymentBookingId(booking.id);
                setIsAddPaymentModalOpen(true);
              }}
            >
              <Plus size={16} />
              Adicionar
            </button>
          </div>
          
          {bookingTransactions.length > 0 ? (
            <div className="space-y-3">
              {bookingTransactions.map(t => (
                <div key={t.id} className={cn(
                  "rounded-2xl shadow-sm border border-slate-100 p-6 flex justify-between items-center transition-colors",
                  booking.status === 'no-show' ? "bg-rose-50/30" :
                  booking.status === 'confirmed' ? "bg-emerald-50/30" :
                  booking.status === 'pre-booking' ? "bg-amber-50/30" :
                  booking.status === 'checked-in' ? "bg-blue-50/30" :
                  booking.status === 'checked-out' ? "bg-slate-50/30" :
                  "bg-white"
                )}>
                  <div>
                    <div className="font-bold text-slate-800">{t.description}</div>
                    <div className="text-slate-500 text-sm mt-1">{format(parseISO(t.date), 'dd/MM/yyyy')}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="font-bold text-slate-800">R${(t.amount || 0).toFixed(2).replace('.', ',')}</div>
                    <button className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50">
                      <Edit2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center text-slate-500 italic">
              Nenhum pagamento.
            </div>
          )}
        </div>

        {/* Gestão de Depósito */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 text-slate-600">
            <CreditCard size={20} />
            <h3 className="text-lg font-bold">Gestão de Depósito</h3>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-slate-500">Status do Depósito</p>
                <div className="flex items-center gap-2 mt-1">
                  {booking.depositStatus === 'paid' ? (
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      PAGO
                    </span>
                  ) : booking.status === 'cancelled' ? (
                    <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">
                      CANCELADO
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full">
                      PENDENTE
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Valor Sugerido (50%)</p>
                <p className="text-lg font-bold text-slate-800">R$ {((booking.totalPrice || 0) * 0.5).toFixed(2).replace('.', ',')}</p>
              </div>
            </div>

            <div className="space-y-4">
              {booking.depositStatus !== 'paid' && booking.status !== 'cancelled' && (
                <button
                  onClick={() => handleGeneratePaymentLink(booking, booking.totalPrice * 0.5, 'deposit')}
                  className="w-full bg-indigo-600 text-white px-4 py-3 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 font-bold shadow-sm"
                >
                  <LinkIcon size={18} />
                  Gerar Link de Depósito
                </button>
              )}

              {/* Links Gerados */}
              {paymentLinks.filter(l => l.bookingId === booking.id).length > 0 && (
                <div className="space-y-3 mt-6">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Links de Pagamento Gerados</p>
                  {paymentLinks.filter(l => l.bookingId === booking.id).map(link => (
                    <div key={link.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-full",
                          link.status === 'paid' ? "bg-emerald-100 text-emerald-600" : 
                          link.status === 'expired' ? "bg-rose-100 text-rose-600" : "bg-blue-100 text-blue-600"
                        )}>
                          <CreditCard size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            {link.type === 'deposit' ? 'Depósito' : 
                             link.type === 'cancellation_fee' ? 'Taxa de Cancelamento' : 'Pagamento Total'}
                          </p>
                          <p className="text-xs text-slate-500">R$ {(link.amount || 0).toFixed(2).replace('.', ',')} • {link.status === 'paid' ? 'Pago' : 'Pendente'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {link.status === 'active' && (
                          <>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(link.url);
                                toast.success('Link copiado!');
                              }}
                              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors shadow-sm"
                              title="Copiar Link"
                            >
                              <Copy size={16} />
                            </button>
                            <button
                              onClick={() => handleSimulatePayment(link.id)}
                              className="text-xs bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors shadow-sm font-medium"
                            >
                              Simular Pago
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Histórico de alterações */}
        <div className="mb-8">
          <button className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex justify-between items-center text-slate-700 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2">
              <History size={18} className="text-slate-400" />
              <span className="font-medium">Histórico de alterações</span>
            </div>
            <ChevronDown size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Resumo */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Resumo</h3>
              <button className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50">
                <Printer size={16} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">
                  <Bed size={14} />
                  <span>Quartos</span>
                </div>
                <div className="flex justify-between text-sm text-slate-700">
                  <span>{room?.number} ({differenceInCalendarDays(parseISO(booking.checkOut), parseISO(booking.checkIn))} noites)</span>
                  <span className="font-medium">R${(booking.totalPrice || 0).toFixed(2).replace('.', ',')}</span>
                </div>
              </div>

              {booking.consumption && booking.consumption.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">
                    <Wine size={14} />
                    <span>Consumo e Serviços</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-700">
                    <span>Total Consumo</span>
                    <span className="font-medium">R${(consumptionTotal || 0).toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              )}
              
              {bookingTransactions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">
                    <CreditCard size={14} />
                    <span>Pagamentos</span>
                  </div>
                  <div className="space-y-2">
                    {bookingTransactions.map(t => (
                      <div key={t.id} className="flex justify-between text-sm text-emerald-500">
                        <span>{t.description} ({format(parseISO(t.date), 'dd/MM')})</span>
                        <span>- R${(t.amount || 0).toFixed(2).replace('.', ',')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <div className="flex justify-between text-slate-700 font-medium">
                  <span>Total Geral</span>
                  <span>R${(grandTotal || 0).toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-emerald-500 font-medium">
                  <span>Total Pago</span>
                  <span>- R${(totalPaid || 0).toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
              
              <div className={cn(
                "rounded-xl p-4 flex justify-between items-center mt-4",
                balanceDue > 0 ? "bg-rose-50" : "bg-emerald-50"
              )}>
                <span className={cn("font-medium", balanceDue > 0 ? "text-rose-600" : "text-emerald-600")}>
                  {balanceDue > 0 ? 'Total devido' : 'Saldo'}
                </span>
                <span className={cn("text-2xl font-bold", balanceDue > 0 ? "text-rose-800" : "text-emerald-800")}>
                  R${(Math.abs(balanceDue || 0)).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGuestDetails = () => {
    const client = clients.find(c => c.id === selectedClientId);
    if (!client) return null;

    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => handleBack()} 
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ArrowLeft size={24} className="text-slate-600" />
            </button>
            <h2 className="text-3xl font-bold text-slate-800">Ficha do Hóspede</h2>
          </div>
          <button 
            onClick={() => {
              handleNavigate('new-client');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-100 transition-colors"
          >
            <Edit2 size={18} />
            Editar Ficha
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center">
              <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-4xl font-bold mx-auto mb-4">
                {client.name.charAt(0)}
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">{client.name}</h3>
              <p className="text-slate-500 text-sm mb-4">{client.email || 'Sem e-mail cadastrado'}</p>
              
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100">ATIVO</span>
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100">VIP</span>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                <div>
                  <div className="text-2xl font-bold text-slate-800">
                    {bookings.filter(b => b.clientId === client.id).length}
                  </div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Estadias</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-800">
                    R$ {bookings.filter(b => b.clientId === client.id).reduce((acc, b) => acc + b.totalPrice, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Gasto Total</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <FileText size={18} className="text-indigo-600" />
                Anotações
              </h4>
              <textarea 
                id="guest-notes-textarea"
                className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                placeholder="Adicione notas sobre preferências, restrições alimentares, etc..."
                defaultValue={client.notes || ""}
              />
              <button 
                onClick={() => {
                  const notes = (document.getElementById('guest-notes-textarea') as HTMLTextAreaElement).value;
                  setClients(clients.map(c => c.id === client.id ? { ...c, notes } : c));
                  toast.success('Nota salva com sucesso!');
                }}
                className="w-full py-2 bg-slate-100 text-slate-600 font-semibold rounded-lg hover:bg-slate-200 transition-colors text-sm"
              >
                Salvar Nota
              </button>
            </div>
          </div>

          {/* Details & History */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <User size={18} className="text-indigo-600" />
                Informações Pessoais
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Telefone / WhatsApp</label>
                  <div className="text-slate-800 font-medium">{client.phone || '-'}</div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Documento (CPF/Passaporte)</label>
                  <div className="text-slate-800 font-medium">{client.document || '-'}</div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Data de Nascimento</label>
                  <div className="text-slate-800 font-medium">{client.birthDate || '-'}</div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nacionalidade</label>
                  <div className="text-slate-800 font-medium">{client.nationality || 'Brasileira'}</div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Endereço Completo</label>
                  <div className="text-slate-800 font-medium">
                    {client.street ? (
                      `${client.street}${client.number ? `, ${client.number}` : ''}${client.neighborhood ? ` - ${client.neighborhood}` : ''}${client.city ? `, ${client.city}` : ''}${client.state ? ` - ${client.state}` : ''}${client.cep ? `, ${client.cep}` : ''}`
                    ) : (
                      'Endereço não cadastrado'
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <CalendarIcon size={18} className="text-indigo-600" />
                Histórico de Reservas
              </h4>
              
              <div className="space-y-4">
                {bookings.filter(b => b.clientId === client.id).length === 0 ? (
                  <div className="text-center py-8 text-slate-500 italic">Nenhuma reserva encontrada.</div>
                ) : (
                  bookings
                    .filter(b => b.clientId === client.id)
                    .sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime())
                    .map((booking) => (
                      <div 
                        key={booking.id} 
                        onClick={() => {
                          setSelectedBookingId(booking.id);
                          handleNavigate('booking-details');
                        }}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 flex flex-col items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              {format(parseISO(booking.checkIn), 'MMM', { locale: ptBR })}
                            </span>
                            <span className="text-lg font-bold text-slate-700 leading-none">
                              {format(parseISO(booking.checkIn), 'dd')}
                            </span>
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">Reserva #{booking.reservationNumber}</div>
                            <div className="text-sm text-slate-500">
                              Quarto {rooms.find(r => r.id === booking.roomId)?.number || '—'} • {differenceInDays(parseISO(booking.checkOut), parseISO(booking.checkIn))} noites
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-800">R$ {(booking.totalPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                          <div className={cn(
                            "text-[10px] font-bold px-2 py-1 rounded-md inline-block mt-1 uppercase",
                            booking.status === 'checked-out' ? "bg-emerald-50 text-emerald-600" :
                            booking.status === 'cancelled' ? "bg-rose-50 text-rose-600" :
                            "bg-blue-50 text-blue-600"
                          )}>
                            {booking.status === 'checked-out' ? 'CONCLUÍDA' : 
                             booking.status === 'cancelled' ? 'CANCELADA' : 
                             booking.status === 'checked-in' ? 'HOSPEDADO' : 'RESERVADA'}
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBookingList = () => {
    const currentBookings = bookings.filter(b => ['pre-booking', 'confirmed', 'checked-in', 'overdue-checkout'].includes(b.status));
    const pastBookings = bookings.filter(b => ['checked-out', 'cancelled', 'no-show'].includes(b.status));

    const getBookingStatusBadge = (status: Booking['status']) => {
      switch (status) {
        case 'pre-booking':
          return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#fef3c7] text-[#92400e]"><EyeOff size={14} /> Pré-reserva</span>;
        case 'confirmed':
          return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#2563eb] text-white"><CheckSquare size={14} /> Confirmado</span>;
        case 'checked-in':
          return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#0d9488] text-white"><Paperclip size={14} /> Hospedado</span>;
        case 'checked-out':
          return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600"><Lock size={14} /> Finalizado</span>;
        case 'cancelled':
          return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#ea580c] text-white"><XCircle size={14} /> Cancelado</span>;
        case 'no-show':
          return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-500 text-white"><X size={14} /> No-Show</span>;
        case 'overdue-checkout':
          return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-purple-500 text-white"><Clock size={14} /> Atrasado</span>;
        case 'blocked':
          return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-white"><Lock size={14} /> Bloqueado</span>;
        default:
          return null;
      }
    };

    const renderTable = (data: Booking[]) => (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3 text-sm font-bold text-slate-800">Código de reserva</th>
              <th className="px-4 py-3 text-sm font-bold text-blue-600 cursor-pointer hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2">
                  Estado da reserva <ArrowUpDown size={14} />
                </div>
              </th>
              <th className="px-4 py-3 text-sm font-bold text-blue-600 cursor-pointer hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2">
                  Hóspede Principal <ArrowUpDown size={14} />
                </div>
              </th>
              <th className="px-4 py-3 text-sm font-bold text-slate-800">Quartos</th>
              <th className="px-4 py-3 text-sm font-bold text-slate-800">Datas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map(booking => {
              const client = clients.find(c => c.id === booking.clientId);
              const room = rooms.find(r => r.id === booking.roomId);
              const checkInDate = parseISO(booking.checkIn);
              const checkOutDate = parseISO(booking.checkOut);
              const nights = differenceInCalendarDays(checkOutDate, checkInDate);

              return (
                <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4">
                    <button 
                      onClick={() => {
                        setSelectedBookingId(booking.id);
                        handleNavigate('booking-details');
                      }}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {booking.reservationNumber}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    {getBookingStatusBadge(booking.status)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-blue-600">
                      <button 
                        onClick={() => {
                          setSelectedClientId(booking.clientId);
                          handleNavigate('guest-details');
                        }}
                        className="hover:underline"
                      >
                        {client?.name || 'Desconhecido'}
                      </button>
                      <User size={14} className="text-slate-400" />
                      <span className="text-slate-600 text-sm">{booking.guests}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-blue-600">
                    {room?.number || 'N/A'}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-slate-600 text-sm">
                      <CalendarIcon size={14} className="text-slate-400" />
                      <span>{format(checkInDate, "dd MMM", { locale: ptBR })} - {format(checkOutDate, "dd MMM yyyy", { locale: ptBR })}</span>
                      <Moon size={14} className="text-slate-400 ml-2" />
                      <span>{nights}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {data.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Nenhuma reserva encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );

    return (
      <div className="flex flex-col h-full bg-white sm:rounded-2xl shadow-sm border-y sm:border border-slate-200">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl sm:text-3xl font-semibold text-slate-800">
            Reservas
          </h2>
          <div className="flex items-center gap-2 rounded-lg overflow-hidden shadow-sm">
            <button 
              onClick={() => setCurrentView('calendar')}
              className="flex items-center justify-center bg-[#17a2b8] text-white px-4 py-2 text-sm font-medium hover:bg-[#138496] transition-colors"
            >
              <CalendarIcon size={18} />
              <span className="ml-2">Calendário de Reservas</span>
            </button>
            <button 
              onClick={() => {
                resetForm();
                setSelectedBookingId(null);
                setCurrentView('new-booking');
              }}
              className="flex items-center justify-center bg-[#2eca8b] text-white px-4 py-2 text-sm font-medium hover:bg-[#28b079] transition-colors"
            >
              <Plus size={18} />
              <span className="ml-2">Nova Reserva</span>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 flex-1 overflow-auto">
          <div className="space-y-8">
            <section>
              <h3 className="text-xl font-medium text-slate-800 mb-4">Reserva atuais</h3>
              {renderTable(currentBookings)}
            </section>

            <section>
              <h3 className="text-xl font-medium text-slate-800 mb-4">Reservas anteriores</h3>
              {renderTable(pastBookings)}
            </section>
          </div>
        </div>
      </div>
    );
  };

  const renderRatesCalendar = () => {
    return (
      <RatesCalendarView 
        ratePlans={ratePlans}
        dailyRates={dailyRates}
        setDailyRates={setDailyRates}
        setRatePlans={setRatePlans}
        roomCategories={roomCategories}
        rooms={rooms}
        bookings={bookings}
        clients={clients}
        onNavigateToCalendar={() => handleNavigate('calendar')}
      />
    );
  };

  const [roomsColumnWidth, setRoomsColumnWidth] = useState(150);
  const roomsColumnRef = useRef<HTMLTableCellElement>(null);

  useEffect(() => {
    if (roomsColumnRef.current) {
      const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          setRoomsColumnWidth(entry.contentRect.width);
        }
      });
      resizeObserver.observe(roomsColumnRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [isRoomsColumnCollapsed, rooms]);

  const renderCalendar = () => {
    const colWidth = isRoomsColumnCollapsed ? 'w-[32px] min-w-[32px] max-w-[32px]' : 'min-w-[120px] max-w-[250px]';
    return (
      <div className="flex flex-col h-full relative p-2 sm:p-4">
        <div className="flex flex-col bg-white rounded-none sm:rounded-3xl shadow-xl shadow-slate-200/50 border sm:border-slate-100 flex-1 relative overflow-hidden">
      {/* Calendar Header - Only show in full calendar view */}
      {currentView === 'calendar' && (
        <div className="p-4 sm:p-6 pb-4 flex flex-col gap-4 sm:gap-6 relative z-30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 w-full sm:w-auto">
                Mapa de Reservas
              </h2>
              <p className="text-sm font-medium text-slate-400 mt-1">Gestão visual e status de acomodações</p>
            </div>
            
            {/* Desktop Buttons */}
            <div className="hidden sm:flex items-center gap-3">
              <button 
                onClick={() => {
                  closeAllPopovers();
                  setCurrentView('booking-list');
                }}
                className="flex items-center justify-center bg-slate-100 text-slate-700 px-5 py-2.5 rounded-full text-sm font-bold hover:bg-slate-200 transition-colors shadow-sm"
                title="Lista"
              >
                <List size={18} />
                <span className="ml-2">Ver Lista</span>
              </button>
              <button 
                onClick={() => {
                  closeAllPopovers();
                  resetForm();
                  setSelectedBookingId(null);
                  setCurrentView('new-booking');
                }}
                className="flex items-center justify-center bg-indigo-600 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/30"
                title="Nova Reserva"
              >
                <Plus size={18} />
                <span className="ml-2">Nova Reserva</span>
              </button>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center justify-between sm:justify-start gap-3 w-full md:w-auto">
              <div className="flex items-center bg-slate-50 border border-slate-200/60 p-1 rounded-2xl shadow-sm">
                <button 
                  onClick={() => {
                    closeAllPopovers();
                    setCurrentDate(subDays(startOfToday(), 2));
                  }}
                  className="px-5 py-2 text-sm font-bold text-slate-700 hover:bg-white hover:shadow-sm rounded-xl transition-all"
                >
                  Hoje
                </button>
                <div className="w-[1px] h-6 bg-slate-200 mx-1" />
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    closeAllPopovers();
                    setCurrentDate(subDays(currentDate, 7));
                  }}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white hover:shadow-sm rounded-xl transition-all"
                >
                  <ArrowLeft size={18} strokeWidth={2.5} />
                </button>
                <div className="w-[1px] h-6 bg-slate-200 mx-1" />
                <div className="relative flex items-center hover:bg-white hover:shadow-sm rounded-xl transition-all" title="Escolher data">
                  <input 
                    type="date"
                    value={format(currentDate, 'yyyy-MM-dd')}
                    onChange={(e) => {
                      if (e.target.value) setCurrentDate(parseISO(e.target.value));
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  <div className="px-3 py-2 text-slate-500 pointer-events-none">
                    <CalendarIcon size={18} strokeWidth={2.5} />
                  </div>
                </div>
                <div className="w-[1px] h-6 bg-slate-200 mx-1" />
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    closeAllPopovers();
                    setCurrentDate(addDays(currentDate, 7));
                  }}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white hover:shadow-sm rounded-xl transition-all"
                >
                  <ArrowRight size={18} strokeWidth={2.5} />
                </button>
              </div>
              
              {/* Mobile List Button */}
              <button 
                onClick={() => setCurrentView('booking-list')}
                className="sm:hidden flex items-center justify-center bg-slate-100 text-slate-700 w-12 h-12 rounded-2xl shadow-sm hover:bg-slate-200 transition-colors"
                title="Lista"
              >
                <List size={20} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div 
        className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent relative"
        style={{ '--cell-width': '60px' } as React.CSSProperties}
      >
        {/* Touch Drag Ghost */}
        {touchDragInfo && touchDragInfo.isDragging && (
          <div 
            className="fixed z-[50] pointer-events-none opacity-80 shadow-2xl rounded-md border-2 border-indigo-500 bg-white overflow-hidden flex flex-col"
            style={{ 
              left: `${touchDragInfo.currentX - 30}px`, 
              top: `${touchDragInfo.currentY - 20}px`,
              width: '120px',
              height: '40px'
            }}
          >
            <div className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 truncate">
              {clients.find(c => c.id === touchDragInfo.booking.clientId)?.name}
            </div>
            <div className="px-2 py-1 text-[9px] text-slate-500">
              Movendo reserva...
            </div>
          </div>
        )}
        <div className="inline-block min-w-full align-middle relative">
          <table className="border-separate border-spacing-0 table-fixed min-w-max">
            <colgroup>
              <col className={colWidth} />
              {daysInView.map(day => (
                <col key={day.toISOString()} style={{ width: '60px' }} />
              ))}
            </colgroup>
            <thead>
              <tr className="sticky top-0 z-60 bg-slate-100">
                <th 
                  ref={roomsColumnRef}
                  rowSpan={2}
                  className={cn(
                    "sticky left-0 z-70 bg-slate-100 border-b border-r border-slate-400 border-b-slate-200 p-0 align-top transition-all shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]",
                    colWidth
                  )}
                >
                  <div className="flex items-center justify-end p-1 relative z-10">
                    <button 
                      onClick={() => setIsRoomsColumnCollapsed(!isRoomsColumnCollapsed)}
                      className="text-slate-400 hover:text-slate-600 transition-colors bg-white border border-slate-200 rounded-sm p-0.5"
                    >
                      {isRoomsColumnCollapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
                    </button>
                  </div>
                </th>
                {(() => {
                  let currentMonth = '';
                  let colspan = 0;
                  const monthCells = [];
                  
                  daysInView.forEach((day, index) => {
                    const monthStr = format(day, 'MMMM yyyy', { locale: ptBR });
                    if (monthStr !== currentMonth) {
                      if (colspan > 0) {
                        monthCells.push(
                          <th key={`${currentMonth}-${index}`} colSpan={colspan} className="border-b border-r border-slate-400 py-1 text-[10px] sm:text-xs font-medium text-slate-600 capitalize h-[50px] p-0 align-middle bg-slate-100">
                            <div className="flex w-full h-full items-center">
                              <div 
                                className="sticky px-2 whitespace-nowrap transition-all"
                                style={{ left: `${roomsColumnWidth}px` }}
                              >
                                {currentMonth}
                              </div>
                            </div>
                          </th>
                        );
                      }
                      currentMonth = monthStr;
                      colspan = 1;
                    } else {
                      colspan++;
                    }
                    
                    if (index === daysInView.length - 1) {
                      monthCells.push(
                        <th key={`${currentMonth}-end`} colSpan={colspan} className="border-b border-r border-slate-400 py-1 text-[10px] sm:text-xs font-medium text-slate-600 capitalize h-[50px] p-0 align-middle bg-slate-100">
                          <div className="flex w-full h-full items-center">
                            <div 
                              className="sticky px-2 whitespace-nowrap transition-all"
                              style={{ left: `${roomsColumnWidth}px` }}
                            >
                              {currentMonth}
                            </div>
                          </div>
                        </th>
                      );
                    }
                  });
                  
                  return monthCells;
                })()}
              </tr>
              <tr className="sticky top-[50px] z-50 bg-white shadow-[0_4px_10px_-4px_rgba(0,0,0,0.05)]">
                {daysInView.map(day => (
                  <th 
                    key={day.toISOString()} 
                    className={cn(
                      "p-0 border-b border-r border-slate-100 min-w-[60px] w-[60px] h-[55px] text-center transition-colors relative",
                      isToday(day) ? "bg-indigo-50/50" : isWeekend(day) ? "bg-slate-50/50" : "bg-white"
                    )}
                  >
                    {isToday(day) && (
                      <div 
                        className="absolute top-0 bottom-0 w-[2px] rounded-full bg-indigo-500 z-40"
                        style={{ left: `${(currentTime.getHours() * 60 + currentTime.getMinutes()) / (24 * 60) * 100}%` }}
                      />
                    )}
                    {/* Past Shading Overlay */}
                    {(isBefore(day, startOfToday()) || isToday(day)) && (
                      <div 
                        className="absolute top-0 bottom-0 left-0 bg-slate-100/40 pointer-events-none z-0" 
                        style={{ width: isBefore(day, startOfToday()) ? '100%' : '50%' }}
                      />
                    )}
                    <div className="flex flex-col items-center justify-center h-full relative z-20 gap-0.5">
                      <span className={cn("text-[9px] font-bold uppercase tracking-widest leading-none", isToday(day) ? "text-indigo-600" : "text-slate-400")}>{format(day, 'E', { locale: ptBR }).substring(0, 3)}</span>
                      <span className={cn("text-xs font-bold leading-none", isToday(day) ? "text-indigo-700" : "text-slate-700")}>{format(day, 'dd')}</span>
                    </div>
                  </th>
                ))}
              </tr>
              {calendarSuccessMessage && (
                <tr className="sticky top-[100px] z-50">
                  <th className="bg-slate-100 border-r border-slate-400 border-b border-b-slate-200 sticky left-0 z-50 p-0"></th>
                  <th colSpan={daysInView.length} className="bg-[#4ade80] text-white text-left px-2 py-1 text-sm font-medium border-b border-[#4ade80]">
                    <div className="flex items-center gap-1 sticky" style={{ left: `${roomsColumnWidth}px` }}>
                      <ChevronsLeft size={14} />
                      {calendarSuccessMessage}
                    </div>
                  </th>
                </tr>
              )}
            </thead>
            <tbody>
              {categories.map(category => {
                const isCollapsed = collapsedCategories.includes(category);
                return (
                  <React.Fragment key={category}>
                    <tr className="bg-slate-50/50 border-b border-slate-200">
                      <td 
                        className={cn(
                          "sticky left-0 z-50 bg-slate-50/80 backdrop-blur-md px-3 py-2 text-[10px] sm:text-xs font-bold text-slate-700 border-b border-r border-slate-200 cursor-pointer hover:bg-slate-100 transition-all h-[55px] shadow-[2px_0_10px_-2px_rgba(0,0,0,0.05)] uppercase tracking-wider",
                          colWidth
                        )}
                        onClick={() => toggleCategory(category)}
                      >
                        <div className="flex items-center gap-2 whitespace-nowrap relative z-10">
                          {isCollapsed ? <ChevronRight size={16} className="shrink-0 text-slate-400" /> : <ChevronDown size={16} className="shrink-0 text-slate-400" />}
                          {!isRoomsColumnCollapsed && <span>{category}</span>}
                        </div>
                      </td>
                      {daysInView.map(day => {
                        let availableContent = null;
                        if (isCollapsed) {
                          const categoryRooms = rooms.filter(r => r.category === category);
                          const totalRooms = categoryRooms.length;
                          const occupiedRooms = categoryRooms.filter(r => {
                            const dayBookings = getBookingsForRoomAndDay(r.id, day);
                            return dayBookings.some(b => (b.type === 'checkin' || b.type === 'stay') && b.booking.status !== 'cancelled' && b.booking.status !== 'no-show');
                          }).length;
                          const available = totalRooms - occupiedRooms;
                          
                          availableContent = (
                            <div 
                              className={cn(
                                "absolute top-0 bottom-0 left-1/2 w-full flex items-center justify-center text-[10px] font-bold z-10",
                                available > 0 ? "text-emerald-500" : "text-rose-400"
                              )}
                              title={`${available} quarto(s) disponível(is)`}
                            >
                              {available}
                            </div>
                          );
                        }

                        return (
                          <td 
                            key={day.toISOString()} 
                            className={cn(
                              "relative p-0 h-[55px] border-b border-slate-200",
                              isToday(day) ? "bg-indigo-50/30" : isWeekend(day) ? "bg-slate-50/50" : "bg-white"
                            )}
                          >
                            {availableContent}
                            {isToday(day) && (
                              <div 
                                className="absolute top-0 bottom-0 w-[2px] rounded-full bg-indigo-500 z-40"
                                style={{ left: `${(currentTime.getHours() * 60 + currentTime.getMinutes()) / (24 * 60) * 100}%` }}
                              />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                    {!isCollapsed && rooms.filter(r => r.category === category).map(room => (
                      <tr key={room.id} className="group hover:bg-slate-50/50 transition-colors h-[60px]">
                        <td 
                          className={cn(
                            "sticky left-0 z-50 bg-white group-hover:bg-slate-50 px-3 border-b border-r border-slate-100 transition-all h-[60px] shadow-[2px_0_10px_-4px_rgba(0,0,0,0.05)] cursor-pointer",
                            colWidth
                          )}
                          onClick={() => {
                            setSelectedRoomId(room.id);
                            setCurrentView('room-details');
                          }}
                        >
                          <div className="flex items-center gap-2 whitespace-nowrap relative z-10">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-50 border border-slate-100">
                              {room.availability === 'occupied' ? (
                                <User size={12} className="text-blue-500 shrink-0" title="Ocupado" />
                              ) : room.availability === 'reserved' ? (
                                <CalendarIcon size={12} className="text-indigo-500 shrink-0" title="Reservado" />
                              ) : room.availability === 'blocked' ? (
                                <Lock size={12} className="text-amber-500 shrink-0" title="Bloqueado" />
                              ) : room.status === 'maintenance' ? (
                                <X size={12} className="text-rose-500 shrink-0" title="Manutenção" />
                              ) : room.status === 'dirty' ? (
                                <Trash2 size={12} className="text-amber-500 shrink-0" title="Sujo" />
                              ) : room.status === 'cleaning' ? (
                                <Clock size={12} className="text-blue-400 shrink-0" title="Limpando" />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Limpo" />
                              )}
                            </div>
                            {!isRoomsColumnCollapsed && <div className="font-bold text-slate-700 text-[11px] sm:text-xs group-hover:text-indigo-600 transition-colors tracking-tight">{room.number}</div>}
                          </div>
                        </td>
                        {daysInView.map((day, index) => {
                          const dayBookings = getBookingsForRoomAndDay(room.id, day);
                          
                          return (
                            <td 
                              key={day.toISOString()} 
                              data-room-id={room.id}
                              data-day={day.toISOString()}
                              className={cn(
                                "p-0 relative h-[60px] border-b border-r border-slate-100 min-w-[60px] w-[60px] transition-colors",
                                isToday(day) ? "bg-indigo-50/10" : isWeekend(day) ? "bg-slate-50/30" : "bg-white"
                              )}
                              style={{ zIndex: daysInView.length - index }}
                            >
                              {/* Past Shading Overlay */}
                              {(isBefore(day, startOfToday()) || isToday(day)) && (
                                <div 
                                  className="absolute top-0 bottom-0 left-0 bg-slate-50/50 pointer-events-none z-0" 
                                  style={{ width: isBefore(day, startOfToday()) ? '100%' : '50%' }}
                                />
                              )}

                              {/* Selection Overlay */}
                              {calendarSelection?.roomId === room.id && (isSameDay(day, calendarSelection.startDate) || isSameDay(day, calendarSelection.endDate) || (isAfter(day, calendarSelection.startDate) && isBefore(day, calendarSelection.endDate))) && (
                                <div className="absolute top-0 bottom-0 left-1/2 w-full bg-indigo-500/20 border-y-2 border-indigo-500 z-20 pointer-events-none">
                                  {isSameDay(day, calendarSelection.startDate) && <div className="absolute left-0 top-0 bottom-0 border-l-2 border-indigo-500" />}
                                  {isSameDay(day, calendarSelection.endDate) && <div className="absolute right-0 top-0 bottom-0 border-r-2 border-indigo-500" />}
                                </div>
                              )}
                              
                              {/* Drag Over Target */}
                              {dragOverTarget?.roomId === room.id && isSameDay(dragOverTarget.day, day) && (
                                <div className="absolute top-0 bottom-0 left-1/2 w-full bg-indigo-50 ring-2 ring-indigo-400 ring-inset z-40 pointer-events-none" />
                              )}

                              {/* Cell Popover Highlight */}
                              {cellPopover?.roomId === room.id && isSameDay(cellPopover.day, day) && (
                                <div className="absolute top-0 bottom-0 left-1/2 w-full bg-slate-200 z-10 pointer-events-none" />
                              )}
                              
                              {isToday(day) && (
                                <div 
                                  className="absolute top-0 bottom-0 w-[2px] rounded-full bg-indigo-500/50 z-40 pointer-events-none"
                                  style={{ left: `${(currentTime.getHours() * 60 + currentTime.getMinutes()) / (24 * 60) * 100}%` }}
                                />
                              )}

                              {/* Night Interaction Layer */}
                              <div 
                                className="absolute top-0 bottom-0 left-1/2 w-full z-10 group/night flex items-center justify-center cursor-pointer"
                                onDragOver={(e) => handleDragOver(e, room.id, day)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, room.id, day)}
                                onMouseDown={(e) => handleCalendarMouseDown(e, room.id, day)}
                                onMouseEnter={() => handleCalendarMouseEnter(room.id, day)}
                                onMouseUp={handleCalendarMouseUp}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // closeAllPopovers(); // Removed to fix popover closing issue
                                  if (!dayBookings.some(b => (b.type === 'checkin' || b.type === 'stay') && b.booking.status !== 'cancelled' && b.booking.status !== 'no-show')) {
                                    if (!calendarSelection || isSameDay(calendarSelection.startDate, calendarSelection.endDate)) {
                                      setCellPopover({ roomId: room.id, day, x: e.clientX, y: e.clientY });
                                      setSelectedBooking(null);
                                      setCalendarSelection(null);
                                    }
                                  }
                                }}
                              >
                                {!dayBookings.some(b => (b.type === 'checkin' || b.type === 'stay') && b.booking.status !== 'cancelled' && b.booking.status !== 'no-show') && (
                                  <>
                                    <div className="absolute inset-0 group-hover/night:bg-indigo-50/40 transition-colors pointer-events-none" />
                                    <div className="opacity-0 group-hover/night:opacity-100 w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-[0_4px_10px_-2px_rgba(79,70,229,0.3)] pointer-events-none relative z-20 scale-90 group-hover/night:scale-100 transition-all duration-200 border border-indigo-500">
                                      <Plus size={16} strokeWidth={2.5} />
                                    </div>
                                  </>
                                )}
                              </div>

                              {dayBookings.map(({ booking, type }) => {
                                const checkInDate = parseISO(booking.checkIn);
                                const checkOutDate = parseISO(booking.checkOut);
                                
                                // We only render the booking bar on its first visible day in the current view
                                const isFirstVisibleDay = isSameDay(day, checkInDate) || isSameDay(day, daysInView[0]);
                                if (!isFirstVisibleDay) return null;

                                // Calculate how many days the booking spans in the current view
                                const startDate = isSameDay(day, checkInDate) ? checkInDate : daysInView[0];
                                const viewEndDate = daysInView[daysInView.length - 1];
                                const isOverflowing = checkOutDate > viewEndDate;
                                const endDate = isOverflowing ? addDays(viewEndDate, 1) : checkOutDate;
                                
                                const diffDays = differenceInCalendarDays(endDate, startDate);
                                
                                const isActualCheckIn = isSameDay(day, checkInDate);
                                const startOffset = isActualCheckIn ? 30 : 0;
                                
                                // Width calculation:
                                // Base width is diffDays * 60
                                // If it starts in the middle of the first day, subtract 30
                                // If it ends in the middle of the last day (not overflowing), add 30
                                let widthPx = diffDays * 60;
                                if (isActualCheckIn) widthPx -= 30;
                                if (!isOverflowing) widthPx += 30;
                                
                                // Ensure a minimum width for visibility
                                if (widthPx < 20) widthPx = 20;
                                
                                return (
                                  <div 
                                    key={booking.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, booking)}
                                    onDragEnd={() => {
                                      setDragOverTarget(null);
                                      // If we're not confirming a move, clear the dragged booking
                                      if (!isConfirmingMove) {
                                        setDraggedBooking(null);
                                      }
                                    }}
                                    onTouchStart={(e) => handleTouchStart(e, booking)}
                                    onTouchEnd={() => {
                                      if (touchTimer.current) {
                                        clearTimeout(touchTimer.current);
                                        touchTimer.current = null;
                                      }
                                    }}
                                    onMouseEnter={(e) => {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      setHoveredBooking({ booking, rect });
                                    }}
                                    onMouseLeave={() => setHoveredBooking(null)}
                                    className={cn(
                                      "absolute top-[6px] bottom-[6px] z-30 rounded-[10px] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border-l-4 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden whitespace-nowrap select-none",
                                      booking.status === 'blocked' ? "bg-slate-200 opacity-80 border-slate-400" : 
                                      booking.status === 'pre-booking' ? "bg-[#fffbeb] border-amber-400" :
                                      booking.status === 'confirmed' ? "bg-[#ecfdf5] border-emerald-500" :
                                      booking.status === 'checked-in' ? "bg-[#eff6ff] border-blue-500" :
                                      booking.status === 'checked-out' ? "bg-slate-50 border-slate-600" :
                                      booking.status === 'cancelled' ? "bg-red-50 border-red-500" :
                                      booking.status === 'no-show' ? "bg-rose-50 border-rose-500" :
                                      booking.status === 'overdue-checkout' ? "bg-[#f5f3ff] border-purple-600" :
                                      "bg-white border-slate-400",
                                      draggedBooking?.id === booking.id && "opacity-50 grayscale",
                                      touchDragInfo?.booking.id === booking.id && touchDragInfo.isDragging && "opacity-0",
                                      focusedBookingId === booking.id && "ring-2 ring-indigo-500 ring-offset-2 animate-pulse z-50 scale-[1.02]"
                                    )}
                                    style={{ 
                                      left: `${startOffset}px`,
                                      width: `${widthPx}px`,
                                      minWidth: '20px'
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Removed closeAllPopovers to fix popover closing issue
                                      if (hasLongPressed.current) {
                                        hasLongPressed.current = false;
                                        return;
                                      }
                                      handleBookingClick(e, booking);
                                    }}
                                  >
                                    <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] sm:text-[11px] font-bold text-slate-800 bg-white/60 border-b border-black/[0.03]">
                                      <div className={cn(
                                        "w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full shrink-0 flex items-center justify-center text-white shadow-[0_1px_2px_rgba(0,0,0,0.1)]",
                                        booking.status === 'pre-booking' ? "bg-amber-400" : 
                                        booking.status === 'confirmed' ? "bg-emerald-500" : 
                                        booking.status === 'checked-in' ? "bg-blue-500" : 
                                        booking.status === 'checked-out' ? "bg-slate-600" : 
                                        booking.status === 'cancelled' ? "bg-red-500" : 
                                        booking.status === 'no-show' ? "bg-rose-500" :
                                        booking.status === 'overdue-checkout' ? "bg-purple-600" :
                                        booking.status === 'blocked' ? "bg-slate-800" :
                                        "bg-slate-400"
                                      )}>
                                        {booking.status === 'pre-booking' && <CircleOff size={8} />}
                                        {booking.status === 'confirmed' && <Check size={8} />}
                                        {booking.status === 'no-show' && <X size={8} strokeWidth={3} />}
                                        {booking.status === 'overdue-checkout' && <Clock size={8} strokeWidth={3} />}
                                        {booking.status === 'checked-in' && <User size={8} strokeWidth={3} />}
                                        {booking.status === 'checked-out' && <Check size={8} strokeWidth={3} />}
                                        {booking.status === 'cancelled' && <X size={8} strokeWidth={3} />}
                                        {booking.status === 'blocked' && <Lock size={8} strokeWidth={3} />}
                                      </div>
                                      <span className="truncate flex-1 tracking-tight">{booking.status === 'blocked' ? 'Bloqueado' : clients.find(c => c.id === booking.clientId)?.name}</span>
                                      <GripVertical size={12} className="text-slate-300 shrink-0" />
                                    </div>
                                    
                                    {booking.status !== 'blocked' && (
                                      <div className="flex items-center gap-2 px-2 py-0.5 mt-0.5 text-[8px] sm:text-[10px] text-slate-500 font-medium">
                                        <span className="flex items-center gap-0.5" title={`${differenceInCalendarDays(parseISO(booking.checkOut), parseISO(booking.checkIn))} noites`}>
                                          <Moon size={10} className="text-slate-400" />
                                          {differenceInCalendarDays(parseISO(booking.checkOut), parseISO(booking.checkIn))}
                                        </span>
                                        <span className="flex items-center gap-0.5" title={`${booking.guests} hóspedes`}>
                                          <User size={10} className="text-slate-400" />
                                          {booking.guests}
                                        </span>
                                        <span className="flex items-center gap-0.5" title={`Canal: ${booking.channel}`}>
                                          {booking.channel === 'direct' ? <User size={10} className="text-slate-400" /> : <Globe size={10} className="text-indigo-400" />}
                                        </span>
                                        <div className="flex items-center">
                                          <DollarSign size={10} className={cn(
                                            booking.paymentStatus === 'none' ? "text-amber-500" :
                                            booking.paymentStatus === 'partial' ? "text-blue-500" :
                                            booking.paymentStatus === 'full' ? "text-emerald-500" : "text-slate-400"
                                          )} />
                                          {booking.paymentStatus === 'none' && <X size={8} className="text-amber-500 -ml-1" />}
                                        </div>
                                      </div>
                                    )}

                                    {/* Day separators within the booking bar */}
                                    {widthPx > 60 && Array.from({ length: Math.ceil(widthPx / 60) }).map((_, i) => {
                                      const linePos = 30 - startOffset + i * 60;
                                      if (linePos <= 0 || linePos >= widthPx) return null;
                                      return (
                                        <div 
                                          key={i} 
                                          className="absolute top-0 bottom-0 border-r border-slate-200/30 z-0" 
                                          style={{ left: `${linePos}px` }} 
                                        />
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Floating Action Button - Fixed to viewport */}
      <button 
        onClick={() => {
          resetForm();
          setSelectedBookingId(null);
          setCurrentView('new-booking');
        }}
        className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-emerald-700 transition-all active:scale-95 z-[60]"
      >
        <Plus size={28} />
      </button>

      {/* Legend Button - Outside calendar grid on mobile */}
      <div className="mt-4 sm:mt-0 sm:absolute sm:bottom-4 sm:left-4 z-[55] relative">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsLegendOpen(!isLegendOpen);
          }}
          className="bg-slate-500 hover:bg-slate-600 text-white text-xs font-medium px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-2"
        >
          <List size={14} />
          Legenda
        </button>
        
        {/* Legend Tooltip/Popup */}
        {isLegendOpen && (
          <div 
            className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-xl border border-slate-200 p-4 w-64 z-[100]"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Status da Reserva</h4>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-3 text-xs text-slate-700">
                <div className="w-4 h-4 rounded bg-amber-400 flex items-center justify-center text-white"><CircleOff size={10} /></div>
                <span>Pré-reserva</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-700">
                <div className="w-4 h-4 rounded bg-emerald-500 flex items-center justify-center text-white"><Check size={10} /></div>
                <span>Confirmado</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-700">
                <div className="w-4 h-4 rounded bg-blue-500 flex items-center justify-center text-white"><User size={10} /></div>
                <span>Hospedado</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-700">
                <div className="w-4 h-4 rounded bg-slate-600 flex items-center justify-center text-white"><Lock size={10} /></div>
                <span>Finalizado</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-700">
                <div className="w-4 h-4 rounded bg-rose-500 flex items-center justify-center text-white"><X size={10} /></div>
                <span>No-show</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-700">
                <div className="w-4 h-4 rounded bg-purple-600 flex items-center justify-center text-white"><Clock size={10} /></div>
                <span>Check-out Atrasado</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-700">
                <div className="w-4 h-4 rounded bg-slate-800 flex items-center justify-center text-white"><Lock size={10} /></div>
                <span>Bloqueado</span>
              </div>
            </div>
            
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Status do Pagamento</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-xs text-slate-700">
                <div className="relative flex items-center justify-center w-4 h-4">
                  <DollarSign size={14} className="text-amber-500" />
                  <div className="absolute inset-0 flex items-center justify-center"><div className="w-full h-[1px] bg-amber-500 rotate-45" /></div>
                </div>
                <span>Nenhum Pagamento</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-700">
                <DollarSign size={14} className="text-blue-500" />
                <span>Pagamento Parcial</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-700">
                <DollarSign size={14} className="text-emerald-500" />
                <span>Pagamento Completo</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hovered Booking Tooltip */}
      {hoveredBooking && (
        <div 
          className="fixed z-[100] bg-white rounded-xl shadow-xl border border-slate-200 p-4 text-xs pointer-events-none"
          ref={(el) => {
            if (el) {
              const rect = el.getBoundingClientRect();
              const viewportWidth = window.innerWidth;
              const viewportHeight = window.innerHeight;
              
              let left = hoveredBooking.rect.left + hoveredBooking.rect.width / 2;
              let top = hoveredBooking.rect.top - 10;
              let isBelow = false;
              
              // Adjust horizontal position
              if (left - rect.width / 2 < 10) {
                left = rect.width / 2 + 10;
              } else if (left + rect.width / 2 > viewportWidth - 10) {
                left = viewportWidth - rect.width / 2 - 10;
              }
              
              // Adjust vertical position
              if (top - rect.height < 10) {
                // Show below the booking if it doesn't fit above
                top = hoveredBooking.rect.bottom + 10;
                isBelow = true;
              }
              
              el.style.left = `${left}px`;
              el.style.top = `${top}px`;
              el.style.transform = isBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)';
              
              // Adjust arrow
              const arrowUpWhite = el.querySelector('.arrow-up-white') as HTMLElement;
              const arrowUpBorder = el.querySelector('.arrow-up-border') as HTMLElement;
              const arrowDownWhite = el.querySelector('.arrow-down-white') as HTMLElement;
              const arrowDownBorder = el.querySelector('.arrow-down-border') as HTMLElement;
              
              if (arrowUpWhite && arrowUpBorder && arrowDownWhite && arrowDownBorder) {
                if (isBelow) {
                  arrowUpWhite.style.display = 'block';
                  arrowUpBorder.style.display = 'block';
                  arrowDownWhite.style.display = 'none';
                  arrowDownBorder.style.display = 'none';
                } else {
                  arrowUpWhite.style.display = 'none';
                  arrowUpBorder.style.display = 'none';
                  arrowDownWhite.style.display = 'block';
                  arrowDownBorder.style.display = 'block';
                }
              }
            }
          }}
        >
          <div className="space-y-1.5">
            <div className="font-bold text-slate-700">Código De Reserva: <span className="font-normal text-slate-500">{hoveredBooking.booking.id.substring(0, 8).toUpperCase()}</span></div>
            <div className="font-bold text-slate-700 flex items-center gap-1">
              Hóspede: <span className="font-normal text-blue-600">{clients.find(c => c.id === hoveredBooking.booking.clientId)?.name}</span>
              <User size={10} className="text-slate-400 ml-1" />
              <span className="font-normal text-slate-500">{hoveredBooking.booking.guests}</span>
            </div>
            <div className="font-bold text-slate-700 flex items-center gap-1">
              Estado: 
              <span className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1",
                hoveredBooking.booking.status === 'pre-booking' ? "bg-amber-100 text-amber-700" :
                hoveredBooking.booking.status === 'confirmed' ? "bg-emerald-100 text-emerald-700" :
                hoveredBooking.booking.status === 'checked-in' ? "bg-blue-100 text-blue-700" :
                hoveredBooking.booking.status === 'checked-out' ? "bg-slate-100 text-slate-700" :
                hoveredBooking.booking.status === 'cancelled' ? "bg-red-100 text-red-700" :
                hoveredBooking.booking.status === 'no-show' ? "bg-rose-100 text-rose-700" :
                hoveredBooking.booking.status === 'overdue-checkout' ? "bg-purple-100 text-purple-700" :
                "bg-slate-100 text-slate-700"
              )}>
                {hoveredBooking.booking.status === 'pre-booking' && <CircleOff size={8} />}
                {hoveredBooking.booking.status === 'confirmed' && <Check size={8} />}
                {hoveredBooking.booking.status === 'checked-in' && <User size={8} />}
                {hoveredBooking.booking.status === 'checked-out' && <Lock size={8} />}
                {hoveredBooking.booking.status === 'cancelled' && <X size={8} />}
                {hoveredBooking.booking.status === 'no-show' && <X size={8} />}
                {hoveredBooking.booking.status === 'overdue-checkout' && <Clock size={8} />}
                {hoveredBooking.booking.status === 'pre-booking' ? 'Pré-reserva' :
                 hoveredBooking.booking.status === 'confirmed' ? 'Confirmado' :
                 hoveredBooking.booking.status === 'checked-in' ? 'Hospedado' :
                 hoveredBooking.booking.status === 'checked-out' ? 'Finalizado' :
                 hoveredBooking.booking.status === 'cancelled' ? 'Cancelado' :
                 hoveredBooking.booking.status === 'no-show' ? 'No-show' :
                 hoveredBooking.booking.status === 'overdue-checkout' ? 'Check-out Atrasado' : 'Desconhecido'}
              </span>
            </div>
            <div className="font-bold text-slate-700">Data De Check-In: <span className="font-normal text-slate-500">{format(parseISO(hoveredBooking.booking.checkIn), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</span></div>
            <div className="font-bold text-slate-700">Data De Check-Out: <span className="font-normal text-slate-500">{format(parseISO(hoveredBooking.booking.checkOut), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</span></div>
            <div className="font-bold text-slate-700 flex items-center gap-1">
              Duração: <Moon size={10} className="text-slate-400" /> <span className="font-normal text-slate-500">{differenceInCalendarDays(parseISO(hoveredBooking.booking.checkOut), parseISO(hoveredBooking.booking.checkIn))} {differenceInCalendarDays(parseISO(hoveredBooking.booking.checkOut), parseISO(hoveredBooking.booking.checkIn)) === 1 ? 'noite' : 'noites'}</span>
            </div>
            <div className="font-bold text-slate-700">Preço Da Reserva: <span className="font-normal text-slate-500">R${hoveredBooking.booking.totalPrice.toFixed(2).replace('.', ',')}</span></div>
            <div className="font-bold text-slate-700 flex items-center gap-1">
              Total Devido: <span className="font-normal text-slate-500">R${hoveredBooking.booking.totalPrice.toFixed(2).replace('.', ',')}</span>
              <DollarSign size={10} className={cn(
                hoveredBooking.booking.paymentStatus === 'none' ? "text-amber-500" :
                hoveredBooking.booking.paymentStatus === 'partial' ? "text-blue-500" :
                hoveredBooking.booking.paymentStatus === 'full' ? "text-emerald-500" : "text-slate-400"
              )} />
              {hoveredBooking.booking.paymentStatus === 'none' && <X size={8} className="text-amber-500 -ml-1" />}
            </div>
          </div>
          {/* Arrow Down */}
          <div className="arrow-down-white absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white z-10" />
          <div className="arrow-down-border absolute top-full left-1/2 -translate-x-1/2 border-[9px] border-transparent border-t-slate-200 -mt-[1px]" />
          {/* Arrow Up */}
          <div className="arrow-up-white absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-white z-10 hidden" />
          <div className="arrow-up-border absolute bottom-full left-1/2 -translate-x-1/2 border-[9px] border-transparent border-b-slate-200 -mb-[1px] hidden" />
        </div>
      )}

      {/* Calendar Selection Popover */}
      {selectionPopover && calendarSelection && (
        <div 
          className="fixed z-[100] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-200/60 p-1 flex flex-col min-w-[200px] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          style={{ 
            left: `${Math.min(selectionPopover.x, window.innerWidth - 210)}px`, 
            top: `${Math.min(selectionPopover.y, window.innerHeight - 120)}px` 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Período Selecionado</div>
            <div className="text-sm font-bold text-slate-700 mt-0.5">
              {format(calendarSelection.startDate, 'dd/MM')} a {format(calendarSelection.endDate, 'dd/MM')}
            </div>
          </div>
          <div className="p-1">
            <button 
              className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-semibold text-slate-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-left"
              onClick={handleCreateBookingFromSelection}
            >
              <div className="w-6 h-6 rounded-md bg-indigo-100/50 text-indigo-600 flex items-center justify-center shrink-0">
                <Plus size={14} strokeWidth={3} />
              </div>
              <span>Criar Nova Reserva</span>
            </button>
            <button 
              className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-semibold text-slate-700 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors text-left"
              onClick={handleBlockDates}
            >
              <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <Lock size={14} strokeWidth={2.5} />
              </div>
              <span>Bloquear Unidade</span>
            </button>
          </div>
        </div>
      )}

      {/* Cell Popover */}
      {cellPopover && (
        <div 
          className="fixed z-[70] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-200/60 p-1 w-56 animate-in fade-in zoom-in-95 duration-200"
          style={{ 
            left: Math.min(cellPopover.x, window.innerWidth - 230), 
            top: Math.min(cellPopover.y, window.innerHeight - 120) 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            className="w-full px-3 py-2.5 text-left text-sm font-semibold text-slate-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-3 transition-colors"
            onClick={() => {
              resetForm();
              const room = rooms.find(r => r.id === cellPopover.roomId);
              if (room) {
                const checkIn = cellPopover.day;
                const checkOut = addDays(cellPopover.day, 1);
                setBookingCheckIn(checkIn);
                setBookingCheckOut(checkOut);
                const plan = ratePlans.find(p => p.id === getDefaultRatePlanId(room));
                const adults = 2;
                const children = 0;
                const extraAdultFee = adults > (plan?.normalOccupancy || 2) ? (plan?.guestAdjustments?.[adults]?.amount || plan?.guestAdjustments?.[3]?.amount || 0) : 0;
                const extraChildFee = children > (plan?.chargesForChildren ? 0 : 1) ? (plan?.childrenFee || plan?.guestAdjustments?.[3]?.amount || 0) : 0;
                setBookingRooms([{ room, adults, children, extraAdultFee, extraChildFee, ratePlanId: getDefaultRatePlanId(room), price: calculateRoomPrice(room, checkIn, checkOut, getDefaultRatePlanId(room)) }]);
                setSelectedBookingId(null);
                setCurrentView('new-booking');
              }
              setCellPopover(null);
            }}
          >
            <div className="w-6 h-6 rounded-md bg-indigo-100/50 flex items-center justify-center shrink-0">
              <Plus size={14} strokeWidth={3} className="text-indigo-600" />
            </div>
            Nova Reserva Rápida
          </button>
          <button 
            className="w-full px-3 py-2.5 text-left text-sm font-semibold text-slate-700 rounded-lg hover:bg-slate-100 hover:text-slate-900 flex items-center gap-3 transition-colors mt-1"
            onClick={() => {
              const newBlock: Booking = {
                id: Math.random().toString(36).substr(2, 9),
                reservationNumber: `BLK-${Math.floor(Math.random() * 10000)}`,
                roomId: cellPopover.roomId,
                clientId: 'blocked',
                checkIn: cellPopover.day.toISOString(),
                checkOut: addDays(cellPopover.day, 1).toISOString(),
                totalPrice: 0,
                guests: 0,
                status: 'blocked',
                paymentStatus: 'none',
                consumption: [],
                channel: 'direct'
              };
              setBookings([...bookings, newBlock]);
              setCellPopover(null);
            }}
          >
            <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
              <Lock size={14} strokeWidth={2.5} className="text-slate-600" />
            </div>
            Bloquear Unidade
          </button>
        </div>
      )}

      {/* Booking Popup Menu */}
      {selectedBooking && (
        <div 
          className="fixed z-[70] bg-white rounded-xl shadow-2xl border border-slate-200 py-1 w-64 overflow-hidden"
          style={{ 
            left: Math.min(selectedBooking.x, window.innerWidth - 256), 
            top: Math.min(selectedBooking.y, window.innerHeight - 350) 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {selectedBooking.booking.status === 'blocked' ? (
            <button 
              className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
              onClick={() => {
                setBookings(bookings.filter(b => b.id !== selectedBooking.booking.id));
                setSelectedBooking(null);
              }}
            >
              <LockOpen size={16} className="text-slate-400" />
              Desbloquear Datas
            </button>
          ) : (
            <>
              {/* Quick Summary Box */}
              {selectedBooking.booking.status === 'checked-in' && (
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 mb-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resumo da Reserva</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded uppercase">Hospedado</span>
                  </div>
                  
                  {(() => {
                    const bTransactions = transactions.filter(t => t.bookingId === selectedBooking.booking.id);
                    const totalPaid = bTransactions.reduce((sum, t) => sum + t.amount, 0);
                    const consumptionTotal = (selectedBooking.booking.consumption || []).reduce((sum, c) => sum + (c.amount || (c.quantity || 0) * (c.unitPrice || 0)), 0);
                    const grandTotal = selectedBooking.booking.totalPrice + consumptionTotal;
                    const balanceDue = grandTotal - totalPaid;
                    const isFullyPaid = balanceDue <= 0.01;

                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Total:</span>
                          <span className="font-bold text-slate-700">R$ {grandTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Pago:</span>
                          <span className="font-bold text-emerald-600">R$ {totalPaid.toFixed(2)}</span>
                        </div>
                        
                        <div className={cn(
                          "flex justify-between text-xs p-1.5 rounded-lg border",
                          isFullyPaid ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700"
                        )}>
                          <span className="font-medium">{isFullyPaid ? 'Saldo Liquidado' : 'Saldo Pendente:'}</span>
                          <span className="font-bold">R$ {Math.max(0, balanceDue).toFixed(2)}</span>
                        </div>

                        {!isFullyPaid ? (
                          <button 
                            className="w-full mt-2 py-1.5 bg-rose-600 text-white text-[10px] font-bold rounded-lg hover:bg-rose-700 transition-colors flex items-center justify-center gap-1.5"
                            onClick={() => {
                              handleEditBooking(selectedBooking.booking);
                              setSelectedBooking(null);
                            }}
                          >
                            <Edit2 size={12} />
                            RESOLVER PENDÊNCIA (EDITAR)
                          </button>
                        ) : (
                          <div className="pt-2 space-y-2">
                            <div className="flex items-center gap-2">
                              <input 
                                type="checkbox" 
                                id="keys-returned"
                                checked={selectedBooking.booking.keyControl?.keysReturned || false}
                                onChange={(e) => {
                                  const updated = {
                                    ...selectedBooking.booking,
                                    keyControl: {
                                      ...(selectedBooking.booking.keyControl || { keysGiven: true, gateControlsGiven: 1, keysReturned: false, gateControlsReturned: false }),
                                      keysReturned: e.target.checked
                                    }
                                  };
                                  setBookings(bookings.map(b => b.id === selectedBooking.booking.id ? updated : b));
                                  setSelectedBooking({ ...selectedBooking, booking: updated });
                                }}
                                className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <label htmlFor="keys-returned" className="text-[10px] font-medium text-slate-600 cursor-pointer">Chaves devolvidas</label>
                            </div>
                            <div className="flex items-center gap-2">
                              <input 
                                type="checkbox" 
                                id="controls-returned"
                                checked={selectedBooking.booking.keyControl?.gateControlsReturned || false}
                                onChange={(e) => {
                                  const updated = {
                                    ...selectedBooking.booking,
                                    keyControl: {
                                      ...(selectedBooking.booking.keyControl || { keysGiven: true, gateControlsGiven: 1, keysReturned: false, gateControlsReturned: false }),
                                      gateControlsReturned: e.target.checked
                                    }
                                  };
                                  setBookings(bookings.map(b => b.id === selectedBooking.booking.id ? updated : b));
                                  setSelectedBooking({ ...selectedBooking, booking: updated });
                                }}
                                className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <label htmlFor="controls-returned" className="text-[10px] font-medium text-slate-600 cursor-pointer">Controle devolvido</label>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {selectedBooking.booking.status !== 'checked-in' && selectedBooking.booking.status !== 'checked-out' && selectedBooking.booking.status !== 'cancelled' && selectedBooking.booking.status !== 'no-show' && (
                <button 
                  className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                  onClick={() => {
                    if (!isToday(parseISO(selectedBooking.booking.checkIn))) {
                      toast.error('Não é possível realizar check-in em uma reserva que não inicia hoje.');
                      return;
                    }
                    handleEditBooking(selectedBooking.booking);
                    setSelectedBooking(null);
                  }}
                >
                  <PlaneLanding size={16} className="text-slate-400" />
                  Check-in
                </button>
              )}
              {selectedBooking.booking.status === 'checked-in' && (
                <button 
                  className="w-full px-4 py-2.5 text-left text-sm text-emerald-700 hover:bg-emerald-50 flex items-center gap-3 transition-colors font-bold"
                  onClick={() => {
                    const bTransactions = transactions.filter(t => t.bookingId === selectedBooking.booking.id);
                    const totalPaid = bTransactions.reduce((sum, t) => sum + t.amount, 0);
                    const consumptionTotal = (selectedBooking.booking.consumption || []).reduce((sum, c) => sum + (c.amount || (c.quantity || 0) * (c.unitPrice || 0)), 0);
                    const grandTotal = selectedBooking.booking.totalPrice + consumptionTotal;
                    const balanceDue = grandTotal - totalPaid;
                    
                    if (balanceDue > 0.01) {
                      toast.warning('O hóspede possui saldo devedor. Deseja confirmar o check-out mesmo assim?', {
                        action: {
                          label: 'Confirmar Check-out',
                          onClick: () => {
                            updateBookingStatus(selectedBooking.booking.id, 'checked-out');
                            setSelectedBooking(null);
                            toast.success('Check-out realizado com sucesso!');
                          }
                        }
                      });
                    } else {
                      updateBookingStatus(selectedBooking.booking.id, 'checked-out');
                      setSelectedBooking(null);
                      toast.success('Check-out realizado com sucesso!');
                    }
                  }}
                >
                  <PlaneTakeoff size={16} className="text-emerald-500" />
                  Check-out Rápido
                </button>
              )}
              <button 
                className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                onClick={() => {
                  setSelectedBookingId(selectedBooking.booking.id);
                  handleNavigate('booking-details');
                  setSelectedBooking(null);
                }}
              >
                <FileText size={16} className="text-slate-400" />
                Detalhes da Reserva
              </button>
              
              <div className="relative group/submenu">
                <button 
                  className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSubmenuOpen(!isSubmenuOpen);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Edit2 size={16} className="text-slate-400" />
                    Atualizar Reserva
                  </div>
                  <ChevronRight size={16} className={cn("text-slate-400 transition-transform", isSubmenuOpen && "rotate-90 md:rotate-0")} />
                </button>
                <div className={cn(
                  "bg-white transition-all overflow-hidden",
                  // Desktop: absolute positioning, shadow, border
                  "md:absolute md:top-0 md:w-56 md:rounded-lg md:shadow-xl md:border md:border-slate-200 md:py-1",
                  // Mobile: static positioning, no shadow/border, background tint
                  "max-md:static max-md:w-full max-md:bg-slate-50 max-md:border-t max-md:border-slate-100",
                  // Visibility
                  isSubmenuOpen ? "block" : "hidden md:group-hover/submenu:block",
                  // Desktop horizontal alignment
                  selectedBooking.x + 448 > window.innerWidth ? "md:right-full md:mr-1" : "md:left-full md:ml-1"
                )}>
                  <button 
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors pl-8 md:pl-4"
                    onClick={() => {
                      setSelectedBookingId(selectedBooking.booking.id);
                      handleNavigate('booking-details');
                      setSelectedBooking(null);
                      setIsSubmenuOpen(false);
                    }}
                  >
                    <Edit2 size={16} className="text-slate-400" />
                    Atualizar Detalhes
                  </button>
                  <button 
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors pl-8 md:pl-4"
                    onClick={() => {
                      setPaymentBookingId(selectedBooking.booking.id);
                      setIsAddPaymentModalOpen(true);
                      setSelectedBooking(null);
                      setIsSubmenuOpen(false);
                    }}
                  >
                    <CreditCard size={16} className="text-slate-400" />
                    Adicionar Pagamento
                  </button>
                  <button 
                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors pl-8 md:pl-4"
                    onClick={() => {
                      updateBookingStatus(selectedBooking.booking.id, 'cancelled');
                      setSelectedBooking(null);
                      setIsSubmenuOpen(false);
                    }}
                  >
                    <Trash2 size={16} className="text-red-500" />
                    Cancelar Reserva
                  </button>
                </div>
              </div>

              <button 
                className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                onClick={() => {
                  setSelectedClientId(selectedBooking.booking.clientId);
                  handleNavigate('guest-details');
                  setSelectedBooking(null);
                }}
              >
                <User size={16} className="text-slate-400" />
                Detalhes do Hóspede
              </button>
            </>
          )}
        </div>
      )}
    </div>
  </div>
    );
  };

  const renderNewBooking = () => {
    const nights = bookingNights;
    const total = bookingTotal;

    const handleAddRoom = (room: Room) => {
      if (!bookingRooms.find(r => r.room.id === room.id)) {
        const yieldPrice = calculateRoomPrice(
          room,
          bookingCheckIn,
          bookingCheckOut,
          getDefaultRatePlanId(room)
        );
        const plan = ratePlans.find(p => p.id === getDefaultRatePlanId(room));
        const adults = 2;
        const children = 0;
        const extraAdultFee = adults > (plan?.normalOccupancy || 2) ? (plan?.guestAdjustments?.[adults]?.amount || plan?.guestAdjustments?.[3]?.amount || 0) : 0;
        const extraChildFee = children > (plan?.chargesForChildren ? 0 : 1) ? (plan?.childrenFee || plan?.guestAdjustments?.[3]?.amount || 0) : 0;
        setBookingRooms([...bookingRooms, { room, adults, children, extraAdultFee, extraChildFee, ratePlanId: getDefaultRatePlanId(room), price: yieldPrice }]);
        setRoomSelectionMessage(`Quarto ${room.number} selecionado com sucesso!`);
        setIsRoomSearchVisible(false);
        setRoomSearchQuery('');
        
        // Clear message after 3 seconds
        setTimeout(() => setRoomSelectionMessage(null), 3000);
      }
    };

    const handleRemoveRoom = (roomId: string) => {
      const newRooms = bookingRooms.filter(r => r.room.id !== roomId);
      setBookingRooms(newRooms);
      if (newRooms.length === 0) {
        setIsRoomSearchVisible(true);
      }
    };

    const handleUpdateRoomPrice = (roomId: string, price: number) => {
      setBookingRooms(bookingRooms.map(r => r.room.id === roomId ? { ...r, price } : r));
    };

    const availableRooms = rooms.filter(r => {
      // Check if room is already added to the current booking
      if (bookingRooms.find(br => br.room.id === r.id)) return false;
      
      // Check if room matches search query
      const query = roomSearchQuery.trim().toLowerCase();
      if (query && !(r.number.includes(query) || r.category.toLowerCase().includes(query))) return false;

      // Check if room is available for the selected dates
      const checkInDate = addHours(startOfDay(bookingCheckIn), 14);
      const checkOutDate = addHours(startOfDay(bookingCheckOut), 12);
      const isBooked = checkBookingConflict(bookings, r.id, checkInDate, checkOutDate);

      return !isBooked;
    });

    return (
      <div className="max-w-6xl mx-auto h-full overflow-auto pb-20">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => {
              setSelectedBookingId(null);
              setCurrentView('calendar');
            }}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-3xl font-bold text-slate-800">{selectedBookingId ? 'Editar Reserva' : 'Nova Reserva'}</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Guest & Dates */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hóspede Principal</label>
                  <div className="flex gap-2 relative">
                    <div className="relative flex-1">
                      <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Procurar por nome, CPF ou telefone..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-emerald-100 rounded-xl text-sm focus:outline-none focus:border-emerald-400 transition-colors"
                        value={bookingClient ? bookingClient.name : guestSearchQuery}
                        onChange={(e) => {
                          setGuestSearchQuery(e.target.value);
                          if (bookingClient) {
                            setBookingClient(null);
                          }
                        }}
                        onBlur={() => {
                          // Delay clearing so onMouseDown can fire if clicking the dropdown
                          setTimeout(() => setGuestSearchQuery(''), 150);
                        }}
                      />
                      {guestSearchQuery && !bookingClient && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                          {clients.filter(c => 
                            c.name.toLowerCase().includes(guestSearchQuery.toLowerCase()) ||
                            c.document.includes(guestSearchQuery) ||
                            c.phone.includes(guestSearchQuery)
                          ).map(client => (
                            <button
                              key={client.id}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setBookingClient(client);
                                setGuestSearchQuery('');
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                            >
                              <div className="font-medium text-slate-800">{client.name}</div>
                              <div className="text-xs text-slate-500 flex gap-2">
                                <span>{client.document}</span>
                                <span>•</span>
                                <span>{client.phone}</span>
                              </div>
                            </button>
                          ))}
                          <button
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setNewGuestData(prev => ({ ...prev, name: guestSearchQuery }));
                              setIsNewGuestModalOpen(true);
                              setGuestSearchQuery('');
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-emerald-600 font-medium sticky bottom-0 bg-white border-t border-slate-100"
                          >
                            <Plus size={18} />
                            Criar novo hóspede "{guestSearchQuery}"
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {bookingClient && (
                    <button
                      onClick={() => {
                        setSelectedClientId(bookingClient.id);
                        handleNavigate('guest-details');
                      }}
                      className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1"
                    >
                      <FileText size={14} />
                      Completar/Revisar Dados do Hóspede
                    </button>
                  )}
                </div>
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Datas da Estadia</label>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDatePickerOpen(!isDatePickerOpen);
                      if (!isDatePickerOpen) {
                        setSelectingDate('check-in');
                      }
                    }}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-white border-2 border-emerald-100 hover:border-emerald-300 rounded-xl text-sm transition-colors"
                  >
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                      <CalendarIcon size={18} className="text-slate-400" />
                      <span>{format(bookingCheckIn, "dd MMM", { locale: ptBR })} – {format(bookingCheckOut, "dd MMM", { locale: ptBR })}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <Moon size={16} />
                      <span className="font-bold">{nights}</span>
                    </div>
                  </button>

                  {isDatePickerOpen && (
                    <div 
                      className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-4 w-[600px] max-w-[90vw]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800 capitalize">
                          {format(datePickerMonth, 'MMMM yyyy', { locale: ptBR })}
                        </h3>
                        <div className="flex items-center gap-4">
                          <h3 className="text-lg font-bold text-slate-800 capitalize">
                            {format(addMonths(datePickerMonth, 1), 'MMMM yyyy', { locale: ptBR })}
                          </h3>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setDatePickerMonth(subMonths(datePickerMonth, 1))}
                              className="p-1 hover:bg-slate-100 rounded-full text-emerald-600"
                            >
                              <ChevronLeft size={20} />
                            </button>
                            <button 
                              onClick={() => setDatePickerMonth(addMonths(datePickerMonth, 1))}
                              className="p-1 hover:bg-slate-100 rounded-full text-emerald-600"
                            >
                              <ChevronRight size={20} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                        {[0, 1].map(offset => {
                          const month = addMonths(datePickerMonth, offset);
                          const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
                          const startDay = days[0].getDay();
                          
                          return (
                            <div key={offset}>
                              <div className="grid grid-cols-7 mb-2">
                                {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'].map(d => (
                                  <div key={d} className="text-center text-xs font-medium text-slate-500">{d}</div>
                                ))}
                              </div>
                              <div className="grid grid-cols-7 gap-y-2">
                                {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
                                {days.map(day => {
                                  const isSelected = day >= bookingCheckIn && day <= bookingCheckOut;
                                  const isStart = isSameDay(day, bookingCheckIn);
                                  const isEnd = isSameDay(day, bookingCheckOut);
                                  
                                  return (
                                    <button
                                      key={day.toISOString()}
                                      onClick={() => {
                                        if (selectingDate === 'check-in') {
                                          setBookingCheckIn(day);
                                          if (day >= bookingCheckOut) {
                                            setBookingCheckOut(addDays(day, 1));
                                          }
                                          setSelectingDate('check-out');
                                        } else if (selectingDate === 'check-out') {
                                          if (day <= bookingCheckIn) {
                                            setBookingCheckIn(day);
                                            setBookingCheckOut(addDays(day, 1));
                                            setSelectingDate('check-out');
                                          } else {
                                            setBookingCheckOut(day);
                                            setSelectingDate(null);
                                            setIsDatePickerOpen(false);
                                          }
                                        } else {
                                          // Fallback if selectingDate is null
                                          setBookingCheckIn(day);
                                          setSelectingDate('check-out');
                                        }
                                      }}
                                      className={cn(
                                        "h-8 flex items-center justify-center text-sm relative group",
                                        isSelected && !isStart && !isEnd ? "bg-emerald-100 text-emerald-800" : "hover:bg-slate-100",
                                        isStart && "bg-emerald-500 text-white rounded-l-full",
                                        isEnd && "bg-emerald-500 text-white rounded-r-full",
                                        isStart && isEnd && "rounded-full",
                                        !isSelected && "text-slate-700"
                                      )}
                                    >
                                      {isSelected && !isStart && !isEnd && (
                                        <div className="absolute inset-0 bg-emerald-100 -z-10" />
                                      )}
                                      <span className="relative z-10">{format(day, 'd')}</span>
                                      {selectingDate === 'check-out' && isStart && (
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-800 text-white text-[10px] rounded whitespace-nowrap z-50">
                                          Selecionar check-out
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Quartos Disponíveis</label>
                  {!isRoomSearchVisible && (
                    <button 
                      onClick={() => setIsRoomSearchVisible(true)}
                      className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      <Plus size={14} />
                      Adicionar outro quarto
                    </button>
                  )}
                </div>

                {roomSelectionMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-700 text-sm font-medium"
                  >
                    <CheckCircle2 size={18} />
                    {roomSelectionMessage}
                  </motion.div>
                )}

                {isRoomSearchVisible ? (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Procurar quarto por número ou categoria..." 
                      className="w-full pl-10 pr-4 py-3 bg-white border-2 border-emerald-100 rounded-xl text-sm focus:outline-none focus:border-emerald-400 transition-colors"
                      value={roomSearchQuery}
                      onChange={(e) => setRoomSearchQuery(e.target.value)}
                      onFocus={() => {
                        if (!roomSearchQuery) setRoomSearchQuery(' '); // Trigger dropdown
                      }}
                      onBlur={() => {
                        setTimeout(() => setRoomSearchQuery(''), 150);
                      }}
                    />
                    {roomSearchQuery && availableRooms.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-60 overflow-auto">
                        {availableRooms.map(room => (
                          <button
                            key={room.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleAddRoom(room);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 flex justify-between items-center"
                          >
                            <div>
                              <span className="font-bold text-slate-800 mr-2">{room.number}</span>
                              <span className="text-xs text-slate-500">{room.category}</span>
                            </div>
                            <span className="text-emerald-600 font-medium">R$ {(room.price || 0).toFixed(2)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-3 bg-slate-50/50">
                    <p className="text-sm text-slate-500 font-medium">Quarto(s) selecionado(s)</p>
                    <button 
                      onClick={() => setIsRoomSearchVisible(true)}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <Plus size={18} className="text-emerald-500" />
                      Adicionar mais um quarto
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Rooms */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Bed size={18} />
                  Quartos Selecionados ({bookingRooms.length})
                </h3>
                {bookingRooms.length > 0 && (
                  <button 
                    onClick={() => {
                      setBookingRooms([]);
                      setIsRoomSearchVisible(true);
                    }}
                    className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
                  >
                    Remove All
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {bookingRooms.map((item, index) => (
                  <div key={item.room.id} className="bg-emerald-50/50 border border-emerald-100 rounded-2xl overflow-hidden">
                    <div className="p-4 flex items-center justify-between bg-emerald-100/30">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          <Check size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-emerald-700 text-lg">{item.room.number}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-200/50 px-2 py-0.5 rounded-full">
                              {item.room.status === 'clean' ? 'Limpo' : 
                               item.room.status === 'dirty' ? 'Sujo' : 
                               item.room.status === 'cleaning' ? 'Limpando' : 
                               item.room.status === 'inspected' ? 'Inspec.' : 'Manut.'}
                            </span>
                          </div>
                          <span className="text-xs text-emerald-600/80">{item.room.category}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {item.price !== item.room.price && (
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                <TrendingUp size={10} />
                                YIELD
                              </div>
                              <button 
                                onClick={() => handleUpdateRoomPrice(item.room.id, item.room.price)}
                                className="text-[10px] text-slate-400 hover:text-indigo-600 underline"
                              >
                                Resetar para base
                              </button>
                            </div>
                          )}
                          <div className="px-3 py-1 bg-white border border-emerald-200 rounded-full text-sm font-bold text-emerald-700">
                            R${(item.price || 0).toFixed(2)}
                          </div>
                        </div>
                        <button 
                          onClick={() => handleRemoveRoom(item.room.id)}
                          className="text-rose-400 hover:text-rose-600 transition-colors p-1"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-white grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Hóspedes</label>
                        <div className="space-y-2">
                          {/* Adultos */}
                          <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200">
                            <div className="flex items-center gap-2">
                              <Users size={14} className="text-slate-400" />
                              <span className="text-xs font-medium text-slate-700">Adultos</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => {
                                  const newRooms = [...bookingRooms];
                                  newRooms[index].adults = Math.max(1, newRooms[index].adults - 1);
                                  const plan = ratePlans.find(p => p.id === item.ratePlanId);
                                  if (newRooms[index].adults <= (plan?.normalOccupancy || 2)) {
                                    newRooms[index].extraAdultFee = 0;
                                  }
                                  setBookingRooms(newRooms);
                                }}
                                className="w-6 h-6 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-slate-50"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="text-xs font-bold text-slate-800 w-4 text-center">{item.adults}</span>
                              <button 
                                onClick={() => {
                                  const newRooms = [...bookingRooms];
                                  newRooms[index].adults += 1;
                                  const plan = ratePlans.find(p => p.id === item.ratePlanId);
                                  if (newRooms[index].adults > (plan?.normalOccupancy || 2) && newRooms[index].extraAdultFee === 0) {
                                    newRooms[index].extraAdultFee = plan?.guestAdjustments?.[newRooms[index].adults]?.amount || plan?.guestAdjustments?.[3]?.amount || 0;
                                  }
                                  setBookingRooms(newRooms);
                                }}
                                className="w-6 h-6 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-slate-50"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>

                          {/* Crianças */}
                          <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200">
                            <div className="flex items-center gap-2">
                              <Baby size={14} className="text-slate-400" />
                              <span className="text-xs font-medium text-slate-700">Crianças</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => {
                                  const newRooms = [...bookingRooms];
                                  newRooms[index].children = Math.max(0, newRooms[index].children - 1);
                                  const plan = ratePlans.find(p => p.id === item.ratePlanId);
                                  const freeChildren = plan?.chargesForChildren ? 0 : 1;
                                  if (newRooms[index].children <= freeChildren) {
                                    newRooms[index].extraChildFee = 0;
                                  }
                                  setBookingRooms(newRooms);
                                }}
                                className="w-6 h-6 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-slate-50"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="text-xs font-bold text-slate-800 w-4 text-center">{item.children}</span>
                              <button 
                                onClick={() => {
                                  const newRooms = [...bookingRooms];
                                  newRooms[index].children += 1;
                                  const plan = ratePlans.find(p => p.id === item.ratePlanId);
                                  const freeChildren = plan?.chargesForChildren ? 0 : 1;
                                  if (newRooms[index].children > freeChildren && newRooms[index].extraChildFee === 0) {
                                    newRooms[index].extraChildFee = plan?.childrenFee || plan?.guestAdjustments?.[3]?.amount || 0;
                                  }
                                  setBookingRooms(newRooms);
                                }}
                                className="w-6 h-6 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-slate-50"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>

                          {/* Taxas Extras */}
                          {item.adults > (ratePlans.find(p => p.id === item.ratePlanId)?.normalOccupancy || 2) && (
                            <div className="mt-1">
                              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Adicional Adulto Extra</label>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">R$</span>
                                <input 
                                  type="number"
                                  className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-emerald-700 focus:outline-none focus:border-emerald-400 transition-colors"
                                  value={item.extraAdultFee}
                                  onChange={(e) => {
                                    const newRooms = [...bookingRooms];
                                    newRooms[index].extraAdultFee = Number(e.target.value);
                                    setBookingRooms(newRooms);
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {item.children > (ratePlans.find(p => p.id === item.ratePlanId)?.chargesForChildren ? 0 : 1) && (
                            <div className="mt-1">
                              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Adicional Criança Extra</label>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">R$</span>
                                <input 
                                  type="number"
                                  className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-emerald-700 focus:outline-none focus:border-emerald-400 transition-colors"
                                  value={item.extraChildFee}
                                  onChange={(e) => {
                                    const newRooms = [...bookingRooms];
                                    newRooms[index].extraChildFee = Number(e.target.value);
                                    setBookingRooms(newRooms);
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Rate Plan</label>
                        <div className="relative">
                          <select 
                            className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 appearance-none focus:outline-none focus:border-emerald-400"
                            value={item.ratePlanId}
                            onChange={(e) => {
                              const newRooms = [...bookingRooms];
                              const newRatePlanId = e.target.value;
                              newRooms[index].ratePlanId = newRatePlanId;
                              newRooms[index].price = calculateRoomPrice(item.room, bookingCheckIn, bookingCheckOut, newRatePlanId);
                              setBookingRooms(newRooms);
                            }}
                          >
                            {!ratePlans.some(p => p.id === item.ratePlanId) && item.ratePlanId && (
                              <option value={item.ratePlanId}>Plano Excluído</option>
                            )}
                            {ratePlans.filter(p => p.category === item.room.category).map(plan => (
                              <option key={plan.id} value={plan.id}>
                                {plan.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Preço</label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
                            <input 
                              type="number" 
                              value={item.price}
                              onChange={(e) => handleUpdateRoomPrice(item.room.id, Number(e.target.value))}
                              className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:border-emerald-400"
                            />
                          </div>
                          <div className="w-24 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Diária
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {bookingRooms.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm">
                    Nenhum quarto selecionado. Busque e adicione quartos acima.
                  </div>
                )}
              </div>
            </div>

            {/* Additional Details */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6">Detalhes Adicionais</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
                    <UserPlus size={16} />
                    Hóspedes Adicionais
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Procurar..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                      />
                    </div>
                    <button className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors">
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                {/* Controle de Acesso */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4">
                    <Key size={18} />
                    Controle de Acesso
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center shadow-sm">
                          <Key size={20} className="text-slate-600" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">Chaves Entregues</p>
                          <p className="text-xs text-slate-500">Chave do quarto</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={bookingKeyControl.keysGiven}
                          onChange={(e) => setBookingKeyControl(prev => ({ ...prev, keysGiven: e.target.checked }))}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center shadow-sm">
                          <Car size={20} className="text-slate-600" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">Controles de Portão</p>
                          <p className="text-xs text-slate-500">Quantidade entregue</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setBookingKeyControl(prev => ({ ...prev, gateControlsGiven: Math.max(0, prev.gateControlsGiven - 1) }))}
                          className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="font-bold text-slate-800 w-4 text-center">{bookingKeyControl.gateControlsGiven}</span>
                        <button 
                          onClick={() => setBookingKeyControl(prev => ({ ...prev, gateControlsGiven: prev.gateControlsGiven + 1 }))}
                          className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {bookingStatus === 'checked-out' && (bookingKeyControl.keysGiven || bookingKeyControl.gateControlsGiven > 0) && (
                    <div className="mt-6 pt-6 border-t border-slate-100">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Retorno no Check-out</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {bookingKeyControl.keysGiven && (
                          <label className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200 cursor-pointer hover:bg-amber-100/50 transition-colors">
                            <input 
                              type="checkbox" 
                              checked={bookingKeyControl.keysReturned}
                              onChange={(e) => setBookingKeyControl(prev => ({ ...prev, keysReturned: e.target.checked }))}
                              className="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                            />
                            <div className="flex items-center gap-2">
                              <Key size={18} className="text-amber-600" />
                              <span className="text-sm font-bold text-amber-900">Chaves Retornadas</span>
                            </div>
                          </label>
                        )}
                        {bookingKeyControl.gateControlsGiven > 0 && (
                          <label className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200 cursor-pointer hover:bg-amber-100/50 transition-colors">
                            <input 
                              type="checkbox" 
                              checked={bookingKeyControl.gateControlsReturned}
                              onChange={(e) => setBookingKeyControl(prev => ({ ...prev, gateControlsReturned: e.target.checked }))}
                              className="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                            />
                            <div className="flex items-center gap-2">
                              <Car size={18} className="text-amber-600" />
                              <span className="text-sm font-bold text-amber-900">Controles Retornados</span>
                            </div>
                          </label>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
                    <FileText size={16} />
                    Observações da Reserva
                  </label>
                  <textarea 
                    placeholder="Adicione notas ou solicitações especiais em relação a esta reserva..."
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all min-h-[100px] resize-y"
                  />
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <CreditCard size={18} className="text-slate-400" />
                      Pagamento
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isAdvancePayment}
                          onChange={(e) => {
                            setIsAdvancePayment(e.target.checked);
                            if (e.target.checked) setIsSplitPayment(false);
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Adiantamento</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isSplitPayment}
                          onChange={(e) => {
                            setIsSplitPayment(e.target.checked);
                            if (e.target.checked) setIsAdvancePayment(false);
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dividir Pagamento</span>
                      </label>
                    </div>
                  </div>
                  <div className="p-4 space-y-4 bg-white">
                    {isAdvancePayment && !isSplitPayment && (
                      <>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-2">Valor Pago</label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">R$</span>
                              <input 
                                type="number" 
                                min="0"
                                step="0.01"
                                value={prePaymentAmount}
                                onChange={(e) => setPrePaymentAmount(e.target.value)}
                                className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                                placeholder="0.00"
                              />
                              <button 
                                onClick={() => setPrePaymentAmount(total.toFixed(2))}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-colors flex items-center justify-center"
                                title="Pagamento Total"
                              >
                                <DollarSign size={14} />
                              </button>
                            </div>
                            <div className={cn(
                              "px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center whitespace-nowrap",
                              Number(prePaymentAmount) >= total && total > 0 ? "bg-emerald-100 text-emerald-700" : 
                              Number(prePaymentAmount) > 0 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                            )}>
                              {Number(prePaymentAmount) >= total && total > 0 ? 'Integral' : 
                               Number(prePaymentAmount) > 0 ? 'Parcial' : 'Pendente'}
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-2">Método</label>
                          <select
                            value={prePaymentMethod}
                            onChange={(e) => setPrePaymentMethod(e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 bg-white"
                          >
                            <option value="">Selecione um método...</option>
                            {paymentMethods.map(method => (
                              <option key={method} value={method}>{method}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                    
                    {isSplitPayment && (
                      <div className="space-y-3">
                        {splitPayments.map((payment, idx) => (
                          <div key={idx} className="flex gap-2 items-end">
                            <div className="flex-1">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Valor</label>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">R$</span>
                                <input 
                                  type="number"
                                  value={payment.amount}
                                  onChange={(e) => {
                                    const newPayments = [...splitPayments];
                                    newPayments[idx].amount = e.target.value;
                                    setSplitPayments(newPayments);
                                  }}
                                  className="w-full pl-7 pr-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>
                            <div className="flex-1">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Método</label>
                              <select
                                value={payment.method}
                                onChange={(e) => {
                                  const newPayments = [...splitPayments];
                                  newPayments[idx].method = e.target.value;
                                  setSplitPayments(newPayments);
                                }}
                                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 bg-white"
                              >
                                {paymentMethods.map(method => (
                                  <option key={method} value={method}>{method}</option>
                                ))}
                              </select>
                            </div>
                            {splitPayments.length > 1 && (
                              <button 
                                onClick={() => setSplitPayments(splitPayments.filter((_, i) => i !== idx))}
                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <X size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                        <button 
                          onClick={() => setSplitPayments([...splitPayments, { amount: '', method: 'pix' }])}
                          className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:border-emerald-300 hover:text-emerald-600 transition-all flex items-center justify-center gap-2"
                        >
                          <Plus size={14} />
                          Adicionar Método
                        </button>
                      </div>
                    )}
                    
                    <div className="pt-4 border-t border-slate-100">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Valor Restante</span>
                        <span className={cn(
                          "font-bold",
                          (total - (isSplitPayment ? splitPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0) : (isAdvancePayment ? Number(prePaymentAmount) : 0))) <= 0 ? "text-emerald-600" : "text-rose-600"
                        )}>
                          R$ {Math.max(0, total - (isSplitPayment ? splitPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0) : (isAdvancePayment ? Number(prePaymentAmount) : 0))).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 sticky top-6">
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-start justify-between mb-6">
                  <h3 className="font-bold text-slate-800">Resumo da<br/>reserva</h3>
                  <div className="flex flex-col gap-2">
                    <div className="relative">
                      <select 
                        value={bookingStatus}
                        onChange={(e) => {
                          const newStatus = e.target.value as Booking['status'];
                          if (newStatus === 'checked-in' && !isToday(bookingCheckIn)) {
                            toast.error('Não é possível realizar check-in em uma reserva que não inicia hoje.');
                            return;
                          }
                          setBookingStatus(newStatus);
                        }}
                        className={cn(
                          "appearance-none font-bold text-xs px-3 py-1.5 pr-8 rounded-lg focus:outline-none focus:ring-2 w-full",
                          bookingStatus === 'confirmed' ? "bg-emerald-100 text-emerald-800 focus:ring-emerald-500" :
                          bookingStatus === 'checked-in' ? "bg-blue-100 text-blue-800 focus:ring-blue-500" :
                          bookingStatus === 'checked-out' ? "bg-slate-100 text-slate-800 focus:ring-slate-500" :
                          bookingStatus === 'no-show' ? "bg-rose-100 text-rose-800 focus:ring-rose-500" :
                          bookingStatus === 'overdue-checkout' ? "bg-purple-100 text-purple-800 focus:ring-purple-500" :
                          "bg-red-100 text-red-800 focus:ring-red-500"
                        )}
                      >
                        <option value="pre-booking">PRÉ-RESERVA</option>
                        <option value="confirmed">CONFIRMADO</option>
                        <option value="checked-in">HOSPEDADO</option>
                        <option value="checked-out">FINALIZADO</option>
                        <option value="no-show">NO-SHOW</option>
                        <option value="overdue-checkout">CHECK-OUT ATRASADO</option>
                        <option value="cancelled">CANCELADO</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                    </div>
                    
                    <div className="relative">
                      <select 
                        value={bookingPaymentStatus}
                        onChange={(e) => setBookingPaymentStatus(e.target.value as Booking['paymentStatus'])}
                        disabled={Number(prePaymentAmount) > 0}
                        className={cn(
                          "appearance-none font-bold text-xs px-3 py-1.5 pr-8 rounded-lg focus:outline-none focus:ring-2 w-full",
                          Number(prePaymentAmount) > 0 ? "opacity-70 cursor-not-allowed" : "",
                          bookingPaymentStatus === 'none' ? "bg-amber-100 text-amber-800 focus:ring-amber-500" :
                          bookingPaymentStatus === 'partial' ? "bg-blue-100 text-blue-800 focus:ring-blue-500" :
                          "bg-emerald-100 text-emerald-800 focus:ring-emerald-500"
                        )}
                      >
                        <option value="none">NENHUM PAGAMENTO</option>
                        <option value="partial">PAGAMENTO PARCIAL</option>
                        <option value="full">PAGAMENTO COMPLETO</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                    </div>

                    <div className="relative">
                      <select 
                        value={bookingChannel}
                        onChange={(e) => setBookingChannel(e.target.value as Booking['channel'])}
                        className="appearance-none font-bold text-[10px] px-3 py-1.5 pr-8 rounded-lg bg-slate-100 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 w-full uppercase tracking-wider"
                      >
                        <option value="direct">Direto (Balcão)</option>
                        <option value="website">Site do Hotel</option>
                        <option value="booking.com">Booking.com</option>
                        <option value="expedia">Expedia</option>
                        <option value="airbnb">Airbnb</option>
                      </select>
                      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-sm mt-6">
                  <div className="flex justify-between items-center text-slate-500">
                    <span>No. of nights</span>
                    <span className="font-medium text-slate-800">{nights}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Price per night</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs">x</span>
                      <span className="font-medium text-slate-800">{(bookingRooms.reduce((acc, r) => acc + (r.price || 0), 0)).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Total accommodation</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs">=</span>
                      <span className="font-medium text-slate-800">{(bookingRooms.reduce((acc, r) => acc + (r.price || 0), 0) * nights).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Price for meals</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs">+</span>
                      <span className="font-medium text-slate-800">0.00</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Extras</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs">+</span>
                      <span className="font-medium text-slate-800">0.00</span>
                    </div>
                  </div>
                  
                  <div className="border-t border-slate-200 pt-3 mt-3">
                    <div className="flex justify-between items-center font-bold text-slate-800">
                      <span>Total</span>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-normal">=</span>
                        <span>R$ {(total || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-medium">Amount payable</span>
                      <div className="relative w-32">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">R$</span>
                        <input 
                          type="number"
                          value={isSplitPayment ? splitPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0).toFixed(2) : (isAdvancePayment ? prePaymentAmount : '0.00')}
                          readOnly
                          className="w-full pl-7 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-right font-medium text-slate-700 focus:outline-none"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-slate-900 font-bold">Amount due</span>
                      <span className="text-xl font-bold text-slate-900">
                        R$ {Math.max(0, total - (isSplitPayment ? splitPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0) : (isAdvancePayment ? Number(prePaymentAmount) : 0))).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-b-2xl space-y-3">
                {selectedBookingId && (
                  <div className="space-y-2">
                    {isToday(bookingCheckIn) && (bookingStatus === 'pre-booking' || bookingStatus === 'confirmed') && (
                      <button 
                        className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-sm"
                        onClick={() => setBookingStatus('checked-in')}
                      >
                        <PlaneLanding size={20} />
                        Realizar Check-in Agora
                      </button>
                    )}
                    {bookingStatus === 'checked-in' && (
                      <button 
                        className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-sm"
                        onClick={() => {
                          const balance = total - (isSplitPayment ? splitPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0) : (isAdvancePayment ? Number(prePaymentAmount) : 0));
                          if (balance > 0.01) {
                            toast.warning(`Saldo pendente de R$ ${balance.toFixed(2)}. Deseja finalizar mesmo assim?`, {
                              action: {
                                label: 'Finalizar',
                                onClick: () => setBookingStatus('checked-out')
                              }
                            });
                          } else {
                            setBookingStatus('checked-out');
                          }
                        }}
                      >
                        <PlaneTakeoff size={20} />
                        Realizar Check-out Agora
                      </button>
                    )}
                  </div>
                )}

                <button 
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!bookingClient || bookingRooms.length === 0}
                  onClick={() => {
                    if ((bookingStatus === 'checked-in' || bookingStatus === 'checked-out') && !bookingKeyControl.keysGiven && bookingKeyControl.gateControlsGiven === 0) {
                      setBookingError("É obrigatório informar as chaves e controles entregues no momento do check-in/check-out.");
                      return;
                    }

                    if (bookingStatus === 'checked-out') {
                      const missingKeys = bookingKeyControl.keysGiven && !bookingKeyControl.keysReturned;
                      const missingControls = bookingKeyControl.gateControlsGiven > 0 && !bookingKeyControl.gateControlsReturned;
                      if (missingKeys || missingControls) {
                        setBookingError("Atenção: Há itens de controle de acesso não retornados. Por favor, confirme o retorno na seção Controle de Acesso antes de finalizar.");
                        return;
                      }
                    }

                    const checkInDate = addHours(startOfDay(bookingCheckIn), 14);
                    const checkOutDate = addHours(startOfDay(bookingCheckOut), 12);

                    // Check for conflicts for each room
                    for (const item of bookingRooms) {
                      if (checkBookingConflict(bookings, item.room.id, checkInDate, checkOutDate, selectedBookingId || undefined)) {
                        // Find suggestions: other rooms that are available for the same period
                        const suggestions = rooms.filter(r => 
                          r.id !== item.room.id && 
                          !checkBookingConflict(bookings, r.id, checkInDate, checkOutDate, selectedBookingId || undefined)
                        ).slice(0, 3); // Top 3 suggestions

                        setOverbookingConflict({
                          type: 'new',
                          roomId: item.room.id,
                          roomNumber: item.room.number,
                          checkIn: checkInDate,
                          checkOut: checkOutDate,
                          suggestions
                        });
                        setBookingError(`O quarto ${item.room.number} já está reservado para este período.`);
                        return;
                      }
                    }

                    if (selectedBookingId) {
                      // Update existing booking
                      const existingBooking = bookings.find(b => b.id === selectedBookingId);
                      const prePayment = isSplitPayment ? splitPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0) : (isAdvancePayment ? Number(prePaymentAmount) : 0);
                      
                      setBookings(bookings.map(b => b.id === selectedBookingId ? {
                        ...b,
                        clientId: bookingClient!.id,
                        roomId: bookingRooms[0].room.id,
                        checkIn: format(checkInDate, "yyyy-MM-dd'T'HH:mm:ss"),
                        checkOut: format(checkOutDate, "yyyy-MM-dd'T'HH:mm:ss"),
                        totalPrice: total,
                        ratePlanId: bookingRooms[0].ratePlanId,
                        status: bookingStatus,
                        paymentStatus: prePayment >= total ? 'full' : prePayment > 0 ? 'partial' : bookingPaymentStatus,
                        notes: bookingNotes,
                        keyControl: bookingKeyControl,
                        channel: b.channel || 'direct',
                        guests: bookingRooms[0].adults + bookingRooms[0].children,
                        adults: bookingRooms[0].adults,
                        children: bookingRooms[0].children,
                        depositAmount: prePayment,
                        depositStatus: prePayment > 0 ? 'paid' : b.depositStatus
                      } : b));
                      
                      // If pre-payment was added or changed, create a transaction for the difference
                      const previousDeposit = existingBooking?.depositAmount || 0;
                      if (prePayment > previousDeposit) {
                        const diff = prePayment - previousDeposit;
                        const newTransaction: Transaction = {
                          id: Math.random().toString(36).substr(2, 9),
                          type: 'income',
                          category: 'booking',
                          amount: diff,
                          description: `Adiantamento Reserva ${existingBooking?.reservationNumber} - ${prePaymentMethod || 'Não especificado'}`,
                          date: new Date().toISOString(),
                          bookingId: selectedBookingId
                        };
                        setTransactions([...transactions, newTransaction]);
                      }
                      
                      if (bookingStatus === 'checked-out') {
                        setRooms(rooms.map(r => r.id === bookingRooms[0].room.id ? { ...r, status: 'dirty', availability: 'available' } : r));
                      }
                      
                      // Sync to external channels
                      const updatedBooking = bookings.find(b => b.id === selectedBookingId);
                      if (updatedBooking) {
                        setIsSyncing(true);
                        channelSyncService.syncBookingToExternalChannels(updatedBooking).then(() => setIsSyncing(false));
                      }
                    } else {
                      // Create new bookings
                      const prePayment = isSplitPayment ? splitPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0) : (isAdvancePayment ? Number(prePaymentAmount) : 0);
                      const newBookings: Booking[] = bookingRooms.map(item => ({
                        id: Math.random().toString(36).substr(2, 9),
                        reservationNumber: `RES-${format(new Date(), 'yyyyMMdd')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                        roomId: item.room.id,
                        clientId: bookingClient!.id,
                        checkIn: format(checkInDate, "yyyy-MM-dd'T'HH:mm:ss"),
                        checkOut: format(checkOutDate, "yyyy-MM-dd'T'HH:mm:ss"),
                        totalPrice: item.price * nights,
                        ratePlanId: item.ratePlanId,
                        guests: item.adults + item.children,
                        adults: item.adults,
                        children: item.children,
                        status: bookingStatus,
                        paymentStatus: prePayment >= total ? 'full' : prePayment > 0 ? 'partial' : bookingPaymentStatus,
                        channel: bookingChannel,
                        consumption: [],
                        notes: bookingNotes,
                        keyControl: bookingKeyControl,
                        depositAmount: prePayment,
                        depositStatus: prePayment > 0 ? 'paid' : 'pending'
                      }));
                      
                      setBookings([...bookings, ...newBookings]);
                      
                      if (bookingStatus === 'checked-out') {
                        setRooms(rooms.map(r => {
                          if (newBookings.some(b => b.roomId === r.id)) {
                            return { ...r, status: 'dirty', availability: 'available' };
                          }
                          return r;
                        }));
                      }
                      
                      // Sync to external channels
                      setIsSyncing(true);
                      Promise.all(newBookings.map(b => channelSyncService.syncBookingToExternalChannels(b))).then(() => setIsSyncing(false));

                      if (prePayment > 0) {
                        const newTransaction: Transaction = {
                          id: Math.random().toString(36).substr(2, 9),
                          type: 'income',
                          category: 'booking',
                          amount: prePayment,
                          description: `Pré-pagamento Reserva ${newBookings[0].reservationNumber} - ${prePaymentMethod || 'Não especificado'}`,
                          date: new Date().toISOString(),
                          bookingId: newBookings[0].id
                        };
                        setTransactions([...transactions, newTransaction]);
                      }
                    }
                    
                    // Reset state
                    const lastBookingId = selectedBookingId;
                    resetForm();
                    setSelectedBookingId(null);
                    
                    if (lastBookingId) {
                      handleBack();
                    } else {
                      handleNavigate('calendar');
                    }
                  }}
                >
                  <Check size={20} />
                  {selectedBookingId ? 'Atualizar Reserva' : 'Criar Reserva'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* New Guest Modal */}
        {isNewGuestModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-800">Novo Hóspede</h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Nome*</label>
                  <input 
                    type="text" 
                    value={newGuestData.name}
                    onChange={(e) => setNewGuestData({...newGuestData, name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Número de telefone*</label>
                  <div className="flex">
                    <div className="flex items-center justify-center px-3 bg-white border border-r-0 border-slate-200 rounded-l-xl text-sm">
                      🇧🇷 <ChevronDown size={14} className="ml-1 text-slate-400" />
                    </div>
                    <input 
                      type="tel" 
                      required
                      placeholder="(11) 96123-4567"
                      value={newGuestData.phone}
                      onChange={(e) => setNewGuestData({...newGuestData, phone: maskPhone(e.target.value)})}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-r-xl text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">E-mail*</label>
                  <input 
                    type="email" 
                    required
                    value={newGuestData.email}
                    onChange={(e) => setNewGuestData({...newGuestData, email: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Nacionalidade</label>
                  <div className="relative">
                    <select 
                      value={newGuestData.nationality}
                      onChange={(e) => setNewGuestData({...newGuestData, nationality: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:border-emerald-500 transition-colors"
                    >
                      <option value="">---------</option>
                      <option value="BR">Brasil</option>
                      <option value="US">Estados Unidos</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Identificação</label>
                    <div className="relative">
                      <select 
                        value={newGuestData.identificationType}
                        onChange={(e) => setNewGuestData({...newGuestData, identificationType: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:border-emerald-500 transition-colors"
                      >
                        <option value="">---------</option>
                        <option value="CPF">CPF</option>
                        <option value="RG">RG</option>
                        <option value="Passaporte">Passaporte</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Número</label>
                    <input 
                      type="text" 
                      value={newGuestData.identificationNumber}
                      onChange={(e) => setNewGuestData({...newGuestData, identificationNumber: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 pt-2 flex gap-3">
                <button 
                  onClick={() => {
                    if (!newGuestData.name || !newGuestData.email || !newGuestData.phone) {
                      toast.error('Nome, E-mail e Telefone são obrigatórios!');
                      return;
                    }
                    // Here you would typically save the guest to your backend
                    const newClient: Client = {
                      id: Math.random().toString(36).substr(2, 9),
                      name: newGuestData.name,
                      email: newGuestData.email,
                      phone: newGuestData.phone,
                      document: newGuestData.identificationNumber
                    };
                    setClients([...clients, newClient]);
                    setBookingClient(newClient);
                    setIsNewGuestModalOpen(false);
                    setNewGuestData({
                      name: '',
                      phone: '',
                      email: '',
                      nationality: '',
                      identificationType: '',
                      identificationNumber: ''
                    });
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-xl transition-colors"
                >
                  Enviar
                </button>
                <button 
                  onClick={() => setIsNewGuestModalOpen(false)}
                  className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold px-6 py-2.5 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderRooms = () => {
    const filteredRooms = rooms.filter(room => {
      const matchesSearch = roomsSearchFilter ? (
        room.number.toLowerCase().includes(roomsSearchFilter.toLowerCase()) || 
        room.category.toLowerCase().includes(roomsSearchFilter.toLowerCase())
      ) : true;
      const matchesStatus = roomsStatusFilter !== 'all' ? room.status === roomsStatusFilter : true;
      return matchesSearch && matchesStatus;
    });

    return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-3xl font-semibold text-slate-800">Quartos</h2>
        
        {/* Mobile Button Group */}
        <div className="flex sm:hidden rounded-xl overflow-hidden shadow-sm">
          <button 
            onClick={() => setCurrentView('room-categories')}
            className="flex items-center justify-center bg-indigo-600 text-white px-4 py-2.5 hover:bg-indigo-700 transition-colors"
          >
            <Bed size={18} />
          </button>
          <button 
            onClick={() => setCurrentView('bulk-update-rooms')}
            className="flex items-center justify-center bg-indigo-600 border-l border-indigo-500 text-white px-4 py-2.5 hover:bg-indigo-700 transition-colors"
          >
            <Target size={18} />
          </button>
          <button 
            onClick={() => setCurrentView('new-room')}
            className="flex items-center justify-center bg-emerald-600 text-white px-4 py-2.5 hover:bg-emerald-700 transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Desktop Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          <button 
            onClick={() => setCurrentView('room-categories')}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 text-sm font-bold hover:bg-slate-50 transition-colors rounded-xl shadow-sm"
          >
            <Bed size={18} className="text-indigo-600" />
            Categorias
          </button>
          <button 
            onClick={() => setCurrentView('bulk-update-rooms')}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 text-sm font-bold hover:bg-slate-50 transition-colors rounded-xl shadow-sm"
          >
            <Edit2 size={18} className="text-indigo-600" />
            Atualizar todos
          </button>
          <button 
            onClick={() => setCurrentView('new-room')}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 text-sm font-bold hover:bg-indigo-700 transition-colors rounded-xl shadow-sm"
          >
            <Plus size={18} strokeWidth={2.5} />
            Novo Quarto
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
         <div className="relative flex-1">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
           <input 
             type="text"
             placeholder="Buscar quarto por número ou categoria..."
             value={roomsSearchFilter}
             onChange={(e) => setRoomsSearchFilter(e.target.value)}
             className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-700 shadow-sm font-medium"
           />
         </div>
         <select
           value={roomsStatusFilter}
           onChange={(e) => setRoomsStatusFilter(e.target.value)}
           className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-700 shadow-sm font-medium min-w-[200px]"
         >
           <option value="all">Todos os Status</option>
           <option value="clean">Limpos</option>
           <option value="dirty">Sujos</option>
           <option value="cleaning">Limpando</option>
           <option value="inspected">Inspecionados</option>
           <option value="maintenance">Manutenção</option>
         </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredRooms.map(room => (
          <motion.div 
            layout
            key={room.id}
            className={cn(
              "rounded-3xl shadow-sm border overflow-hidden flex flex-col transition-all hover:shadow-md hover:-translate-y-1",
              room.status === 'clean' ? "bg-emerald-50/40 border-emerald-100" : 
              room.status === 'dirty' ? "bg-rose-50/40 border-rose-100" : 
              room.status === 'cleaning' ? "bg-blue-50/40 border-blue-100" :
              room.status === 'inspected' ? "bg-indigo-50/40 border-indigo-100" : "bg-amber-50/40 border-amber-100"
            )}
          >
            <div className="relative aspect-video bg-slate-100 border-b border-slate-100/50 overflow-hidden group">
              {room.photos && room.photos.length > 0 ? (
                <img 
                  src={room.photos[0]} 
                  alt={`Quarto ${room.number}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                  <ImageIcon size={48} strokeWidth={1} />
                </div>
              )}
              {/* Status Badge */}
              <div className="absolute top-3 right-3 z-10">
                <div className={cn(
                  "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white shadow-sm backdrop-blur-md flex items-center gap-1.5",
                  room.status === 'clean' ? "bg-emerald-500/90" : 
                  room.status === 'dirty' ? "bg-rose-500/90" : 
                  room.status === 'cleaning' ? "bg-blue-500/90" :
                  room.status === 'inspected' ? "bg-indigo-500/90" : "bg-amber-500/90"
                )}>
                  {room.status === 'clean' ? 'Limpo' : 
                   room.status === 'dirty' ? 'Sujo' : 
                   room.status === 'cleaning' ? 'Limpando' :
                   room.status === 'inspected' ? 'Inspecionado' : 'Manutenção'}
                </div>
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col gap-4 bg-white/60">
              <div className="flex justify-between items-start gap-3">
                <div className="flex flex-col">
                  <button 
                    onClick={() => { setSelectedRoomId(room.id); setCurrentView('room-details'); }}
                    className="text-2xl font-bold text-slate-800 hover:text-indigo-600 transition-colors text-left"
                  >
                    Quarto {room.number}
                  </button>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">{room.category}</p>
                </div>
                <div className="text-right shrink-0 bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-100">
                  <p className="text-lg font-bold text-slate-900 leading-none">R$ {(room.price || 0).toFixed(2).replace('.', ',')}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 text-right">/ Noite</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-slate-600">
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                  <Bed size={16} className="text-indigo-400" />
                  <span className="text-xs font-bold text-slate-700">{room.doubleBeds || 0}C / {room.singleBeds || 0}S</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                  <CheckSquare size={16} className="text-emerald-400" />
                  <span className="text-xs font-bold text-slate-700">{room.features?.length || 0} Itens</span>
                </div>
              </div>
              
              <div className="mt-auto pt-4 border-t border-slate-200/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    room.availability === 'available' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : 
                    room.availability === 'occupied' ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" :
                    room.availability === 'reserved' ? "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                  )} />
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    room.availability === 'available' ? "text-emerald-700" : 
                    room.availability === 'occupied' ? "text-rose-700" :
                    room.availability === 'reserved' ? "text-indigo-700" : "text-amber-700"
                  )}>
                    {room.availability === 'available' ? 'Disponível' : 
                     room.availability === 'occupied' ? 'Ocupado' :
                     room.availability === 'reserved' ? 'Reservado' : 'Bloqueado'}
                  </span>
                </div>
                
                <button 
                  onClick={() => {
                    resetForm();
                    const checkIn = startOfToday();
                    const checkOut = addDays(checkIn, 1);
                    setBookingCheckIn(checkIn);
                    setBookingCheckOut(checkOut);
                    const plan = ratePlans.find(p => p.id === getDefaultRatePlanId(room));
                    const adults = 2;
                    const children = 0;
                    const extraAdultFee = adults > (plan?.normalOccupancy || 2) ? (plan?.guestAdjustments?.[adults]?.amount || plan?.guestAdjustments?.[3]?.amount || 0) : 0;
                    const extraChildFee = children > (plan?.chargesForChildren ? 0 : 1) ? (plan?.childrenFee || plan?.guestAdjustments?.[3]?.amount || 0) : 0;
                    setBookingRooms([{ room, adults, children, extraAdultFee, extraChildFee, ratePlanId: getDefaultRatePlanId(room), price: calculateRoomPrice(room, checkIn, checkOut, getDefaultRatePlanId(room)) }]);
                    setSelectedBookingId(null);
                    handleNavigate('new-booking');
                  }}
                  className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-2 rounded-xl text-xs font-bold transition-colors"
                >
                  <Plus size={14} strokeWidth={3} />
                  Nova Reserva
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
  };

  const renderRoomCategories = () => (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-3xl font-semibold text-slate-800">Categorias de Quartos</h2>
        <button 
          onClick={() => setCurrentView('new-room-category')}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-emerald-700 transition-colors rounded-xl"
        >
          <Plus size={18} />
          Nova Categoria de Quarto
        </button>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white border-b border-slate-200">
            <tr>
              <th className="p-4 text-sm font-semibold text-blue-600">Nome <span className="text-xs">▲</span></th>
            </tr>
          </thead>
          <tbody>
            {roomCategories.map((category, index) => (
              <tr 
                key={category.id} 
                className={`cursor-pointer hover:bg-slate-100 transition-colors ${index % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}
                onClick={() => {
                  setSelectedRoomCategoryId(category.id);
                  setCurrentView('room-category-details');
                }}
              >
                <td className="p-4 text-sm text-blue-600">{category.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderRoomCategoryDetails = () => {
    const category = roomCategories.find(c => c.id === selectedRoomCategoryId);
    if (!category) return null;
    
    const categoryRooms = rooms.filter(r => r.category === category.name);

    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-4">
              <button onClick={() => setCurrentView('room-categories')} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-slate-600">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Categoria de Quarto</h2>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setCurrentView('update-room-category')}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#17a2b8] text-white font-bold rounded-xl hover:bg-[#138496] transition-all shadow-sm"
              >
                <Edit2 size={18} />
                Atualizar
              </button>
            </div>
          </div>

          <div className="p-8 space-y-8">
            <div className="space-y-4">
              <div className="flex gap-2">
                <span className="font-bold text-slate-700">Nome:</span>
                <span className="text-slate-600">{category.name}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-slate-700">Máximo De Hóspedes:</span>
                <span className="text-slate-600">{category.maxGuests}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-slate-700">Máximo De Adultos:</span>
                <span className="text-slate-600">{category.maxAdults}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-slate-700">Máximo De Crianças:</span>
                <span className="text-slate-600">{category.maxChildren}</span>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-4">Quartos</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-slate-200">
                    <tr>
                      <th className="p-4 text-sm font-semibold text-blue-600">Nome <span className="text-xs">⇅</span></th>
                      <th className="p-4 text-sm font-semibold text-blue-600">Categoria de quarto <span className="text-xs">⇅</span></th>
                      <th className="p-4 text-sm font-semibold text-blue-600">Estado <span className="text-xs">⇅</span></th>
                      <th className="p-4 text-sm font-semibold text-slate-700">Reserva atual</th>
                      <th className="p-4 text-sm font-semibold text-slate-700">Hóspede atual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryRooms.map((room, index) => (
                      <tr key={room.id} className={index % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                        <td className="p-4 text-sm text-blue-600">{room.number}</td>
                        <td className="p-4 text-sm text-blue-600">{room.category}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold text-white ${room.status === 'clean' ? 'bg-emerald-500' : room.status === 'dirty' ? 'bg-rose-500' : 'bg-[#17a2b8]'}`}>
                            {room.status === 'clean' ? <CheckCircle2 size={14} /> : room.status === 'dirty' ? <Trash2 size={14} /> : <User size={14} />}
                            {room.status === 'clean' ? 'Limpo' : room.status === 'dirty' ? 'Sujo' : 'Ocupado'}
                          </span>
                        </td>
                        <td className="p-4"></td>
                        <td className="p-4"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const RoomForm = ({ 
    room, 
    onSave, 
    onCancel, 
    title 
  }: { 
    room?: Room, 
    onSave: (data: Partial<Room>) => void, 
    onCancel: () => void,
    title: string
  }) => {
    const [number, setNumber] = useState(room?.number || '');
    const [category, setCategory] = useState(room?.category || '');
    const [status, setStatus] = useState<RoomStatus>(room?.status || 'clean');
    const [price, setPrice] = useState(room?.price?.toString() || '');
    const [description, setDescription] = useState(room?.description || '');
    const [singleBeds, setSingleBeds] = useState(room?.singleBeds?.toString() || '0');
    const [doubleBeds, setDoubleBeds] = useState(room?.doubleBeds?.toString() || '0');
    const [photos, setPhotos] = useState<string[]>(room?.photos || []);
    const [features, setFeatures] = useState<string[]>(room?.features || []);
    const [newPhotoUrl, setNewPhotoUrl] = useState('');

    const handleAddPhoto = () => {
      if (newPhotoUrl && photos.length < 5) {
        setPhotos([...photos, newPhotoUrl]);
        setNewPhotoUrl('');
      }
    };

    const toggleFeature = (feature: string) => {
      if (features.includes(feature)) {
        setFeatures(features.filter(f => f !== feature));
      } else {
        setFeatures([...features, feature]);
      }
    };

    const handleSave = () => {
      onSave({
        number,
        category,
        status,
        price: parseFloat(price) || 0,
        description,
        singleBeds: parseInt(singleBeds) || 0,
        doubleBeds: parseInt(doubleBeds) || 0,
        photos,
        features
      });
    };

    return (
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <button onClick={onCancel} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-slate-600">
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
          </div>
          {room && (
            <button 
              onClick={() => {
                toast('Tem certeza que deseja excluir este quarto?', {
                  action: {
                    label: 'Excluir',
                    onClick: () => {
                      setRooms(rooms.filter(r => r.id !== room.id));
                      setCurrentView('rooms');
                      toast.success('Quarto excluído com sucesso!');
                    },
                  },
                });
              }}
              className="text-rose-500 hover:text-rose-700 font-bold text-sm flex items-center gap-2 px-4 py-2 hover:bg-rose-50 rounded-xl transition-all"
            >
              <Trash2 size={18} />
              Excluir Quarto
            </button>
          )}
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Número/Nome do Quarto*</label>
                <input 
                  type="text" 
                  value={number}
                  onChange={e => setNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ex: 101"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Preço Diária (R$)*</label>
                <input 
                  type="number" 
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Categoria*</label>
                <select 
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                >
                  <option value="">Selecione...</option>
                  {roomCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Status Inicial*</label>
                <select 
                  value={status}
                  onChange={e => setStatus(e.target.value as RoomStatus)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                >
                  <option value="clean">Limpo</option>
                  <option value="dirty">Sujo</option>
                  <option value="maintenance">Manutenção</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Camas de Casal</label>
                <input 
                  type="number" 
                  value={doubleBeds}
                  onChange={e => setDoubleBeds(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Camas de Solteiro</label>
                <input 
                  type="number" 
                  value={singleBeds}
                  onChange={e => setSingleBeds(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Descrição do Quarto</label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                placeholder="Descreva os detalhes do quarto..."
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-700">Recursos do Quarto</label>
              <div className="flex flex-wrap gap-2">
                {establishment.roomFeatures.map((feature, index) => (
                  <button
                    key={index}
                    onClick={() => toggleFeature(feature)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                      features.includes(feature)
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "bg-white border-slate-200 text-slate-500 hover:border-indigo-300"
                    )}
                  >
                    {feature}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-700">Fotos (Máx 5)</label>
                <span className="text-[10px] font-bold text-slate-400">{photos.length}/5</span>
              </div>
              
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newPhotoUrl}
                  onChange={e => setNewPhotoUrl(e.target.value)}
                  placeholder="URL da imagem..."
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button 
                  onClick={handleAddPhoto}
                  disabled={photos.length >= 5 || !newPhotoUrl}
                  className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 disabled:opacity-50"
                >
                  <Plus size={20} />
                </button>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {photos.map((url, index) => (
                  <div key={index} className="aspect-square rounded-lg overflow-hidden border border-slate-200 relative group">
                    <img src={url} alt={`Room ${index}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <button 
                      onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
                      className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
                {Array.from({ length: 5 - photos.length }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-lg border-2 border-dashed border-slate-100 flex items-center justify-center text-slate-200">
                    <ImageIcon size={20} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-8 py-3 text-slate-600 font-bold hover:bg-slate-200 rounded-2xl transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={!number || !category || !price}
            className="px-10 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 disabled:opacity-50"
          >
            Salvar Quarto
          </button>
        </div>
      </div>
    );
  };

  const renderNewRoom = () => (
    <RoomForm 
      title="Cadastrar Novo Quarto"
      onCancel={() => setCurrentView('rooms')}
      onSave={(data) => {
        const newRoom: Room = {
          id: Math.random().toString(36).substr(2, 9),
          number: data.number!,
          category: data.category!,
          status: data.status!,
          availability: 'available',
          price: data.price!,
          description: data.description,
          singleBeds: data.singleBeds,
          doubleBeds: data.doubleBeds,
          photos: data.photos,
          features: data.features
        };
        setRooms([...rooms, newRoom]);
        setCurrentView('rooms');
      }}
    />
  );

  const renderRoomDetails = () => {
    const room = rooms.find(r => r.id === selectedRoomId);
    if (!room) return null;
    
    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-4">
              <button onClick={() => setCurrentView('rooms')} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-slate-600">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Quarto {room.number}</h2>
                <p className="text-sm text-slate-500">{room.category}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setCurrentView('update-room')}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
              >
                <Edit2 size={18} />
                Editar Quarto
              </button>
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {room.photos && room.photos.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 aspect-video rounded-2xl overflow-hidden border border-slate-200">
                    <img src={room.photos[0]} alt="Room main" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  {room.photos.slice(1).map((url, idx) => (
                    <div key={idx} className="aspect-video rounded-2xl overflow-hidden border border-slate-200">
                      <img src={url} alt={`Room ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800">Descrição</h3>
                <p className="text-slate-600 leading-relaxed">
                  {room.description || "Nenhuma descrição fornecida para este quarto."}
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800">Recursos e Comodidades</h3>
                <div className="flex flex-wrap gap-2">
                  {room.features && room.features.length > 0 ? (
                    room.features.map((feature, idx) => (
                      <span key={idx} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium border border-slate-200">
                        {feature}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 italic">Nenhum recurso cadastrado.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                <h3 className="font-bold text-slate-800">Informações Gerais</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-slate-200/50">
                    <span className="text-sm text-slate-500">Status</span>
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                      room.status === 'clean' ? "bg-emerald-100 text-emerald-700" : 
                      room.status === 'dirty' ? "bg-rose-100 text-rose-700" : 
                      room.status === 'cleaning' ? "bg-blue-100 text-blue-700" :
                      room.status === 'inspected' ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {room.status === 'clean' ? 'Limpo' : 
                       room.status === 'dirty' ? 'Sujo' : 
                       room.status === 'cleaning' ? 'Limpando' :
                       room.status === 'inspected' ? 'Inspecionado' : 'Manutenção'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-200/50">
                    <span className="text-sm text-slate-500">Disponibilidade</span>
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                      room.availability === 'available' ? "bg-emerald-100 text-emerald-700" : 
                      room.availability === 'occupied' ? "bg-indigo-100 text-indigo-700" : 
                      room.availability === 'reserved' ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {room.availability === 'available' ? 'Disponível' : 
                       room.availability === 'occupied' ? 'Ocupado' : 
                       room.availability === 'reserved' ? 'Reservado' : 'Bloqueado'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-200/50">
                    <span className="text-sm text-slate-500">Preço Diária</span>
                    <span className="font-bold text-slate-800">R$ {(room.price || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-4">
                <h3 className="font-bold text-indigo-900">Configuração de Camas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-xl border border-indigo-100 text-center">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase">Casal</p>
                    <p className="text-xl font-bold text-indigo-900">{room.doubleBeds || 0}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-indigo-100 text-center">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase">Solteiro</p>
                    <p className="text-xl font-bold text-indigo-900">{room.singleBeds || 0}</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  resetForm();
                  const checkIn = startOfToday();
                  const checkOut = addDays(checkIn, 1);
                  setBookingCheckIn(checkIn);
                  setBookingCheckOut(checkOut);
                  const plan = ratePlans.find(p => p.id === getDefaultRatePlanId(room));
                  const adults = 2;
                  const children = 0;
                  const extraAdultFee = adults > (plan?.normalOccupancy || 2) ? (plan?.guestAdjustments?.[adults]?.amount || plan?.guestAdjustments?.[3]?.amount || 0) : 0;
                  const extraChildFee = children > (plan?.chargesForChildren ? 0 : 1) ? (plan?.childrenFee || plan?.guestAdjustments?.[3]?.amount || 0) : 0;
                  setBookingRooms([{ room, adults, children, extraAdultFee, extraChildFee, ratePlanId: getDefaultRatePlanId(room), price: calculateRoomPrice(room, checkIn, checkOut, getDefaultRatePlanId(room)) }]);
                  setSelectedBookingId(null);
                  setCurrentView('new-booking');
                }}
                className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Nova Reserva
              </button>
            </div>
          </div>

          <div className="p-8 border-t border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Reservas atuais</h3>
            {(() => {
              const roomBookings = bookings.filter(b => b.roomId === room.id);
              const now = new Date();
              
              const currentBookings = roomBookings.filter(b => {
                if (b.status === 'cancelled' || b.status === 'no-show') return false;
                const checkIn = parseISO(b.checkIn);
                const checkOut = parseISO(b.checkOut);
                return (isBefore(checkIn, now) || isSameDay(checkIn, now)) && (isAfter(checkOut, now) || isSameDay(checkOut, now));
              });

              const pastBookings = roomBookings.filter(b => {
                if (b.status === 'cancelled' || b.status === 'no-show') return true;
                const checkOut = parseISO(b.checkOut);
                return isBefore(checkOut, now) && !isSameDay(checkOut, now);
              });

              const renderBookingTable = (bookingsToRender: Booking[]) => {
                if (bookingsToRender.length === 0) {
                  return <p className="text-slate-500 text-sm">Nenhuma reserva atual.</p>;
                }

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="py-3 px-4 text-sm font-bold text-slate-800">Código de reserva</th>
                          <th className="py-3 px-4 text-sm font-bold text-slate-800">Estado da reserva <ArrowUpDown size={14} className="inline text-blue-600" /></th>
                          <th className="py-3 px-4 text-sm font-bold text-slate-800">Hóspede Principal <ArrowUpDown size={14} className="inline text-blue-600" /></th>
                          <th className="py-3 px-4 text-sm font-bold text-slate-800">Quartos</th>
                          <th className="py-3 px-4 text-sm font-bold text-slate-800">Datas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookingsToRender.map(booking => {
                          const client = clients.find(c => c.id === booking.clientId);
                          const checkIn = parseISO(booking.checkIn);
                          const checkOut = parseISO(booking.checkOut);
                          const nights = differenceInCalendarDays(checkOut, checkIn);
                          const bookingRoomsList = room?.number || '';

                          return (
                            <tr key={booking.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-4">
                                <button 
                                  onClick={() => {
                                    setSelectedBookingId(booking.id);
                                    setCurrentView('booking-details');
                                  }}
                                  className="text-blue-600 hover:underline font-medium"
                                >
                                  {booking.id.substring(0, 8).toUpperCase()}
                                </button>
                              </td>
                              <td className="py-3 px-4">
                                <span className={cn(
                                  "px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 w-fit",
                                  booking.status === 'confirmed' ? "bg-emerald-100 text-emerald-700" :
                                  booking.status === 'pre-booking' ? "bg-amber-100 text-amber-700" :
                                  booking.status === 'checked-in' ? "bg-blue-100 text-blue-700" :
                                  booking.status === 'checked-out' ? "bg-slate-100 text-slate-700" :
                                  "bg-rose-100 text-rose-700"
                                )}>
                                  {booking.status === 'confirmed' && <CheckCircle2 size={12} />}
                                  {booking.status === 'pre-booking' && <Clock size={12} />}
                                  {booking.status === 'checked-in' && <UserCheck size={12} />}
                                  {booking.status === 'checked-out' && <LogOut size={12} />}
                                  {(booking.status === 'cancelled' || booking.status === 'no-show') && <XCircle size={12} />}
                                  {booking.status === 'confirmed' ? 'Confirmada' :
                                   booking.status === 'pre-booking' ? 'Pré-reserva' :
                                   booking.status === 'checked-in' ? 'Check-in' :
                                   booking.status === 'checked-out' ? 'Check-out' :
                                   booking.status === 'cancelled' ? 'Cancelada' : 'No-show'}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                {client ? (
                                  <div className="flex items-center gap-2 text-blue-600">
                                    <span>{client.name}</span>
                                    <span className="text-slate-500 text-xs flex items-center"><User size={12} className="mr-0.5"/> {booking.guests}</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-blue-600">
                                {bookingRoomsList}
                              </td>
                              <td className="py-3 px-4 text-slate-600 text-sm flex items-center gap-2">
                                <CalendarIcon size={14} className="text-slate-400" />
                                {format(checkIn, 'dd MMM', { locale: ptBR })} - {format(checkOut, 'dd MMM yyyy', { locale: ptBR })}
                                <span className="flex items-center gap-1 ml-2 border border-slate-200 rounded px-1.5 py-0.5 text-xs bg-white">
                                  <Moon size={10} /> {nights}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              };

              return (
                <div>
                  {renderBookingTable(currentBookings)}

                  <div className="mt-12">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-slate-800">Reservas anteriores</h3>
                      <button 
                        onClick={() => setShowPastBookings(!showPastBookings)}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        {showPastBookings ? 'Ocultar' : 'Carregar reservas anteriores'}
                      </button>
                    </div>
                    {showPastBookings && (
                      pastBookings.length > 0 ? renderBookingTable(pastBookings) : <p className="text-slate-500 text-sm">Nenhuma reserva anterior encontrada.</p>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    );
  };

  const renderUpdateRoom = () => {
    const room = rooms.find(r => r.id === selectedRoomId);
    if (!room) return null;

    return (
      <RoomForm 
        title={`Editar Quarto ${room.number}`}
        room={room}
        onCancel={() => setCurrentView('room-details')}
        onSave={(data) => {
          setRooms(rooms.map(r => r.id === room.id ? { ...r, ...data } as Room : r));
          setCurrentView('room-details');
        }}
      />
    );
  };

  const renderFinance = () => {
    const today = startOfToday();
    const startOfCurrentMonth = startOfMonth(today);
    const endOfCurrentMonth = endOfMonth(today);

    // 1. Faturamento do Dia (Income transactions today)
    const dailyRevenue = transactions
      .filter(t => t.type === 'income' && isSameDay(parseISO(t.date), today))
      .reduce((acc, t) => acc + t.amount, 0);

    // 2. Faturamento do Mês (Income transactions this month)
    const monthlyRevenue = transactions
      .filter(t => t.type === 'income' && isWithinInterval(parseISO(t.date), { start: startOfCurrentMonth, end: endOfCurrentMonth }))
      .reduce((acc, t) => acc + t.amount, 0);

    // 3. Taxa de Ocupação
    const activeBookingsToday = bookings.filter(b => {
      const checkIn = parseISO(b.checkIn);
      const checkOut = parseISO(b.checkOut);
      return b.status !== 'cancelled' && isWithinInterval(today, { start: checkIn, end: checkOut });
    });
    const occupiedRoomsCount = activeBookingsToday.length;
    const totalRoomsCount = rooms.length;
    const occupancyRate = totalRoomsCount > 0 ? (occupiedRoomsCount / totalRoomsCount) * 100 : 0;

    // 4. ADR (Average Daily Rate) - Total Room Revenue Today / Occupied Rooms
    // We'll estimate room revenue today by (totalPrice / nights) for each active booking
    const roomRevenueToday = activeBookingsToday.reduce((acc, b) => {
      const nights = Math.max(1, differenceInDays(parseISO(b.checkOut), parseISO(b.checkIn)));
      return acc + (b.totalPrice / nights);
    }, 0);
    const adr = occupiedRoomsCount > 0 ? roomRevenueToday / occupiedRoomsCount : 0;

    // 5. RevPAR (Revenue Per Available Room)
    const revPar = totalRoomsCount > 0 ? roomRevenueToday / totalRoomsCount : 0;

    // 6. Contas a Vencer (Pending payments)
    const pendingPayments = bookings.filter(b => b.paymentStatus === 'none' || b.paymentStatus === 'partial');
    const totalPendingAmount = pendingPayments.reduce((acc, b) => {
      // Calculate total paid for this booking from transactions
      const totalPaid = transactions
        .filter(t => t.category === 'booking' && t.description.includes(b.id) && t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const balanceDue = b.totalPrice - totalPaid;
      return acc + Math.max(0, balanceDue); // Ensure we don't add negative balances
    }, 0);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-semibold text-slate-800">Centro de Comando Financeiro</h2>
            <p className="text-slate-500 text-sm">Visão estratégica e métricas de desempenho em tempo real.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2">
              <Filter size={18} />
              Filtrar
            </button>
            <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2">
              <Printer size={18} />
              Relatório
            </button>
          </div>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <TrendingUp size={20} />
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">Hoje</span>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Faturamento Dia</p>
            <h3 className="text-2xl font-bold text-slate-800">R$ {dailyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <CalendarIcon size={20} />
              </div>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">Mês</span>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Faturamento Mês</p>
            <h3 className="text-2xl font-bold text-slate-800">R$ {monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Users size={20} />
              </div>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase">Ocupação</span>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Taxa de Ocupação</p>
            <h3 className="text-2xl font-bold text-slate-800">{(occupancyRate || 0).toFixed(1)}%</h3>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                <AlertCircle size={20} />
              </div>
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full uppercase">Pendentes</span>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Contas a Vencer</p>
            <h3 className="text-2xl font-bold text-slate-800">R$ {totalPendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <DollarSign size={160} />
            </div>
            <div className="relative z-10">
              <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Métricas de Performance (Hoje)</h4>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">ADR (Tarifa Média)</p>
                  <p className="text-3xl font-bold">R$ {adr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <p className="text-emerald-400 text-[10px] mt-1 flex items-center gap-1">
                    <TrendingUp size={10} /> +2.4% vs ontem
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">RevPAR</p>
                  <p className="text-3xl font-bold">R$ {revPar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <p className="text-emerald-400 text-[10px] mt-1 flex items-center gap-1">
                    <TrendingUp size={10} /> +5.1% vs ontem
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="text-slate-800 text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <Clock size={16} className="text-indigo-600" />
              Próximos Recebimentos
            </h4>
            <div className="space-y-3">
              {pendingPayments.slice(0, 3).map(b => {
                const client = clients.find(c => c.id === b.clientId);
                return (
                  <div key={b.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{client?.name || 'Hóspede Desconhecido'}</p>
                      <p className="text-[10px] text-slate-500 uppercase">Check-out: {format(parseISO(b.checkOut), 'dd/MM')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-rose-600">R$ {(b.totalPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <span className="text-[9px] font-bold bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded uppercase">Pendente</span>
                    </div>
                  </div>
                );
              })}
              {pendingPayments.length === 0 && (
                <div className="text-center py-6 text-slate-400 italic text-sm">
                  Nenhuma conta a vencer no momento.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">Fluxo de Caixa</h3>
            <button 
              onClick={() => setIsAddTransactionModalOpen(true)}
              className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              Nova Transação
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descrição</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categoria</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Valor</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600">{format(parseISO(t.date), 'dd/MM/yyyy')}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{t.description}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase">
                        {t.category === 'booking' ? 'Reserva' :
                         t.category === 'staff' ? 'Equipe' :
                         t.category === 'maintenance' ? 'Manutenção' :
                         t.category === 'supplies' ? 'Suprimentos' :
                         t.category === 'service' ? 'Serviço' : 'Outro'}
                      </span>
                    </td>
                    <td className={cn(
                      "px-6 py-4 text-sm font-bold text-right",
                      t.type === 'income' ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {t.type === 'income' ? '+' : '-'} R$ {(t.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => {
                          if (confirm('Deseja realmente excluir esta transação?')) {
                            setTransactions(transactions.filter(trans => trans.id !== t.id));
                            toast.success('Transação excluída!');
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* New Transaction Modal (remains the same) */}
        {isAddTransactionModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">Nova Transação</h3>
                <button onClick={() => setIsAddTransactionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const type = formData.get('type') as 'income' | 'expense';
                const description = formData.get('description') as string;
                const amount = parseFloat(formData.get('amount') as string);
                const category = formData.get('category') as Transaction['category'];
                const date = formData.get('date') as string;

                const newTransaction: Transaction = {
                  id: Math.random().toString(36).substr(2, 9),
                  type,
                  description,
                  amount,
                  category,
                  date
                };

                setTransactions([...transactions, newTransaction]);
                setIsAddTransactionModalOpen(false);
                toast.success('Transação registrada com sucesso!');
              }}>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <label className="relative flex items-center justify-center p-3 border-2 border-slate-100 rounded-xl cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50 group">
                      <input type="radio" name="type" value="income" defaultChecked className="sr-only" />
                      <div className="flex flex-col items-center gap-1">
                        <TrendingUp size={20} className="text-slate-400 group-has-[:checked]:text-emerald-600" />
                        <span className="text-xs font-bold text-slate-500 group-has-[:checked]:text-emerald-700 uppercase">Entrada</span>
                      </div>
                    </label>
                    <label className="relative flex items-center justify-center p-3 border-2 border-slate-100 rounded-xl cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-rose-500 has-[:checked]:bg-rose-50 group">
                      <input type="radio" name="type" value="expense" className="sr-only" />
                      <div className="flex flex-col items-center gap-1">
                        <TrendingUp size={20} className="text-slate-400 group-has-[:checked]:text-rose-600 rotate-180" />
                        <span className="text-xs font-bold text-slate-500 group-has-[:checked]:text-rose-700 uppercase">Saída</span>
                      </div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
                    <input 
                      name="description"
                      type="text" 
                      required
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Ex: Pagamento Fornecedor, Reserva #123"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Valor (R$)</label>
                      <input 
                        name="amount"
                        type="number" 
                        step="0.01"
                        required
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="0,00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Data</label>
                      <input 
                        name="date"
                        type="date" 
                        required
                        defaultValue={format(new Date(), 'yyyy-MM-dd')}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Categoria</label>
                    <select 
                      name="category"
                      required
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                      <option value="other">Outro</option>
                      <option value="booking">Reserva</option>
                      <option value="staff">Equipe</option>
                      <option value="maintenance">Manutenção</option>
                      <option value="supplies">Suprimentos</option>
                      <option value="service">Serviço</option>
                    </select>
                  </div>
                </div>
                <div className="p-6 bg-slate-50 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsAddTransactionModalOpen(false)}
                    className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    Salvar Transação
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    );
  };

  const renderClients = () => (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-semibold text-slate-800">Hóspedes</h2>
        <button 
          onClick={() => {
            setSelectedClientId(null);
            setCurrentView('new-client');
          }}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Novo Hóspede
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-6 py-4 text-left text-sm font-bold text-blue-600">
                  <div className="flex items-center gap-2 cursor-pointer">
                    Nome <ChevronUp size={14} />
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-blue-600">
                  <div className="flex items-center gap-2 cursor-pointer">
                    E-mail <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-blue-600">
                  <div className="flex items-center gap-2 cursor-pointer">
                    Número de telefone <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-blue-600">
                  <div className="flex items-center gap-2 cursor-pointer">
                    Data de nascimento <ArrowUpDown size={14} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.map((client, index) => (
                <tr key={client.id} className={index % 2 === 0 ? "bg-slate-50/50" : "bg-white"}>
                  <td 
                    className="px-6 py-4 text-sm text-blue-600 cursor-pointer hover:underline"
                    onClick={() => {
                      setSelectedClientId(client.id);
                      setCurrentView('guest-details');
                    }}
                  >
                    {client.name}
                  </td>
                  <td 
                    className="px-6 py-4 text-sm text-blue-600 cursor-pointer hover:underline"
                    onClick={() => {
                      setSelectedClientId(client.id);
                      setCurrentView('guest-details');
                    }}
                  >
                    {client.email || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{client.phone || '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{client.birthDate || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const maskPhone = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length <= 10) {
      return cleanValue
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return cleanValue
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 15);
  };

  const renderNewClient = () => {
    const client = clients.find(c => c.id === selectedClientId);
    
    const handleCepLookup = async (cep: string) => {
      const cleanCep = cep.replace(/\D/g, '');
      if (cleanCep.length === 8) {
        try {
          const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
          const data = await response.json();
          if (!data.erro) {
            const streetInput = document.getElementsByName('street')[0] as HTMLInputElement;
            const neighborhoodInput = document.getElementsByName('neighborhood')[0] as HTMLInputElement;
            const cityInput = document.getElementsByName('city')[0] as HTMLInputElement;
            const stateInput = document.getElementsByName('state')[0] as HTMLInputElement;
            
            if (streetInput) streetInput.value = data.logradouro;
            if (neighborhoodInput) neighborhoodInput.value = data.bairro;
            if (cityInput) cityInput.value = data.localidade;
            if (stateInput) stateInput.value = data.uf;
          }
        } catch (error) {
          console.error('Erro ao buscar CEP:', error);
        }
      }
    };

    return (
      <div className="flex flex-col gap-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => handleBack(client ? 'guest-details' : 'clients')}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-3xl font-semibold text-slate-800">
            {client ? 'Editar Hóspede' : 'Novo Hóspede'}
          </h2>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <form className="space-y-8" onSubmit={(e) => { 
            e.preventDefault(); 
            const formData = new FormData(e.currentTarget);
            const name = formData.get('name') as string;
            const email = formData.get('email') as string;
            const phone = formData.get('phone') as string;
            const document = formData.get('document') as string;
            const birthDate = formData.get('birthDate') as string;
            const nationality = formData.get('nationality') as string;
            const notes = formData.get('notes') as string;
            const cep = formData.get('cep') as string;
            const street = formData.get('street') as string;
            const number = formData.get('number') as string;
            const neighborhood = formData.get('neighborhood') as string;
            const city = formData.get('city') as string;
            const state = formData.get('state') as string;

            const updatedClientData = {
              name, 
              email, 
              phone, 
              document, 
              birthDate, 
              nationality,
              notes,
              cep,
              street,
              number,
              neighborhood,
              city,
              state
            };

            if (client) {
              setClients(clients.map(c => c.id === client.id ? { 
                ...c, 
                ...updatedClientData
              } : c));
              toast.success('Hóspede atualizado!');
              handleBack('guest-details');
            } else {
              const newClient: Client = {
                id: Math.random().toString(36).substr(2, 9),
                ...updatedClientData
              };
              setClients([...clients, newClient]);
              toast.success('Hóspede cadastrado!');
              handleBack('clients');
            }
          }}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Nome*</label>
                <input 
                  name="name"
                  type="text" 
                  required
                  defaultValue={client?.name}
                  className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">E-mail*</label>
                  <input 
                    name="email"
                    type="email" 
                    required
                    defaultValue={client?.email}
                    className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">Data de nascimento</label>
                  <input 
                    name="birthDate"
                    type="text" 
                    placeholder="DD/MM/AAAA"
                    defaultValue={client?.birthDate}
                    className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Nacionalidade</label>
                <div className="relative">
                  <select 
                    name="nationality"
                    defaultValue={client?.nationality || 'br'}
                    className="w-full border border-slate-300 rounded-lg p-3 appearance-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="">---------</option>
                    <option value="alemanha">Alemanha</option>
                    <option value="andorra">Andorra</option>
                    <option value="angola">Angola</option>
                    <option value="anguilla">Anguilla</option>
                    <option value="antartica">Antártica</option>
                    <option value="antigua">Antígua e Barbuda</option>
                    <option value="arabia">Arábia Saudita</option>
                    <option value="argelia">Argélia</option>
                    <option value="argentina">Argentina</option>
                    <option value="armenia">Armênia</option>
                    <option value="aruba">Aruba</option>
                    <option value="australia">Austrália</option>
                    <option value="austria">Áustria</option>
                    <option value="br">Brasil</option>
                    <option value="us">Estados Unidos</option>
                    <option value="pt">Portugal</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">Identificação</label>
                  <div className="relative">
                    <select 
                      name="identificationType"
                      defaultValue={client?.identificationType}
                      className="w-full border border-slate-300 rounded-lg p-3 appearance-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                      <option value="">---------</option>
                      <option value="rg">Carteira de Identidade</option>
                      <option value="cnh">Carteira de Motorista</option>
                      <option value="passport">Passaporte</option>
                      <option value="cpf">CPF</option>
                      <option value="cnpj">CNPJ</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">Número</label>
                  <input 
                    name="document"
                    type="text" 
                    defaultValue={client?.document}
                    className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 space-y-6">
              <h3 className="text-xl font-semibold text-slate-800">Contato e Endereço</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">Número de telefone*</label>
                  <div className="flex border border-slate-300 rounded-lg overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                    <div className="flex items-center gap-1 px-3 bg-slate-50 border-r border-slate-300">
                      <span className="text-lg">🇧🇷</span>
                      <ChevronDown size={14} className="text-slate-500" />
                    </div>
                    <input 
                      name="phone"
                      type="text" 
                      required
                      placeholder="(11) 96123-4567"
                      defaultValue={client?.phone}
                      onChange={(e) => {
                        e.target.value = maskPhone(e.target.value);
                      }}
                      className="flex-1 p-3 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">CEP</label>
                  <input 
                    name="cep"
                    type="text" 
                    placeholder="00000-000"
                    defaultValue={client?.cep}
                    onChange={(e) => handleCepLookup(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-800 mb-2">Rua</label>
                  <input 
                    name="street"
                    type="text" 
                    defaultValue={client?.street}
                    className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">Número</label>
                  <input 
                    name="number"
                    type="text" 
                    defaultValue={client?.number}
                    className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">Bairro</label>
                  <input 
                    name="neighborhood"
                    type="text" 
                    defaultValue={client?.neighborhood}
                    className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">Cidade</label>
                  <input 
                    name="city"
                    type="text" 
                    defaultValue={client?.city}
                    className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">Estado</label>
                  <input 
                    name="state"
                    type="text" 
                    defaultValue={client?.state}
                    className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Notas</label>
                <textarea 
                  name="notes"
                  rows={4}
                  defaultValue={client?.notes}
                  className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <button 
                type="submit"
                className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors"
              >
                <Check size={18} />
                {client ? 'Salvar Alterações' : 'Cadastrar Hóspede'}
              </button>
              <button 
                type="button"
                onClick={() => handleBack(client ? 'guest-details' : 'clients')}
                className="px-6 py-3 rounded-xl font-bold text-slate-600 border border-slate-300 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderStaff = () => (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
      <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl sm:text-3xl font-semibold text-slate-800">Equipe e Pagamentos</h2>
        <button 
          onClick={() => setCurrentView('new-staff')}
          className="flex items-center gap-2 bg-[#2eca8b] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#28b079] transition-colors shadow-sm"
        >
          <Plus size={18} />
          Novo Funcionário
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {staff.map(member => (
            <div key={member.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col group hover:border-indigo-300 transition-colors relative">
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => {
                    setSelectedStaffId(member.id);
                    setCurrentView('new-staff');
                  }}
                  className="p-1.5 bg-slate-50 text-slate-600 rounded-md shadow-sm hover:text-indigo-600 transition-colors border border-slate-100"
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  onClick={() => setStaff(staff.filter(s => s.id !== member.id))}
                  className="p-1.5 bg-slate-50 text-slate-600 rounded-md shadow-sm hover:text-red-600 transition-colors border border-slate-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
                  <UserCircle size={28} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-slate-800 truncate">{member.name}</h3>
                  <p className="text-sm text-slate-500 truncate">{member.role}</p>
                </div>
              </div>
              
              <div className="space-y-4 flex-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Salário Mensal</span>
                  <span className="font-bold text-slate-800">R$ {(member.salary || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Último Pagamento</span>
                  <span className="text-slate-800">{member.lastPaymentDate ? format(parseISO(member.lastPaymentDate), 'dd/MM/yyyy') : 'Nenhum'}</span>
                </div>
              </div>
              
              <button className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm">
                Registrar Pagamento
              </button>
            </div>
          ))}
          <button 
            onClick={() => setCurrentView('new-staff')}
            className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-300 hover:text-indigo-400 transition-all group min-h-[250px]"
          >
            <Plus size={32} className="mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-sm uppercase tracking-wider">Adicionar Funcionário</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
      <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl sm:text-3xl font-semibold text-slate-800">Produtos & Serviços</h2>
        <button 
          onClick={() => setCurrentView('new-product')}
          className="flex items-center gap-2 bg-[#2eca8b] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#28b079] transition-colors shadow-sm"
        >
          <Plus size={18} />
          Novo Item
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-emerald-300 transition-colors">
              <div className="h-32 bg-slate-100 relative flex items-center justify-center">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <ImageIcon size={40} className="text-slate-300" />
                )}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => {
                      setSelectedProductId(product.id);
                      setCurrentView('new-product');
                    }}
                    className="p-1.5 bg-white text-slate-600 rounded-md shadow-sm hover:text-emerald-600 transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => setProducts(products.filter(p => p.id !== product.id))}
                    className="p-1.5 bg-white text-slate-600 rounded-md shadow-sm hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-slate-800 line-clamp-2">{product.name}</h3>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ml-2",
                    product.type === 'product' ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                  )}>
                    {product.type === 'product' ? 'Produto' : 'Serviço'}
                  </span>
                </div>
                <div className="text-lg font-bold text-emerald-600 mb-4">
                  R$ {(product.price || 0).toFixed(2)}
                </div>
                <div className="mt-auto">
                  {product.type === 'product' && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Estoque:</span>
                      <span className={cn(
                        "font-medium",
                        (product.stockQuantity || 0) <= (product.minStockAlert || 0) ? "text-red-500" : "text-slate-700"
                      )}>
                        {product.stockQuantity || 0} un
                      </span>
                    </div>
                  )}
                  {product.type === 'product' && (product.stockQuantity || 0) <= (product.minStockAlert || 0) && (
                    <div className="mt-2 text-xs text-red-500 flex items-center gap-1 bg-red-50 p-1.5 rounded-md">
                      <AlertCircle size={12} />
                      Estoque baixo (Mín: {product.minStockAlert})
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );



  const renderBookingConsumption = () => {
    if (!activeBookingForConsumption) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-slate-500 mb-4">Nenhuma reserva selecionada.</p>
          <button onClick={() => setCurrentView('calendar')} className="bg-emerald-600 text-white px-4 py-2 rounded-lg">Voltar ao Calendário</button>
        </div>
      );
    }

    const client = clients.find(c => c.id === activeBookingForConsumption.clientId);
    const room = rooms.find(r => r.id === activeBookingForConsumption.roomId);
    const totalConsumption = activeBookingForConsumption.consumption.reduce((acc, item) => acc + item.amount, 0);

    const handleAddConsumption = (product: Product) => {
      const newItem: ConsumptionItem = {
        id: Math.random().toString(36).substr(2, 9),
        productId: product.id,
        description: product.name,
        amount: product.price, // assuming quantity 1 for now
        quantity: 1,
        unitPrice: product.price,
        date: new Date().toISOString()
      };

      const updatedBooking: Booking = {
        ...activeBookingForConsumption,
        consumption: [...activeBookingForConsumption.consumption, newItem]
      };

      // Recalculate payment status
      const bTransactions = transactions.filter(t => t.bookingId === updatedBooking.id);
      const totalPaid = bTransactions.reduce((sum, t) => sum + t.amount, 0);
      const consumptionTotal = updatedBooking.consumption.reduce((sum, c) => sum + (c.amount || (c.quantity || 0) * (c.unitPrice || 0)), 0);
      const grandTotal = updatedBooking.totalPrice + consumptionTotal;
      
      updatedBooking.paymentStatus = totalPaid >= grandTotal ? 'full' : totalPaid > 0 ? 'partial' : 'none';

      setBookings(bookings.map(b => b.id === updatedBooking.id ? updatedBooking : b));
      setActiveBookingForConsumption(updatedBooking);
      
      // Update stock if it's a product
      if (product.type === 'product' && product.stockQuantity !== undefined) {
        setProducts(products.map(p => p.id === product.id ? { ...p, stockQuantity: Math.max(0, p.stockQuantity! - 1) } : p));
      }
    };

    const handleManualConsumption = () => {
      if (!manualConsumptionDescription || !manualConsumptionAmount) return;

      const amount = parseFloat(manualConsumptionAmount.replace(',', '.'));
      if (isNaN(amount)) return;

      const newItem: ConsumptionItem = {
        id: Math.random().toString(36).substr(2, 9),
        description: manualConsumptionDescription,
        amount: amount,
        quantity: 1,
        unitPrice: amount,
        date: new Date().toISOString()
      };

      const updatedBooking: Booking = {
        ...activeBookingForConsumption,
        consumption: [...activeBookingForConsumption.consumption, newItem]
      };

      // Recalculate payment status
      const bTransactions = transactions.filter(t => t.bookingId === updatedBooking.id);
      const totalPaid = bTransactions.reduce((sum, t) => sum + t.amount, 0);
      const consumptionTotal = updatedBooking.consumption.reduce((sum, c) => sum + (c.amount || (c.quantity || 0) * (c.unitPrice || 0)), 0);
      const grandTotal = updatedBooking.totalPrice + consumptionTotal;
      
      updatedBooking.paymentStatus = totalPaid >= grandTotal ? 'full' : totalPaid > 0 ? 'partial' : 'none';

      setBookings(bookings.map(b => b.id === updatedBooking.id ? updatedBooking : b));
      setActiveBookingForConsumption(updatedBooking);
      
      setManualConsumptionDescription('');
      setManualConsumptionAmount('');
    };

    const handleUpdateConsumption = (itemId: string) => {
      const amount = parseFloat(editingConsumptionAmount.replace(',', '.'));
      if (isNaN(amount)) return;

      const updatedBooking: Booking = {
        ...activeBookingForConsumption,
        consumption: activeBookingForConsumption.consumption.map(c => 
          c.id === itemId ? { ...c, amount: amount, unitPrice: amount / (c.quantity || 1) } : c
        )
      };

      // Recalculate payment status
      const bTransactions = transactions.filter(t => t.bookingId === updatedBooking.id);
      const totalPaid = bTransactions.reduce((sum, t) => sum + t.amount, 0);
      const consumptionTotal = updatedBooking.consumption.reduce((sum, c) => sum + (c.amount || (c.quantity || 0) * (c.unitPrice || 0)), 0);
      const grandTotal = updatedBooking.totalPrice + consumptionTotal;
      
      updatedBooking.paymentStatus = totalPaid >= grandTotal ? 'full' : totalPaid > 0 ? 'partial' : 'none';

      setBookings(bookings.map(b => b.id === updatedBooking.id ? updatedBooking : b));
      setActiveBookingForConsumption(updatedBooking);
      setEditingConsumptionId(null);
    };

    const handleRemoveConsumption = (itemId: string) => {
      const itemToRemove = activeBookingForConsumption.consumption.find(c => c.id === itemId);
      if (!itemToRemove) return;

      const updatedBooking: Booking = {
        ...activeBookingForConsumption,
        consumption: activeBookingForConsumption.consumption.filter(c => c.id !== itemId)
      };

      // Recalculate payment status
      const bTransactions = transactions.filter(t => t.bookingId === updatedBooking.id);
      const totalPaid = bTransactions.reduce((sum, t) => sum + t.amount, 0);
      const consumptionTotal = updatedBooking.consumption.reduce((sum, c) => sum + (c.amount || (c.quantity || 0) * (c.unitPrice || 0)), 0);
      const grandTotal = updatedBooking.totalPrice + consumptionTotal;
      
      updatedBooking.paymentStatus = totalPaid >= grandTotal ? 'full' : totalPaid > 0 ? 'partial' : 'none';

      setBookings(bookings.map(b => b.id === updatedBooking.id ? updatedBooking : b));
      setActiveBookingForConsumption(updatedBooking);

      // Restore stock if it's a product
      if (itemToRemove.productId) {
        const product = products.find(p => p.id === itemToRemove.productId);
        if (product && product.type === 'product' && product.stockQuantity !== undefined) {
          setProducts(products.map(p => p.id === product.id ? { ...p, stockQuantity: p.stockQuantity! + (itemToRemove.quantity || 1) } : p));
        }
      }
    };

    return (
      <div className="flex flex-col h-full bg-slate-50 relative">
        <div className="p-4 sm:p-6 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setActiveBookingForConsumption(null);
                handleBack();
              }}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-semibold text-slate-800">Lançar Consumo</h2>
              <p className="text-sm text-slate-500">
                Hóspede: <span className="font-medium text-slate-700">{client?.name}</span> • Quarto: <span className="font-medium text-slate-700">{room?.number}</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-500">Total Consumo</div>
            <div className="text-2xl font-bold text-emerald-600">R$ {(totalConsumption || 0).toFixed(2)}</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row gap-6 p-4 sm:p-6">
          {/* Products List */}
          <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px] lg:min-h-0">
            <div className="p-4 border-b border-slate-100 bg-slate-50 space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                <input 
                  type="text" 
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  placeholder="Buscar produtos ou serviços..." 
                  className="w-full pl-12 pr-4 py-4 text-lg border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-sm"
                />
              </div>

              {/* Manual Entry Form */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Plus size={16} />
                  Lançamento Manual
                </h4>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="text"
                    placeholder="Descrição do produto/serviço"
                    value={manualConsumptionDescription}
                    onChange={(e) => setManualConsumptionDescription(e.target.value)}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <div className="flex gap-2">
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
                      <input 
                        type="text"
                        placeholder="0,00"
                        value={manualConsumptionAmount}
                        onChange={(e) => setManualConsumptionAmount(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <button 
                      onClick={handleManualConsumption}
                      disabled={!manualConsumptionDescription || !manualConsumptionAmount}
                      className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {products.filter(p => p.name.toLowerCase().includes(productSearchQuery.toLowerCase())).map(product => (
                  <div key={product.id} className="border border-slate-200 rounded-xl p-3 flex items-center gap-4 hover:border-emerald-300 transition-colors bg-white">
                    <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <Package size={24} className="text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-800 text-sm truncate">{product.name}</h4>
                      <div className="text-emerald-600 font-bold text-sm">R$ {(product.price || 0).toFixed(2)}</div>
                      {product.type === 'product' && (
                        <div className="text-xs text-slate-500 mt-1">Estoque: {product.stockQuantity}</div>
                      )}
                    </div>
                    <button 
                      onClick={() => handleAddConsumption(product)}
                      disabled={product.type === 'product' && (product.stockQuantity || 0) <= 0}
                      className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Consumption Cart */}
          <div className="w-full lg:w-96 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden shrink-0 min-h-[400px] lg:min-h-0">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <ShoppingCart size={18} className="text-slate-500" />
                Itens Lançados
              </h3>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {activeBookingForConsumption.consumption.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <ShoppingCart size={48} className="mb-4 opacity-20" />
                  <p>Nenhum item lançado ainda.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeBookingForConsumption.consumption.map((item, index) => (
                    <div key={item.id} className="flex flex-col p-3 border border-slate-100 rounded-lg bg-slate-50 gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-800 text-sm truncate">{item.description}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {item.quantity || 1}x R$ {((item.unitPrice || item.amount) || 0).toFixed(2)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <div className="font-bold text-slate-800 text-sm">R$ {(item.amount || 0).toFixed(2)}</div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => {
                                setEditingConsumptionId(item.id);
                                setEditingConsumptionAmount(item.amount.toString());
                              }}
                              className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                              title="Editar valor"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => handleRemoveConsumption(item.id)}
                              className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                              title="Remover item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {editingConsumptionId === item.id && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200">
                          <div className="relative flex-1">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">R$</span>
                            <input 
                              type="text"
                              value={editingConsumptionAmount}
                              onChange={(e) => setEditingConsumptionAmount(e.target.value)}
                              className="w-full pl-7 pr-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                              autoFocus
                            />
                          </div>
                          <button 
                            onClick={() => handleUpdateConsumption(item.id)}
                            className="px-2 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded hover:bg-indigo-700 transition-colors"
                          >
                            OK
                          </button>
                          <button 
                            onClick={() => setEditingConsumptionId(null)}
                            className="px-2 py-1 bg-slate-200 text-slate-600 text-[10px] font-bold rounded hover:bg-slate-300 transition-colors"
                          >
                            X
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCheckout = () => {
    if (!activeBookingForConsumption) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-slate-500 mb-4">Nenhuma reserva selecionada.</p>
          <button onClick={() => setCurrentView('calendar')} className="bg-emerald-600 text-white px-4 py-2 rounded-lg">Voltar ao Calendário</button>
        </div>
      );
    }

    const client = clients.find(c => c.id === activeBookingForConsumption.clientId);
    const room = rooms.find(r => r.id === activeBookingForConsumption.roomId);
    const totalConsumption = activeBookingForConsumption.consumption.reduce((acc, item) => acc + item.amount, 0);
    const totalHosting = activeBookingForConsumption.totalPrice;
    const grandTotal = totalHosting + totalConsumption;
    
    const bookingTransactions = transactions.filter(t => t.bookingId === activeBookingForConsumption.id);
    const totalPaid = bookingTransactions.reduce((sum, t) => sum + t.amount, 0);
    const balanceDue = grandTotal - totalPaid;

    const handleCheckout = () => {
      // Update booking status
      const updatedBooking = { ...activeBookingForConsumption, status: 'checked-out' as const };
      setBookings(bookings.map(b => b.id === updatedBooking.id ? updatedBooking : b));
      
      // Update room status
      const updatedRoom = { ...room!, status: 'dirty' as const, availability: 'available' as const };
      setRooms(rooms.map(r => r.id === updatedRoom.id ? updatedRoom : r));
      
      setActiveBookingForConsumption(null);
      handleBack();
      setIsCheckoutConfirmModalOpen(false);
    };

    const handleCheckoutRequest = () => {
      const { keyControl } = activeBookingForConsumption;
      
      const missingKeys = keyControl?.keysGiven && !keyControl?.keysReturned;
      const missingControls = (keyControl?.gateControlsGiven || 0) > 0 && !keyControl?.gateControlsReturned;

      if (missingKeys || missingControls) {
        setIsCheckoutConfirmModalOpen(true);
      } else {
        handleCheckout();
      }
    };

    return (
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden my-6">
        <div className="p-6 border-b border-slate-100 flex items-center gap-4">
          <button 
            onClick={() => {
              setActiveBookingForConsumption(null);
              setCurrentView('calendar');
            }}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-semibold text-slate-800">Fatura / Check-out</h2>
        </div>
        
        <div className="p-6 space-y-8">
          {/* Info */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <div className="text-sm text-slate-500 mb-1">Hóspede</div>
              <div className="font-semibold text-slate-800">{client?.name}</div>
              <div className="text-sm text-slate-600">{client?.document}</div>
            </div>
            <div>
              <div className="text-sm text-slate-500 mb-1">Acomodação</div>
              <div className="font-semibold text-slate-800">Quarto {room?.number}</div>
              <div className="text-sm text-slate-600">{room?.category}</div>
            </div>
            <div>
              <div className="text-sm text-slate-500 mb-1">Check-in</div>
              <div className="font-medium text-slate-800">{format(parseISO(activeBookingForConsumption.checkIn), 'dd/MM/yyyy')}</div>
            </div>
            <div>
              <div className="text-sm text-slate-500 mb-1">Check-out</div>
              <div className="font-medium text-slate-800">{format(parseISO(activeBookingForConsumption.checkOut), 'dd/MM/yyyy')}</div>
            </div>
          </div>

          {/* Hosting */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Hospedagem</h3>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-700">Diárias ({differenceInCalendarDays(parseISO(activeBookingForConsumption.checkOut), parseISO(activeBookingForConsumption.checkIn)) || 1} noites)</span>
              <span className="font-medium text-slate-800">R$ {(totalHosting || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Consumption */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex justify-between items-center">
              Consumo
              <button 
                onClick={() => {
                  handleNavigate('booking-consumption');
                }}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
              >
                <Plus size={16} /> Adicionar
              </button>
            </h3>
            {activeBookingForConsumption.consumption.length === 0 ? (
              <p className="text-slate-500 italic py-2">Nenhum consumo registrado.</p>
            ) : (
              <div className="space-y-2">
                {activeBookingForConsumption.consumption.map(item => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                    <div>
                      <div className="text-slate-700">{item.description}</div>
                      <div className="text-xs text-slate-500">{item.quantity || 1}x R$ {((item.unitPrice || item.amount) || 0).toFixed(2)}</div>
                    </div>
                    <span className="font-medium text-slate-800">R$ {(item.amount || 0).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-3 mt-2 border-t border-slate-100">
                  <span className="font-medium text-slate-600">Subtotal Consumo</span>
                  <span className="font-semibold text-slate-800">R$ {(totalConsumption || 0).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Lembrete de Chaves e Controles */}
          {(activeBookingForConsumption.keyControl?.keysGiven || (activeBookingForConsumption.keyControl?.gateControlsGiven || 0) > 0) && (
            <div className="p-6 bg-amber-50 border border-amber-100 rounded-xl space-y-4">
              <h3 className="text-amber-800 font-bold flex items-center gap-2">
                <AlertCircle size={20} />
                Lembrete de Devolução
              </h3>
              <p className="text-sm text-amber-700">Por favor, verifique se o hóspede devolveu os seguintes itens:</p>
              
              <div className="space-y-3">
                {activeBookingForConsumption.keyControl?.keysGiven && (
                  <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-amber-200 cursor-pointer hover:bg-amber-50/50 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={activeBookingForConsumption.keyControl?.keysReturned}
                      onChange={(e) => {
                        const updatedKeyControl = { 
                          ...activeBookingForConsumption.keyControl!,
                          keysReturned: e.target.checked 
                        };
                        setBookings(bookings.map(b => b.id === activeBookingForConsumption.id ? { ...b, keyControl: updatedKeyControl } : b));
                        setActiveBookingForConsumption({ ...activeBookingForConsumption, keyControl: updatedKeyControl });
                      }}
                      className="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                    />
                    <div className="flex items-center gap-2">
                      <Key size={16} className="text-amber-600" />
                      <span className="text-sm font-medium text-amber-900">Chaves do Quarto</span>
                    </div>
                  </label>
                )}

                {(activeBookingForConsumption.keyControl?.gateControlsGiven || 0) > 0 && (
                  <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-amber-200 cursor-pointer hover:bg-amber-50/50 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={activeBookingForConsumption.keyControl?.gateControlsReturned}
                      onChange={(e) => {
                        const updatedKeyControl = { 
                          ...activeBookingForConsumption.keyControl!,
                          gateControlsReturned: e.target.checked 
                        };
                        setBookings(bookings.map(b => b.id === activeBookingForConsumption.id ? { ...b, keyControl: updatedKeyControl } : b));
                        setActiveBookingForConsumption({ ...activeBookingForConsumption, keyControl: updatedKeyControl });
                      }}
                      className="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                    />
                    <div className="flex items-center gap-2">
                      <Smartphone size={16} className="text-amber-600" />
                      <span className="text-sm font-medium text-amber-900">
                        {activeBookingForConsumption.keyControl?.gateControlsGiven} Controle(s) do Portão
                      </span>
                    </div>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Total Summary */}
          <div className="space-y-4 pt-6 border-t border-slate-100">
            <div className="flex justify-between items-center text-slate-600">
              <span>Total Hospedagem</span>
              <span>R$ {(totalHosting || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Total Consumo</span>
              <span>R$ {(totalConsumption || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-800 font-bold text-lg pt-2 border-t border-slate-50">
              <span>Total Geral</span>
              <span>R$ {(grandTotal || 0).toFixed(2)}</span>
            </div>
            
            {totalPaid > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-4">Pagamentos Realizados</div>
                {bookingTransactions.map(t => (
                  <div key={t.id} className="flex justify-between items-center text-emerald-600 text-sm">
                    <span>{t.description} ({format(parseISO(t.date), 'dd/MM')})</span>
                    <span>- R$ {(t.amount || 0).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center text-emerald-700 font-bold pt-2 border-t border-slate-50">
                  <span>Total Pago</span>
                  <span>R$ {(totalPaid || 0).toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className={cn(
              "p-6 rounded-xl border flex justify-between items-center mt-6",
              balanceDue > 0 ? "bg-rose-50 border-rose-100" : "bg-emerald-50 border-emerald-100"
            )}>
              <span className={cn("text-xl font-bold", balanceDue > 0 ? "text-rose-800" : "text-emerald-800")}>
                {balanceDue > 0 ? 'Saldo Pendente' : 'Saldo Final'}
              </span>
              <span className={cn("text-3xl font-black", balanceDue > 0 ? "text-rose-600" : "text-emerald-600")}>
                R$ {(Math.abs(balanceDue || 0)).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between gap-3">
          <div className="flex gap-2">
            <button 
              onClick={() => {
                setActiveBookingForConsumption(null);
                handleBack();
              }}
              className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors"
            >
              Voltar
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {balanceDue > 0.01 && (
              <button 
                onClick={() => {
                  setPaymentBookingId(activeBookingForConsumption.id);
                  setIsAddPaymentModalOpen(true);
                }}
                className="px-6 py-2.5 bg-white border border-emerald-500 text-emerald-600 font-bold rounded-xl hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <CreditCard size={18} />
                Registrar Pagamento
              </button>
            )}
            
            <button 
              onClick={handleCheckoutRequest}
              disabled={activeBookingForConsumption.status === 'checked-out' || balanceDue > 0.01}
              className="px-6 py-2.5 bg-emerald-600 text-white font-bold hover:bg-emerald-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} />
              {activeBookingForConsumption.status === 'checked-out' ? 'Check-out Realizado' : 'Finalizar Check-out'}
            </button>
          </div>
        </div>

        {/* Checkout Confirmation Modal */}
        {isCheckoutConfirmModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center gap-3 text-amber-600">
                <AlertCircle size={24} />
                <h3 className="text-xl font-bold text-slate-800">Atenção</h3>
              </div>
              
              <div className="p-6 space-y-4">
                <p className="text-slate-600">
                  O sistema indica que as chaves ou controles do portão ainda não foram devolvidos pelo hóspede.
                </p>
                <p className="text-slate-600 font-medium">
                  Deseja finalizar o check-out mesmo assim?
                </p>
              </div>

              <div className="p-6 pt-2 flex gap-3 justify-end">
                <button 
                  onClick={() => setIsCheckoutConfirmModalOpen(false)}
                  className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold px-6 py-2.5 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCheckout}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-xl transition-colors"
                >
                  Confirmar Check-out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handlePublicBookingComplete = (booking: Booking, client: Client): boolean => {
    const checkInDate = parseISO(booking.checkIn);
    const checkOutDate = parseISO(booking.checkOut);

    if (checkBookingConflict(bookings, booking.roomId, checkInDate, checkOutDate)) {
      setBookingError(`Este quarto se esgotou no momento do fechamento. Por favor, selecione outro quarto ou data.`);
      return false;
    }

    setClients(prev => [...prev, client]);
    setBookings(prev => [...prev, booking]);
    return true;
  };

  useEffect(() => {
    if (bookingError) {
      const timer = setTimeout(() => setBookingError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [bookingError]);

  const AdminApp = () => {
    return (
      <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
      {/* Sidebar Overlay for Mobile/Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70]"
            />
            <motion.aside 
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 bg-slate-900 text-white flex flex-col z-[80] shadow-2xl"
            >
              <div className="p-6 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  {establishment.logoUrl ? (
                    <img src={establishment.logoUrl} alt="Logo" className="w-8 h-8 rounded-lg object-cover bg-white" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                      <Coffee size={20} className="text-white" />
                    </div>
                  )}
                  <span className="font-bold text-xl tracking-tight truncate max-w-[150px]">{establishment.name || 'PousadaGest'}</span>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 px-3 space-y-2 mt-4">
                <NavItem 
                  icon={<LayoutDashboard size={20} />} 
                  label="Início" 
                  active={currentView === 'home'} 
                  onClick={() => { setCurrentView('home'); setIsSidebarOpen(false); }}
                  collapsed={false}
                />
                <NavItem 
                  icon={<CalendarIcon size={20} />} 
                  label="Calendário" 
                  active={['calendar', 'booking-list'].includes(currentView)} 
                  onClick={() => { setCurrentView('calendar'); setIsSidebarOpen(false); }}
                  collapsed={false}
                />
                <NavItem 
                  icon={<Bed size={20} />} 
                  label="Quartos" 
                  active={['rooms', 'room-categories', 'new-room-category', 'room-category-details', 'update-room-category', 'new-room', 'bulk-update-rooms', 'room-details', 'update-room'].includes(currentView)} 
                  onClick={() => { setCurrentView('rooms'); setIsSidebarOpen(false); }}
                  collapsed={false}
                />
                <NavItem 
                  icon={<CheckSquare size={20} />} 
                  label="Governança" 
                  active={currentView === 'housekeeping'} 
                  onClick={() => { setCurrentView('housekeeping'); setIsSidebarOpen(false); }}
                  collapsed={false}
                />
                <NavItem 
                  icon={<Users size={20} />} 
                  label="Hóspedes" 
                  active={['clients', 'new-client'].includes(currentView)} 
                  onClick={() => { setCurrentView('clients'); setIsSidebarOpen(false); }}
                  collapsed={false}
                />
                <NavItem 
                  icon={<CalendarIcon size={20} />} 
                  label="Tarifário" 
                  active={currentView === 'rates'} 
                  onClick={() => { setCurrentView('rates'); setIsSidebarOpen(false); }}
                  collapsed={false}
                />
                {userRole === 'admin' && (
                  <>
                    <NavItem 
                      icon={<DollarSign size={20} />} 
                      label="Financeiro" 
                      active={currentView === 'finance'} 
                      onClick={() => { setCurrentView('finance'); setIsSidebarOpen(false); }}
                      collapsed={false}
                    />
                    <NavItem 
                      icon={<UserCircle size={20} />} 
                      label="Funcionários" 
                      active={currentView === 'staff'} 
                      onClick={() => { setCurrentView('staff'); setIsSidebarOpen(false); }}
                      collapsed={false}
                    />
                  </>
                )}
                <NavItem 
                  icon={<Package size={20} />} 
                  label="Produtos & Serviços" 
                  active={currentView === 'products'} 
                  onClick={() => { setCurrentView('products'); setIsSidebarOpen(false); }}
                  collapsed={false}
                />
                <NavItem 
                  icon={<Globe size={20} />} 
                  label="Página Pública" 
                  active={currentView === 'public-page'} 
                  onClick={() => { setCurrentView('public-page'); setIsSidebarOpen(false); }}
                  collapsed={false}
                />
              </nav>

              <div className="p-4 border-t border-slate-800 space-y-2">
                {userRole === 'admin' && (
                  <NavItem 
                    icon={<Settings size={20} />} 
                    label="Configurações" 
                    active={currentView === 'settings'} 
                    onClick={() => { setCurrentView('settings'); setIsSidebarOpen(false); }}
                    collapsed={false}
                  />
                )}
                <NavItem 
                  icon={<LogOut size={20} />} 
                  label="Sair" 
                  active={false} 
                  onClick={() => signOut(auth)}
                  collapsed={false}
                  className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 z-[60]">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 sm:border sm:border-slate-200"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-[#052c65] capitalize">
              {currentView === 'home' && 'Início'}
              {currentView === 'calendar' && 'Mapa de Reservas'}
              {currentView === 'booking-list' && 'Lista de Reservas'}
              {currentView === 'new-booking' && 'Nova Reserva'}
              {currentView === 'rooms' && 'Gestão de Quartos'}
              {currentView === 'housekeeping' && 'Governança / Camareiras'}
              {currentView === 'room-categories' && 'Categorias de Quartos'}
              {currentView === 'new-room-category' && 'Nova Categoria de Quarto'}
              {currentView === 'room-category-details' && 'Detalhes da Categoria'}
              {currentView === 'update-room-category' && 'Atualizar Categoria'}
              {currentView === 'new-room' && 'Novo Quarto'}
              {currentView === 'bulk-update-rooms' && 'Configuração de Acomodações'}
              {currentView === 'room-details' && 'Detalhes do Quarto'}
              {currentView === 'update-room' && 'Atualizar Quarto'}
              {currentView === 'clients' && 'Base de Clientes'}
              {currentView === 'new-client' && 'Novo Hóspede'}
              {currentView === 'rates' && 'Calendário Tarifário'}
              {currentView === 'finance' && 'Controle Financeiro'}
              {currentView === 'staff' && 'Equipe e Pagamentos'}
              {currentView === 'products' && 'Produtos e Serviços'}
              {currentView === 'new-product' && 'Novo Produto/Serviço'}
              {currentView === 'booking-consumption' && 'Lançar Consumo'}
              {currentView === 'checkout' && 'Fatura / Check-out'}
              {currentView === 'booking-details' && 'Detalhes da Reserva'}
              {currentView === 'guest-details' && 'Detalhes do Hóspede'}
              {currentView === 'settings' && 'Configurações do Sistema'}
              {currentView === 'public-page' && 'Página Pública de Reservas'}
            </h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Channel Sync Status */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg mr-2">
              <div className={cn(
                "w-2 h-2 rounded-full animate-pulse",
                isSyncing ? "bg-amber-500" : "bg-emerald-500"
              )} />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {isSyncing ? 'Sincronizando...' : 'Canais Sincronizados'}
              </span>
              <Globe size={14} className="text-slate-400" />
            </div>

            {/* Role Switcher for Demo */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1 mr-2">
              <button 
                onClick={() => setUserRole('admin')}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-all",
                  userRole === 'admin' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                ADM
              </button>
              <button 
                onClick={() => setUserRole('receptionist')}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-all",
                  userRole === 'receptionist' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Recepção
              </button>
              <button 
                onClick={() => {
                  setUserRole('housekeeper');
                  setCurrentView('housekeeping');
                }}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-all",
                  userRole === 'housekeeper' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Camareira
              </button>
            </div>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Buscar hóspede..."
                value={calendarSearchQuery}
                onChange={(e) => setCalendarSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="relative md:hidden">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCalendarSearchOpen(!isCalendarSearchOpen);
                }}
                className="text-slate-500 hover:text-slate-700 p-2 border border-slate-200 rounded-lg flex"
              >
                <Search size={20} />
              </button>
              
              <AnimatePresence>
                {isCalendarSearchOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-full right-0 mt-2 w-[280px] bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-[100]"
                  >
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        autoFocus
                        type="text"
                        placeholder="Buscar hóspede..."
                        value={calendarSearchQuery}
                        onChange={(e) => setCalendarSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="relative">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsNotificationsOpen(!isNotificationsOpen);
                }}
                className="text-slate-500 hover:text-slate-700 p-2 border border-slate-200 rounded-lg relative flex"
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                    {notifications.length > 99 ? '99+' : notifications.length}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-[100]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <h3 className="font-semibold text-slate-800">Notificações</h3>
                      <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {notifications.length} novas
                      </span>
                    </div>
                    
                    <div className="max-h-[400px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
                          <Bell size={24} className="text-slate-300" />
                          <p className="text-sm">Nenhuma notificação no momento</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {notifications.map((notif) => (
                            <button
                              key={notif.id}
                              onClick={() => {
                                setSelectedBookingId(notif.bookingId);
                                handleNavigate('booking-details');
                                setIsNotificationsOpen(false);
                              }}
                              className="w-full text-left p-4 hover:bg-slate-50 transition-colors flex gap-3 items-start"
                            >
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                                notif.type === 'check-in' ? "bg-emerald-100 text-emerald-600" :
                                notif.type === 'check-out' ? "bg-purple-100 text-purple-600" :
                                "bg-blue-100 text-blue-600"
                              )}>
                                {notif.type === 'check-in' ? <UserCheck size={16} /> :
                                 notif.type === 'check-out' ? <LogOut size={16} /> :
                                 <CalendarIcon size={16} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800 truncate">{notif.title}</p>
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                <p className="text-[10px] text-slate-400 mt-1.5 font-medium flex items-center gap-1">
                                  <Clock size={10} />
                                  {notif.type === 'booking' ? 'Check-in: ' : ''}
                                  {format(notif.time, "dd 'de' MMM", { locale: ptBR })}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Desktop Profile Pill */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-600 hover:bg-slate-700 cursor-pointer transition-colors rounded-full pl-1 pr-3 py-1 text-white ml-2">
              <div className="w-8 h-8 rounded-full bg-slate-400 flex items-center justify-center overflow-hidden border border-slate-500">
                <img src="https://picsum.photos/seed/pousada/100/100" alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <span className="text-sm font-medium max-w-[130px] truncate">Pousada da bale...</span>
              <ChevronDown size={16} className="text-slate-300" />
            </div>

            {/* Mobile Profile Circle */}
            <div className="sm:hidden w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#052c65] text-xs font-bold shadow-sm border border-blue-100">
              AP
            </div>
          </div>
        </header>

        <div className={cn("flex-1 relative", currentView === 'calendar' ? "overflow-hidden p-0 sm:p-4 lg:p-8" : currentView === 'booking-list' ? "overflow-auto p-0 sm:p-4 lg:p-8" : "overflow-auto p-4 sm:p-6 lg:p-8")}>
          {/* Error Toast */}
          <AnimatePresence>
            {bookingError && (
              <motion.div 
                initial={{ opacity: 0, y: -20, x: '-50%' }}
                animate={{ opacity: 1, y: 0, x: '-50%' }}
                exit={{ opacity: 0, y: -20, x: '-50%' }}
                className="fixed top-24 left-1/2 z-[100] bg-rose-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px]"
              >
                <AlertCircle size={20} />
                <span className="font-medium">{bookingError}</span>
                <button 
                  onClick={() => setBookingError(null)}
                  className="ml-auto p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {currentView === 'home' && renderHome()}
              {currentView === 'calendar' && renderCalendar()}
              {currentView === 'booking-list' && renderBookingList()}
              {currentView === 'new-booking' && renderNewBooking()}
              {currentView === 'rooms' && renderRooms()}
              {currentView === 'housekeeping' && renderHousekeeping()}
              {currentView === 'room-categories' && renderRoomCategories()}
              {currentView === 'new-room-category' && (
                <NewRoomCategoryView 
                  roomCategories={roomCategories}
                  setRoomCategories={setRoomCategories}
                  setCurrentView={setCurrentView}
                />
              )}
              {currentView === 'room-category-details' && renderRoomCategoryDetails()}
              {currentView === 'update-room-category' && (
                <UpdateRoomCategoryView 
                  roomCategories={roomCategories}
                  setRoomCategories={setRoomCategories}
                  setCurrentView={setCurrentView}
                  selectedRoomCategoryId={selectedRoomCategoryId}
                  rooms={rooms}
                  setRooms={setRooms}
                />
              )}
              {currentView === 'new-room' && renderNewRoom()}
              {currentView === 'bulk-update-rooms' && (
                <BulkUpdateRoomsView 
                  roomCategories={roomCategories}
                  rooms={rooms}
                  setRoomCategories={setRoomCategories}
                  setRooms={setRooms}
                  setCurrentView={setCurrentView}
                />
              )}
              {currentView === 'room-details' && renderRoomDetails()}
              {currentView === 'update-room' && renderUpdateRoom()}
              {currentView === 'rates' && renderRatesCalendar()}
              {currentView === 'finance' && (userRole === 'admin' ? renderFinance() : renderAccessDenied())}
              {currentView === 'staff' && (userRole === 'admin' ? renderStaff() : renderAccessDenied())}
              {currentView === 'new-staff' && (userRole === 'admin' ? (
                <NewStaffView 
                  selectedStaffId={selectedStaffId}
                  staff={staff}
                  setStaff={setStaff}
                  setSelectedStaffId={setSelectedStaffId}
                  setCurrentView={setCurrentView}
                />
              ) : renderAccessDenied())}
              {currentView === 'products' && renderProducts()}
              {currentView === 'new-product' && (
                <NewProductView 
                  selectedProductId={selectedProductId}
                  products={products}
                  setProducts={setProducts}
                  setSelectedProductId={setSelectedProductId}
                  setCurrentView={setCurrentView}
                />
              )}
              {currentView === 'booking-consumption' && renderBookingConsumption()}
              {currentView === 'checkout' && renderCheckout()}
              {currentView === 'clients' && renderClients()}
              {currentView === 'new-client' && renderNewClient()}
              {currentView === 'booking-details' && renderBookingDetails()}
              {currentView === 'guest-details' && renderGuestDetails()}
              {currentView === 'settings' && (userRole === 'admin' ? (
                <SettingsView 
                  establishment={establishment}
                  setEstablishment={setEstablishment}
                  systemUsers={systemUsers}
                  setSystemUsers={setSystemUsers}
                  paymentMethods={paymentMethods}
                  setPaymentMethods={setPaymentMethods}
                  whatsappTemplate={whatsappTemplate}
                  setWhatsappTemplate={setWhatsappTemplate}
                  depositTemplate={depositTemplate}
                  setDepositTemplate={setDepositTemplate}
                  fnrhTemplate={fnrhTemplate}
                  setFnrhTemplate={setFnrhTemplate}
                  invoiceTemplate={invoiceTemplate}
                  setInvoiceTemplate={setInvoiceTemplate}
                  yieldRules={yieldRules}
                  setYieldRules={setYieldRules}
                  guestPortalConfig={guestPortalConfig}
                  setGuestPortalConfig={setGuestPortalConfig}
                />
              ) : renderAccessDenied())}
              {currentView === 'public-page' && renderPublicPageSettings()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Confirmation Modal for Moving Booking */}
      <AnimatePresence>
        {isConfirmingMove && draggedBooking && dropTarget && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Confirmar Alteração</h3>
                    <p className="text-slate-500 text-sm">Deseja realmente mover esta reserva?</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Reserva:</span>
                    <span className="font-semibold text-slate-800">{draggedBooking.reservationNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Hóspede:</span>
                    <span className="font-semibold text-slate-800">{clients.find(c => c.id === draggedBooking.clientId)?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Novo Quarto:</span>
                    <span className="font-semibold text-slate-800">
                      {rooms.find(r => r.id === dropTarget.roomId)?.number} ({rooms.find(r => r.id === dropTarget.roomId)?.category})
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Nova Data:</span>
                    <span className="font-semibold text-slate-800">
                      {format(dropTarget.day, "dd/MM/yyyy")}
                    </span>
                  </div>
                </div>

                {draggedBooking.channel !== 'direct' && (
                  <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                    <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">
                      <strong>Atenção:</strong> Você está alterando uma reserva que veio de um site de viagens ({draggedBooking.channel}). Essa alteração não será refletida automaticamente no canal de origem.
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setIsConfirmingMove(false);
                      setDraggedBooking(null);
                      setDropTarget(null);
                    }}
                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={confirmMove}
                    className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Overbooking Conflict Modal */}
      <AnimatePresence>
        {overbookingConflict && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 bg-rose-50 border-b border-rose-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-rose-900">Conflito de Reserva (Overbooking)</h3>
                  <p className="text-rose-700 text-sm">O quarto {overbookingConflict.roomNumber} não está disponível para o período selecionado.</p>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Sugestões de Realocação</h4>
                  <div className="space-y-3">
                    {overbookingConflict.suggestions.length > 0 ? (
                      overbookingConflict.suggestions.map(room => (
                        <button
                          key={room.id}
                          onClick={() => {
                            if (overbookingConflict.type === 'new') {
                              // Replace the conflicting room with the suggested one in the new booking form
                              setBookingRooms(prev => prev.map(br => 
                                br.room.id === overbookingConflict.roomId ? { ...br, room } : br
                              ));
                            } else if (overbookingConflict.type === 'move' && overbookingConflict.bookingId) {
                              // Update the existing booking directly
                              const duration = Math.max(1, differenceInCalendarDays(overbookingConflict.checkOut, overbookingConflict.checkIn));
                              const newTotalPrice = room.price * duration;
                              
                              setBookings(prev => prev.map(b => 
                                b.id === overbookingConflict.bookingId 
                                  ? { 
                                      ...b, 
                                      roomId: room.id, 
                                      checkIn: format(overbookingConflict.checkIn, "yyyy-MM-dd'T'HH:mm:ss"), 
                                      checkOut: format(overbookingConflict.checkOut, "yyyy-MM-dd'T'HH:mm:ss"),
                                      totalPrice: newTotalPrice
                                    } 
                                  : b
                              ));
                            }
                            setOverbookingConflict(null);
                            setBookingError(null);
                            toast.success(`Quarto alterado para ${room.number}`);
                          }}
                          className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-2xl transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center font-bold text-slate-700 group-hover:border-emerald-200 group-hover:text-emerald-600">
                              {room.number}
                            </div>
                            <div className="text-left">
                              <div className="font-bold text-slate-800 group-hover:text-emerald-700">{room.category}</div>
                              <div className="text-xs text-slate-500">R$ {(room.price || 0).toFixed(2)} / noite</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                            Selecionar
                            <ChevronRight size={16} />
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-slate-500 text-sm">Nenhum outro quarto disponível para este período.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
                  <Info size={20} className="text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Você pode selecionar uma das sugestões acima ou cancelar para ajustar as datas da reserva.
                  </p>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  onClick={() => setOverbookingConflict(null)}
                  className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Fechar
                </button>
                <button 
                  onClick={() => {
                    setOverbookingConflict(null);
                    setCurrentView('calendar');
                  }}
                  className="px-6 py-2.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors"
                >
                  Ver Calendário
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Payment Modal */}
      <AnimatePresence>
        {isAddPaymentModalOpen && paymentBookingId && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">Adicionar Pagamento</h3>
                <button 
                  onClick={() => setIsAddPaymentModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                  <input 
                    type="number" 
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Método de Pagamento</label>
                  <select 
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="credit_card">Cartão de Crédito</option>
                    <option value="debit_card">Cartão de Débito</option>
                    <option value="pix">PIX</option>
                    <option value="cash">Dinheiro</option>
                    <option value="bank_transfer">Transferência Bancária</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                  <input 
                    type="date" 
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
                  <textarea 
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none h-24"
                    placeholder="Detalhes opcionais sobre o pagamento..."
                  />
                </div>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  onClick={() => setIsAddPaymentModalOpen(false)}
                  className="px-6 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleAddPayment}
                  disabled={!paymentAmount}
                  className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Salvar Pagamento
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Cancel Booking Confirmation Modal */}
        {isCancelBookingModalOpen && bookingToCancel && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center gap-3 text-rose-600">
                <AlertCircle size={24} />
                <h3 className="text-xl font-bold text-slate-800">Confirmar Cancelamento</h3>
              </div>
              
              <div className="p-6 space-y-4">
                <p className="text-slate-600">
                  Tem certeza que deseja cancelar a reserva <span className="font-bold text-slate-800">{bookingToCancel.reservationNumber}</span>?
                </p>
                <p className="text-slate-500 text-sm">
                  Esta ação não pode ser desfeita. Se houver taxas de cancelamento, um link de pagamento será gerado automaticamente.
                </p>
              </div>

              <div className="p-6 pt-2 flex gap-3 justify-end">
                <button 
                  onClick={() => {
                    setIsCancelBookingModalOpen(false);
                    setBookingToCancel(null);
                  }}
                  className="px-6 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Voltar
                </button>
                <button 
                  onClick={confirmCancelBooking}
                  className="px-6 py-2.5 bg-rose-600 text-white font-semibold rounded-xl hover:bg-rose-700 transition-colors"
                >
                  Confirmar Cancelamento
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
    );
  };

  return (
    <Router>
      <ToastProvider />
      <Preloader isLoading={isAppLoading} logoUrl={establishment.logoUrl} establishmentName={establishment.name} />
      <Routes>
        <Route path="/b/:slug" element={<PublicWrapper establishment={establishment} rooms={rooms} bookings={bookings} dailyRates={dailyRates} ratePlans={ratePlans} handlePublicBookingComplete={handlePublicBookingComplete} />} />
        <Route path="/b/:slug/consult" element={<ConsultationWrapper bookings={bookings} clients={clients} rooms={rooms} establishment={establishment} />} />
        <Route path="/b/:slug/fnrh" element={<FNRHWrapper bookings={bookings} clients={clients} establishment={establishment} setClients={setClients} />} />
        <Route path="/guest-portal/:slug" element={<GuestPortalWrapper config={guestPortalConfig} establishment={establishment} />} />
        <Route path="*" element={AdminApp()} />
      </Routes>
    </Router>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  collapsed: boolean;
  className?: string;
}

function NavItem({ icon, label, active, onClick, collapsed, className }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative",
        active ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:bg-slate-800 hover:text-white",
        className
      )}
    >
      <div className={cn(
        "transition-transform duration-200",
        active ? "scale-110" : "group-hover:scale-110"
      )}>
        {icon}
      </div>
      {!collapsed && (
        <span className="font-medium text-sm whitespace-nowrap overflow-hidden">
          {label}
        </span>
      )}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
          {label}
        </div>
      )}
    </button>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Preloader />;
  }

  if (!user) {
    return <Login />;
  }

  return <AppContent />;
}
