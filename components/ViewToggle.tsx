import React from 'react';

interface ViewToggleProps {
  viewMode: 'TODAY' | 'ALL_TIME';
  onChange: (mode: 'TODAY' | 'ALL_TIME') => void;
  disabled?: boolean;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ viewMode, onChange, disabled = false }) => {
  const baseClasses = 'px-4 py-2 text-sm font-bold rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-brand-primary';
  const activeClasses = 'bg-brand-primary text-white shadow-lg';
  const inactiveClasses = 'bg-gray-700 text-gray-300 hover:bg-gray-600';

  return (
    <div className={`relative flex w-full max-w-xs mx-auto p-1 bg-gray-800 rounded-full ${disabled ? 'opacity-50' : ''}`}>
      <button
        onClick={() => !disabled && onChange('TODAY')}
        disabled={disabled}
        className={`${baseClasses} w-1/2 ${viewMode === 'TODAY' ? activeClasses : inactiveClasses}`}
        aria-pressed={viewMode === 'TODAY'}
      >
        Today's Leaders
      </button>
      <button
        onClick={() => !disabled && onChange('ALL_TIME')}
        disabled={disabled}
        className={`${baseClasses} w-1/2 ${viewMode === 'ALL_TIME' ? activeClasses : inactiveClasses}`}
        aria-pressed={viewMode === 'ALL_TIME'}
      >
        All-Time Stats
      </button>
    </div>
  );
};

export default ViewToggle;
