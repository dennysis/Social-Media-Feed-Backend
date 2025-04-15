import nodemailer from 'nodemailer';
import crypto from 'crypto';
import prisma from '../config/database';
import { logger } from './logger';

// Create reusable transporter with better error handling
const createTransporter = () => {
  try {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } catch (error) {
    logger.error(`Failed to create email transporter: ${error}`);
    throw error;
  }
};

// Create the transporter once
let transporter: nodemailer.Transporter;
try {
  transporter = createTransporter();
} catch (error) {
  logger.error(`Email service initialization failed: ${error}`);
}

export const sendWelcomeEmail = async (email: string, username: string) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    logger.error('Email credentials not configured. Skipping welcome email.');
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Social Media App" <noreply@socialmedia.com>',
      to: email,
      subject: 'Welcome to Social Media App!',
      html: `
        <div>
          <h1>Welcome to Social Media App, ${username}!</h1>
          <p>Thank you for joining our community. We're excited to have you on board!</p>
          <p>You can now create posts, follow other users, and engage with content.</p>
          <p>If you have any questions, feel free to contact our support team.</p>
        </div>
      `,
    });
    logger.info(`Welcome email sent to ${email}`);
  } catch (error) {
    logger.error(`Error sending welcome email: ${error}`);
    // Don't throw the error to prevent registration failure
  }
};

export const generatePasswordResetToken = async (userId: number): Promise<string> => {
  // Generate a random token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash the token for storage
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  
  // Set expiry time (1 hour from now)
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  
  // Store the token in the database
  await prisma.passwordReset.upsert({
    where: { userId },
    update: {
      token: hashedToken,
      expiresAt
    },
    create: {
      userId,
      token: hashedToken,
      expiresAt
    }
  });
  
  return resetToken;
};

export const sendPasswordResetEmail = async (email: string, username: string, resetToken: string) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    logger.error('Email credentials not configured. Skipping password reset email.');
    return;
  }

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
  
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Social Media App" <noreply@socialmedia.com>',
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div>
          <h1>Password Reset Request</h1>
          <p>Hi ${username},</p>
          <p>You requested a password reset. Please click the link below to reset your password:</p>
          <p><a href="${resetUrl}">Reset Password</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });
    logger.info(`Password reset email sent to ${email}`);
  } catch (error) {
    logger.error(`Error sending password reset email: ${error}`);
    // Don't throw the error to prevent password reset flow failure
  }
};
