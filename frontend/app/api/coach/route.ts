import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Initialize the Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, context } = body;

    const { sport, injuryRisk, cnsFatigue, metabolicLoad } = context || {};

    const systemPrompt = `You are Khel Setu AI, an elite sports performance coach. 
The athlete you are speaking to plays ${sport || 'a competitive sport'}. 
Their latest 7-day physiological telemetry from the ScreenSense engine shows:
- Injury Risk: ${injuryRisk !== undefined ? injuryRisk + '%' : 'Unknown'}
- CNS Fatigue: ${cnsFatigue !== undefined ? cnsFatigue + '%' : 'Unknown'}
- Metabolic Load: ${metabolicLoad !== undefined ? metabolicLoad + '%' : 'Unknown'}

Your job is to guide the athlete on what to do next based on this data. 
If CNS Fatigue is high (e.g. > 60%), recommend active recovery or rest.
If Injury Risk is high (e.g. > 30%), recommend specific modalities like foam rolling, sleep, or physiotherapy.
If Metabolic Load is high (e.g. > 70%), recommend carb loading and hydration.

Be concise, actionable, and encouraging. Answer any questions they have related to their sport or recovery. Keep responses under 3 paragraphs. Do NOT use markdown bold/italic formatting aggressively, keep it conversational.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 1024,
    });

    return NextResponse.json({
      message: chatCompletion.choices[0]?.message?.content || 'I am unable to provide a response right now.',
    });

  } catch (error) {
    console.error('Groq API Error:', error);
    return NextResponse.json({ error: 'Failed to connect to AI Coach' }, { status: 500 });
  }
}
