import nodemailer from 'nodemailer';

// Create reusable transporter using Hostinger SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true, // SSL
  auth: {
    user: 'support@yousufrice.com',
    pass: process.env.SMTP_PASSWORD || '',
  },
});

// Verify transporter configuration (non-blocking)
transporter.verify()
  .then(() => {
    console.log('✅ SMTP server is ready to send emails');
  })
  .catch((error) => {
    console.error('❌ SMTP connection error:', error);
    console.error('Email functionality may not work. Please check SMTP_PASSWORD in .env.local');
  });

interface OrderItem {
  productName: string;
  quantity: number;
  price: number;
  originalPrice?: number;
  savings?: number;
  savingsPercentage?: number;
  tierApplied?: string | null;
}

interface OrderConfirmationData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  mapsUrl: string;
  items: OrderItem[];
  totalPrice: number;
  totalSavings?: number;
  totalOriginalPrice?: number;
}

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

/**
 * Send order confirmation email to customer
 */
export async function sendOrderConfirmation(data: OrderConfirmationData) {
  const {
    orderId,
    customerName,
    customerEmail,
    customerPhone,
    deliveryAddress,
    mapsUrl,
    items,
    totalPrice,
    totalSavings = 0,
    totalOriginalPrice = 0,
  } = data;

  // Generate order items HTML
  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <div>${item.productName}</div>
        ${item.savings && item.savings > 0 ? `
          <div style="font-size: 12px; color: #059669; margin-top: 4px;">
            💰 Saved Rs. ${item.savings.toLocaleString()} (${item.savingsPercentage?.toFixed(0)}% off)
            ${item.tierApplied ? `<br>🎯 ${item.tierApplied} applied` : ''}
          </div>
        ` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity} kg</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
        ${item.originalPrice && item.savings && item.savings > 0 ? `
          <div style="text-decoration: line-through; color: #9ca3af; font-size: 12px;">Rs. ${item.originalPrice.toLocaleString()}</div>
        ` : ''}
        <div style="font-weight: bold;">Rs. ${item.price.toLocaleString()}</div>
      </td>
    </tr>
  `
    )
    .join('');

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - Yousuf Rice</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #27247b 0%, #27247b 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffff03; margin: 0; font-size: 32px; font-weight: bold;">🎉 Order Confirmed!</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Thank you for choosing Yousuf Rice</p>
            </td>
          </tr>

          <!-- Order Details -->
          <tr>
            <td style="padding: 30px;">
              <h2 style="color: #27247b; margin: 0 0 20px 0; font-size: 24px;">Hello ${customerName},</h2>
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
                Your order has been successfully placed! We'll deliver your premium rice to your doorstep soon.
              </p>

              <!-- Order Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Order ID</p>
                    <p style="margin: 0; color: #27247b; font-size: 18px; font-weight: bold;">#${orderId.slice(0, 8).toUpperCase()}</p>
                  </td>
                </tr>
              </table>

              <!-- Order Items -->
              <h3 style="color: #27247b; margin: 0 0 15px 0; font-size: 20px;">📦 Order Items</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 12px; text-align: left; color: #27247b; font-weight: bold;">Product</th>
                    <th style="padding: 12px; text-align: center; color: #27247b; font-weight: bold;">Quantity</th>
                    <th style="padding: 12px; text-align: right; color: #27247b; font-weight: bold;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr style="background-color: #ffff03;">
                    <td colspan="2" style="padding: 15px; font-weight: bold; color: #27247b; font-size: 16px;">Total</td>
                    <td style="padding: 15px; text-align: right; font-weight: bold; color: #27247b; font-size: 18px;">Rs. ${totalPrice.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>

              ${totalSavings > 0 ? `
              <!-- Savings Summary -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border: 2px solid #22c55e; border-radius: 8px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <h3 style="margin: 0 0 10px 0; color: #15803d; font-size: 20px;">🎉 Congratulations! You Saved Money!</h3>
                    <div style="margin-bottom: 10px;">
                      <span style="color: #6b7280; font-size: 14px; text-decoration: line-through;">Original Total: Rs. ${totalOriginalPrice.toLocaleString()}</span>
                    </div>
                    <div style="margin-bottom: 5px;">
                      <span style="color: #15803d; font-size: 24px; font-weight: bold;">You Saved: Rs. ${totalSavings.toLocaleString()}</span>
                    </div>
                    <div>
                      <span style="color: #15803d; font-size: 16px; font-weight: bold;">(${((totalSavings / totalOriginalPrice) * 100).toFixed(0)}% discount applied)</span>
                    </div>
                    <p style="margin: 15px 0 0 0; color: #374151; font-size: 14px;">
                      Thanks to our bulk pricing tiers, you got a better deal on your rice order!
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Delivery Info -->
              <h3 style="color: #27247b; margin: 0 0 15px 0; font-size: 20px;">🚚 Delivery Information</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Name</p>
                    <p style="margin: 0 0 15px 0; color: #27247b; font-weight: bold;">${customerName}</p>
                    
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Phone</p>
                    <p style="margin: 0 0 15px 0; color: #27247b; font-weight: bold;">${customerPhone}</p>
                    
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Delivery Address</p>
                    <p style="margin: 0 0 15px 0; color: #27247b; font-weight: bold;">${deliveryAddress}</p>
                    
                    <a href="${mapsUrl}" style="display: inline-block; background-color: #27247b; color: #ffff03; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">
                      📍 View on Google Maps
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Payment Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #27247b; border-radius: 8px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="margin: 0; color: #ffff03; font-size: 18px; font-weight: bold;">💰 Cash on Delivery</p>
                    <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 14px;">Pay when you receive your order</p>
                  </td>
                </tr>
              </table>

              <!-- Contact Info -->
              <p style="color: #6b7280; line-height: 1.6; margin: 0; font-size: 14px;">
                If you have any questions about your order, please contact us at 
                <a href="mailto:support@yousufrice.com" style="color: #27247b; text-decoration: none; font-weight: bold;">support@yousufrice.com</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Thank you for choosing Yousuf Rice!</p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Yousuf Rice. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const mailOptions = {
    from: '"Yousuf Rice" <support@yousufrice.com>',
    to: customerEmail,
    subject: `Order Confirmation #${orderId.slice(0, 8).toUpperCase()} - Yousuf Rice`,
    html: emailHtml,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    throw error;
  }
}

