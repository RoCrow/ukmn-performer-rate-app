

import React, { useState, Fragment } from 'react';
import type { Performer, LeaderboardEntry } from '../types.ts';
import StarRating from './StarRating.tsx';
import FeedbackTagger from './FeedbackTagger.tsx';
import { getAllTimeFeedbackSummary } from '../services/performerService.ts';
import HypeMeter from './HypeMeter.tsx';

interface PerformerCardProps {
  performer: Performer;
  rank: number;
  
  // Rating Input
  ratingInput: number;
  onRatingChange: (rating: number) => void;
  isRated: boolean;

  // Feedback Input
  selectedTags: string[];
  onFeedbackChange: (tags: string[]) => void;
  comment: string;
  onCommentChange: (comment: string) => void;
  
  // Stats
  todaysStats?: LeaderboardEntry;
  allTimeStats: LeaderboardEntry;
  maxTodaysRatingCount: number;
  maxAllTimeRatingCount: number;
  
  // Other
  positiveTags: string[];
  constructiveTags: string[];
  venueName: string;
}

const rankDetails = [
  { // 1st Place - Gold/Green
    badgeClasses: 'bg-green-500 border-green-300 text-white',
    text: '1st',
  },
  { // 2nd Place - Silver/Blue
    badgeClasses: 'bg-sky-500 border-sky-300 text-white',
    text: '2nd',
  },
  { // 3rd Place - Bronze/Orange
    badgeClasses: 'bg-orange-500 border-orange-400 text-white',
    text: '3rd',
  }
];


const WandIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38zM12 4.59L7.545 11H10v3.41L14.455 8H12V4.59z" clipRule="evenodd" />
    </svg>
);

const SparklesIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5 2a1 1 0 00-1 1v1.586l-1.293 1.293a1 1 0 101.414 1.414L5 6.414V8a1 1 0 102 0V6.414l.879.879a1 1 0 101.414-1.414L8 4.586V3a1 1 0 10-2 0v.586L5.293 2.707A1 1 0 005 2zm10 0a1 1 0 00-1 1v1.586l-1.293 1.293a1 1 0 101.414 1.414L15 6.414V8a1 1 0 102 0V6.414l.879.879a1 1 0 101.414-1.414L18 4.586V3a1 1 0 10-2 0v.586l-.707-.707A1 1 0 0015 2zm-5 6a1 1 0 00-1 1v1.586l-1.293 1.293a1 1 0 101.414 1.414L10 11.414V13a1 1 0 102 0v-1.586l.879.879a1 1 0 101.414-1.414L13 9.586V9a1 1 0 00-1-1h-2z" clipRule="evenodd" />
    </svg>
);

// FIX: Explicitly define `title` prop on SVG components to avoid TypeScript errors
// and render a `<title>` element for accessibility.
const ArrowUpIcon: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }> = ({ title, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...rest}>
    {title && <title>{title}</title>}
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-11.293a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414l-3-3z" clipRule="evenodd" />
  </svg>
);

// FIX: Explicitly define `title` prop on SVG components to avoid TypeScript errors
// and render a `<title>` element for accessibility.
const ArrowDownIcon: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }> = ({ title, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...rest}>
    {title && <title>{title}</title>}
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5.707l1 1 1-1a1 1 0 111.414 1.414l-2.5 2.5a1 1 0 01-1.414 0l-2.5-2.5a1 1 0 111.414-1.414l1 1V7a1 1 0 112 0v5.293z" clipRule="evenodd" />
  </svg>
);

const ExternalLinkIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
);

const StreamIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4"} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
);

const ChevronDownIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
);

const RankBadge: React.FC<{ rank: number }> = ({ rank }) => {
  const details = rankDetails[rank];
  if (!details) return null;

  return (
    <div className={`absolute -top-4 -left-4 w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-lg ${details.badgeClasses}`}>
      <span className="text-lg font-extrabold">{details.text}</span>
    </div>
  );
};


