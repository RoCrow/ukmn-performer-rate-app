import type { Event, Booking, Slot } from '../types.ts';

const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzvZgjQjU2T7gMgrsf802GTev696LAaroJrHifMUKoe9tCs2CJBjCgh6o4BAcNfcgm9vA/exec';

// Helper function to handle all API requests to the Google Apps Script
const postToWebApp = async (payload: object) => {
    // This implementation sends a raw JSON string with a 'text/plain' content type.
    // This is a robust method to avoid CORS preflight issues with Google Apps Script,
    // which is the likely cause of a "Failed to fetch" error.
    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'cors',
            redirect: 'follow',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            // Handle specific non-JSON errors that indicate script/permission issues
            if (errorText.toLowerCase().includes('<html')) {
                throw new Error(`The server returned an HTML error page (Status: ${response.status}). This strongly indicates a permission issue with your Google Apps Script.`);
            }
             // Try to parse as JSON for a structured error message from the script
            try {
                const errorJson = JSON.parse(errorText);
                throw new Error(errorJson.message || `The server responded with an error: ${response.status}`);
            } catch (e) {
                // Fallback if the error response isn't JSON
                throw new Error(`The server responded with an error: ${response.status} - ${errorText}`);
            }
        }

        const resultText = await response.text();
        const result = JSON.parse(resultText);

        if (result.status !== 'success') {
            throw new Error(result.message || 'The script reported an unspecified error.');
        }

        return result;

    } catch (error) {
        console.error('Error posting to web app:', error);
        if (error instanceof Error && error.message.includes('Failed to fetch')) {
             throw new Error('A network error occurred. Please check your connection and ensure the Google Apps Script URL is correct and deployed.');
        }
        throw error; // Re-throw the original or constructed error
    }
};


export const getUpcomingEvents = async (): Promise<Event[]> => {
    const result = await postToWebApp({ action: 'getUpcomingEvents' });
    if (!result.events) {
        throw new Error("Event data not found in response.");
    }
    return result.events;
};

export const getPerformerBookings = async (userId: string): Promise<{ upcoming: Booking[], past: Booking[] }> => {
    const result = await postToWebApp({ action: 'getPerformerBookings', userId });
    if (!result.upcoming || !result.past) {
        throw new Error("Booking data not found in response.");
    }
    return { upcoming: result.upcoming, past: result.past };
};

export const getEventDetails = async (eventId: string): Promise<{ slots: { slotNumber: number, performer: { id: string, name: string } }[] }> => {
    const result = await postToWebApp({ action: 'getEventDetails', eventId });
    if (!result.slots) {
        throw new Error("Slot data not found in response.");
    }
    return result;
}

export const bookSlot = async (eventId: string, userId: string, slotNumber: number): Promise<{ message: string, slotNumber: number }> => {
    return await postToWebApp({ action: 'bookSlot', eventId, userId, slotNumber });
};

export const cancelBooking = async (bookingId: string, userId: string): Promise<{ message: string }> => {
    return await postToWebApp({ action: 'cancelBooking', bookingId, userId });
};