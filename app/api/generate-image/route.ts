import { NextRequest, NextResponse } from 'next/server';

/**
 * POST - Generate a stone visualization using Nano Banana Pro (Gemini 3 Pro Image Preview)
 * via Laozhang API's Google Native Format endpoint.
 * 
 * Accepts TWO reference images:
 * 1. Customer's space photo (kitchen/bathroom)
 * 2. Stone texture/slab photo
 * 
 * Generates a photorealistic rendering of the stone applied to the space.
 */

interface GenerateImageRequest {
  stoneImageUrl: string;       // URL of the stone texture image
  stoneName: string;           // Name of the stone
  stoneBrand: string;          // Brand of the stone
  spaceImageBase64?: string;   // Base64 of customer's space photo (optional)
  spaceImageUrl?: string;      // URL of customer's space photo (optional)
  designDetails?: string;      // Optional design details from conversation
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.LAOZHANG_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Image generation API key not configured' },
        { status: 503 }
      );
    }

    const body: GenerateImageRequest = await request.json();
    const { stoneImageUrl, stoneName, stoneBrand, spaceImageBase64, spaceImageUrl, designDetails } = body;

    if (!stoneImageUrl || !stoneName) {
      return NextResponse.json(
        { error: 'Stone image URL and stone name are required' },
        { status: 400 }
      );
    }

    // Build the request parts array
    const parts: Array<Record<string, unknown>> = [];
    const hasSpaceImage = spaceImageBase64 || spaceImageUrl;

    // --- Add space image (customer's kitchen/bathroom photo) ---
    if (spaceImageBase64) {
      let base64Data = spaceImageBase64;
      let mimeType = 'image/jpeg';
      if (base64Data.startsWith('data:')) {
        const match = base64Data.match(/^data:(image\/\w+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          base64Data = match[2];
        }
      }
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      });
    } else if (spaceImageUrl && !spaceImageUrl.startsWith('data:')) {
      // Use fileData for URL-based images
      parts.push({
        fileData: {
          mimeType: 'image/jpeg',
          fileUri: spaceImageUrl,
        },
      });
    }

    // --- Add stone texture image ---
    if (stoneImageUrl.startsWith('data:')) {
      // Base64 data URL
      const match = stoneImageUrl.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
      }
    } else {
      // Try to fetch the stone image and convert to base64 for reliability
      try {
        const imgResponse = await fetch(stoneImageUrl, { 
          signal: AbortSignal.timeout(15000) 
        });
        if (imgResponse.ok) {
          const arrayBuffer = await imgResponse.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64 = buffer.toString('base64');
          const contentType = imgResponse.headers.get('content-type') || 'image/jpeg';
          parts.push({
            inlineData: {
              mimeType: contentType,
              data: base64,
            },
          });
        } else {
          // Fallback: try fileData with URL
          parts.push({
            fileData: {
              mimeType: 'image/jpeg',
              fileUri: stoneImageUrl,
            },
          });
        }
      } catch (fetchErr) {
        console.error('[GenerateImage] Failed to fetch stone image, using fileData:', fetchErr);
        parts.push({
          fileData: {
            mimeType: 'image/jpeg',
            fileUri: stoneImageUrl,
          },
        });
      }
    }

    // --- Build the prompt ---
    let prompt: string;
    
    if (hasSpaceImage) {
      // Two-image mode: space photo + stone texture
      const designInstructions = designDetails 
        ? `\n\nThe customer has specified these design preferences: ${designDetails}`
        : '';

      prompt = `You are a professional interior design visualization AI. You are given two reference images:

IMAGE 1 (first image): A photograph of a real interior space (kitchen, bathroom, or other room). This is the customer's actual room that needs renovation.

IMAGE 2 (second image): A close-up photograph of a natural stone slab material called "${stoneName}" by ${stoneBrand}. This shows the exact color, veining pattern, and texture of the stone material.

YOUR TASK: Create a single photorealistic interior design visualization that shows the room from IMAGE 1 with the countertop and stone surfaces replaced by the stone material from IMAGE 2.

CRITICAL REQUIREMENTS:
1. PRESERVE the exact room layout, architecture, cabinets, appliances, windows, walls, flooring, and all non-stone elements from IMAGE 1
2. REPLACE all countertop surfaces (kitchen island, perimeter counters, vanity tops) with the stone material from IMAGE 2
3. MATCH the stone's exact color palette, veining direction, pattern scale, and surface finish from IMAGE 2
4. Apply the stone with realistic polished edges, natural reflections, and proper shadow casting
5. Maintain the same camera angle, perspective, and focal length as IMAGE 1
6. Keep the same lighting conditions but add natural stone reflections
7. The result must look like a professional architectural rendering photograph
8. Do NOT add any text, watermarks, or labels to the image${designInstructions}

Generate the image now.`;
    } else {
      // Single-image mode: only stone texture, generate a generic luxury kitchen
      prompt = `You are a professional interior design visualization AI. You are given a reference image of a natural stone slab material called "${stoneName}" by ${stoneBrand}.

YOUR TASK: Create a photorealistic interior design visualization of a modern luxury kitchen that prominently features this exact stone material as the countertop.

CRITICAL REQUIREMENTS:
1. Design a beautiful, modern kitchen with a large island and perimeter counters
2. The countertop material must EXACTLY match the color, veining pattern, and texture from the reference image
3. Show the stone on all countertop surfaces including the island and perimeter
4. Include warm, natural lighting with realistic reflections on the polished stone surface
5. Add tasteful kitchen elements: pendant lights, high-end appliances, wooden cabinets
6. Professional architectural photography style, slightly wide angle
7. The overall mood should be luxurious and inviting
8. Do NOT add any text, watermarks, or labels to the image

Generate the image now.`;
    }

    // Add the text prompt as the last part
    parts.push({ text: prompt });

    console.log('[GenerateImage] Generating with', parts.length - 1, 'images, hasSpaceImage:', !!hasSpaceImage);

    // Call Laozhang API with Google Native Format
    const response = await fetch(
      'https://api.laozhang.ai/v1beta/models/gemini-3-pro-image-preview:generateContent',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseModalities: ['IMAGE'],
            imageConfig: {
              aspectRatio: '16:9',
              imageSize: '1K',
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GenerateImage] API error:', response.status, errorText);
      return NextResponse.json(
        { error: `Image generation failed: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract the generated image from the response
    const candidate = data.candidates?.[0];
    if (!candidate?.content?.parts) {
      console.error('[GenerateImage] No image in response:', JSON.stringify(data).slice(0, 500));
      return NextResponse.json(
        { error: 'No image was generated. The AI could not process the request. Please try again.' },
        { status: 500 }
      );
    }

    // Find the image part in the response
    const imagePart = candidate.content.parts.find(
      (part: { inlineData?: { mimeType: string; data: string } }) => part.inlineData
    );

    if (!imagePart?.inlineData?.data) {
      // Check if there's a text response instead
      const textPart = candidate.content.parts.find(
        (part: { text?: string }) => part.text
      );
      if (textPart?.text) {
        console.error('[GenerateImage] Got text instead of image:', textPart.text.slice(0, 200));
      }
      return NextResponse.json(
        { error: 'Image generation did not return an image. Please try with a different prompt.' },
        { status: 500 }
      );
    }

    const imageBase64 = imagePart.inlineData.data;
    const imageMimeType = imagePart.inlineData.mimeType || 'image/png';
    const imageDataUrl = `data:${imageMimeType};base64,${imageBase64}`;

    return NextResponse.json({
      success: true,
      imageUrl: imageDataUrl,
    });
  } catch (error) {
    console.error('[GenerateImage] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image. Please try again.' },
      { status: 500 }
    );
  }
}
