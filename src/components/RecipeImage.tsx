import React, { useState } from 'react';
import { Utensils } from 'lucide-react';

interface RecipeImageProps {
  src: string;
  alt: string;
  category?: string;
  className?: string;
}

export const RecipeImage: React.FC<RecipeImageProps> = ({
  src,
  alt,
  category,
  className = 'w-full h-full object-cover',
}) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#F3EFEA] to-[#E6DFD5] text-[#57534E] p-6 text-center ${className}`}
      >
        <Utensils className="w-8 h-8 mb-2 text-[#B93829]/70 stroke-[1.5]" />
        <span className="font-display text-sm font-medium text-[#1C1917] line-clamp-2 max-w-[20ch]">
          {alt}
        </span>
        {category && (
          <span className="text-xs text-[#78716C] mt-1">{category}</span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};
