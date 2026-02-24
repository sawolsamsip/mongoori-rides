import Invoice from "../models/Invoice.js";
import Booking from "../models/Booking.js";
import Car from "../models/Car.js";
import PDFDocument from "pdfkit";

export const getInvoiceByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id;
    const role = req.user.role;

    const booking = await Booking.findById(bookingId).populate("car user owner");
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    const isUser = booking.user._id.toString() === userId.toString();
    const isOwner = role === "owner" && booking.owner._id.toString() === userId.toString();
    if (!isUser && !isOwner) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const invoice = await Invoice.findOne({ booking: bookingId });
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });

    res.json({ success: true, invoice, booking });
  } catch (err) {
    console.error("getInvoiceByBooking", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const downloadInvoicePDF = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id;
    const role = req.user.role;

    const booking = await Booking.findById(bookingId).populate("car user owner");
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    const isUser = booking.user._id.toString() === userId.toString();
    const isOwner = role === "owner" && booking.owner._id.toString() === userId.toString();
    if (!isUser && !isOwner) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const invoice = await Invoice.findOne({ booking: bookingId });
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });

    const isCancelled = invoice.status === "cancelled" || booking.status === "cancelled";

    // Human-friendly filename: brand-model_start_to_end_invoiceNumber.pdf (ASCII for compatibility)
    const pickupDateStr =
      booking.pickupDate?.toISOString?.()?.slice(0, 10) ||
      (booking.pickupDate ? booking.pickupDate.toString().split("T")[0] : "");
    const returnDateStr =
      booking.returnDate?.toISOString?.()?.slice(0, 10) ||
      (booking.returnDate ? booking.returnDate.toString().split("T")[0] : "");
    const rawCarName = `${booking.car?.brand || "Tesla"}-${booking.car?.model || "Model"}`;
    const safeCarSlug =
      rawCarName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-+|-+$/g, "") || "vehicle";
    const safePickup = pickupDateStr || "start";
    const safeReturn = returnDateStr || "end";
    const baseFileName = `mongoori-${safeCarSlug}-${safePickup}_to_${safeReturn}-${invoice.invoiceNumber}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${baseFileName}"`);

    const doc = new PDFDocument({ size: "A4", margin: 0 });
    doc.pipe(res);

    const pageW = doc.page.width;
    const margin = 56;
    const contentW = pageW - margin * 2;

    const formatDateShort = (d) => {
      if (!d) return "";
      const x = new Date(d);
      return isNaN(x.getTime()) ? "" : x.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };
    const formatDateISO = (d) => {
      if (!d) return "";
      const x = new Date(d);
      return isNaN(x.getTime()) ? "" : x.toISOString().slice(0, 10);
    };
    const pickupFormatted = formatDateISO(booking.pickupDate);
    const returnFormatted = formatDateISO(booking.returnDate);
    const dateRangeLabel = pickupFormatted && returnFormatted ? `${pickupFormatted} – ${returnFormatted}` : "";

    // Company info (optional env; fallbacks for professional look)
    const companyName = process.env.INVOICE_COMPANY_NAME || "Mongoori Rides";
    const companyEmail = process.env.INVOICE_COMPANY_EMAIL || "contact@mongoori.com";
    const companyPhone = process.env.INVOICE_COMPANY_PHONE || "";

    // —— Header: full-width dark (brand-aligned with site) ——
    const headerH = 132;
    doc.rect(0, 0, pageW, headerH).fill("#000000");
    doc.fontSize(9).fillColor("#737373").text("MONGOORI RIDES", margin, 44);
    doc.fontSize(26).fillColor("#ffffff").text("Invoice", margin, 60);
    doc.fontSize(9).fillColor("#a3a3a3").text(
      `${invoice.invoiceNumber}  ·  ${formatDateShort(invoice.createdAt)}`,
      margin,
      98
    );
    if (isCancelled && invoice.cancelledAt) {
      doc.fillColor("#ef4444").fontSize(9).text(`Cancelled ${formatDateShort(invoice.cancelledAt)}`, margin, 112);
    }
    // Company block (top right)
    doc.fontSize(9).fillColor("#a3a3a3");
    doc.text(companyName, margin + contentW - 160, 52, { width: 160, align: "right" });
    doc.text(companyEmail, margin + contentW - 160, 66, { width: 160, align: "right" });
    if (companyPhone) doc.text(companyPhone, margin + contentW - 160, 80, { width: 160, align: "right" });

    // Watermark: PAID when not cancelled, CANCELLED when cancelled
    if (isCancelled) {
      doc.opacity(0.1);
      doc.fontSize(52).fillColor("#000").text("CANCELLED", 0, 300, { width: pageW, align: "center", lineBreak: false });
      doc.opacity(1);
    } else {
      doc.opacity(0.06);
      doc.fontSize(48).fillColor("#0a0a0a").text("PAID", 0, 300, { width: pageW, align: "center", lineBreak: false });
      doc.opacity(1);
    }

    // —— Body: off-white, clear sections ——
    doc.rect(0, headerH, pageW, doc.page.height - headerH).fill("#f5f5f5");
    let y = headerH + 36;

    // Three cards: Bill to | Trip details | Payment
    const cardW = contentW / 3 - 12;
    const cardLeft1 = margin;
    const cardLeft2 = margin + contentW / 3 + 6;
    const cardLeft3 = margin + (contentW / 3) * 2 + 12;

    doc.fontSize(8).fillColor("#737373");
    doc.text("BILL TO", cardLeft1, y);
    doc.text("TRIP", cardLeft2, y);
    doc.text("PAYMENT", cardLeft3, y);
    y += 16;
    doc.fontSize(12).fillColor("#171717");
    doc.text(booking.user?.name || "Guest", cardLeft1, y, { width: cardW });
    y += 18;
    doc.fontSize(10).fillColor("#525252");
    doc.text(booking.user?.email || "—", cardLeft1, y, { width: cardW });
    doc.fontSize(12).fillColor("#171717");
    doc.text(`${booking.car?.brand || "Tesla"} ${booking.car?.model}`, cardLeft2, y - 18, { width: cardW });
    doc.fontSize(10).fillColor("#525252");
    doc.text(dateRangeLabel || "—", cardLeft2, y, { width: cardW });
    const cardBrand = booking.cardBrand ? String(booking.cardBrand).charAt(0).toUpperCase() + String(booking.cardBrand).slice(1) : "";
    const cardLine = booking.cardLast4 ? `•••• ${booking.cardLast4}${cardBrand ? `  ${cardBrand}` : ""}` : "Paid";
    doc.fontSize(11).fillColor("#171717");
    doc.text(cardLine, cardLeft3, y - 9, { width: cardW });
    y += 36;

    // Divider
    doc.moveTo(margin, y).lineTo(margin + contentW, y).strokeColor("#e5e5e5").stroke();
    y += 28;

    // Table: Description | Amount
    doc.fontSize(8).fillColor("#737373");
    doc.text("DESCRIPTION", margin, y);
    doc.text("AMOUNT", margin + contentW - 72, y);
    y += 14;
    doc.moveTo(margin, y).lineTo(margin + contentW, y).strokeColor("#d4d4d4").stroke();
    y += 20;

    const lineItems = invoice.lineItems?.length ? invoice.lineItems : [{ description: "Vehicle rental", amount: invoice.amount, quantity: 1 }];
    const descBase = lineItems[0]?.description || "Vehicle rental";
    const descDisplay = dateRangeLabel ? `Vehicle rental  ·  ${dateRangeLabel}` : descBase;
    doc.fontSize(11).fillColor("#171717");
    doc.text(descDisplay, margin, y);
    doc.text(`$${Number(invoice.amount).toFixed(2)}`, margin + contentW - 72, y);
    y += 28;

    doc.moveTo(margin, y).lineTo(margin + contentW, y).strokeColor("#d4d4d4").stroke();
    y += 18;
    doc.fontSize(11).fillColor("#737373");
    doc.text("Total", margin, y);
    doc.fontSize(14).fillColor("#171717");
    doc.text(`$${Number(invoice.amount).toFixed(2)}`, margin + contentW - 72, y - 3);
    y += 40;

    doc.fontSize(9).fillColor("#737373");
    doc.text("Thank you for choosing Mongoori Rides. Orange County's premium Tesla experience.", margin, y, { width: contentW });
    doc.text("mongoori.com", margin, y + 18);
    doc.fontSize(8).fillColor("#a3a3a3");
    doc.text(companyName, margin, y + 40);
    doc.text(companyEmail, margin, y + 52);
    if (companyPhone) doc.text(companyPhone, margin, y + 64);

    doc.end();
  } catch (err) {
    console.error("downloadInvoicePDF", err);
    if (!res.headersSent) res.status(500).json({ success: false, message: err.message });
  }
};

export const listInvoicesForOwner = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }
    const bookings = await Booking.find({ owner: req.user._id }).select("_id");
    const bookingIds = bookings.map((b) => b._id);
    const invoices = await Invoice.find({ booking: { $in: bookingIds } })
      .populate({ path: "booking", populate: [{ path: "car" }, { path: "user", select: "name email" }] })
      .sort({ createdAt: -1 });
    res.json({ success: true, invoices });
  } catch (err) {
    console.error("listInvoicesForOwner", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
