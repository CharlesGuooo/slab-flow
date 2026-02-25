/**
 * Stone Rendering Service
 * Uses Laozhang API (OpenAI-compatible) for DALL-E image generation
 */

const LAOZHANG_API_KEY = process.env.LAOZHANG_API_KEY;
const LAOZHANG_API_ENDPOINT = process.env.LAOZHANG_API_ENDPOINT || 'https://api.laozhang.ai/v1';

export interface RenderResult {
  success: boolean;
  imageUrl?: string;
  revisedPrompt?: string;
  error?: string;
}

export interface StoneRenderOptions {
  stoneName: string;
  stoneType: string;
  stoneImageUrl?: string;
  roomType: 'kitchen' | 'bathroom' | 'other';
  style?: 'modern' | 'traditional' | 'transitional';
  cabinetColor?: string;
}

/**
 * Generate a rendered image of stone in a room setting
 */
export async function generateStoneRendering(options: StoneRenderOptions): Promise<RenderResult> {
  if (!LAOZHANG_API_KEY) {
    return {
      success: false,
      error: 'Laozhang API key not configured',
    };
  }

  const {
    stoneName,
    stoneType,
    roomType,
    style = 'modern',
    cabinetColor = 'white',
  } = options;

  // Build the prompt for DALL-E
  const prompt = buildRenderPrompt({
    stoneName,
    stoneType,
    roomType,
    style,
    cabinetColor,
  });

  try {
    const response = await fetch(`${LAOZHANG_API_ENDPOINT}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LAOZHANG_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'url',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[RENDERING] API error:', errorData);
      return {
        success: false,
        error: errorData.error?.message || `API error: ${response.status}`,
      };
    }

    const data = await response.json();

    if (data.data && data.data[0] && data.data[0].url) {
      return {
        success: true,
        imageUrl: data.data[0].url,
        revisedPrompt: data.data[0].revised_prompt,
      };
    }

    return {
      success: false,
      error: 'No image URL in response',
    };
  } catch (error) {
    console.error('[RENDERING] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Build a detailed prompt for DALL-E to render stone in a room
 */
function buildRenderPrompt(options: StoneRenderOptions): string {
  const { stoneName, stoneType, roomType, style = 'modern', cabinetColor = 'white' } = options;

  const roomDescriptions = {
    kitchen: 'a modern kitchen with counter space, backsplash, and kitchen island',
    bathroom: 'a clean bathroom with vanity countertop and mirror',
    other: 'an interior space with countertop',
  };

  const styleDescriptions = {
    modern: 'sleek, minimalist design with clean lines',
    traditional: 'classic design with ornate details',
    transitional: 'blend of modern and traditional elements',
  };

  const stoneDescriptions: Record<string, string> = {
    quartz: 'engineered quartz with consistent patterns',
    granite: 'natural granite with unique mineral patterns',
    marble: 'elegant marble with distinctive veining',
    quartzite: 'natural quartzite with crystalline appearance',
    porcelain: 'large format porcelain with realistic stone look',
  };

  const stoneDesc = stoneDescriptions[stoneType.toLowerCase()] || 'beautiful natural stone';

  return `Photorealistic interior design photograph of ${roomDescriptions[roomType]}.
The countertop features ${stoneName}, ${stoneDesc}.
The design style is ${styleDescriptions[style]}.
Cabinets are ${cabinetColor}.
Professional architectural photography, natural lighting, high-end residential interior.
Ultra realistic, 8k quality, magazine-worthy image.
Focus on the beautiful ${stoneType} countertop surface as the main feature.`;
}

/**
 * Generate a quick preview render (lower quality, faster)
 */
export async function generateQuickPreview(
  stoneName: string,
  stoneType: string
): Promise<RenderResult> {
  return generateStoneRendering({
    stoneName,
    stoneType,
    roomType: 'kitchen',
    style: 'modern',
  });
}

/**
 * Check if the rendering service is available
 */
export async function checkRenderingService(): Promise<{ available: boolean; error?: string }> {
  if (!LAOZHANG_API_KEY) {
    return { available: false, error: 'API key not configured' };
  }

  try {
    // Just check if we can reach the API
    const response = await fetch(`${LAOZHANG_API_ENDPOINT}/models`, {
      headers: {
        'Authorization': `Bearer ${LAOZHANG_API_KEY}`,
      },
    });

    if (response.ok) {
      return { available: true };
    }

    return { available: false, error: `API returned ${response.status}` };
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
