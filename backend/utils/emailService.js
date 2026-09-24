/**
 * utils/emailService.js
 * Sends transactional emails via Gmail SMTP using Nodemailer.
 *
 * Design rule: email is best-effort. If SMTP is not configured or sending
 * fails, log the error and continue — the API request must never fail
 * because an email couldn't be sent.
 */
const nodemailer = require('nodemailer');

/* ─── Config ────────────────────────────────────────────────────────────── */

const isConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;
const getTransporter = () => {
  if (transporter) return transporter;
  if (!isConfigured()) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
};

/* ─── Helpers ───────────────────────────────────────────────────────────── */

const money = (value) => `₹${Math.round(Number(value) || 0)}`;

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

/** Base HTML wrapper — warm editorial style matching the site. */
const wrap = (title, bodyHtml) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#FBF6EC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#2A1A14;line-height:1.6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF6EC;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFDF8;border:1px solid rgba(42,26,20,.14);border-radius:20px;overflow:hidden;">
          <tr>
            <td style="background:#6E2B20;padding:24px 28px;color:#FBF6EC;">
              <div style="font-family:Georgia,serif;font-size:1.25rem;font-weight:700;letter-spacing:-.01em;">Geeta's Madhuram Cafe</div>
              <div style="font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;opacity:.85;margin-top:4px;">Taste the South in Every Bite!</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px;border-top:1px solid rgba(42,26,20,.14);font-size:.75rem;color:#7C6A61;text-align:center;">
              Geeta's Madhuram Cafe · Agra Road, beside Tirupati Hospital, Kaneri, Bhiwandi 421302<br>
              <a href="tel:+919561979727" style="color:#6E2B20;text-decoration:none;">095619 79727</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/** Render the items table (used by two of the three email types). */
