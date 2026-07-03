import React, { useState } from 'react';
import { 
  Search, 
  Calendar as CalendarIcon, 
  Bed, 
  MapPin, 
  CheckCircle2,
  Clock,
  XCircle,
  ArrowLeft
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Booking, Client, Room, Establishment } from '../types';
import { cn } from '../lib/utils';

interface PublicBookingConsultationProps {
  bookings: Booking[];
  clients: Client[];
  rooms: Room[];
  establishment: Establishment;
  onBack: () => void;
}

export const PublicBookingConsultation: React.FC<PublicBookingConsultationProps> = ({
  bookings,
  clients,
  rooms,
  establishment,
  onBack
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [foundBooking, setFoundBooking] = useState<Booking | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = () => {
    setIsSearching(true);
    setError(null);
    
    // Simulate API delay
    setTimeout(() => {
      const booking = bookings.find(b => 
        b.reservationNumber.toLowerCase() === searchQuery.toLowerCase() ||
        b.id.toLowerCase() === searchQuery.toLowerCase()
      );

      if (booking) {
        setFoundBooking(booking);
      } else {
        setError('Reserva não encontrada. Verifique o código e tente novamente.');
      }
      setIsSearching(false);
    }, 800);
  };

  const getStatusInfo = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed': return { label: 'Confirmada', icon: <CheckCircle2 size={16} />, color: 'text-emerald-600 bg-emerald-50' };
      case 'checked-in': return { label: 'Hospedado', icon: <Clock size={16} />, color: 'text-blue-600 bg-blue-50' };
      case 'checked-out': return { label: 'Finalizada', icon: <CheckCircle2 size={16} />, color: 'text-slate-600 bg-slate-50' };
      case 'cancelled': return { label: 'Cancelada', icon: <XCircle size={16} />, color: 'text-red-600 bg-red-50' };
      default: return { label: 'Pendente', icon: <Clock size={16} />, color: 'text-amber-600 bg-amber-50' };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-8 font-medium"
        >
          <ArrowLeft size={20} />
          Voltar para Reservas
        </button>

        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
          <div className="bg-indigo-600 p-8 text-white text-center flex flex-col items-center">
            {establishment.logoUrl && (
              <img 
                src={establishment.logoUrl} 
                alt={establishment.name} 
                className="h-16 mb-4 object-contain" 
                referrerPolicy="no-referrer" 
              />
            )}
            <h2 className="text-3xl font-bold mb-2">Consultar Reserva</h2>
            <p className="text-indigo-100 font-light">Digite o código da sua reserva para ver os detalhes.</p>
          </div>

          <div className="p-8">
            {!foundBooking ? (
              <div className="space-y-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="Ex: RES-20240317-001"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-lg font-medium"
                  />
                </div>

                {error && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm font-medium text-center"
                  >
                    {error}
                  </motion.p>
                )}

                <button 
                  onClick={handleSearch}
                  disabled={!searchQuery || isSearching}
                  className="w-full bg-indigo-600 text-white font-bold py-5 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSearching ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Search size={20} />
                      Buscar Reserva
                    </>
                  )}
                </button>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Código da Reserva</h3>
                    <p className="text-2xl font-bold text-slate-800">{foundBooking.reservationNumber}</p>
                  </div>
                  <div className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold",
                    getStatusInfo(foundBooking.status).color
                  )}>
                    {getStatusInfo(foundBooking.status).icon}
                    {getStatusInfo(foundBooking.status).label}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Hóspede</h4>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                          <CheckCircle2 size={20} />
                        </div>
                        <p className="font-semibold text-slate-800">
                          {clients.find(c => c.id === foundBooking.clientId)?.name}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Estadia</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-slate-600">
                          <CalendarIcon size={18} className="text-indigo-500" />
                          <span>{format(parseISO(foundBooking.checkIn), 'dd/MM/yyyy')} - {format(parseISO(foundBooking.checkOut), 'dd/MM/yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600">
                          <Bed size={18} className="text-indigo-500" />
                          <span>Quarto {rooms.find(r => r.id === foundBooking.roomId)?.number} ({rooms.find(r => r.id === foundBooking.roomId)?.category})</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-3xl p-6 space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resumo Financeiro</h4>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Total da Reserva</span>
                      <span className="font-bold text-slate-800">R$ {(foundBooking.totalPrice || 0).toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Status do Pagamento</span>
                      <span className={cn(
                        "font-bold",
                        foundBooking.paymentStatus === 'full' ? "text-emerald-600" : "text-amber-600"
                      )}>
                        {foundBooking.paymentStatus === 'full' ? 'PAGO' : 'PENDENTE'}
                      </span>
                    </div>
                    <div className="pt-4 border-t border-slate-200">
                      <p className="text-[10px] text-slate-400 leading-relaxed italic">
                        Para alterações ou cancelamentos, entre em contato com o hotel pelo telefone {establishment.phone}.
                      </p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setFoundBooking(null)}
                  className="w-full border-2 border-slate-100 text-slate-500 font-bold py-4 rounded-2xl hover:bg-slate-50 transition-all"
                >
                  Nova Consulta
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
