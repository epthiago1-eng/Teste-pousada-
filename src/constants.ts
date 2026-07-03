import { Room, Booking, Client, Transaction, Staff, RoomCategory, Product, YieldRule, GuestPortalConfig, RatePlan, DailyRate } from './types';
import { addDays, startOfToday, format, setHours, eachDayOfInterval } from 'date-fns';

const today = startOfToday();

export const INITIAL_GUEST_PORTAL_CONFIG: GuestPortalConfig = {
  isActive: true,
  policies: 'Check-in: 14:00 | Check-out: 12:00\nSilêncio após as 22:00\nProibido fumar nos quartos\nCafé da manhã: 07:30 às 10:00',
  deliveryAddress: 'Rua das Baleias, 123 - Centro, Arraial do Cabo - RJ, 28930-000',
  whatsappNumber: '5511998877665',
  phoneNumber: '551133334444',
  wifiSsid: 'Hotel_Guest',
  wifiPassword: 'guestpassword',
  checkinTime: '14:00',
  checkoutTime: '12:00',
  breakfastTime: '07:30 às 10:00',
  emergencyContacts: [
    { id: 'em1', name: 'Recepção (24h)', phone: '22 9999-0000' }
  ],
  touristSpots: [
    { id: 'ts1', name: 'Praia do Forno', description: 'Acesso por trilha ou barco, águas cristalinas.', link: 'https://maps.google.com' },
    { id: 'ts2', name: 'Pontal do Atalaia', description: 'Famosas escadarias e pôr do sol inesquecível.', link: 'https://maps.google.com' }
  ],
  restaurants: [
    { id: 'r1', name: 'Bacalhau do Tuga', cuisine: 'Portuguesa/Frutos do Mar', phone: '22 9999-8888' },
    { id: 'r2', name: 'Pimenta Rosa', cuisine: 'Contemporânea', phone: '22 7777-6666' }
  ],
  tvChannels: [
    { id: 'tv1', number: '05', name: 'Globo', category: 'Aberta' },
    { id: 'tv2', number: '40', name: 'HBO', category: 'Filmes' },
    { id: 'tv3', number: '51', name: 'SporTV', category: 'Esportes' }
  ]
};

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Água Mineral 500ml', type: 'product', price: 5.00, stockQuantity: 150, minStockAlert: 20 },
  { id: 'p2', name: 'Refrigerante Lata', type: 'product', price: 8.00, stockQuantity: 80, minStockAlert: 15 },
  { id: 'p3', name: 'Cerveja Long Neck', type: 'product', price: 12.00, stockQuantity: 120, minStockAlert: 30 },
  { id: 'p4', name: 'Vinho Tinto Seco', type: 'product', price: 85.00, stockQuantity: 24, minStockAlert: 5 },
  { id: 'p5', name: 'Chocolate Barra', type: 'product', price: 7.50, stockQuantity: 45, minStockAlert: 10 },
  { id: 'p6', name: 'Kit Higiene Premium', type: 'product', price: 25.00, stockQuantity: 30, minStockAlert: 5 },
  { id: 's1', name: 'Lavanderia (Peça)', type: 'service', price: 15.00 },
  { id: 's2', name: 'Massagem Relaxante (1h)', type: 'service', price: 150.00 },
  { id: 's3', name: 'Café da Manhã no Quarto', type: 'service', price: 45.00 },
  { id: 's4', name: 'Translado Aeroporto', type: 'service', price: 120.00 },
];

export const INITIAL_ROOM_CATEGORIES: RoomCategory[] = [
  { id: 'cat1', name: 'Standard', maxGuests: 2, maxAdults: 2, maxChildren: 1 },
  { id: 'cat2', name: 'Deluxe', maxGuests: 3, maxAdults: 2, maxChildren: 2 },
  { id: 'cat3', name: 'Suíte Master', maxGuests: 4, maxAdults: 4, maxChildren: 2 },
  { id: 'cat4', name: 'Econômico', maxGuests: 1, maxAdults: 1, maxChildren: 0 },
];

