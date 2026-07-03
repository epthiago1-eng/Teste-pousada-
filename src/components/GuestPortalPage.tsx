import React, { useCallback, useMemo, lazy, Suspense } from 'react';
import { 
  Info, 
  MapPin, 
  Utensils, 
  Tv, 
  MessageCircle, 
  ExternalLink, 
  Phone,
  Truck,
  ShieldCheck,
  Wifi,
  Clock,
  Sun,
  Moon,
  AlertCircle,
  Share2,
  PhoneCall
} from 'lucide-react';
import { GuestPortalConfig, Establishment } from '../types';

interface GuestPortalPageProps {
  config: GuestPortalConfig;
  establishment: Establishment;
}

// ========== SUBCOMPONENTES MEMOIZADOS ==========

const PolicyCard = React.memo(({ policies }: { policies: string }) => (
  <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
    <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex items-center gap-2">
      <Info size={18} className="text-indigo-600" />
      <h2 className="font-bold text-indigo-900">Políticas da Hospedagem</h2>
    </div>
    <div className="p-4">
      <div className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
        {policies}
      </div>
    </div>
  </section>
));

const DeliveryAddress = React.memo(({ address }: { address: string }) => {
  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(address);
  }, [address]);

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-start gap-3">
      <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
        <Truck size={20} />
      </div>
      <div className="flex-1">
        <h2 className="font-bold text-slate-800 text-sm mb-1">Endereço para Delivery</h2>
        <p className="text-xs text-slate-500 mb-2">{address}</p>
        <button 
          onClick={copyToClipboard}
          className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider hover:text-indigo-800 transition-colors"
          aria-label="Copiar endereço para área de transferência"
        >
          Copiar Endereço
        </button>
      </div>
    </section>
  );
});

const TouristSpotItem = React.memo(({ spot }: { spot: any }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
    <h3 className="font-bold text-slate-800 mb-1">{spot.name}</h3>
    <p className="text-xs text-slate-500 mb-3">{spot.description}</p>
    {spot.link && (
      <a 
        href={spot.link} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
        aria-label={`Ver ${spot.name} no mapa`}
      >
        Ver no Mapa <ExternalLink size={12} />
      </a>
    )}
  </div>
));

const RestaurantItem = React.memo(({ restaurant }: { restaurant: any }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex justify-between items-center">
    <div>
      <h3 className="font-bold text-slate-800 mb-0.5">{restaurant.name}</h3>
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{restaurant.cuisine}</p>
    </div>
    <div className="flex gap-2">
      {restaurant.phone && (
        <a 
          href={`tel:${restaurant.phone}`} 
          className="p-2 bg-slate-50 text-slate-600 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors"
          aria-label={`Ligar para ${restaurant.name}`}
        >
          <Phone size={16} />
        </a>
      )}
      {restaurant.link && (
        <a 
          href={restaurant.link} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="p-2 bg-slate-50 text-slate-600 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors"
          aria-label={`Visitar site do ${restaurant.name}`}
        >
          <ExternalLink size={16} />
        </a>
      )}
    </div>
  </div>
));

const TVChannelList = React.memo(({ channels }: { channels: any[] }) => (
  <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
    <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
      <Tv size={18} className="text-slate-600" />
      <h2 className="font-bold text-slate-800">Canais de TV</h2>
    </div>
    <div className="divide-y divide-slate-50">
      {channels.map(channel => (
        <div key={channel.id} className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-600 text-xs">
              {channel.number}
            </span>
            <span className="text-sm font-medium text-slate-700">{channel.name}</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{channel.category}</span>
        </div>
      ))}
    </div>
  </section>
));

const WifiInfo = React.memo(({ ssid, password }: { ssid?: string; password?: string }) => {
  if (!ssid || !password) return null;
  
  const copyWifi = useCallback(() => {
    navigator.clipboard.writeText(`SSID: ${ssid}\nSenha: ${password}`);
  }, [ssid, password]);

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-start gap-3">
      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
        <Wifi size={20} />
      </div>
      <div className="flex-1">
        <h2 className="font-bold text-slate-800 text-sm mb-1">Wi-Fi do Estabelecimento</h2>
        <p className="text-xs text-slate-600 mb-1"><strong>Rede:</strong> {ssid}</p>
        <p className="text-xs text-slate-600 mb-2"><strong>Senha:</strong> {password}</p>
        <button 
          onClick={copyWifi}
          className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider hover:text-indigo-800 transition-colors"
          aria-label="Copiar dados do Wi-Fi"
        >
          Copiar Credenciais
        </button>
      </div>
    </section>
  );
});

const ScheduleInfo = React.memo(({ 
  checkin, checkout, breakfast 
}: { 
  checkin?: string; checkout?: string; breakfast?: string 
}) => {
  if (!checkin && !checkout && !breakfast) return null;

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-start gap-3">
      <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center shrink-0">
        <Clock size={20} />
      </div>
      <div className="flex-1">
        <h2 className="font-bold text-slate-800 text-sm mb-2">Horários</h2>
        <div className="space-y-1 text-xs text-slate-600">
          {checkin && <p><strong>Check-in:</strong> {checkin}</p>}
          {checkout && <p><strong>Check-out:</strong> {checkout}</p>}
          {breakfast && <p><strong>Café da manhã:</strong> {breakfast}</p>}
        </div>
      </div>
    </section>
  );
});

