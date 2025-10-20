import React from 'react';

const MusicNoteIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
);

interface HeaderProps {
    venueName?: string | null;
    userName?: string | null;
    onLogout?: () => void;
}


const Header: React.FC<HeaderProps> = ({ venueName, userName, onLogout }) => {
  return (
    <header className="text-center animate-fade-in relative">
        <div className="flex items-center justify-center gap-4">
            <MusicNoteIcon className="w-10 h-10 text-brand-primary" />
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
                Performer <span className="text-brand-primary">Rate</span>
            </h1>
        </div>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
            {userName && <span className="block font-semibold text-white mb-1">Welcome, {userName}!</span>}
            {venueName ? `You are rating performances at: ${venueName}` : "Rate the live performances from today's event."}
        </p>
      {onLogout && (
          <div className="absolute top-0 right-0">
                <button 
                    onClick={onLogout}
                    className="text-sm text-gray-400 hover:text-white bg-gray-800/50 px-3 py-1 rounded-md transition-colors"
                    aria-label="Change rater or venue"
                >
                    Change
                </button>
          </div>
      )}
    </header>
  );
};

export default Header;