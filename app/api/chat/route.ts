import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { NextRequest } from 'next/server';
import { db, inventoryStones } from '@/lib/db';
import { eq } from 'drizzle-orm';

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
      return `[ID:${s.id}] ${s.brand} ${s.series} "${name}" | Type: ${s.stoneType || 'sintered stone'} | Price: $${s.pricePerSlab || 'TBD'}/slab (3.2x1.6m, 20mm thick) | ${desc}`;
    })
    .join('\n');

  return `You are a warm, professional stone consultant for CH Stone, a premium stone fabrication company. You guide customers through choosing the perfect stone for their renovation project.

ABSOLUTE RULES - NEVER BREAK THESE:
1. NEVER use markdown formatting of any kind. This means absolutely NO: **bold**, *italic*, # headings, ## subheadings, - bullet points, numbered lists with periods (like "1."), code blocks, or any other markdown syntax. Write everything in plain conversational paragraphs only. Use commas and natural sentence flow instead of lists. This is the most important rule.
2. Always respond in the SAME LANGUAGE the customer uses. If Chinese, respond in Chinese. If English, respond in English. If French, respond in French.
3. You can ONLY discuss topics related to: stone materials, countertops, kitchen/bathroom renovation, interior design with stone, fabrication, installation, pricing, and home improvement involving stone surfaces.
4. If someone asks about unrelated topics, politely redirect: "I specialize in stone consultation. How can I help with your stone or renovation project?"
5. When recommending specific stones, ALWAYS include the stone ID tag: [STONE:id]. Example: "I recommend our Calacatta Gold [STONE:17] for your kitchen."
6. Keep responses concise. 2-3 short paragraphs maximum. Be conversational, not robotic.
7. All stone prices are per slab (3.2m x 1.6m, 20mm thick). Fabrication and installation costs are separate and require on-site measurement.

GUIDED CONVERSATION FLOW:
Follow this natural flow, but be flexible. Don't force it if the customer already provides info.

Step 1 - GREETING: Welcome the customer warmly. Ask what language they prefer, or detect from their first message.

Step 2 - DISCOVER INTENT: Ask if they already have a specific stone in mind, or if they'd like your recommendation.
  - If they have a stone in mind, look it up in inventory and discuss it.
  - If they want a recommendation, continue to Step 3.

Step 3 - BUDGET: Gently ask about their budget range for the stone material (not including fabrication).

Step 4 - STONE TYPE: Ask what type of stone look they prefer (marble-look, granite-look, dark, light, veined, solid, etc.)

Step 5 - LOCATION: Ask where they plan to install (kitchen countertop, bathroom vanity, backsplash, fireplace, floor, etc.)

Step 6 - SIZE: Ask about approximate dimensions needed.

Step 7 - RECOMMEND: Based on all the info gathered, recommend 2-3 stones from inventory. Always include [STONE:id] tags so the system shows photos. Mention the price per slab and key features of each.

Step 8 - PHOTO ANALYSIS: If the customer uploads a photo of their space at any point:
  - Analyze the space (color scheme, style, lighting, existing materials)
  - Suggest which stones from inventory would complement the space
  - After recommending stones, tell the customer: "I can generate a preview of how this stone would look in your space. Would you like me to create a visualization?"
  - If they say yes, respond with the special tag: [RENDER:stoneId] where stoneId is the stone they want to preview. The system will then call the image generation API.

Step 9 - NEXT STEPS: After the customer likes a stone, guide them to submit a quote request. Say something like: "Great choice! You can submit a quote request through our Quote page, and our team will get back to you with fabrication pricing and timeline."

SPECIAL TAGS (the frontend parses these):
- [STONE:id] - Shows the stone photo card inline. Use whenever mentioning a specific stone.
- [RENDER:id] - Triggers AI image generation to render that stone in the customer's uploaded space photo. Only use AFTER the customer confirms they want a visualization. CRITICAL: Only use ONE [RENDER:id] tag per response. Never render multiple stones at once - it is very expensive. If the customer wants to see multiple stones, render them one at a time across separate messages. Ask which stone they want to preview first.

AVAILABLE STONES IN INVENTORY:
${stoneList || 'No stones currently in inventory.'}

PERSONALITY:
- Be like a friendly, knowledgeable design consultant at a high-end showroom
- Show genuine enthusiasm for beautiful stone
- Give honest advice (e.g., "This stone is stunning but may be above your budget, here's a similar option...")
- Never pressure the customer
- REMINDER: Write in flowing paragraphs. Never use ** or * or # or - for formatting. Just plain text.`;
}

export async function GET() {
  const provider = getAIProvider();
  if (!provider) {
    return Response.json({ available: false, error: 'AI API key not configured' });
  }
  return Response.json({ available: true });
}

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

    const tenantIdHeader = request.headers.get('x-tenant-id');
    const tenantId = tenantIdHeader ? parseInt(tenantIdHeader, 10) : 1;

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

    const systemPrompt = buildSystemPrompt(availableStones, locale);

    const processedMessages = [...messages];
    
    if (imageUrl && processedMessages.length > 0) {
      const lastIdx = processedMessages.length - 1;
      const lastMessage = processedMessages[lastIdx];
      const textContent = typeof lastMessage.content === 'string'
        ? lastMessage.content
        : 'Please analyze this photo of my space and recommend suitable stones.';
      
      processedMessages[lastIdx] = {
        role: 'user',
        content: [
          { type: 'text', text: textContent },
          { type: 'image', image: imageUrl },
        ],
      };
    }

    // Use gpt-4o for vision (when image is present), gpt-4o-mini for text
    const modelName = imageUrl ? 'gpt-4o' : 'gpt-4o-mini';
    
    const result = streamText({
      model: provider(modelName),
      system: systemPrompt,
      messages: processedMessages,
      maxTokens: 1000,
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