export const INITIAL_ROOMS: Room[] = [
  { 
    id: '1', 
    number: '101', 
    category: 'Standard', 
    status: 'clean', 
    availability: 'occupied', 
    price: 180,
    description: 'Quarto aconchegante com vista para o jardim.',
    singleBeds: 0,
    doubleBeds: 1,
    photos: ['https://picsum.photos/seed/room101/800/600'],
    features: ['Wi-Fi', 'TV', 'Ar Condicionado']
  },
  { 
    id: '2', 
    number: '102', 
    category: 'Standard', 
    status: 'dirty', 
    availability: 'available', 
    price: 180,
    description: 'Quarto padrão com mesa de trabalho.',
    singleBeds: 2,
    doubleBeds: 0,
    photos: ['https://picsum.photos/seed/room102/800/600'],
    features: ['Wi-Fi', 'Mesa de Trabalho']
  },
  { 
    id: '3', 
    number: '103', 
    category: 'Standard', 
    status: 'clean', 
    availability: 'available', 
    price: 180,
    description: 'Quarto arejado e iluminado.',
    singleBeds: 0,
    doubleBeds: 1,
    photos: ['https://picsum.photos/seed/room103/800/600'],
    features: ['Wi-Fi', 'TV']
  },
  { 
    id: '4', 
    number: '104', 
    category: 'Deluxe', 
    status: 'clean', 
    availability: 'occupied', 
    price: 250,
    description: 'Suíte luxuosa com varanda privativa.',
    singleBeds: 0,
    doubleBeds: 1,
    photos: ['https://picsum.photos/seed/room104/800/600', 'https://picsum.photos/seed/room104-2/800/600'],
    features: ['Wi-Fi', 'TV 4K', 'Frigobar', 'Varanda']
  },
  { 
    id: '5', 
    number: '201', 
    category: 'Deluxe', 
    status: 'clean', 
    availability: 'occupied', 
    price: 250,
    description: 'Quarto deluxe com decoração moderna.',
    singleBeds: 1,
    doubleBeds: 1,
    photos: ['https://picsum.photos/seed/room201/800/600'],
    features: ['Wi-Fi', 'TV', 'Frigobar']
  },
  { 
    id: '6', 
    number: '202', 
    category: 'Deluxe', 
    status: 'dirty', 
    availability: 'available', 
    price: 250,
    description: 'Espaçoso e confortável para famílias.',
    singleBeds: 2,
    doubleBeds: 1,
    photos: ['https://picsum.photos/seed/room202/800/600'],
    features: ['Wi-Fi', 'TV', 'Frigobar']
  },
  { 
    id: '7', 
    number: '301', 
    category: 'Suíte Master', 
    status: 'clean', 
    availability: 'available', 
    price: 450,
    description: 'A melhor suíte do hotel com hidromassagem.',
    singleBeds: 0,
    doubleBeds: 2,
    photos: ['https://picsum.photos/seed/room301/800/600', 'https://picsum.photos/seed/room301-2/800/600', 'https://picsum.photos/seed/room301-3/800/600'],
    features: ['Wi-Fi', 'TV 65"', 'Frigobar Premium', 'Hidromassagem', 'Vista Mar']
  },
  { 
    id: '8', 
    number: '302', 
    category: 'Suíte Master', 
    status: 'clean', 
    availability: 'occupied', 
    price: 450,
    description: 'Suíte master com dois ambientes.',
    singleBeds: 0,
    doubleBeds: 2,
    photos: ['https://picsum.photos/seed/room302/800/600'],
    features: ['Wi-Fi', 'TV', 'Frigobar', 'Sala de Estar']
  },
  { 
    id: '9', 
    number: '001', 
    category: 'Econômico', 
    status: 'clean', 
    availability: 'available', 
    price: 120,
    description: 'Quarto compacto e funcional.',
    singleBeds: 1,
    doubleBeds: 0,
    photos: ['https://picsum.photos/seed/room001/800/600'],
    features: ['Wi-Fi']
  },
  { 
    id: '10', 
    number: '002', 
    category: 'Econômico', 
    status: 'dirty', 
    availability: 'available', 
    price: 120,
    description: 'Ideal para viajantes individuais.',
    singleBeds: 1,
    doubleBeds: 0,
    photos: ['https://picsum.photos/seed/room002/800/600'],
    features: ['Wi-Fi']
  },
];

