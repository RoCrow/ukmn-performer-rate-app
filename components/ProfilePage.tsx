// FIX: import useCallback from 'react' to resolve reference error.
import React, { useState, useEffect, useCallback } from 'react';
import type { ProfileData } from '../App.tsx';
import type { Booking } from '../types.ts';
import Button from './Button.tsx';
import { updatePerformer, requestEmailChange } from '../services/performerService.ts';
import { getPerformerBookings, cancelBooking } from '../services/bookingService.ts';
import CountryCodeSelect from './CountryCodeSelect.tsx';

interface ProfilePageProps {
  performer: ProfileData;
  onExit: () => void;
  onUpdate: (updatedData: ProfileData) => void;
}

const MailIcon: React.FC<{className?: string}> = ({className}) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>);
const PhoneIcon: React.FC<{className?: string}> = ({className}) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>);
const ExternalLinkIcon: React.FC<{className?: string}> = ({className}) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>);
const StreamIcon: React.FC<{className?: string}> = ({className}) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4"} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>);
const PencilIcon: React.FC<{className?: string}> = ({className}) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>);
const ExclamationIcon: React.FC<{className?: string}> = ({className}) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>);


const CancellationModal: React.FC<{ booking: Booking, onConfirm: () => void, onCancel: () => void, isCancelling: boolean, error: string | null }> = ({ booking, onConfirm, onCancel, isCancelling, error }) => {
    const date = new Date(booking.event.date);
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    const formattedDate = date.toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' });

    return (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex justify-center items-center p-4 z-50 animate-fade-in" onClick={onCancel}>
            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl max-w-md w-full border border-gray-700" onClick={e => e.stopPropagation()}>
                <div className="text-center">
                    <ExclamationIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white">Confirm Cancellation</h2>
                    <p className="text-gray-400 mt-2">
                        Are you sure you want to cancel your booking for <strong className="text-white">{booking.event.venueName}</strong> on <strong className="text-white">{formattedDate}</strong>?
                    </p>
                    <p className="text-sm text-amber-400 mt-4">This action cannot be undone.</p>
                </div>
                {error && (
                     <div className="mt-4 text-center p-3 rounded-md text-sm bg-red-900/50 text-red-300">
                        <strong>Error:</strong> {error}
                    </div>
                )}
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                    <button onClick={onCancel} disabled={isCancelling} className="bg-gray-600 text-white font-bold py-3 px-8 rounded-full hover:bg-gray-500 transition-colors w-full disabled:opacity-50">
                        Keep Booking
                    </button>
                    <button onClick={onConfirm} disabled={isCancelling} className="bg-red-600 text-white font-bold py-3 px-8 rounded-full hover:bg-red-700 transition-colors w-full flex items-center justify-center gap-2 disabled:bg-red-800">
                        {isCancelling && <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>}
                        {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
                    </button>
                </div>
            </div>
        </div>
    );
};


const BookingSection: React.FC<{ performerId: string }> = ({ performerId }) => {
    const [bookings, setBookings] = useState<{ upcoming: Booking[], past: Booking[] }>({ upcoming: [], past: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalState, setModalState] = useState<{ isOpen: boolean; bookingToCancel: Booking | null }>({ isOpen: false, bookingToCancel: null });
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancellationError, setCancellationError] = useState<string | null>(null);


    const fetchBookings = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getPerformerBookings(performerId);
            setBookings(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(`Could not load bookings: ${message}`);
        } finally {
            setIsLoading(false);
        }
    }, [performerId]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);
    
    const openCancellationModal = (booking: Booking) => {
        setCancellationError(null);
        setModalState({ isOpen: true, bookingToCancel: booking });
    };

    const closeCancellationModal = () => {
        setModalState({ isOpen: false, bookingToCancel: null });
    };
    
    const handleConfirmCancel = async () => {
        if (!modalState.bookingToCancel) return;
        
        setIsCancelling(true);
        setCancellationError(null);
        try {
            await cancelBooking(modalState.bookingToCancel.id, performerId);
            closeCancellationModal();
            await fetchBookings();
        } catch (err) {
            const message = err instanceof Error ? err.message : "An unknown error occurred.";
            setCancellationError(message);
        } finally {
            setIsCancelling(false);
        }
    };
    
    const BookingList: React.FC<{ title: string; data: Booking[] }> = ({ title, data }) => (
        <div>
            <h3 className="text-md font-semibold text-gray-300 mb-2">{title}</h3>
            {data.length === 0 ? (
                <p className="text-gray-500 italic text-sm">No {title.toLowerCase()} bookings.</p>
            ) : (
                <ul className="space-y-2">
                    {data.map(b => {
                        const date = new Date(b.event.date);
                        date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
                        const formattedDate = date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

                        return (
                        <li key={b.id} className="p-3 bg-gray-700 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-bold text-white">{b.event.venueName}</p>
                                <p className="text-sm text-gray-400">{formattedDate} at {b.event.startTime}</p>
                                <p className="text-xs font-mono text-brand-accent mt-1">Slot #{b.slotNumber} - {b.status}</p>
                            </div>
                             {title === 'Upcoming' && b.status === 'Confirmed' && (
                                <button 
                                  onClick={() => openCancellationModal(b)}
                                  className="px-3 py-1 text-xs font-bold text-red-400 bg-red-900/50 border border-red-500/50 rounded-full hover:bg-red-800/50 hover:text-white transition-colors">
                                    Cancel
                                </button>
                            )}
                        </li>
                    )})}
                </ul>
            )}
        </div>
    );

    if (isLoading) return <p className="text-gray-400">Loading bookings...</p>;
    if (error) return <p className="text-red-400">{error}</p>;

    return (
        <>
            <div className="space-y-4">
                <BookingList title="Upcoming" data={bookings.upcoming} />
                <BookingList title="Past" data={bookings.past} />
            </div>
            {modalState.isOpen && modalState.bookingToCancel && (
                <CancellationModal
                    booking={modalState.bookingToCancel}
                    onConfirm={handleConfirmCancel}
                    onCancel={closeCancellationModal}
                    isCancelling={isCancelling}
                    error={cancellationError}
                />
            )}
        </>
    )
}

