
import React, { useState, Fragment } from 'react';
import type { Performer } from '../types.ts';
import StarRating from './StarRating.tsx';
import FeedbackTagger from './FeedbackTagger.tsx';
import { getFeedbackSummary } from '../services/performerService.ts';
import HypeMeter from './HypeMeter.tsx';

interface PerformerCardProps {
  performer: Performer;
  rating: number;
  onRatingChange: (rating: number) => void;
  isRated: boolean;
  selectedTags: string[];
  onFeedbackChange: (tags: string[]) => void;
  comment: string;
  onCommentChange: (comment: string) => void;
  ratingCount: number;
  commentCount: number;
  maxRatingCount: number;
  positiveTags: string[];
  constructiveTags: string[];
  venueName: string;
}

const WandIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38zM12 4.59L7.545 11H10v3.41L14.455 8H12V4.59z" clipRule="evenodd" />
    </svg>
);


const ExternalLinkIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
);

const ChevronDownIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
);

const PerformerCard: React.FC<PerformerCardProps> = ({ 
    performer, 
    rating, 
    onRatingChange, 
    isRated, 
    selectedTags, 
    onFeedbackChange,
    comment,
    onCommentChange, 
    ratingCount,
    commentCount,
    maxRatingCount,
    positiveTags,
    constructiveTags,
    venueName
}) => {
  const [isBioVisible, setIsBioVisible] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummaryVisible, setIsSummaryVisible] = useState<boolean>(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const handleAnalyzeFeedback = async () => {
    setIsSummaryLoading(true);
    setSummaryError(null);
    setSummary(null);
    try {
        const result = await getFeedbackSummary(performer.id, venueName);
        setSummary(result);
        setIsSummaryVisible(true); // Show summary on successful fetch
    } catch(err) {
        const message = err instanceof Error ? err.message : "An unknown error occurred.";
        setSummaryError(`Could not generate summary: ${message}`);
    } finally {
        setIsSummaryLoading(false);
    }
  };
  
  const handleSummaryToggle = () => {
    // If we have a summary, just toggle visibility
    if (summary) {
      setIsSummaryVisible(!isSummaryVisible);
    } 
    // Otherwise, if not loading and can analyze, fetch it
    else if (!isSummaryLoading && canAnalyze) {
      handleAnalyzeFeedback();
    }
 };

  const canAnalyze = commentCount > 1;

  return (
    <div className={`
      bg-gray-800 rounded-lg p-4 sm:p-6 flex flex-col items-center gap-4 
      border border-gray-700 shadow-md transition-all duration-300 
      ${isRated ? 'opacity-60' : 'hover:shadow-lg hover:border-brand-primary/50'}
    `}>
        <div className="w-full flex flex-col gap-3">
            {/* Top part with name and stars */}
            <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4">
                <div className="flex-grow text-center sm:text-left">
                    <h3 className="text-xl font-bold text-white">{performer.name}</h3>
                    {(performer.bio || performer.socialLink) && (
                        <div className="mt-4 text-sm">
                            {performer.bio && (
                                <>
                                    <button 
                                        onClick={() => setIsBioVisible(!isBioVisible)}
                                        className="text-gray-400 hover:text-white transition-colors"
                                        aria-expanded={isBioVisible}
                                    >
                                        {isBioVisible ? 'Hide Bio' : 'Show Bio'}
                                    </button>
                                    {performer.socialLink && <span className="text-gray-600 mx-2">|</span>}
                                </>
                            )}
                            {performer.socialLink && (
                                <a 
                                    href={performer.socialLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline"
                                >
                                    Socials <ExternalLinkIcon />
                                </a>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex-shrink-0">
                    <StarRating
                    count={5}
                    rating={rating}
                    onRate={onRatingChange}
                    disabled={isRated}
                    />
                </div>
            </div>
            
            {/* Hype Meter below, taking full width */}
            <div className="w-full">
                <HypeMeter count={ratingCount} maxCount={maxRatingCount} />
            </div>
        </div>
        
         {isBioVisible && performer.bio && (
             <div className="w-full pt-4 mt-4 border-t border-gray-700 animate-fade-in">
                <p className="text-gray-300 whitespace-pre-wrap">{performer.bio}</p>
             </div>
        )}
        
        <div className="w-full">
            {!isRated && rating > 0 && (
                <div className="w-full pt-4 mt-4 border-t border-gray-700 space-y-4">
                    <FeedbackTagger
                        selectedTags={selectedTags}
                        onSelectionChange={onFeedbackChange}
                        positiveTags={positiveTags}
                        constructiveTags={constructiveTags}
                    />
                    <div>
                        <label htmlFor={`comment-${performer.id}`} className="text-sm font-semibold text-gray-400 mb-2 block">Add a comment (optional)</label>
                        <textarea
                            id={`comment-${performer.id}`}
                            value={comment}
                            onChange={(e) => onCommentChange(e.target.value)}
                            placeholder="Specific feedback for the performer..."
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            rows={2}
                        ></textarea>
                    </div>
                </div>
            )}
            
            {(ratingCount > 0 || commentCount > 0) && (
                <div className="w-full pt-4 mt-4 border-t border-gray-700">
                    <button
                        onClick={handleSummaryToggle}
                        disabled={isSummaryLoading || !canAnalyze}
                        title={!canAnalyze ? 'At least two comments are required to generate an AI summary.' : 'Generate an AI-powered summary of feedback'}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-gray-700/80 text-brand-accent rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isSummaryLoading ? (
                            <Fragment>
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-brand-accent"></div>
                                Analyzing...
                            </Fragment>
                        ) : !canAnalyze ? (
                            commentCount === 1 ? '1 more comment needed to analyze' : 'Waiting for comments to analyze'
                        ) : summary ? (
                            <Fragment>
                                {isSummaryVisible ? 'Hide Summary' : 'Show Summary'}
                                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isSummaryVisible ? 'rotate-180' : ''}`} />
                            </Fragment>
                        ) : (
                            <Fragment>
                                <WandIcon className="w-4 h-4" />
                                Feedback Summary ({commentCount} comments)
                            </Fragment>
                        )}
                    </button>
                    
                    {summaryError && (
                        <p className="mt-3 text-center text-sm text-red-400 bg-red-900/30 p-2 rounded-md">{summaryError}</p>
                    )}

                    {isSummaryVisible && summary && (
                        <div className="mt-4 p-4 bg-gray-900/50 rounded-lg animate-fade-in">
                            <h4 className="font-bold text-brand-accent mb-2">AI-Powered Feedback Summary</h4>
                            <div className="text-gray-300 text-sm whitespace-pre-wrap space-y-2">{summary}</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};

export default PerformerCard;
