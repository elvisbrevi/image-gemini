import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

// Configuration constants
const IMAGE_MODEL_NAME = "gemini-2.5-flash-image-preview";
const MAX_OUTPUT_TOKENS = 4096;
const DEFAULT_TEMPERATURE = 0.4;

// Reusable model configuration
const getImageModel = () => genAI.getGenerativeModel({ 
  model: IMAGE_MODEL_NAME,
  generationConfig: {
    temperature: DEFAULT_TEMPERATURE,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
  }
});

async function handleTextToImage(request: Request) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    const model = getImageModel();
    
    const result = await model.generateContent([prompt]);

    const response = result.response;
    const candidates = response.candidates;
    
    if (!candidates || candidates.length === 0) {
      return new Response(JSON.stringify({ error: "No candidates returned from model" }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    const parts = candidates[0].content?.parts;
    if (!parts || parts.length === 0) {
      return new Response(JSON.stringify({ error: "No parts returned from model" }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    // Find the image data in the response
    for (const part of parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || 'image/png';
        
        return new Response(JSON.stringify({ 
          success: true, 
          imageUrl: `data:${mimeType};base64,${imageData}`,
          prompt: prompt,
          mimeType: mimeType
        }), {
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
          }
        });
      }
    }

    // No image data found in any part
    return new Response(JSON.stringify({ error: "No image data found in response" }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });

  } catch (error) {
    console.error("Error generating image:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to generate image",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }
}

async function handleImageEdit(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image") as File;
    const instructions = formData.get("instructions") as string;
    
    if (!image || !instructions) {
      return new Response(JSON.stringify({ error: "Image and instructions are required" }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    const model = getImageModel();
    
    const imageBuffer = await image.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');
    
    const result = await model.generateContent([
      instructions,
      {
        inlineData: {
          data: imageBase64,
          mimeType: image.type
        }
      }
    ]);

    const response = result.response;
    const candidates = response.candidates;
    
    if (!candidates || candidates.length === 0) {
      return new Response(JSON.stringify({ error: "No candidates returned from model" }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    const parts = candidates[0].content?.parts;
    if (!parts || parts.length === 0) {
      return new Response(JSON.stringify({ error: "No parts returned from model" }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    // Find the image data in the response
    for (const part of parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || 'image/png';
        
        return new Response(JSON.stringify({ 
          success: true, 
          imageUrl: `data:${mimeType};base64,${imageData}`,
          instructions: instructions,
          mimeType: mimeType
        }), {
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
          }
        });
      }
    }

    // No image data found in any part
    return new Response(JSON.stringify({ error: "No image data found in response" }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });

  } catch (error) {
    console.error("Error editing image:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to edit image",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }
}

async function handleMultiImageComposition(request: Request) {
  try {
    const formData = await request.formData();
    const images = formData.getAll("images") as File[];
    const instructions = formData.get("instructions") as string;
    
    if (images.length === 0 || !instructions) {
      return new Response(JSON.stringify({ error: "Images and instructions are required" }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    const model = getImageModel();
    
    const imageParts = await Promise.all(
      images.map(async (image) => {
        const buffer = await image.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        return {
          inlineData: {
            data: base64,
            mimeType: image.type
          }
        };
      })
    );
    
    const result = await model.generateContent([
      instructions,
      ...imageParts
    ]);

    const response = result.response;
    const candidates = response.candidates;
    
    if (!candidates || candidates.length === 0) {
      return new Response(JSON.stringify({ error: "No candidates returned from model" }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    const parts = candidates[0].content?.parts;
    if (!parts || parts.length === 0) {
      return new Response(JSON.stringify({ error: "No parts returned from model" }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    // Find the image data in the response
    for (const part of parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || 'image/png';
        
        return new Response(JSON.stringify({ 
          success: true, 
          imageUrl: `data:${mimeType};base64,${imageData}`,
          instructions: instructions,
          imageCount: images.length,
          mimeType: mimeType
        }), {
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
          }
        });
      }
    }

    // No image data found in any part
    return new Response(JSON.stringify({ error: "No image data found in response" }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });

  } catch (error) {
    console.error("Error composing images:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to compose images",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }
}

function handleCORS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

Bun.serve({
  port: 3001,
  async fetch(request) {
    const url = new URL(request.url);
    
    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return handleCORS();
    }
    
    // Route to appropriate handlers
    if (url.pathname === "/api/text-to-image" && request.method === "POST") {
      return handleTextToImage(request);
    }
    
    if (url.pathname === "/api/image-edit" && request.method === "POST") {
      return handleImageEdit(request);
    }
    
    if (url.pathname === "/api/multi-image" && request.method === "POST") {
      return handleMultiImageComposition(request);
    }
    
    return new Response("Not Found", { status: 404 });
  },
  development: {
    console: true
  }
});

console.log("🚀 Image Generation API running on http://localhost:3001");