import { useState, useMemo, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { isToday, parseISO, addDays } from 'date-fns';
import { toast } from '../components/ui/Toast';
import { 
  Room, 
  RoomStatus,
  RoomAvailability,
  Booking, 
  Client, 
  Transaction, 
  Staff, 
  RoomCategory, 
  Product, 
  Establishment, 
  SystemUser, 
  YieldRule, 
  GuestPortalConfig, 
  RatePlan, 
  DailyRate,
  SyncLog
} from '../types';
import { 
  INITIAL_ROOMS, 
  INITIAL_BOOKINGS, 
  INITIAL_CLIENTS, 
  INITIAL_STAFF, 
  INITIAL_TRANSACTIONS, 
  INITIAL_ROOM_CATEGORIES, 
  INITIAL_PRODUCTS, 
  INITIAL_YIELD_RULES, 
  INITIAL_GUEST_PORTAL_CONFIG, 
  INITIAL_RATE_PLANS, 
  INITIAL_DAILY_RATES 
} from '../constants';
import { PaymentLink } from '../services/PaymentService';
import { channelSyncService } from '../services/ChannelSyncService';
import { checkBookingConflict } from '../lib/bookingUtils';

export function useHotelData() {
  const [rooms, setRooms] = useLocalStorage<Room[]>('hotel_rooms', INITIAL_ROOMS);
  const [roomCategories, setRoomCategories] = useLocalStorage<RoomCategory[]>('hotel_room_categories', INITIAL_ROOM_CATEGORIES);
  const [bookings, setBookings] = useLocalStorage<Booking[]>('hotel_bookings', INITIAL_BOOKINGS);
  const [clients, setClients] = useLocalStorage<Client[]>('hotel_clients', INITIAL_CLIENTS);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('hotel_transactions', INITIAL_TRANSACTIONS);
  const [staff, setStaff] = useLocalStorage<Staff[]>('hotel_staff', INITIAL_STAFF);
  const [products, setProducts] = useLocalStorage<Product[]>('hotel_products', INITIAL_PRODUCTS);
  const [yieldRules, setYieldRules] = useLocalStorage<YieldRule[]>('hotel_yield_rules', INITIAL_YIELD_RULES);
  const [guestPortalConfig, setGuestPortalConfig] = useLocalStorage<GuestPortalConfig>('hotel_guest_portal_config', INITIAL_GUEST_PORTAL_CONFIG);
  const [paymentLinks, setPaymentLinks] = useLocalStorage<PaymentLink[]>('hotel_payment_links', []);
  const [ratePlans, setRatePlans] = useLocalStorage<RatePlan[]>('hotel_rate_plans', INITIAL_RATE_PLANS);
  const [dailyRates, setDailyRates] = useLocalStorage<DailyRate[]>('hotel_daily_rates', INITIAL_DAILY_RATES);
  const [systemUsers, setSystemUsers] = useLocalStorage<SystemUser[]>('hotel_system_users', [
    { id: 'u1', name: 'Thiago Admin', email: 'ep.Thiago1@gmail.com', role: 'admin', status: 'active' },
    { id: 'u2', name: 'Maria Gerente', email: 'maria@hotelcentral.com', role: 'manager', status: 'active' },
    { id: 'u3', name: 'João Recepção', email: 'joao@hotelcentral.com', role: 'receptionist', status: 'active' }
  ]);
  const [establishment, setEstablishment] = useLocalStorage<Establishment>('hotel_establishment', {
    name: 'Hotel Central',
    logoUrl: 'https://picsum.photos/seed/hotel/200/200',
    address: 'Av. Principal, 123 - Centro, São Paulo - SP',
    phone: '(11) 98765-4321',
    email: 'contato@hotelcentral.com.br',
    slug: 'hotel-central',
    description: 'O melhor refúgio no coração da cidade.',
    aboutHtml: '<p>O Hotel Central oferece conforto e praticidade para sua viagem de negócios ou lazer. Localizado estrategicamente no centro da cidade, estamos próximos aos principais pontos turísticos e centros empresariais.</p>',
    amenities: ['Wi-Fi Grátis', 'Café da Manhã', 'Ar Condicionado', 'Estacionamento'],
    roomFeatures: ['TV', 'Wi-Fi', 'Frigobar', 'Ar Condicionado', 'Cofre', 'Banheira', 'Varanda'],
    heroImageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1920&h=1080'
  });
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);

  const notifications = useMemo(() => {
    const notifs: { id: string; type: 'check-in' | 'check-out' | 'booking'; title: string; message: string; time: Date; bookingId: string }[] = [];
    
    // 1. Check-ins today
    const checkInsToday = bookings.filter(b => isToday(parseISO(b.checkIn)) && ['pre-booking', 'confirmed'].includes(b.status));
    checkInsToday.forEach(b => {
      const client = clients.find(c => c.id === b.clientId);
      notifs.push({
        id: `checkin-${b.id}`,
        type: 'check-in',
        title: 'Check-in Hoje',
        message: `Hóspede ${client?.name || 'Desconhecido'} (Reserva ${b.reservationNumber})`,
        time: parseISO(b.checkIn),
        bookingId: b.id,
      });
    });

    // 2. Check-outs today
    const checkOutsToday = bookings.filter(b => isToday(parseISO(b.checkOut)) && ['checked-in', 'overdue-checkout'].includes(b.status));
    checkOutsToday.forEach(b => {
      const client = clients.find(c => c.id === b.clientId);
      notifs.push({
        id: `checkout-${b.id}`,
        type: 'check-out',
        title: 'Check-out Hoje',
        message: `Hóspede ${client?.name || 'Desconhecido'} (Reserva ${b.reservationNumber})`,
        time: parseISO(b.checkOut),
        bookingId: b.id,
      });
    });

    // 3. All bookings (recent first)
    const activeBookings = bookings.filter(b => !['cancelled', 'no-show', 'blocked'].includes(b.status));
    
    activeBookings.forEach(b => {
      const client = clients.find(c => c.id === b.clientId);
      notifs.push({
        id: `booking-${b.id}`,
        type: 'booking',
        title: b.status === 'pre-booking' ? 'Nova Pré-reserva' : 'Reserva Confirmada',
        message: `Reserva ${b.reservationNumber} para ${client?.name || 'Desconhecido'}`,
        time: parseISO(b.checkIn),
        bookingId: b.id,
      });
    });

    return notifs.sort((a, b) => {
      if (a.type !== 'booking' && b.type === 'booking') return -1;
      if (a.type === 'booking' && b.type !== 'booking') return 1;
      return b.time.getTime() - a.time.getTime();
    });
  }, [bookings, clients]);

  useEffect(() => {
    const interval = setInterval(() => {
      // 5% chance of an incoming booking every 30 seconds
      if (Math.random() < 0.05) {
        const incoming = channelSyncService.simulateIncomingBooking(rooms);
        const client = clients[Math.floor(Math.random() * clients.length)];
        
        if (client) {
          const newBooking: Booking = {
            ...incoming as Booking,
            clientId: client.id,
            totalPrice: (rooms.find(r => r.id === incoming.roomId)?.price || 100) * 3,
            guests: 2,
            consumption: [],
            notes: 'Reserva automática via canal externo.'
          };

          // Check for conflicts before adding
          const checkIn = parseISO(newBooking.checkIn);
          const checkOut = parseISO(newBooking.checkOut);
          if (!checkBookingConflict(bookings, newBooking.roomId, checkIn, checkOut)) {
            setBookings(prev => [...prev, newBooking]);
            toast.success(`Nova reserva recebida via ${newBooking.channel.toUpperCase()}!`, {
              description: `Quarto ${rooms.find(r => r.id === newBooking.roomId)?.number} - ${client.name}`,
              duration: 5000,
            });
          }
        }
      }
      setSyncLogs(channelSyncService.getLogs());
    }, 30000);

    return () => clearInterval(interval);
  }, [rooms, clients, bookings, setBookings]);

  useEffect(() => {
    const checkStatusUpdates = () => {
      const now = new Date();
      setBookings(prev => {
        let changed = false;
        const updated = prev.map(booking => {
          const checkInDate = parseISO(booking.checkIn);
          const checkOutDate = parseISO(booking.checkOut);
          
          let newStatus = booking.status;
          
          // Auto No-Show: If confirmed/pre-booking and 1 day has passed since check-in date
          if ((booking.status === 'confirmed' || booking.status === 'pre-booking') && now > addDays(checkInDate, 1)) {
            newStatus = 'no-show';
          }
          
          // Auto Overdue-Checkout: If checked-in and check-out date has passed
          if (booking.status === 'checked-in' && now > checkOutDate) {
            newStatus = 'overdue-checkout';
          }
          
          if (newStatus !== booking.status) {
            changed = true;
            return { ...booking, status: newStatus };
          }
          return booking;
        });
        return changed ? updated : prev;
      });
    };

    checkStatusUpdates();
    const interval = setInterval(checkStatusUpdates, 60000);
    return () => clearInterval(interval);
  }, [setBookings]);

  // Dynamic Room Status and Availability Updates
  useEffect(() => {
    const updateRoomStatuses = () => {
      const now = new Date();
      setRooms(prevRooms => {
        let changed = false;
        const updatedRooms = prevRooms.map(room => {
          // Find all active bookings for this room for today
          const roomBookings = bookings.filter(b => b.roomId === room.id && !['cancelled', 'no-show'].includes(b.status));
          
          let newAvailability: RoomAvailability = 'available';
          let newStatus: RoomStatus = room.status;

          // Check for active booking today (ongoing stay)
          const activeBooking = roomBookings.find(b => {
            const checkIn = parseISO(b.checkIn);
            const checkOut = parseISO(b.checkOut);
            // A room is considered occupied/reserved if today is between checkIn and checkOut
            // We use startOfDay to compare dates correctly
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const bCheckIn = new Date(checkIn);
            bCheckIn.setHours(0, 0, 0, 0);
            const bCheckOut = new Date(checkOut);
            bCheckOut.setHours(0, 0, 0, 0);

            return (today >= bCheckIn && today < bCheckOut) || (today.getTime() === bCheckIn.getTime());
          });

          if (activeBooking) {
            if (activeBooking.status === 'checked-in' || activeBooking.status === 'overdue-checkout') {
              newAvailability = 'occupied';
            } else if (activeBooking.status === 'blocked') {
              newAvailability = 'blocked';
            } else if (activeBooking.status === 'pre-booking' || activeBooking.status === 'confirmed') {
              newAvailability = 'reserved';
            } else if (activeBooking.status === 'checked-out') {
              newAvailability = 'available';
            }
          } else {
            newAvailability = 'available';
          }

          if (newAvailability !== room.availability || newStatus !== room.status) {
            changed = true;
            return { ...room, availability: newAvailability, status: newStatus };
          }
          return room;
        });
        return changed ? updatedRooms : prevRooms;
      });
    };

    updateRoomStatuses();
    // We don't need a separate interval here as it depends on bookings which has its own interval
  }, [bookings, setRooms]);

  return {
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
  };
}
