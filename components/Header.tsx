import React from 'react';
import type { RaterStats, ScoutLevel } from '../types.ts';

const MusicNoteIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
);

const ScoutIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
    </svg>
);


interface HeaderProps {
    venueName?: string | null;
    userName?: string | null;
    raterStats?: RaterStats | null;
    scoutLevels: ScoutLevel[];
    onChangeDetails?: () => void;
    onLogout?: () => void;
}

const getLevelInfo = (sp: number, scoutLevels: ScoutLevel[]) => {
    // Add a guard for when levels are not yet loaded
    if (!scoutLevels || scoutLevels.length === 0) {
        return {
            levelName: '...',
            progress: 0,
            nextLevelName: '...',
            currentLevelSP: sp,
            nextLevelSP: sp + 1 // Avoid division by zero
        };
    }
    
    let currentLevel = scoutLevels[0];
    let nextLevel = scoutLevels.length > 1 ? scoutLevels[1] : null;

    // Find the current level by iterating backwards
    for (let i = scoutLevels.length - 1; i >= 0; i--) {
        if (sp >= scoutLevels[i].minSP) {
            currentLevel = scoutLevels[i];
            nextLevel = scoutLevels[i + 1] || null; // The next level in the array, or null if it's the max level
            break;
        }
    }
    
    const pointsInLevel = sp - currentLevel.minSP;
    const pointsForNextLevel = nextLevel ? nextLevel.minSP - currentLevel.minSP : 0;
    const progressPercentage = nextLevel ? Math.min(100, (pointsInLevel / pointsForNextLevel) * 100) : 100;

    return {
        levelName: currentLevel.name,
        progress: progressPercentage,
        nextLevelName: nextLevel?.name,
        currentLevelSP: pointsInLevel,
        nextLevelSP: pointsForNextLevel
    };
};


const RaterStatsDisplay: React.FC<{userName: string, stats: RaterStats, scoutLevels: ScoutLevel[]}> = ({ userName, stats, scoutLevels }) => {
    const { levelName, progress, nextLevelSP, currentLevelSP } = getLevelInfo(stats.totalSP, scoutLevels);
    
    return (
        <div className="bg-gray-800/60 backdrop-blur-sm p-3 rounded-lg border border-gray-700 max-w-xs w-full">
            <div className="flex justify-between items-center text-sm mb-1">
                <span className="font-bold text-white flex items-center gap-2">
                    <ScoutIcon className="w-4 h-4 text-brand-primary" />
                    {userName}
                </span>
                <span className="font-semibold text-brand-primary">{levelName}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div 
                    className="bg-brand-primary h-1.5 rounded-full" 
                    style={{width: `${progress}%`}}
                ></div>
            </div>
            <div className="flex justify-between items-center text-xs mt-1 text-gray-400">
                <span>{stats.totalSP.toLocaleString()} SP</span>
                {nextLevelSP > 0 && <span>{Math.max(0, nextLevelSP - currentLevelSP).toLocaleString()} to next level</span>}
            </div>
        </div>
    )
}

const Header: React.FC<HeaderProps> = ({ venueName, userName, raterStats, scoutLevels, onChangeDetails, onLogout }) => {
  return (
    <header className="text-center animate-fade-in relative">
        <div className="flex items-center justify-center gap-4">
            <MusicNoteIcon className="w-10 h-10 text-brand-primary" />
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
                Rate <span className="text-brand-primary">Performers</span>
            </h1>
        </div>
        
        <div className="absolute top-0 right-0 flex items-center gap-2">
            {onChangeDetails && (
                <button 
                    onClick={onChangeDetails}
                    className="text-sm text-gray-400 hover:text-white bg-gray-800/50 px-3 py-1 rounded-md transition-colors"
                    aria-label="Change rater or venue"
                >
                    Change
                </button>
            )}
            {onLogout && (
                 <button 
                    onClick={onLogout}
                    className="text-sm text-red-400 hover:text-red-300 bg-red-900/30 px-3 py-1 rounded-md transition-colors"
                    aria-label="Log out and reset session"
                >
                    Log Out
                </button>
            )}
        </div>

        <div className="mt-4 flex flex-col items-center justify-center gap-4">
            {raterStats && userName && (
                <RaterStatsDisplay userName={userName} stats={raterStats} scoutLevels={scoutLevels} />
            )}
            <p className="max-w-2xl mx-auto text-lg text-gray-400">
                {venueName ? `You are rating performances at: ${venueName}` : "Rate the live performances from today's event."}
            </p>
        </div>
    </header>
  );
};

export default Header;