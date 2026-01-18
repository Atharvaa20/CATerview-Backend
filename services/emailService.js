const nodemailer = require('nodemailer');

/**
 * Configure Nodemailer transporter with SMTP
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Function to send email using SMTP and Nodemailer
 */
const sendEmail = async (email, options) => {
  try {
    const { subject, html } = options;

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'CATerview'}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: subject,
      html: html
    };

    console.log(`Attempting to send email via SMTP to: ${email}`);

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email sent successfully via SMTP! Message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending email via SMTP:', error.message);
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



