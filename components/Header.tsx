

import React, { useState, useEffect, useRef } from 'react';
import type { RaterStats, ScoutLevel } from '../types.ts';
import type { UserType, ActiveView } from '../App.tsx';

const LogoutIcon: React.FC<{className?: string}> = ({className}) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>);
const ChevronDownIcon: React.FC<{className?: string}> = ({className}) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>);
const LoginIcon: React.FC<{className?: string}> = ({className}) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>);
const RegisterIcon: React.FC<{className?: string}> = ({className}) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 11a1 1 0 100-2 1 1 0 000 2zm-1-7a1 1 0 11-2 0 1 1 0 012 0zM12 9a1 1 0 100-2 1 1 0 000 2z" /></svg>);
const UserIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>);
const StarIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>);
const CalendarIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>);


interface HeaderProps {
    isLoggedIn: boolean;
    userType: UserType;
    userName?: string | null;
    pageTitle?: string | null;
    raterStats?: RaterStats | null;
    scoutLevels: ScoutLevel[];
    activeView: ActiveView;
    onChangeDetails: () => void;
    onLogout: () => void;
    onNavigate: (page: 'LOGIN' | 'REGISTER') => void;
    onViewChange: (view: ActiveView) => void;
}

const getLevelInfo = (sp: number, scoutLevels: ScoutLevel[]) => {
    if (!scoutLevels || scoutLevels.length === 0) return { levelName: 'New Scout' };
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

const Header: React.FC<HeaderProps> = ({ isLoggedIn, userType, userName, pageTitle, raterStats, scoutLevels, activeView, onChangeDetails, onLogout, onNavigate, onViewChange }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleProfileClick = () => {
        if (userType === 'audience') {
            onChangeDetails();
        } else if (userType === 'performer') {
            onViewChange('PROFILE');
        }
        setIsMenuOpen(false);
    };
    
    const LoggedOutMenu = () => (
        <div ref={menuRef} className="relative">
            <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 p-2 px-4 bg-gray-800/60 rounded-lg border border-gray-700/80 hover:bg-gray-700 transition-colors"
            >
                <span className="font-bold text-white text-sm">Menu</span>
                <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {isMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl border border-gray-700 animate-fade-in origin-top-right">
                    <ul className="p-2">
                        <li>
                            <button 
                                onClick={() => { onViewChange('BOOKING'); setIsMenuOpen(false); }}
                                className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm text-gray-200 rounded-md hover:bg-brand-primary hover:text-white transition-colors"
                            >
                                <CalendarIcon className="w-5 h-5" /> Book a Slot
                            </button>
                        </li>
                        <div className="h-px bg-gray-700 my-2"></div>
                        <li>
                            <button 
                                onClick={() => { onNavigate('LOGIN'); setIsMenuOpen(false); }}
                                className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm text-gray-200 rounded-md hover:bg-brand-primary hover:text-white transition-colors"
                            >
                                <LoginIcon className="w-5 h-5" />
                                Login
                            </button>
                        </li>
                        <li>
                            <button 
                                onClick={() => { onNavigate('REGISTER'); setIsMenuOpen(false); }}
                                className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm text-gray-200 rounded-md hover:bg-brand-primary hover:text-white transition-colors"
                            >
                                <RegisterIcon className="w-5 h-5" />
                                Register
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );

    const LoggedInMenu = () => (
        <div className="flex items-center gap-2 sm:gap-4">
            {raterStats && <RaterStatsDisplay stats={raterStats} scoutLevels={scoutLevels} />}
            <div ref={menuRef} className="relative">
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2 p-2 bg-gray-800/60 rounded-lg border border-gray-700/80 hover:bg-gray-700 transition-colors"
                >
                    <span className="font-bold text-white text-sm truncate max-w-28" title={userName || ''}>{userName}</span>
                    <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {isMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl border border-gray-700 animate-fade-in origin-top-right">
                        <ul className="p-2">
                            <li>
                                <button 
                                    onClick={handleProfileClick} 
                                    disabled={userType === 'performer' && activeView === 'PROFILE'}
                                    className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm text-gray-200 rounded-md hover:bg-brand-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <UserIcon className="w-5 h-5" /> My Profile
                                </button>
                            </li>
                            {userType === 'performer' && (
                                <li>
                                    <button 
                                        onClick={() => { onViewChange('BOOKING'); setIsMenuOpen(false); }} 
                                        disabled={activeView === 'BOOKING'}
                                        className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm text-gray-200 rounded-md hover:bg-brand-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <CalendarIcon className="w-5 h-5" /> Book a Slot
                                    </button>
                                </li>
                            )}
                            <li>
                                <button 
                                    onClick={() => { onViewChange('RATING'); setIsMenuOpen(false); }} 
                                    disabled={activeView === 'RATING'}
                                    className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm text-gray-200 rounded-md hover:bg-brand-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <StarIcon className="w-5 h-5" /> Rate Performances
                                </button>
                            </li>
                            <li>
                                <button onClick={() => { onLogout(); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm text-red-400 rounded-md hover:bg-red-500 hover:text-white transition-colors">
                                    <LogoutIcon className="w-5 h-5" /> Log Out
                                </button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <header className="fixed top-0 left-0 right-0 z-30 bg-gray-900/80 backdrop-blur-md border-b border-gray-700/50 animate-fade-in">
            <div className="relative max-w-4xl mx-auto flex items-center justify-between p-3 h-20">
                <div className="flex-1 flex justify-start">
                    <h1 className="font-extrabold"><span className="text-lg sm:text-xl tracking-tighter"><span className="text-blue-500">UK</span><span className="text-red-500">M</span><span className="text-green-500">N</span></span></h1>
                </div>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-4 pointer-events-none">
                    {pageTitle && <h2 className="text-lg font-bold text-gray-300 whitespace-nowrap truncate">{pageTitle}</h2>}
                </div>
                <div className="flex-1 flex justify-end">
                    {isLoggedIn ? <LoggedInMenu /> : <LoggedOutMenu />}
                </div>
            </div>
        </header>
    );
};

export default Header;