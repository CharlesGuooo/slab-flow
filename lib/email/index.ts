// Email service using Resend

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Send email using Resend
async function sendResendEmail(options: EmailOptions): Promise<EmailResult> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const EMAIL_FROM = process.env.EMAIL_FROM || 'SlabFlow <noreply@slabflow.com>';

  if (!RESEND_API_KEY) {
    console.log('[EMAIL] No Resend API key, logging to console');
    console.log('\n========================================');
    console.log('📧 DEVELOPMENT EMAIL');
    console.log('========================================');
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log('----------------------------------------');
    console.log(options.text || options.html.replace(/<[^>]*>/g, ''));
    console.log('========================================\n');

    return {
      success: true,
      messageId: `dev-${Date.now()}`,
    };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[EMAIL] Resend error:', error);
      return {
        success: false,
        error: error.message || `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    console.log('[EMAIL] Sent successfully:', data.id);

    return {
      success: true,
      messageId: data.id,
    };
  } catch (error) {
    console.error('[EMAIL] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  return sendResendEmail(options);
}

// Email templates
export function generateNewOrderEmail(
  customerName: string,
  orderId: number,
  stoneName: string | null,
  tenantName: string
): EmailOptions {
  return {
    to: '', // Will be set by caller
    subject: `New Quote Request #${orderId} - ${tenantName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">New Quote Request Received</h2>
        <p>Hello ${customerName},</p>
        <p>Thank you for your quote request! We've received your inquiry and will get back to you with a personalized quote soon.</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Order #:</strong> ${orderId}</p>
          <p style="margin: 8px 0 0 0;"><strong>Stone:</strong> ${stoneName || 'Custom Selection'}</p>
        </div>
        <p>We'll review your request and send you a quote within 24-48 hours.</p>
        <p>Best regards,<br>${tenantName} Team</p>
      </div>
    `,
    text: `New Quote Request #${orderId}\n\nHello ${customerName},\n\nThank you for your quote request! We've received your inquiry and will get back to you with a personalized quote soon.\n\nOrder #: ${orderId}\nStone: ${stoneName || 'Custom Selection'}\n\nWe'll review your request and send you a quote within 24-48 hours.\n\nBest regards,\n${tenantName} Team`,
  };
}

export function generateQuoteReadyEmail(
  customerName: string,
  orderId: number,
  stoneName: string | null,
  quotePrice: string,
  tenantName: string,
  tenantPhone: string | null
): EmailOptions {
  return {
    to: '', // Will be set by caller
    subject: `Your Quote is Ready #${orderId} - ${tenantName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Your Quote is Ready!</h2>
        <p>Hello ${customerName},</p>
        <p>Great news! Your personalized quote is ready for review.</p>
        <div style="background-color: #ecfdf5; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #10b981;">
          <h3 style="margin: 0 0 8px 0; color: #10b981;">Quote Amount</h3>
          <p style="margin: 0; font-size: 24px; font-weight: bold; color: #1f2937;">$${quotePrice}</p>
        </div>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Order #:</strong> ${orderId}</p>
          <p style="margin: 8px 0 0 0;"><strong>Stone:</strong> ${stoneName || 'Custom Selection'}</p>
        </div>
        <p>Please log in to your account to view the full details and proceed with your order.</p>
        ${tenantPhone ? `<p>Questions? Call us at ${tenantPhone}</p>` : ''}
        <p>Best regards,<br>${tenantName} Team</p>
      </div>
    `,
    text: `Your Quote is Ready #${orderId}\n\nHello ${customerName},\n\nGreat news! Your personalized quote is ready for review.\n\nQuote Amount: $${quotePrice}\nOrder #: ${orderId}\nStone: ${stoneName || 'Custom Selection'}\n\nPlease log in to your account to view the full details and proceed with your order.\n${tenantPhone ? `Questions? Call us at ${tenantPhone}\n` : ''}\nBest regards,\n${tenantName} Team`,
  };
}

export function generateAdminNotificationEmail(
  adminName: string,
  orderId: number,
  customerName: string,
  customerEmail: string,
  tenantName: string
): EmailOptions {
  return {
    to: '', // Will be set by caller
    subject: `New Quote Request #${orderId} - Action Required`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">New Quote Request</h2>
        <p>Hello ${adminName},</p>
        <p>A new quote request has been submitted and requires your attention.</p>
        <div style="background-color: #fef3c7; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #f59e0b;">
          <p style="margin: 0;"><strong>Order #:</strong> ${orderId}</p>
          <p style="margin: 8px 0 0 0;"><strong>Customer:</strong> ${customerName}</p>
          <p style="margin: 8px 0 0 0;"><strong>Email:</strong> ${customerEmail}</p>
        </div>
        <p>Please log in to your admin panel to review and respond to this request.</p>
        <p>Best regards,<br>${tenantName} System</p>
      </div>
    `,
    text: `New Quote Request #${orderId}\n\nHello ${adminName},\n\nA new quote request has been submitted and requires your attention.\n\nOrder #: ${orderId}\nCustomer: ${customerName}\nEmail: ${customerEmail}\n\nPlease log in to your admin panel to review and respond to this request.\n\nBest regards,\n${tenantName} System`,
  };
}

export function generateStatusUpdateEmail(
  customerName: string,
  orderId: number,
  newStatus: string,
  tenantName: string
): EmailOptions {
  const statusMessages: Record<string, string> = {
    quoted: 'Your quote is ready! Please log in to review the details.',
    in_progress: 'Work on your order has begun! We\'ll keep you updated on the progress.',
    completed: 'Your order is complete! Thank you for choosing us.',
    cancelled: 'Your order has been cancelled. Please contact us if you have any questions.',
  };

  return {
    to: '', // Will be set by caller
    subject: `Order #${orderId} Status Update - ${tenantName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Order Status Update</h2>
        <p>Hello ${customerName},</p>
        <p>Your order status has been updated.</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Order #:</strong> ${orderId}</p>
          <p style="margin: 8px 0 0 0;"><strong>New Status:</strong> ${newStatus.replace('_', ' ').toUpperCase()}</p>
        </div>
        <p>${statusMessages[newStatus] || 'Please log in to your account for more details.'}</p>
        <p>Best regards,<br>${tenantName} Team</p>
      </div>
    `,
    text: `Order #${orderId} Status Update\n\nHello ${customerName},\n\nYour order status has been updated.\n\nOrder #: ${orderId}\nNew Status: ${newStatus.replace('_', ' ').toUpperCase()}\n\n${statusMessages[newStatus] || 'Please log in to your account for more details.'}\n\nBest regards,\n${tenantName} Team`,
  };
}
