import sgMail from "@sendgrid/mail";
import twilio from "twilio";
import "dotenv/config";

import { storage } from "../storage";
import { sendRealTimeMessage, broadcastToStudents, broadcastToCourse } from "./socket";

// Interface for notification details
export interface NotificationPayload {
  userId?: string | number;
  courseCode?: string;
  toEmail?: string;
  toPhone?: string;
  subject: string;
  message: string;
}

/**
 * Sends an email notification via SendGrid.
 * Falls back to console logging if credentials aren't set.
 */
export async function sendEmail({ toEmail, subject, message }: NotificationPayload): Promise<boolean> {
  if (!toEmail) return false;

  const settings = await storage.getSystemSettings();
  const apiKey = settings?.sendgridApiKey || process.env.SENDGRID_API_KEY;
  const fromEmail = settings?.sendgridFromEmail || process.env.SENDGRID_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    console.log("[EMAIL] SKIPPED: SendGrid credentials missing. Mocking success.");
    console.log(`[STUB-EMAIL] To: ${toEmail} | Sub: ${subject} | Msg: ${message}`);
    return true;
  }

  sgMail.setApiKey(apiKey);

  try {
    const msg = {
      to: toEmail,
      from: fromEmail,
      subject: subject,
      text: message,
      html: `<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #1a734d; border-radius: 10px;">
        <h2 style="color: #1a734d;">ZDSPGC Notification</h2>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #888;">This is an automated message from the ZDSPGC Online Enrollment System.</p>
      </div>`,
    };

    await sgMail.send(msg);
    console.log(`[EMAIL] SendGrid Delivery Successful to: ${toEmail}`);
    return true;
  } catch (error: any) {
    console.error("[EMAIL] SendGrid Error:", error.response?.body || error.message);
    return false;
  }
}

/**
 * Sends an SMS notification via Twilio.
 */
export async function sendSMS({ toPhone, message }: NotificationPayload): Promise<boolean> {
  if (!toPhone) return false;
  console.log(`[SMS] Attempting to send via Twilio to: ${toPhone}`);

  try {
    const settings = await storage.getSystemSettings();
    const sid = settings?.twilioSid || process.env.TWILIO_SID;
    const auth = settings?.twilioAuth || process.env.TWILIO_AUTH;
    const fromPhone = settings?.twilioPhone || process.env.TWILIO_PHONE;

    if (!sid || !auth || !fromPhone) {
      console.log("[SMS] SKIPPED: Twilio credentials missing. Mocking success.");
      console.log(`[STUB-SMS] To: ${toPhone} | Msg: ${message}`);
      return true;
    }

    const client = twilio(sid, auth);
    
    await client.messages.create({
      body: message,
      from: fromPhone,
      to: toPhone
    });

    console.log("[SMS] Twilio Delivery Successful.");
    return true;
  } catch (err: any) {
    console.error("[SMS] Twilio API Error:", err.message);
    return false;
  }
}

/**
 * Sends a real-time message via Socket.io.
 */
export async function sendRealTime({ userId, courseCode, message }: NotificationPayload): Promise<boolean> {
  if (userId) {
    sendRealTimeMessage(userId, message);
  } else if (courseCode) {
    broadcastToCourse(courseCode, message);
  } else {
    broadcastToStudents(message);
  }
  return true;
}

/**
 * Orchestrates sending notifications based on the target type.
 */
export async function notifyStudent(
  type: 'email' | 'sms' | 'realtime' | 'portal' | 'both' | 'all',
  payload: NotificationPayload
): Promise<{ email: boolean; sms: boolean; realtime: boolean; portal: boolean }> {
  const result = { email: false, sms: false, realtime: false, portal: false };

  if (type === 'email' || type === 'both' || type === 'all') {
    result.email = await sendEmail(payload);
  }

  if (type === 'sms' || type === 'both' || type === 'all') {
    result.sms = await sendSMS(payload);
  }

  if (type === 'realtime' || type === 'all') {
    result.realtime = await sendRealTime(payload);
  }

  if (type === 'portal') {
    result.portal = true; // Handled by saving to DB in routes.ts or here
  }

  return result;
}
