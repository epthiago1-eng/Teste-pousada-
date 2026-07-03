import { parseISO, areIntervalsOverlapping } from 'date-fns';
import { Booking } from '../types';

export const checkBookingConflict = (
  bookings: Booking[],
  roomId: string,
  checkIn: Date,
  checkOut: Date,
  excludeBookingId?: string
) => {
  return bookings.some(b => {
    if (b.id === excludeBookingId) return false;
    if (b.roomId !== roomId) return false;
    if (['cancelled', 'no-show'].includes(b.status)) return false;

    const bCheckIn = parseISO(b.checkIn);
    const bCheckOut = parseISO(b.checkOut);

    return areIntervalsOverlapping(
      { start: checkIn, end: checkOut },
      { start: bCheckIn, end: bCheckOut },
      { inclusive: false }
    );
  });
};
