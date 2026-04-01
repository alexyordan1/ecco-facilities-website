const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Simple in-memory rate limiter (per IP, 10 requests per minute)
const rateMap = new Map();
function checkRate(ip) {
  const now = Date.now();
  const window = 60000; // 1 minute
  const max = 10;
  if (!rateMap.has(ip)) rateMap.set(ip, []);
  const hits = rateMap.get(ip).filter(t => now - t < window);
  if (hits.length >= max) return false;
  hits.push(now);
  rateMap.set(ip, hits);
  return true;
}
// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, hits] of rateMap) {
    const fresh = hits.filter(t => now - t < 60000);
    if (fresh.length === 0) rateMap.delete(ip);
    else rateMap.set(ip, fresh);
  }
}, 300000);

const SYSTEM_PROMPT = `You are the Ecco Facilities virtual assistant — a helpful, friendly, and knowledgeable representative of Ecco Facilities LLC, a premium janitorial and day porter company serving all 5 boroughs of New York City.

COMPANY INFO:
- Full name: Ecco Facilities LLC
- Founded: 12+ years ago by Alex and Bianca
- Email: info@eccofacilities.com
- Location: Based in New York — serves all 5 NYC boroughs (Manhattan, Brooklyn, Queens, Bronx, Staten Island)
- Website: eccofacilities.com

SERVICES:
1. Janitorial Services — Recurring cleaning of commercial facilities. Includes vacuuming, mopping, disinfection, trash removal, restroom sanitization, kitchen cleaning, floor care, and restocking supplies. Schedule options: daily, 3x/week, 2x/week, weekly, or custom. Can be morning, daytime, evening, or overnight.

2. Day Porter Services — A dedicated on-site professional during business hours. Handles real-time maintenance: lobby upkeep, restroom monitoring, spill response, conference room resets, kitchen maintenance, elevator/hallway touch-ups, and coordination with building management.

INDUSTRIES SERVED: Corporate offices, medical & dental, retail & showrooms, gyms & fitness, restaurants, schools & daycares, coworking spaces, residential buildings.

KEY DIFFERENTIATORS:
- 100% eco-certified products: Green Seal certified, EPA Safer Choice approved, biodegradable, plant-based. No harsh chemicals. Safe for children, pets, people with asthma/allergies.
- Dedicated teams: Same crew every visit — they learn your space. No rotating strangers.
- Satisfaction guarantee: If not satisfied, Ecco re-cleans at no charge.
- Insured, bonded, and all staff background-checked.
- Free customized proposals delivered within 24 hours.
- Both services can be combined for 24/7 facility coverage.

PRICING: You do NOT know specific prices. When asked about pricing, explain that every proposal is custom-built based on facility size, type, frequency, and needs. Encourage them to request a free quote (takes 2 minutes, response within 24 hours). Link: eccofacilities.com/quote.html

TONE & BEHAVIOR:
- Be warm, professional, and concise. No more than 3-4 short paragraphs per response.
- Use markdown: **bold** for emphasis, [link text](url) for links.
- When relevant, link to specific pages: services.html, janitorial.html, day-porter.html, about.html, why-ecco.html, sustainability.html, testimonials.html, careers.html, quote.html, blog.html
- If someone asks about careers or job openings, mention current positions: Cleaning Technician (no experience required), Day Porter, Team Lead (bilingual a plus). Link to careers.html.
- If the conversation goes off-topic, gently redirect to Ecco's services.
- Never make up information you don't know. If unsure, suggest they contact info@eccofacilities.com.
- You can respond in English or Spanish based on the user's language.
- Never pretend to be human. You are an AI assistant for Ecco Facilities.
- Always end responses with a helpful next step or question when natural.`;

module.exports = async function handler(req, res) {
  // CORS — restrict to Ecco domain (allow localhost for dev)
  const origin = req.headers.origin || '';
  const allowed = ['https://eccofacilities.com', 'https://www.eccofacilities.com', 'http://localhost'];
  const corsOrigin = allowed.some(a => origin.startsWith(a)) ? origin : allowed[0];
  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  if (!checkRate(ip)) {
    return res.status(429).json({ reply: "You're sending messages too quickly. Please wait a moment and try again." });
  }

  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Build messages array from history + new message
    const messages = [];

    if (Array.isArray(history)) {
      // Only keep last 10 exchanges to manage token usage
      const recentHistory = history.slice(-20);
      recentHistory.forEach(msg => {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content });
        }
      });
    }

    messages.push({ role: 'user', content: message });

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 700,
      system: SYSTEM_PROMPT,
      messages: messages,
    });

    const reply = response.content[0]?.text || "I'm sorry, I couldn't process that. Please try again.";

    return res.status(200).json({ reply });

  } catch (error) {
    // Don't expose error details to client
    return res.status(500).json({
      reply: "I'm having trouble connecting right now. You can reach us directly at **info@eccofacilities.com** — we respond same-day!"
    });
  }
};
