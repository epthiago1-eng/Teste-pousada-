export type View = 'home' | 'calendar' | 'booking-list' | 'rooms' | 'clients' | 'new-client' | 'finance' | 'staff' | 'new-staff' | 'new-booking' | 'room-categories' | 'new-room-category' | 'new-room' | 'bulk-update-rooms' | 'room-details' | 'update-room' | 'products' | 'new-product' | 'booking-consumption' | 'checkout' | 'booking-details' | 'guest-details' | 'settings' | 'public-page' | 'housekeeping' | 'rates';

export type RoomStatus = 'clean' | 'dirty' | 'maintenance' | 'inspected' | 'cleaning';
export type RoomAvailability = 'available' | 'occupied' | 'reserved' | 'blocked';

export interface RoomCategory {
  id: string;
  name: string;
  maxGuests: number;
  maxAdults: number;
  maxChildren: number;
}

export interface Room {
  id: string;
  number: string;
  category: string;
  status: RoomStatus;
  availability: RoomAvailability;
  price: number;
  description?: string;
  singleBeds?: number;
  doubleBeds?: number;
  photos?: string[];
  features?: string[];
}

export interface Client {
  id: string;
  name: string;
  email: string;
  nationality?: string;
  identificationType?: string;
  document: string;
  birthDate?: string;
  phone: string;
  address?: string;
  cep?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  notes?: string;
}

export interface Booking {
  id: string;
  reservationNumber: string;
  roomId: string;
  clientId: string;
  checkIn: string; // ISO string
  checkOut: string; // ISO string
  totalPrice: number;
  guests: number;
  adults?: number;
  children?: number;
  status: 'pre-booking' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled' | 'no-show' | 'overdue-checkout' | 'blocked';
  paymentStatus: 'none' | 'partial' | 'full';
  depositStatus?: 'pending' | 'paid' | 'expired';
  depositAmount?: number;
  cancellationFee?: number;
  paymentLinkId?: string;
  channel: 'direct' | 'website' | 'booking.com' | 'expedia' | 'airbnb';
  ratePlanId?: string;
  consumption: ConsumptionItem[];
  notes?: string;
  keyControl?: {
    keysGiven: boolean;
    gateControlsGiven: number;
    keysReturned: boolean;
    gateControlsReturned: boolean;
  };
}

export interface Product {
  id: string;
  name: string;
  type: 'product' | 'service';
  price: number;
  stockQuantity?: number;
  minStockAlert?: number;
  imageUrl?: string;
}

export interface ConsumptionItem {
  id: string;
  productId?: string;
  description: string;
  amount: number;
  quantity?: number;
  unitPrice?: number;
  date: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: 'booking' | 'staff' | 'maintenance' | 'supplies' | 'service' | 'other';
  amount: number;
  description: string;
  date: string;
  bookingId?: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  salary: number;
  lastPaymentDate?: string;
}

export interface Establishment {
  name: string;
  logoUrl: string;
  address: string;
  phone: string;
  email: string;
  slug: string;
  description: string;
  aboutHtml: string;
  amenities: string[];
  roomFeatures: string[];
  heroImageUrl: string;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'receptionist' | 'housekeeper';
  status: 'active' | 'inactive';
}

export interface GuestPortalConfig {
  policies: string;
  touristSpots: { id: string; name: string; description: string; link?: string }[];
  restaurants: { id: string; name: string; cuisine: string; phone?: string; link?: string }[];
  deliveryAddress: string;
  tvChannels: { id: string; number: string; name: string; category: string }[];
  whatsappNumber: string;
  isActive: boolean;
  wifiSsid?: string;
  wifiPassword?: string;
  checkinTime?: string;
  checkoutTime?: string;
  breakfastTime?: string;
  phoneNumber?: string;
  emergencyContacts?: { id: string; name: string; phone: string }[];
}

export interface YieldRule {
  id: string;
  name: string;
  type: 'occupancy' | 'seasonality' | 'competitor' | 'lead-time';
  config: {
    minOccupancy?: number;
    maxOccupancy?: number;
    startDate?: string;
    endDate?: string;
    minDaysLead?: number;
    maxDaysLead?: number;
    competitorPriceThreshold?: number;
    competitorOperator?: '<' | '>';
  };
  adjustmentType: 'percentage' | 'fixed';
  adjustmentValue: number;
  isActive: boolean;
}

export interface RatePlan {
  id: string;
  name: string;
  category: string; // The room category this plan applies to
  basePrice?: number;
  cancellationPolicy?: 'flexible' | 'non-refundable' | 'strict';
  mealPlan?: 'room-only' | 'breakfast' | 'half-board' | 'full-board';
  minStay?: number;
  maxStay?: number;
  priceVariesByDayOfWeek?: boolean;
  pricesByDayOfWeek?: Record<number, number>; // 0: Sunday, 1: Monday, etc.
  priceVariesByGuests?: boolean;
  normalOccupancy?: number;
  guestAdjustments?: Record<number, { amount: number, type: 'percentage' | 'fixed' }>;
  chargesForChildren?: boolean;
  childrenAgeFrom?: number;
  childrenAgeTo?: number;
  childrenFee?: number;
  chargesMandatoryFee?: boolean;
  mandatoryFeeName?: string;
  mandatoryFeeAmount?: number;
  mandatoryFeeType?: 'per-reservation' | 'per-person' | 'per-night';
  hasMaxStay?: boolean;
  notes?: string;
  validFrom?: string;
  validTo?: string;
}

export interface DailyRate {
  id: string;
  ratePlanId: string;
  date: string; // YYYY-MM-DD
  price: number;
  minStay?: number;
  maxStay?: number;
  closedForSale?: boolean;
  closedForArrival?: boolean;
  closedForDeparture?: boolean;
}

export interface SyncLog {
  id: string;
  timestamp: string;
  type: 'incoming' | 'outgoing' | 'error';
  channel: string;
  message: string;
}
