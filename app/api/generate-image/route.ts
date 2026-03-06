import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60s for image generation

/**
 * POST - Generate a stone visualization using Google Gemini API (Nano Banana 2)
 * Model: gemini-3.1-flash-image-preview
 * Endpoint: https://generativelanguage.googleapis.com/v1beta/models/...
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
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google AI API key not configured' },
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

    console.log('[GenerateImage] Starting generation for:', stoneName, 'by', stoneBrand);
    console.log('[GenerateImage] Has space image:', !!(spaceImageBase64 || spaceImageUrl));

    // Build the parts array for the Gemini API request
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
      if (base64Data.length < 100) {
        console.error('[GenerateImage] Space image base64 data too short:', base64Data.length);
        return NextResponse.json(
          { error: 'Invalid space image data. Please try uploading again.' },
          { status: 400 }
        );
      }
      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: base64Data,
        },
      });
      console.log('[GenerateImage] Added space image (inline base64), size:', Math.round(base64Data.length / 1024), 'KB');
    } else if (spaceImageUrl && !spaceImageUrl.startsWith('data:')) {
      // Fetch and convert to base64
      try {
        const imgResponse = await fetch(spaceImageUrl, { signal: AbortSignal.timeout(15000) });
        if (imgResponse.ok) {
          const arrayBuffer = await imgResponse.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          const contentType = imgResponse.headers.get('content-type') || 'image/jpeg';
          parts.push({
            inline_data: {
              mime_type: contentType,
              data: base64,
            },
          });
          console.log('[GenerateImage] Added space image (fetched URL), size:', Math.round(base64.length / 1024), 'KB');
        }
      } catch (err) {
        console.error('[GenerateImage] Failed to fetch space image URL:', err);
      }
    }

    // --- Add stone texture image ---
    if (stoneImageUrl.startsWith('data:')) {
      const match = stoneImageUrl.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        parts.push({
          inline_data: {
            mime_type: match[1],
            data: match[2],
          },
        });
        console.log('[GenerateImage] Added stone image (inline base64)');
      }
    } else {
      // Fetch the stone image and convert to base64
      try {
        const imgResponse = await fetch(stoneImageUrl, { signal: AbortSignal.timeout(15000) });
        if (imgResponse.ok) {
          const arrayBuffer = await imgResponse.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          const contentType = imgResponse.headers.get('content-type') || 'image/jpeg';
          parts.push({
            inline_data: {
              mime_type: contentType,
              data: base64,
            },
          });
          console.log('[GenerateImage] Added stone image (fetched), size:', Math.round(base64.length / 1024), 'KB');
        } else {
          console.error('[GenerateImage] Failed to fetch stone image:', imgResponse.status);
          return NextResponse.json(
            { error: 'Could not load stone image. Please try again.' },
            { status: 400 }
          );
        }
      } catch (fetchErr) {
        console.error('[GenerateImage] Failed to fetch stone image:', fetchErr);
        return NextResponse.json(
          { error: 'Could not load stone image. Please try again.' },
          { status: 400 }
        );
      }
    }

    // --- Build the prompt ---
    let prompt: string;

    if (hasSpaceImage) {
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

    console.log('[GenerateImage] Sending request to Google Gemini API with', parts.length - 1, 'images');

    // Call Google Gemini API directly
    const model = 'gemini-3.1-flash-image-preview';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseModalities: ['IMAGE', 'TEXT'],
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GenerateImage] Google API error:', response.status, errorText.slice(0, 500));

      // Parse error details if possible
      let errorMessage = `Image generation failed (HTTP ${response.status}).`;
      try {
        const errorJson = JSON.parse(errorText);
        const detail = errorJson?.error?.message;
        if (detail) errorMessage = detail;
      } catch {
        // ignore parse error
      }

      return NextResponse.json(
        { error: errorMessage + ' Please try again.' },
        { status: 502 }
      );
    }

    const data = await response.json();

    // Extract the generated image from the response
    const candidate = data.candidates?.[0];
    if (!candidate?.content?.parts) {
      console.error('[GenerateImage] No content in response:', JSON.stringify(data).slice(0, 500));

      if (candidate?.finishReason === 'SAFETY' || data.promptFeedback?.blockReason) {
        return NextResponse.json(
          { error: 'The image could not be generated due to content safety filters. Please try with a different photo.' },
          { status: 422 }
        );
      }

      return NextResponse.json(
        { error: 'No image was generated. Please try again.' },
        { status: 500 }
      );
    }

    // Find the image part in the response (Google uses inline_data or inlineData)
    const imagePart = candidate.content.parts.find(
      (part: Record<string, unknown>) => part.inline_data || part.inlineData
    );

    const imageData = imagePart?.inline_data || imagePart?.inlineData;

    if (!imageData?.data) {
      const textPart = candidate.content.parts.find(
        (part: Record<string, unknown>) => part.text
      );
      if (textPart?.text) {
        console.error('[GenerateImage] Got text instead of image:', String(textPart.text).slice(0, 200));
      }
      console.error('[GenerateImage] Full response parts:', JSON.stringify(candidate.content.parts).slice(0, 500));
      return NextResponse.json(
        { error: 'Image generation did not return an image. Please try again.' },
        { status: 500 }
      );
    }

    const imageBase64 = imageData.data as string;
    const imageMimeType = (imageData.mime_type || imageData.mimeType || 'image/png') as string;
    const imageDataUrl = `data:${imageMimeType};base64,${imageBase64}`;

    console.log('[GenerateImage] Success! Generated image size:', Math.round(imageBase64.length / 1024), 'KB');

    return NextResponse.json({
      success: true,
      imageUrl: imageDataUrl,
    });
  } catch (error) {
    console.error('[GenerateImage] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image. Please try again.' },
      { status: 500 }
    );
  }
}
