import { Booking } from '../types';
import { addDays, format } from 'date-fns';

export interface PaymentLink {
  id: string;
  bookingId: string;
  amount: number;
  status: 'active' | 'paid' | 'expired';
  url: string;
  expiresAt: string;
  type: 'deposit' | 'cancellation_fee' | 'full_payment';
}

export class PaymentService {
  private static paymentLinks: PaymentLink[] = [];

  static generatePaymentLink(booking: Booking, amount: number, type: PaymentLink['type'] = 'deposit'): PaymentLink {
    const id = Math.random().toString(36).substr(2, 9);
    const expiresAt = addDays(new Date(), 1).toISOString();
    
    // In a real app, this would call a payment gateway API like Stripe or Mercado Pago
    const url = `https://checkout.hotel-manager.com/pay/${id}`;
    
    const newLink: PaymentLink = {
      id,
      bookingId: booking.id,
      amount,
      status: 'active',
      url,
      expiresAt,
      type
    };

    this.paymentLinks.push(newLink);
    return newLink;
  }

  static getPaymentLink(id: string): PaymentLink | undefined {
    return this.paymentLinks.find(l => l.id === id);
  }

  static simulatePayment(id: string): boolean {
    const link = this.getPaymentLink(id);
    if (link && link.status === 'active') {
      link.status = 'paid';
      return true;
    }
    return false;
  }

  static calculateCancellationFee(booking: Booking, policy: 'flexible' | 'moderate' | 'strict'): number {
    const checkIn = new Date(booking.checkIn);
    const today = new Date();
    const daysUntilCheckIn = Math.ceil((checkIn.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (policy === 'flexible') {
      return daysUntilCheckIn < 1 ? booking.totalPrice * 0.5 : 0;
    } else if (policy === 'moderate') {
      if (daysUntilCheckIn < 3) return booking.totalPrice * 0.5;
      if (daysUntilCheckIn < 7) return booking.totalPrice * 0.25;
      return 0;
    } else { // strict
      if (daysUntilCheckIn < 7) return booking.totalPrice * 1.0;
      if (daysUntilCheckIn < 14) return booking.totalPrice * 0.5;
      return booking.totalPrice * 0.1;
    }
  }
}
