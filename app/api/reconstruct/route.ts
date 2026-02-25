import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db, tenants, inventoryStones, orderPhotos } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import {
  checkWorldLabsService,
  generateSceneFromPhoto,
  getSpzUrl,
  getThumbnailUrl,
  generateWorld,
  getOperation,
  getWorld,
} from '@/lib/worldlabs';
import { uploadFile, UploadPaths } from '@/lib/r2';

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'default-secret-change-in-production'
);

/**
 * GET - Check World Labs service status
 */
export async function GET() {
  const status = await checkWorldLabsService();
  return NextResponse.json(status);
}

/**
 * POST - Process images for 3D reconstruction
 */
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('user_session')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const tenantId = payload.tenantId as number;

    // Check if tenant has 3D reconstruction feature enabled
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant.length || !tenant[0].feature3dReconstruction) {
      return NextResponse.json(
        { error: '3D Reconstruction feature is not enabled for your account' },
        { status: 403 }
      );
    }

    // Check if tenant has sufficient budget (at least $1.26 for 3D reconstruction)
    const budget = parseFloat(tenant[0].aiMonthlyBudget || '0');
    if (budget < 1.26) {
      return NextResponse.json(
        { error: 'Insufficient AI budget for 3D reconstruction' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, imageBase64, imageUrls, stoneId, roomType, orderId, photoId } = body;

    switch (action) {
      case 'check': {
        const status = await checkWorldLabsService();
        return NextResponse.json(status);
      }

      case 'start': {
        // Start 3D generation (async, returns operation ID)
        let base64Data = imageBase64;

        if (!base64Data && imageUrls && imageUrls.length > 0) {
          const imageUrl = imageUrls[0];
          const imageResponse = await fetch(imageUrl);
          const imageBuffer = await imageResponse.arrayBuffer();
          base64Data = Buffer.from(imageBuffer).toString('base64');
        }

        if (!base64Data) {
          return NextResponse.json(
            { error: 'Image is required for 3D generation' },
            { status: 400 }
          );
        }

        // Get stone info if provided
        let stoneName: string | undefined;
        if (stoneId) {
          const stone = await db
            .select()
            .from(inventoryStones)
            .where(eq(inventoryStones.id, stoneId))
            .limit(1);

          if (stone.length > 0) {
            try {
              const nameObj = stone[0].name as { en?: string; zh?: string } | null;
              stoneName = nameObj?.en || nameObj?.zh || `${stone[0].brand} ${stone[0].series}`;
            } catch {
              stoneName = `${stone[0].brand} ${stone[0].series}`;
            }
          }
        }

        console.log(`[Reconstruct] Starting 3D world generation for ${roomType || 'room'}`);

        // Start generation (returns operation ID immediately)
        const operationId = await generateWorld({
          imageBase64: base64Data,
          textPrompt: stoneName
            ? `A photorealistic ${roomType || 'kitchen'} with ${stoneName} countertops. Modern interior design.`
            : `A photorealistic modern ${roomType || 'kitchen'} interior.`,
          displayName: `${roomType || 'room'}-${Date.now()}`,
          tags: ['slabflow', roomType || 'kitchen'],
          model: 'Marble 0.1-mini',
        });

        return NextResponse.json({
          success: true,
          operationId,
          status: 'processing',
          message: '3D generation started. Poll status to check progress.',
        });
      }

      case 'status': {
        // Check operation status
        const { operationId } = body;

        if (!operationId) {
          return NextResponse.json(
            { error: 'operationId is required' },
            { status: 400 }
          );
        }

        const operation = await getOperation(operationId);

        return NextResponse.json({
          success: true,
          operationId,
          done: operation.done,
          progress: operation.metadata?.progress || 0,
          error: operation.error?.message,
          worldId: operation.response?.world_id,
        });
      }

      case 'complete': {
        // Complete generation: get world, backup to R2, update database
        const { operationId, orderId, photoId } = body;

        if (!operationId) {
          return NextResponse.json(
            { error: 'operationId is required' },
            { status: 400 }
          );
        }

        const operation = await getOperation(operationId);

        if (!operation.done) {
          return NextResponse.json({
            success: false,
            status: 'processing',
            progress: operation.metadata?.progress || 0,
            message: 'Generation still in progress',
          });
        }

        if (operation.error) {
          return NextResponse.json({
            success: false,
            error: operation.error.message,
          });
        }

        const worldId = operation.response?.world_id;
        if (!worldId) {
          return NextResponse.json({
            success: false,
            error: 'No world ID in response',
          });
        }

        // Get full world details
        const world = await getWorld(worldId);
        const spzUrl = getSpzUrl(world);
        const thumbnailUrl = getThumbnailUrl(world);

        let r2SplatUrl: string | null = null;

        // Backup SPZ to R2 if available
        if (spzUrl && orderId) {
          try {
            console.log(`[Reconstruct] Downloading SPZ from World Labs...`);
            const spzResponse = await fetch(spzUrl);
            const spzBuffer = await spzResponse.arrayBuffer();

            console.log(`[Reconstruct] Uploading SPZ to R2...`);
            r2SplatUrl = await uploadFile(
              tenantId,
              spzBuffer,
              UploadPaths.splat(orderId),
              'application/octet-stream'
            );

            console.log(`[Reconstruct] SPZ backed up to R2: ${r2SplatUrl}`);

            // Update order_photos with R2 URL
            if (photoId) {
              await db
                .update(orderPhotos)
                .set({ gaussianSplatUrl: r2SplatUrl })
                .where(and(
                  eq(orderPhotos.id, photoId),
                  eq(orderPhotos.tenantId, tenantId)
                ));
            }
          } catch (backupError) {
            console.error('[Reconstruct] Failed to backup to R2:', backupError);
            // Continue without R2 backup - use World Labs URL
          }
        }

        // Deduct cost from tenant budget
        const cost = 1.26; // World Labs cost per 3D reconstruction
        const newBudget = Math.max(0, budget - cost).toFixed(2);
        await db
          .update(tenants)
          .set({ aiMonthlyBudget: newBudget })
          .where(eq(tenants.id, tenantId));

        console.log(`[Reconstruct] Deducted $${cost} from tenant budget. New balance: $${newBudget}`);

        return NextResponse.json({
          success: true,
          worldId: world.world_id,
          marbleUrl: world.world_marble_url,
          spzUrl: r2SplatUrl || spzUrl,
          thumbnailUrl,
          caption: world.assets?.caption,
          backedUpToR2: !!r2SplatUrl,
          cost,
          remainingBudget: newBudget,
        });
      }

      case 'generate': {
        // Synchronous generation (waits for completion)
        let base64Data = imageBase64;

        if (!base64Data && imageUrls && imageUrls.length > 0) {
          const imageUrl = imageUrls[0];
          const imageResponse = await fetch(imageUrl);
          const imageBuffer = await imageResponse.arrayBuffer();
          base64Data = Buffer.from(imageBuffer).toString('base64');
        }

        if (!base64Data) {
          return NextResponse.json(
            { error: 'Image is required for 3D generation' },
            { status: 400 }
          );
        }

        // Get stone info if provided
        let stoneName: string | undefined;
        if (stoneId) {
          const stone = await db
            .select()
            .from(inventoryStones)
            .where(eq(inventoryStones.id, stoneId))
            .limit(1);

          if (stone.length > 0) {
            try {
              const nameObj = stone[0].name as { en?: string; zh?: string } | null;
              stoneName = nameObj?.en || nameObj?.zh || `${stone[0].brand} ${stone[0].series}`;
            } catch {
              stoneName = `${stone[0].brand} ${stone[0].series}`;
            }
          }
        }

        console.log(`[Reconstruct] Generating 3D world for ${roomType || 'room'}`);

        // Generate 3D world using World Labs (waits for completion)
        const world = await generateSceneFromPhoto(
          base64Data,
          roomType || 'kitchen',
          stoneName
        );

        // Extract URLs
        const spzUrl = getSpzUrl(world);
        const thumbnailUrl = getThumbnailUrl(world);

        let r2SplatUrl: string | null = null;

        // Backup SPZ to R2 if orderId provided
        if (spzUrl && orderId) {
          try {
            console.log(`[Reconstruct] Backing up SPZ to R2...`);
            const spzResponse = await fetch(spzUrl);
            const spzBuffer = await spzResponse.arrayBuffer();

            r2SplatUrl = await uploadFile(
              tenantId,
              spzBuffer,
              UploadPaths.splat(orderId),
              'application/octet-stream'
            );

            // Update order_photos with R2 URL
            if (photoId) {
              await db
                .update(orderPhotos)
                .set({ gaussianSplatUrl: r2SplatUrl })
                .where(and(
                  eq(orderPhotos.id, photoId),
                  eq(orderPhotos.tenantId, tenantId)
                ));
            }
          } catch (backupError) {
            console.error('[Reconstruct] Failed to backup to R2:', backupError);
          }
        }

        // Deduct cost from tenant budget
        const cost = 1.26;
        const newBudget = Math.max(0, budget - cost).toFixed(2);
        await db
          .update(tenants)
          .set({ aiMonthlyBudget: newBudget })
          .where(eq(tenants.id, tenantId));

        return NextResponse.json({
          success: true,
          worldId: world.world_id,
          marbleUrl: world.world_marble_url,
          spzUrl: r2SplatUrl || spzUrl,
          thumbnailUrl,
          caption: world.assets?.caption,
          backedUpToR2: !!r2SplatUrl,
          cost,
          remainingBudget: newBudget,
        });
      }

      case 'analyze': {
        // Simple analysis without 3D generation
        const detectedRoomType = roomType || 'other';

        return NextResponse.json({
          success: true,
          sceneData: {
            roomType: detectedRoomType,
            dimensions: {
              width: 120,
              height: 36,
              depth: 25,
            },
            lighting: 'mixed',
            style: 'modern',
          },
          message: `Detected ${detectedRoomType} scene. Ready for 3D generation.`,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "check", "start", "status", "complete", "generate", or "analyze"' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Reconstruction error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process reconstruction request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
