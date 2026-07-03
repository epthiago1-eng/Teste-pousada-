import { YieldRule, Room, Booking, RatePlan, DailyRate } from '../types';
import { isWithinInterval, parseISO, differenceInDays, startOfToday, eachDayOfInterval, format } from 'date-fns';

export class YieldService {
  static calculateAverageNightlyPrice(
    checkIn: Date,
    checkOut: Date,
    ratePlan: RatePlan | undefined,
    dailyRates: DailyRate[],
    fallbackBasePrice: number
  ): number {
    const nights = differenceInDays(checkOut, checkIn) || 1;
    let totalPrice = 0;

    const days = eachDayOfInterval({ start: checkIn, end: checkOut });
    // Remove the last day (check-out day) as we only charge for nights
    if (days.length > 1) {
      days.pop();
    }

    days.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayOfWeek = day.getDay();
      
      let nightPrice = fallbackBasePrice;

      if (ratePlan) {
        nightPrice = ratePlan.basePrice || fallbackBasePrice;
        
        if (ratePlan.priceVariesByDayOfWeek && ratePlan.pricesByDayOfWeek) {
          const dayPrice = ratePlan.pricesByDayOfWeek[dayOfWeek];
          if (dayPrice !== undefined) {
            nightPrice = dayPrice;
          }
        }

        const dailyRate = dailyRates.find(r => r.ratePlanId === ratePlan.id && r.date === dateStr);
        if (dailyRate) {
          nightPrice = dailyRate.price;
        }
      }

      totalPrice += nightPrice;
    });

    return totalPrice / nights;
  }

  static calculateYieldPrice(
    basePrice: number,
    checkIn: Date,
    checkOut: Date,
    rules: YieldRule[],
    allBookings: Booking[],
    totalRooms: number
  ): { finalPrice: number; appliedRules: YieldRule[] } {
    let finalPrice = basePrice;
    const appliedRules: YieldRule[] = [];
    const today = startOfToday();
    const leadTimeDays = differenceInDays(checkIn, today);

    // Calculate occupancy for the period
    // For simplicity, we'll take the average occupancy or just the max occupancy during the period
    const occupancy = this.calculateOccupancy(checkIn, checkOut, allBookings, totalRooms);

    rules.filter(r => r.isActive).forEach(rule => {
      let isApplicable = false;

      switch (rule.type) {
        case 'occupancy':
          if (rule.config.minOccupancy !== undefined && occupancy >= rule.config.minOccupancy) {
            isApplicable = true;
          }
          if (rule.config.maxOccupancy !== undefined && occupancy <= rule.config.maxOccupancy) {
            isApplicable = true;
          }
          break;

        case 'seasonality':
          if (rule.config.startDate && rule.config.endDate) {
            const start = parseISO(rule.config.startDate);
            const end = parseISO(rule.config.endDate);
            // Check if check-in is within season
            if (isWithinInterval(checkIn, { start, end })) {
              isApplicable = true;
            }
          }
          break;

        case 'lead-time':
          if (rule.config.minDaysLead !== undefined && leadTimeDays >= rule.config.minDaysLead) {
            isApplicable = true;
          }
          if (rule.config.maxDaysLead !== undefined && leadTimeDays <= rule.config.maxDaysLead) {
            isApplicable = true;
          }
          break;

        case 'competitor':
          // Simulated competitor logic
          // In a real app, this would fetch from an API
          const simulatedCompetitorPrice = basePrice * (1 + (Math.random() * 0.2 - 0.1)); 
          if (rule.config.competitorPriceThreshold !== undefined && rule.config.competitorOperator) {
             if (rule.config.competitorOperator === '<' && simulatedCompetitorPrice < rule.config.competitorPriceThreshold) {
               isApplicable = true;
             }
             if (rule.config.competitorOperator === '>' && simulatedCompetitorPrice > rule.config.competitorPriceThreshold) {
               isApplicable = true;
             }
          }
          break;
      }

      if (isApplicable) {
        appliedRules.push(rule);
        if (rule.adjustmentType === 'percentage') {
          finalPrice += (basePrice * (rule.adjustmentValue / 100));
        } else {
          finalPrice += rule.adjustmentValue;
        }
      }
    });

    return { finalPrice: Math.max(0, finalPrice), appliedRules };
  }

  private static calculateOccupancy(checkIn: Date, checkOut: Date, bookings: Booking[], totalRooms: number): number {
    if (totalRooms === 0) return 0;
    
    // Simple occupancy calculation: count bookings overlapping with the period
    const overlappingBookings = bookings.filter(b => {
      if (b.status === 'cancelled' || b.status === 'no-show') return false;
      const bIn = parseISO(b.checkIn);
      const bOut = parseISO(b.checkOut);
      return (checkIn < bOut && checkOut > bIn);
    });

    // This is a very rough estimate (number of unique rooms occupied during the period)
    const uniqueRoomsOccupied = new Set(overlappingBookings.map(b => b.roomId)).size;
    return (uniqueRoomsOccupied / totalRooms) * 100;
  }
}
