
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { countryCodes } from './countryCodes.ts';

interface CountryCodeSelectProps {
  value: string;
  onChange: (value: string) => void;
}

const getFlagEmoji = (isoCode: string) => {
    if (!isoCode) return '🌐';
    return String.fromCodePoint(...[...isoCode.toUpperCase()].map(char => char.charCodeAt(0) + 127397));
};

const CountryCodeSelect: React.FC<CountryCodeSelectProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const selectedCountry = useMemo(() => {
    return countryCodes.find(c => c.code === value) || countryCodes[0];
  }, [value]);
  
  const filteredCountries = useMemo(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    return countryCodes.filter(country =>
      country.name.toLowerCase().includes(lowercasedFilter) ||
      country.code.includes(lowercasedFilter)
    );
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-brand-primary"
      >
        <span className="flex items-center gap-2">
            <span>{getFlagEmoji(selectedCountry.iso)}</span>
            <span>+{selectedCountry.code}</span>
        </span>
        <svg className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute z-10 top-full mt-1 w-full max-h-60 overflow-y-auto bg-gray-700 border border-gray-600 rounded-md shadow-lg">
           <div className="p-2 sticky top-0 bg-gray-700">
             <input
                type="text"
                placeholder="Search country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-primary"
             />
           </div>
          <ul>
            {filteredCountries.map(country => (
              <li
                key={country.iso}
                onClick={() => handleSelect(country.code)}
                className="px-4 py-2 text-white hover:bg-brand-primary cursor-pointer flex items-center gap-3"
              >
                <span className="text-xl">{getFlagEmoji(country.iso)}</span>
                <span className="flex-grow">{country.name}</span>
                <span className="text-gray-400">+{country.code}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CountryCodeSelect;
