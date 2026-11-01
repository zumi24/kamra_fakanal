import React from 'react';
import { X, Tag, Calendar, CheckCircle2 } from 'lucide-react';
import { APP_VERSION, APP_RELEASE_DATE, VERSION_HISTORY } from '../config/version';

interface VersionModalProps {
  onClose: () => void;
}

export const VersionModal: React.FC<VersionModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1917]/60 backdrop-blur-[2px] p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white border border-[#E7E2DA] rounded-xl shadow-xl overflow-hidden my-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E2DA] bg-[#FAF8F5]">
          <div className="flex items-center gap-2.5">
            <Tag className="w-4 h-4 text-[#B93829]" />
            <div>
              <h2 className="font-display text-lg font-bold text-[#1C1917]">
                Verzióinformáció &amp; Változásnapló
              </h2>
              <div className="flex items-center gap-2 text-xs text-[#78716C]">
                <span>Kamra &amp; Fakanál</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-num font-semibold text-[#B93829]">{APP_VERSION}</span>
                <span aria-hidden="true">·</span>
                <span>{APP_RELEASE_DATE}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Bezárás"
            className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1C1917] hover:bg-[#E7E2DA]/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {VERSION_HISTORY.map((item, idx) => {
            const isCurrent = idx === 0;
            return (
              <div
                key={item.version}
                className={`p-4 rounded-xl border transition-colors ${
                  isCurrent
                    ? 'bg-[#FAF8F5] border-[#D6D1C7]'
                    : 'bg-white border-[#E7E2DA]'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-num font-bold text-sm text-[#1C1917]">
                      {item.version}
                    </span>
                    {isCurrent && (
                      <span className="text-[11px] font-medium text-[#3F624D] bg-[#3F624D]/10 px-2 py-0.5 rounded">
                        Aktuális verzió
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#78716C] font-mono-num">
                    <Calendar className="w-3.5 h-3.5" />
                    {item.date}
                  </div>
                </div>

                <div className="font-medium text-xs sm:text-sm text-[#1C1917] mb-2.5">
                  {item.title}
                </div>

                <ul className="space-y-1.5">
                  {item.changes.map((change, cIdx) => (
                    <li
                      key={cIdx}
                      className="text-xs text-[#57534E] flex items-start gap-2 leading-relaxed"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#3F624D] shrink-0 mt-0.5" />
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#FAF8F5] border-t border-[#E7E2DA] flex items-center justify-between text-xs text-[#78716C]">
          <span>Minden módosításnál automatikusan növelt verziószám</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium bg-[#1C1917] text-white rounded-lg hover:bg-[#292524] transition-colors"
          >
            Rendben
          </button>
        </div>
      </div>
    </div>
  );
};
