import React from 'react';
import { Clock, Users, ChefHat } from 'lucide-react';
import type { Recipe } from '../types/recipe';

interface Props {
  recipe: Recipe;
  onClick: (id: string) => void;
}

export function RecipeCard({ recipe, onClick }: Props) {
  return (
    <div
      onClick={() => onClick(recipe.id)}
      className="group cursor-pointer bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={recipe.image}
          alt={recipe.title}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
        />
        <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded-full text-sm">
          {recipe.difficulty}
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {recipe.title}
        </h3>
        <p className="text-gray-600 text-sm line-clamp-2 mb-4">
          {recipe.description}
        </p>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{recipe.prepTime + recipe.cookTime}m</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{recipe.servings}</span>
          </div>
          <div className="flex items-center gap-1">
            <ChefHat className="w-4 h-4" />
            <span>{recipe.difficulty}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
