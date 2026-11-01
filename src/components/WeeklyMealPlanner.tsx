import React from 'react';
import { Printer, ShoppingBasket, RotateCcw, BookOpen } from 'lucide-react';
import { Recipe, WeeklyMealSlot } from '../types/recipe';

interface WeeklyMealPlannerProps {
  recipes: Recipe[];
  mealPlan: WeeklyMealSlot[];
  onUpdateMealPlan: (updated: WeeklyMealSlot[]) => void;
  onSelectRecipe: (recipe: Recipe) => void;
}

export const WeeklyMealPlanner: React.FC<WeeklyMealPlannerProps> = ({
  recipes,
  mealPlan,
  onUpdateMealPlan,
  onSelectRecipe,
}) => {
  const handleSlotChange = (
    dayIndex: number,
    slotType: 'lunchRecipeId' | 'dinnerRecipeId',
    recipeId: string
  ) => {
    const next = mealPlan.map((slot, idx) =>
      idx === dayIndex ? { ...slot, [slotType]: recipeId || null } : slot
    );
    onUpdateMealPlan(next);
  };

  const handleClearAll = () => {
    const cleared = mealPlan.map((slot) => ({
      ...slot,
      lunchRecipeId: null,
      dinnerRecipeId: null,
    }));
    onUpdateMealPlan(cleared);
  };

  // Aggregate ingredients across all scheduled recipes
  const aggregatedShoppingList = React.useMemo(() => {
    const map = new Map<string, { name: string; unit: string; amount: number }>();

    mealPlan.forEach((slot) => {
      [slot.lunchRecipeId, slot.dinnerRecipeId].forEach((id) => {
        if (!id) return;
        const found = recipes.find((r) => r.id === id);
        if (!found) return;
        found.ingredients.forEach((ing) => {
          const key = `${ing.name.toLowerCase().trim()}__${ing.unit.toLowerCase().trim()}`;
          const existing = map.get(key);
          if (existing) {
            existing.amount += Number(ing.amount) || 0;
          } else {
            map.set(key, {
              name: ing.name,
              unit: ing.unit,
              amount: Number(ing.amount) || 0,
            });
          }
        });
      });
    });

    return Array.from(map.values());
  }, [mealPlan, recipes]);

  return (
    <div className="space-y-8">
      <div className="bg-white border border-[#E7E2DA] rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-[#78716C] mb-1">
            Családi heti étlap és összesített bevásárlólista
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1C1917]">
            Heti Családi Menütervező
          </h1>
          <p className="text-sm text-[#57534E] mt-1">
            Állítsd össze a hét ebédjeit és vacsoráit a családi recepttárból — a rendszer automatikusan
            összesíti a szükséges alapanyagokat.
          </p>
        </div>

        <div className="no-print flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-[#FAF8F5] border border-[#E7E2DA] text-[#57534E] rounded-lg hover:text-[#1C1917] transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Terv ürítése
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#B93829] text-white rounded-lg hover:bg-[#992B1E] transition-colors whitespace-nowrap shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            Menü &amp; lista nyomtatása
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 7-day table */}
        <div className="lg:col-span-7 bg-white border border-[#E7E2DA] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E7E2DA] flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-[#1C1917]">
              Hétfőtől Vasárnapig
            </h2>
            <span className="text-xs text-[#78716C]">Automatikus mentés a szerverre</span>
          </div>

          <div className="divide-y divide-[#E7E2DA]">
            {mealPlan.map((slot, idx) => {
              const lunchRecipe = recipes.find((r) => r.id === slot.lunchRecipeId);
              const dinnerRecipe = recipes.find((r) => r.id === slot.dinnerRecipeId);

              return (
                <div
                  key={slot.day}
                  className="p-4 sm:px-6 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                >
                  <div className="sm:col-span-3 font-display font-semibold text-[#1C1917]">
                    {slot.day}
                  </div>

                  {/* Lunch selector */}
                  <div className="sm:col-span-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#78716C]">Ebéd</span>
                      {lunchRecipe && (
                        <button
                          type="button"
                          onClick={() => onSelectRecipe(lunchRecipe)}
                          className="no-print inline-flex items-center gap-1 text-[11px] text-[#B93829] hover:underline"
                        >
                          <BookOpen className="w-3 h-3" />
                          Megnyitás
                        </button>
                      )}
                    </div>
                    <select
                      value={slot.lunchRecipeId || ''}
                      onChange={(e) => handleSlotChange(idx, 'lunchRecipeId', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-[#FAF8F5] border border-[#E7E2DA] rounded-lg text-[#1C1917]"
                    >
                      <option value="">— Nincs kiválasztva —</option>
                      {recipes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dinner selector */}
                  <div className="sm:col-span-5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#78716C]">Vacsora / Desszert</span>
                      {dinnerRecipe && (
                        <button
                          type="button"
                          onClick={() => onSelectRecipe(dinnerRecipe)}
                          className="no-print inline-flex items-center gap-1 text-[11px] text-[#B93829] hover:underline"
                        >
                          <BookOpen className="w-3 h-3" />
                          Megnyitás
                        </button>
                      )}
                    </div>
                    <select
                      value={slot.dinnerRecipeId || ''}
                      onChange={(e) => handleSlotChange(idx, 'dinnerRecipeId', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-[#FAF8F5] border border-[#E7E2DA] rounded-lg text-[#1C1917]"
                    >
                      <option value="">— Nincs kiválasztva —</option>
                      {recipes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Consolidated Shopping List */}
        <div className="lg:col-span-5 bg-white border border-[#E7E2DA] rounded-xl p-6 h-fit">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E7E2DA]">
            <div className="flex items-center gap-2">
              <ShoppingBasket className="w-4 h-4 text-[#B93829]" />
              <h2 className="font-display text-lg font-semibold text-[#1C1917]">
                Összesített Bevásárlólista
              </h2>
            </div>
            <span className="font-mono-num text-xs text-[#78716C]">
              {aggregatedShoppingList.length} tétel
            </span>
          </div>

          {aggregatedShoppingList.length === 0 ? (
            <p className="text-xs text-[#78716C] py-6 text-center">
              Válassz ki legalább egy receptet a heti menüben a bevásárlólista összeállításához.
            </p>
          ) : (
            <ul className="divide-y divide-[#F3EFEA]">
              {aggregatedShoppingList.map((item, idx) => (
                <li
                  key={idx}
                  className="py-2 flex items-baseline justify-between gap-3 text-xs sm:text-sm"
                >
                  <span className="text-[#1C1917]">{item.name}</span>
                  <span className="font-mono-num font-semibold text-[#1C1917] shrink-0">
                    {Math.round(item.amount * 10) / 10} {item.unit}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
