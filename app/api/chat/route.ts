import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { NextRequest } from 'next/server';
import { db, inventoryStones } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

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

// Guardrail keywords for off-topic detection
const OFF_TOPIC_KEYWORDS = [
  'politics', 'religion', 'stock', 'crypto', 'bitcoin', 'gambling',
  'weapons', 'drugs', 'illegal', 'hack', 'pirate',
  'weather', 'sports', 'movie', 'music', 'game',
  'recipe', 'cooking', 'diet', 'exercise', 'medical', 'health',
  '编程', '代码', '股票', '加密货币', '赌博', '武器', '毒品',
];

// On-topic keywords (stone/kitchen/bathroom related)
const ON_TOPIC_KEYWORDS = [
  'stone', 'marble', 'granite', 'quartz', 'countertop', 'kitchen', 'bathroom',
  'sink', 'vanity', 'backsplash', 'island', 'cabinet', 'slab', 'fabricat',
  'edge', 'polish', 'seal', 'install', 'measure', 'quote', 'price',
  'color', 'pattern', 'vein', 'texture', 'white', 'black', 'gray', 'beige',
  'modern', 'traditional', 'luxury', 'budget', 'durable', 'heat', 'stain',
  'hello', 'hi', 'hey', 'help', 'recommend', 'suggest', 'best', 'good',
  '石', '大理石', '花岗岩', '石英', '厨房', '浴室', '台面', '洗手台',
  '你好', '推荐', '建议',
];

function isOffTopic(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  // Short messages or greetings are always on-topic
  if (lowerMessage.length < 20) return false;
  for (const keyword of OFF_TOPIC_KEYWORDS) {
    if (lowerMessage.includes(keyword)) {
      const hasOnTopic = ON_TOPIC_KEYWORDS.some(k => lowerMessage.includes(k.toLowerCase()));
      if (!hasOnTopic) return true;
    }
  }
  return false;
}

function buildSystemPrompt(stones: Array<{
  id: number;
  brand: string;
  series: string;
  stoneType: string | null;
  pricePerSlab: string | null;
  name: string | null;
}>): string {
  const stoneList = stones
    .map((s) => {
      const name = getStoneName(s);
      return `- ID: ${s.id} | ${name} (${s.stoneType || 'Stone'}) - $${s.pricePerSlab || 'Price on request'}/slab - Brand: ${s.brand} ${s.series}`;
    })
    .join('\n');

  return `You are a helpful stone and countertop expert assistant for a premium stone fabrication company called CH Stone.
Help customers choose the perfect stone for their kitchen, bathroom, or other renovation projects.
Be warm, professional, and knowledgeable. Speak like a luxury interior design consultant.

AVAILABLE STONES IN INVENTORY:
${stoneList || 'No stones currently loaded in inventory. Help the customer with general stone knowledge.'}

GUIDELINES:
1. Be helpful, knowledgeable, and friendly - like a premium design consultant
2. When recommending stones, mention the stone ID so the system can track it
3. Explain pros and cons of different stone types
4. Ask clarifying questions about their project (room type, style, budget)
5. If asked about pricing, provide the slab prices from inventory
6. For greetings or general questions, respond warmly and guide them to stone topics
7. You can discuss renovation, interior design, and home improvement topics
8. Always respond in the same language the customer uses

STONE TYPES INFO:
- Quartz: Engineered stone, low maintenance, consistent patterns, non-porous
- Granite: Natural stone, unique patterns, heat resistant, needs sealing
- Marble: Natural stone, elegant veining, softer than granite, needs care
- Quartzite: Natural stone, harder than granite, unique patterns
- Porcelain: Large format, durable, can mimic other materials`;
}

function getStoneName(stone: { name: string | null; brand: string; series: string }): string {
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
    const { messages, imageUrl } = body;

    if (!messages || messages.length === 0) {
      return Response.json({ error: 'Messages are required' }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    const userContent = typeof lastMessage.content === 'string'
      ? lastMessage.content
      : '';

    // === FIRST-LAYER GUARDRAIL ===
    if (isOffTopic(userContent)) {
      const result = streamText({
        model: provider('gpt-4o-mini'),
        messages: [
          {
            role: 'system',
            content: 'You are a stone and countertop assistant for CH Stone. Politely redirect off-topic questions back to stone-related topics. Be warm and friendly.',
          },
          { role: 'user', content: userContent },
        ],
      });
      return result.toDataStreamResponse();
    }

    // === GET TENANT INFO ===
    const tenantIdHeader = request.headers.get('x-tenant-id');
    let tenantId: number;
    if (tenantIdHeader) {
      tenantId = parseInt(tenantIdHeader, 10);
    } else {
      tenantId = 1;
    }

    // === GET STONE INVENTORY ===
    let availableStones: Array<{
      id: number;
      brand: string;
      series: string;
      stoneType: string | null;
      pricePerSlab: string | null;
      name: string | null;
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
          imageUrl: inventoryStones.imageUrl,
        })
        .from(inventoryStones)
        .where(eq(inventoryStones.tenantId, tenantId))
        .limit(50);
    } catch (dbError) {
      console.error('[Chat] DB error (non-fatal):', dbError);
      // Continue without inventory - AI can still help with general stone knowledge
    }

    // === BUILD SYSTEM PROMPT ===
    const systemPrompt = buildSystemPrompt(availableStones);

    // === PREPARE MESSAGES ===
    const processedMessages = [...messages];
    if (imageUrl && processedMessages.length > 0) {
      const lastIdx = processedMessages.length - 1;
      processedMessages[lastIdx] = {
        role: 'user',
        content: [
          { type: 'text', text: userContent || 'Please analyze this image and recommend suitable stones.' },
          { type: 'image', image: imageUrl },
        ],
      };
    }

    // === STREAM RESPONSE ===
    const result = streamText({
      model: provider('gpt-4o-mini'),
      system: systemPrompt,
      messages: processedMessages,
      maxTokens: 1000,
      temperature: 0.7,
      tools: {
        get_stone_inventory: {
          description: 'Search the stone inventory. Use this when customer asks about available stones.',
          parameters: z.object({
            query: z.string().optional().describe('Search query for stone name, brand, or series'),
            stoneType: z.enum(['quartz', 'granite', 'marble', 'quartzite', 'porcelain']).optional().describe('Filter by stone type'),
          }),
          execute: async ({ query, stoneType }) => {
            let filtered = availableStones;
            if (stoneType) {
              filtered = filtered.filter(s =>
                s.stoneType?.toLowerCase() === stoneType.toLowerCase()
              );
            }
            if (query) {
              const lowerQuery = query.toLowerCase();
              filtered = filtered.filter(s =>
                s.brand.toLowerCase().includes(lowerQuery) ||
                s.series.toLowerCase().includes(lowerQuery) ||
                getStoneName(s).toLowerCase().includes(lowerQuery)
              );
            }
            return {
              stones: filtered.slice(0, 10).map(s => ({
                id: s.id,
                name: getStoneName(s),
                type: s.stoneType,
                price: s.pricePerSlab,
                brand: s.brand,
                series: s.series,
              })),
              total: filtered.length,
            };
          },
        },
      },
      onFinish: async ({ usage }) => {
        if (usage) {
          console.log('[Chat] Token usage:', {
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
