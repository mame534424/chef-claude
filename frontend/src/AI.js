// Vite uses import.meta.env, not process.env
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://chef-claude-production-425c.up.railway.app";

export async function getRecipeFromMistral(ingredientsArr) {
  // Validate input
  if (!ingredientsArr || !Array.isArray(ingredientsArr) || ingredientsArr.length === 0) {
    throw new Error("Please provide at least one ingredient");
  }

  try {
    console.log("Sending request to backend with ingredients:", ingredientsArr);
    
    const response = await fetch(`${BACKEND_URL}/getRecipe`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ 
        ingredients: ingredientsArr
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    return data.recipe;
  } catch (err) {
    console.error("Recipe API Error:", err);
    
    if (err.message.includes('Failed to fetch')) {
      throw new Error("Cannot connect to the recipe service. Please try again later.");
    } else {
      throw err;
    }
  }
}