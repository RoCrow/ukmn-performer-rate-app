import React, { useState, Fragment } from 'react';
import type { LeaderboardEntry } from '../types.ts';
import { getTodaysFeedbackSummary, getAllTimeFeedbackSummary } from '../services/performerService.ts';
import HypeMeter from './HypeMeter.tsx';
import ViewToggle from './ViewToggle.tsx';

type ViewMode = 'TODAY' | 'ALL_TIME';

interface LeaderboardProps {
  data: LeaderboardEntry[];
  isLoading: boolean;
  maxRatingCount: number;
  venueName: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

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

const ArrowUpIcon: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }> = ({ title, ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...rest}>
    {title && <title>{title}</title>}
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-11.293a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414l-3-3z" clipRule="evenodd" />
  </svg>
);

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

const ChevronDownIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
);

const rankDetails = [
  { // 1st Place - Green
    text: '1st',
    cardClasses: 'bg-gradient-to-br from-green-500/30 to-emerald-600/30 border-2 border-green-400/80 shadow-2xl shadow-green-400/30',
    indicatorContainerClasses: 'bg-green-500 border-green-300',
  },
  { // 2nd Place - Orange
    text: '2nd',
    cardClasses: 'bg-gradient-to-br from-orange-400/30 to-amber-500/30 border-2 border-orange-300/60 shadow-2xl shadow-orange-400/25',
    indicatorContainerClasses: 'bg-orange-500 border-orange-300',
  },
  { // 3rd Place - Reddish Bronze
    text: '3rd',
    cardClasses: 'bg-gradient-to-br from-rose-600/30 to-orange-700/30 border-2 border-rose-500/40 shadow-2xl shadow-rose-500/20',
    indicatorContainerClasses: 'bg-rose-600 border-rose-400',
  }
];

