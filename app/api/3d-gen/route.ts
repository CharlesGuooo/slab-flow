import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'default-secret-change-in-production'
);

const WORLDLABS_API_KEY = process.env.WORLDLABS_API_KEY;
const WORLDLABS_API_BASE = 'https://api.worldlabs.ai';

/**
 * POST - Generate 3D scene from an image using World Labs API
 */
export async function POST(request: Request) {
  try {
    // Verify session
    const cookieStore = await cookies();
    const token = cookieStore.get('user_session')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await jwtVerify(token, JWT_SECRET);

    if (!WORLDLABS_API_KEY) {
      return NextResponse.json(
        { error: 'World Labs API key not configured. Please contact the administrator.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { imageBase64, imageUrl, prompt, model = 'Marble 0.1-mini' } = body;

    if (!imageBase64 && !imageUrl) {
      return NextResponse.json(
        { error: 'An image is required to generate a 3D scene.' },
        { status: 400 }
      );
    }

    // Build the World Labs API request body per official docs
    // Auth: WLT-Api-Key header
    // Models: "Marble 0.1-mini" or "Marble 0.1-plus"
    const worldLabsBody: Record<string, unknown> = {
      model: model, // "Marble 0.1-mini" or "Marble 0.1-plus"
      permission: {
        public: true, // so user can view the result
      },
    };

    // Build world_prompt based on input type
    if (imageBase64) {
      // DataBase64Reference format
      // Strip data URL prefix if present (e.g., "data:image/jpeg;base64,")
      let base64Data = imageBase64;
      let extension = 'jpg';
      
      if (base64Data.startsWith('data:')) {
        const match = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
        if (match) {
          extension = match[1] === 'jpeg' ? 'jpg' : match[1];
          base64Data = match[2];
        } else {
          // Just strip the prefix
          base64Data = base64Data.split(',')[1] || base64Data;
        }
      }

      worldLabsBody.world_prompt = {
        type: 'image',
        image_prompt: {
          source: 'data_base64',
          data_base64: base64Data,
          extension: extension,
        },
        ...(prompt ? { text_prompt: prompt, disable_recaption: true } : {}),
      };
    } else if (imageUrl) {
      // UriReference format
      worldLabsBody.world_prompt = {
        type: 'image',
        image_prompt: {
          source: 'uri',
          uri: imageUrl,
        },
        ...(prompt ? { text_prompt: prompt, disable_recaption: true } : {}),
      };
    }

    console.log('[3D-Gen] Sending request to World Labs API...');
    console.log('[3D-Gen] Model:', model);
    console.log('[3D-Gen] Prompt type:', imageBase64 ? 'data_base64' : 'uri');

    // Call World Labs API to start generation
    // IMPORTANT: Auth header is "WLT-Api-Key", NOT "Authorization: Bearer"
    const generateResponse = await fetch(`${WORLDLABS_API_BASE}/marble/v1/worlds:generate`, {
      method: 'POST',
      headers: {
        'WLT-Api-Key': WORLDLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(worldLabsBody),
    });

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      console.error('[3D-Gen] World Labs API error:', generateResponse.status, errorData);
      
      let userMessage = `World Labs API error (${generateResponse.status})`;
      if (generateResponse.status === 401) {
        userMessage = 'World Labs API authentication failed. Please check your API key.';
      } else if (generateResponse.status === 402) {
        userMessage = 'Insufficient World Labs credits. Please top up your account.';
      } else if (generateResponse.status === 400) {
        userMessage = errorData?.error?.message || errorData?.detail || 'Invalid request. Please try a different image.';
      }
      
      return NextResponse.json(
        { error: userMessage, details: errorData },
        { status: generateResponse.status }
      );
    }

    const generateData = await generateResponse.json();
    console.log('[3D-Gen] Generation started:', JSON.stringify(generateData));
    
    const operationId = generateData.operation_id;

    if (!operationId) {
      return NextResponse.json(
        { error: 'Failed to start 3D generation. No operation ID returned.' },
        { status: 500 }
      );
    }

    // Return the operation ID for polling
    return NextResponse.json({
      success: true,
      operationId,
      model,
      estimatedTime: model === 'Marble 0.1-mini' ? '30-45 seconds' : '4-5 minutes',
    });
  } catch (error) {
    console.error('[3D-Gen] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Check the status of a 3D generation operation
 */
export async function GET(request: Request) {
  try {
    // Verify session
    const cookieStore = await cookies();
    const token = cookieStore.get('user_session')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await jwtVerify(token, JWT_SECRET);

    if (!WORLDLABS_API_KEY) {
      return NextResponse.json(
        { error: 'World Labs API key not configured' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const operationId = searchParams.get('operationId');

    if (!operationId) {
      return NextResponse.json(
        { error: 'operationId is required' },
        { status: 400 }
      );
    }

    // Poll World Labs API for operation status
    // IMPORTANT: Auth header is "WLT-Api-Key", NOT "Authorization: Bearer"
    const statusResponse = await fetch(
      `${WORLDLABS_API_BASE}/marble/v1/operations/${operationId}`,
      {
        headers: {
          'WLT-Api-Key': WORLDLABS_API_KEY,
        },
      }
    );

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      console.error('[3D-Gen] Status check error:', statusResponse.status, errorText);
      return NextResponse.json(
        { error: `Status check failed: ${statusResponse.status}` },
        { status: statusResponse.status }
      );
    }

    const statusData = await statusResponse.json();
    console.log('[3D-Gen] Operation status:', JSON.stringify(statusData));

    // Check if generation is complete
    if (statusData.done === true) {
      // Check for error
      if (statusData.error) {
        return NextResponse.json({
          status: 'failed',
          error: statusData.error.message || 'Generation failed',
        });
      }
      
      // Success - extract result
      const result = statusData.response || statusData;
      return NextResponse.json({
        status: 'completed',
        worldId: result.world_id || result.id,
        marbleUrl: result.world_marble_url,
        splatUrl: result.assets?.geometry?.splat_url,
        thumbnailUrl: result.assets?.imagery?.thumbnail_url,
        panoUrl: result.assets?.imagery?.pano_url,
        caption: result.caption,
      });
    }

    // Still processing
    const progress = statusData.metadata?.progress;
    return NextResponse.json({
      status: 'processing',
      progress: progress,
    });
  } catch (error) {
    console.error('[3D-Gen] Status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
