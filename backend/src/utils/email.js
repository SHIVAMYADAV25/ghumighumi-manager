const nodemailer = require('nodemailer');
const logger = require('./logger');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const emailTemplates = {
  verifyEmail: (name, url) => ({
    subject: 'Verify your WanderSync account',
    html: `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #FAFAF7;">
        <div style="background: #1C1C1E; border-radius: 12px; padding: 40px; text-align: center;">
          <h1 style="color: #E8C547; font-size: 28px; margin: 0 0 8px;">WanderSync</h1>
          <p style="color: #9E9E9E; font-size: 14px; margin: 0 0 32px;">Collaborative Trip Planning</p>
          <h2 style="color: #FAFAF7; font-size: 22px; margin: 0 0 16px;">Verify your email</h2>
          <p style="color: #B0B0B0; margin: 0 0 32px;">Hi ${name}, click the button below to verify your account.</p>
          <a href="${url}" style="display: inline-block; background: #E8C547; color: #1C1C1E; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px;">Verify Email</a>
          <p style="color: #666; font-size: 12px; margin: 32px 0 0;">Link expires in 24 hours. If you didn't create an account, ignore this email.</p>
        </div>
      </div>
    `,
  }),

  resetPassword: (name, url) => ({
    subject: 'Reset your WanderSync password',
    html: `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #FAFAF7;">
        <div style="background: #1C1C1E; border-radius: 12px; padding: 40px; text-align: center;">
          <h1 style="color: #E8C547; font-size: 28px; margin: 0 0 32px;">WanderSync</h1>
          <h2 style="color: #FAFAF7; font-size: 22px; margin: 0 0 16px;">Reset Password</h2>
          <p style="color: #B0B0B0; margin: 0 0 32px;">Hi ${name}, click below to reset your password. This link expires in 1 hour.</p>
          <a href="${url}" style="display: inline-block; background: #E8C547; color: #1C1C1E; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px;">Reset Password</a>
        </div>
      </div>
    `,
  }),

  tripInvite: (inviterName, tripTitle, role, url, message) => ({
    subject: `${inviterName} invited you to "${tripTitle}" on WanderSync`,
    html: `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #FAFAF7;">
        <div style="background: #1C1C1E; border-radius: 12px; padding: 40px; text-align: center;">
          <h1 style="color: #E8C547; font-size: 28px; margin: 0 0 32px;">WanderSync</h1>
          <h2 style="color: #FAFAF7; font-size: 22px; margin: 0 0 12px;">You're invited!</h2>
          <p style="color: #B0B0B0; margin: 0 0 8px;"><strong style="color: #E8C547;">${inviterName}</strong> invited you to collaborate on</p>
          <p style="color: #FAFAF7; font-size: 20px; font-weight: 700; margin: 0 0 8px;">${tripTitle}</p>
          <p style="color: #9E9E9E; margin: 0 0 ${message ? '16px' : '32px'};">Role: <span style="color: #E8C547; text-transform: capitalize;">${role}</span></p>
          ${message ? `<p style="color: #B0B0B0; font-style: italic; background: #2A2A2C; padding: 12px 16px; border-radius: 8px; margin: 0 0 32px;">"${message}"</p>` : ''}
          <a href="${url}" style="display: inline-block; background: #E8C547; color: #1C1C1E; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px;">Accept Invitation</a>
          <p style="color: #666; font-size: 12px; margin: 24px 0 0;">Invitation expires in 7 days.</p>
        </div>
      </div>
    `,
  }),
};

const sendEmail = async ({ to, ...template }) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"${process.env.FROM_NAME || 'WanderSync'}" <${process.env.FROM_EMAIL}>`,
      to,
      ...template,
    });
    logger.info(`Email sent to ${to}`);
  } catch (err) {
    logger.error('Email send error:', err.message);
    // Don't throw — email failures shouldn't break app flow
  }
};

module.exports = { sendEmail, emailTemplates };