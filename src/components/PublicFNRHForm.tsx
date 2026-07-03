import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar as CalendarIcon, 
  CreditCard, 
  CheckCircle2,
  ArrowLeft,
  Save,
  Globe,
  Briefcase,
  Plane
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Booking, Client, Establishment } from '../types';
import { cn } from '../lib/utils';
import { toast } from './ui/Toast';

interface PublicFNRHFormProps {
  establishment: Establishment;
  bookings: Booking[];
  clients: Client[];
  onComplete: (clientData: Partial<Client>) => void;
}

export const PublicFNRHForm: React.FC<PublicFNRHFormProps> = ({
  establishment,
  bookings,
  clients,
  onComplete
}) => {
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    documentType: 'CPF',
    birthDate: '',
    gender: '',
    nationality: 'Brasileira',
    profession: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Brasil',
    purpose: 'Turismo',
    transport: 'Avião'
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bId = params.get('b');
    if (bId) {
      setBookingId(bId);
      const foundBooking = bookings.find(b => b.id === bId || b.reservationNumber === bId);
      if (foundBooking) {
        setBooking(foundBooking);
        const foundClient = clients.find(c => c.id === foundBooking.clientId);
        if (foundClient) {
          setClient(foundClient);
          setFormData(prev => ({
            ...prev,
            name: foundClient.name || '',
            email: foundClient.email || '',
            phone: foundClient.phone || '',
            document: foundClient.document || '',
            address: foundClient.address || '',
            city: foundClient.city || '',
            state: foundClient.state || '',
            zipCode: foundClient.zipCode || ''
          }));
        }
      }
    }
  }, [bookings, clients]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(formData);
    setIsSubmitted(true);
    toast.success('FNRH enviada com sucesso!');
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Tudo Pronto!</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Suas informações foram registradas com sucesso. Agradecemos por agilizar o seu check-in!
          </p>
          <button 
            onClick={() => window.close()}
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
          >
            Fechar Janela
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
          <div className="bg-indigo-600 p-10 text-white">
            <div className="flex items-center gap-4 mb-6">
              {establishment.logoUrl ? (
                <img 
                  src={establishment.logoUrl} 
                  alt={establishment.name} 
                  className="w-12 h-12 rounded-2xl object-contain bg-white" 
                  referrerPolicy="no-referrer" 
                />
              ) : (
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                  <Save size={24} />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold">Ficha de Registro (FNRH)</h1>
                <p className="text-indigo-100 font-light">Agilize seu check-in preenchendo seus dados antecipadamente.</p>
              </div>
            </div>
            
            {booking && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex flex-wrap gap-6 text-sm border border-white/10">
                <div className="flex items-center gap-2">
                  <CalendarIcon size={16} className="text-indigo-200" />
                  <span>Reserva: <span className="font-bold">{booking.reservationNumber}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-indigo-200" />
                  <span>Check-in: <span className="font-bold">{format(parseISO(booking.checkIn), 'dd/MM/yyyy')}</span></span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-10">
            {/* Personal Info */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <User size={20} className="text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-800">Dados Pessoais</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nome Completo</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">E-mail</label>
                  <input 
                    required
                    type="email" 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Telefone / WhatsApp</label>
                  <input 
                    required
                    type="tel" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Documento (CPF/Passaporte)</label>
                  <input 
                    required
                    type="text" 
                    value={formData.document}
                    onChange={e => setFormData({...formData, document: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Data de Nascimento</label>
                  <input 
                    required
                    type="date" 
                    value={formData.birthDate}
                    onChange={e => setFormData({...formData, birthDate: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nacionalidade</label>
                  <input 
                    required
                    type="text" 
                    value={formData.nationality}
                    onChange={e => setFormData({...formData, nationality: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
              </div>
            </section>

            {/* Address Info */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <MapPin size={20} className="text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-800">Endereço de Residência</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Endereço</label>
                  <input 
                    required
                    type="text" 
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">CEP</label>
                  <input 
                    required
                    type="text" 
                    value={formData.zipCode}
                    onChange={e => setFormData({...formData, zipCode: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cidade</label>
                  <input 
                    required
                    type="text" 
                    value={formData.city}
                    onChange={e => setFormData({...formData, city: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</label>
                  <input 
                    required
                    type="text" 
                    value={formData.state}
                    onChange={e => setFormData({...formData, state: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">País</label>
                  <input 
                    required
                    type="text" 
                    value={formData.country}
                    onChange={e => setFormData({...formData, country: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
              </div>
            </section>

            {/* Travel Info */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <Plane size={20} className="text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-800">Informações da Viagem</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Motivo da Viagem</label>
                  <select 
                    value={formData.purpose}
                    onChange={e => setFormData({...formData, purpose: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  >
                    <option>Turismo</option>
                    <option>Negócios</option>
                    <option>Saúde</option>
                    <option>Eventos</option>
                    <option>Outros</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Meio de Transporte</label>
                  <select 
                    value={formData.transport}
                    onChange={e => setFormData({...formData, transport: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  >
                    <option>Avião</option>
                    <option>Automóvel</option>
                    <option>Ônibus</option>
                    <option>Trem</option>
                    <option>Navio</option>
                    <option>Outros</option>
                  </select>
                </div>
              </div>
            </section>

            <div className="pt-6">
              <button 
                type="submit"
                className="w-full bg-indigo-600 text-white font-bold py-5 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3"
              >
                <Save size={20} />
                Enviar Ficha de Registro
              </button>
              <p className="text-center text-xs text-slate-400 mt-4">
                Seus dados estão protegidos de acordo com a LGPD e serão utilizados apenas para fins de registro hoteleiro obrigatório.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
