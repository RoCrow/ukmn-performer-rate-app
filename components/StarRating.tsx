import React, { useState } from 'react';

interface StarRatingProps {
  count: number;
  rating: number;
  onRate: (rating: number) => void;
  disabled?: boolean;
}

const StarIcon: React.FC<{filled: boolean; className?: string}> = ({filled, className}) => (
    <svg 
        className={`w-8 h-8 ${className} ${filled ? 'text-brand-accent' : 'text-gray-600'}`} 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor"
    >
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
);


const StarRating: React.FC<StarRatingProps> = ({ count, rating, onRate, disabled = false }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const stars = Array.from({ length: count }, (_, i) => i + 1);

  return (
    <div className={`flex items-center space-x-1 ${disabled ? 'cursor-not-allowed' : ''}`}>
      {stars.map((starValue) => (
        <button
          key={starValue}
          onMouseEnter={!disabled ? () => setHoverRating(starValue) : undefined}
          onMouseLeave={!disabled ? () => setHoverRating(0) : undefined}
          onClick={!disabled ? () => onRate(starValue) : undefined}
          aria-label={disabled ? `Rated ${rating} out of ${count} stars` : `Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
          className={`transition-transform duration-200 ease-in-out ${!disabled ? 'hover:scale-125' : ''} focus:outline-none focus:ring-2 focus:ring-brand-accent rounded-full`}
          disabled={disabled}
        >
          <StarIcon 
            filled={(hoverRating || rating) >= starValue} 
            className={disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
          />
        </button>
      ))}
    </div>
  );
};

export default StarRating;