import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { NextRequest } from 'next/server';
import { db, inventoryStones, tenants, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { generateStoneRendering } from '@/lib/rendering';
import { z } from 'zod';

// Create OpenAI client using Laozhang API (OpenAI-compatible)
const laozhang = createOpenAI({
  apiKey: process.env.LAOZHANG_API_KEY,
  baseURL: process.env.LAOZHANG_API_ENDPOINT || 'https://api.laozhang.ai/v1',
});

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
  '石', '大理石', '花岗岩', '石英', '厨房', '浴室', '台面', '洗手台',
];

/**
 * First-layer guardrail check
 * Returns true if message is off-topic
 */
function isOffTopic(message: string): boolean {
  const lowerMessage = message.toLowerCase();

  // Check for off-topic keywords
  for (const keyword of OFF_TOPIC_KEYWORDS) {
    if (lowerMessage.includes(keyword)) {
      // But also check if there are on-topic keywords
      const hasOnTopic = ON_TOPIC_KEYWORDS.some(k => lowerMessage.includes(k.toLowerCase()));
      if (!hasOnTopic) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Build system prompt with stone inventory
 */
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

  return `You are a helpful stone and countertop expert assistant for a stone fabrication company.
Help customers choose the perfect stone for their kitchen, bathroom, or other projects.

AVAILABLE STONES IN INVENTORY:
${stoneList}

GUIDELINES:
1. Be helpful, knowledgeable, and friendly
2. When recommending stones, always mention the stone ID so the system can track it
3. Use the analyze_scene_image tool when customer uploads a photo to analyze their space
4. Use the generate_stone_rendering tool when customer wants to see how a stone would look
5. Explain pros and cons of different stone types
6. Ask clarifying questions about their project

STONE TYPES INFO:
- Quartz: Engineered stone, low maintenance, consistent patterns, non-porous
- Granite: Natural stone, unique patterns, heat resistant, needs sealing
- Marble: Natural stone, elegant veining, softer than granite, needs care
- Quartzite: Natural stone, harder than granite, unique patterns
- Porcelain: Large format, durable, can mimic other materials`;
}

/**
 * Get stone name from stone object
 */
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
  if (!process.env.LAOZHANG_API_KEY && !process.env.OPENAI_API_KEY) {
    return Response.json({ available: false, error: 'AI API key not configured' });
  }
  return Response.json({ available: true });
}

/**
 * POST - Process chat message with Vercel AI SDK
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, imageUrl } = body;

    if (!messages || messages.length === 0) {
      return Response.json({ error: 'Messages are required' }, { status: 400 });
    }

    // Get the latest user message
    const lastMessage = messages[messages.length - 1];
    const userContent = typeof lastMessage.content === 'string'
      ? lastMessage.content
      : '';

    // === FIRST-LAYER GUARDRAIL ===
    if (isOffTopic(userContent)) {
      // Return a streamed response for off-topic
      const result = streamText({
        model: laozhang('gpt-4o-mini'),
        messages: [
          {
            role: 'system',
            content: 'You are a stone and countertop assistant. Politely redirect off-topic questions back to stone-related topics.',
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
      // Fallback: default to tenant 1
      tenantId = 1;
    }

    // === GET STONE INVENTORY ===
    const availableStones = await db
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

    // === BUILD SYSTEM PROMPT ===
    const systemPrompt = buildSystemPrompt(availableStones);

    // === PREPARE MESSAGES ===
    // Add image to the last user message if provided
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

    // === STREAM RESPONSE WITH TOOLS ===
    const result = streamText({
      model: laozhang('gpt-4o-mini'),
      system: systemPrompt,
      messages: processedMessages,
      maxTokens: 1000,
      temperature: 0.7,
      tools: {
        // Tool: Analyze scene image
        analyze_scene_image: {
          description: 'Analyze a kitchen or bathroom image to extract style, colors, room type, and existing elements. Use this when customer uploads a photo.',
          parameters: z.object({
            imageUrl: z.string().describe('URL of the image to analyze'),
          }),
          execute: async ({ imageUrl }) => {
            // Return structured analysis
            // In production, this would call a vision model
            return {
              roomType: 'kitchen',
              style: 'modern',
              colorScheme: ['white', 'gray', 'neutral'],
              existingElements: ['cabinets', 'appliances', 'flooring'],
              recommendations: [
                'Light colored quartz would complement the white cabinets',
                'Consider a contrasting island top for visual interest',
              ],
            };
          },
        },
        // Tool: Generate stone rendering
        generate_stone_rendering: {
          description: 'Generate a photorealistic rendering of a stone in a kitchen or bathroom setting. Use this when customer wants to visualize a specific stone.',
          parameters: z.object({
            stoneId: z.number().describe('ID of the stone to render'),
            roomType: z.enum(['kitchen', 'bathroom', 'other']).describe('Type of room'),
            style: z.enum(['modern', 'traditional', 'transitional']).optional().describe('Design style'),
          }),
          execute: async ({ stoneId, roomType, style = 'modern' }) => {
            // Find the stone
            const stone = availableStones.find(s => s.id === stoneId);

            if (!stone) {
              return { error: 'Stone not found in inventory' };
            }

            const stoneName = getStoneName(stone);

            // Generate rendering
            const result = await generateStoneRendering({
              stoneName,
              stoneType: stone.stoneType || 'quartz',
              roomType: roomType as 'kitchen' | 'bathroom' | 'other',
              style: style as 'modern' | 'traditional' | 'transitional',
            });

            if (!result.success) {
              return { error: result.error || 'Failed to generate rendering' };
            }

            return {
              success: true,
              imageUrl: result.imageUrl,
              stoneName,
              revisedPrompt: result.revisedPrompt,
            };
          },
        },
        // Tool: Get stone inventory
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
      // Track usage for cost deduction
      onFinish: async ({ usage, finishReason }) => {
        if (usage) {
          console.log('[Chat] Token usage:', {
            promptTokens: usage.promptTokens,
            completionTokens: usage.completionTokens,
            totalTokens: usage.totalTokens,
          });

          // TODO: Implement cost deduction from user credits and tenant budget
          // This would update users.aiCredits and tenants.aiMonthlyBudget
        }
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('[Chat] Error:', error);
    return Response.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
