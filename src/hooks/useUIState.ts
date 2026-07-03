import { useState } from 'react';
import { Booking } from '../types';

export function useUIState() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isRoomsColumnCollapsed, setIsRoomsColumnCollapsed] = useState(false);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [activeBookingForConsumption, setActiveBookingForConsumption] = useState<Booking | null>(null);
  const [isCancelBookingModalOpen, setIsCancelBookingModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);

  return {
    isSidebarOpen, setIsSidebarOpen,
    isNotificationsOpen, setIsNotificationsOpen,
    isRoomsColumnCollapsed, setIsRoomsColumnCollapsed,
    isAddPaymentModalOpen, setIsAddPaymentModalOpen,
    isAddTransactionModalOpen, setIsAddTransactionModalOpen,
    expandedBookingId, setExpandedBookingId,
    isSyncing, setIsSyncing,
    isSubmenuOpen, setIsSubmenuOpen,
    isActionsMenuOpen, setIsActionsMenuOpen,
    activeBookingForConsumption, setActiveBookingForConsumption,
    isCancelBookingModalOpen, setIsCancelBookingModalOpen,
    bookingToCancel, setBookingToCancel
  };
}
