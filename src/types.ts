export type Role = 'admin' | 'manager' | 'receptionist' | 'housekeeper';

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  receptionist: 'Recepção',
  housekeeper: 'Governança',
};

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  tenantId: string;
  role: Role;
  status: 'active' | 'inactive';
  inviteCode?: string;
}

export interface Tenant {
  id: string;
  ownerUid: string;
  name: string;
  slug: string;
  logoUrl?: string;
  heroImageUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
  amenities?: string[];
  checkinTime?: string;
  checkoutTime?: string;
  breakfastTime?: string;
  wifiSsid?: string;
  wifiPassword?: string;
  whatsappNumber?: string;
  policies?: string;
  publicBookingEnabled?: boolean;
  guestPortalEnabled?: boolean;
  portalSubtitle?: string;
  deliveryAddress?: string;
  touristSpots?: { id: string; name: string; description?: string }[];
  restaurants?: { id: string; name: string; cuisine?: string; phone?: string }[];
  emergencyContacts?: { id: string; name: string; phone: string }[];
  tvChannels?: { id: string; number: string; name: string }[];
  messageTemplates?: Record<string, string>;
  createdAt?: string;
}

export type RoomStatus = 'clean' | 'dirty' | 'cleaning' | 'inspected' | 'maintenance';

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  clean: 'Limpo',
  dirty: 'Sujo',
  cleaning: 'Em limpeza',
  inspected: 'Inspecionado',
  maintenance: 'Manutenção',
};

export interface RoomCategory {
  id: string;
  name: string;
  maxGuests: number;
  basePrice: number;
  description?: string;
  photos?: string[];
}

export interface Room {
  id: string;
  number: string;
  categoryId: string;
  status: RoomStatus;
  price?: number; // sobrescreve preço da categoria se definido
  description?: string;
  singleBeds?: number;
  doubleBeds?: number;
  features?: string[];
  photos?: string[]; // primeira = principal
  notes?: string;
  updatedAt?: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone: string;
  document?: string;
  nationality?: string;
  birthDate?: string;
  city?: string;
  state?: string;
  address?: string;
  notes?: string;
  createdAt?: string;
}

export type BookingStatus =
  | 'pre-booking'
  | 'confirmed'
  | 'checked-in'
  | 'checked-out'
  | 'cancelled'
  | 'no-show'
  | 'blocked';

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  'pre-booking': 'Pré-reserva',
  confirmed: 'Confirmada',
  'checked-in': 'Hospedado',
  'checked-out': 'Finalizada',
  cancelled: 'Cancelada',
  'no-show': 'No-show',
  blocked: 'Bloqueio',
};

export type Channel = 'direct' | 'website' | 'booking.com' | 'airbnb' | 'expedia' | 'other';

export const CHANNEL_LABELS: Record<Channel, string> = {
  direct: 'Direto',
  website: 'Site',
  'booking.com': 'Booking.com',
  airbnb: 'Airbnb',
  expedia: 'Expedia',
  other: 'Outro',
};

export interface ConsumptionItem {
  id: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  date: string;
}

export interface Payment {
  id: string;
  amount: number;
  method: 'cash' | 'pix' | 'credit' | 'debit' | 'transfer' | 'other';
  date: string;
  notes?: string;
}

export const PAYMENT_METHOD_LABELS: Record<Payment['method'], string> = {
  cash: 'Dinheiro',
  pix: 'Pix',
  credit: 'Crédito',
  debit: 'Débito',
  transfer: 'Transferência',
  other: 'Outro',
};