const ProfilePage: React.FC<ProfilePageProps> = ({ performer, onExit, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState(performer);
    const [isSaving, setIsSaving] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<string|null>(null);
    const [isError, setIsError] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditData(prev => ({ ...prev, [name]: value }));
    };

    const handleCountryCodeChange = (code: string) => {
        setEditData(prev => ({ ...prev, countryCode: code }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setFeedbackMessage(null);
        setIsError(false);
        
        let successMessages: string[] = [];
        let dataToUpdate = { ...editData };

        try {
            // Check if email has changed
            const newEmailLower = editData.email.trim().toLowerCase();
            const originalEmailLower = performer.email.trim().toLowerCase();
            const emailChanged = newEmailLower !== originalEmailLower;
            
            if (emailChanged) {
                if (!/\S+@\S+\.\S+/.test(editData.email)) {
                    throw new Error("The new email address is not valid.");
                }
                await requestEmailChange(performer.id, newEmailLower);
                successMessages.push("Verification email sent to confirm your new address.");
                // Don't update email in the main payload yet
                dataToUpdate = { ...editData, email: performer.email }; 
            }

            // Check if other details have changed
            const otherDetailsChanged = Object.keys(editData).some(key => key !== 'email' && editData[key] !== performer[key]);

            if (otherDetailsChanged) {
                // We don't want to send the email in the update payload, so we remove it.
                const { email, ...profilePayload } = dataToUpdate;
                await updatePerformer(profilePayload);
                successMessages.unshift("Profile details updated successfully.");
            }
            
            if (successMessages.length > 0) {
                 onUpdate({ ...performer, ...dataToUpdate, email: performer.email }); // Update frontend state with non-email changes
                 setFeedbackMessage(successMessages.join(' '));
                 setIsEditing(false);
            } else {
                 setFeedbackMessage("No changes were made.");
                 setIsEditing(false); // No changes, so exit edit mode.
            }

        } catch (err) {
            const message = err instanceof Error ? err.message : "An unknown error occurred.";
            setFeedbackMessage(`Failed to save: ${message}`);
            setIsError(true);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleCancel = () => {
        setEditData(performer); // Reset changes
        setIsEditing(false);
        setFeedbackMessage(null);
        setIsError(false);
    };

    const commonInputClasses = "w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary";
    const labelClasses = "block text-sm font-medium text-gray-300 mb-2";

  return (
    <div className="w-full max-w-2xl bg-gray-800 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
        <div className="p-8">
            <div className="flex justify-between items-start">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <img src={performer.image} alt={performer.performingName} className="w-32 h-32 rounded-full object-cover border-4 border-brand-primary flex-shrink-0" />
                    <div className="text-center sm:text-left">
                        {isEditing ? (
                            <input type="text" name="performingName" value={editData.performingName} onChange={handleInputChange} className={`${commonInputClasses} text-3xl font-bold`} />
                        ) : (
                            <h1 className="text-3xl font-bold text-white">{performer.performingName}</h1>
                        )}
                        {isEditing ? (
                            <div className="flex gap-2 mt-2">
                               <input type="text" name="firstName" value={editData.firstName} onChange={handleInputChange} placeholder="First Name" className={`${commonInputClasses} text-lg`} />
                               <input type="text" name="lastName" value={editData.lastName} onChange={handleInputChange} placeholder="Last Name" className={`${commonInputClasses} text-lg`} />
                            </div>
                        ) : (
                             <p className="text-lg text-gray-400">{performer.firstName} {performer.lastName}</p>
                        )}
                    </div>
                </div>
                {!isEditing && (
                    <button onClick={() => setIsEditing(true)} className="flex-shrink-0 flex items-center gap-2 px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors">
                        <PencilIcon className="w-4 h-4" />
                        Edit
                    </button>
                )}
            </div>

            {feedbackMessage && (
                <div className={`mt-6 text-center p-3 rounded-md text-sm ${isError ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'}`}>
                    {feedbackMessage}
                </div>
            )}


            <div className="mt-8 space-y-6">
                 <div>
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">My Bookings</h2>
                    <BookingSection performerId={performer.id} />
                </div>
                <div>
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Bio</h2>
                    {isEditing ? (
                        <textarea name="bio" value={editData.bio} onChange={handleInputChange} rows={4} className={commonInputClasses}></textarea>
                    ) : performer.bio ? (
                        <p className="text-gray-300 whitespace-pre-wrap">{performer.bio}</p>
                    ) : (
                        <p className="text-gray-500 italic">No bio provided.</p>
                    )}
                </div>

                <div>
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Contact Details</h2>
                    <div className="mt-2 space-y-2 text-gray-300">
                         {isEditing ? (
                            <div className="flex items-center gap-3">
                                <MailIcon className="w-5 h-5 text-brand-primary flex-shrink-0" />
                                <input type="email" name="email" value={editData.email} onChange={handleInputChange} className={commonInputClasses} />
                            </div>
                         ) : (
                            <div className="flex items-center gap-3">
                                <MailIcon className="w-5 h-5 text-brand-primary" />
                                <span>{performer.email}</span>
                            </div>
                         )}
                        {isEditing ? (
                            <div className="flex items-center gap-3">
                                <PhoneIcon className="w-5 h-5 text-brand-primary flex-shrink-0" />
                                <div className="flex-shrink-0 w-32">
                                     <CountryCodeSelect value={editData.countryCode} onChange={handleCountryCodeChange} />
                                </div>
                                <input type="tel" name="mobile" value={editData.mobile} onChange={handleInputChange} className={commonInputClasses} />
                            </div>
                        ) : performer.mobile && (
                             <div className="flex items-center gap-3">
                                <PhoneIcon className="w-5 h-5 text-brand-primary" />
                                <span>+{performer.countryCode} {performer.mobile}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Links</h2>
                     <div className="mt-2 space-y-3">
                        {isEditing ? (
                            <>
                                <div className="flex items-center gap-3">
                                    <ExternalLinkIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />
                                    <input type="text" name="socialLink" value={editData.socialLink} onChange={handleInputChange} placeholder="https://instagram.com/..." className={commonInputClasses} />
                                </div>
                                 <div className="flex items-center gap-3">
                                    <StreamIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
                                    <input type="text" name="streamingLink" value={editData.streamingLink} onChange={handleInputChange} placeholder="https://spotify.com/..." className={commonInputClasses} />
                                </div>
                            </>
                        ) : (
                            <>
                                {performer.socialLink ? (
                                    <a href={performer.socialLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-blue-400 hover:text-blue-300 hover:underline">
                                        <ExternalLinkIcon className="w-5 h-5" />
                                        <span>Social Profile</span>
                                    </a>
                                ) : <p className="text-gray-500 italic text-sm">No social link provided.</p>}
                                {performer.streamingLink ? (
                                    <a href={performer.streamingLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-green-400 hover:text-green-300 hover:underline">
                                        <StreamIcon className="w-5 h-5" />
                                        <span>Streaming Page</span>
                                    </a>
                                ) : <p className="text-gray-500 italic text-sm">No streaming link provided.</p>}
                           </>
                        )}
                     </div>
                </div>
            </div>
        </div>
        <div className="bg-gray-700/50 p-4">
           {isEditing ? (
               <div className="flex flex-col sm:flex-row gap-4">
                   <button onClick={handleCancel} className="bg-gray-600 text-white font-bold py-3 px-8 rounded-full hover:bg-gray-500 transition-colors w-full">
                       Cancel
                   </button>
                   <Button onClick={handleSave} disabled={isSaving} className="w-full">
                       {isSaving ? 'Saving...' : 'Save Changes'}
                   </Button>
               </div>
           ) : (
             <Button onClick={onExit} className="w-full">Go to Rating Page</Button>
           )}
        </div>
    </div>
  );
};

export default ProfilePage;