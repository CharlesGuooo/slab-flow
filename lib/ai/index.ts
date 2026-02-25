/**
 * AI Chat Service
 * Uses Laozhang API (OpenAI-compatible) for intelligent responses
 */

import OpenAI from 'openai';

// Use Laozhang API as primary (OpenAI-compatible), fallback to OpenAI
const laozhangClient = new OpenAI({
  apiKey: process.env.LAOZHANG_API_KEY,
  baseURL: process.env.LAOZHANG_API_ENDPOINT || 'https://api.laozhang.ai/v1',
});

const openaiClient = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

// Use Laozhang as primary
const client = laozhangClient;

export interface StoneInfo {
  id: number;
  brand: string;
  series: string;
  stoneType: string | null;
  pricePerSlab: string | null;
  name: string | null;
  imageUrl?: string | null;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

export interface ChatResult {
  message: string;
  stoneRecommendations?: Array<{
    stoneId: number;
    stoneName: string;
    reason: string;
  }>;
  renderAvailable?: boolean;
}

/**
 * Build system prompt with stone inventory
 */
function buildSystemPrompt(stones: StoneInfo[]): string {
  const stoneList = stones
    .map((s) => {
      const name = getStoneName(s);
      return `- ${name} (${s.stoneType || 'Stone'}) - $${s.pricePerSlab || 'Price on request'}/slab - Brand: ${s.brand}`;
    })
    .join('\n');

  return `You are a helpful stone and countertop expert assistant for a stone fabrication company.
Help customers choose the perfect stone for their kitchen, bathroom, or other projects.

Available stones in inventory:
${stoneList}

Guidelines:
1. Be helpful, knowledgeable, and friendly
2. Recommend specific stones from our inventory when appropriate
3. Explain the pros and cons of different stone types (quartz, granite, marble, etc.)
4. Ask clarifying questions about their project if needed
5. Provide practical advice about maintenance, durability, and aesthetics
6. When recommending stones, format them as: [STONE: ID - Name]
7. If they upload an image, analyze the space and suggest suitable stones

Stone Types Info:
- Quartz: Engineered stone, low maintenance, consistent patterns, non-porous
- Granite: Natural stone, unique patterns, heat resistant, needs sealing
- Marble: Natural stone, elegant veining, softer than granite, needs care
- Quartzite: Natural stone, harder than granite, unique patterns
- Porcelain: Large format, durable, can mimic other materials`;
}

/**
 * Get stone name from stone object
 */
function getStoneName(stone: StoneInfo): string {
  if (!stone.name) return `${stone.brand} - ${stone.series}`;
  if (typeof stone.name === 'string') {
    try {
      const parsed = JSON.parse(stone.name);
      return parsed.en || parsed.zh || stone.name;
    } catch {
      return stone.name;
    }
  }
  return String(stone.name);
}

/**
 * Generate AI response using OpenAI
 */
export async function generateAIResponse(
  userMessage: string,
  history: ChatMessage[],
  stones: StoneInfo[],
  imageUrl?: string
): Promise<ChatResult> {
  try {
    const systemPrompt = buildSystemPrompt(stones);

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10), // Keep last 10 messages for context
    ];

    // Add current user message
    if (imageUrl) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: userMessage || 'Please analyze this image and recommend suitable stones.' },
          { type: 'image_url', image_url: { url: imageUrl } },
        ],
      });
    } else {
      messages.push({ role: 'user', content: userMessage });
    }

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const responseMessage = completion.choices[0]?.message?.content || 'I apologize, I could not generate a response.';

    // Parse stone recommendations from the response
    const stoneRecommendations: ChatResult['stoneRecommendations'] = [];
    const stoneRegex = /\[STONE:\s*(\d+)\s*-\s*([^\]]+)\]/g;
    let match;

    while ((match = stoneRegex.exec(responseMessage)) !== null) {
      const stoneId = parseInt(match[1], 10);
      const stone = stones.find(s => s.id === stoneId);
      if (stone) {
        stoneRecommendations.push({
          stoneId: stone.id,
          stoneName: getStoneName(stone),
          reason: `Recommended based on your requirements`,
        });
      }
    }

    // Also try to match stone names directly
    for (const stone of stones) {
      const stoneName = getStoneName(stone);
      if (responseMessage.toLowerCase().includes(stoneName.toLowerCase()) ||
          responseMessage.toLowerCase().includes(stone.series.toLowerCase())) {
        if (!stoneRecommendations.find(r => r.stoneId === stone.id)) {
          stoneRecommendations.push({
            stoneId: stone.id,
            stoneName: stoneName,
            reason: 'Mentioned in response',
          });
        }
      }
    }

    // Clean up the response message
    const cleanMessage = responseMessage.replace(stoneRegex, '$2');

    return {
      message: cleanMessage,
      stoneRecommendations: stoneRecommendations.slice(0, 3), // Max 3 recommendations
      renderAvailable: true,
    };
  } catch (error) {
    console.error('[OpenAI] Error:', error);

    // Fallback to simple keyword-based response
    return generateFallbackResponse(userMessage, stones);
  }
}

/**
 * Fallback response when OpenAI is unavailable
 */
function generateFallbackResponse(
  userMessage: string,
  stones: StoneInfo[]
): ChatResult {
  const lowerMessage = userMessage.toLowerCase();

  // Kitchen recommendations
  if (lowerMessage.includes('kitchen') || lowerMessage.includes('counter')) {
    const quartz = stones.find(s => s.stoneType?.toLowerCase() === 'quartz');
    const granite = stones.find(s => s.stoneType?.toLowerCase() === 'granite');
    const recommended = quartz || granite || stones[0];

    return {
      message: `For kitchens, I recommend durable stones that can handle heat and daily use. **Quartz** is low maintenance and **Granite** offers natural beauty with heat resistance.`,
      stoneRecommendations: recommended ? [{
        stoneId: recommended.id,
        stoneName: getStoneName(recommended),
        reason: 'Perfect for kitchen countertops',
      }] : undefined,
    };
  }

  // Bathroom recommendations
  if (lowerMessage.includes('bathroom') || lowerMessage.includes('vanity')) {
    const marble = stones.find(s => s.stoneType?.toLowerCase() === 'marble');
    const quartz = stones.find(s => s.stoneType?.toLowerCase() === 'quartz');
    const recommended = marble || quartz || stones[0];

    return {
      message: `For bathrooms, **Marble** offers timeless elegance while **Quartz** provides low-maintenance luxury. Both are excellent choices for vanity tops.`,
      stoneRecommendations: recommended ? [{
        stoneId: recommended.id,
        stoneName: getStoneName(recommended),
        reason: 'Ideal for bathroom applications',
      }] : undefined,
    };
  }

  // Default response
  return {
    message: `I'd be happy to help you find the perfect stone! Could you tell me more about your project - is it for a kitchen, bathroom, or other space? What's your preferred color scheme?`,
  };
}

/**
 * Check if AI service is available
 */
export async function checkOpenAIService(): Promise<{ available: boolean; error?: string }> {
  if (!process.env.LAOZHANG_API_KEY && !process.env.OPENAI_API_KEY) {
    return { available: false, error: 'AI API key not configured' };
  }

  try {
    await client.models.list();
    return { available: true };
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
