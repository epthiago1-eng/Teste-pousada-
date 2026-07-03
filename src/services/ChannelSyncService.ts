import { Booking, Room } from '../types';
import { format, addDays, startOfToday } from 'date-fns';

export interface SyncLog {
  id: string;
  timestamp: string;
  channel: string;
  action: 'booking_received' | 'room_closed' | 'sync_complete';
  details: string;
  status: 'success' | 'pending' | 'error';
}

class ChannelSyncService {
  private static instance: ChannelSyncService;
  private syncLogs: SyncLog[] = [];

  private constructor() {}

  public static getInstance(): ChannelSyncService {
    if (!ChannelSyncService.instance) {
      ChannelSyncService.instance = new ChannelSyncService();
    }
    return ChannelSyncService.instance;
  }

  public async syncBookingToExternalChannels(booking: Booking): Promise<void> {
    // Simulate API calls to Booking.com, Expedia, etc.
    console.log(`Syncing booking ${booking.reservationNumber} to external channels...`);
    
    this.addLog({
      channel: 'All Channels',
      action: 'room_closed',
      details: `Room ${booking.roomId} blocked for ${booking.checkIn} to ${booking.checkOut}`,
      status: 'pending'
    });

    return new Promise((resolve) => {
      setTimeout(() => {
        this.addLog({
          channel: 'Booking.com',
          action: 'sync_complete',
          details: `Inventory updated successfully`,
          status: 'success'
        });
        this.addLog({
          channel: 'Expedia',
          action: 'sync_complete',
          details: `Inventory updated successfully`,
          status: 'success'
        });
        resolve();
      }, 2000);
    });
  }

  public simulateIncomingBooking(rooms: Room[]): Partial<Booking> {
    const today = startOfToday();
    const randomRoom = rooms[Math.floor(Math.random() * rooms.length)];
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      reservationNumber: `EXT-${format(new Date(), 'yyyyMMdd')}-${Math.floor(Math.random() * 1000)}`,
      roomId: randomRoom.id,
      checkIn: format(addDays(today, 5), "yyyy-MM-dd'T'14:00:00"),
      checkOut: format(addDays(today, 8), "yyyy-MM-dd'T'12:00:00"),
      channel: Math.random() > 0.5 ? 'booking.com' : 'expedia',
      status: 'confirmed',
      paymentStatus: 'full'
    };
  }

  private addLog(log: Omit<SyncLog, 'id' | 'timestamp'>) {
    const newLog: SyncLog = {
      ...log,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    };
    this.syncLogs.unshift(newLog);
    if (this.syncLogs.length > 50) this.syncLogs.pop();
  }

  public getLogs(): SyncLog[] {
    return this.syncLogs;
  }
}

export const channelSyncService = ChannelSyncService.getInstance();
