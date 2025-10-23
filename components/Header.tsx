
import React, { useState, useEffect, useRef } from 'react';
import type { RaterStats, ScoutLevel } from '../types.ts';

const CogIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.96.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
);

const LogoutIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
    </svg>
);

const ChevronDownIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
);

interface HeaderProps {
    userName?: string | null;
    venueName?: string | null;
    raterStats?: RaterStats | null;
    scoutLevels: ScoutLevel[];
    onChangeDetails?: () => void;
    onLogout?: () => void;
}

const getLevelInfo = (sp: number, scoutLevels: ScoutLevel[]) => {
    if (!scoutLevels || scoutLevels.length === 0) {
        return { levelName: 'New Scout' };
    }
    
    let currentLevel = scoutLevels[0];
    for (let i = scoutLevels.length - 1; i >= 0; i--) {
        if (sp >= scoutLevels[i].minSP) {
            currentLevel = scoutLevels[i];
            break;
        }
    }
    return { levelName: currentLevel.name };
};

const RaterStatsDisplay: React.FC<{ stats: RaterStats, scoutLevels: ScoutLevel[]}> = ({ stats, scoutLevels }) => {
    const { levelName } = getLevelInfo(stats.totalSP, scoutLevels);
    
    return (
        <div className="hidden sm:flex items-center gap-2 bg-gray-800/60 text-sm font-semibold p-2 rounded-lg border border-gray-700/80">
            <span className="text-brand-primary">{levelName}</span>
            <div className="w-px h-4 bg-gray-600"></div>
            <span className="text-white">{stats.totalSP.toLocaleString()} SP</span>
        </div>
    )
}

const Header: React.FC<HeaderProps> = ({ userName, venueName, raterStats, scoutLevels, onChangeDetails, onLogout }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <header className="fixed top-0 left-0 right-0 z-30 bg-gray-900/80 backdrop-blur-md border-b border-gray-700/50 animate-fade-in">
            <div className="relative max-w-4xl mx-auto flex items-center justify-between p-3">
                {/* Left side: Logo */}
                <div className="flex-1 flex justify-start">
                    <h1 className="font-extrabold">
                        <span className="text-lg sm:text-xl tracking-tighter">
                            <span className="text-blue-500">UK</span>
                            <span className="text-red-500">M</span>
                            <span className="text-green-500">N</span>
                        </span>
                    </h1>
                </div>

                {/* Center: Venue Name */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-4 pointer-events-none">
                    {venueName && <h2 className="text-lg font-bold text-gray-300 whitespace-nowrap truncate">{venueName}</h2>}
                </div>
                
                {/* Right side: Stats and Menu */}
                <div className="flex-1 flex justify-end">
                    <div className="flex items-center gap-2 sm:gap-4">
                        {raterStats && <RaterStatsDisplay stats={raterStats} scoutLevels={scoutLevels} />}
                        
                        <div ref={menuRef} className="relative">
                            <button 
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="flex items-center gap-2 p-2 bg-gray-800/60 rounded-lg border border-gray-700/80 hover:bg-gray-700 transition-colors"
                            >
                                <span className="font-bold text-white text-sm">{userName}</span>
                                <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isMenuOpen && (
                                <div className="absolute top-full right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl border border-gray-700 animate-fade-in origin-top-right">
                                    <ul className="p-2">
                                        <li>
                                            <button 
                                                onClick={() => { onChangeDetails?.(); setIsMenuOpen(false); }}
                                                className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm text-gray-200 rounded-md hover:bg-brand-primary hover:text-white transition-colors"
                                            >
                                                <CogIcon className="w-5 h-5" />
                                                Change Details
                                            </button>
                                        </li>
                                        <li>
                                            <button 
                                                onClick={() => { onLogout?.(); setIsMenuOpen(false); }}
                                                className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm text-red-400 rounded-md hover:bg-red-500 hover:text-white transition-colors"
                                            >
                                                <LogoutIcon className="w-5 h-5" />
                                                Log Out
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
