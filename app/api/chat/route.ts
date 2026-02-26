import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { NextRequest } from 'next/server';
import { db, inventoryStones } from '@/lib/db';
import { eq } from 'drizzle-orm';

/**
 * Create AI provider with fallback:
 * 1. Try Laozhang API (cheaper, OpenAI-compatible)
 * 2. Fallback to OpenAI directly
 */
function getAIProvider() {
  if (process.env.LAOZHANG_API_KEY) {
    return createOpenAI({
      apiKey: process.env.LAOZHANG_API_KEY,
      baseURL: process.env.LAOZHANG_API_ENDPOINT || 'https://api.laozhang.ai/v1',
    });
  }
  if (process.env.OPENAI_API_KEY) {
    return createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: 'https://api.openai.com/v1',
    });
  }
  return null;
}

function getStoneName(stone: { name: string | null; brand: string; series: string }, locale: string = 'en'): string {
  if (!stone.name) return `${stone.brand} - ${stone.series}`;
  try {
    const parsed = JSON.parse(stone.name);
    return parsed[locale] || parsed.en || parsed.zh || stone.name;
  } catch {
    return String(stone.name);
  }
}

function getStoneDescription(stone: { description: string | null }, locale: string = 'en'): string {
  if (!stone.description) return '';
  try {
    const parsed = JSON.parse(stone.description);
    return parsed[locale] || parsed.en || '';
  } catch {
    return String(stone.description || '');
  }
}

function buildSystemPrompt(stones: Array<{
  id: number;
  brand: string;
  series: string;
  stoneType: string | null;
  pricePerSlab: string | null;
  name: string | null;
  description: string | null;
  imageUrl: string | null;
}>, locale: string): string {
  const stoneList = stones
    .map((s) => {
      const name = getStoneName(s, locale);
      const desc = getStoneDescription(s, locale);
      return `[ID:${s.id}] ${s.brand} ${s.series} "${name}" | Type: ${s.stoneType || 'sintered stone'} | Price: $${s.pricePerSlab || 'TBD'}/slab (3.2x1.6m, 20mm) | Image: ${s.imageUrl || 'none'} | ${desc}`;
    })
    .join('\n');

  return `You are a warm, professional stone consultant for CH Stone, a premium stone fabrication company. You help customers choose the perfect stone for their kitchen, bathroom, or renovation projects.

CRITICAL RULES:
1. NEVER use markdown formatting. No #, ##, ###, **, *, -, bullet points, or code blocks. Write in plain conversational text with natural paragraphs.
2. Always respond in the SAME LANGUAGE the customer uses. If they write in Chinese, respond in Chinese. If English, respond in English. If French, respond in French.
3. You can ONLY discuss topics related to: stone materials, countertops, kitchen/bathroom renovation, interior design with stone, fabrication, installation, pricing of stones, and home improvement involving stone surfaces.
4. If someone asks about unrelated topics (politics, coding, recipes, weather, stocks, etc.), politely say: "I'm your stone consultant and can only help with stone and renovation related questions. How can I help you with your stone project?"
5. When recommending stones, ALWAYS include the stone ID in this exact format: [STONE:id] so the system can display the photo. For example: "I'd recommend the Calacatta Gold [STONE:1], it has beautiful warm veining..."
6. Keep responses concise and conversational. 2-3 short paragraphs maximum.
7. Pricing note: All stone prices are per slab (3.2m x 1.6m, 20mm thick). Fabrication/labour costs are separate and require an on-site measurement.
8. When a customer uploads a photo, analyze the space and suggest suitable stones from the inventory that would match their decor style.

AVAILABLE STONES:
${stoneList || 'No stones currently in inventory.'}

CONVERSATION STYLE:
- Be like a friendly, knowledgeable design consultant at a high-end showroom
- Ask about their project: What room? What style? What budget range?
- Recommend 2-3 stones maximum at a time
- Mention the stone brand, series name, and price naturally in conversation
- If they like a stone, guide them to the Quote/User Info page to submit their order`;
}

/**
 * GET - Check AI service status
 */
export async function GET() {
  const provider = getAIProvider();
  if (!provider) {
    return Response.json({ available: false, error: 'AI API key not configured' });
  }
  return Response.json({ available: true });
}

/**
 * POST - Process chat message with Vercel AI SDK
 */
export async function POST(request: NextRequest) {
  try {
    const provider = getAIProvider();
    if (!provider) {
      return Response.json(
        { error: 'AI service is not configured. Please contact the administrator.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { messages, imageUrl, locale = 'en' } = body;

    if (!messages || messages.length === 0) {
      return Response.json({ error: 'Messages are required' }, { status: 400 });
    }

    // === GET TENANT INFO ===
    const tenantIdHeader = request.headers.get('x-tenant-id');
    const tenantId = tenantIdHeader ? parseInt(tenantIdHeader, 10) : 1;

    // === GET STONE INVENTORY ===
    let availableStones: Array<{
      id: number;
      brand: string;
      series: string;
      stoneType: string | null;
      pricePerSlab: string | null;
      name: string | null;
      description: string | null;
      imageUrl: string | null;
    }> = [];

    try {
      availableStones = await db
        .select({
          id: inventoryStones.id,
          brand: inventoryStones.brand,
          series: inventoryStones.series,
          stoneType: inventoryStones.stoneType,
          pricePerSlab: inventoryStones.pricePerSlab,
          name: inventoryStones.name,
          description: inventoryStones.description,
          imageUrl: inventoryStones.imageUrl,
        })
        .from(inventoryStones)
        .where(eq(inventoryStones.tenantId, tenantId))
        .limit(50);
    } catch (dbError) {
      console.error('[Chat] DB error (non-fatal):', dbError);
    }

    // === BUILD SYSTEM PROMPT ===
    const systemPrompt = buildSystemPrompt(availableStones, locale);

    // === PREPARE MESSAGES ===
    const processedMessages = [...messages];
    
    // If there's an uploaded image, modify the last message to include it
    if (imageUrl && processedMessages.length > 0) {
      const lastIdx = processedMessages.length - 1;
      const lastMessage = processedMessages[lastIdx];
      const textContent = typeof lastMessage.content === 'string'
        ? lastMessage.content
        : 'Please analyze this photo of my space and recommend suitable stones.';
      
      // For base64 images, we need to pass them as image parts
      if (imageUrl.startsWith('data:')) {
        processedMessages[lastIdx] = {
          role: 'user',
          content: [
            { type: 'text', text: textContent },
            { type: 'image', image: imageUrl },
          ],
        };
      } else {
        processedMessages[lastIdx] = {
          role: 'user',
          content: [
            { type: 'text', text: textContent },
            { type: 'image', image: imageUrl },
          ],
        };
      }
    }

    // === STREAM RESPONSE ===
    // Use gpt-4o-mini for text, gpt-4o for vision (when image is present)
    const modelName = imageUrl ? 'gpt-4o' : 'gpt-4o-mini';
    
    const result = streamText({
      model: provider(modelName),
      system: systemPrompt,
      messages: processedMessages,
      maxTokens: 800,
      temperature: 0.7,
      onFinish: async ({ usage }) => {
        if (usage) {
          console.log('[Chat] Token usage:', {
            model: modelName,
            promptTokens: usage.promptTokens,
            completionTokens: usage.completionTokens,
            totalTokens: usage.totalTokens,
          });
        }
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('[Chat] Error:', error);
    return Response.json(
      { error: 'Failed to process message. Please try again.' },
      { status: 500 }
    );
  }
}
