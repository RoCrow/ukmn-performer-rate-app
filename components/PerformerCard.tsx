
import React from 'react';
import type { Performer } from '../types';
import StarRating from './StarRating';
import FeedbackTagger from './FeedbackTagger';

interface PerformerCardProps {
  performer: Performer;
  rating: number;
  onRatingChange: (rating: number) => void;
  isRated: boolean;
  selectedTags: string[];
  onFeedbackChange: (tags: string[]) => void;
}

const PerformerCard: React.FC<PerformerCardProps> = ({ performer, rating, onRatingChange, isRated, selectedTags, onFeedbackChange }) => {
  return (
    <div className={`
      bg-gray-800 rounded-lg p-4 sm:p-6 flex flex-col justify-between items-center gap-4 
      border border-gray-700 shadow-md transition-all duration-300 
      ${isRated ? 'opacity-60' : 'hover:shadow-lg hover:border-brand-primary/50'}
    `}>
        <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="text-xl font-bold text-white text-center sm:text-left">{performer.name}</h3>
            <div className="flex-shrink-0">
                <StarRating
                count={5}
                rating={rating}
                onRate={onRatingChange}
                disabled={isRated}
                />
            </div>
        </div>
        {!isRated && rating > 0 && (
            <div className="w-full pt-4 mt-4 border-t border-gray-700">
                <FeedbackTagger
                    selectedTags={selectedTags}
                    onSelectionChange={onFeedbackChange}
                />
            </div>
        )}
    </div>
  );
};

export default PerformerCard;
