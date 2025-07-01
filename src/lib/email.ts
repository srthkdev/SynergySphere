import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

// Create transporter only if email credentials are available
export const transporter = process.env.EMAIL_USER && process.env.EMAIL_PASS 
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
      },
  })
  : null;

export async function sendEmail({to, subject, html} : {to: string, subject: string, html: string}) {
    try {
        // Check if email is configured
        if (!transporter) {
            console.warn('Email not configured - EMAIL_USER or EMAIL_PASS missing');
            return NextResponse.json({ success: false, error: 'Email service not configured' }, { status: 500 });
        }

        if (!process.env.EMAIL_FROM) {
            console.warn('EMAIL_FROM not configured');
            return NextResponse.json({ success: false, error: 'Email sender not configured' }, { status: 500 });
        }

        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to,
            subject,
            html,
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error sending email:', error);
        return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 });
    }
}

   