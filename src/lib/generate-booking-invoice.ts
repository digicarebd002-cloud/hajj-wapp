import jsPDF from "jspdf";

interface BookingInvoiceData {
  bookingId: string;
  date: Date;
  travellerName: string;
  email: string;
  phone: string;
  passportNumber: string;
  packageName: string;
  packagePrice: number;
  duration: string;
  departure: string;
  paymentMethod: string;
  installmentMonths?: number | null;
  specialRequests?: string | null;
  status: string;
}

export function generateBookingInvoicePDF(data: BookingInvoiceData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const primary = [20, 184, 166];
  const dark = [15, 23, 42];
  const muted = [100, 116, 139];
  const light = [241, 245, 249];

  // === HEADER BAR ===
  doc.setFillColor(primary[0], primary[1], primary[2]);
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("BOOKING RECEIPT", margin, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Hajj Wallet — Hajj Packages", margin, 28);
  doc.text("Your Sacred Journey Starts Here", margin, 34);

  // Booking ref on right
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`#${data.bookingId.slice(0, 8).toUpperCase()}`, pageWidth - margin, 18, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(data.date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), pageWidth - margin, 26, { align: "right" });
  doc.text(`Status: ${data.status.toUpperCase()}`, pageWidth - margin, 33, { align: "right" });

  y = 52;

  // === TRAVELLER INFO ===
  doc.setTextColor(muted[0], muted[1], muted[2]);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("TRAVELLER INFORMATION", margin, y);
  y += 8;

  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(data.travellerName, margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(muted[0], muted[1], muted[2]);
  doc.text(data.email, margin, y);
  y += 5;
  doc.text(`Phone: ${data.phone}`, margin, y);
  y += 5;
  doc.text(`Passport: ${data.passportNumber}`, margin, y);

  // Payment method on right
  doc.setTextColor(muted[0], muted[1], muted[2]);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT METHOD", pageWidth - margin - 60, 52);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(dark[0], dark[1], dark[2]);
  const payLabel = data.paymentMethod === "plan"
    ? `${data.installmentMonths}-Month Installment`
    : data.paymentMethod === "wallet" ? "Wallet" : "Card Payment";
  doc.text(payLabel, pageWidth - margin - 60, 60);

  y += 14;

  // === PACKAGE DETAILS TABLE ===
  doc.setFillColor(light[0], light[1], light[2]);
  doc.roundedRect(margin, y, contentWidth, 10, 2, 2, "F");
  doc.setTextColor(muted[0], muted[1], muted[2]);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("PACKAGE", margin + 4, y + 7);
  doc.text("DURATION", margin + 90, y + 7);
  doc.text("DEPARTURE", margin + 120, y + 7);
  doc.text("PRICE", pageWidth - margin - 4, y + 7, { align: "right" });
  y += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.setFont("helvetica", "bold");
  doc.text(data.packageName, margin + 4, y + 4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(muted[0], muted[1], muted[2]);
  doc.text(data.duration || "N/A", margin + 90, y + 4);
  doc.text(data.departure || "N/A", margin + 120, y + 4);
  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`$${data.packagePrice.toLocaleString()}`, pageWidth - margin - 4, y + 4, { align: "right" });
  y += 16;

  // === DIVIDER ===
  doc.setDrawColor(primary[0], primary[1], primary[2]);
  doc.setLineWidth(0.5);
  doc.line(pageWidth - margin - 80, y, pageWidth - margin, y);
  y += 8;

  // === TOTAL ===
  doc.setFillColor(primary[0], primary[1], primary[2]);
  doc.roundedRect(pageWidth - margin - 84, y - 5, 84, 14, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL", pageWidth - margin - 80, y + 4);
  doc.setFontSize(13);
  doc.text(`$${data.packagePrice.toLocaleString()}`, pageWidth - margin - 4, y + 4, { align: "right" });

  y += 24;

  // Special Requests
  if (data.specialRequests) {
    doc.setDrawColor(light[0], light[1], light[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setTextColor(muted[0], muted[1], muted[2]);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("SPECIAL REQUESTS", margin, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(dark[0], dark[1], dark[2]);
    const lines = doc.splitTextToSize(data.specialRequests, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 6;
  }

  // === FOOTER ===
  doc.setDrawColor(light[0], light[1], light[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setTextColor(muted[0], muted[1], muted[2]);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for booking with Hajj Wallet! May your journey be blessed.", margin, y);
  y += 5;
  doc.text("Questions? Contact us at support@hajjwallet.com", margin, y);

  // Decorative bottom bar
  doc.setFillColor(primary[0], primary[1], primary[2]);
  doc.rect(0, doc.internal.pageSize.getHeight() - 8, pageWidth, 8, "F");

  return doc;
}