const EmergencyContacts = React.memo(({ contacts }: { contacts?: Array<{ name: string; phone: string }> }) => {
  if (!contacts || contacts.length === 0) return null;

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4 bg-red-50 border-b border-red-100 flex items-center gap-2">
        <AlertCircle size={18} className="text-red-600" />
        <h2 className="font-bold text-red-900">Contatos de Emergência</h2>
      </div>
      <div className="divide-y divide-slate-50">
        {contacts.map((contact, idx) => (
          <div key={idx} className="p-3 flex justify-between items-center">
            <span className="text-sm font-medium text-slate-700">{contact.name}</span>
            <a 
              href={`tel:${contact.phone}`}
              className="flex items-center gap-2 text-sm text-indigo-600 font-medium"
              aria-label={`Ligar para ${contact.name}`}
            >
              <PhoneCall size={14} /> {contact.phone}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
});

const ShareButton = React.memo(() => {
  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Portal do Hóspede',
          text: 'Confira as informações da sua hospedagem',
          url: window.location.href,
        });
      } catch (err) {
        console.log('Erro ao compartilhar:', err);
      }
    } else {
      // Fallback: copiar link
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  }, []);

  return (
    <button
      onClick={handleShare}
      className="fixed top-4 right-4 z-50 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-all"
      aria-label="Compartilhar este portal"
    >
      <Share2 size={20} className="text-slate-700" />
    </button>
  );
});

// ========== COMPONENTE PRINCIPAL ==========

export const GuestPortalPage: React.FC<GuestPortalPageProps> = ({ config, establishment }) => {
  // Memoizações de dados que não mudam
  const touristSpotsList = useMemo(() => config.touristSpots, [config.touristSpots]);
  const restaurantsList = useMemo(() => config.restaurants, [config.restaurants]);
  const tvChannelsList = useMemo(() => config.tvChannels, [config.tvChannels]);

  const handleWhatsApp = useCallback(() => {
    window.open(`https://wa.me/${config.whatsappNumber}`, '_blank');
  }, [config.whatsappNumber]);

  const handleCall = useCallback(() => {
    if (config.phoneNumber) {
      window.location.href = `tel:${config.phoneNumber}`;
    }
  }, [config.phoneNumber]);

  if (!config.isActive) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Portal Indisponível</h1>
          <p className="text-slate-500">O portal do hóspede não está ativo no momento. Por favor, entre em contato com a recepção.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Botão de compartilhar */}
      <ShareButton />

      {/* Hero Section com lazy loading */}
      <div className="relative h-48 bg-slate-900 overflow-hidden">
        <img 
          src={establishment.heroImageUrl || "https://picsum.photos/seed/pousada/800/400"} 
          alt={`Fachada do ${establishment.name}`}
          className="w-full h-full object-cover opacity-60"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center bg-black/20">
          {establishment.logoUrl ? (
            <img 
              src={establishment.logoUrl} 
              alt={`Logo do ${establishment.name}`}
              className="w-16 h-16 rounded-full border-2 border-white mb-3 bg-white object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-16 h-16 rounded-full border-2 border-white mb-3 bg-slate-800 flex items-center justify-center">
              <span className="text-2xl font-bold">{establishment.name.charAt(0)}</span>
            </div>
          )}
          <h1 className="text-2xl font-bold">{establishment.name}</h1>
          <p className="text-sm opacity-90">Guia Digital do Hóspede</p>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Wi-Fi */}
        <WifiInfo ssid={config.wifiSsid} password={config.wifiPassword} />

        {/* Horários */}
        <ScheduleInfo 
          checkin={config.checkinTime} 
          checkout={config.checkoutTime} 
          breakfast={config.breakfastTime} 
        />

        {/* Políticas */}
        <PolicyCard policies={config.policies} />

        {/* Endereço para Delivery */}
        <DeliveryAddress address={config.deliveryAddress} />

        {/* Pontos Turísticos */}
        {touristSpotsList.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 px-1">
              <MapPin size={18} className="text-rose-500" />
              Pontos Turísticos
            </h2>
            <div className="grid gap-3">
              {touristSpotsList.map(spot => (
                <TouristSpotItem key={spot.id} spot={spot} />
              ))}
            </div>
          </section>
        )}

        {/* Restaurantes Recomendados */}
        {restaurantsList.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 px-1">
              <Utensils size={18} className="text-emerald-500" />
              Restaurantes Recomendados
            </h2>
            <div className="grid gap-3">
              {restaurantsList.map(rest => (
                <RestaurantItem key={rest.id} restaurant={rest} />
              ))}
            </div>
          </section>
        )}

        {/* Canais de TV */}
        {tvChannelsList.length > 0 && <TVChannelList channels={tvChannelsList} />}

        {/* Contatos de Emergência */}
        <EmergencyContacts contacts={config.emergencyContacts} />
      </div>

      {/* Botões flutuantes duplos (WhatsApp e Telefone) */}
      <div className="fixed bottom-6 left-0 right-0 px-6 z-50 flex flex-col gap-3">
        {config.phoneNumber && (
          <button 
            onClick={handleCall}
            className="w-full h-12 bg-indigo-500 text-white rounded-2xl shadow-xl shadow-indigo-200 flex items-center justify-center gap-2 font-bold hover:bg-indigo-600 transition-all active:scale-95"
            aria-label="Ligar para a recepção"
          >
            <PhoneCall size={20} />
            Ligar para a Recepção
          </button>
        )}
        <button 
          onClick={handleWhatsApp}
          className="w-full h-14 bg-emerald-500 text-white rounded-2xl shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 font-bold text-lg hover:bg-emerald-600 transition-all active:scale-95"
          aria-label="Abrir conversa no WhatsApp com a recepção"
        >
          <MessageCircle size={24} />
          Falar com a Recepção
        </button>
      </div>
    </div>
  );
};