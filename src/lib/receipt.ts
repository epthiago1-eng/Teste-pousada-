import { jsPDF } from 'jspdf';
import type { Booking, Client, Room, RoomCategory, Tenant } from '../types';
import { PAYMENT_METHOD_LABELS } from '../types';
import { bookingBalance, bookingPaid, bookingTotal, brl, fmtDate, nights } from './utils';

/** Gera e baixa o recibo de check-out em PDF (comprovante da estadia). */
export function generateCheckoutReceipt({
  booking,
  client,
  room,
  category,
  tenant,
}: {
  booking: Booking;
  client: Client | undefined;
  room: Room | undefined;
  category: RoomCategory | undefined;
  tenant: Tenant | undefined | null;
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 18;
  let y = 20;

  const total = bookingTotal(booking);
  const paid = bookingPaid(booking);
  const balance = bookingBalance(booking);

  const line = (yPos: number) => {
    doc.setDrawColor(220, 220, 220);
    doc.line(marginX, yPos, pageWidth - marginX, yPos);
  };
  const right = (text: string, yPos: number, opts: { bold?: boolean; size?: number; color?: [number, number, number] } = {}) => {
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    doc.setFontSize(opts.size ?? 10);
    doc.setTextColor(...(opts.color ?? [30, 30, 30]));
    doc.text(text, pageWidth - marginX, yPos, { align: 'right' });
  };
  const left = (text: string, yPos: number, opts: { bold?: boolean; size?: number; color?: [number, number, number] } = {}) => {
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    doc.setFontSize(opts.size ?? 10);
    if (opts.color) doc.setTextColor(...opts.color); else doc.setTextColor(30, 30, 30);
    doc.text(text, marginX, yPos);
  };

  // Cabeçalho — pousada
  left(tenant?.name ?? 'Pousada', y, { bold: true, size: 16 });
  y += 6;
  if (tenant?.address) { left(tenant.address, y, { size: 9, color: [110, 110, 110] }); y += 5; }
  const contact = [tenant?.phone, tenant?.email].filter(Boolean).join(' · ');
  if (contact) { left(contact, y, { size: 9, color: [110, 110, 110] }); y += 5; }

  y += 4;
  left('COMPROVANTE DE CHECK-OUT', y, { bold: true, size: 12 });
  right(`Reserva ${booking.reservationNumber}`, y, { bold: true });
  y += 6;
  line(y);
  y += 8;

  // Hóspede
  left('Hóspede', y, { size: 8, color: [140, 140, 140] });
  y += 5;
  left(client?.name ?? 'Cliente removido', y, { bold: true, size: 11 });
  y += 5;
  const guestLine = [client?.phone, client?.document].filter(Boolean).join(' · ');
  if (guestLine) { left(guestLine, y, { size: 9, color: [110, 110, 110] }); y += 5; }

  y += 3;
  left('Estadia', y, { size: 8, color: [140, 140, 140] });
  y += 5;
  left(`Quarto ${room?.number ?? '?'} — ${category?.name ?? ''}`, y, { size: 10 });
  y += 5;
  left(
    `${fmtDate(booking.checkIn)} → ${fmtDate(booking.checkOut)}  (${nights(booking.checkIn, booking.checkOut)} noite(s), ${booking.adults} adulto(s)${booking.children ? `, ${booking.children} criança(s)` : ''})`,
    y,
    { size: 10 }
  );
  y += 8;
  line(y);
  y += 8;

  // Itens
  left('Hospedagem', y); right(brl(booking.totalPrice), y); y += 6;
  for (const c of booking.consumption ?? []) {
    left(`${c.quantity}× ${c.description}`, y, { size: 9, color: [90, 90, 90] });
    right(brl(c.quantity * c.unitPrice), y, { size: 9 });
    y += 5.5;
  }
  y += 2;
  line(y);
  y += 7;
  left('Total', y, { bold: true }); right(brl(total), y, { bold: true }); y += 6;

  // Pagamentos
  if ((booking.payments ?? []).length > 0) {
    y += 1;
    left('Pagamentos recebidos', y, { size: 8, color: [140, 140, 140] });
    y += 5;
    for (const p of booking.payments ?? []) {
      left(`${PAYMENT_METHOD_LABELS[p.method]} · ${fmtDate(p.date.slice(0, 10))}`, y, { size: 9, color: [90, 90, 90] });
      right(brl(p.amount), y, { size: 9 });
      y += 5.5;
    }
  }
  y += 2;
  left('Total pago', y); right(`− ${brl(paid)}`, y); y += 7;
  line(y);
  y += 8;

  left('Saldo', y, { bold: true, size: 13 });
  right(brl(balance), y, { bold: true, size: 13, color: balance > 0 ? [200, 40, 40] : [20, 130, 80] });
  y += 12;

  line(y);
  y += 8;
  left(
    balance > 0 ? 'Saldo pendente — a acertar com a pousada.' : 'Estadia quitada. Obrigado pela hospedagem!',
    y,
    { size: 9, color: [110, 110, 110] }
  );
  y += 10;
  left(`Emitido em ${fmtDate(new Date().toISOString().slice(0, 10))} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, y, { size: 8, color: [170, 170, 170] });

  doc.save(`checkout-${booking.reservationNumber}.pdf`);
}
