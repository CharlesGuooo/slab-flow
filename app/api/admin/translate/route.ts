import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text, field, sourceLang } = await request.json();

    if (!text || !field) {
      return NextResponse.json({ error: 'Text and field are required' }, { status: 400 });
    }

    // Determine source language
    const source = sourceLang || 'en';
    const targetLangs = ['en', 'zh', 'fr'].filter(l => l !== source);

    const prompt = `You are a professional translator for a premium stone/marble company website. 
Translate the following ${field} text from ${source === 'en' ? 'English' : source === 'zh' ? 'Chinese' : 'French'} to ${targetLangs.map(l => l === 'en' ? 'English' : l === 'zh' ? 'Chinese' : 'French').join(' and ')}.

The text is a ${field} for a stone/marble product listing. Keep the translation professional, accurate, and suitable for a luxury stone materials website.

Original text (${source}):
${text}

Return ONLY a JSON object with the translations, no other text. Format:
{${targetLangs.map(l => `"${l}": "translated text"`).join(', ')}}`;

    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.laozhang.ai/v1';

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-nano',
        messages: [
          { role: 'system', content: 'You are a professional translator. Return ONLY valid JSON, no markdown or other formatting.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      console.error('Translation API error:', response.status);
      return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return NextResponse.json({ error: 'No translation returned' }, { status: 500 });
    }

    // Parse the JSON response - handle possible markdown code blocks
    let translations;
    try {
      const jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      translations = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse translation JSON:', content);
      return NextResponse.json({ error: 'Failed to parse translation' }, { status: 500 });
    }

    // Include the source text
    translations[source] = text;

    return NextResponse.json({ translations });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}