const itemsTable = (items = []) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 20px;font-size:.9rem;border-collapse:collapse;">
    ${items.map((item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid rgba(42,26,20,.08);">${escapeHtml(item.name)} × ${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid rgba(42,26,20,.08);text-align:right;">${money(item.price * item.quantity)}</td>
      </tr>
    `).join('')}
    <tr>
      <td style="padding:12px 0 4px;font-weight:700;">Total (${escapeHtml((items[0]?.paymentMethod || 'COD').toString().toUpperCase())})</td>
      <td style="padding:12px 0 4px;text-align:right;font-weight:700;color:#6E2B20;font-size:1.1rem;">${money(items.reduce((s, i) => s + i.price * i.quantity, 0))}</td>
    </tr>
  </table>
`;

/* ─── Senders ───────────────────────────────────────────────────────────── */

/**
 * Send a generic email. Never throws — logs on failure.
 * Returns true if sent, false if skipped/failed.
 */
const send = async ({ to, subject, html }) => {
  const tx = getTransporter();
  if (!tx || !to) {
    if (!tx) console.warn('⚠️  Email not sent — SMTP not configured');
    return false;
  }
  try {
    await tx.sendMail({
      from: `"Geeta's Madhuram Cafe" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('✗ Email send failed:', error.message);
    return false;
  }
};

/** Order confirmation → customer. */
const sendOrderConfirmation = async (order, customerEmail) => {
  if (!customerEmail) return false;

  const orderUrl = `${process.env.FRONTEND_URL || ''}/receipt.html?id=${encodeURIComponent(order.orderNumber)}`;

  const body = `
    <h2 style="margin:0 0 8px;font-family:Georgia,serif;">Thanks for your order!</h2>
    <p style="margin:0 0 16px;color:#7C6A61;">Order <strong style="color:#2A1A14;">${escapeHtml(order.orderNumber)}</strong> has been received.</p>

    ${itemsTable((order.items || []).map((i) => ({ ...i, paymentMethod: order.paymentMethod })))}

    <p style="margin:0 0 20px;color:#7C6A61;font-size:.88rem;">
      <strong style="color:#2A1A14;">Type:</strong> ${escapeHtml(order.orderType)}<br>
      <strong style="color:#2A1A14;">Phone:</strong> ${escapeHtml(order.phone)}<br>
      <strong style="color:#2A1A14;">Payment:</strong> ${escapeHtml((order.paymentMethod || 'cod').toUpperCase())}
    </p>

    <p style="margin:24px 0 0;">
      <a href="${orderUrl}" style="display:inline-block;background:#6E2B20;color:#FBF6EC;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600;font-size:.9rem;">View receipt</a>
    </p>
  `;

  return send({
    to: customerEmail,
    subject: `Order confirmed — ${order.orderNumber}`,
    html: wrap('Order confirmed', body),
  });
};

/** New order alert → owner. */
const sendNewOrderAlert = async (order, customerName) => {
  const owner = process.env.NOTIFICATION_EMAIL;
  if (!owner) return false;

  const adminUrl = `${process.env.FRONTEND_URL || ''}/admin`;

  const body = `
    <h2 style="margin:0 0 8px;font-family:Georgia,serif;">New order received</h2>
    <p style="margin:0 0 16px;color:#7C6A61;">
      <strong style="color:#2A1A14;">${escapeHtml(customerName || 'Guest')}</strong> just placed order
      <strong style="color:#2A1A14;">${escapeHtml(order.orderNumber)}</strong>.
    </p>

    ${itemsTable((order.items || []).map((i) => ({ ...i, paymentMethod: order.paymentMethod })))}

    <p style="margin:0 0 20px;color:#7C6A61;font-size:.88rem;">
      <strong style="color:#2A1A14;">Type:</strong> ${escapeHtml(order.orderType)}<br>
      <strong style="color:#2A1A14;">Phone:</strong> ${escapeHtml(order.phone)}<br>
      ${order.orderType === 'delivery' && order.customerAddress?.line
        ? `<strong style="color:#2A1A14;">Address:</strong> ${escapeHtml(order.customerAddress.line)}, ${escapeHtml(order.customerAddress.city || '')} ${escapeHtml(order.customerAddress.pincode || '')}<br>`
        : ''}
      ${order.notes ? `<strong style="color:#2A1A14;">Notes:</strong> ${escapeHtml(order.notes)}` : ''}
    </p>

    <p style="margin:24px 0 0;">
      <a href="${adminUrl}" style="display:inline-block;background:#6E2B20;color:#FBF6EC;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600;font-size:.9rem;">Open admin dashboard</a>
    </p>
  `;

  return send({
    to: owner,
    subject: `🔔 New order — ${order.orderNumber} · ${money(order.total)}`,
    html: wrap('New order', body),
  });
};

/** Status update → customer. */
const sendStatusUpdate = async (order, customerEmail, status) => {
  if (!customerEmail) return false;

  const statusLabels = {
    placed: 'Order placed',
    confirmed: 'Order confirmed',
    preparing: 'Being prepared',
    ready: 'Ready',
    'out-for-delivery': 'Out for delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  const label = statusLabels[status] || status;

  const orderUrl = `${process.env.FRONTEND_URL || ''}/customer-orders.html`;

  const body = `
    <h2 style="margin:0 0 8px;font-family:Georgia,serif;">Order update</h2>
    <p style="margin:0 0 16px;color:#7C6A61;">
      Order <strong style="color:#2A1A14;">${escapeHtml(order.orderNumber)}</strong> is now
      <strong style="color:#6E2B20;">${escapeHtml(label)}</strong>.
    </p>

    ${itemsTable((order.items || []).map((i) => ({ ...i, paymentMethod: order.paymentMethod })))}

    <p style="margin:24px 0 0;">
      <a href="${orderUrl}" style="display:inline-block;background:#6E2B20;color:#FBF6EC;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600;font-size:.9rem;">Track order</a>
    </p>
  `;

  return send({
    to: customerEmail,
    subject: `Order ${order.orderNumber} — ${label}`,
    html: wrap('Order update', body),
  });
};

module.exports = {
  isConfigured,
  send,
  sendOrderConfirmation,
  sendNewOrderAlert,
  sendStatusUpdate,
};