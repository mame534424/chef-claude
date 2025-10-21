import express from "express";
import cors from "cors";
import { HfInference } from "@huggingface/inference";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Simple CORS
app.use(cors());
app.use(express.json());

// Test endpoint
app.get("/test", (req, res) => {
  res.json({ 
    message: "Backend is working!", 
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({ 
    status: "Recipe API is running",
    endpoints: ["/test", "/health", "/getRecipe"]
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

// Recipe endpoint
app.post("/getRecipe", async (req, res) => {
  try {
    const { ingredients } = req.body;
    
    if (!ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({ error: "Ingredients array required" });
    }

    if (!process.env.HF_ACCESS_TOKEN) {
      return res.status(500).json({ error: "API token not configured" });
    }

    const hf = new HfInference(process.env.HF_ACCESS_TOKEN);
    
    const response = await hf.chatCompletion({
      model: "mistralai/Mistral-7B-Instruct-v0.2",
      messages: [
        { 
          role: "system", 
          content: "You are a chef assistant. Create simple recipes." 
        },
        { 
          role: "user", 
          content: `I have ${ingredients.join(", ")}. Give me a simple recipe.` 
        },
      ],
      max_tokens: 500,
    });

    res.json({ 
      success: true,
      recipe: response.choices[0].message.content 
    });
    
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ 
      success: false,
      error: "Failed to generate recipe"
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});