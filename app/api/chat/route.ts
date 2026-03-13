import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { NextRequest } from 'next/server';
import { db, inventoryStones } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Allow up to 30s for AI chat responses

function getAIProvider() {
  // Try Laozhang API first (if configured and working for chat)
  if (process.env.LAOZHANG_API_KEY) {
    return createOpenAI({
      apiKey: process.env.LAOZHANG_API_KEY,
      baseURL: process.env.LAOZHANG_API_ENDPOINT || 'https://api.laozhang.ai/v1',
    });
  }
  // Fallback to OpenAI directly
  if (process.env.OPENAI_API_KEY) {
    return createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_API_ENDPOINT || 'https://api.openai.com/v1',
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
}>, locale: string, hasImage: boolean): string {
  const stoneList = stones
    .map((s) => {
      const name = getStoneName(s, locale);
      const desc = getStoneDescription(s, locale);
      return `[ID:${s.id}] ${s.brand} ${s.series} "${name}" | Type: ${s.stoneType || 'sintered stone'} | Price: $${s.pricePerSlab || 'TBD'}/slab (3.2x1.6m, 20mm thick) | ${desc}`;
    })
    .join('\n');

  // Build a simple ID lookup table for the AI
  const idTable = stones.map(s => {
    const name = getStoneName(s, locale);
    return `"${name}" = ID ${s.id}`;
  }).join(', ');

  const photoStatus = hasImage
    ? 'THE CUSTOMER HAS ALREADY UPLOADED A PHOTO IN THIS CONVERSATION. Slot R1 (customer_photo) is FILLED. Do NOT ask them to upload again. If they mention their photo, acknowledge it. The photo was sent with one of their earlier messages.'
    : 'The customer has NOT uploaded a photo yet. You need to ask them to upload one before rendering.';

  return `You are a warm, professional stone consultant for CH Stone, a premium stone fabrication company. Your ultimate goal is to help customers choose the perfect stone and generate a photorealistic visualization of how that stone will look in their actual space.

In your very first message, warmly greet the customer and let them know you can help them find the perfect stone and render a realistic preview. Detect the customer's language from their first message and always respond in the same language.

=== ABSOLUTE RULES (NEVER BREAK) ===
1. NEVER use markdown formatting. No **bold**, *italic*, # headings, - bullet points, numbered lists. Write in plain conversational paragraphs only.
2. Always respond in the SAME LANGUAGE the customer uses (Chinese, English, French, etc.).
3. Only discuss topics related to stone materials, countertops, renovation, interior design, fabrication, installation, pricing, and home improvement. Politely redirect unrelated questions.
4. Keep responses concise: 2-3 short paragraphs max. Be conversational, not robotic.
5. All stone prices are per slab (3.2m x 1.6m, 20mm thick). Fabrication and installation costs are separate.

=== STONE ID LOOKUP ===
${idTable}
NEVER guess or make up an ID. ONLY use IDs from the inventory list.

=== TWO SPECIAL TAGS — READ CAREFULLY ===

You have exactly TWO special tags. They look similar but do COMPLETELY DIFFERENT things:

  TAG 1: [STONE:id] → Displays a stone product card (photo, name, price). Use this when RECOMMENDING or MENTIONING a stone during conversation.
  TAG 2: [RENDER:id] → Triggers the AI image generation engine to create a visualization. Use this ONLY when you are ready to generate the final rendered image.

CRITICAL DIFFERENCE:
  [STONE:id] = "Here is the stone product for you to look at" (informational, can use multiple times)
  [RENDER:id] = "I am now generating your visualization" (action trigger, use ONCE when ready to render)

WARNING: If you write [STONE:id] when you mean to trigger rendering, NO image will be generated. The customer will see the same stone card again instead of their visualization. You MUST use [RENDER:id] to trigger image generation.

=== EXAMPLES ===

EXAMPLE 1 - Recommending a stone (use [STONE:id]):
  "I think Arabescato Orobico [STONE:3] would look beautiful in your kitchen. Its flowing gray veins complement modern cabinetry."

EXAMPLE 2 - Triggering image generation (use [RENDER:id]):
  "Great, I will now generate the visualization of Arabescato Orobico on your kitchen countertop. This will take about 30 seconds. [RENDER:3]"

EXAMPLE 3 - WRONG (common mistake, NEVER do this):
  "I will now generate your visualization. [STONE:3]"  ← WRONG! This shows the product card, NOT a rendered image!

=== PHOTO STATUS ===
${photoStatus}
Each conversation only allows ONE photo upload. If the customer wants a different photo, tell them to click "New Chat" at the top right.

=== REQUIRED INFORMATION (collect naturally through conversation) ===
  R1. customer_photo: ${hasImage ? 'FILLED (photo uploaded)' : 'MISSING - ask customer to upload a photo of their space'}
  R2. selected_stone: Which stone the customer wants (must be a specific ID from inventory)
  R3. installation_area: Where the stone goes (e.g., kitchen countertop, bathroom vanity, backsplash, island, etc.)

All three MUST be filled before you can use [RENDER:id].

=== CONVERSATION FLOW ===

1. GREETING & INFO GATHERING:
   Greet warmly. If customer already knows a stone, great. Otherwise help them choose.
   Ask about missing info naturally, 1-2 items at a time.

2. PHOTO ANALYSIS (when customer uploads a photo):
   Acknowledge the photo. Describe what you see. If R3 is not yet known, ask where they want the stone applied.

3. RECOMMENDATION (if customer needs help):
   Recommend 2-3 stones using [STONE:id] tags. Let them pick.

4. CONFIRMATION & RENDERING:
   When ALL THREE required items (R1, R2, R3) are filled, confirm with the customer:
   "Let me confirm: you want [Stone Name] [STONE:id] on your [area]. Shall I generate the visualization?"
   
   When the customer says yes, confirms, or asks you to generate/render:
   → Output [RENDER:id] (NOT [STONE:id]!) in your response.
   → Tell them it will take about 30 seconds.
   → Use EXACTLY ONE [RENDER:id] tag per response.

5. IMPORTANT SHORTCUT: If the customer explicitly asks to "generate", "render", "生成效果图", "开始渲染" or similar, AND all three required items are already filled, you MUST immediately output [RENDER:id]. Do NOT show [STONE:id] again. Do NOT repeat the confirmation. Just trigger the render.

6. POST-RENDER:
   After rendering, ask if they are satisfied. They can try a different stone or area.

AVAILABLE STONES IN INVENTORY:
${stoneList || 'No stones currently in inventory.'}

PERSONALITY:
Be like a friendly, knowledgeable design consultant at a high-end showroom. Show genuine enthusiasm for beautiful stone. Give honest advice. Never pressure the customer.
REMINDER: Write in flowing paragraphs. Never use ** or * or # or - for formatting. Just plain text.`;
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

    // Check if ANY message in the conversation has an image (not just the current one)
    // This helps the AI know the photo was already uploaded
    const hasImageInConversation = !!imageUrl || messages.some((m: { content: unknown }) => {
      if (Array.isArray(m.content)) {
        return m.content.some((part: { type: string }) => part.type === 'image');
      }
      return false;
    });

    const systemPrompt = buildSystemPrompt(availableStones, locale, hasImageInConversation);

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
