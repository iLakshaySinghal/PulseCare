import nodemailer from 'nodemailer';
import Notification from '../models/Notification.js';
import logger from '../config/logger.js';

let transporter = null;

// Initialize mail transport driver
const initTransporter = async () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || 'smtp.ethereal.email';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    // Production / Configured SMTP
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      pool: true // Use SMTP pooling
    });
    logger.info('SMTP Mail Transport initialized with configuration.');
  } else {
    // Ethereal Fallback for local testing
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      logger.info(`SMTP credentials missing. Created Ethereal account: ${testAccount.user}. Ethereal Mail URL: https://ethereal.email`);
    } catch (err) {
      logger.error(`Failed to create Ethereal mail account: ${err.message}`);
      // Null-object transport to prevent crash
      transporter = {
        sendMail: async (options) => {
          logger.warn(`SMTP offline. Mocked sending email to ${options.to}: ${options.subject}`);
          return { messageId: 'mock-id-' + Date.now() };
        }
      };
    }
  }
  return transporter;
};

/**
 * Compiles a simple template by replacing placeholder fields
 */
const compileTemplate = (htmlContent, context = {}) => {
  let compiled = htmlContent;
  Object.keys(context).forEach((key) => {
    compiled = compiled.replace(new RegExp(`{{${key}}}`, 'g'), context[key] || '');
  });
  return compiled;
};

/**
 * Core send mail service method with status logging and retry mechanisms.
 */
export const dispatchNotification = async ({
  recipientId,
  emailAddress,
  subject,
  htmlTemplate,
  context = {}
}) => {
  const body = compileTemplate(htmlTemplate, context);
  
  // 1. Create a Pending notification in DB
  const notificationRecord = await Notification.create({
    recipientId,
    type: 'Email',
    subject,
    body,
    status: 'Pending'
  });

  const smtpDriver = await initTransporter();
  const fromEmail = process.env.SMTP_FROM || 'hms-alerts@hospital.com';

  const maxRetries = 3;
  let success = false;
  let attempts = 0;
  let lastError = '';

  while (attempts < maxRetries && !success) {
    try {
      attempts++;
      const info = await smtpDriver.sendMail({
        from: `"HMS Health Alerts" <${fromEmail}>`,
        to: emailAddress,
        subject: subject,
        html: body
      });

      success = true;
      
      // If Ethereal test account, print preview URL
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        logger.info(`[Ethereal Preview URL]: ${previewUrl}`);
      }

      notificationRecord.status = 'Sent';
      notificationRecord.retryCount = attempts;
      notificationRecord.sentAt = new Date();
      await notificationRecord.save();

      logger.info(`Email dispatched to ${emailAddress} - Message ID: ${info.messageId}`);
    } catch (err) {
      lastError = err.message;
      logger.warn(`Failed sending email to ${emailAddress} on attempt ${attempts}: ${err.message}`);
    }
  }

  if (!success) {
    notificationRecord.status = 'Failed';
    notificationRecord.retryCount = attempts;
    notificationRecord.errorMessage = lastError;
    await notificationRecord.save();
    logger.error(`Notification dispatch failed permanently for user ${recipientId}: ${lastError}`);
  }

  return success;
};

export default {
  dispatchNotification
};
