import React from 'react';
import type { Performer } from '../types.ts';

const RunningOrder: React.FC<{ performers: Performer[] }> = ({ performers }) => {
    // Filter for performers with a slot and sort them
    const scheduledPerformers = performers
        .filter(p => typeof p.slot === 'number' && p.slot > 0)
        .sort((a, b) => (a.slot as number) - (b.slot as number));

    if (scheduledPerformers.length === 0) {
        return null; // Don't render if there are no performers with slots
    }

    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, performerId: string) => {
        e.preventDefault();
        const targetElement = document.getElementById(`performer-${performerId}`);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Optional: Add a subtle highlight effect
            targetElement.classList.add('animate-pulse-once');
            setTimeout(() => targetElement.classList.remove('animate-pulse-once'), 1500);
        }
    };

    return (
        <div className="mb-12 bg-gray-800/50 p-6 rounded-xl border border-gray-700 animate-fade-in">
            <h2 className="text-xl font-bold text-center text-white mb-2">Tonight's Running Order</h2>
            <p className="text-center text-gray-400 mb-6">Tap a name to jump to their card and submit your rating.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-center">
                {scheduledPerformers.map(performer => (
                    <a 
                        key={performer.id} 
                        href={`#performer-${performer.id}`}
                        onClick={(e) => handleLinkClick(e, performer.id)}
                        className="block p-3 bg-gray-700 rounded-lg hover:bg-brand-primary hover:text-white transition-all duration-200 transform hover:scale-105"
                    >
                        <div className="flex items-center justify-center">
                            <span className="font-bold text-lg text-brand-accent">{performer.slot}.</span>
                            <span className="ml-2 font-semibold truncate" title={performer.name}>{performer.name}</span>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
};

export default RunningOrder;
