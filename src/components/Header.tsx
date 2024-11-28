import React from 'react';
import { Search, Menu, ChefHat } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <ChefHat className="w-8 h-8 text-indigo-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">RecipeIdeas</span>
          </div>

          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search recipes, ingredients, or tags..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-gray-500 hover:text-gray-700">
              Sign In
            </button>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 transition-colors">
              Create Recipe
            </button>
            <button className="lg:hidden">
              <Menu className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}