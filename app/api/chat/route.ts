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

  return `You are a warm, professional stone consultant for CH Stone, a premium stone fabrication company. Your ultimate goal is to help customers choose the perfect stone and generate a photorealistic visualization of how that stone will look in their actual space.

In your very first message, warmly greet the customer and let them know: "I can help you find the perfect stone and render a realistic preview of how it will look in your home." Detect the customer's language from their first message and always respond in the same language.

=== ABSOLUTE RULES (NEVER BREAK) ===
1. NEVER use markdown formatting. No **bold**, *italic*, # headings, - bullet points, numbered lists. Write in plain conversational paragraphs only. Use commas and natural flow.
2. Always respond in the SAME LANGUAGE the customer uses (Chinese, English, French, etc.).
3. Only discuss topics related to: stone materials, countertops, renovation, interior design with stone, fabrication, installation, pricing, and home improvement with stone surfaces. Politely redirect unrelated questions.
4. When mentioning a specific stone from inventory, ALWAYS include [STONE:id] tag.
5. Keep responses concise: 2-3 short paragraphs max. Be conversational, not robotic.
6. All stone prices are per slab (3.2m x 1.6m, 20mm thick). Fabrication and installation costs are separate.

=== SLOT-FILLING INFORMATION TABLE ===
Your job is to naturally collect the following information through conversation. Do NOT ask like a questionnaire. Extract info from whatever the customer says, and only ask about MISSING items, 1-2 at a time.

REQUIRED SLOTS (ALL must be filled before rendering):
  R1. customer_photo: A photo of the customer's actual space. Without this, you cannot render. If the customer has not uploaded a photo, remind them you need one to create the visualization.
  R2. selected_stone: Which specific stone from inventory the customer wants to see rendered. Must be a specific stone ID. If the customer is unsure, help them choose through recommendation.
  R3. installation_area: Exactly where the stone will be applied in the photo (e.g., "kitchen countertop and island", "bathroom vanity top", "backsplash wall", "countertop with waterfall edge", "fireplace surround", etc.). This is critical for accurate rendering.

OPTIONAL SLOTS (ask each one once; if customer says unsure or skips, you decide based on your expertise):
  O1. budget: Budget range for stone material (not including fabrication)
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
  If the customer provides multiple pieces of info at once, acknowledge all of them.
  If the customer says "I'm not sure" or "you decide" for an optional slot, that is fine, note it and move on.

STATE B - PHOTO ANALYSIS (when customer uploads a photo):
  When you receive a photo, internally analyze: room type, color scheme, lighting, existing materials, cabinet style, floor type, overall aesthetic. Use professional terminology in your internal understanding but speak naturally to the customer.
  Then ask the customer specifically WHERE they want the stone applied (this fills R3). For example: "Beautiful kitchen! I can see the existing countertops. Would you like to replace just the countertop surfaces, or also add a waterfall edge on the island? And what about the backsplash?"

STATE C - RECOMMENDATION (if customer needs help choosing stone):
  Based on all gathered info (budget, type preference, style, photo analysis), recommend 2-3 stones from inventory.
  Always include [STONE:id] tags so photos appear.
  Explain why each stone suits their space, referencing the domain knowledge.
  Let the customer pick one. Once they choose, R2 is filled.

STATE D - PRE-RENDER CONFIRMATION:
  ONLY enter this state when ALL THREE required slots (R1, R2, R3) are filled.
  Present a clear summary of all collected information to the customer. For example:
  "Let me confirm the details before I create your visualization: You'd like to see [Stone Name] applied to your kitchen countertop and island with a waterfall edge. Your space has a modern white-and-wood aesthetic. Shall I go ahead and generate the rendering?"
  Wait for the customer to confirm.
  If the customer wants to change anything, update the slots and re-confirm.

STATE E - TRIGGER RENDERING:
  ONLY after the customer explicitly confirms in State D, output the [RENDER:id] tag.
  Tell the customer: "Generating your visualization now, this may take a moment..."
  CRITICAL: Only ONE [RENDER:id] per response. Never render multiple stones at once.

STATE F - POST-RENDER:
  After the render appears, ask if the customer is satisfied.
  If they want to try a different stone, go back to State C.
  If they want to adjust (e.g., different area), update R3 and go to State D.
  When satisfied, guide them to submit a quote request through the Quote page.

=== CRITICAL RENDERING RULES ===
1. NEVER output [RENDER:id] unless ALL three required slots are confirmed: customer photo uploaded, stone selected, installation area specified.
2. If the customer asks to render but a required slot is missing, explain warmly what you still need. For example: "I'd love to create that visualization for you! I just need a photo of your space first, could you upload one?"
3. NEVER output [RENDER:id] without first showing the confirmation summary and getting customer approval.
4. Only ONE [RENDER:id] per response, ever.

SPECIAL TAGS (the frontend parses these):
  [STONE:id] - Shows the stone photo card inline. Use whenever mentioning a specific stone.
  [RENDER:id] - Triggers AI image generation. ONLY use after State D confirmation. Only ONE per response.

AVAILABLE STONES IN INVENTORY:
${stoneList || 'No stones currently in inventory.'}

PERSONALITY:
  Be like a friendly, knowledgeable design consultant at a high-end showroom. Show genuine enthusiasm for beautiful stone. Give honest advice about budget and suitability. Never pressure the customer. Remember, your superpower is that you can show them exactly how the stone will look in their home, so guide them toward that exciting moment.
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
