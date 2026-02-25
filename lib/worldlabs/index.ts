/**
 * World Labs 3D Reconstruction Service
 * API Documentation: https://docs.worldlabs.ai/api/reference
 */

const WORLD_LABS_API_KEY = process.env.WORLD_LABS_API_KEY;
const API_BASE_URL = 'https://api.worldlabs.ai/marble/v1';

export interface WorldLabsConfig {
  apiKey?: string;
  model?: 'Marble 0.1-mini' | 'Marble 0.1-plus';
}

export interface GenerateWorldOptions {
  textPrompt?: string;
  imageBase64?: string;
  imageUrl?: string;
  displayName?: string;
  tags?: string[];
  model?: 'Marble 0.1-mini' | 'Marble 0.1-plus';
  seed?: number;
  autoEnhance?: boolean;
}

export interface WorldLabsOperation {
  operation_id: string;
  done: boolean;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  error?: {
    code: number;
    message: string;
  };
  metadata?: {
    progress?: number;
    world_id?: string;
  };
  response?: {
    world_id: string;
  };
}

export interface WorldLabsWorld {
  world_id: string;
  display_name: string;
  world_marble_url: string;
  created_at: string;
  updated_at: string;
  model: string;
  assets: {
    thumbnail_url?: string;
    caption?: string;
    imagery?: {
      pano_url?: string;
    };
    mesh?: {
      collider_mesh_url?: string;
    };
    splats?: {
      spz_urls?: Record<string, string>;
    };
  };
  permission: {
    public: boolean;
    allowed_readers: string[];
    allowed_writers: string[];
  };
  tags: string[];
  world_prompt: {
    type: string;
    text_prompt?: string;
  };
}

/**
 * Make an API request to World Labs
 */
async function apiFetch(
  path: string,
  method: 'GET' | 'POST' = 'GET',
  body?: unknown
): Promise<unknown> {
  if (!WORLD_LABS_API_KEY) {
    throw new Error('WORLD_LABS_API_KEY not configured');
  }

  const url = `${API_BASE_URL}/${path}`;
  const headers: Record<string, string> = {
    'WLT-Api-Key': WORLD_LABS_API_KEY,
  };

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`World Labs API error: ${response.status} ${errorText}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

/**
 * Start world generation from text or image
 */
export async function generateWorld(
  options: GenerateWorldOptions
): Promise<string> {
  const {
    textPrompt,
    imageBase64,
    displayName,
    tags,
    model = 'Marble 0.1-mini',
    seed,
    autoEnhance = true,
  } = options;

  if (!textPrompt && !imageBase64) {
    throw new Error('Either textPrompt or imageBase64 is required');
  }

  const worldPrompt: Record<string, unknown> = {
    type: imageBase64 ? 'image' : 'text',
    disable_recaption: !autoEnhance,
  };

  if (textPrompt) {
    worldPrompt.text_prompt = textPrompt;
  }

  if (imageBase64) {
    worldPrompt.image_prompt = {
      source: 'data_base64',
      data_base64: imageBase64,
    };
  }

  const requestBody: Record<string, unknown> = {
    world_prompt: worldPrompt,
    model,
  };

  if (displayName) {
    requestBody.display_name = displayName;
  }

  if (tags && tags.length > 0) {
    requestBody.tags = tags;
  }

  if (seed !== undefined) {
    requestBody.seed = seed;
  }

  const result = (await apiFetch('worlds:generate', 'POST', requestBody)) as WorldLabsOperation;

  if (!result.operation_id) {
    throw new Error('Failed to get operation_id from World Labs');
  }

  console.log(`[World Labs] Started generation: ${result.operation_id}`);
  return result.operation_id;
}

/**
 * Get operation status
 */
export async function getOperation(operationId: string): Promise<WorldLabsOperation> {
  const result = await apiFetch(`operations/${operationId}`);
  return result as WorldLabsOperation;
}

/**
 * Get world details by ID
 */
export async function getWorld(worldId: string): Promise<WorldLabsWorld> {
  const result = await apiFetch(`worlds/${worldId}`);
  return result as WorldLabsWorld;
}

/**
 * Generate a world and wait for completion
 * Returns the world object when done
 */
export async function generateWorldAndWait(
  options: GenerateWorldOptions,
  maxWaitSeconds: number = 300,
  pollIntervalSeconds: number = 5
): Promise<WorldLabsWorld> {
  const operationId = await generateWorld(options);

  const startTime = Date.now();
  const maxWaitMs = maxWaitSeconds * 1000;
  const pollIntervalMs = pollIntervalSeconds * 1000;

  while (Date.now() - startTime < maxWaitMs) {
    const operation = await getOperation(operationId);

    if (operation.done) {
      if (operation.error) {
        throw new Error(`World generation failed: ${operation.error.message}`);
      }

      if (operation.response?.world_id) {
        console.log(`[World Labs] Generation complete: ${operation.response.world_id}`);
        return await getWorld(operation.response.world_id);
      }
    }

    const progress = operation.metadata?.progress;
    console.log(`[World Labs] Processing... ${progress ? `${progress}%` : 'in progress'}`);

    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`World generation timed out after ${maxWaitSeconds} seconds`);
}

/**
 * Generate 3D world from uploaded kitchen/bathroom photo
 */
export async function generateSceneFromPhoto(
  imageBase64: string,
  roomType: 'kitchen' | 'bathroom' | 'other' = 'kitchen',
  stoneName?: string
): Promise<WorldLabsWorld> {
  const prompt = stoneName
    ? `A photorealistic ${roomType} with ${stoneName} countertops. Modern interior design, professional photography, high quality.`
    : `A photorealistic modern ${roomType} interior. Professional photography, high quality.`;

  return generateWorldAndWait({
    imageBase64,
    textPrompt: prompt,
    displayName: `${roomType}-${Date.now()}`,
    tags: ['slabflow', roomType],
    model: 'Marble 0.1-mini', // Use mini for faster generation
    autoEnhance: true,
  }, 300, 5);
}

/**
 * Check if World Labs service is available
 */
export async function checkWorldLabsService(): Promise<{ available: boolean; error?: string }> {
  if (!WORLD_LABS_API_KEY) {
    return { available: false, error: 'WORLD_LABS_API_KEY not configured' };
  }

  try {
    // Try to list worlds (lightweight API call)
    await apiFetch('worlds:list', 'POST', { page_size: 1 });
    return { available: true };
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get SPZ (Gaussian Splatting) URL from world
 */
export function getSpzUrl(world: WorldLabsWorld): string | null {
  const spzUrls = world.assets?.splats?.spz_urls;
  if (!spzUrls) return null;

  // Return the first available SPZ URL
  const keys = Object.keys(spzUrls);
  if (keys.length === 0) return null;

  return spzUrls[keys[0]] || null;
}

/**
 * Get thumbnail URL from world
 */
export function getThumbnailUrl(world: WorldLabsWorld): string | null {
  return world.assets?.thumbnail_url || null;
}
