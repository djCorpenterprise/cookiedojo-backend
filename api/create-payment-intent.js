// Cookie Dojo — Payment Intent + Email Notifications
// Vercel Serverless Function
//
// ENV VARIABLES REQUIRED (set in Vercel dashboard):
//   STRIPE_SECRET_KEY   → sk_live_... (from Lori Beth's Stripe dashboard)
//   RESEND_API_KEY      → re_... (from resend.com — free, 3,000 emails/mo)
 
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_51TK2mjRy3Y2Vq6xkgSdGmz3XIuAnHXJCMwNikbvkJW9p6XRdLD5QA1MIFY7IvAwCPDsfopHPCGf3fTqs4wLQx0Tl002pO0jmsJ');
const { Resend } = require('resend');
// Resend is optional — emails send only when RESEND_API_KEY is set
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
 
const OWNER_EMAIL = 'cookiedojojax@gmail.com';
const FROM_EMAIL  = 'orders@cookiedojo.com'; // set up in Resend after domain connects
 
function generateOrderId() {
  return 'CD-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}
 
function formatItems(items) {
  return items.map(i => `${i.name} ×${i.qty} — $${i.lineTotal.toFixed(2)}`).join('\n');
}
 
function formatItemsHTML(items) {
  return items.map(i => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e8d4;">${i.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e8d4;text-align:center;">×${i.qty}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e8d4;text-align:right;font-weight:500;">$${i.lineTotal.toFixed(2)}</td>
    </tr>`).join('');
}
 
// ── CUSTOMER RECEIPT EMAIL ──
function customerReceiptHTML({ orderId, name, items, total, address, notes }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#FBF4E6;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#FFFDF7;border-radius:6px;overflow:hidden;border:1px solid #EDD9A3;">
 
    <!-- Header -->
    <div style="background:#1C1209;padding:32px 40px;text-align:center;">
      <div style="font-size:28px;font-weight:700;color:#FBF4E6;letter-spacing:.02em;">
        Cookie <span style="color:#D4A843;">Dojo</span>
      </div>
      <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:rgba(251,244,230,.4);margin-top:6px;">
        Jacksonville, FL
      </div>
    </div>
 
    <!-- Order confirmed banner -->
    <div style="background:#C8721A;padding:16px 40px;text-align:center;">
      <div style="font-size:14px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:#FFFDF7;">
        ✓ Order Confirmed
      </div>
    </div>
 
    <!-- Body -->
    <div style="padding:40px;">
      <p style="font-size:16px;color:#1C1209;margin:0 0 8px;">Hi ${name},</p>
      <p style="font-size:15px;color:#3D2B18;font-weight:300;line-height:1.7;margin:0 0 32px;">
        Your Cookie Dojo order is confirmed! We'll be in touch shortly to coordinate delivery or pickup.
        Everything is made fresh — please allow 48 hours from your order time.
      </p>
 
      <!-- Order ID -->
      <div style="background:#F5E8C8;border:1px solid #EDD9A3;border-radius:4px;padding:14px 20px;margin-bottom:28px;text-align:center;">
        <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#C8721A;margin-bottom:4px;">Order Number</div>
        <div style="font-size:20px;font-weight:700;color:#1C1209;letter-spacing:.05em;">${orderId}</div>
      </div>
 
      <!-- Items table -->
      <div style="margin-bottom:28px;">
        <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#C8721A;margin-bottom:12px;">Items Ordered</div>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#FBF4E6;">
              <th style="padding:8px 12px;text-align:left;font-weight:500;color:#3D2B18;font-size:11px;letter-spacing:.1em;text-transform:uppercase;">Item</th>
              <th style="padding:8px 12px;text-align:center;font-weight:500;color:#3D2B18;font-size:11px;letter-spacing:.1em;text-transform:uppercase;">Qty</th>
              <th style="padding:8px 12px;text-align:right;font-weight:500;color:#3D2B18;font-size:11px;letter-spacing:.1em;text-transform:uppercase;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${formatItemsHTML(items)}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding:14px 12px;font-size:16px;font-weight:700;color:#1C1209;">Total</td>
              <td style="padding:14px 12px;font-size:18px;font-weight:700;color:#C8721A;text-align:right;">$${total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
 
      <!-- Delivery -->
      ${address ? `
      <div style="margin-bottom:20px;">
        <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#C8721A;margin-bottom:8px;">Delivery / Pickup</div>
        <div style="font-size:14px;color:#3D2B18;font-weight:300;">${address}</div>
      </div>` : ''}
 
      <!-- Notes -->
      ${notes ? `
      <div style="margin-bottom:20px;">
        <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#C8721A;margin-bottom:8px;">Your Notes</div>
        <div style="font-size:14px;color:#3D2B18;font-weight:300;font-style:italic;">"${notes}"</div>
      </div>` : ''}
 
      <hr style="border:none;border-top:1px solid #EDD9A3;margin:28px 0;">
 
      <p style="font-size:13px;color:#6B3E1F;font-weight:300;line-height:1.7;margin:0;">
        Questions? Reply to this email or reach out at <a href="mailto:cookiedojojax@gmail.com" style="color:#C8721A;">cookiedojojax@gmail.com</a>.
        We can't wait for you to try your order! 🍪
      </p>
    </div>
 
    <!-- Footer -->
    <div style="background:#FBF4E6;padding:20px 40px;text-align:center;border-top:1px solid #EDD9A3;">
      <div style="font-size:11px;color:#6B3E1F;letter-spacing:.08em;">
        Cookie Dojo · Jacksonville, FL · cookiedojo.com
      </div>
    </div>
  </div>
</body>
</html>`;
}
 
// ── OWNER NOTIFICATION EMAIL ──
function ownerNotificationHTML({ orderId, name, email, phone, items, total, address, notes }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#1C1209;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#FFFDF7;border-radius:6px;overflow:hidden;">
 
    <div style="background:#C8721A;padding:20px 32px;">
      <div style="font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#FFFDF7;">
        🛎 New Cookie Dojo Order
      </div>
      <div style="font-size:22px;font-weight:700;color:#FFFDF7;margin-top:4px;">${orderId}</div>
    </div>
 
    <div style="padding:32px;">
 
      <div style="margin-bottom:24px;">
        <div style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#C8721A;margin-bottom:10px;">Customer</div>
        <div style="font-size:15px;font-weight:500;color:#1C1209;">${name}</div>
        <div style="font-size:13px;color:#6B3E1F;margin-top:2px;">${email}</div>
        <div style="font-size:13px;color:#6B3E1F;margin-top:2px;">${phone}</div>
      </div>
 
      <div style="margin-bottom:24px;">
        <div style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#C8721A;margin-bottom:10px;">Items</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          ${formatItemsHTML(items)}
          <tr style="background:#FBF4E6;">
            <td colspan="2" style="padding:10px 12px;font-weight:700;color:#1C1209;">TOTAL</td>
            <td style="padding:10px 12px;font-weight:700;color:#C8721A;text-align:right;font-size:16px;">$${total.toFixed(2)}</td>
          </tr>
        </table>
      </div>
 
      ${address ? `
      <div style="margin-bottom:16px;">
        <div style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#C8721A;margin-bottom:6px;">Delivery / Pickup</div>
        <div style="font-size:13px;color:#3D2B18;">${address}</div>
      </div>` : ''}
 
      ${notes ? `
      <div style="margin-bottom:16px;">
        <div style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#C8721A;margin-bottom:6px;">Customer Notes</div>
        <div style="font-size:13px;color:#3D2B18;font-style:italic;background:#FBF4E6;padding:10px 14px;border-left:3px solid #C8721A;">"${notes}"</div>
      </div>` : ''}
 
      <div style="margin-top:24px;padding:14px;background:#F5E8C8;border-radius:4px;text-align:center;font-size:12px;color:#6B3E1F;">
        Payment confirmed by Stripe · Reply to ${email} to reach the customer
      </div>
    </div>
  </div>
</body>
</html>`;
}
 
// ── MAIN HANDLER ──
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
 
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
 
  const { amount, currency, customer_name, customer_email, customer_phone, items, notes, address } = req.body;
 
  // Basic validation
  if (!amount || amount < 50) return res.status(400).json({ error: 'Invalid order amount' });
  if (!customer_email || !customer_name) return res.status(400).json({ error: 'Missing customer info' });
 
  const orderId = generateOrderId();
  const total   = amount / 100;
 
  try {
    // 1. Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency || 'usd',
      metadata: {
        order_id:        orderId,
        customer_name,
        customer_email,
        customer_phone:  customer_phone || '',
        delivery:        address || '',
        notes:           notes || '',
      },
      receipt_email: customer_email,
      description:   `Cookie Dojo Order ${orderId}`,
    });
 
    // 2 & 3. Send emails if Resend is configured
    if (resend) {
      await resend.emails.send({
        from:    FROM_EMAIL,
        to:      customer_email,
        subject: `Your Cookie Dojo Order is Confirmed! (${orderId})`,
        html:    customerReceiptHTML({ orderId, name: customer_name, items, total, address: address || '', notes: notes || '' }),
      });
      await resend.emails.send({
        from:    FROM_EMAIL,
        to:      OWNER_EMAIL,
        subject: `🛎 New Order ${orderId} — $${total.toFixed(2)} from ${customer_name}`,
        html:    ownerNotificationHTML({ orderId, name: customer_name, email: customer_email, phone: customer_phone || '', items, total, address: address || '', notes: notes || '' }),
      });
    } else {
      console.log(`Order ${orderId} placed by ${customer_name} — $${total.toFixed(2)} (email skipped, no RESEND_API_KEY)`);
    }
 
    // 4. Respond with client secret + order ID
    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      orderId,
    });
 
  } catch (err) {
    console.error('Cookie Dojo payment error:', err);
    return res.status(500).json({ error: err.message || 'Payment server error' });
  }
};
