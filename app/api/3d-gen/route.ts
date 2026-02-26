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
    const { imageUrl, imageBase64, prompt, model = 'marble-0.1-mini' } = body;

    if (!imageUrl && !imageBase64) {
      return NextResponse.json(
        { error: 'An image is required to generate a 3D scene.' },
        { status: 400 }
      );
    }

    // Build the World Labs API request
    const worldLabsBody: Record<string, unknown> = {
      model: model, // marble-0.1-mini (fast, ~30s) or marble-0.1-plus (quality, ~5min)
    };

    // Set the image input
    if (imageUrl) {
      worldLabsBody.image = {
        type: 'uri',
        uri: imageUrl,
      };
    } else if (imageBase64) {
      worldLabsBody.image = {
        type: 'data_base64',
        data: imageBase64,
        media_type: 'image/jpeg',
      };
    }

    // Optional text prompt for guidance
    if (prompt) {
      worldLabsBody.prompt = prompt;
    }

    // Call World Labs API to start generation
    const generateResponse = await fetch(`${WORLDLABS_API_BASE}/marble/v1/worlds:generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WORLDLABS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(worldLabsBody),
    });

    if (!generateResponse.ok) {
      const errorData = await generateResponse.json().catch(() => ({}));
      console.error('[3D-Gen] World Labs API error:', errorData);
      return NextResponse.json(
        { error: errorData.error?.message || `World Labs API error: ${generateResponse.status}` },
        { status: generateResponse.status }
      );
    }

    const generateData = await generateResponse.json();
    const operationId = generateData.operation_id || generateData.id;

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
      estimatedTime: model === 'marble-0.1-mini' ? '30-45 seconds' : '4-5 minutes',
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
    const statusResponse = await fetch(
      `${WORLDLABS_API_BASE}/marble/v1/operations/${operationId}`,
      {
        headers: {
          'Authorization': `Bearer ${WORLDLABS_API_KEY}`,
        },
      }
    );

    if (!statusResponse.ok) {
      const errorData = await statusResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error?.message || `Status check failed: ${statusResponse.status}` },
        { status: statusResponse.status }
      );
    }

    const statusData = await statusResponse.json();

    // Check if generation is complete
    if (statusData.done || statusData.status === 'completed' || statusData.result) {
      const result = statusData.result || statusData;
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
    return NextResponse.json({
      status: 'processing',
      progress: statusData.progress || statusData.metadata?.progress,
    });
  } catch (error) {
    console.error('[3D-Gen] Status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
