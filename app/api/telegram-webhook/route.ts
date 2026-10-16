import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Inisialisasi Gemini API pakai key CMO
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY_CMO || '');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Pastikan pesan berasal dari Telegram
    const message = body.message;
    if (!message || !message.text) {
      return NextResponse.json({ status: 'No message text' }, { status: 200 });
    }

    const chatId = message.chat.id.toString();
    const userText = message.text;

    // Security Filter: Hanya izinkan CEO (R) yang kasih perintah
    if (chatId !== process.env.CEO_CHAT_ID) {
      return NextResponse.json({ status: 'Unauthorized' }, { status: 403 });
    }

    // Panggil Otak CMO (Gemini Pro)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const prompt = `Lu adalah CMO (Chief Marketing Officer) dari platform "LuPerluTau" yang dikomandoi oleh R. 
    Tugas lu adalah menerima arahan konten/bisnis dari R, lalu memecahnya menjadi tugas untuk Divisi Web Media dan Divisi Sosmed.
    
    Pesan dari R: "${userText}"
    
    Berikan respons balasan yang profesional, objektif, tidak berlebihan/nggak ngejilat, dan langsung nyatakan kesiapan eksekusi dalam bahasa Indonesia yang tegas.`;

    const result = await model.generateContent(prompt);
    const cmoResponse = result.response.text();

    // Kirim balik respons CMO ke Telegram R
    const token = process.env.TELEGRAM_BOT_TOKEN;
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `🤖 *[CMO REPORT]*\n\n${cmoResponse}`,
        parse_mode: 'Markdown'
      }),
    });

    return NextResponse.json({ status: 'Success' }, { status: 200 });
  } catch (error: any) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}