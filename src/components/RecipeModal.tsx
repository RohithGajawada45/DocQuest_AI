import React from 'react';
import { X, Clock, Users, ChefHat } from 'lucide-react';
import type { Recipe } from '../types/recipe';

interface Props {
  recipe: Recipe;
  isOpen: boolean;
  onClose: () => void;
}

export function RecipeModal({ recipe, isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        <div className="relative inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <img
                src={recipe.image}
                alt={recipe.title}
                className="w-full h-64 object-cover rounded-lg"
              />
              
              <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{recipe.prepTime + recipe.cookTime}m</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{recipe.servings} servings</span>
                </div>
                <div className="flex items-center gap-1">
                  <ChefHat className="w-4 h-4" />
                  <span>{recipe.difficulty}</span>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nutrition</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Calories</div>
                    <div className="font-semibold">{recipe.nutrition.calories}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Protein</div>
                    <div className="font-semibold">{recipe.nutrition.protein}g</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Carbs</div>
                    <div className="font-semibold">{recipe.nutrition.carbs}g</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Fat</div>
                    <div className="font-semibold">{recipe.nutrition.fat}g</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{recipe.title}</h2>
              <p className="text-gray-600 mb-6">{recipe.description}</p>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ingredients</h3>
                <ul className="space-y-2">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <span className="w-16">{ingredient.amount} {ingredient.unit}</span>
                      <span>{ingredient.name}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Instructions</h3>
                <ol className="space-y-3">
                  {recipe.instructions.map((instruction, index) => (
                    <li key={index} className="flex gap-3 text-gray-700">
                      <span className="font-semibold">{index + 1}.</span>
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex flex-wrap gap-2">
                {recipe.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-sm bg-indigo-50 text-indigo-600 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t flex items-center gap-3">
                <img
                  src={recipe.author.avatar}
                  alt={recipe.author.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <div className="font-medium text-gray-900">{recipe.author.name}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(recipe.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}