const RankIndicator: React.FC<{ rank: number }> = ({ rank }) => {
  const details = rankDetails[rank];
  if (!details) return null;

  return (
    <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center border-2 shadow-lg ${details.indicatorContainerClasses}`}>
      <span className="text-lg font-extrabold text-white">
        {details.text}
      </span>
    </div>
  );
};

interface LeaderboardCardProps {
    entry: LeaderboardEntry;
    rank: number;
    maxRatingCount: number;
    venueName: string;
    viewMode: ViewMode;
}

const LeaderboardCard: React.FC<LeaderboardCardProps> = ({ entry, rank, maxRatingCount, venueName, viewMode }) => {
  const [isBioVisible, setIsBioVisible] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummaryVisible, setIsSummaryVisible] = useState<boolean>(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  
  const { name, averageRating, ratingCount, commentCount, bio, socialLink, xp, xpTrend, ratingTrend } = entry;
  const styles = rankDetails[rank] || { cardClasses: 'bg-gray-700/50 border-gray-600' };

  const handleAnalyzeFeedback = async () => {
    setIsSummaryLoading(true);
    setSummaryError(null);
    setSummary(null);
    try {
        const fetcher = viewMode === 'TODAY' ? getTodaysFeedbackSummary : getAllTimeFeedbackSummary;
        const result = await fetcher(entry.id, venueName);
        setSummary(result);
        setIsSummaryVisible(true);
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
    } else if (!isSummaryLoading && canAnalyze) {
      handleAnalyzeFeedback();
    }
 };

  const canAnalyze = commentCount > 1;

  const XPTrendIndicator = () => {
    const title = viewMode === 'ALL_TIME' ? 'XP trend over the last week' : 'XP trend today';
    if (xpTrend === 'UP') {
        return <ArrowUpIcon className="w-4 h-4 text-green-400" title={title} />;
    }
    if (xpTrend === 'DOWN') {
        return <ArrowDownIcon className="w-4 h-4 text-red-400" title={title} />;
    }
    return null;
  };

  const RatingTrendIndicator = () => {
      const title = viewMode === 'TODAY' 
        ? "Today's rating vs. historical average"
        : "All-time rating vs. previous value";

      if (ratingTrend === 'UP') {
          return <ArrowUpIcon className="w-5 h-5 text-green-400" title={title} />;
      }
      if (ratingTrend === 'DOWN') {
          return <ArrowDownIcon className="w-5 h-5 text-red-400" title={title} />;
      }
      return <div className="w-5 h-5"></div>; // Placeholder for alignment
  }

  return (
    <div className={`p-4 rounded-lg flex flex-col gap-3 border transition-all transform hover:scale-[1.02] ${styles.cardClasses}`}>
      {/* Top row: rank, name, score */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <RankIndicator rank={rank} />
          <div className="flex-grow min-w-0">
            <p className="font-bold text-white text-lg truncate" title={name}>{name}</p>
            {typeof xp === 'number' && xp > 0 && (
                <div className="mt-1 flex items-center gap-2 text-xs font-bold text-sky-300/90">
                    <SparklesIcon className="w-3.5 h-3.5" />
                    <span>{xp.toLocaleString()} XP</span>
                    <XPTrendIndicator />
                </div>
            )}
             {(bio || socialLink) && (
                <div className="flex items-center gap-3 text-sm mt-1">
                    {bio && (
                    <button
                        onClick={() => setIsBioVisible(!isBioVisible)}
                        className="text-gray-200/80 hover:text-white transition-colors"
                        aria-expanded={isBioVisible}
                    >
                        {isBioVisible ? 'Hide Bio' : 'Show Bio'}
                    </button>
                    )}
                    {socialLink && (
                    <a
                        href={socialLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline"
                    >
                        Socials <ExternalLinkIcon className="h-4 w-4" />
                    </a>
                    )}
                </div>
            )}
          </div>
        </div>
        <div className="text-2xl font-bold text-brand-accent flex items-center gap-1 flex-shrink-0">
          <RatingTrendIndicator />
          {averageRating.toFixed(1)}
          <span className="text-yellow-400 text-base">★</span>
        </div>
      </div>
      
      {/* Hype Meter */}
      {ratingCount > 0 && (
          <div className="pl-16">
              <HypeMeter title={viewMode === 'TODAY' ? 'Hype Score Today' : 'Hype Score All Time'} count={ratingCount} maxCount={maxRatingCount} isLeaderboard={true} />
          </div>
      )}

      {/* Collapsible Bio Section */}
      {isBioVisible && bio && (
        <div className="w-full pt-3 mt-2 border-t border-gray-600/50 animate-fade-in pl-16">
          <p className="text-gray-300 text-sm whitespace-pre-wrap">{bio}</p>
        </div>
      )}

      {/* Feedback Summary Section */}
      {commentCount > 0 && (
        <div className="w-full pt-3 mt-2 border-t border-gray-600/50">
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
                  commentCount === 1 ? "1 more comment needed to analyze" : "Waiting for comments to analyze"
                ) : summary ? (
                  <Fragment>
                    {isSummaryVisible ? 'Hide Summary' : 'Show Summary'}
                    <ChevronDownIcon className={`w-5 h-5 transition-transform ${isSummaryVisible ? 'rotate-180' : ''}`} />
                  </Fragment>
                ) : (
                  <Fragment>
                    <WandIcon className="w-4 h-4" />
                    {viewMode === 'ALL_TIME' ? `Lifetime Feedback Summary (${commentCount} comments)` : `Feedback Summary (${commentCount} comments)`}
                  </Fragment>
                )}
            </button>
            
            {summaryError && (
                <p className="mt-3 text-center text-sm text-red-400 bg-red-900/30 p-2 rounded-md">{summaryError}</p>
            )}

            {isSummaryVisible && summary && (
                <div className="mt-4 p-3 bg-gray-900/50 rounded-lg animate-fade-in">
                    <h4 className="font-bold text-brand-accent mb-2 text-sm">Feedback Highlights</h4>
                    <div className="text-gray-300 text-sm whitespace-pre-wrap space-y-2">{summary}</div>
                </div>
            )}
        </div>
      )}
    </div>
  );
};


const LeaderboardSkeleton: React.FC = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
             <div key={i} className="bg-gray-700/50 p-4 rounded-lg flex items-center justify-between gap-4 animate-pulse">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-600 rounded-full"></div>
                    <div className="space-y-2">
                        <div className="h-4 w-24 bg-gray-600 rounded"></div>
                        <div className="h-3 w-16 bg-gray-600 rounded"></div>
                    </div>
                </div>
                <div className="h-6 w-10 bg-gray-600 rounded"></div>
            </div>
        ))}
    </div>
);

const Leaderboard: React.FC<LeaderboardProps> = ({ data, isLoading, maxRatingCount, venueName, viewMode, onViewModeChange }) => {
  const title = viewMode === 'TODAY' 
    ? <>Tonight's <span className="text-brand-primary">Leaderboard</span></>
    : <>All-Time <span className="text-brand-primary">Leaderboard</span></>;
  
  const description = viewMode === 'TODAY' 
    ? "Top performers based on the average of all ratings submitted today."
    : "Global top performers ranked by their career average rating.";

  const renderContent = () => {
    if (isLoading) {
      return <LeaderboardSkeleton />;
    }
    if (data.length === 0) {
      return (
        <div className="bg-gray-800 text-center p-8 rounded-xl border border-gray-700">
            <p className="text-gray-400">No ratings submitted yet for this venue today.</p>
            <p className="text-white mt-1">Be the first to rate a performer to get the leaderboard started!</p>
        </div>
      );
    }
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.slice(0, 3).map((entry, index) => (
            <LeaderboardCard key={entry.id} entry={entry} rank={index} maxRatingCount={maxRatingCount} venueName={venueName} viewMode={viewMode} />
            ))}
        </div>
    );
  };
  
  return (
    <div className="mb-12 animate-fade-in">
      <div className="text-center mb-6">
        <ViewToggle viewMode={viewMode} onChange={onViewModeChange} disabled={isLoading} />
        <h2 className="text-2xl sm:text-3xl font-bold mt-6 mb-2 text-white">{title}</h2>
        <p className="text-gray-400 max-w-lg mx-auto">{description}</p>
      </div>
      {renderContent()}
    </div>
  );
};

export default Leaderboard;