import type { StarCount } from '../campaign/stars';

interface StarRatingProps {
  stars: StarCount;
  label: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

const STAR_PIXELS = new Set([2, 6, 7, 8, 10, 11, 12, 13, 14, 16, 17, 18, 21, 23]);
const POSITIONS = ['left', 'center', 'right'] as const;

export function StarRating({ stars, label, className = '', size = 'small' }: StarRatingProps) {
  return (
    <div
      className={`star-rating star-rating--${size} ${className}`.trim()}
      role="img"
      aria-label={`${label}: ${stars} of 3 stars`}
    >
      {POSITIONS.map((position, index) => {
        const filled = index < stars;
        return (
          <span
            key={position}
            className={`star-rating__star star-rating__star--${position} ${
              filled ? 'star-rating__star--filled' : 'star-rating__star--empty'
            }`}
            aria-hidden="true"
          >
            {Array.from({ length: 25 }).map((_, pixel) => (
              <span
                key={pixel}
                className={`star-rating__pixel ${
                  STAR_PIXELS.has(pixel) ? 'star-rating__pixel--on' : ''
                }`}
              />
            ))}
          </span>
        );
      })}
    </div>
  );
}