const PerformerCard: React.FC<PerformerCardProps> = ({ 
    performer, 
    rank,
    ratingInput, 
    onRatingChange, 
    isRated, 
    selectedTags, 
    onFeedbackChange,
    comment,
    onCommentChange, 
    todaysStats,
    allTimeStats,
    maxTodaysRatingCount,
    maxAllTimeRatingCount,
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
        const result = await getAllTimeFeedbackSummary(performer.id, venueName);
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
    if (summary) {
      setIsSummaryVisible(!isSummaryVisible);
    } 
    else if (!isSummaryLoading && canAnalyze) {
      handleAnalyzeFeedback();
    }
 };

  const canAnalyze = allTimeStats.commentCount > 1;

  const TrendIndicator = ({ trend, title }: {trend?: string, title: string}) => {
      if (trend === 'UP') return <ArrowUpIcon className="w-5 h-5 text-green-400" title={title} />;
      if (trend === 'DOWN') return <ArrowDownIcon className="w-5 h-5 text-red-400" title={title} />;
      return <div className="w-5 h-5" />; // Placeholder for alignment
  };
  
  return (
    <div className={`
      relative rounded-lg p-4 sm:p-6 flex flex-col items-center gap-4 
      border shadow-md transition-all duration-300 
      bg-gray-800 border-gray-700
    `}>
        {rank < 3 && <RankBadge rank={rank} />}

        <div className="w-full flex flex-col gap-4">
            {/* Top part: Name, Bio/Social links, XP */}
            <div className="text-center sm:text-left">
                <h3 className="text-xl font-bold text-white">{performer.name}</h3>
                {typeof allTimeStats.xp === 'number' && (
                    <div className="mt-1 flex items-center justify-center sm:justify-start gap-2 text-sm font-bold text-sky-400">
                        <SparklesIcon className="w-4 h-4" />
                        <span>{allTimeStats.xp.toLocaleString()} All-Time XP</span>
                        <TrendIndicator trend={allTimeStats.xpTrend} title="XP trend over the last week" />
                    </div>
                )}
                {(performer.bio || performer.socialLink || performer.streamingLink) && (
                    <div className="mt-2 text-sm">
                        {performer.bio && (
                            <>
                                <button 
                                    onClick={() => setIsBioVisible(!isBioVisible)}
                                    className="text-gray-300 hover:text-white transition-colors"
                                    aria-expanded={isBioVisible}
                                >
                                    {isBioVisible ? 'Hide Bio' : 'Show Bio'}
                                </button>
                                {(performer.socialLink || performer.streamingLink) && <span className="text-gray-600 mx-2">|</span>}
                            </>
                        )}
                        {performer.socialLink && (
                            <>
                                <a 
                                    href={performer.socialLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline"
                                >
                                    Socials <ExternalLinkIcon />
                                </a>
                                {performer.streamingLink && <span className="text-gray-600 mx-2">|</span>}
                            </>
                        )}
                        {performer.streamingLink && (
                            <a 
                                href={performer.streamingLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-green-400 hover:text-green-300 hover:underline"
                            >
                                Stream <StreamIcon />
                            </a>
                        )}
                    </div>
                )}
            </div>
            
             {isBioVisible && performer.bio && (
                 <div className="w-full pt-4 border-t border-gray-700/50 animate-fade-in">
                    <p className="text-gray-300 whitespace-pre-wrap">{performer.bio}</p>
                 </div>
            )}

            {/* Ratings Section */}
            <div className="w-full pt-4 border-t border-gray-700/50 flex flex-col sm:flex-row gap-4 items-center justify-around text-center">
                <div className="flex-1 w-full">
                     <h4 className="text-sm font-semibold text-gray-400 mb-2">Today's Rating</h4>
                     {isRated ? (
                        <div className="text-2xl font-bold text-brand-accent flex items-center justify-center gap-2">
                            <TrendIndicator trend={todaysStats?.ratingTrend} title="Today's rating vs. historical average" />
                            <span>{todaysStats?.averageRating.toFixed(1) || '-'}</span>
                             <span className="text-yellow-400 text-base">★</span>
                        </div>
                     ) : (
                        <>
                            <StarRating count={5} rating={ratingInput} onRate={onRatingChange} />
                            <p className="text-xs text-gray-500 font-semibold mt-2">Rate to see today's average (+5 SP)</p>
                        </>
                     )}
                </div>
                <div className="h-12 w-px bg-gray-700 hidden sm:block"></div>
                <div className="flex-1 w-full">
                     <h4 className="text-sm font-semibold text-gray-400 mb-2">All-Time Rating</h4>
                     {isRated ? (
                        <div className="text-2xl font-bold text-brand-accent flex items-center justify-center gap-2">
                              <TrendIndicator trend={allTimeStats.ratingTrend} title="All-time rating vs. previous value" />
                              <span>{allTimeStats.averageRating.toFixed(1)}</span>
                              <span className="text-yellow-400 text-base">★</span>
                        </div>
                     ) : (
                        <div className="min-h-[48px] flex items-center justify-center px-2 bg-gray-900/30 rounded-lg border border-dashed border-gray-700">
                            <p className="text-xs text-gray-400 font-semibold text-center">Rate performer to reveal their all-time average</p>
                        </div>
                     )}
                </div>
            </div>

            {/* Hype Meters */}
            <div className="w-full pt-4 border-t border-gray-700/50 space-y-3">
                <HypeMeter title="Hype Score Today" count={todaysStats?.ratingCount ?? 0} maxCount={maxTodaysRatingCount} />
                <HypeMeter title="Hype Score All Time" count={allTimeStats.ratingCount} maxCount={maxAllTimeRatingCount} />
            </div>

        </div>
        
        <div className="w-full">
            {!isRated && ratingInput > 0 && (
                <div className="w-full pt-4 mt-4 border-t border-gray-700/50 space-y-6">
                    {/* Refactored Tags Section */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-400 mb-1 block text-center">Add feedback tags (optional)</h4>
                        <p className="text-xs text-gray-500 font-semibold mb-3 text-center">+10 SP for adding tags</p>
                        <FeedbackTagger
                            selectedTags={selectedTags}
                            onSelectionChange={onFeedbackChange}
                            positiveTags={positiveTags}
                            constructiveTags={constructiveTags}
                        />
                    </div>
                    
                    {/* Refactored Comment Section */}
                    <div>
                        <label htmlFor={`comment-${performer.id}`} className="text-sm font-semibold text-gray-400 mb-1 block text-center">Add a comment (optional)</label>
                        <p className="text-xs text-gray-500 font-semibold mb-2 text-center">+5 SP for any comment, +25 SP for detailed feedback (&gt;50 chars)</p>
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
            
            {(allTimeStats.commentCount > 0) && (
                <div className="w-full pt-4 mt-4 border-t border-gray-700/50">
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
                        ) : summary ? (
                            <Fragment>
                                {isSummaryVisible ? 'Hide Summary' : 'Show Summary'}
                                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isSummaryVisible ? 'rotate-180' : ''}`} />
                            </Fragment>
                        ) : (
                            <Fragment>
                                <WandIcon className="w-4 h-4" />
                                {`Feedback Summary (${allTimeStats.commentCount} comments)`}
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