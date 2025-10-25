import React, { useState, useEffect, useCallback } from 'react';
import type { Event, Slot } from '../types.ts';
import type { ProfileData } from '../App.tsx';
import { getEventDetails, bookSlot } from '../services/bookingService.ts';
import Button from './Button.tsx';

interface BookingDetailsPageProps {
    event: Event;
    performer: ProfileData | null;
    onBack: () => void;
    onNavigateToProfile: () => void;
    onLoginRequired: (eventId: string, slotNumber: number) => void;
}

const ArrowLeftIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>);
const CheckCircleIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>);


const BookingDetailsPage: React.FC<BookingDetailsPageProps> = ({ event, performer, onBack, onNavigateToProfile, onLoginRequired }) => {
    const [slots, setSlots] = useState<Slot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [bookingState, setBookingState] = useState<'IDLE' | 'BOOKING'>('IDLE');
    const [selectedSlot, setSelectedSlot] = useState<number | ''>('');
    const [bookedSlotNumber, setBookedSlotNumber] = useState<number | null>(null);

    const fetchAndGenerateSlots = useCallback(() => {
        setError(null);
        getEventDetails(event.id)
            .then(data => {
                const slotsArray: Slot[] = [];
                const bookedMap = new Map(data.slots.map(s => [s.slotNumber, s.performer]));
                
                for (let i = 1; i <= event.totalSlots; i++) {
                    slotsArray.push({
                        slotNumber: i,
                        status: bookedMap.has(i) ? 'BOOKED' : 'AVAILABLE',
                        performer: bookedMap.get(i)
                    });
                }
                setSlots(slotsArray);
                
                const myBooking = performer ? slotsArray.find(s => s.performer?.id === performer.id) : undefined;
                if (myBooking) {
                    setBookedSlotNumber(myBooking.slotNumber);
                } else {
                    const firstAvailable = slotsArray.find(s => s.status === 'AVAILABLE');
                    setSelectedSlot(firstAvailable ? firstAvailable.slotNumber : '');
                }
            })
            .catch(err => {
                const message = err instanceof Error ? err.message : "An unknown error occurred.";
                setError(`Failed to load slot details: ${message}`);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [event.id, event.totalSlots, performer]);

    useEffect(() => {
        setIsLoading(true);
        fetchAndGenerateSlots();
    }, [fetchAndGenerateSlots]);


    const handleConfirmBooking = async () => {
        const slotToBook = Number(selectedSlot);
        if (!slotToBook || slotToBook <= 0) {
            setError("Please select a valid slot from the list.");
            return;
        }

        if (!performer) {
            onLoginRequired(event.id, slotToBook);
            return;
        }

        setBookingState('BOOKING');
        setError(null);
        try {
            const result = await bookSlot(event.id, performer.id, slotToBook);
            setBookedSlotNumber(result.slotNumber);
            fetchAndGenerateSlots(); // Refresh running order
        } catch (err) {
            const message = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(message);
        } finally {
            setBookingState('IDLE');
        }
    };
    
    const availableSlots = slots.filter(s => s.status === 'AVAILABLE');
    const bookedSlots = slots.filter(s => s.status === 'BOOKED').sort((a,b) => a.slotNumber - b.slotNumber);

    const renderSlotSelection = () => {
        if (bookedSlotNumber) {
            return (
                <div className="p-4 bg-green-900/50 border border-green-500/50 rounded-lg text-center animate-fade-in">
                    <CheckCircleIcon className="w-12 h-12 text-green-400 mx-auto mb-2" />
                    <h3 className="font-bold text-white text-lg">You are confirmed for Slot #{bookedSlotNumber}!</h3>
                    <p className="text-green-300 mt-1">Your spot is secured. We'll see you at the show.</p>
                    <div className="mt-4">
                        <Button onClick={onNavigateToProfile}>View My Bookings</Button>
                    </div>
                </div>
            );
        }

        if (availableSlots.length > 0) {
            return (
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
            );
        }
        return (
            <div className="p-4 bg-gray-700/50 rounded-lg text-center">
                <p className="font-semibold text-white">Fully Booked</p>
                <p className="text-gray-400">All performance slots for this event have been taken.</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-4 sm:p-8 animate-fade-in">
            <div className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full border border-gray-700">
                <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-4">
                    <ArrowLeftIcon className="w-5 h-5" />
                    Back to Events
                </button>
                <div className="border-b border-gray-700 pb-4 mb-6">
                    <h2 className="text-2xl font-bold text-white">Book a Slot at {event.venueName}</h2>
                    <p className="text-gray-400">Select an available slot below to confirm your performance.</p>
                </div>

                {error && <p className="text-center text-red-400 bg-red-900/30 p-3 rounded-md mb-4">{error}</p>}
                
                {isLoading ? (
                     <p className="text-center text-gray-400">Loading slots...</p>
                ) : (
                    <div className="space-y-6">
                        {renderSlotSelection()}
                        
                        {bookedSlots.length > 0 && (
                            <div>
                                <h4 className="text-md font-semibold text-gray-300 border-b border-gray-600 pb-2 mb-3">
                                    Running Order
                                </h4>
                                <ul className="space-y-2 text-sm max-h-48 overflow-y-auto pr-2">
                                    {bookedSlots.map(slot => (
                                        <li key={slot.slotNumber} className={`flex justify-between items-center bg-gray-900/50 p-2 rounded ${slot.performer?.id === performer?.id ? 'ring-2 ring-brand-primary' : ''}`}>
                                            <span className="font-bold text-gray-400">Slot {slot.slotNumber}</span>
                                            <span className="text-white truncate" title={slot.performer?.name}>{slot.performer?.name}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingDetailsPage;