import express from "express";
import cors from "cors";
import { HfInference } from "@huggingface/inference";
import dotenv from "dotenv";

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 UNCAUGHT EXCEPTION:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION at:', promise, 'reason:', reason);
  process.exit(1);
});

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001; // CHANGED TO 5001

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: false
}));// allows cross-origin requests from any front-end or back-end
app.use(express.json());// parse JSON request bodies (helps to understand json format) no helps the json foramt to change to object and can understand the text

// Request logging
app.use((req, res, next) => {
  console.log(` ${req.method} ${req.url}`);
  next();
});

// Test endpoint
app.get("/test", (req, res) => {
  console.log("✅ Test endpoint hit!");
  res.json({ 
    message: "Backend is working!", 
    timestamp: new Date().toISOString(),
    port: PORT
  });
});// help us to check whether the backend is working or not when we get that end point

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", service: "Recipe API" });
});

// Recipe endpoint
app.post("/getRecipe", async (req, res) => {
  try {
    console.log("🍳 Recipe request received");
    
    const { ingredients } = req.body;
    
    if (!ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({ error: "Ingredients array required" });
    }/**“Check if the frontend didn’t send ingredients,
OR if it sent something that isn’t an array.
If so, stop right here and send a 400 error back saying:
‘Ingredients array required’.”**/

    if (ingredients.length === 0) {
      return res.status(400).json({ error: "At least one ingredient required" });
    }

    console.log("Ingredients:", ingredients);

    if (!process.env.HF_ACCESS_TOKEN) {
      console.error("❌ HF_ACCESS_TOKEN missing");
      return res.status(500).json({ 
        error: "Server configuration error - missing API token" 
      });// check if the HF_ACCESS_TOKEN is set in the environment variables. If it’s not set, log an error message and send a 500 response back to the client indicating a server configuration error.
    }

    console.log("🔑 HF Token found, calling API...");

    const hf = new HfInference(process.env.HF_ACCESS_TOKEN);// create a connection to hugging face inference API using the provided token.
    
    const response = await hf.chatCompletion({
      model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
      messages: [
        { 
          role: "system", 
          content: "You are a chef AI assistant that suggests recipes. Respond with markdown formatting." 
        },
        { 
          role: "user", 
          content: `I have these ingredients: ${ingredients.join(", ")}. Please give me a recipe with ingredients list and instructions.` 
        },
      ],
      max_tokens: 1024,
    });

    console.log("✅ Recipe generated successfully");
    
    res.json({ 
      success: true,
      recipe: response.choices[0].message.content 
    });// extract the generated recipe from the API response and send it back to the client in JSON format.
    
  } catch (error) {
    console.error("❌ Error in /getRecipe:", error);
    
    let errorMessage = "Failed to generate recipe";
    let statusCode = 500;
    
    if (error.message.includes("token") || error.message.includes("auth")) {
      errorMessage = "Invalid API token configuration";
      statusCode = 503;
    } else if (error.message.includes("rate limit")) {
      errorMessage = "API rate limit exceeded. Please try again later.";
      statusCode = 429;
    }
    
    res.status(statusCode).json({ 
      success: false,
      error: errorMessage
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Start server
console.log("🔄 Starting server...");
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`✅ Test URL: http://localhost:${PORT}/test`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
  console.log(`🔑 HF Token configured: ${!!process.env.HF_ACCESS_TOKEN}`);
}).on('error', (error) => {
  console.error('💥 Server failed to start:', error);
});