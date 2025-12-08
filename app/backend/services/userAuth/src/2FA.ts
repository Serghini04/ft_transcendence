
import nodemailer from "nodemailer";

export function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  export async function sendOTPEmail(to: string, otp: string) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: "Your FT_Transcendence Code",
      html: `
        <h2>Your Login Code</h2>
        <p>Use the 6-digit code below to log in:</p>
        <h1 style="font-size: 32px; letter-spacing: 8px;">${otp}</h1>
        <p>This code expires in 5 minutes.</p>
      `,
    });
  }
  