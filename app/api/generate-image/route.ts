import { NextRequest, NextResponse } from 'next/server';

/**
 * POST - Generate an image using Nano Banana Pro (Gemini 3 Pro Image Preview)
 * via Laozhang API's Google Native Format endpoint.
 * 
 * This renders a stone material into a customer's space photo.
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.LAOZHANG_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Image generation API key not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { prompt, referenceImageBase64 } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Build the request parts
    const parts: Array<Record<string, unknown>> = [];

    // If there's a reference image (customer's space photo), include it
    if (referenceImageBase64) {
      // Strip data URL prefix if present
      let base64Data = referenceImageBase64;
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
    }

    // Add the text prompt
    parts.push({ text: prompt });

    // Call Laozhang API with Google Native Format for custom aspect ratio
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
      console.error('[GenerateImage] No image in response:', JSON.stringify(data));
      return NextResponse.json(
        { error: 'No image was generated. Please try a different prompt.' },
        { status: 500 }
      );
    }

    // Find the image part in the response
    const imagePart = candidate.content.parts.find(
      (part: { inlineData?: { mimeType: string; data: string } }) => part.inlineData
    );

    if (!imagePart?.inlineData?.data) {
      console.error('[GenerateImage] No inlineData in response parts');
      return NextResponse.json(
        { error: 'Image generation did not return an image.' },
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