export interface Booking {
  id: string;
  reservationNumber: string;
  roomId: string;
  clientId?: string; // vazio em bloqueios
  checkIn: string; // yyyy-MM-dd
  checkOut: string; // yyyy-MM-dd
  adults: number;
  children: number;
  totalPrice: number;
  status: BookingStatus;
  channel: Channel;
  consumption: ConsumptionItem[];
  payments: Payment[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookingRequest {
  id: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  categoryId?: string;
  checkIn: string;
  checkOut: string;
  adults?: number;
  children?: number;
  notes?: string;
  status?: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface FnrhForm {
  id: string;
  bookingRef?: string;
  name: string;
  document: string;
  documentType?: string;
  nationality?: string;
  birthDate?: string;
  profession?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  lastCity?: string;
  nextCity?: string;
  transport?: string;
  travelReason?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  type: 'product' | 'service';
  price: number;
  stockQuantity?: number;
  minStockAlert?: number;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: 'booking' | 'staff' | 'maintenance' | 'supplies' | 'service' | 'other';
  amount: number;
  description: string;
  date: string; // yyyy-MM-dd
  bookingId?: string;
}

export const TRANSACTION_CATEGORY_LABELS: Record<Transaction['category'], string> = {
  booking: 'Hospedagem',
  staff: 'Equipe',
  maintenance: 'Manutenção',
  supplies: 'Suprimentos',
  service: 'Serviços',
  other: 'Outros',
};

export interface Staff {
  id: string;
  name: string;
  role: string;
  phone?: string;
  salary?: number;
  lastPaymentDate?: string;
  notes?: string;
}

export interface RatePlan {
  id: string;
  name: string;
  categoryId: string;
  basePrice: number;
  minStay?: number;
  mealPlan?: 'room-only' | 'breakfast' | 'half-board' | 'full-board';
  cancellationPolicy?: 'flexible' | 'non-refundable';
  pricesByDayOfWeek?: Record<number, number>; // 0=domingo (dia em que a noite começa)
  dailyOverrides?: Record<string, number>; // 'yyyy-MM-dd' → preço especial da data
  maxStay?: number;
  notes?: string;
  validFrom?: string;
  validTo?: string;
  active: boolean;
}

export interface Invite {
  id: string; // o próprio código
  role: Role;
  used: boolean;
  createdAt: string;
}

/** Modelos de mensagem WhatsApp — placeholders: {nome} {pousada} {quarto} {checkin} {checkout} {noites} {valor} {hora_checkin} {hora_checkout} {link_fnrh} {link_portal} */
export const DEFAULT_MESSAGE_TEMPLATES: { key: string; label: string; emoji: string; text: string }[] = [
  {
    key: 'confirmation',
    label: 'Confirmação de reserva',
    emoji: '✅',
    text: 'Olá, {nome}! 🎉\n\nSua reserva na *{pousada}* está confirmada!\n\n🛏️ Acomodação: Quarto {quarto}\n📅 Check-in: {checkin} (a partir das {hora_checkin})\n📅 Check-out: {checkout} (até {hora_checkout})\n🌙 {noites} noite(s) — Total: {valor}\n\nQualquer dúvida, é só chamar por aqui. Até breve! 🌺',
  },
  {
    key: 'reminder',
    label: 'Lembrete de hospedagem',
    emoji: '⏰',
    text: 'Olá, {nome}! Tudo bem? 😊\n\nPassando para lembrar da sua hospedagem na *{pousada}*:\n\n📅 Check-in: {checkin} a partir das {hora_checkin}\n🛏️ Quarto {quarto}\n\nEstamos preparando tudo para a sua chegada! Se precisar de alguma coisa, é só avisar. 🌺',
  },
  {
    key: 'fnrh',
    label: 'Pedir ficha (FNRH)',
    emoji: '📝',
    text: 'Olá, {nome}! 😊\n\nPara agilizar o seu check-in na *{pousada}*, pedimos que preencha a ficha de hospedagem pelo link abaixo (leva 2 minutinhos):\n\n{link_fnrh}\n\nObrigado! Até {checkin}! 🌺',
  },
  {
    key: 'welcome',
    label: 'Boas-vindas + dados da pousada',
    emoji: '🌺',
    text: 'Seja bem-vindo(a) à *{pousada}*, {nome}! 🎉\n\nAqui está o guia digital com Wi-Fi, horários, dicas da região e tudo que você precisa:\n\n{link_portal}\n\nÓtima estadia! Qualquer coisa, estamos à disposição. 😊',
  },
  {
    key: 'thanks',
    label: 'Agradecimento pós-estadia',
    emoji: '💚',
    text: 'Olá, {nome}! 😊\n\nFoi um prazer receber você na *{pousada}*! Esperamos que tenha aproveitado cada momento.\n\nVolte sempre — hóspedes que retornam têm um carinho especial por aqui. 🌺💚',
  },
];

/** Documento público com faixas ocupadas (sem dados pessoais) para a página de reservas. */
export interface PublicAvailability {
  ranges: { roomId: string; categoryId: string; start: string; end: string }[];
  updatedAt: string;
}
