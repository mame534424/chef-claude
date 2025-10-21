const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";
export async function getRecipeFromMistral(ingredientsArr) {
  // Validate input
  if (!ingredientsArr || !Array.isArray(ingredientsArr) || ingredientsArr.length === 0) {
    throw new Error("Please provide at least one ingredient");
  }

  try {
    console.log("Sending request to backend with ingredients:", ingredientsArr);
    
    const response = await fetch(`${BACKEND_URL}/getRecipe`, { // CHANGED TO 5001
      method: "POST",
      headers: { 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ 
        ingredients: ingredientsArr // because backend only understand json format in fetch but we can use also axios 
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
      throw new Error("Cannot connect to server. Make sure the backend is running on port 5001");
    } else {
      throw err;
    }
  }
}