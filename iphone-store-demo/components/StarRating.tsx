'use client';

import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  size?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
  testIdPrefix?: string;
}

export default function StarRating({ rating, size = 16, interactive = false, onRate, testIdPrefix }: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rating >= star;
        const halfFilled = !filled && rating >= star - 0.5;

        return (
          <button
            key={star}
            type="button"
            data-testid={testIdPrefix ? `${testIdPrefix}-${star}` : undefined}
            disabled={!interactive}
            onClick={() => interactive && onRate?.(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} relative`}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
          >
            {/* Background (empty) star */}
            <Star
              size={size}
              className="text-gray-200"
              fill="currentColor"
              strokeWidth={0}
            />
            {/* Filled overlay */}
            {(filled || halfFilled) && (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: filled ? '100%' : '50%' }}
              >
                <Star
                  size={size}
                  className="text-amber-400"
                  fill="currentColor"
                  strokeWidth={0}
                />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
