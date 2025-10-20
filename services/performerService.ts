import type { Performer, Rating } from '../types';

// The URL for the deployed Google Apps Script. This is the single endpoint for all backend operations.
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwVzj7Czo4ae1mWFIs2FFkCfF1kyO-5IwJUkT2g4RQiUCgiRO0nOA64k9ysOex6CFjI/exec';

// Helper function to handle all API requests to the Google Apps Script
const postToWebApp = async (payload: object) => {
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


export const requestLoginLink = async (email: string, venueName: string, firstName: string, lastName: string): Promise<void> => {
    await postToWebApp({ action: 'requestLogin', email, venueName, firstName, lastName });
};

export const loginWithToken = async (token: string): Promise<{ email: string, venue: string, firstName: string, lastName: string }> => {
    const result = await postToWebApp({ action: 'verifyToken', token });
    return { email: result.email, venue: result.venue, firstName: result.firstName, lastName: result.lastName };
};

export const getVenuesForToday = async (): Promise<string[]> => {
    const result = await postToWebApp({ action: 'getVenuesForToday' });
    if (!result.venues) {
        throw new Error("Venue data not found in the script's response.");
    }
    return result.venues;
}

export const getPerformers = async (venueName: string): Promise<Performer[]> => {
  try {
    const result = await postToWebApp({ action: 'getPerformers', venueName });
    if (!result.performers) {
        throw new Error("Performers data not found in the script's response.");
    }
    return result.performers;
  } catch (error) {
    console.error('Error fetching performer data via script:', error);
    alert("Could not fetch the list of performers. Please check your connection or contact the administrator. Falling back to sample data.");
    return getMockPerformers();
  }
};

export const submitRatings = async (ratings: Rating[], raterEmail: string, venueName: string, firstName: string, lastName: string): Promise<void> => {
  const payload = {
    action: 'submitRatings',
    ratings,
    raterEmail,
    venueName,
    firstName,
    lastName,
  };
  await postToWebApp(payload);
};


const getMockPerformers = (): Promise<Performer[]> => {
    const mockPerformers: Performer[] = [
      { id: '1', name: 'The Sonic Weavers (Sample)' },
      { id: '2', name: 'DJ Electra (Sample)' },
      { id: '3', name: 'Luna Hart (Sample)' },
    ];
    return new Promise((resolve) => {
        setTimeout(() => {
          resolve(mockPerformers);
        }, 500);
      });
}