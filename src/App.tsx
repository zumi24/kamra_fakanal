import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Heart,
  Printer,
  Clock,
  Users,
  BookOpen,
  X,
  Cpu,
} from 'lucide-react';
import {
  Recipe,
  RecipeCategory,
  ServerStatusInfo,
  WeeklyMealSlot,
} from './types/recipe';
import { INITIAL_RECIPES, RECIPE_CATEGORIES } from './data/initialRecipes';
import { RecipeImage } from './components/RecipeImage';
import { RecipeDetailModal } from './components/RecipeDetailModal';
import { RecipeFormModal } from './components/RecipeFormModal';
import { PiDeploymentView } from './components/PiDeploymentView';
import { WeeklyMealPlanner } from './components/WeeklyMealPlanner';
import { VersionModal } from './components/VersionModal';
import { APP_VERSION } from './config/version';

type ActiveTab = 'recipes' | 'favorites' | 'planner' | 'pi-setup';

export function App() {
  const [recipes, setRecipes] = useState<Recipe[]>(INITIAL_RECIPES);
  const [mealPlan, setMealPlan] = useState<WeeklyMealSlot[]>([
    { day: 'Hétfő', lunchRecipeId: 'nagymama-gulyaslevese', dinnerRecipeId: null },
    { day: 'Kedd', lunchRecipeId: 'vasarnapi-csirkepaprikas-nokedlivel', dinnerRecipeId: null },
    { day: 'Szerda', lunchRecipeId: null, dinnerRecipeId: 'bekebeli-turogomboc' },
    { day: 'Csütörtök', lunchRecipeId: 'hortobagyi-husos-palacsinta', dinnerRecipeId: null },
    { day: 'Péntek', lunchRecipeId: null, dinnerRecipeId: null },
    { day: 'Szombat', lunchRecipeId: 'nagymama-gulyaslevese', dinnerRecipeId: 'unnepi-somloi-galuska' },
    { day: 'Vasárnap', lunchRecipeId: 'vasarnapi-csirkepaprikas-nokedlivel', dinnerRecipeId: 'bekebeli-turogomboc' },
  ]);
  const [serverInfo, setServerInfo] = useState<ServerStatusInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Navigation & Filtering State
  const [activeTab, setActiveTab] = useState<ActiveTab>('recipes');
  const [selectedCategory, setSelectedCategory] = useState<RecipeCategory | 'Összes'>('Összes');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [maxTotalMinutes, setMaxTotalMinutes] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'quickest' | 'title'>('newest');

  // Modals State
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isVersionOpen, setIsVersionOpen] = useState<boolean>(false);

  // Custom user categories
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kamra_custom_categories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const allCategories = useMemo(() => {
    const set = new Set<string>(RECIPE_CATEGORIES);
    customCategories.forEach((c) => set.add(c));
    recipes.forEach((r) => {
      if (r.category) set.add(r.category);
    });
    return Array.from(set);
  }, [customCategories, recipes]);

  const handleAddCustomCategory = (newCat: string) => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    setCustomCategories((prev) => {
      if (prev.includes(trimmed)) return prev;
      const next = [...prev, trimmed];
      localStorage.setItem('kamra_custom_categories', JSON.stringify(next));
      return next;
    });
  };

  // Load initial data from backend (with fallback to initial dataset)
  useEffect(() => {
    async function fetchAll() {
      try {
        const [recipesRes, infoRes, planRes] = await Promise.all([
          fetch('/api/recipes'),
          fetch('/api/server-info'),
          fetch('/api/meal-plan'),
        ]);
        if (recipesRes.ok) {
          const data = await recipesRes.json();
          if (Array.isArray(data) && data.length > 0) {
            setRecipes(data);
            localStorage.setItem('kamra_recipes_backup', JSON.stringify(data));
          }
        }
        if (infoRes.ok) {
          setServerInfo(await infoRes.json());
        }
        if (planRes.ok) {
          setMealPlan(await planRes.json());
        }
      } catch {
        const saved = localStorage.getItem('kamra_recipes_backup');
        if (saved) {
          try {
            setRecipes(JSON.parse(saved));
          } catch {
            // Keep INITIAL_RECIPES
          }
        }
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  // Featured hero recipe (Nagymama gulyása or first favorite)
  const heroRecipe = useMemo(() => {
    return (
      recipes.find((r) => r.id === 'nagymama-gulyaslevese') ||
      recipes.find((r) => r.isFavorite) ||
      recipes[0]
    );
  }, [recipes]);

  // Filtered and sorted recipes
  const filteredRecipes = useMemo(() => {
    return recipes
      .filter((r) => {
        if (activeTab === 'favorites' && !r.isFavorite) return false;
        if (selectedCategory !== 'Összes' && r.category !== selectedCategory) return false;
        if (maxTotalMinutes !== null && r.prepTimeMinutes + r.cookTimeMinutes > maxTotalMinutes) {
          return false;
        }
        if (searchQuery.trim().length > 0) {
          const q = searchQuery.toLowerCase().trim();
          const inTitle = r.title.toLowerCase().includes(q);
          const inSubtitle = r.subtitle.toLowerCase().includes(q);
          const inAuthor = r.author.toLowerCase().includes(q);
          const inCategory = r.category.toLowerCase().includes(q);
          const inIngredients = r.ingredients.some((ing) =>
            ing.name.toLowerCase().includes(q)
          );
          return inTitle || inSubtitle || inAuthor || inCategory || inIngredients;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'quickest') {
          return a.prepTimeMinutes + a.cookTimeMinutes - (b.prepTimeMinutes + b.cookTimeMinutes);
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title, 'hu');
        }
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [recipes, activeTab, selectedCategory, maxTotalMinutes, searchQuery, sortBy]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Összes: recipes.length };
    allCategories.forEach((cat) => {
      counts[cat] = recipes.filter((r) => r.category === cat).length;
    });
    return counts;
  }, [allCategories, recipes]);

  // Handlers
  const handleToggleFavorite = async (id: string) => {
    setRecipes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isFavorite: !r.isFavorite } : r))
    );
    if (selectedRecipe?.id === id) {
      setSelectedRecipe((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null));
    }
    try {
      await fetch(`/api/recipes/${id}/favorite`, { method: 'PATCH' });
    } catch {
      // Optimistic state updated
    }
  };

  const handleSaveRecipe = async (
    recipeData: Omit<Recipe, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      const res = await fetch(`/api/recipes/${existingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipeData),
      });
      if (res.ok) {
        const updated = await res.json();
        setRecipes((prev) => prev.map((r) => (r.id === existingId ? updated : r)));
        if (selectedRecipe?.id === existingId) {
          setSelectedRecipe(updated);
        }
      }
    } else {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipeData),
      });
      if (res.ok) {
        const created = await res.json();
        setRecipes((prev) => [created, ...prev]);
        setSelectedRecipe(created);
      }
    }
    setEditingRecipe(null);
  };

  const handleDeleteRecipe = async (id: string) => {
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    setSelectedRecipe(null);
    try {
      await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
    } catch {
      // Removed locally
    }
  };

  const handleImportRecipes = async (imported: Recipe[]) => {
    const res = await fetch('/api/recipes/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipes: imported }),
    });
    if (res.ok) {
      const data = await res.json();
      setRecipes(data.recipes);
    } else {
      setRecipes(imported);
    }
  };

  const handleUpdateMealPlan = async (updated: WeeklyMealSlot[]) => {
    setMealPlan(updated);
    try {
      await fetch('/api/meal-plan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {
      // Optimistic update
    }
  };

  const handleQuickPrintRecipe = (recipe: Recipe, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRecipe(recipe);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1C1917]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="no-print sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-sm border-b border-[#E7E2DA] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark (single text element, one line) */}
          <a
            href="#receptek"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('recipes');
            }}
            className="font-display text-xl font-bold tracking-tight text-[#1C1917] whitespace-nowrap shrink-0"
          >
            Kamra &amp; Fakanál
          </a>

          {/* Zone 2: 4 concise single-line text nav links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#57534E]">
            <a
              href="#receptek"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('recipes');
              }}
              className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                activeTab === 'recipes'
                  ? 'text-[#1C1917] border-b-2 border-[#B93829]'
                  : 'hover:text-[#1C1917]'
              }`}
            >
              Receptek
            </a>
            <a
              href="#kedvencek"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('favorites');
              }}
              className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                activeTab === 'favorites'
                  ? 'text-[#1C1917] border-b-2 border-[#B93829]'
                  : 'hover:text-[#1C1917]'
              }`}
            >
              Kedvencek
            </a>
            <a
              href="#menutervezo"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('planner');
              }}
              className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                activeTab === 'planner'
                  ? 'text-[#1C1917] border-b-2 border-[#B93829]'
                  : 'hover:text-[#1C1917]'
              }`}
            >
              Menütervező
            </a>
            <a
              href="#pi-telepites"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('pi-setup');
              }}
              className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                activeTab === 'pi-setup'
                  ? 'text-[#1C1917] border-b-2 border-[#B93829]'
                  : 'hover:text-[#1C1917]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-[#B93829]" />
              Pi 4 &amp; venv
            </a>
          </nav>

          {/* Zone 3: 1 Primary Action Button */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => {
                setEditingRecipe(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium bg-[#B93829] text-white rounded-lg hover:bg-[#992B1E] transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              Új recept
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Strip */}
      <div className="no-print md:hidden flex items-center justify-around border-b border-[#E7E2DA] bg-white px-3 py-2 text-xs font-medium text-[#57534E]">
        <button
          type="button"
          onClick={() => setActiveTab('recipes')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'recipes' ? 'bg-[#FAF8F5] text-[#B93829] font-semibold' : ''
          }`}
        >
          Receptek
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('favorites')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'favorites' ? 'bg-[#FAF8F5] text-[#B93829] font-semibold' : ''
          }`}
        >
          Kedvencek
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('planner')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'planner' ? 'bg-[#FAF8F5] text-[#B93829] font-semibold' : ''
          }`}
        >
          Menütervező
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pi-setup')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'pi-setup' ? 'bg-[#FAF8F5] text-[#B93829] font-semibold' : ''
          }`}
        >
          Pi 4 &amp; venv
        </button>
      </div>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-10">
        {activeTab === 'pi-setup' ? (
          <PiDeploymentView
            recipes={recipes}
            serverInfo={serverInfo}
            onImportRecipes={handleImportRecipes}
          />
        ) : activeTab === 'planner' ? (
          <WeeklyMealPlanner
            recipes={recipes}
            mealPlan={mealPlan}
            onUpdateMealPlan={handleUpdateMealPlan}
            onSelectRecipe={(recipe) => setSelectedRecipe(recipe)}
          />
        ) : (
          <>
            {/* Editorial Split Hero Section (shown on main recipes view when not searching) */}
            {activeTab === 'recipes' && !searchQuery && selectedCategory === 'Összes' && heroRecipe && (
              <section className="no-print bg-white border border-[#E7E2DA] rounded-2xl overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
                  <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-between">
                    <div className="space-y-4">
                      {/* Unboxed static metadata */}
                      <div className="flex items-center gap-2 text-xs text-[#78716C]">
                        <span>Családi receptgyűjtemény</span>
                        <span aria-hidden="true">·</span>
                        <span>Raspberry Pi 4 (Port {serverInfo?.targetPort || 5050})</span>
                        <span aria-hidden="true">·</span>
                        <button
                          type="button"
                          onClick={() => setIsVersionOpen(true)}
                          className="font-mono-num font-semibold text-[#1C1917] hover:text-[#B93829] transition-colors cursor-pointer"
                          title="Kattints a verzió részleteihez"
                        >
                          {APP_VERSION}
                        </button>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-num">{recipes.length} recept</span>
                      </div>

                      <h1
                        className="font-display font-bold text-[#1C1917] leading-[1.15]"
                        style={{
                          fontSize: 'clamp(1.85rem, 3.2vw, 2.85rem)',
                          textWrap: 'balance',
                        }}
                      >
                        {heroRecipe.title}
                      </h1>

                      <p className="text-sm sm:text-base text-[#57534E] leading-relaxed max-w-[62ch]">
                        {heroRecipe.subtitle}
                      </p>

                      <div className="flex items-center gap-2 text-xs text-[#78716C] pt-1">
                        <span>{heroRecipe.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{heroRecipe.author}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-num">
                          {heroRecipe.prepTimeMinutes + heroRecipe.cookTimeMinutes} perc
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-num">{heroRecipe.servings} adag</span>
                      </div>
                    </div>

                    <div className="pt-8 mt-6 border-t border-[#E7E2DA] flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedRecipe(heroRecipe)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-medium bg-[#B93829] text-white rounded-lg hover:bg-[#992B1E] transition-colors whitespace-nowrap shrink-0"
                      >
                        <BookOpen className="w-4 h-4" />
                        Recept megnyitása
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleQuickPrintRecipe(heroRecipe, e)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium bg-[#FAF8F5] border border-[#E7E2DA] text-[#1C1917] rounded-lg hover:bg-[#F3EFEA] transition-colors whitespace-nowrap shrink-0"
                      >
                        <Printer className="w-4 h-4 text-[#57534E]" />
                        Nyomtatás
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('pi-setup')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium text-[#57534E] hover:text-[#1C1917] transition-colors whitespace-nowrap shrink-0"
                      >
                        Python venv &amp; Pi 4 útmutató →
                      </button>
                    </div>
                  </div>

                  <div
                    onClick={() => setSelectedRecipe(heroRecipe)}
                    className="lg:col-span-6 relative cursor-pointer overflow-hidden min-h-[280px] sm:min-h-[360px] bg-[#FAF8F5]"
                  >
                    <RecipeImage
                      src={heroRecipe.imageUrl}
                      alt={heroRecipe.title}
                      category={heroRecipe.category}
                      className="w-full h-full lg:h-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* Search & Category Filter Workspace Toolbar */}
            <section id="receptek" className="no-print space-y-4">
              <div className="bg-white border border-[#E7E2DA] rounded-xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Search input */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Keresés recept neve, hozzávaló (pl. túró, marhahús, paprika) vagy családtag alapján..."
                      className="w-full pl-10 pr-9 py-2.5 text-sm bg-[#FAF8F5] border border-[#E7E2DA] rounded-lg text-[#1C1917] placeholder:text-[#78716C] focus:outline-none focus:border-[#B93829]"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        aria-label="Keresés törlése"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C1917]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Time Filter & Sort */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <div className="flex items-center gap-1 p-1 bg-[#FAF8F5] border border-[#E7E2DA] rounded-lg">
                      <button
                        type="button"
                        onClick={() => setMaxTotalMinutes(null)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                          maxTotalMinutes === null
                            ? 'bg-white text-[#1C1917] shadow-xs'
                            : 'text-[#57534E] hover:text-[#1C1917]'
                        }`}
                      >
                        Minden idő
                      </button>
                      <button
                        type="button"
                        onClick={() => setMaxTotalMinutes(60)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                          maxTotalMinutes === 60
                            ? 'bg-white text-[#1C1917] shadow-xs'
                            : 'text-[#57534E] hover:text-[#1C1917]'
                        }`}
                      >
                        ≤ 60 perc
                      </button>
                      <button
                        type="button"
                        onClick={() => setMaxTotalMinutes(90)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                          maxTotalMinutes === 90
                            ? 'bg-white text-[#1C1917] shadow-xs'
                            : 'text-[#57534E] hover:text-[#1C1917]'
                        }`}
                      >
                        ≤ 90 perc
                      </button>
                    </div>

                    <select
                      value={sortBy}
                      onChange={(e) =>
                        setSortBy(e.target.value as 'newest' | 'quickest' | 'title')
                      }
                      aria-label="Rendezés"
                      className="px-3 py-2 text-xs font-medium bg-[#FAF8F5] border border-[#E7E2DA] rounded-lg text-[#1C1917]"
                    >
                      <option value="newest">Rendezés: Legújabb elöl</option>
                      <option value="quickest">Rendezés: Leggyorsabb elöl</option>
                      <option value="title">Rendezés: ABC sorrend (A–Z)</option>
                    </select>
                  </div>
                </div>

                {/* Interactive Category Filter Buttons */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {['Összes', ...allCategories].map((cat) => {
                    const isActive = selectedCategory === cat;
                    const count = categoryCounts[cat] ?? 0;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-[#1C1917] text-white border-[#1C1917]'
                            : 'bg-[#FAF8F5] text-[#57534E] border-[#E7E2DA] hover:text-[#1C1917] hover:bg-[#F3EFEA]'
                        }`}
                      >
                        <span>{cat}</span>
                        <span
                          className={`font-mono-num text-[11px] ${
                            isActive ? 'text-[#D6D1C7]' : 'text-[#78716C]'
                          }`}
                        >
                          ({count})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section Subheader */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-xs text-[#78716C]">
                  <span className="font-semibold text-[#1C1917]">
                    {activeTab === 'favorites' ? 'Kedvenc családi receptek' : selectedCategory}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-num">{filteredRecipes.length} találat</span>
                </div>

                {(searchQuery || selectedCategory !== 'Összes' || maxTotalMinutes !== null) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('Összes');
                      setMaxTotalMinutes(null);
                    }}
                    className="text-xs font-medium text-[#B93829] hover:underline"
                  >
                    Szűrők alaphelyzetbe állítása
                  </button>
                )}
              </div>
            </section>

            {/* Recipe Collection Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-96 rounded-xl bg-white border border-[#E7E2DA] p-4 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredRecipes.length === 0 ? (
              <div className="bg-white border border-[#E7E2DA] rounded-xl p-12 text-center max-w-lg mx-auto space-y-4">
                <h2 className="font-display text-xl font-semibold text-[#1C1917]">
                  Nincs a keresésnek megfelelő recept
                </h2>
                <p className="text-sm text-[#57534E]">
                  Próbálj más kulcsszót vagy kategóriát választani, vagy rögzíts egy új családi
                  receptet az adatbázisba.
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('Összes');
                      setMaxTotalMinutes(null);
                      setActiveTab('recipes');
                    }}
                    className="px-4 py-2 text-xs font-medium bg-[#FAF8F5] border border-[#E7E2DA] text-[#1C1917] rounded-lg hover:bg-[#F3EFEA]"
                  >
                    Összes recept mutatása
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRecipe(null);
                      setIsFormOpen(true);
                    }}
                    className="px-4 py-2 text-xs font-medium bg-[#B93829] text-white rounded-lg hover:bg-[#992B1E]"
                  >
                    + Új recept hozzáadása
                  </button>
                </div>
              </div>
            ) : (
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                {filteredRecipes.map((recipe) => {
                  const totalTime = recipe.prepTimeMinutes + recipe.cookTimeMinutes;
                  return (
                    <article
                      key={recipe.id}
                      onClick={() => setSelectedRecipe(recipe)}
                      className="group bg-white border border-[#E7E2DA] rounded-xl overflow-hidden flex flex-col cursor-pointer transition-transform duration-150 hover:-translate-y-0.5"
                    >
                      {/* 4:3 Image Container */}
                      <div className="aspect-4/3 w-full overflow-hidden bg-[#FAF8F5] relative">
                        <RecipeImage
                          src={recipe.imageUrl}
                          alt={recipe.title}
                          category={recipe.category}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      </div>

                      {/* Card Body */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          {/* Quiet 1-line unboxed metadata */}
                          <div className="flex items-center justify-between gap-2 text-xs text-[#78716C]">
                            <div className="flex items-center gap-1.5 truncate">
                              <span>{recipe.category}</span>
                              <span aria-hidden="true">·</span>
                              <span className="truncate">{recipe.author}</span>
                            </div>
                            <span className="font-mono-num shrink-0">{recipe.difficulty}</span>
                          </div>

                          <h2 className="font-display text-lg font-bold text-[#1C1917] group-hover:text-[#B93829] transition-colors line-clamp-2 leading-snug">
                            {recipe.title}
                          </h2>

                          <p className="text-xs sm:text-sm text-[#57534E] line-clamp-2 leading-relaxed">
                            {recipe.subtitle}
                          </p>
                        </div>

                        {/* Card Footer */}
                        <div className="pt-3.5 border-t border-[#F3EFEA] flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 text-xs text-[#57534E] font-mono-num">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[#78716C]" />
                              {totalTime} p
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-[#78716C]" />
                              {recipe.servings} adag
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{recipe.ingredients.length} hozzávaló</span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => handleQuickPrintRecipe(recipe, e)}
                              title="Recept nyomtatása"
                              aria-label="Recept nyomtatása"
                              className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF8F5] transition-colors"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFavorite(recipe.id);
                              }}
                              title="Kedvenc"
                              aria-label="Kedvenc"
                              className={`p-1.5 rounded-lg transition-colors ${
                                recipe.isFavorite
                                  ? 'text-[#B93829]'
                                  : 'text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF8F5]'
                              }`}
                            >
                              <Heart
                                className={`w-4 h-4 ${
                                  recipe.isFavorite ? 'fill-[#B93829]' : ''
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </section>
            )}
          </>
        )}
      </main>

      {/* Clean Footer */}
      <footer className="no-print border-t border-[#E7E2DA] bg-white mt-16 py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#78716C]">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-display font-semibold text-[#1C1917]">
              Kamra &amp; Fakanál
            </span>
            <button
              type="button"
              onClick={() => setIsVersionOpen(true)}
              className="inline-flex items-center gap-1 font-mono-num font-semibold text-[11px] text-[#57534E] hover:text-[#B93829] bg-[#FAF8F5] border border-[#E7E2DA] hover:border-[#B93829]/40 px-2 py-0.5 rounded transition-colors cursor-pointer"
              title="Kattints a verzióinformáció és változásnapló megtekintéséhez"
            >
              {APP_VERSION}
            </button>
            <span aria-hidden="true">·</span>
            <span>Családi receptadatbázis helyi hálózatra (Port {serverInfo?.targetPort || 5050})</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsVersionOpen(true)}
              className="hover:text-[#1C1917] transition-colors"
            >
              Változásnapló ({APP_VERSION})
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setActiveTab('pi-setup')}
              className="hover:text-[#1C1917] transition-colors"
            >
              Virtuális futtatás (venv) &amp; Pi 4 útmutató
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => {
                setEditingRecipe(null);
                setIsFormOpen(true);
              }}
              className="hover:text-[#1C1917] transition-colors"
            >
              Új recept felvitele
            </button>
          </div>
        </div>
      </footer>

      {/* Version & Changelog Modal */}
      {isVersionOpen && (
        <VersionModal onClose={() => setIsVersionOpen(false)} />
      )}

      {/* Recipe Detail & Print Modal */}
      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onToggleFavorite={handleToggleFavorite}
          onEdit={(recipeToEdit) => {
            setSelectedRecipe(null);
            setEditingRecipe(recipeToEdit);
            setIsFormOpen(true);
          }}
          onDelete={handleDeleteRecipe}
        />
      )}

      {/* Add / Edit Recipe Modal */}
      {isFormOpen && (
        <RecipeFormModal
          initialRecipe={editingRecipe}
          availableCategories={allCategories}
          onAddCustomCategory={handleAddCustomCategory}
          onClose={() => {
            setIsFormOpen(false);
            setEditingRecipe(null);
          }}
          onSave={handleSaveRecipe}
        />
      )}
    </div>
  );
}

export default App;
