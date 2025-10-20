
import React from 'react';
import type { Performer } from '../types';
import StarRating from './StarRating';

interface PerformerCardProps {
  performer: Performer;
  rating: number;
  onRatingChange: (rating: number) => void;
}

const PerformerCard: React.FC<PerformerCardProps> = ({ performer, rating, onRatingChange }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 border border-gray-700 shadow-md transition-all duration-300 hover:shadow-lg hover:border-brand-primary/50">
      <h3 className="text-xl font-bold text-white text-center sm:text-left">{performer.name}</h3>
      <div className="flex-shrink-0">
        <StarRating
          count={5}
          rating={rating}
          onRate={onRatingChange}
        />
      </div>
    </div>
  );
};

export default PerformerCard;