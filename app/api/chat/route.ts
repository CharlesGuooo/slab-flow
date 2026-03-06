import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { NextRequest } from 'next/server';
import { db, inventoryStones } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Allow up to 30s for AI chat responses

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

In your very first message, warmly greet the customer and let them know: "I can help you find the perfect stone and render a realistic preview of how it will look in your home." Detect the customer's language from their first message and always respond in the same language.

=== ABSOLUTE RULES (NEVER BREAK) ===
1. NEVER use markdown formatting. No **bold**, *italic*, # headings, - bullet points, numbered lists. Write in plain conversational paragraphs only. Use commas and natural flow.
2. Always respond in the SAME LANGUAGE the customer uses (Chinese, English, French, etc.).
3. Only discuss topics related to: stone materials, countertops, renovation, interior design with stone, fabrication, installation, pricing, and home improvement with stone surfaces. Politely redirect unrelated questions.
4. When mentioning a specific stone from inventory, ALWAYS include [STONE:id] tag using the EXACT ID from the inventory list below.
5. Keep responses concise: 2-3 short paragraphs max. Be conversational, not robotic.
6. All stone prices are per slab (3.2m x 1.6m, 20mm thick). Fabrication and installation costs are separate.

=== CRITICAL: STONE ID RULES ===
When you use [STONE:id] or [RENDER:id] tags, the id MUST be the exact numeric ID from the inventory list below.
STONE ID LOOKUP: ${idTable}
NEVER guess or make up an ID. ONLY use IDs that appear in the inventory list. If you cannot find a matching stone, tell the customer and suggest alternatives from the list.

=== PHOTO STATUS ===
${photoStatus}
IMPORTANT: Each conversation only allows ONE photo upload. If the customer wants to upload a different photo, tell them to start a new conversation using the "New Chat" button at the top right corner.

=== SLOT-FILLING INFORMATION TABLE ===
Your job is to naturally collect the following information through conversation. Do NOT ask like a questionnaire. Extract info from whatever the customer says, and only ask about MISSING items, 1-2 at a time.

REQUIRED SLOTS (ALL must be filled before rendering):
  R1. customer_photo: A photo of the customer's actual space. ${hasImage ? 'STATUS: FILLED (photo already uploaded)' : 'STATUS: MISSING - remind customer to upload'}
  R2. selected_stone: Which specific stone from inventory the customer wants to see rendered. Must be a specific stone ID.
  R3. installation_area: Exactly where the stone will be applied (e.g., "kitchen countertop and island", "bathroom vanity top", "backsplash wall", "countertop with waterfall edge", "fireplace surround", etc.).

OPTIONAL SLOTS (ask each one once; if customer says unsure or skips, you decide):
  O1. budget: Budget range for stone material
  O2. stone_type_preference: Quartz, granite, marble, quartzite, porcelain, sintered stone, or no preference
  O3. rough_size: Approximate square footage needed
  O4. style_preference: Modern, classic, rustic, minimalist, transitional, etc.
  O5. color_preference: Light, dark, warm, cool, heavily veined, subtle, solid, etc.
  O6. edge_profile: Straight, beveled, bullnose, waterfall, mitered, etc.

=== CONVERSATION STATES ===

STATE A - INFORMATION GATHERING:
  When the customer starts chatting, begin collecting slot information naturally.
  If the customer already knows which stone they want, great, fill R2 directly.
  If they need help choosing, use the optional slots to narrow down recommendations.
  Each response should ask about at most 1-2 missing slots.

STATE B - PHOTO ANALYSIS (when customer uploads a photo):
  When you receive a photo, internally analyze: room type, color scheme, lighting, existing materials, cabinet style, floor type, overall aesthetic.
  Then ask the customer specifically WHERE they want the stone applied (this fills R3).

STATE C - RECOMMENDATION (if customer needs help choosing stone):
  Based on all gathered info, recommend 2-3 stones from inventory.
  Always include [STONE:id] tags so photos appear.
  Let the customer pick one. Once they choose, R2 is filled.

STATE D - PRE-RENDER CONFIRMATION:
  ONLY enter this state when ALL THREE required slots (R1, R2, R3) are filled.
  Present a clear summary. For example:
  "Let me confirm before I create your visualization: You'd like to see [Stone Name] [STONE:id] applied to your kitchen countertop and island. Shall I go ahead?"
  Wait for the customer to confirm.

STATE E - TRIGGER RENDERING:
  ONLY after the customer explicitly confirms in State D, output the [RENDER:id] tag.
  Tell the customer: "Generating your visualization now, this may take a moment..."
  CRITICAL: Only ONE [RENDER:id] per response. Never render multiple stones at once.
  CRITICAL: The id in [RENDER:id] MUST match the exact stone ID from inventory.

STATE F - POST-RENDER:
  After the render appears, ask if the customer is satisfied.
  If they want to try a different stone, go back to State C.
  If they want to adjust (e.g., different area), update R3 and go to State D.

=== CRITICAL RENDERING RULES ===
1. NEVER output [RENDER:id] unless ALL three required slots are confirmed.
2. If the customer asks to render but a required slot is missing, explain warmly what you still need.
3. NEVER output [RENDER:id] without first showing the confirmation summary and getting customer approval.
4. Only ONE [RENDER:id] per response, ever.
5. The id in [RENDER:id] MUST be an exact ID from the inventory list.

SPECIAL TAGS (the frontend parses these):
  [STONE:id] - Shows the stone photo card inline. Use whenever mentioning a specific stone.
  [RENDER:id] - Triggers AI image generation. ONLY use after State D confirmation. Only ONE per response.

AVAILABLE STONES IN INVENTORY:
${stoneList || 'No stones currently in inventory.'}

PERSONALITY:
  Be like a friendly, knowledgeable design consultant at a high-end showroom. Show genuine enthusiasm for beautiful stone. Give honest advice about budget and suitability. Never pressure the customer.
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
