import Stripe from 'stripe';
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { items, customer, delivery, special_instructions, total } = req.body;
        
        if (!items || !customer || !customer.name || !customer.email) {
            return res.status(400).json({ error: 'Missing required order information' });
        }
        
        // Generate order ID
        const orderId = 'CD-' + Date.now().toString(36).toUpperCase();
        
        // Prepare line items for Stripe
        const lineItems = items.map(item => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.name,
                    description: item.description,
                },
                unit_amount: Math.round(item.price * 100), // Convert to cents
            },
            quantity: item.quantity,
        }));
        
        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `https://www.cookiedojo.com/success.html?order_id=${orderId}`,
            cancel_url: `https://www.cookiedojo.com/cart.html`,
            customer_email: customer.email,
            metadata: {
                order_id: orderId,
                customer_name: customer.name,
                customer_phone: customer.phone,
                delivery_method: delivery.method,
                delivery_address: delivery.address,
                allergies: special_instructions.allergies,
                special_notes: special_instructions.notes
            }
        });
        
        // Send order emails immediately (before payment confirmation)
        await sendOrderEmails({
            orderId,
            items,
            customer,
            delivery,
            special_instructions,
            total,
            sessionId: session.id
        });
        
        res.json({ 
            sessionId: session.id,
            order_id: orderId
        });
        
    } catch (error) {
        console.error('Checkout session error:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
}

async function sendOrderEmails({ orderId, items, customer, delivery, special_instructions, total, sessionId }) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY not set — emails skipped');
        return;
    }
    
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Format items for email
    const itemsList = items.map(item => 
        `• ${item.name} (Qty: ${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}\n  ${item.description}`
    ).join('\n\n');
    
    // Delivery method display
    const deliveryInfo = delivery.method === 'pickup' 
        ? '🚗 PICKUP - Customer will arrange to pick up'
        : '🚚 DELIVERY REQUESTED - Contact customer to arrange delivery';
    
    // Betty's detailed order notification 
    const bettyEmailContent = `
🍪 NEW COOKIE DOJO ORDER - ${orderId}

📝 ITEMS TO MAKE:
${itemsList}

💰 TOTAL: $${total.toFixed(2)} (Payment processing via Stripe)
Stripe Session: ${sessionId}

👤 CUSTOMER CONTACT:
Name: ${customer.name}
Email: ${customer.email}
Phone: ${customer.phone}

📍 DELIVERY METHOD:
${deliveryInfo}
${delivery.address ? `Address/Notes: ${delivery.address}` : ''}

⚠️ ALLERGY ALERT:
${special_instructions.allergies ? `🚨 ALLERGIES: ${special_instructions.allergies}` : 'No allergies reported'}

🎨 SPECIAL REQUESTS:
${special_instructions.notes || 'None'}

📞 NEXT STEPS:
${delivery.method === 'pickup' 
    ? '1. Contact customer to arrange pickup time/location\n2. Begin preparing order (48hr standard lead time)\n3. Confirm pickup details with customer'
    : '1. Contact customer to arrange delivery\n2. Begin preparing order (48hr standard lead time)\n3. Coordinate delivery logistics'
}

---
Order placed: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}
Payment Status: Processing via Stripe Checkout
Customer will receive confirmation once payment is complete.
`;
    
    // Customer confirmation
    const customerEmailContent = `
Thank you for your Cookie Dojo order!

🍪 Order #: ${orderId}
💰 Total: $${total.toFixed(2)}

Your Order:
${itemsList}

📞 What's Next?
Betty will contact you at ${customer.phone} within 24 hours to:
${delivery.method === 'pickup' 
    ? '• Arrange pickup time and location\n• Confirm your order details\n• Answer any questions'
    : '• Arrange delivery time and location\n• Confirm your order details\n• Answer any questions'
}

⏰ Production Time: 48 hours standard lead time
${special_instructions.allergies ? `\n⚠️ Allergies Noted: ${special_instructions.allergies}` : ''}
${special_instructions.notes ? `🎨 Special Requests: ${special_instructions.notes}` : ''}

❓ Questions before Betty calls? 
Reply to this email or text (904) 329-0720

Thanks for choosing Cookie Dojo!
- Betty & the Cookie Dojo Team
`;
    
    try {
        // Send to Betty (Lori)
        await resend.emails.send({
            from: 'Cookie Dojo <orders@cookiedojo.com>',
            to: 'cookiedojojax@gmail.com', // Betty's email
            subject: `🍪 NEW ORDER ${orderId} - $${total.toFixed(2)} - ${delivery.method.toUpperCase()}`,
            text: bettyEmailContent
        });
        
        // Send to customer
        await resend.emails.send({
            from: 'Cookie Dojo <orders@cookiedojo.com>',
            to: customer.email,
            subject: `Cookie Dojo Order Confirmed! Betty will contact you soon (${orderId})`,
            text: customerEmailContent
        });
        
        console.log(`✅ Order emails sent for ${orderId} to cookiedojojax@gmail.com and ${customer.email}`);
        
    } catch (error) {
        console.error('❌ Failed to send order emails:', error);
        // Don't throw error here - let the checkout continue even if emails fail
    }
}
