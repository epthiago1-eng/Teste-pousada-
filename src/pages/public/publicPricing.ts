import { addDays, format, parseISO } from 'date-fns';
import type { PublicAvailability } from '../../types';
import type { PublicCategory } from './usePublicTenant';
import { planPriceForDate, rangesOverlap } from '../../lib/utils';

/* ================================================================
   Preço e disponibilidade a partir dos dados públicos (sem login).
   Compartilhado entre a página pública e o fluxo de reserva.
   ================================================================ */

/** Preço da diária que começa em `iso` (tarifário do dia > dia da semana > base). */
export function priceFor(cat: PublicCategory, iso: string): number {
  if (!cat.pricing) return cat.basePrice;
  return (
    planPriceForDate(
      {
        basePrice: cat.pricing.basePrice,
        pricesByDayOfWeek: cat.pricing.pricesByDayOfWeek,
        dailyOverrides: cat.pricing.dailyOverrides,
        validFrom: cat.pricing.validFrom || undefined,
        validTo: cat.pricing.validTo || undefined,
      },
      iso
    ) ?? cat.pricing.basePrice
  );
}

/** Quantos quartos desta categoria estão livres no período. */
export function freeRooms(
  cat: PublicCategory,
  availability: PublicAvailability | null,
  startISO: string,
  endISO: string
): number {
  const busy = new Set(
    (availability?.ranges ?? [])
      .filter((r) => cat.roomIds.includes(r.roomId) && rangesOverlap(startISO, endISO, r.start, r.end))
      .map((r) => r.roomId)
  );
  return cat.roomIds.length - busy.size;
}

/** Soma das diárias do período (noite a noite, respeitando o tarifário). */
export function stayTotal(cat: PublicCategory, checkIn: string, checkOut: string): number {
  let total = 0;
  for (let d = parseISO(checkIn); format(d, 'yyyy-MM-dd') < checkOut; d = addDays(d, 1)) {
    total += priceFor(cat, format(d, 'yyyy-MM-dd'));
  }
  return total;
}

/** Menor diária da categoria nos próximos `days` dias — para o "a partir de". */
export function priceFrom(cat: PublicCategory, days = 60): number {
  let min = Infinity;
  for (let i = 0; i < days; i++) {
    const p = priceFor(cat, format(addDays(new Date(), i), 'yyyy-MM-dd'));
    if (p > 0 && p < min) min = p;
  }
  return Number.isFinite(min) ? min : cat.basePrice;
}
