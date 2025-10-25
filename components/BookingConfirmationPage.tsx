import React from 'react';
import type { Event } from '../types.ts';
import Button from './Button.tsx';

interface BookingConfirmationPageProps {
  bookingDetails: {
    event: Event;
    slotNumber: number;
  };
  onDone: () => void;
}

const CalendarIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>);
const CheckCircleIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>);


const BookingConfirmationPage: React.FC<BookingConfirmationPageProps> = ({ bookingDetails, onDone }) => {
  const { event, slotNumber } = bookingDetails;
  
  const formattedDate = new Date(event.date).toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const handleAddToCalendar = () => {
    // Helper to format date/time into iCal format (YYYYMMDDTHHMMSSZ)
    const formatIcsDateTime = (dateStr: string, timeStr: string): string => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date(dateStr);
        date.setUTCHours(hours, minutes, 0, 0);
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startDate = formatIcsDateTime(event.date, event.startTime);
    const endDate = formatIcsDateTime(event.date, event.endTime);

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `UID:${event.id}-${slotNumber}@ukmn.app`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'}`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `SUMMARY:Performance at ${event.venueName}`,
      `DESCRIPTION:Your confirmed performance slot is #${slotNumber}.`,
      `LOCATION:${event.venueAddress || event.venueName}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `UKMN Booking - ${event.venueName}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8 animate-fade-in">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl text-center border border-gray-700">
        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-brand-accent mb-2">Booking Confirmed!</h1>
        <p className="text-lg text-gray-300">You're all set to perform at {event.venueName}.</p>

        <div className="my-8 text-left p-6 bg-gray-900/50 rounded-lg space-y-3">
          <div className="flex items-start">
            <span className="font-semibold text-gray-400 w-24">Venue:</span>
            <span className="font-bold text-white">{event.venueName}</span>
          </div>
          <div className="flex items-start">
            <span className="font-semibold text-gray-400 w-24">Date:</span>
            <span className="text-white">{formattedDate}</span>
          </div>
          <div className="flex items-start">
            <span className="font-semibold text-gray-400 w-24">Time:</span>
            <span className="text-white">{event.startTime} - {event.endTime}</span>
          </div>
           <div className="flex items-start">
            <span className="font-semibold text-gray-400 w-24">Your Slot:</span>
            <span className="font-extrabold text-2xl text-brand-accent">#{slotNumber}</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
            <button
                onClick={handleAddToCalendar}
                className="w-full flex items-center justify-center gap-2 bg-gray-600 text-white font-bold py-3 px-8 rounded-full shadow-md hover:bg-gray-500 transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-gray-500 transform hover:scale-105"
            >
                <CalendarIcon className="w-5 h-5" />
                Add to Calendar
            </button>
            <Button onClick={onDone} className="w-full">
                View My Bookings
            </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationPage;