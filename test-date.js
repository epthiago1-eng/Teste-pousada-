
const { parseISO, differenceInCalendarDays } = require('date-fns');

const checkIn = "2024-03-24T14:00:00";
const checkOut = "2024-03-25T12:00:00";

const d1 = parseISO(checkIn);
const d2 = parseISO(checkOut);

console.log('d1:', d1);
console.log('d2:', d2);
console.log('diff:', differenceInCalendarDays(d2, d1));
