/**
 * Function to send email using Brevo API (HTTPS)
 * This bypasses SMTP blocking on Render/Railway free plans.
 */
const sendEmail = async (email, options) => {
  try {
    const { subject, html } = options;
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
      console.error('Email Error: BREVO_API_KEY is missing');
      throw new Error('Email service configuration missing');
    }

    // Sanitize the API key for extra safety (remove any hidden spaces/quotes)
    const sanitizedApiKey = apiKey.trim().replace(/["']/g, '');

    console.log(`Attempting to send email via Brevo API to: ${email}`);
    // Log key length for debugging without exposing the actual key
    console.log(`API Key status: Loaded (Length: ${sanitizedApiKey.length})`);

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': sanitizedApiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: process.env.EMAIL_FROM_NAME || 'CATerview',
          email: process.env.SMTP_USER || 'caterview.otp@gmail.com'
        },
        to: [{ email: email }],
        subject: subject,
        htmlContent: html
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Brevo API Error:', data);
      throw new Error(data.message || 'Failed to send email via Brevo');
    }

    console.log('✅ Email sent successfully via Brevo API! Message ID:', data.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    throw new Error('Failed to send email');
  }
};

/**
 * Function to send OTP email for verification
 */
const sendOtpEmail = async (email, otp) => {
  const subject = 'Verify Your Email - CATerview';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #2563eb;">Email Verification</h2>
      <p>Thank you for registering with CATerview. Please use the following OTP to verify your email address:</p>
      <div style="background-color: #f3f4f6; padding: 15px; text-align: center; margin: 20px 0; font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #1f2937;">
        ${otp}
      </div>
      <p>This OTP will expire in 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="font-size: 12px; color: #6b7280;">This is an automated message, please do not reply.</p>
    </div>
  `;

  return sendEmail(email, { subject, html });
};

/**
 * Function to send password reset OTP email
 */
const sendPasswordResetOtpEmail = async (email, otp) => {
  const subject = 'Password Reset OTP - CATerview';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #2563eb;">Password Reset Request</h2>
      <p>You have requested to reset your password. Use the following OTP to proceed:</p>
      <div style="background-color: #f3f4f6; padding: 15px; text-align: center; margin: 20px 0; font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #1f2937;">
        ${otp}
      </div>
      <p>This OTP will expire in 10 minutes.</p>
      <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="font-size: 12px; color: #6b7280;">This is an automated message, please do not reply.</p>
    </div>
  `;

  return sendEmail(email, { subject, html });
};

module.exports = {
  sendOtpEmail,
  sendPasswordResetOtpEmail,
  sendEmail
};


