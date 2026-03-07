import jsPDF from "jspdf";

interface InvoiceItem {
  name: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
}

interface InvoiceData {
  orderId: string;
  date: Date;
  customerName: string;
  customerEmail: string;
  items: InvoiceItem[];
  subtotal: number;
  tierDiscount: number;
  couponDiscount: number;
  total: number;
  paymentMethod: string;
  couponCode?: string;
}

export function generateInvoicePDF(data: InvoiceData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  // Colors
  const primary = [20, 184, 166]; // teal
  const dark = [15, 23, 42];
  const muted = [100, 116, 139];
  const light = [241, 245, 249];

  // === HEADER BAR ===
  doc.setFillColor(primary[0], primary[1], primary[2]);
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", margin, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Hajj Wallet Store", margin, 28);
  doc.text("Your Sacred Journey Starts Here", margin, 34);

  // Order ref on right
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`#${data.orderId.slice(0, 8).toUpperCase()}`, pageWidth - margin, 18, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(data.date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), pageWidth - margin, 26, { align: "right" });
  doc.text(data.date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }), pageWidth - margin, 33, { align: "right" });

  y = 52;

  // === BILL TO ===
  doc.setTextColor(muted[0], muted[1], muted[2]);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO", margin, y);
  y += 6;

  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(data.customerName, margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(muted[0], muted[1], muted[2]);
  doc.text(data.customerEmail, margin, y);
  y += 4;

  // Payment method on right
  doc.setTextColor(muted[0], muted[1], muted[2]);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT METHOD", pageWidth - margin - 50, 52);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.text(data.paymentMethod === "card" ? "Card Payment" : "Cash on Delivery", pageWidth - margin - 50, 58);

  y += 10;

  // === TABLE HEADER ===
  doc.setFillColor(light[0], light[1], light[2]);
  doc.roundedRect(margin, y, contentWidth, 10, 2, 2, "F");
  doc.setTextColor(muted[0], muted[1], muted[2]);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("PRODUCT", margin + 4, y + 7);
  doc.text("SIZE", margin + 90, y + 7);
  doc.text("COLOR", margin + 110, y + 7);
  doc.text("QTY", margin + 135, y + 7);
  doc.text("PRICE", margin + 148, y + 7);
  doc.text("TOTAL", pageWidth - margin - 4, y + 7, { align: "right" });
  y += 14;

  // === TABLE ROWS ===
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  data.items.forEach((item, i) => {
    if (i > 0) {
      doc.setDrawColor(light[0], light[1], light[2]);
      doc.line(margin, y - 2, pageWidth - margin, y - 2);
    }

    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.setFont("helvetica", "normal");
    // Truncate long names
    const displayName = item.name.length > 30 ? item.name.substring(0, 28) + "..." : item.name;
    doc.text(displayName, margin + 4, y + 4);
    doc.setTextColor(muted[0], muted[1], muted[2]);
    doc.text(item.size, margin + 90, y + 4);
    doc.text(item.color, margin + 110, y + 4);
    doc.text(String(item.quantity), margin + 137, y + 4);
    doc.text(`$${item.price.toFixed(2)}`, margin + 148, y + 4);

    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.setFont("helvetica", "bold");
    doc.text(`$${(item.price * item.quantity).toFixed(2)}`, pageWidth - margin - 4, y + 4, { align: "right" });

    y += 12;
  });

  y += 4;

  // === DIVIDER ===
  doc.setDrawColor(primary[0], primary[1], primary[2]);
  doc.setLineWidth(0.5);
  doc.line(pageWidth - margin - 80, y, pageWidth - margin, y);
  y += 8;

  // === SUMMARY ===
  const summaryX = pageWidth - margin - 80;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(muted[0], muted[1], muted[2]);
  doc.text("Subtotal", summaryX, y);
  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.text(`$${data.subtotal.toFixed(2)}`, pageWidth - margin - 4, y, { align: "right" });
  y += 7;

  if (data.tierDiscount > 0) {
    doc.setTextColor(primary[0], primary[1], primary[2]);
    doc.text("Member Discount (10%)", summaryX, y);
    doc.text(`-$${data.tierDiscount.toFixed(2)}`, pageWidth - margin - 4, y, { align: "right" });
    y += 7;
  }

  if (data.couponDiscount > 0) {
    doc.setTextColor(primary[0], primary[1], primary[2]);
    doc.text(`Coupon${data.couponCode ? ` (${data.couponCode})` : ""}`, summaryX, y);
    doc.text(`-$${data.couponDiscount.toFixed(2)}`, pageWidth - margin - 4, y, { align: "right" });
    y += 7;
  }

  doc.setTextColor(muted[0], muted[1], muted[2]);
  doc.text("Shipping", summaryX, y);
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.setFont("helvetica", "bold");
  doc.text("FREE", pageWidth - margin - 4, y, { align: "right" });
  y += 10;

  // Total box
  doc.setFillColor(primary[0], primary[1], primary[2]);
  doc.roundedRect(summaryX - 4, y - 5, 84, 14, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL", summaryX, y + 4);
  doc.setFontSize(13);
  doc.text(`$${data.total.toFixed(2)}`, pageWidth - margin - 4, y + 4, { align: "right" });

  y += 24;

  // === FOOTER ===
  doc.setDrawColor(light[0], light[1], light[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setTextColor(muted[0], muted[1], muted[2]);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for your purchase! A portion of all proceeds supports our Hajj sponsorship program.", margin, y);
  y += 5;
  doc.text("Questions? Contact us at support@hajjwallet.com", margin, y);
  y += 10;

  // Decorative bottom bar
  doc.setFillColor(primary[0], primary[1], primary[2]);
  doc.rect(0, doc.internal.pageSize.getHeight() - 8, pageWidth, 8, "F");

  return doc;
}
