import { useState } from 'react';
import { Recipe } from '../types/recipe';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Clock, Users, Heart, Flame } from 'lucide-react';
import { motion } from 'motion/react';

interface RecipeCardProps {
  recipe: Recipe;
  onSelect?: (recipe: Recipe) => void;
  selectMode?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (recipe: Recipe) => void;
  onClick?: (recipe: Recipe) => void;
}

export function RecipeCard({
  recipe,
  onSelect,
  selectMode = false,
  isFavorite = false,
  onToggleFavorite,
  onClick,
}: RecipeCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-700';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'Hard':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(recipe);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow">
      <div
        className="cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="relative h-56 overflow-hidden">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <ImageWithFallback
              src={recipe.image}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
          </motion.div>
          <div className="absolute bottom-3 left-3">
            <Badge className={getDifficultyColor(recipe.difficulty)}>
              {recipe.difficulty}
            </Badge>
          </div>
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(recipe);
              }}
              className="absolute top-3 right-3 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all"
            >
              <Heart
                className={`w-5 h-5 ${
                  isFavorite ? 'fill-green-600 text-green-600' : 'text-gray-600'
                }`}
              />
            </button>
          )}
        </div>

        <CardContent className="p-5">
          <h3 className="text-xl text-gray-900 mb-2">{recipe.title}</h3>

          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {recipe.description}
          </p>

          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {recipe.prepTime + recipe.cookTime} min
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {recipe.servings} servings
            </span>
            <span className="flex items-center gap-1">
              <Flame className="w-4 h-4" />
              {recipe.calories} cal
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {recipe.dietaryTags.slice(0, 2).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs bg-green-50 text-green-700"
                >
                  {tag}
                </Badge>
              ))}
            </div>
            {selectMode && onSelect && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(recipe);
                }}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                Select
              </Button>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}