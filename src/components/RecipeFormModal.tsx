import React, { useState, useRef } from 'react';
import { X, Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { Ingredient, Recipe, RecipeCategory } from '../types/recipe';
import { CURATED_RECIPE_IMAGES, RECIPE_CATEGORIES } from '../data/initialRecipes';
import { RecipeImage } from './RecipeImage';

interface RecipeFormModalProps {
  initialRecipe?: Recipe | null;
  availableCategories?: RecipeCategory[];
  onClose: () => void;
  onSave: (recipeData: Omit<Recipe, 'id' | 'createdAt'>, existingId?: string) => Promise<void>;
  onAddCustomCategory?: (newCategory: string) => void;
}

export const RecipeFormModal: React.FC<RecipeFormModalProps> = ({
  initialRecipe,
  availableCategories,
  onClose,
  onSave,
  onAddCustomCategory,
}) => {
  const [categoriesList, setCategoriesList] = useState<string[]>(() => {
    const base = availableCategories && availableCategories.length > 0
      ? availableCategories
      : RECIPE_CATEGORIES;
    if (initialRecipe?.category && !base.includes(initialRecipe.category)) {
      return [...base, initialRecipe.category];
    }
    return base;
  });
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [title, setTitle] = useState(initialRecipe?.title || '');
  const [subtitle, setSubtitle] = useState(initialRecipe?.subtitle || '');
  const [category, setCategory] = useState<RecipeCategory>(
    initialRecipe?.category || categoriesList[0] || 'Főételek'
  );
  const [author, setAuthor] = useState(initialRecipe?.author || 'Anya konyhája');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(
    initialRecipe?.prepTimeMinutes || 25
  );
  const [cookTimeMinutes, setCookTimeMinutes] = useState(
    initialRecipe?.cookTimeMinutes || 45
  );
  const [servings, setServings] = useState(initialRecipe?.servings || 4);
  const [difficulty, setDifficulty] = useState<'Könnyű' | 'Közepes' | 'Hagyományos'>(
    initialRecipe?.difficulty || 'Közepes'
  );
  const [ovenTempCelsius, setOvenTempCelsius] = useState<string>(
    initialRecipe?.ovenTempCelsius ? String(initialRecipe.ovenTempCelsius) : ''
  );
  const [imageUrl, setImageUrl] = useState(
    initialRecipe?.imageUrl || CURATED_RECIPE_IMAGES[0].url
  );
  const [isFavorite, setIsFavorite] = useState(initialRecipe?.isFavorite ?? false);
  const [familyTip, setFamilyTip] = useState(initialRecipe?.familyTip || '');
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initialRecipe?.ingredients && initialRecipe.ingredients.length > 0
      ? initialRecipe.ingredients
      : [
          { id: 'ing-1', amount: 500, unit: 'g', name: 'finomliszt', note: '' },
          { id: 'ing-2', amount: 2, unit: 'db', name: 'tojás', note: '' },
        ]
  );
  const [steps, setSteps] = useState<string[]>(
    initialRecipe?.steps && initialRecipe.steps.length > 0
      ? initialRecipe.steps
      : ['Az alapanyagokat kimérjük és előkészítjük.', '']
  );
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Resize uploaded photo on client so it saves cleanly inside database
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 960;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setImageUrl(dataUrl);
        }
      };
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      {
        id: `ing-${Date.now()}-${prev.length}`,
        amount: 1,
        unit: 'db',
        name: '',
        note: '',
      },
    ]);
  };

  const handleRemoveIngredient = (id: string) => {
    if (ingredients.length <= 1) return;
    setIngredients((prev) => prev.filter((item) => item.id !== id));
  };

  const handleIngredientChange = (
    id: string,
    field: keyof Ingredient,
    value: string | number
  ) => {
    setIngredients((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleAddStep = () => {
    setSteps((prev) => [...prev, '']);
  };

  const handleRemoveStep = (idx: number) => {
    if (steps.length <= 1) return;
    setSteps((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleStepChange = (idx: number, val: string) => {
    setSteps((prev) => prev.map((s, i) => (i === idx ? val : s)));
  };

  const handleCreateCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (!categoriesList.includes(trimmed)) {
      setCategoriesList((prev) => [...prev, trimmed]);
      onAddCustomCategory?.(trimmed);
    }
    setCategory(trimmed);
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Kérlek, add meg a recept nevét.');
      return;
    }
    const validIngredients = ingredients.filter((i) => i.name.trim().length > 0);
    if (validIngredients.length === 0) {
      setErrorMsg('Legalább egy hozzávalót adj meg.');
      return;
    }
    const validSteps = steps.map((s) => s.trim()).filter((s) => s.length > 0);
    if (validSteps.length === 0) {
      setErrorMsg('Legalább egy elkészítési lépést írj le.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      await onSave(
        {
          title: title.trim(),
          subtitle:
            subtitle.trim() ||
            `${category} — ${author.trim() || 'Családi'} gyűjteményéből.`,
          category,
          author: author.trim() || 'Családi recept',
          prepTimeMinutes: Math.max(1, Number(prepTimeMinutes) || 15),
          cookTimeMinutes: Math.max(0, Number(cookTimeMinutes) || 30),
          servings: Math.max(1, Number(servings) || 4),
          difficulty,
          ovenTempCelsius: ovenTempCelsius ? Number(ovenTempCelsius) : undefined,
          imageUrl: imageUrl.trim() || CURATED_RECIPE_IMAGES[0].url,
          isFavorite,
          familyTip: familyTip.trim(),
          ingredients: validIngredients,
          steps: validSteps,
        },
        initialRecipe?.id
      );
      onClose();
    } catch {
      setErrorMsg('Nem sikerült elmenteni a receptet. Próbáld újra.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1917]/60 backdrop-blur-[2px] p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#FAF8F5] border border-[#E7E2DA] rounded-xl shadow-xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#E7E2DA] shrink-0">
          <div>
            <h2 className="font-display text-xl font-bold text-[#1C1917]">
              {initialRecipe ? 'Recept szerkesztése' : 'Új családi recept rögzítése'}
            </h2>
            <p className="text-xs text-[#78716C] mt-0.5">
              A recept képpel együtt közvetlenül a szerver adatbázisába (`data/recipes.json`) kerül.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Bezárás"
            className="p-2 rounded-lg bg-white border border-[#E7E2DA] text-[#57534E] hover:text-[#1C1917]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-lg bg-[#B93829]/10 border border-[#B93829]/30 text-xs font-medium text-[#B93829]">
              {errorMsg}
            </div>
          )}

          {/* Basic Info */}
          <div className="bg-white p-5 rounded-xl border border-[#E7E2DA] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-8">
                <label className="block text-xs font-medium text-[#57534E] mb-1">
                  Recept megnevezése *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="pl. Nagymama szilvás gombóca fahéjas morzsában"
                  className="w-full px-3.5 py-2 text-sm bg-[#FAF8F5] border border-[#E7E2DA] rounded-lg focus:outline-none focus:border-[#B93829]"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-xs font-medium text-[#57534E] mb-1">
                  Kitől származik? (Szerző)
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="pl. Ilonka nagymama"
                  className="w-full px-3.5 py-2 text-sm bg-[#FAF8F5] border border-[#E7E2DA] rounded-lg focus:outline-none focus:border-[#B93829]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#57534E] mb-1">
                Rövid leírás / kedvcsináló
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="pl. Puha burgonyás tészta zamatos besztercei szilvával töltve..."
                className="w-full px-3.5 py-2 text-sm bg-[#FAF8F5] border border-[#E7E2DA] rounded-lg focus:outline-none focus:border-[#B93829]"
              />
            </div>

            {/* Category selector buttons and custom category creator */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-[#57534E]">
                  Kategória kiválasztása *
                </label>
                <span className="text-[11px] text-[#78716C]">
                  Válassz meglévőt vagy hozz létre újat
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {categoriesList.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                      category === cat
                        ? 'bg-[#B93829] text-white border-[#B93829]'
                        : 'bg-[#FAF8F5] text-[#57534E] border-[#E7E2DA] hover:text-[#1C1917]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}

                {!isAddingCategory ? (
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-dashed border-[#D6D1C7] text-[#57534E] hover:border-[#B93829] hover:text-[#B93829] bg-white transition-colors whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Saját kategória hozzáadása
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-1.5 p-1 bg-[#FAF8F5] border border-[#D6D1C7] rounded-lg">
                    <input
                      type="text"
                      autoFocus
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateCategory();
                        } else if (e.key === 'Escape') {
                          setIsAddingCategory(false);
                          setNewCategoryName('');
                        }
                      }}
                      placeholder="Új kategória neve (pl. Saláták)..."
                      className="px-2.5 py-1 text-xs bg-white border border-[#E7E2DA] rounded focus:outline-none focus:border-[#B93829] min-w-[180px]"
                    />
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      disabled={!newCategoryName.trim()}
                      className="px-2.5 py-1 text-xs font-medium bg-[#B93829] text-white rounded hover:bg-[#992B1E] disabled:opacity-50 transition-colors"
                    >
                      Hozzáadás
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCategory(false);
                        setNewCategoryName('');
                      }}
                      className="px-2 py-1 text-xs text-[#78716C] hover:text-[#1C1917]"
                    >
                      Mégse
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Numeric parameters */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-[#57534E] mb-1">
                  Előkészítés (perc)
                </label>
                <input
                  type="number"
                  min={1}
                  value={prepTimeMinutes}
                  onChange={(e) => setPrepTimeMinutes(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-sm font-mono-num bg-[#FAF8F5] border border-[#E7E2DA] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#57534E] mb-1">
                  Főzés / sütés (perc)
                </label>
                <input
                  type="number"
                  min={0}
                  value={cookTimeMinutes}
                  onChange={(e) => setCookTimeMinutes(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-sm font-mono-num bg-[#FAF8F5] border border-[#E7E2DA] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#57534E] mb-1">
                  Alap adagszám
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={servings}
                  onChange={(e) => setServings(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-sm font-mono-num bg-[#FAF8F5] border border-[#E7E2DA] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#57534E] mb-1">
                  Sütő hőfok (°C)
                </label>
                <input
                  type="number"
                  placeholder="pl. 180"
                  value={ovenTempCelsius}
                  onChange={(e) => setOvenTempCelsius(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm font-mono-num bg-[#FAF8F5] border border-[#E7E2DA] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#57534E] mb-1">
                  Nehézség
                </label>
                <select
                  value={difficulty}
                  onChange={(e) =>
                    setDifficulty(e.target.value as 'Könnyű' | 'Közepes' | 'Hagyományos')
                  }
                  className="w-full px-2.5 py-1.5 text-sm bg-[#FAF8F5] border border-[#E7E2DA] rounded-lg"
                >
                  <option value="Könnyű">Könnyű</option>
                  <option value="Közepes">Közepes</option>
                  <option value="Hagyományos">Hagyományos</option>
                </select>
              </div>
            </div>
          </div>

          {/* Photo Upload & Selection */}
          <div className="bg-white p-5 rounded-xl border border-[#E7E2DA] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-[#1C1917]">Étel fotója</h3>
                <p className="text-xs text-[#78716C]">
                  Tölts fel saját konyhai fotót (a szerver automatikusan tömörítve tárolja), vagy válassz mintaképet
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-[#1C1917] text-white rounded-lg hover:bg-[#292524] transition-colors whitespace-nowrap shrink-0"
              >
                <Upload className="w-3.5 h-3.5" />
                Saját fotó feltöltése
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <div className="sm:col-span-4 h-32 rounded-lg overflow-hidden border border-[#E7E2DA] bg-[#FAF8F5]">
                <RecipeImage
                  src={imageUrl}
                  alt={title || 'Előnézet'}
                  category={category}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="sm:col-span-8 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#57534E] mb-1">
                    Vagy válassz a beépített ételfotók közül:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {CURATED_RECIPE_IMAGES.map((preset) => (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => setImageUrl(preset.url)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded border transition-colors ${
                          imageUrl === preset.url
                            ? 'bg-[#B93829]/10 border-[#B93829] text-[#B93829] font-medium'
                            : 'bg-[#FAF8F5] border-[#E7E2DA] text-[#57534E] hover:text-[#1C1917]'
                        }`}
                      >
                        <ImageIcon className="w-3 h-3" />
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#57534E] mb-1">
                    Kép URL vagy helyi útvonal:
                  </label>
                  <input
                    type="text"
                    value={imageUrl.startsWith('data:') ? '(Saját feltöltött fotó)' : imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="/src/assets/images/..."
                    className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E7E2DA] rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Ingredients List */}
          <div className="bg-white p-5 rounded-xl border border-[#E7E2DA] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#1C1917]">
                Hozzávalók ({servings} adagra)
              </h3>
              <button
                type="button"
                onClick={handleAddIngredient}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-[#FAF8F5] border border-[#E7E2DA] rounded-lg text-[#1C1917] hover:bg-[#F3EFEA]"
              >
                <Plus className="w-3.5 h-3.5" />
                Hozzávaló sor
              </button>
            </div>

            <div className="space-y-2">
              {ingredients.map((ing) => (
                <div key={ing.id} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    type="number"
                    step="any"
                    value={ing.amount}
                    onChange={(e) =>
                      handleIngredientChange(ing.id, 'amount', parseFloat(e.target.value) || 0)
                    }
                    placeholder="Menny."
                    className="col-span-2 px-2.5 py-1.5 text-xs font-mono-num bg-[#FAF8F5] border border-[#E7E2DA] rounded-lg"
                  />
                  <input
                    type="text"
                    value={ing.unit}
                    onChange={(e) => handleIngredientChange(ing.id, 'unit', e.target.value)}
                    placeholder="g / ek / db"
                    className="col-span-2 px-2.5 py-1.5 text-xs bg-[#FAF8F5] border border-[#E7E2DA] rounded-lg"
                  />
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => handleIngredientChange(ing.id, 'name', e.target.value)}
                    placeholder="Alapanyag neve (pl. marhalábszár)"
                    className="col-span-4 px-2.5 py-1.5 text-xs bg-[#FAF8F5] border border-[#E7E2DA] rounded-lg"
                  />
                  <input
                    type="text"
                    value={ing.note || ''}
                    onChange={(e) => handleIngredientChange(ing.id, 'note', e.target.value)}
                    placeholder="Megjegyzés (pl. kockázva)"
                    className="col-span-3 px-2.5 py-1.5 text-xs bg-[#FAF8F5] border border-[#E7E2DA] rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(ing.id)}
                    className="col-span-1 flex items-center justify-center p-1.5 text-[#78716C] hover:text-[#B93829]"
                    aria-label="Sor törlése"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Preparation Steps */}
          <div className="bg-white p-5 rounded-xl border border-[#E7E2DA] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#1C1917]">Elkészítés lépései</h3>
              <button
                type="button"
                onClick={handleAddStep}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-[#FAF8F5] border border-[#E7E2DA] rounded-lg text-[#1C1917] hover:bg-[#F3EFEA]"
              >
                <Plus className="w-3.5 h-3.5" />
                Új lépés
              </button>
            </div>

            <div className="space-y-2.5">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <span className="font-mono-num text-xs font-semibold text-[#B93829] pt-2 w-6 shrink-0">
                    0{idx + 1}.
                  </span>
                  <textarea
                    rows={2}
                    value={step}
                    onChange={(e) => handleStepChange(idx, e.target.value)}
                    placeholder={`${idx + 1}. munkafázis leírása...`}
                    className="flex-1 px-3 py-2 text-xs sm:text-sm bg-[#FAF8F5] border border-[#E7E2DA] rounded-lg focus:outline-none focus:border-[#B93829]"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveStep(idx)}
                    className="p-2 text-[#78716C] hover:text-[#B93829]"
                    aria-label="Lépés törlése"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Family Tip */}
          <div className="bg-white p-5 rounded-xl border border-[#E7E2DA] space-y-3">
            <label className="block text-xs font-semibold text-[#1C1917]">
              Családi praktika / konyhai megjegyzés (opcionális)
            </label>
            <textarea
              rows={2}
              value={familyTip}
              onChange={(e) => setFamilyTip(e.target.value)}
              placeholder="pl. Nagymama mindig egy csipet szerecsendiót is reszelt bele..."
              className="w-full px-3 py-2 text-xs sm:text-sm bg-[#FAF8F5] border border-[#E7E2DA] rounded-lg focus:outline-none focus:border-[#B93829]"
            />

            <label className="inline-flex items-center gap-2 text-xs text-[#1C1917] cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
                className="rounded border-[#D6D1C7] text-[#B93829] focus:ring-[#B93829]"
              />
              Megjelölés családi kedvenc receptként
            </label>
          </div>

          {/* Submit Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium bg-white border border-[#E7E2DA] text-[#1C1917] rounded-lg hover:bg-[#F3EFEA]"
            >
              Mégse
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-medium bg-[#B93829] text-white rounded-lg hover:bg-[#992B1E] disabled:opacity-50"
            >
              {saving ? 'Mentés...' : initialRecipe ? 'Változások mentése' : 'Recept mentése'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
