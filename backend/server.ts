import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

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

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });
    
    const result = await model.generateContent([prompt]);

    const response = result.response;
    const imageData = response.candidates?.[0]?.content?.parts?.[0];
    
    if (!imageData) {
      return new Response(JSON.stringify({ error: "Failed to generate image" }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      imageData: imageData,
      prompt: prompt
    }), {
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

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });
    
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
    const imageData = response.candidates?.[0]?.content?.parts?.[0];
    
    return new Response(JSON.stringify({ 
      success: true, 
      imageData: imageData,
      instructions: instructions
    }), {
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

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });
    
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
    const imageData = response.candidates?.[0]?.content?.parts?.[0];
    
    return new Response(JSON.stringify({ 
      success: true, 
      imageData: imageData,
      instructions: instructions
    }), {
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