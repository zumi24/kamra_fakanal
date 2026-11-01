import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Heart,
  Clock,
  Users,
  Minus,
  Plus,
  Check,
  Edit3,
  Trash2,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Download,
  FileText,
} from 'lucide-react';
import { Recipe } from '../types/recipe';
import { RecipeImage } from './RecipeImage';

interface RecipeDetailModalProps {
  recipe: Recipe;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onEdit: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  recipe,
  onClose,
  onToggleFavorite,
  onEdit,
  onDelete,
}) => {
  const [servings, setServings] = useState<number>(recipe.servings);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  const [isPrintPreview, setIsPrintPreview] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  // Built-in kitchen timer state
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(recipe.cookTimeMinutes * 60);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);

  useEffect(() => {
    setServings(recipe.servings);
    setCheckedIngredients({});
    setCheckedSteps({});
    setTimerSecondsLeft(recipe.cookTimeMinutes * 60);
    setTimerRunning(false);
  }, [recipe]);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setTimerSecondsLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  const scaleAmount = (amount: number): string => {
    if (!amount || recipe.servings <= 0) return '';
    const scaled = (amount * servings) / recipe.servings;
    if (Number.isInteger(scaled)) return scaled.toString();
    const rounded = Math.round(scaled * 10) / 10;
    return rounded.toString().replace('.', ',');
  };

  const formatTimer = (totalSec: number): string => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handlePrint = () => {
    setIsPrintPreview(true);
    setTimeout(() => {
      window.print();
    }, 120);
  };

  const handleDownloadPrintableHtml = () => {
    const ingredientsHtml = recipe.ingredients
      .map(
        (ing) =>
          `<li><strong>${scaleAmount(ing.amount)} ${ing.unit}</strong> ${ing.name}${
            ing.note ? ` <em>(${ing.note})</em>` : ''
          }</li>`
      )
      .join('');
    const stepsHtml = recipe.steps
      .map((step, idx) => `<li><strong>${idx + 1}. lépés:</strong> ${step}</li>`)
      .join('');

    const htmlContent = `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8" />
  <title>${recipe.title} — Nyomtatható Receptkártya</title>
  <style>
    body { font-family: Georgia, serif; color: #1C1917; max-width: 740px; margin: 32px auto; padding: 0 20px; line-height: 1.55; }
    h1 { font-size: 28px; margin-bottom: 6px; }
    .meta { font-family: sans-serif; font-size: 13px; color: #57534E; border-bottom: 1px solid #D6D1C7; padding-bottom: 12px; margin-bottom: 20px; }
    .tip { background: #FAF8F5; border: 1px solid #E7E2DA; padding: 12px 16px; margin-bottom: 24px; font-style: italic; }
    .grid { display: grid; grid-template-columns: 1fr 1.6fr; gap: 28px; }
    ul, ol { padding-left: 18px; }
    li { margin-bottom: 8px; }
    @media print { body { margin: 0; } .print-btn { display: none; } }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()" style="margin-bottom:20px;padding:8px 16px;cursor:pointer;">Nyomtatás indítása (Ctrl+P)</button>
  <h1>${recipe.title}</h1>
  <p>${recipe.subtitle}</p>
  <div class="meta">
    ${recipe.category} · Forrás: ${recipe.author} · Előkészítés: ${recipe.prepTimeMinutes} perc · Főzés: ${recipe.cookTimeMinutes} perc · ${servings} adag${recipe.ovenTempCelsius ? ` · Sütő: ${recipe.ovenTempCelsius} °C` : ''}
  </div>
  ${recipe.familyTip ? `<div class="tip"><strong>Családi praktika:</strong> ${recipe.familyTip}</div>` : ''}
  <div class="grid">
    <div>
      <h3>Hozzávalók (${servings} adagra)</h3>
      <ul>${ingredientsHtml}</ul>
    </div>
    <div>
      <h3>Elkészítés</h3>
      <ol>${stepsHtml}</ol>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recipe.id}-receptkartya.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1917]/60 backdrop-blur-[2px] p-3 sm:p-6 overflow-y-auto print:static print:bg-white print:p-0">
      <div className="relative w-full max-w-4xl bg-[#FAF8F5] border border-[#E7E2DA] rounded-xl shadow-xl overflow-hidden my-auto max-h-[92vh] flex flex-col print-container print:max-h-none">
        {/* Top Action Bar (Hidden when printing) */}
        <div className="no-print flex items-center justify-between gap-4 px-6 py-4 bg-white border-b border-[#E7E2DA] shrink-0">
          <div className="flex items-center gap-2 text-xs text-[#78716C]">
            <span className="font-medium text-[#1C1917]">{recipe.category}</span>
            <span aria-hidden="true">·</span>
            <span>{recipe.author}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num">
              Összesen {recipe.prepTimeMinutes + recipe.cookTimeMinutes} perc
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPrintPreview((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                isPrintPreview
                  ? 'bg-[#1C1917] text-white border-[#1C1917]'
                  : 'bg-white text-[#1C1917] border-[#E7E2DA] hover:bg-[#F3EFEA]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              {isPrintPreview ? 'Normál nézet' : 'A4 Nyomtatható kártya'}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-[#B93829] text-white rounded-lg hover:bg-[#992B1E] transition-colors whitespace-nowrap shrink-0"
            >
              <Printer className="w-3.5 h-3.5" />
              Nyomtatás
            </button>

            <button
              type="button"
              onClick={handleDownloadPrintableHtml}
              title="Nyomtatható receptkártya letöltése (HTML)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white text-[#1C1917] border border-[#E7E2DA] rounded-lg hover:bg-[#F3EFEA] transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Kártya mentése
            </button>

            <button
              type="button"
              onClick={() => onToggleFavorite(recipe.id)}
              aria-label="Kedvenc"
              className={`p-2 rounded-lg border transition-colors ${
                recipe.isFavorite
                  ? 'bg-[#B93829]/10 border-[#B93829]/30 text-[#B93829]'
                  : 'bg-white border-[#E7E2DA] text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              <Heart className={`w-4 h-4 ${recipe.isFavorite ? 'fill-[#B93829]' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => onEdit(recipe)}
              aria-label="Recept szerkesztése"
              className="p-2 rounded-lg bg-white border border-[#E7E2DA] text-[#57534E] hover:text-[#1C1917] hover:bg-[#F3EFEA] transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Bezárás"
              className="p-2 rounded-lg bg-white border border-[#E7E2DA] text-[#57534E] hover:text-[#1C1917] hover:bg-[#F3EFEA] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Recipe Content */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-8 print:overflow-visible print:p-0">
          {isPrintPreview ? (
            /* A4 Clean Cookbook Printable Sheet View */
            <div className="bg-white border border-[#D6D1C7] p-8 sm:p-10 rounded-lg max-w-3xl mx-auto shadow-sm print:border-none print:shadow-none print:p-0">
              <div className="border-b border-[#1C1917] pb-5 mb-6 flex items-start justify-between gap-6">
                <div>
                  <p className="text-xs text-[#57534E] mb-1">
                    Kamra &amp; Fakanál — Családi Recepttár · {recipe.category} · {recipe.author}
                  </p>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1C1917]">
                    {recipe.title}
                  </h1>
                  <p className="text-sm text-[#57534E] mt-1.5">{recipe.subtitle}</p>
                </div>
                <div className="text-right font-mono-num text-xs text-[#57534E] shrink-0 space-y-1">
                  <div>Előkészítés: {recipe.prepTimeMinutes} perc</div>
                  <div>Főzés/sütés: {recipe.cookTimeMinutes} perc</div>
                  <div className="font-semibold text-[#1C1917]">Mennyiség: {servings} adag</div>
                  {recipe.ovenTempCelsius && <div>Sütő: {recipe.ovenTempCelsius} °C</div>}
                </div>
              </div>

              {recipe.familyTip && (
                <div className="mb-6 p-4 bg-[#FAF8F5] border border-[#E7E2DA] rounded text-sm text-[#1C1917]">
                  <span className="font-semibold">Családi praktika ({recipe.author}): </span>
                  <span className="italic">{recipe.familyTip}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                <div className="md:col-span-5">
                  <h2 className="font-display text-lg font-semibold text-[#1C1917] border-b border-[#E7E2DA] pb-2 mb-3">
                    Hozzávalók ({servings} adaghoz)
                  </h2>
                  <ul className="space-y-2 text-sm">
                    {recipe.ingredients.map((ing) => (
                      <li
                        key={ing.id}
                        className="flex items-baseline justify-between gap-2 py-1 border-b border-[#F3EFEA]"
                      >
                        <span className="text-[#1C1917]">
                          {ing.name}
                          {ing.note && <span className="text-[#78716C] text-xs"> ({ing.note})</span>}
                        </span>
                        <span className="font-mono-num font-semibold text-[#1C1917] shrink-0">
                          {scaleAmount(ing.amount)} {ing.unit}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="md:col-span-7">
                  <h2 className="font-display text-lg font-semibold text-[#1C1917] border-b border-[#E7E2DA] pb-2 mb-3">
                    Elkészítés menete
                  </h2>
                  <ol className="space-y-4 text-sm text-[#1C1917]">
                    {recipe.steps.map((step, idx) => (
                      <li key={idx} className="leading-relaxed print-break-inside-avoid">
                        <span className="font-mono-num font-bold text-[#B93829] mr-2">
                          0{idx + 1}.
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          ) : (
            /* Interactive Kitchen View */
            <>
              {/* Header + Image Split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                <div className="lg:col-span-7 flex flex-col justify-between bg-white p-6 rounded-xl border border-[#E7E2DA]">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-[#78716C] mb-3">
                      <span>{recipe.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{recipe.author}</span>
                      <span aria-hidden="true">·</span>
                      <span>{recipe.difficulty}</span>
                      {recipe.ovenTempCelsius && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono-num">{recipe.ovenTempCelsius} °C</span>
                        </>
                      )}
                    </div>

                    <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1C1917] leading-tight">
                      {recipe.title}
                    </h1>

                    <p className="text-sm sm:text-base text-[#57534E] mt-3 leading-relaxed">
                      {recipe.subtitle}
                    </p>
                  </div>

                  {/* Key Metrics & Interactive Timer Bar */}
                  <div className="mt-6 pt-5 border-t border-[#E7E2DA] grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-[#78716C]">Előkészítés</div>
                      <div className="font-mono-num text-base font-semibold text-[#1C1917] mt-0.5 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#78716C]" />
                        {recipe.prepTimeMinutes} perc
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#78716C]">Főzés / sütés</div>
                      <div className="font-mono-num text-base font-semibold text-[#1C1917] mt-0.5">
                        {recipe.cookTimeMinutes} perc
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#78716C]">Konyhai időzítő</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono-num text-sm font-semibold text-[#B93829]">
                          {formatTimer(timerSecondsLeft)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setTimerRunning((r) => !r)}
                          className="p-1 rounded bg-[#FAF8F5] border border-[#E7E2DA] text-[#1C1917] hover:bg-[#F3EFEA]"
                          title={timerRunning ? 'Szünet' : 'Időzítő indítása'}
                        >
                          {timerRunning ? (
                            <Pause className="w-3.5 h-3.5" />
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTimerRunning(false);
                            setTimerSecondsLeft(recipe.cookTimeMinutes * 60);
                          }}
                          className="p-1 rounded bg-[#FAF8F5] border border-[#E7E2DA] text-[#78716C] hover:text-[#1C1917]"
                          title="Időzítő alaphelyzetbe"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 rounded-xl overflow-hidden border border-[#E7E2DA] bg-white min-h-[240px]">
                  <RecipeImage
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    category={recipe.category}
                    className="w-full h-full object-cover max-h-[320px] lg:max-h-none"
                  />
                </div>
              </div>

              {/* Family Tip Callout (Hairline border, no thick left bar) */}
              {recipe.familyTip && (
                <div className="bg-white border border-[#E7E2DA] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold text-[#B93829] mb-1">
                      Családi konyhai titok — {recipe.author}
                    </div>
                    <p className="text-sm text-[#1C1917] leading-relaxed">{recipe.familyTip}</p>
                  </div>
                </div>
              )}

              {/* Ingredients & Instructions 2-Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Ingredients + Portion Scaler */}
                <div className="lg:col-span-5 bg-white border border-[#E7E2DA] rounded-xl p-6 h-fit">
                  <div className="flex items-center justify-between gap-4 pb-4 mb-4 border-b border-[#E7E2DA]">
                    <div>
                      <h2 className="font-display text-xl font-semibold text-[#1C1917]">
                        Hozzávalók
                      </h2>
                      <p className="text-xs text-[#78716C] mt-0.5">
                        Kattints a sorokra az előkészítés pipálásához
                      </p>
                    </div>

                    {/* Portion Calculator */}
                    <div className="flex items-center gap-2 bg-[#FAF8F5] border border-[#E7E2DA] rounded-lg px-2.5 py-1.5">
                      <Users className="w-3.5 h-3.5 text-[#78716C]" />
                      <button
                        type="button"
                        onClick={() => setServings((s) => Math.max(1, s - 1))}
                        className="w-6 h-6 flex items-center justify-center rounded bg-white border border-[#E7E2DA] text-[#1C1917] hover:bg-[#F3EFEA]"
                        aria-label="Kevesebb adag"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono-num text-xs font-semibold text-[#1C1917] min-w-[48px] text-center">
                        {servings} adag
                      </span>
                      <button
                        type="button"
                        onClick={() => setServings((s) => Math.min(30, s + 1))}
                        className="w-6 h-6 flex items-center justify-center rounded bg-white border border-[#E7E2DA] text-[#1C1917] hover:bg-[#F3EFEA]"
                        aria-label="Több adag"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <ul className="divide-y divide-[#F3EFEA]">
                    {recipe.ingredients.map((ing) => {
                      const isChecked = Boolean(checkedIngredients[ing.id]);
                      return (
                        <li key={ing.id}>
                          <button
                            type="button"
                            onClick={() =>
                              setCheckedIngredients((prev) => ({
                                ...prev,
                                [ing.id]: !prev[ing.id],
                              }))
                            }
                            className="w-full py-2.5 flex items-start justify-between gap-3 text-left group"
                          >
                            <div className="flex items-start gap-2.5">
                              <span
                                className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                                  isChecked
                                    ? 'bg-[#3F624D] border-[#3F624D] text-white'
                                    : 'border-[#D6D1C7] bg-white group-hover:border-[#1C1917]'
                                }`}
                              >
                                {isChecked && <Check className="w-3 h-3" />}
                              </span>
                              <span
                                className={`text-sm transition-colors ${
                                  isChecked ? 'line-through text-[#A8A29E]' : 'text-[#1C1917]'
                                }`}
                              >
                                {ing.name}
                                {ing.note && (
                                  <span className="block text-xs text-[#78716C]">{ing.note}</span>
                                )}
                              </span>
                            </div>
                            <span
                              className={`font-mono-num text-sm font-medium shrink-0 ${
                                isChecked ? 'line-through text-[#A8A29E]' : 'text-[#1C1917]'
                              }`}
                            >
                              {scaleAmount(ing.amount)} {ing.unit}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Right Column: Step-by-Step Instructions */}
                <div className="lg:col-span-7 bg-white border border-[#E7E2DA] rounded-xl p-6">
                  <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#E7E2DA]">
                    <div>
                      <h2 className="font-display text-xl font-semibold text-[#1C1917]">
                        Elkészítés lépésről lépésre
                      </h2>
                      <p className="text-xs text-[#78716C] mt-0.5">
                        Jelöld meg az elkészült munkafázisokat főzés közben
                      </p>
                    </div>
                    <span className="font-mono-num text-xs text-[#78716C]">
                      {Object.values(checkedSteps).filter(Boolean).length} / {recipe.steps.length} kész
                    </span>
                  </div>

                  <ol className="space-y-4">
                    {recipe.steps.map((step, idx) => {
                      const isDone = Boolean(checkedSteps[idx]);
                      return (
                        <li key={idx}>
                          <button
                            type="button"
                            onClick={() =>
                              setCheckedSteps((prev) => ({
                                ...prev,
                                [idx]: !prev[idx],
                              }))
                            }
                            className={`w-full text-left p-4 rounded-xl border transition-colors flex items-start gap-4 ${
                              isDone
                                ? 'bg-[#FAF8F5] border-[#E7E2DA] text-[#78716C]'
                                : 'bg-white border-[#E7E2DA] hover:border-[#D6D1C7] text-[#1C1917]'
                            }`}
                          >
                            <span
                              className={`font-mono-num text-xs font-semibold px-2 py-1 rounded border shrink-0 ${
                                isDone
                                  ? 'bg-[#3F624D] border-[#3F624D] text-white'
                                  : 'bg-[#FAF8F5] border-[#E7E2DA] text-[#B93829]'
                              }`}
                            >
                              0{idx + 1}
                            </span>
                            <p
                              className={`text-sm sm:text-base leading-relaxed ${
                                isDone ? 'line-through text-[#78716C]' : 'text-[#1C1917]'
                              }`}
                            >
                              {step}
                            </p>
                          </button>
                        </li>
                      );
                    })}
                  </ol>

                  {/* Bottom Delete / Edit Controls */}
                  <div className="no-print mt-8 pt-5 border-t border-[#E7E2DA] flex items-center justify-between">
                    <span className="text-xs text-[#78716C]">
                      Hozzáadva: <span className="font-mono-num">{recipe.createdAt}</span>
                    </span>

                    {!confirmDelete ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="inline-flex items-center gap-1.5 text-xs text-[#78716C] hover:text-[#B93829] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Recept törlése
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#B93829] font-medium">Biztosan törlöd?</span>
                        <button
                          type="button"
                          onClick={() => onDelete(recipe.id)}
                          className="px-2.5 py-1 text-xs font-medium bg-[#B93829] text-white rounded hover:bg-[#992B1E]"
                        >
                          Igen, törlés
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(false)}
                          className="px-2.5 py-1 text-xs font-medium bg-[#FAF8F5] border border-[#E7E2DA] rounded text-[#1C1917]"
                        >
                          Mégse
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
