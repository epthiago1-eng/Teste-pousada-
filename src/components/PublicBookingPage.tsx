import React, { useState, useMemo } from 'react';
import { 
  Menu, X, ShoppingCart, ChevronDown, Calendar as CalendarIcon, Users, Plus, Minus, Mail, Phone, Check, Search, User, CreditCard, CheckCircle2
} from 'lucide-react';
import { format, addDays, differenceInDays, startOfDay, addHours, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Establishment, Room, Client, Booking, RatePlan, DailyRate } from '../types';
import { cn } from '../lib/utils';
import { checkBookingConflict } from '../lib/bookingUtils';

interface PublicBookingPageProps {
  establishment: Establishment;
  rooms: Room[];
  bookings: Booking[];
  dailyRates: DailyRate[];
  ratePlans: RatePlan[];
  onBookingComplete: (booking: Booking, client: Client) => boolean | void | undefined;
}

export const PublicBookingPage: React.FC<PublicBookingPageProps> = ({ 
  establishment, 
  rooms, 
  bookings,
  dailyRates,
  ratePlans,
  onBookingComplete 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Search State
  const [checkInDate, setCheckInDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [checkOutDate, setCheckOutDate] = useState<string>(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  
  // Booking Flow State
  const [step, setStep] = useState<'search' | 'results' | 'details' | 'success'>('search');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [reservationNumber, setReservationNumber] = useState('');
  
  // Client Form State
  const [clientData, setClientData] = useState({
    name: '',
    email: '',
    phone: '',
    document: ''
  });

  const availableRooms = useMemo(() => {
    if (step !== 'results' && step !== 'details') return [];
    
    const checkIn = addHours(startOfDay(parseISO(checkInDate)), 14);
    const checkOut = addHours(startOfDay(parseISO(checkOutDate)), 12);
    
    // Validate dates
    if (checkIn >= checkOut) return [];

    return rooms.filter(r => validateRoomAvailability(r.id, checkIn, checkOut));
  }, [rooms, bookings, checkInDate, checkOutDate, step]);

  function validateRoomAvailability(roomId: string, checkIn: Date, checkOut: Date) {
    return !checkBookingConflict(bookings, roomId, checkIn, checkOut);
  }

  const handleSearch = () => {
    if (parseISO(checkInDate) >= parseISO(checkOutDate)) {
      alert('A data de check-out deve ser posterior ao check-in.');
      return;
    }
    setStep('results');
    setIsSearchOpen(false); // Close modal if used from modal
  };

  const computePrice = (room: Room) => {
    const start = parseISO(checkInDate);
    const days = Math.max(1, differenceInDays(parseISO(checkOutDate), start));
    
    // Filter rate plans for the room's category
    const categoryPlans = ratePlans?.filter(rp => rp.category === room.category) || [];
    // Just pick the first standard one or fallback
    const basePlan = categoryPlans.length > 0 ? categoryPlans[0] : null;

    let total = 0;
    for (let i = 0; i < days; i++) {
      const curDateStr = format(addDays(start, i), 'yyyy-MM-dd');
      let dailyPrice = room.price;
      
      if (basePlan && dailyRates) {
        const dr = dailyRates.find(d => d.ratePlanId === basePlan.id && d.date === curDateStr);
        if (dr) {
          dailyPrice = dr.price;
        } else if (basePlan.basePrice) {
          dailyPrice = basePlan.basePrice;
        }
      }
      total += dailyPrice;
    }
    return total;
  };

  const handleBookRoom = (room: Room) => {
    setSelectedRoom(room);
    setStep('details');
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !clientData.name || !clientData.email) return;

    const newClientId = Math.random().toString(36).substr(2, 9);
    const newClient: Client = {
      id: newClientId,
      name: clientData.name,
      email: clientData.email,
      phone: clientData.phone,
      document: clientData.document,
      notes: ''
    };

    const resNumber = Math.random().toString(36).substr(2, 8).toUpperCase();
    
    const newBooking: Booking = {
      id: Math.random().toString(36).substr(2, 9),
      roomId: selectedRoom.id,
      clientId: newClientId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: adults + children,
      status: 'confirmed',
      totalPrice: computePrice(selectedRoom),
      depositAmount: 0,
      paymentStatus: 'none',
      reservationNumber: resNumber,
      channel: 'website',
      consumption: []
    };

    const success = onBookingComplete(newBooking, newClient);
    if (success !== false) {
      setReservationNumber(resNumber);
      setStep('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      alert("Infelizmente, este quarto acabou de ser reservado. Por favor, escolha outro.");
      setStep('results');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed inset-0 z-50 bg-white flex flex-col w-full sm:w-80 shadow-2xl"
          >
            <div className="flex justify-end p-4">
              <button onClick={() => setIsMenuOpen(false)} className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <nav className="flex flex-col px-6 py-2 space-y-6 text-[15px] text-slate-700 font-medium">
                <a href="#" className="hover:text-indigo-600 transition-colors">Início</a>
                <a href="#" className="hover:text-indigo-600 transition-colors">Acomodações</a>
                <a href="#" className="hover:text-indigo-600 transition-colors">Comodidades</a>
                <a href="#" className="hover:text-indigo-600 transition-colors">Avaliações</a>
                <a href="#" className="hover:text-indigo-600 transition-colors">Contato</a>
              </nav>
              <div className="px-6 py-6 border-t border-slate-100 mt-4 space-y-4 text-slate-600 text-[15px] font-medium">
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-slate-500" />
                  <a href={`mailto:${establishment.email || 'contato@hotel.com'}`} className="hover:text-indigo-600 transition-colors">
                    {establishment.email || 'contato@hotel.com'}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-slate-500" />
                  <a href={`tel:${establishment.phone || '0000000000'}`} className="hover:text-indigo-600 transition-colors">
                    {establishment.phone || '(00) 0000-0000'}
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <div className={cn("relative flex flex-col", step === 'search' ? "h-screen min-h-[600px]" : "h-[40vh] min-h-[300px]")}>
        <div className="absolute inset-0 z-0 bg-slate-900">
          <img 
            src={establishment.heroImageUrl || "https://images.unsplash.com/photo-1542314831-c6a4d1409e5c?auto=format&fit=crop&q=80"} 
            alt="Hotel Background" 
            className="w-full h-full object-cover opacity-60"
          />
        </div>

        {/* Header */}
        <header className="relative z-10 p-4 md:p-8 flex justify-between items-center max-w-7xl mx-auto w-full">
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => {
              setStep('search');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            {establishment.logoUrl ? (
              <img src={establishment.logoUrl} alt={establishment.name} className="h-12 object-contain" referrerPolicy="no-referrer" />
            ) : (
              <div className="text-white font-bold text-3xl md:text-5xl flex items-center shadow-sm">
                <div className="relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 border-[3px] border-white rounded-2xl bg-indigo-600/50 backdrop-blur-md mr-3">
                  <Check size={24} className="text-white" strokeWidth={3} />
                </div>
                <span className="tracking-tight">{establishment.name || 'Hotel Prime'}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-3 rounded-full transition-colors flex items-center justify-center"
            >
              <Menu size={22} strokeWidth={2} />
            </button>
          </div>
        </header>

        {/* Hero Content */}
        {step === 'search' && (
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4">
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-white text-xl md:text-2xl font-medium mb-4 uppercase tracking-[0.2em] text-indigo-200"
            >
              Bem-vindo ao
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="w-16 h-[2px] bg-indigo-400 mb-6 rounded-full"
            ></motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl md:text-8xl lg:text-9xl font-bold text-white mb-6 tracking-tight drop-shadow-2xl"
            >
              {establishment.name || 'Hotel Prime'}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-white/90 text-lg md:text-2xl max-w-3xl font-medium mb-12 drop-shadow-md px-4"
            >
              O lugar perfeito para conforto e tranquilidade em sua próxima estadia.
            </motion.p>
            
            {/* Inline Search Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="w-full max-w-5xl bg-white p-2 rounded-3xl shadow-2xl flex flex-col md:flex-row gap-2"
            >
              <div className="flex-1 flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative bg-slate-50 hover:bg-slate-100 transition-colors rounded-2xl px-4 py-3 flex flex-col justify-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Check-in</label>
                  <input 
                    type="date" 
                    value={checkInDate}
                    onChange={e => setCheckInDate(e.target.value)}
                    className="bg-transparent text-sm font-bold text-slate-800 outline-none w-full"
                  />
                </div>
                <div className="flex-1 relative bg-slate-50 hover:bg-slate-100 transition-colors rounded-2xl px-4 py-3 flex flex-col justify-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Check-out</label>
                  <input 
                    type="date" 
                    value={checkOutDate}
                    min={format(addDays(parseISO(checkInDate), 1), 'yyyy-MM-dd')}
                    onChange={e => setCheckOutDate(e.target.value)}
                    className="bg-transparent text-sm font-bold text-slate-800 outline-none w-full"
                  />
                </div>
                <div className="flex-1 relative bg-slate-50 rounded-2xl px-4 py-3 flex flex-col justify-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hóspedes</label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-slate-400 mr-1" />
                      <button onClick={() => setAdults(Math.max(1, adults - 1))} className="text-slate-400 hover:text-indigo-600"><Minus size={14}/></button>
                      <span className="text-sm font-bold text-slate-800 w-4 text-center">{adults}</span>
                      <button onClick={() => setAdults(adults + 1)} className="text-slate-400 hover:text-indigo-600"><Plus size={14}/></button>
                    </div>
                  </div>
                </div>
              </div>
              <button 
                onClick={handleSearch}
                className="bg-indigo-600 text-white font-bold px-8 py-4 md:py-0 rounded-2xl hover:bg-indigo-700 transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <Search size={20} />
                Buscar
              </button>
            </motion.div>
          </div>
        )}
        
        {step !== 'search' && (
           <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4">
             <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">
               {step === 'results' ? 'Acomodações Disponíveis' : step === 'details' ? 'Finalizar Reserva' : 'Reserva Confirmada!'}
             </h1>
           </div>
        )}
      </div>

      {/* Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {step === 'search' && (
          <div className="text-center">
             <h2 className="text-3xl font-bold text-slate-800 mb-6 font-serif">Conheça nossos Quartos</h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {rooms.slice(0, 3).map(room => (
                 <div key={room.id} className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-100 hover:-translate-y-2 transition-transform duration-300">
                   <div className="aspect-[4/3] bg-slate-200">
                      <img src={room.photos?.[0] || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&q=80'} alt="" className="w-full h-full object-cover"/>
                   </div>
                   <div className="p-6 text-left">
                     <h3 className="text-xl font-bold text-slate-800">{room.category}</h3>
                     <p className="text-slate-500 text-sm mt-2 line-clamp-2">{room.description || 'Ótima acomodação.'}</p>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {step === 'results' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex gap-6 text-sm font-bold text-slate-700">
                <span>{format(parseISO(checkInDate), 'dd/MM/yyyy')} a {format(parseISO(checkOutDate), 'dd/MM/yyyy')}</span>
                <span>•</span>
                <span>{adults + children} Hóspede(s)</span>
              </div>
              <button onClick={() => setStep('search')} className="text-indigo-600 hover:text-indigo-800 font-bold text-sm">Alterar Busca</button>
            </div>

            {availableRooms.length === 0 ? (
               <div className="bg-white p-12 text-center rounded-3xl shadow-sm border border-slate-100">
                 <CalendarIcon size={48} className="mx-auto text-slate-300 mb-4" />
                 <h3 className="text-2xl font-bold text-slate-800 mb-2">Sem quartos disponíveis</h3>
                 <p className="text-slate-500">Infelizmente não há disponibilidade para as datas selecionadas.</p>
                 <button onClick={() => setStep('search')} className="mt-6 bg-indigo-50 text-indigo-700 px-6 py-2 rounded-xl font-bold hover:bg-indigo-100">Tentar outras datas</button>
               </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {availableRooms.map(room => (
                  <div key={room.id} className="flex flex-col sm:flex-row bg-white rounded-3xl overflow-hidden shadow-lg border border-slate-100 hover:shadow-xl transition-shadow">
                    <div className="sm:w-2/5 aspect-[4/3] sm:aspect-auto bg-slate-200">
                      <img src={room.photos?.[0] || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&q=80'} alt="" className="w-full h-full object-cover"/>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-xl font-bold text-slate-800 mb-2">{room.category}</h3>
                      <p className="text-slate-500 text-sm mb-4 line-clamp-2 flex-1">{room.description || 'Quarto confortável e bem equipado com tudo o que você precisa para uma excelente estadia.'}</p>
                      
                      <div className="mt-auto border-t border-slate-100 pt-4 flex items-center justify-between">
                        <div>
                           <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Total para {differenceInDays(parseISO(checkOutDate), parseISO(checkInDate))} noite(s)</span>
                           <div className="text-2xl font-bold text-slate-900">R$ {computePrice(room).toFixed(2).replace('.', ',')}</div>
                        </div>
                        <button 
                          onClick={() => handleBookRoom(room)}
                          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                          Reservar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {step === 'details' && selectedRoom && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-6">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <User className="text-indigo-500" />
                  Seus Dados
                </h3>
                <form onSubmit={handleConfirmBooking} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase">Nome Completo</label>
                      <input 
                        required
                        type="text" 
                        value={clientData.name}
                        onChange={e => setClientData({...clientData, name: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase">E-mail</label>
                      <input 
                        required
                        type="email" 
                        value={clientData.email}
                        onChange={e => setClientData({...clientData, email: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase">WhatsApp / Telefone</label>
                      <input 
                        required
                        type="tel" 
                        value={clientData.phone}
                        onChange={e => setClientData({...clientData, phone: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase">CPF / Passaporte</label>
                      <input 
                        required
                        type="text" 
                        value={clientData.document}
                        onChange={e => setClientData({...clientData, document: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end gap-3">
                    <button 
                      type="button" 
                      onClick={() => setStep('results')}
                      className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Voltar
                    </button>
                    <button 
                      type="submit"
                      className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-md flex items-center gap-2"
                    >
                      <CheckCircle2 size={20} />
                      Confirmar Reserva
                    </button>
                  </div>
                </form>
              </div>
            </div>
            
            {/* Sidebar Summary */}
            <div className="w-full lg:w-96 space-y-6">
              <div className="bg-slate-800 rounded-3xl p-6 text-white shadow-xl">
                <h4 className="font-bold text-lg mb-4 text-slate-100">Resumo da Reserva</h4>
                
                <div className="space-y-4 mb-6">
                  <div className="flex bg-slate-700/50 rounded-xl p-3 gap-4">
                    <div className="flex-1">
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Check-in</p>
                      <p className="font-bold">{format(parseISO(checkInDate), 'dd/MM/yyyy')}</p>
                    </div>
                    <div className="w-px bg-slate-600"></div>
                    <div className="flex-1">
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Check-out</p>
                      <p className="font-bold">{format(parseISO(checkOutDate), 'dd/MM/yyyy')}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Acomodação</p>
                    <p className="font-bold text-lg">{selectedRoom.category}</p>
                    <p className="text-sm text-slate-300">{adults} Adulto(s) {children > 0 ? `, ${children} Criança(s)` : ''}</p>
                  </div>
                </div>
                
                <div className="border-t border-slate-600 pt-4 flex items-end justify-between">
                  <span className="text-slate-300 font-bold">Total</span>
                  <span className="text-3xl font-bold text-emerald-400">
                    R$ {computePrice(selectedRoom).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'success' && (
           <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-xl mx-auto bg-white rounded-3xl p-10 text-center shadow-xl border border-emerald-100">
             <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
               <CheckCircle2 size={48} strokeWidth={2.5} />
             </div>
             <h2 className="text-3xl font-bold text-slate-800 mb-2">Reserva Confirmada!</h2>
             <p className="text-slate-500 mb-8">Sua reserva foi processada com sucesso no sistema. Aguardamos sua visita!</p>
             
             <div className="bg-slate-50 p-6 rounded-2xl mb-8 flex flex-col items-center justify-center border border-slate-100">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Número do Localizador</span>
               <span className="text-3xl font-mono font-bold text-indigo-600 tracking-wider bg-white px-4 py-2 rounded-xl shadow-sm">{reservationNumber}</span>
             </div>

             <button 
               onClick={() => {
                 setStep('search');
                 setClientData({ name: '', email: '', phone: '', document: '' });
               }}
               className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors w-full"
             >
               Voltar para Início
             </button>
           </motion.div>
        )}
      </main>
    </div>
  );
};
