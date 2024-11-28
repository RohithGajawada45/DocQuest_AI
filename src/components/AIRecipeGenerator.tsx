import React, { useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Recipe } from '../types/recipe';

interface Props {
  onRecipeGenerated: (recipe: Recipe) => void;
}

const API_KEY = 'bf9633bbbae842969388e98ec9cc327b';

export function AIRecipeGenerator({ onRecipeGenerated }: Props) {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAddIngredient = () => {
    if (currentIngredient.trim()) {
      setIngredients([...ingredients, currentIngredient.trim()]);
      setCurrentIngredient('');
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddIngredient();
    }
  };

  const fetchRecipeDetails = async (id: number) => {
    const response = await fetch(
      `https://api.spoonacular.com/recipes/${id}/information?apiKey=${API_KEY}`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch recipe details');
    }
    return response.json();
  };

  const handleGenerateRecipe = async () => {
    if (ingredients.length < 2) {
      toast.error('Please add at least 2 ingredients');
      return;
    }

    setIsGenerating(true);

    try {
      // First, find recipes by ingredients
      const searchResponse = await fetch(
        `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredients.join(
          ','
        )}&number=1&apiKey=${API_KEY}&ranking=2`
      );

      if (!searchResponse.ok) {
        throw new Error(
          'Failed to fetch recipe. Please check your API key or try again.'
        );
      }

      const recipes = await searchResponse.json();

      if (!recipes || recipes.length === 0) {
        toast.error('No recipes found for the given ingredients.');
        return;
      }

      // Get detailed recipe information including instructions
      const recipeDetails = await fetchRecipeDetails(recipes[0].id);

      const recipe: Recipe = {
        id: recipeDetails.id.toString(),
        title: recipeDetails.title,
        description:
          recipeDetails.summary.replace(/<[^>]*>/g, '').split('.')[0] + '.',
        image: recipeDetails.image,
        prepTime: recipeDetails.preparationMinutes || 15,
        cookTime: recipeDetails.cookingMinutes || 30,
        servings: recipeDetails.servings,
        difficulty:
          recipeDetails.difficulty ||
          getDifficulty(recipeDetails.readyInMinutes),
        ingredients: recipeDetails.extendedIngredients.map((item: any) => ({
          name: item.original,
          amount: item.amount,
          unit: item.unit,
        })),
        instructions:
          recipeDetails.analyzedInstructions[0]?.steps.map(
            (step: any) => step.step
          ) || [],
        tags: [
          ...recipeDetails.cuisines,
          ...recipeDetails.dishTypes,
          recipeDetails.vegetarian ? 'Vegetarian' : '',
          recipeDetails.vegan ? 'Vegan' : '',
        ].filter(Boolean),
        nutrition: {
          calories:
            Math.round(
              recipeDetails.nutrition?.nutrients.find(
                (n: any) => n.name === 'Calories'
              )?.amount
            ) || 0,
          protein:
            Math.round(
              recipeDetails.nutrition?.nutrients.find(
                (n: any) => n.name === 'Protein'
              )?.amount
            ) || 0,
          carbs:
            Math.round(
              recipeDetails.nutrition?.nutrients.find(
                (n: any) => n.name === 'Carbohydrates'
              )?.amount
            ) || 0,
          fat:
            Math.round(
              recipeDetails.nutrition?.nutrients.find(
                (n: any) => n.name === 'Fat'
              )?.amount
            ) || 0,
          fiber:
            Math.round(
              recipeDetails.nutrition?.nutrients.find(
                (n: any) => n.name === 'Fiber'
              )?.amount
            ) || 0,
        },
        author: {
          id: 'spoonacular',
          name: 'Spoonacular',
          email: '',
          avatar: 'https://spoonacular.com/favicon.ico',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      onRecipeGenerated(recipe);
      toast.success('Recipe generated successfully!');
      setIngredients([]); // Clear ingredients after successful generation
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate recipe. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getDifficulty = (minutes: number): 'easy' | 'medium' | 'hard' => {
    if (minutes <= 30) return 'easy';
    if (minutes <= 60) return 'medium';
    return 'hard';
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
        AI Recipe Generator
      </h2>
      <p className="text-gray-600 mb-6">
        Add your available ingredients and let AI suggest a recipe for you!
      </p>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={currentIngredient}
          onChange={(e) => setCurrentIngredient(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter an ingredient"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={handleAddIngredient}
          className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {ingredients.map((ingredient, index) => (
          <div
            key={index}
            className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full"
          >
            <span>{ingredient}</span>
            <button
              onClick={() => handleRemoveIngredient(index)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={handleGenerateRecipe}
        disabled={isGenerating || ingredients.length < 2}
        className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating Recipe...
          </>
        ) : (
          'Generate Recipe'
        )}
      </button>
    </div>
  );
}
