import type { SubscriptionInvoice } from '@/types/contracts';

function sanitizePdfAscii(text: string): string {
  return String(text || '')
    .replace(/₹/g, 'Rs. ')
    .replace(/[–—]/g, '-')
    .replace(/[·•]/g, '|')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .trim();
}

function wrapText(text: string, maxChars: number): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const words = clean.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxChars) {
      current = (current + ' ' + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function formatInrPlain(n: number): string {
  return `Rs. ${Math.round(n || 0).toLocaleString('en-IN')}`;
}

/**
 * Generates an authentic, self-contained A4 PDF 1.4 binary document for a Leadsetu
 * subscription GST Tax Invoice and triggers an instant browser download.
 */
export function buildSubscriptionInvoicePdfBlob(
  inv: SubscriptionInvoice,
  ownerName?: string,
): Blob {
  const cmds: string[] = [];

  const drawRect = (
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    g: number,
    b: number,
  ) => {
    cmds.push(`${r} ${g} ${b} rg ${x} ${y} ${w} ${h} re f`);
  };

  const drawStrokeRect = (
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    g: number,
    b: number,
  ) => {
    cmds.push(`${r} ${g} ${b} RG 0.8 w ${x} ${y} ${w} ${h} re S`);
  };

  const drawText = (
    x: number,
    y: number,
    size: number,
    text: string,
    bold = false,
    r = 0.09,
    g = 0.14,
    b = 0.23,
  ) => {
    const font = bold ? 'F2' : 'F1';
    cmds.push(
      `BT /${font} ${size} Tf ${r} ${g} ${b} rg ${x} ${y} Td (${sanitizePdfAscii(text)}) Tj ET`,
    );
  };

  // A4 dimensions: 595 x 842 pt
  // Top Navy Header Banner
  drawRect(0, 738, 595, 104, 0.09, 0.14, 0.23);
  drawText(40, 800, 20, 'LEADSETU', true, 1, 1, 1);
  drawText(
    40,
    782,
    9.5,
    'OFFICIAL GST TAX INVOICE | SAAS SUBSCRIPTION RECEIPT',
    true,
    0.58,
    0.77,
    0.99,
  );
  drawText(
    40,
    766,
    8.5,
    inv.sellerCompany || 'Leadsetu Technologies (Anujali Technologies Pvt. Ltd.)',
    false,
    0.82,
    0.88,
    0.96,
  );
  drawText(
    40,
    752,
    8,
    inv.sellerAddress ||
      'Tower B, 7th Floor, Sector 62, Noida Electronic City, UP - 201309, India',
    false,
    0.75,
    0.83,
    0.94,
  );

  // Invoice Number Badge on top-right
  drawText(400, 800, 12, `INVOICE # ${inv.invoiceNumber}`, true, 1, 1, 1);
  drawText(
    400,
    784,
    9,
    `Issued: ${new Date(inv.issuedAt).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })}`,
    false,
    0.85,
    0.9,
    0.98,
  );
  drawText(
    400,
    770,
    9,
    `Status: ${inv.status === 'paid' ? 'PAID IN FULL' : 'TRIAL ACTIVE'}`,
    true,
    0.43,
    0.91,
    0.66,
  );
  drawText(
    400,
    756,
    8.5,
    `SAC Code: ${inv.sacCode || '998314'} | GST: ${inv.sellerGstin || '07AABCL4821K1Z5'}`,
    false,
    0.75,
    0.83,
    0.94,
  );

  // Billed By & Billed To Cards
  drawRect(40, 608, 250, 112, 0.96, 0.98, 1);
  drawStrokeRect(40, 608, 250, 112, 0.82, 0.86, 0.92);
  drawText(52, 702, 8.5, 'ISSUED BY (SUPPLIER - LEADSETU)', true, 0.22, 0.47, 0.92);
  drawText(
    52,
    686,
    9.5,
    inv.sellerCompany || 'Leadsetu Technologies (Anujali Technologies Pvt. Ltd.)',
    true,
  );
  const sellerLines = wrapText(
    inv.sellerAddress ||
      'Tower B, 7th Floor, Sector 62, Noida Electronic City, UP - 201309, India',
    42,
  );
  sellerLines.slice(0, 2).forEach((ln, idx) => {
    drawText(52, 670 - idx * 12, 8.5, ln, false, 0.3, 0.35, 0.45);
  });
  drawText(
    52,
    642,
    8.5,
    `GSTIN: ${inv.sellerGstin || '07AABCL4821K1Z5'} | PAN: AABCL4821K`,
    true,
  );
  drawText(
    52,
    626,
    8.5,
    `Billing Desk: ${inv.sellerEmail || 'billing@leadsetu.in'} | SAC: 998314`,
    false,
    0.3,
    0.35,
    0.45,
  );

  drawRect(305, 608, 250, 112, 0.97, 0.98, 1);
  drawStrokeRect(305, 608, 250, 112, 0.82, 0.86, 0.92);
  drawText(317, 702, 8.5, 'BILLED TO (CUSTOMER PROFILE)', true, 0.22, 0.47, 0.92);
  drawText(317, 686, 10, inv.buyerCompany || 'Customer Workspace', true);
  drawText(
    317,
    671,
    8.5,
    `Admin: ${ownerName || 'Workspace Admin'} (${inv.buyerEmail || ''})`,
    false,
    0.3,
    0.35,
    0.45,
  );
  drawText(
    317,
    657,
    8.5,
    `Buyer GSTIN: ${inv.buyerGstin || 'Unregistered / Applied'}`,
    true,
  );
  const buyerAddrLines = wrapText(
    `${inv.buyerAddress || 'India'} | State: ${inv.buyerState || 'Delhi (07)'}`,
    42,
  );
  buyerAddrLines.slice(0, 2).forEach((ln, idx) => {
    drawText(317, 642 - idx * 12, 8, ln, false, 0.3, 0.35, 0.45);
  });

  // Subscription Period & Payment Strip
  drawRect(40, 560, 515, 34, 0.94, 0.96, 0.99);
  drawStrokeRect(40, 560, 515, 34, 0.82, 0.86, 0.92);
  drawText(52, 574, 8.5, `Plan: ${inv.planName} (${inv.billingCycle.toUpperCase()})`, true);
  drawText(
    225,
    574,
    8.5,
    `Validity: ${inv.periodStart} to ${inv.periodEnd}`,
    false,
  );
  drawText(
    405,
    574,
    8.5,
    `Ref: ${inv.paymentReference || 'ACTIVE'}`,
    true,
    0.02,
    0.48,
    0.33,
  );

  // Table Header
  drawRect(40, 518, 515, 26, 0.09, 0.14, 0.23);
  drawText(52, 527, 8.5, 'DESCRIPTION OF SAAS SERVICES', true, 1, 1, 1);
  drawText(295, 527, 8.5, 'SAC', true, 1, 1, 1);
  drawText(355, 527, 8.5, 'SEATS', true, 1, 1, 1);
  drawText(415, 527, 8.5, 'CYCLE', true, 1, 1, 1);
  drawText(480, 527, 8.5, 'AMOUNT', true, 1, 1, 1);

  // Table Row
  drawRect(40, 470, 515, 48, 1, 1, 1);
  drawStrokeRect(40, 470, 515, 48, 0.82, 0.86, 0.92);
  drawText(
    52,
    498,
    9.5,
    `Leadsetu Cloud CRM - ${inv.planName}`,
    true,
  );
  drawText(
    52,
    483,
    8,
    `AI Lead Scoring, WhatsApp Inbox, GST Invoicing & AR Tracking`,
    false,
    0.38,
    0.42,
    0.5,
  );
  drawText(295, 495, 8.5, inv.sacCode || '998314', false);
  drawText(355, 495, 8.5, `${inv.seatsIncluded} Seats`, false);
  drawText(415, 495, 8.5, inv.billingCycle.toUpperCase(), false);
  drawText(480, 495, 9.5, formatInrPlain(inv.baseAmount), true);

  // Tax Summary Card (Right)
  drawRect(310, 344, 245, 114, 0.97, 0.98, 1);
  drawStrokeRect(310, 344, 245, 114, 0.82, 0.86, 0.92);
  drawText(322, 438, 9, 'Taxable Subscription Value:', false, 0.3, 0.35, 0.45);
  drawText(470, 438, 9, formatInrPlain(inv.baseAmount), true);

  if (inv.igstAmount > 0) {
    drawText(322, 418, 9, `IGST (${inv.gstRate || 18}% Inter-State):`, false, 0.3, 0.35, 0.45);
    drawText(470, 418, 9, formatInrPlain(inv.igstAmount), true);
  } else {
    drawText(322, 418, 9, 'CGST (9% Central Tax):', false, 0.3, 0.35, 0.45);
    drawText(470, 418, 9, formatInrPlain(inv.cgstAmount), true);
    drawText(322, 400, 9, 'SGST (9% State Tax):', false, 0.3, 0.35, 0.45);
    drawText(470, 400, 9, formatInrPlain(inv.sgstAmount), true);
  }

  drawRect(310, 344, 245, 36, 0.09, 0.14, 0.23);
  drawText(322, 358, 10, 'GRAND TOTAL PAID:', true, 1, 1, 1);
  drawText(470, 358, 11, formatInrPlain(inv.totalAmount), true, 0.43, 0.91, 0.66);

  // Payment Mode Details (Left)
  drawRect(40, 344, 255, 114, 0.98, 0.99, 1);
  drawStrokeRect(40, 344, 255, 114, 0.82, 0.86, 0.92);
  drawText(52, 438, 8.5, 'PAYMENT & SETTLEMENT AUDIT', true, 0.22, 0.47, 0.92);
  drawText(52, 418, 8.5, `Payment Mode: ${inv.paymentMode}`, false);
  drawText(52, 402, 8.5, `Transaction Ref: ${inv.paymentReference}`, false);
  drawText(
    52,
    386,
    8.5,
    `GST Input Tax Credit: 18% ITC Eligible`,
    true,
    0.02,
    0.48,
    0.33,
  );
  drawText(
    52,
    368,
    8,
    `Attached to Workspace Profile #${inv.buyerCompany}`,
    false,
    0.35,
    0.4,
    0.48,
  );

  // Warm Leadsetu Greeting & Appreciation Box
  drawRect(40, 210, 515, 110, 0.94, 0.97, 1);
  drawStrokeRect(40, 210, 515, 110, 0.45, 0.65, 0.96);
  drawText(
    54,
    298,
    10,
    'GREETINGS & THANK YOU FOR CHOOSING LEADSETU!',
    true,
    0.15,
    0.39,
    0.85,
  );
  const greetingText =
    inv.greetingNote ||
    `Dear ${inv.buyerCompany} Team, thank you for choosing Leadsetu to bridge every B2B lead, deal, and GST workflow across India! Warm regards, Team Leadsetu (New Delhi).`;
  const greetingLines = wrapText(greetingText, 88);
  greetingLines.slice(0, 4).forEach((line, idx) => {
    drawText(54, 276 - idx * 14, 9, line, false, 0.14, 0.18, 0.28);
  });

  // Footer
  drawText(
    40,
    120,
    8.5,
    'Authorized Signatory - Leadsetu Technologies (Anujali Technologies Pvt. Ltd.)',
    true,
  );
  drawText(
    40,
    104,
    8,
    'Registered Office: Tower B, 7th Floor, Sector 62, Noida, UP - 201309 | hello@leadsetu.in',
    false,
    0.4,
    0.45,
    0.55,
  );
  drawText(
    40,
    90,
    7.5,
    'This is an electronically generated GST Tax Invoice and does not require a physical signature.',
    false,
    0.48,
    0.52,
    0.6,
  );

  const streamContent = cmds.join('\n');

  // Build valid PDF 1.4 objects
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
    `6 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }
  const xrefPos = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}

export function downloadSubscriptionInvoicePdf(
  inv: SubscriptionInvoice,
  ownerName?: string,
) {
  const blob = buildSubscriptionInvoicePdfBlob(inv, ownerName);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Leadsetu-Subscription-Invoice-${inv.invoiceNumber}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
