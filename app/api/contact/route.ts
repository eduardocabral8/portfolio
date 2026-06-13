import { NextResponse } from "next/server";
import { Resend } from "resend";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const ipCache = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 3;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const requests = ipCache.get(ip) || [];

  const recentRequests = requests.filter((time) => now - time < RATE_LIMIT_WINDOW_MS);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  
  recentRequests.push(now);
  ipCache.set(ip, recentRequests);

  if (ipCache.size > 1000) {
    ipCache.forEach((val, key) => {
      const filtered = val.filter((time) => now - time < RATE_LIMIT_WINDOW_MS);
      if (filtered.length === 0) {
        ipCache.delete(key);
      } else {
        ipCache.set(key, filtered);
      }
    });
  }
  
  return false;
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "127.0.0.1";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a minute." },
        { status: 429 }
      );
    }

    const { name, email, message, website } = await req.json();

    if (website) {
      console.log("Honeypot triggered by spam bot.");
      return NextResponse.json({ success: true, message: "Message received." });
    }

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (name.length > 100 || email.length > 200 || message.length > 5000) {
      return NextResponse.json(
        { error: "Input exceeds maximum allowed lengths." },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.log("Mock Contact Submission (RESEND_API_KEY not set):", { name, email, message });
      return NextResponse.json({
        success: true,
        message: "Message received (Development Mock Mode).",
      });
    }

    const resend = new Resend(apiKey);
    const fromEmail = process.env.CONTACT_FROM_EMAIL || "Portfolio Contact <onboarding@resend.dev>";

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: "eduardoemanuelcf@gmail.com",
      replyTo: email,
      subject: `New portfolio message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `<div style="font-family:ui-sans-serif,system-ui,sans-serif;color:#1F2520;line-height:1.6;max-width:560px">
        <h2 style="margin:0 0 4px;font-size:18px;font-weight:700">New portfolio message</h2>
        <p style="margin:0 0 16px;color:#707671;font-size:13px">Sent from your portfolio contact form</p>
        <p style="margin:0 0 4px"><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p style="margin:0"><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}" style="color:#01603A">${escapeHtml(email)}</a></p>
        <hr style="border:none;border-top:1px solid #CDD2CE;margin:16px 0" />
        <p style="margin:0;white-space:pre-wrap">${escapeHtml(message)}</p>
      </div>`,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
