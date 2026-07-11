import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Booking } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const uid = () =>
  (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));

export const brl = (v: number) =>
  (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const todayISO = () => format(new Date(), 'yyyy-MM-dd');

export const fmtDate = (iso?: string, pattern = 'dd/MM/yyyy') =>
  iso ? format(parseISO(iso), pattern, { locale: ptBR }) : '—';

export const fmtDateShort = (iso?: string) => fmtDate(iso, "dd 'de' MMM");

export const nights = (checkIn: string, checkOut: string) =>
  Math.max(1, differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn)));

/** Verifica sobreposição de datas [aStart, aEnd) x [bStart, bEnd) */
export const rangesOverlap = (aStart: string, aEnd: string, bStart: string, bEnd: string) =>
  aStart < bEnd && bStart < aEnd;

export const ACTIVE_BOOKING_STATUSES = ['pre-booking', 'confirmed', 'checked-in', 'blocked'] as const;

export const isActiveBooking = (b: Booking) =>
  (ACTIVE_BOOKING_STATUSES as readonly string[]).includes(b.status);

export const bookingTotal = (b: Booking) =>
  b.totalPrice + (b.consumption ?? []).reduce((s, c) => s + c.quantity * c.unitPrice, 0);

export const bookingPaid = (b: Booking) =>
  (b.payments ?? []).reduce((s, p) => s + p.amount, 0);

export const bookingBalance = (b: Booking) => bookingTotal(b) - bookingPaid(b);

export function nextReservationNumber(existing: { reservationNumber?: string }[]) {
  const year = new Date().getFullYear();
  const nums = existing
    .map((b) => b.reservationNumber ?? '')
    .filter((n) => n.startsWith(`${year}-`))
    .map((n) => parseInt(n.split('-')[1] ?? '0', 10))
    .filter((n) => !isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${year}-${String(next).padStart(4, '0')}`;
}

/** Preço de uma noite (data 'yyyy-MM-dd') segundo um plano tarifário. */
export function planPriceForDate(
  plan: { basePrice: number; pricesByDayOfWeek?: Record<number, number>; dailyOverrides?: Record<string, number>; validFrom?: string; validTo?: string },
  dateISO: string
): number | null {
  if (plan.validFrom && dateISO < plan.validFrom) return null;
  if (plan.validTo && dateISO > plan.validTo) return null;
  const override = plan.dailyOverrides?.[dateISO];
  if (override != null) return override;
  const dow = parseISO(dateISO).getDay();
  const dowPrice = plan.pricesByDayOfWeek?.[dow];
  if (dowPrice != null) return dowPrice;
  return plan.basePrice;
}

/** Preenche um modelo de mensagem com as variáveis da reserva. */
export function fillTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

/** Normaliza telefone BR para o formato do wa.me (só dígitos, com DDI 55). */
export function waPhone(phone: string) {
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) digits = '55' + digits;
  return digits;
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 50);
}