/**
 * Generate a 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP email for email verification
 */
export async function sendVerificationOTP(email: string, otp: string, name?: string) {
  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification - Yousuf Rice</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #27247b 0%, #27247b 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffff03; margin: 0; font-size: 32px; font-weight: bold;">🔐 Verify Your Email</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Welcome to Yousuf Rice</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #27247b; margin: 0 0 20px 0; font-size: 24px;">Hello${name ? ' ' + name : ''},</h2>
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
                Thank you for registering with Yousuf Rice! To complete your registration, please verify your email address using the OTP below:
              </p>

              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #27247b 0%, #27247b 100%); border-radius: 12px; padding: 30px;">
                      <tr>
                        <td align="center">
                          <p style="margin: 0 0 10px 0; color: #ffff03; font-size: 14px; font-weight: bold; letter-spacing: 2px;">YOUR OTP CODE</p>
                          <p style="margin: 0; color: #ffffff; font-size: 48px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff7ed; border-left: 4px solid #ffff03; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0; color: #92400e; line-height: 1.6; font-size: 14px;">
                      ⚠️ <strong>Important:</strong> This OTP will expire in 10 minutes. Do not share this code with anyone.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="color: #6b7280; line-height: 1.6; margin: 0; font-size: 14px;">
                If you didn't request this verification, please ignore this email or contact us at 
                <a href="mailto:support@yousufrice.com" style="color: #27247b; text-decoration: none; font-weight: bold;">support@yousufrice.com</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Thank you for choosing Yousuf Rice!</p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Yousuf Rice. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const mailOptions = {
    from: '"Yousuf Rice" <support@yousufrice.com>',
    to: email,
    subject: 'Verify Your Email - Yousuf Rice',
    html: emailHtml,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification OTP email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending verification OTP email:', error);
    throw error;
  }
}

