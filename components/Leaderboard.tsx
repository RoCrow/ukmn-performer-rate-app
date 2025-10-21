
import React, { useState, Fragment } from 'react';
import type { LeaderboardEntry } from '../types.ts';
import { getFeedbackSummary } from '../services/performerService.ts';
import HypeMeter from './HypeMeter.tsx';

interface LeaderboardProps {
  data: LeaderboardEntry[];
  isLoading: boolean;
  maxRatingCount: number;
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

const rankDetails = [
  { // 1st Place - Green
    text: '1st',
    cardClasses: 'bg-gradient-to-br from-green-500/30 to-emerald-600/30 border-2 border-green-400/80 shadow-2xl shadow-green-400/30',
    indicatorContainerClasses: 'bg-green-500 border-green-300',
  },
  { // 2nd Place - Orange/Amber
    text: '2nd',
    cardClasses: 'bg-gradient-to-br from-amber-500/30 to-orange-600/30 border-2 border-amber-400/60 shadow-2xl shadow-amber-400/25',
    indicatorContainerClasses: 'bg-amber-500 border-amber-300',
  },
  { // 3rd Place - Red/Bronze
    text: '3rd',
    cardClasses: 'bg-gradient-to-br from-red-600/30 to-orange-700/30 border-2 border-red-500/40 shadow-2xl shadow-red-500/20',
    indicatorContainerClasses: 'bg-red-600 border-red-400',
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
}

const LeaderboardCard: React.FC<LeaderboardCardProps> = ({ entry, rank, maxRatingCount, venueName }) => {
  const [isBioVisible, setIsBioVisible] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummaryVisible, setIsSummaryVisible] = useState<boolean>(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  
  const { name, averageRating, ratingCount, commentCount, bio, socialLink } = entry;
  const styles = rankDetails[rank] || { cardClasses: 'bg-gray-700/50 border-gray-600' };

  const handleAnalyzeFeedback = async () => {
    setIsSummaryLoading(true);
    setSummaryError(null);
    setSummary(null);
    try {
        const result = await getFeedbackSummary(entry.id, venueName);
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

  return (
    <div className={`p-4 rounded-lg flex flex-col gap-3 border transition-all transform hover:scale-[1.02] ${styles.cardClasses}`}>
      {/* Top row: rank, name, score */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <RankIndicator rank={rank} />
          <div className="flex-grow min-w-0">
            <p className="font-bold text-white text-lg truncate" title={name}>{name}</p>
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
          {averageRating.toFixed(1)}
          <span className="text-yellow-400 text-base">★</span>
        </div>
      </div>
      
      {/* Hype Meter */}
      {ratingCount > 0 && (
          <div className="pl-16">
              <HypeMeter count={ratingCount} maxCount={maxRatingCount} isLeaderboard={true} />
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
                    Feedback Summary ({commentCount} comments)
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

const Leaderboard: React.FC<LeaderboardProps> = ({ data, isLoading, maxRatingCount, venueName }) => {
  if (isLoading) {
    return (
        <div className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-white">Tonight's Leaders</h2>
            <LeaderboardSkeleton />
        </div>
    );
  }

  if (data.length === 0) {
    return (
        <div className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-white">Tonight's Leaders</h2>
            <div className="bg-gray-800 text-center p-8 rounded-xl border border-gray-700">
                <p className="text-gray-400">No ratings submitted yet for this venue.</p>
                <p className="text-white mt-1">Be the first to rate a performer to get the leaderboard started!</p>
            </div>
        </div>
    );
  }

  return (
    <div className="mb-12 animate-fade-in">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-white">
        Tonight's <span className="text-brand-primary">Leaders</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.slice(0, 3).map((entry, index) => (
          <LeaderboardCard key={entry.id} entry={entry} rank={index} maxRatingCount={maxRatingCount} venueName={venueName} />
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