export const INITIAL_CLIENTS: Client[] = [
  { id: 'c1', name: 'Ricardo Oliveira', email: 'ricardo.oliveira@email.com', phone: '+55 11 99887-7665', document: '123.456.789-00', birthDate: '1985-05-20' },
  { id: 'c2', name: 'Ana Beatriz Silva', email: 'ana.beatriz@email.com', phone: '+55 21 98765-4321', document: '987.654.321-11', birthDate: '1992-10-12' },
  { id: 'c3', name: 'Marcos Santos', email: 'marcos.santos@email.com', phone: '+55 31 97766-5544', document: '456.789.123-22', birthDate: '1978-03-15' },
  { id: 'c4', name: 'Juliana Costa', email: 'juliana.costa@email.com', phone: '+55 41 96655-4433', document: '321.654.987-33', birthDate: '1990-08-25' },
  { id: 'c5', name: 'Fernando Souza', email: 'fernando.souza@email.com', phone: '+55 51 95544-3322', document: '789.123.456-44', birthDate: '1982-12-30' },
  { id: 'c6', name: 'Patrícia Lima', email: 'patricia.lima@email.com', phone: '+55 61 94433-2211', document: '654.321.789-55', birthDate: '1988-01-05' },
  { id: 'c7', name: 'Bruno Henrique', email: 'bruno.henrique@email.com', phone: '+55 11 91234-5678', document: '111.222.333-44', birthDate: '1995-07-10' },
  { id: 'c8', name: 'Camila Rocha', email: 'camila.rocha@email.com', phone: '+55 11 98765-4321', document: '555.666.777-88', birthDate: '1991-02-28' },
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    reservationNumber: 'RES-2024-001',
    roomId: '1',
    clientId: 'c1',
    checkIn: format(addDays(today, -2), "yyyy-MM-dd'T'14:00:00"),
    checkOut: format(addDays(today, 3), "yyyy-MM-dd'T'12:00:00"),
    totalPrice: 900,
    guests: 2,
    status: 'checked-in',
    paymentStatus: 'partial',
    channel: 'direct',
    consumption: [
      { id: 'cons1', description: 'Água Mineral', amount: 5, date: format(addDays(today, -1), "yyyy-MM-dd") },
      { id: 'cons2', description: 'Refrigerante', amount: 8, date: format(today, "yyyy-MM-dd") },
    ]
  },
  {
    id: 'b2',
    reservationNumber: 'RES-2024-002',
    roomId: '4',
    clientId: 'c2',
    checkIn: format(addDays(today, 1), "yyyy-MM-dd'T'14:00:00"),
    checkOut: format(addDays(today, 5), "yyyy-MM-dd'T'12:00:00"),
    totalPrice: 1000,
    guests: 2,
    status: 'confirmed',
    paymentStatus: 'full',
    channel: 'booking.com',
    consumption: []
  },
  {
    id: 'b3',
    reservationNumber: 'RES-2024-003',
    roomId: '5',
    clientId: 'c3',
    checkIn: format(addDays(today, -1), "yyyy-MM-dd'T'14:00:00"),
    checkOut: format(addDays(today, 2), "yyyy-MM-dd'T'12:00:00"),
    totalPrice: 750,
    guests: 2,
    status: 'checked-in',
    paymentStatus: 'none',
    channel: 'website',
    consumption: [
      { id: 'cons3', description: 'Vinho Tinto', amount: 85, date: format(today, "yyyy-MM-dd") },
    ]
  },
  {
    id: 'b4',
    reservationNumber: 'RES-2024-004',
    roomId: '8',
    clientId: 'c4',
    checkIn: format(addDays(today, 4), "yyyy-MM-dd'T'14:00:00"),
    checkOut: format(addDays(today, 10), "yyyy-MM-dd'T'12:00:00"),
    totalPrice: 2700,
    guests: 2,
    status: 'confirmed',
    paymentStatus: 'partial',
    channel: 'expedia',
    consumption: []
  },
  {
    id: 'b5',
    reservationNumber: 'RES-2024-005',
    roomId: '2',
    clientId: 'c5',
    checkIn: format(addDays(today, -5), "yyyy-MM-dd'T'14:00:00"),
    checkOut: format(addDays(today, -1), "yyyy-MM-dd'T'12:00:00"),
    totalPrice: 720,
    guests: 2,
    status: 'checked-out',
    paymentStatus: 'full',
    channel: 'direct',
    consumption: []
  },
  {
    id: 'b6',
    reservationNumber: 'RES-2024-006',
    roomId: '3',
    clientId: 'c6',
    checkIn: format(today, "yyyy-MM-dd'T'14:00:00"),
    checkOut: format(addDays(today, 2), "yyyy-MM-dd'T'12:00:00"),
    totalPrice: 360,
    guests: 2,
    status: 'pre-booking',
    paymentStatus: 'none',
    channel: 'website',
    consumption: []
  },
  {
    id: 'b7',
    reservationNumber: 'RES-2024-007',
    roomId: '1',
    clientId: 'c7',
    checkIn: format(addDays(today, 3), "yyyy-MM-dd'T'14:00:00"),
    checkOut: format(addDays(today, 6), "yyyy-MM-dd'T'12:00:00"),
    totalPrice: 540,
    guests: 2,
    status: 'confirmed',
    paymentStatus: 'none',
    channel: 'airbnb',
    consumption: []
  },
  {
    id: 'b8',
    reservationNumber: 'RES-2024-008',
    roomId: '2',
    clientId: 'c8',
    checkIn: format(addDays(today, -1), "yyyy-MM-dd'T'14:00:00"),
    checkOut: format(addDays(today, 1), "yyyy-MM-dd'T'12:00:00"),
    totalPrice: 360,
    guests: 2,
    status: 'confirmed',
    paymentStatus: 'full',
    channel: 'direct',
    consumption: []
  }
];

