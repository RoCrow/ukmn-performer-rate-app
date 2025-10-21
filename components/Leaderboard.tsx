import React, { useState } from 'react';
import type { LeaderboardEntry } from '../types';

interface LeaderboardProps {
  data: LeaderboardEntry[];
  isLoading: boolean;
}

const ExternalLinkIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
);

const TrophyIcon: React.FC<{ rank: number }> = ({ rank }) => {
  const icons = ['🏆', '🥈', '🥉'];
  const colors = ['text-yellow-400', 'text-gray-400', 'text-orange-400'];
  if (rank < 0 || rank > 2) return null;

  return <span className={`text-2xl ${colors[rank]}`} role="img" aria-label={rank === 0 ? 'Gold Trophy' : rank === 1 ? 'Silver Trophy' : 'Bronze Trophy'}>{icons[rank]}</span>;
};


const LeaderboardCard: React.FC<{ entry: LeaderboardEntry; rank: number }> = ({ entry, rank }) => {
  const [isBioVisible, setIsBioVisible] = useState(false);
  const { name, averageRating, ratingCount, bio, socialLink } = entry;

  return (
    <div className="bg-gray-700/50 p-4 rounded-lg flex flex-col gap-2 border border-transparent hover:border-brand-primary/50 transition-all">
      {/* Top row: rank, name, score */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <TrophyIcon rank={rank} />
          <p className="font-bold text-white">{name}</p>
        </div>
        <div className="text-xl font-bold text-brand-accent flex items-center gap-1 flex-shrink-0">
          {averageRating.toFixed(1)}
          <span className="text-yellow-400 text-sm">★</span>
        </div>
      </div>
      
      {/* Second row: rating count, bio/social links */}
      <div className="flex items-center justify-between text-sm pl-10"> {/* pl-10 to align with name */}
        <p className="text-gray-400">{ratingCount} rating{ratingCount !== 1 ? 's' : ''}</p>
        
        {(bio || socialLink) && (
          <div className="flex items-center gap-3">
            {bio && (
              <button
                onClick={() => setIsBioVisible(!isBioVisible)}
                className="text-gray-400 hover:text-white transition-colors"
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
                className="inline-flex items-center gap-1 text-brand-primary hover:underline"
              >
                Socials <ExternalLinkIcon className="h-4 w-4" />
              </a>
            )}
          </div>
        )}
      </div>
      
      {/* Collapsible Bio Section */}
      {isBioVisible && bio && (
        <div className="w-full pt-3 mt-2 border-t border-gray-600 animate-fade-in pl-10">
          <p className="text-gray-300 text-sm whitespace-pre-wrap">{bio}</p>
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
                    <div className="w-8 h-8 bg-gray-600 rounded-full"></div>
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

const Leaderboard: React.FC<LeaderboardProps> = ({ data, isLoading }) => {
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
        {data.map((entry, index) => (
          <LeaderboardCard key={entry.id} entry={entry} rank={index} />
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;