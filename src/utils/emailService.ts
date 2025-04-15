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

// Common email styles
const emailStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }
  body {
    background-color: #f9f9f9;
    color: #333333;
    line-height: 1.6;
  }
  .email-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }
  .email-header {
    text-align: center;
    padding-bottom: 20px;
    border-bottom: 1px solid #eeeeee;
    margin-bottom: 20px;
  }
  .logo {
    font-size: 24px;
    font-weight: bold;
    color: #4a6cf7;
    margin-bottom: 10px;
  }
  h1 {
    color: #4a6cf7;
    margin-bottom: 15px;
    font-size: 24px;
  }
  p {
    margin-bottom: 15px;
    color: #555555;
  }
  .button {
    display: inline-block;
    padding: 12px 24px;
    background-color: #4a6cf7;
    color: #ffffff !important;
    text-decoration: none;
    border-radius: 4px;
    font-weight: 600;
    margin: 15px 0;
    text-align: center;
    transition: background-color 0.3s ease;
  }
  .button:hover {
    background-color: #3a5bd9;
  }
  .footer {
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #eeeeee;
    text-align: center;
    font-size: 12px;
    color: #999999;
  }
  .social-links {
    margin-top: 15px;
  }
  .social-links a {
    display: inline-block;
    margin: 0 10px;
    color: #4a6cf7;
    text-decoration: none;
  }
  .highlight {
    font-weight: bold;
    color: #4a6cf7;
  }
  .note {
    background-color: #f5f5f5;
    padding: 15px;
    border-radius: 4px;
    font-size: 14px;
    margin: 20px 0;
  }
  @media only screen and (max-width: 600px) {
    .email-container {
      width: 100%;
      padding: 15px;
    }
    h1 {
      font-size: 20px;
    }
    .button {
      display: block;
      width: 100%;
    }
  }
`;

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
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Social Media App</title>
          <style>
            ${emailStyles}
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="email-header">
              <div class="logo">Social Media App</div>
              <p>Connect. Share. Engage.</p>
            </div>
            
            <h1>Welcome to the Community, ${username}! 🎉</h1>
            
            <p>We're thrilled to have you join our growing network of creators, innovators, and connectors. Your journey with us begins now!</p>
            
            <p>With your new account, you can:</p>
            
            <ul style="margin-left: 20px; margin-bottom: 20px;">
              <li>Create and share engaging posts</li>
              <li>Follow interesting people and topics</li>
              <li>Engage with content through likes and comments</li>
              <li>Build your own personal network</li>
            </ul>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/explore" class="button">Explore Content</a>
            
            <div class="note">
              <p style="margin-bottom: 0;">Need help getting started? Check out our <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/getting-started" style="color: #4a6cf7; text-decoration: none;">quick start guide</a> for tips on making the most of your experience.</p>
            </div>
            
            <p>If you have any questions or need assistance, our support team is always ready to help!</p>
            
            <p>Happy connecting,<br>The Social Media App Team</p>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} Social Media App. All rights reserved.</p>
              <div class="social-links">
                <a href="#">Twitter</a> | <a href="#">Facebook</a> | <a href="#">Instagram</a>
              </div>
              <p style="margin-top: 15px;">
                You're receiving this email because you signed up for Social Media App.<br>
                If you didn't create this account, please <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/contact" style="color: #4a6cf7;">contact us</a>.
              </p>
            </div>
          </div>
        </body>
        </html>
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
      subject: 'Reset Your Password - Social Media App',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            ${emailStyles}
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="email-header">
              <div class="logo">Social Media App</div>
              <p>Account Security</p>
            </div>
            
            <h1>Password Reset Request</h1>
            
            <p>Hi <span class="highlight">${username}</span>,</p>
            
            <p>We received a request to reset your password for your Social Media App account. If you didn't make this request, you can safely ignore this email.</p>
            
            <p>To reset your password, click the button below. This link will expire in <span class="highlight">1 hour</span> for security reasons.</p>
            
            <a href="${resetUrl}" class="button">Reset My Password</a>
            
            <div class="note">
              <p style="margin-bottom: 5px;"><strong>Security Tips:</strong></p>
              <ul style="margin-left: 20px; margin-bottom: 0;">
                <li>Create a strong, unique password</li>
                <li>Never share your password with others</li>
                <li>Consider updating passwords regularly</li>
              </ul>
            </div>
            
            <p>If the button above doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 14px;">${resetUrl}</p>
            
            <p>If you didn't request a password reset, please <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/contact" style="color: #4a6cf7; text-decoration: none;">contact our support team</a> immediately as your account may be at risk.</p>
            
            <p>Regards,<br>The Social Media App Security Team</p>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} Social Media App. All rights reserved.</p>
              <p style="margin-top: 15px;">
                This is an automated message. Please do not reply to this email.<br>
                For assistance, contact <a href="mailto:support@socialmedia.com" style="color: #4a6cf7;">support@socialmedia.com</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    logger.info(`Password reset email sent to ${email}`);
  } catch (error) {
    logger.error(`Error sending password reset email: ${error}`);
    // Don't throw the error to prevent password reset flow failure
  }
};
