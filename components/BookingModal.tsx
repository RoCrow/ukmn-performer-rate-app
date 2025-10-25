import React, { useState, useEffect } from 'react';
import type { Event, Slot } from '../types.ts';
import type { ProfileData } from '../App.tsx';
import { getEventDetails, bookSlot } from '../services/bookingService.ts';
import Button from './Button.tsx';

interface BookingModalProps {
    event: Event;
    performer: ProfileData | null;
    onClose: () => void;
    onBooked: (slotNumber: number) => void;
    onLoginRequired: (eventId: string, slotNumber: number) => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ event, performer, onClose, onBooked, onLoginRequired }) => {
    const [slots, setSlots] = useState<Slot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [bookingState, setBookingState] = useState<'IDLE' | 'BOOKING'>('IDLE');
    const [selectedSlot, setSelectedSlot] = useState<number | ''>('');


    useEffect(() => {
        const fetchAndGenerateSlots = () => {
            setIsLoading(true);
            setError(null);
            getEventDetails(event.id)
                .then(data => {
                    const slotsArray: Slot[] = [];
                    const bookedMap = new Map(data.slots.map(s => [s.slotNumber, s.performer]));
                    
                    for (let i = 1; i <= event.totalSlots; i++) {
                        if (bookedMap.has(i)) {
                            slotsArray.push({
                                slotNumber: i,
                                status: 'BOOKED',
                                performer: bookedMap.get(i)
                            });
                        } else {
                            slotsArray.push({
                                slotNumber: i,
                                status: 'AVAILABLE'
                            });
                        }
                    }
                    setSlots(slotsArray);
                    
                    // UX Improvement: Pre-select the first available slot
                    const firstAvailable = slotsArray.find(s => s.status === 'AVAILABLE');
                    if (firstAvailable) {
                        setSelectedSlot(firstAvailable.slotNumber);
                    } else {
                        setSelectedSlot('');
                    }
                })
                .catch(err => {
                    const message = err instanceof Error ? err.message : "An unknown error occurred.";
                    setError(`Failed to load slot details: ${message}`);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        };
        fetchAndGenerateSlots();
    }, [event.id, event.totalSlots]);

    const handleConfirmBooking = async () => {
        const slotToBook = Number(selectedSlot);
        if (!slotToBook || slotToBook <= 0) {
            setError("Please select a valid slot from the list.");
            return;
        }

        // If user is not logged in, trigger the login flow. The parent will close the modal.
        if (!performer) {
            onLoginRequired(event.id, slotToBook);
            return;
        }

        setBookingState('BOOKING');
        setError(null);
        try {
            const result = await bookSlot(event.id, performer.id, slotToBook);
            onBooked(result.slotNumber);
        } catch (err) {
            const message = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(message);
        } finally {
            setBookingState('IDLE');
        }
    };
    
    const availableSlots = slots.filter(s => s.status === 'AVAILABLE');
    const bookedSlots = slots.filter(s => s.status === 'BOOKED').sort((a,b) => a.slotNumber - b.slotNumber);
    const myBooking = performer ? slots.find(s => s.performer?.id === performer.id) : undefined;


    const renderContent = () => {
        if (isLoading) {
            return <p className="text-center text-gray-400">Loading slots...</p>;
        }

        return (
            <div className="space-y-6">
                {myBooking ? (
                    <div className="p-4 bg-brand-primary/20 border border-brand-primary rounded-lg text-center">
                        <h3 className="font-bold text-white text-lg">You have a confirmed booking for Slot #{myBooking.slotNumber}!</h3>
                        <p className="text-purple-300 mt-1">This is your existing booking for {event.venueName}.</p>
                    </div>
                ) : availableSlots.length > 0 ? (
                    <div className="space-y-3 pb-4">
                        <label htmlFor="slot-select" className="block text-sm font-medium text-gray-300">
                            Select an available slot:
                        </label>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <select
                                id="slot-select"
                                value={selectedSlot}
                                onChange={(e) => setSelectedSlot(Number(e.target.value))}
                                className="w-full flex-grow px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            >
                                <option value="" disabled>Choose a slot...</option>
                                {availableSlots.map(slot => (
                                    <option key={slot.slotNumber} value={slot.slotNumber}>
                                        Slot {slot.slotNumber}
                                    </option>
                                ))}
                            </select>
                            <Button
                                onClick={handleConfirmBooking}
                                disabled={!selectedSlot || bookingState === 'BOOKING'}
                                className="sm:w-auto flex-shrink-0"
                            >
                                {bookingState === 'BOOKING' ? 'Booking...' : 'Confirm Booking'}
                            </Button>
                        </div>
                    </div>
                ) : (
                     <div className="p-4 bg-gray-700/50 rounded-lg text-center">
                        <p className="font-semibold text-white">Fully Booked</p>
                        <p className="text-gray-400">All performance slots for this event have been taken.</p>
                    </div>
                )}

                {bookedSlots.length > 0 && (
                    <div>
                        <h4 className="text-md font-semibold text-gray-300 border-b border-gray-600 pb-2 mb-3">
                            Running Order
                        </h4>
                        <ul className="space-y-2 text-sm max-h-40 overflow-y-auto pr-2">
                            {bookedSlots.map(slot => (
                                <li key={slot.slotNumber} className="flex justify-between items-center bg-gray-900/50 p-2 rounded">
                                    <span className="font-bold text-gray-400">Slot {slot.slotNumber}</span>
                                    <span className="text-white truncate" title={slot.performer?.name}>{slot.performer?.name}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div 
            className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex justify-center items-center p-4 z-50 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex-shrink-0">
                    <h2 className="text-2xl font-bold text-white">Book a Slot at {event.venueName}</h2>
                    <p className="text-gray-400">Select an available slot below to confirm your performance.</p>
                </div>

                <div className="mt-6 flex-grow overflow-y-auto pr-2">
                    {error && <p className="text-center text-red-400 bg-red-900/30 p-3 rounded-md mb-4">{error}</p>}
                    {renderContent()}
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-700 flex-shrink-0">
                    <button 
                        onClick={onClose} 
                        className="w-full bg-gray-600 text-white font-bold py-3 px-8 rounded-full hover:bg-gray-500 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingModal;