import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { startOfToday, addDays, differenceInCalendarDays } from 'date-fns';
import { Client, Room, Booking, RatePlan, DailyRate, YieldRule } from '../types';
import { YieldService } from '../services/YieldService';

export function useBookingForm(
  ratePlans: RatePlan[],
  dailyRates: DailyRate[],
  yieldRules: YieldRule[],
  bookings: Booking[],
  rooms: Room[],
  currentView: string
) {
  const [bookingClient, setBookingClient] = useState<Client | null>(null);
  const [bookingCheckIn, setBookingCheckIn] = useState<Date>(startOfToday());
  const [bookingCheckOut, setBookingCheckOut] = useState<Date>(addDays(startOfToday(), 1));
  const [bookingRooms, setBookingRooms] = useState<{ 
    room: Room, 
    adults: number, 
    children: number, 
    extraAdultFee: number, 
    extraChildFee: number,
    ratePlanId: string, 
    price: number 
  }[]>([]);
  const [bookingStatus, setBookingStatus] = useState<Booking['status']>('confirmed');
  const [bookingPaymentStatus, setBookingPaymentStatus] = useState<Booking['paymentStatus']>('none');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingKeyControl, setBookingKeyControl] = useState<{ keysGiven: boolean; gateControlsGiven: number; keysReturned: boolean; gateControlsReturned: boolean; }>({ keysGiven: false, gateControlsGiven: 0, keysReturned: false, gateControlsReturned: false });
  const [prePaymentAmount, setPrePaymentAmount] = useState<string>('');
  const [prePaymentMethod, setPrePaymentMethod] = useState<string>('');
  const [isAdvancePayment, setIsAdvancePayment] = useState(false);
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [splitPayments, setSplitPayments] = useState<{ amount: string, method: string }[]>([{ amount: '', method: 'pix' }]);
  const [selectingDate, setSelectingDate] = useState<'check-in' | 'check-out' | null>(null);
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [manualConsumptionDescription, setManualConsumptionDescription] = useState('');
  const [manualConsumptionAmount, setManualConsumptionAmount] = useState<string>('');
  const [editingConsumptionId, setEditingConsumptionId] = useState<string | null>(null);
  const [editingConsumptionAmount, setEditingConsumptionAmount] = useState<string>('');
  
  const [guestSearchQuery, setGuestSearchQuery] = useState('');
  const [isNewGuestModalOpen, setIsNewGuestModalOpen] = useState(false);
  const [isCheckoutConfirmModalOpen, setIsCheckoutConfirmModalOpen] = useState(false);
  const [newGuestData, setNewGuestData] = useState({
    name: '',
    phone: '',
    email: '',
    nationality: '',
    identificationType: '',
    identificationNumber: ''
  });
  
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isRoomSearchVisible, setIsRoomSearchVisible] = useState(true);
  const [roomSelectionMessage, setRoomSelectionMessage] = useState<string | null>(null);

  const getDefaultRatePlanId = useCallback((room: Room) => {
    const plan = ratePlans.find(p => p.category === room.category);
    return plan ? plan.id : '';
  }, [ratePlans]);

  const calculateRoomPrice = useCallback((
    room: Room, 
    checkIn: Date, 
    checkOut: Date, 
    ratePlanId: string,
    adults: number = 2,
    children: number = 0,
    manualExtraAdultFee?: number,
    manualExtraChildFee?: number
  ) => {
    const ratePlan = ratePlans.find(p => p.id === ratePlanId);
    const basePrice = YieldService.calculateAverageNightlyPrice(
      checkIn,
      checkOut,
      ratePlan,
      dailyRates,
      room.price
    );
    
    const { finalPrice: yieldPrice } = YieldService.calculateYieldPrice(
      basePrice,
      checkIn,
      checkOut,
      yieldRules,
      bookings,
      rooms.length
    );

    let occupancyPrice = yieldPrice;
    if (ratePlan) {
      const normalOccupancy = ratePlan.normalOccupancy || 2;
      
      if (adults > normalOccupancy) {
        const extraAdults = adults - normalOccupancy;
        const extraFee = manualExtraAdultFee !== undefined ? manualExtraAdultFee : (ratePlan.guestAdjustments?.[adults]?.amount || 0);
        occupancyPrice += extraAdults * extraFee;
      }

      const freeChildren = ratePlan.chargesForChildren ? 0 : 1;
      if (children > freeChildren) {
        const payingChildren = children - freeChildren;
        const childFee = manualExtraChildFee !== undefined ? manualExtraChildFee : (ratePlan.childrenFee || ratePlan.guestAdjustments?.[normalOccupancy + 1]?.amount || 0);
        occupancyPrice += payingChildren * childFee;
      }
    }

    return occupancyPrice;
  }, [ratePlans, dailyRates, yieldRules, bookings, rooms.length]);

  const bookingNights = useMemo(() => differenceInCalendarDays(bookingCheckOut, bookingCheckIn) || 1, [bookingCheckOut, bookingCheckIn]);
  const bookingTotal = useMemo(() => bookingRooms.reduce((acc, r) => acc + r.price, 0) * bookingNights, [bookingRooms, bookingNights]);

  useEffect(() => {
    let totalPaid = 0;
    if (isSplitPayment) {
      totalPaid = splitPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    } else if (isAdvancePayment) {
      totalPaid = Number(prePaymentAmount) || 0;
    }

    if (totalPaid > 0) {
      if (totalPaid >= bookingTotal && bookingTotal > 0) {
        setBookingPaymentStatus('full');
      } else {
        setBookingPaymentStatus('partial');
      }
    } else {
      setBookingPaymentStatus('none');
    }
  }, [prePaymentAmount, splitPayments, isSplitPayment, isAdvancePayment, bookingTotal]);

  const lastPriceInputsRef = useRef<string>('');

  useEffect(() => {
    if (currentView === 'new-booking' && bookingRooms.length > 0) {
      // Create a string representation of all inputs that should trigger a price recalculation
      const currentInputs = JSON.stringify(bookingRooms.map(item => ({
        roomId: item.room.id,
        ratePlanId: item.ratePlanId,
        adults: item.adults,
        children: item.children,
        extraAdultFee: item.extraAdultFee,
        extraChildFee: item.extraChildFee,
        checkIn: bookingCheckIn.toISOString(),
        checkOut: bookingCheckOut.toISOString(),
        // We include yieldRules and bookings count as they affect YieldService calculations
        yieldRulesHash: yieldRules.length,
        bookingsHash: bookings.length
      })));

      if (currentInputs !== lastPriceInputsRef.current) {
        const updatedRooms = bookingRooms.map(item => {
          const yieldPrice = calculateRoomPrice(
            item.room,
            bookingCheckIn,
            bookingCheckOut,
            item.ratePlanId,
            item.adults,
            item.children,
            item.extraAdultFee,
            item.extraChildFee
          );
          return { ...item, price: yieldPrice };
        });
        
        lastPriceInputsRef.current = currentInputs;
        setBookingRooms(updatedRooms);
      }
    } else if (bookingRooms.length === 0) {
      lastPriceInputsRef.current = '';
    }
  }, [bookingCheckIn, bookingCheckOut, yieldRules, bookings, rooms.length, currentView, bookingRooms, calculateRoomPrice]);

  return {
    bookingClient, setBookingClient,
    bookingCheckIn, setBookingCheckIn,
    bookingCheckOut, setBookingCheckOut,
    bookingRooms, setBookingRooms,
    bookingStatus, setBookingStatus,
    bookingPaymentStatus, setBookingPaymentStatus,
    bookingNotes, setBookingNotes,
    bookingKeyControl, setBookingKeyControl,
    prePaymentAmount, setPrePaymentAmount,
    prePaymentMethod, setPrePaymentMethod,
    isAdvancePayment, setIsAdvancePayment,
    isSplitPayment, setIsSplitPayment,
    splitPayments, setSplitPayments,
    selectingDate, setSelectingDate,
    roomSearchQuery, setRoomSearchQuery,
    productSearchQuery, setProductSearchQuery,
    manualConsumptionDescription, setManualConsumptionDescription,
    manualConsumptionAmount, setManualConsumptionAmount,
    editingConsumptionId, setEditingConsumptionId,
    editingConsumptionAmount, setEditingConsumptionAmount,
    guestSearchQuery, setGuestSearchQuery,
    isNewGuestModalOpen, setIsNewGuestModalOpen,
    isCheckoutConfirmModalOpen, setIsCheckoutConfirmModalOpen,
    newGuestData, setNewGuestData,
    isDatePickerOpen, setIsDatePickerOpen,
    isRoomSearchVisible, setIsRoomSearchVisible,
    roomSelectionMessage, setRoomSelectionMessage,
    resetForm: () => {
      setBookingClient(null);
      setBookingCheckIn(startOfToday());
      setBookingCheckOut(addDays(startOfToday(), 1));
      setBookingRooms([]);
      setBookingStatus('confirmed');
      setBookingPaymentStatus('none');
      setBookingNotes('');
      setBookingKeyControl({ keysGiven: false, gateControlsGiven: 0, keysReturned: false, gateControlsReturned: false });
      setPrePaymentAmount('');
      setPrePaymentMethod('');
      setIsAdvancePayment(false);
      setIsSplitPayment(false);
      setSplitPayments([{ amount: '', method: 'pix' }]);
      setSelectingDate(null);
      setRoomSearchQuery('');
      setProductSearchQuery('');
      setManualConsumptionDescription('');
      setManualConsumptionAmount('');
      setEditingConsumptionId(null);
      setEditingConsumptionAmount('');
      setGuestSearchQuery('');
      setIsNewGuestModalOpen(false);
      setIsCheckoutConfirmModalOpen(false);
      setNewGuestData({
        name: '',
        phone: '',
        email: '',
        nationality: '',
        identificationType: '',
        identificationNumber: ''
      });
      setIsDatePickerOpen(false);
      setIsRoomSearchVisible(true);
      setRoomSelectionMessage(null);
    },
    getDefaultRatePlanId,
    calculateRoomPrice,
    bookingNights,
    bookingTotal
  };
}
