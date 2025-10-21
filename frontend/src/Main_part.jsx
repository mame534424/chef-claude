import React from "react";
import IngredientsList from "./component/IngredientsList.jsx";//component/IngredientsList.jsx

import ClaudeRecipe from "./component/ClaudeRecipe.jsx";
import { getRecipeFromMistral } from "./AI.js"

export default function Main() {
    const [ingredients, setIngredients] = React.useState(
        []
    )// use react state to keep track of some thing that can change 
    const [recipe, setRecipe] = React.useState("");

    async function getRecipe() {
        const recipeMarkdown = await getRecipeFromMistral(ingredients)
        setRecipe(recipeMarkdown)
    }

    function addIngredient(e) {
    e.preventDefault(); // prevent page reload
    const formData = new FormData(e.target);
    const newIngredient = formData.get("ingredient");
    if (!newIngredient.trim()) return; // ignore empty inputs
    setIngredients(prev => [...prev, newIngredient]);
    e.target.reset(); // clear input field
}


    return (
        <main>
            <form onSubmit={addIngredient} className="add-ingredient-form">
                <input
                    type="text"
                    placeholder="e.g. oregano"
                    aria-label="Add ingredient"
                    name="ingredient"
                />
                <button>Add ingredient</button>
            </form>
            {ingredients.length< 4 && <p>
                Enter atleast 4 ingredients to get recipe suggestions.
            </p>}

            {ingredients.length > 0 &&
                <IngredientsList
                    ingredients={ingredients}
                    getRecipe={getRecipe}
                />
            }

            {recipe && <ClaudeRecipe recipe={recipe} />}
        </main>
    )
}