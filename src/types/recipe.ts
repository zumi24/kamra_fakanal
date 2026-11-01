export type RecipeCategory =
  | 'Levesek'
  | 'Főételek'
  | 'Egytálételek'
  | 'Desszertek'
  | 'Péksütemények'
  | 'Előételek & mártások';

export interface Ingredient {
  id: string;
  amount: number;
  unit: string;
  name: string;
  note?: string;
}

export interface Recipe {
  id: string;
  title: string;
  subtitle: string;
  category: RecipeCategory;
  author: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: 'Könnyű' | 'Közepes' | 'Hagyományos';
  ovenTempCelsius?: number;
  imageUrl: string;
  isFavorite: boolean;
  familyTip: string;
  ingredients: Ingredient[];
  steps: string[];
  createdAt: string;
}

export interface WeeklyMealSlot {
  day: string;
  lunchRecipeId: string | null;
  dinnerRecipeId: string | null;
}

export interface ServerStatusInfo {
  targetPort: number;
  activePort: number;
  storagePath: string;
  recipeCount: number;
  lanHostname: string;
  platform: string;
  runtime: string;
  venvActive: boolean;
}
