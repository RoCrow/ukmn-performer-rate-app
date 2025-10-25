import React, { useState, useEffect } from 'react';
import { getUpcomingEvents } from '../services/bookingService.ts';
import type { Event } from '../types.ts';
import EventCard from './EventCard.tsx';

interface BookingsPageProps {
    onSelectEvent: (event: Event) => void;
}

const BookingsPage: React.FC<BookingsPageProps> = ({ onSelectEvent }) => {
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEvents = () => {
        setIsLoading(true);
        setError(null);
        getUpcomingEvents()
            .then(data => {
                setEvents(data);
            })
            .catch(err => {
                const message = err instanceof Error ? err.message : "An unknown error occurred.";
                setError(`Failed to load events: ${message}`);
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col justify-center items-center p-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
                    <p className="mt-4 text-gray-400">Loading upcoming events...</p>
                </div>
            );
        }

        if (error) {
            return <div className="text-center text-red-400 bg-red-900/20 p-4 rounded-lg"><p>{error}</p></div>;
        }

        if (events.length === 0) {
            return (
                <div className="text-center p-8 bg-gray-800 rounded-xl shadow-2xl">
                    <h2 className="text-2xl font-bold text-white mb-2">No Events Available</h2>
                    <p className="text-lg text-gray-400">There are currently no events open for booking. Please check back later!</p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {events.map((event, index) => (
                    <div key={event.id} className="animate-slide-in-bottom" style={{ animationDelay: `${index * 100}ms` }}>
                        <EventCard event={event} onSelect={() => onSelectEvent(event)} />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-8">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white">Book an Upcoming Slot</h1>
                <p className="text-gray-400 mt-2">Here are the upcoming events with available performance slots.</p>
            </div>
            {renderContent()}
        </div>
    );
};

export default BookingsPage;