export const INITIAL_STAFF: Staff[] = [
  { id: 's1', name: 'Carlos Oliveira', role: 'Limpeza', salary: 2200 },
  { id: 's2', name: 'Ana Paula', role: 'Recepcionista', salary: 2800 },
  { id: 's3', name: 'Roberto Silva', role: 'Gerente', salary: 5500 },
  { id: 's4', name: 'Mariana Santos', role: 'Cozinha', salary: 2400 },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 't1', type: 'income', category: 'booking', amount: 900, description: 'Reserva Ricardo Oliveira', date: format(addDays(today, -2), "yyyy-MM-dd") },
  { id: 't2', type: 'expense', category: 'supplies', amount: 350, description: 'Reposição de Frigobar', date: format(addDays(today, -1), "yyyy-MM-dd") },
  { id: 't3', type: 'expense', category: 'maintenance', amount: 150, description: 'Reparo Ar Condicionado 102', date: format(today, "yyyy-MM-dd") },
  { id: 't4', type: 'income', category: 'service', amount: 150, description: 'Serviço de Massagem - B3', date: format(today, "yyyy-MM-dd") },
];

export const INITIAL_YIELD_RULES: YieldRule[] = [
  {
    id: 'yr1',
    name: 'Alta Ocupação (> 80%)',
    type: 'occupancy',
    config: { minOccupancy: 80 },
    adjustmentType: 'percentage',
    adjustmentValue: 20,
    isActive: true
  },
  {
    id: 'yr2',
    name: 'Baixa Ocupação (< 30%)',
    type: 'occupancy',
    config: { maxOccupancy: 30 },
    adjustmentType: 'percentage',
    adjustmentValue: -15,
    isActive: true
  },
  {
    id: 'yr3',
    name: 'Reserva Antecipada (> 30 dias)',
    type: 'lead-time',
    config: { minDaysLead: 30 },
    adjustmentType: 'percentage',
    adjustmentValue: -10,
    isActive: true
  },
  {
    id: 'yr4',
    name: 'Última Hora (< 2 dias)',
    type: 'lead-time',
    config: { maxDaysLead: 2 },
    adjustmentType: 'percentage',
    adjustmentValue: 25,
    isActive: true
  },
  {
    id: 'yr5',
    name: 'Temporada de Verão',
    type: 'seasonality',
    config: { startDate: '2025-12-01', endDate: '2026-03-31' },
    adjustmentType: 'percentage',
    adjustmentValue: 30,
    isActive: true
  }
];

export const INITIAL_RATE_PLANS: RatePlan[] = [
  { id: 'rp1', name: 'Tarifa Padrão', category: 'Standard' },
  { id: 'rp2', name: 'Tarifa Padrão', category: 'Deluxe' },
  { id: 'rp3', name: 'Tarifa Padrão', category: 'Suíte Master' },
  { id: 'rp4', name: 'Tarifa Padrão', category: 'Econômico' },
  { id: 'rp5', name: 'Final de Semana', category: 'Standard' },
];

export const INITIAL_DAILY_RATES: DailyRate[] = [];

// Generate some initial rates for the next 30 days
const startDate = startOfToday();
const endDate = addDays(startDate, 30);
const days = eachDayOfInterval({ start: startDate, end: endDate });

INITIAL_RATE_PLANS.forEach(plan => {
  const basePrice = plan.category === 'Standard' ? 180 : 
                    plan.category === 'Deluxe' ? 250 : 
                    plan.category === 'Suíte Master' ? 450 : 120;
  
  days.forEach(day => {
    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
    let price = basePrice;
    
    if (plan.name === 'Final de Semana' && isWeekend) {
      price = basePrice * 1.2;
    } else if (plan.name === 'Final de Semana' && !isWeekend) {
      return; // Skip weekday for weekend plan
    }

    INITIAL_DAILY_RATES.push({
      id: `dr-${plan.id}-${format(day, 'yyyyMMdd')}`,
      ratePlanId: plan.id,
      date: format(day, 'yyyy-MM-dd'),
      price: price
    });
  });
});
