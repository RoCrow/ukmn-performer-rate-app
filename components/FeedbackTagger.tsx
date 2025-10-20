
import React from 'react';

const POSITIVE_TAGS = ['Great Vocals', 'Awesome Energy', 'Crowd Engagement', 'Original Songs', 'Skilled Musician'];
const CONSTRUCTIVE_TAGS = ['Low Energy', 'Sound Issues', 'Repetitive', 'Needs Practice', 'Tuning'];

interface FeedbackTaggerProps {
    selectedTags: string[];
    onSelectionChange: (tags: string[]) => void;
}

const Tag: React.FC<{label: string, isSelected: boolean, onClick: () => void, isPositive: boolean}> = ({label, isSelected, onClick, isPositive}) => {
    const baseClasses = 'px-3 py-1.5 text-sm font-medium rounded-full cursor-pointer transition-all duration-200';
    const selectedClasses = isPositive ? 'bg-emerald-500 text-white shadow-md' : 'bg-amber-500 text-white shadow-md';
    const unselectedClasses = 'bg-gray-700 text-gray-300 hover:bg-gray-600';
    
    return (
        <button onClick={onClick} className={`${baseClasses} ${isSelected ? selectedClasses : unselectedClasses}`}>
            {label}
        </button>
    )
}

const FeedbackTagger: React.FC<FeedbackTaggerProps> = ({ selectedTags, onSelectionChange }) => {

    const handleTagClick = (tag: string) => {
        const newSelection = selectedTags.includes(tag)
            ? selectedTags.filter(t => t !== tag)
            : [...selectedTags, tag];
        onSelectionChange(newSelection);
    };

    return (
        <div className="space-y-4 animate-fade-in">
             <div>
                <p className="text-sm font-semibold text-gray-400 mb-2">What did you like? (Optional)</p>
                <div className="flex flex-wrap gap-2">
                    {POSITIVE_TAGS.map(tag => (
                        <Tag
                            key={tag}
                            label={tag}
                            isSelected={selectedTags.includes(tag)}
                            onClick={() => handleTagClick(tag)}
                            isPositive={true}
                        />
                    ))}
                </div>
            </div>
             <div>
                <p className="text-sm font-semibold text-gray-400 mb-2">What could be improved? (Optional)</p>
                <div className="flex flex-wrap gap-2">
                    {CONSTRUCTIVE_TAGS.map(tag => (
                        <Tag
                            key={tag}
                            label={tag}
                            isSelected={selectedTags.includes(tag)}
                            onClick={() => handleTagClick(tag)}
                            isPositive={false}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default FeedbackTagger;
