import React from 'react';
import type { Event } from '../types.ts';
import Button from './Button.tsx';

interface EventCardProps {
    event: Event;
    onSelect: () => void;
}

const CalendarIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>);
const ClockIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" /></svg>);
const LocationMarkerIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>);

const EventCard: React.FC<EventCardProps> = ({ event, onSelect }) => {
    const isFullyBooked = event.availableSlots <= 0;
    const date = new Date(event.date);
    // Add timezone offset to prevent date from showing as previous day
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    const formattedDate = date.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-grow">
                <h2 className="text-2xl font-bold text-white">{event.venueName}</h2>
                <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-gray-400">
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5" />
                        <span>{formattedDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                         <ClockIcon className="w-5 h-5" />
                        <span>{event.startTime} - {event.endTime}</span>
                    </div>
                </div>
                 {(event.venueAddress || event.venueGoogleMapsLink || event.venueTelephone) && (
                    <div className="mt-3 pt-3 border-t border-gray-700/50 flex flex-col gap-2 text-sm">
                        {event.venueAddress && (
                            <div className="flex items-center gap-2 text-gray-300">
                                <LocationMarkerIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                <span>{event.venueAddress}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-4">
                            {event.venueGoogleMapsLink && (
                                <a href={event.venueGoogleMapsLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-blue-400 hover:underline">
                                    View on Map
                                </a>
                            )}
                            {event.venueTelephone && (
                                <a href={`tel:${event.venueTelephone}`} className="inline-flex items-center gap-1.5 text-blue-400 hover:underline">
                                    Call Venue
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <div className="flex-shrink-0 flex flex-col items-center gap-3 text-center w-full sm:w-auto">
                 <div className="w-full">
                    <p className="text-lg font-bold text-brand-accent">{event.availableSlots} <span className="text-base font-normal text-gray-300">of {event.totalSlots} slots available</span></p>
                    <div className="w-full bg-gray-700 rounded-full h-2.5 mt-1">
                        <div 
                            className={`rounded-full h-2.5 ${isFullyBooked ? 'bg-red-500' : 'bg-green-500'}`} 
                            style={{ width: `${(event.availableSlots / event.totalSlots) * 100}%`}}
                        ></div>
                    </div>
                </div>
                <Button onClick={onSelect} disabled={isFullyBooked} className="w-full sm:w-auto">
                    {isFullyBooked ? 'Fully Booked' : 'View Slots'}
                </Button>
            </div>
        </div>
    );
};

export default EventCard;