/**
 * Send OTP email for password reset
 */
export async function sendPasswordResetOTP(email: string, otp: string, name?: string) {
  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset - Yousuf Rice</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #27247b 0%, #27247b 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffff03; margin: 0; font-size: 32px; font-weight: bold;">🔑 Reset Your Password</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Yousuf Rice Account</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #27247b; margin: 0 0 20px 0; font-size: 24px;">Hello${name ? ' ' + name : ''},</h2>
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
                We received a request to reset your password. Use the OTP below to proceed with resetting your password:
              </p>

              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #27247b 0%, #27247b 100%); border-radius: 12px; padding: 30px;">
                      <tr>
                        <td align="center">
                          <p style="margin: 0 0 10px 0; color: #ffff03; font-size: 14px; font-weight: bold; letter-spacing: 2px;">YOUR OTP CODE</p>
                          <p style="margin: 0; color: #ffffff; font-size: 48px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff7ed; border-left: 4px solid #ffff03; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0; color: #92400e; line-height: 1.6; font-size: 14px;">
                      ⚠️ <strong>Important:</strong> This OTP will expire in 10 minutes. Do not share this code with anyone.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="color: #6b7280; line-height: 1.6; margin: 0; font-size: 14px;">
                If you didn't request a password reset, please ignore this email or contact us immediately at 
                <a href="mailto:support@yousufrice.com" style="color: #27247b; text-decoration: none; font-weight: bold;">support@yousufrice.com</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Thank you for choosing Yousuf Rice!</p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Yousuf Rice. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const mailOptions = {
    from: '"Yousuf Rice" <support@yousufrice.com>',
    to: email,
    subject: 'Reset Your Password - Yousuf Rice',
    html: emailHtml,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset OTP email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset OTP email:', error);
    throw error;
  }
}

/**
 * Send contact form submission to business email
 */
export async function sendContactFormEmail(data: ContactFormData) {
  const { name, email, phone, message } = data;

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission - Yousuf Rice</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #27247b 0%, #27247b 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffff03; margin: 0; font-size: 28px; font-weight: bold;">📧 New Contact Message</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px;">From your website contact form</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <h2 style="color: #27247b; margin: 0 0 20px 0; font-size: 22px;">Contact Details</h2>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Name</p>
                    <p style="margin: 0 0 15px 0; color: #27247b; font-weight: bold; font-size: 16px;">${name}</p>
                    
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Email</p>
                    <p style="margin: 0 0 15px 0; color: #27247b; font-weight: bold; font-size: 16px;">
                      <a href="mailto:${email}" style="color: #27247b; text-decoration: none;">${email}</a>
                    </p>
                    
                    ${
                      phone
                        ? `
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Phone</p>
                    <p style="margin: 0; color: #27247b; font-weight: bold; font-size: 16px;">
                      <a href="tel:${phone}" style="color: #27247b; text-decoration: none;">${phone}</a>
                    </p>
                    `
                        : ''
                    }
                  </td>
                </tr>
              </table>

              <h3 style="color: #27247b; margin: 0 0 15px 0; font-size: 20px;">Message</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #ffff03;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0; color: #4b5563; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="mailto:${email}" style="display: inline-block; background-color: #27247b; color: #ffff03; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                      Reply to ${name}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Received on ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const mailOptions = {
    from: '"Yousuf Rice Website" <support@yousufrice.com>',
    to: 'support@yousufrice.com',
    replyTo: email,
    subject: `New Contact Form Submission from ${name}`,
    html: emailHtml,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Contact form email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending contact form email:', error);
    throw error;
  }
}
