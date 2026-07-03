import { useState, useEffect, useRef } from 'react';
import { startOfToday, startOfMonth, subDays } from 'date-fns';
import { Booking } from '../types';

export function useCalendar(isSidebarOpen: boolean, isRoomsColumnCollapsed: boolean, rooms: any[]) {
  const [currentDate, setCurrentDate] = useState(subDays(startOfToday(), 2));
  const [daysToShow, setDaysToShow] = useState(14);
  const [calendarSearchQuery, setCalendarSearchQuery] = useState('');
  const [calendarStatusFilter, setCalendarStatusFilter] = useState<string>('all');
  const [calendarStartDate, setCalendarStartDate] = useState<string>('');
  const [calendarEndDate, setCalendarEndDate] = useState<string>('');
  const [isCalendarSearchOpen, setIsCalendarSearchOpen] = useState(false);
  const [isCalendarFilterOpen, setIsCalendarFilterOpen] = useState(false);
  
  const [calendarSelection, setCalendarSelection] = useState<{
    roomId: string;
    startDate: Date;
    endDate: Date;
    isDragging: boolean;
  } | null>(null);
  const [selectionPopover, setSelectionPopover] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [draggedBooking, setDraggedBooking] = useState<Booking | null>(null);
  const [dropTarget, setDropTarget] = useState<{ roomId: string, day: Date } | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{ roomId: string, day: Date } | null>(null);
  const [isConfirmingMove, setIsConfirmingMove] = useState(false);
  const [cellPopover, setCellPopover] = useState<{ roomId: string, day: Date, x: number, y: number } | null>(null);
  const [touchDragInfo, setTouchDragInfo] = useState<{
    booking: Booking;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    isDragging: boolean;
  } | null>(null);
  const touchTimer = useRef<any>(null);

  const [collapsedCategories, setCollapsedCategories] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<{booking: Booking, x: number, y: number} | null>(null);
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  useEffect(() => {
    const calculateDaysToShow = () => {
      const sidebarWidth = (window.innerWidth >= 1024 && isSidebarOpen) ? 256 : 0;
      const paddingAndMargins = 48;
      const availableWidth = window.innerWidth - sidebarWidth - paddingAndMargins;
      const roomColumnWidth = isRoomsColumnCollapsed ? 32 : 80;
      const dayColumnWidth = 60;
      const maxDays = Math.floor((availableWidth - roomColumnWidth) / dayColumnWidth);
      setDaysToShow(Math.max(7, Math.min(60, maxDays)));
    };

    calculateDaysToShow();
    window.addEventListener('resize', calculateDaysToShow);
    return () => window.removeEventListener('resize', calculateDaysToShow);
  }, [isSidebarOpen, isRoomsColumnCollapsed]);

  useEffect(() => {
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timeInterval);
  }, []);

  return {
    currentDate, setCurrentDate,
    daysToShow, setDaysToShow,
    calendarSearchQuery, setCalendarSearchQuery,
    calendarStatusFilter, setCalendarStatusFilter,
    calendarStartDate, setCalendarStartDate,
    calendarEndDate, setCalendarEndDate,
    isCalendarSearchOpen, setIsCalendarSearchOpen,
    isCalendarFilterOpen, setIsCalendarFilterOpen,
    calendarSelection, setCalendarSelection,
    selectionPopover, setSelectionPopover,
    draggedBooking, setDraggedBooking,
    dropTarget, setDropTarget,
    dragOverTarget, setDragOverTarget,
    isConfirmingMove, setIsConfirmingMove,
    cellPopover, setCellPopover,
    touchDragInfo, setTouchDragInfo,
    touchTimer,
    collapsedCategories, setCollapsedCategories,
    currentTime,
    selectedBooking, setSelectedBooking,
    isLegendOpen, setIsLegendOpen
  };
}
