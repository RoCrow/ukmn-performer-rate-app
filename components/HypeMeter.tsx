import React from 'react';

interface HypeMeterProps {
    count: number;
    maxCount: number;
    isLeaderboard?: boolean;
}

const HypeMeter: React.FC<HypeMeterProps> = ({ count, maxCount, isLeaderboard = false }) => {
    // If maxCount is 0, but this performer has ratings, set maxCount to count to avoid division by zero.
    const effectiveMaxCount = Math.max(1, maxCount, count);
    const widthPercentage = Math.min(100, (count / effectiveMaxCount) * 100);

    const barHeight = isLeaderboard ? 'h-2' : 'h-2.5';

    return (
        <div className="w-full">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1 font-medium">
                <span>Hype Score = <span className="text-white font-bold">{Math.round(widthPercentage)}%</span></span>
                {count > 0 && <span>{count} Rating{count !== 1 ? 's' : ''}</span>}
            </div>
            <div className={`w-full bg-gray-700/50 rounded-full ${barHeight} overflow-hidden`}>
                <div 
                    className={`bg-gradient-to-r from-sky-500 via-fuchsia-500 to-red-500 ${barHeight} rounded-full transition-all duration-700 ease-out`}
                    style={{width: `${widthPercentage}%`}}
                    role="progressbar"
                    aria-valuenow={count}
                    aria-valuemin={0}
                    aria-valuemax={effectiveMaxCount}
                    title={`${count} ratings received`}
                ></div>
            </div>
             {count === 0 && !isLeaderboard && (
                <p className="text-center text-xs text-gray-500 mt-1">Be the first to rate to build the hype!</p>
            )}
        </div>
    );
};

export default HypeMeter;