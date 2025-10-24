

import type { Performer, Rating, LeaderboardEntry, RaterStats, ScoutLevel } from '../types.ts';
import type { ProfileData } from '../App.tsx';

// The URL for the deployed Google Apps Script. This is the single endpoint for all backend operations.
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzvZgjQjU2T7gMgrsf802GTev696LAaroJrHifMUKoe9tCs2CJBjCgh6o4BAcNfcgm9vA/exec';

interface SubmitRatingsPayload {
    action: 'submitRatings';
    ratings: Rating[];
    raterEmail: string;
    venueName: string;
    firstName: string;
    lastName: string;
    latitude?: number;
    longitude?: number;
}

export interface PerformerRegistrationData {
    firstName: string;
    lastName: string;
    performingName: string;
    email: string;
    countryCode: string;
    mobile: string;
    bio?: string;
    socialLink?: string;
    streamingLink?: string;
    imageBase64: string;
    imageFileName: string;
    imageMimeType: string;
}


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

export const loginOrCreateRater = async (email: string, firstName: string, lastName: string): Promise<{message: string}> => {
    return await postToWebApp({ action: 'loginOrCreateRater', email, firstName, lastName });
};

export const registerPerformer = async (data: PerformerRegistrationData): Promise<{message: string; userId: string}> => {
    const result = await postToWebApp({ action: 'registerPerformer', ...data });
    if (!result.userId) {
        throw new Error("Registration succeeded but did not return a user ID.");
    }
    return result;
}

export const loginByEmail = async (email: string): Promise<{ user: ProfileData, userType: 'performer' | 'audience' }> => {
    const result = await postToWebApp({ action: 'loginByEmail', email });
    if (!result.user || !result.userType) {
        throw new Error("Login failed: Invalid response from server.");
    }
    return result;
};


/*
export const requestPerformerLoginLink = async (email: string): Promise<void> => {
    await postToWebApp({ action: 'requestPerformerLoginLink', email });
};
*/

export const updatePerformer = async (data: Partial<ProfileData> & { id: string }): Promise<{message: string}> => {
    // The 'id' property should be mapped to 'userId' for the backend.
    const { id, ...rest } = data;
    return await postToWebApp({ action: 'updatePerformer', userId: id, ...rest });
};

export const requestEmailChange = async (userId: string, newEmail: string): Promise<{message: string}> => {
    return await postToWebApp({ action: 'requestEmailChange', userId, newEmail });
};


export const getScoutLevels = async (): Promise<ScoutLevel[]> => {
    const result = await postToWebApp({ action: 'getScoutLevels' });
    if (!result.scoutLevels) {
        throw new Error("Scout Level data not found in the script's response.");
    }
    return result.scoutLevels;
}

export const getRaterStats = async (raterEmail: string): Promise<RaterStats> => {
    const result = await postToWebApp({ action: 'getRaterStats', raterEmail });
    if (!result.stats) {
        throw new Error("Rater stats not found in the script's response.");
    }
    return result.stats;
}

export const getTodaysFeedbackSummary = async (performerId: string, venueName: string): Promise<string> => {
    const result = await postToWebApp({ action: 'getTodaysFeedbackSummary', performerId, venueName });
    // Check if summary is a non-empty string.
    if (!result.summary || typeof result.summary !== 'string' || result.summary.trim() === '') {
        throw new Error("The AI returned an empty summary. This can happen if the comments are too short or lack specific feedback.");
    }
    return result.summary;
}

export const getAllTimeFeedbackSummary = async (performerId: string, venueName: string): Promise<string> => {
    const result = await postToWebApp({ action: 'getAllTimeFeedbackSummary', performerId, venueName });
    if (!result.summary || typeof result.summary !== 'string' || result.summary.trim() === '') {
        throw new Error("The AI returned an empty summary. This can happen if the comments are too short or lack specific feedback.");
    }
    return result.summary;
}

export const getFeedbackTags = async (): Promise<{positive: string[], constructive: string[]}> => {
    const result = await postToWebApp({ action: 'getFeedbackTags' });
    if (!result.positive || !result.constructive) {
        throw new Error("Tag data not found in the script's response.");
    }
    return result;
}

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

export const getTodaysRatings = async (raterEmail: string, venueName: string): Promise<Record<string, number>> => {
    const result = await postToWebApp({ action: 'getTodaysRatings', raterEmail, venueName });
    if (!result.ratings) {
        throw new Error("Ratings data not found in the script's response.");
    }
    return result.ratings;
}

export const getLeaderboardData = async (venueName: string): Promise<LeaderboardEntry[]> => {
    const result = await postToWebApp({ action: 'getLeaderboardData', venueName });
    if (!result.leaderboard) {
        throw new Error("Leaderboard data not found in the script's response.");
    }
    return result.leaderboard;
}

export const getAllTimeLeaderboardData = async (venueName: string): Promise<LeaderboardEntry[]> => {
    const result = await postToWebApp({ action: 'getAllTimeLeaderboardData', venueName });
    if (!result.leaderboard) {
        throw new Error("All-Time Leaderboard data not found in the script's response.");
    }
    return result.leaderboard;
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

export const submitRatings = async (
    ratings: Rating[], 
    raterEmail: string, 
    venueName: string, 
    firstName: string, 
    lastName: string,
    coords: GeolocationCoordinates | null
): Promise<{pointsEarned: number}> => {
  const payload: SubmitRatingsPayload = {
    action: 'submitRatings',
    ratings,
    raterEmail,
    venueName,
    firstName,
    lastName,
  };

  if (coords) {
      payload.latitude = coords.latitude;
      payload.longitude = coords.longitude;
  }

  const result = await postToWebApp(payload);
  return { pointsEarned: result.pointsEarned || 0 };
};


export const runDiagnostics = async (): Promise<any> => {
    return await postToWebApp({ action: 'debugDateParsing' });
}


const getMockPerformers = (): Promise<Performer[]> => {
    const mockPerformers: Performer[] = [
      { id: '1', name: 'The Sonic Weavers (Sample)', image: 'https://placehold.co/400x400/6d28d9/ede9fe/png?text=SW' },
      { id: '2', name: 'DJ Electra (Sample)', image: 'https://placehold.co/400x400/f59e0b/1e1b4b/png?text=DE' },
      { id: '3', name: 'Luna Hart (Sample)', image: 'https://placehold.co/400x400/10b981/111827/png?text=LH' },
    ];
    return new Promise((resolve) => {
        setTimeout(() => {
          resolve(mockPerformers);
        }, 500);
      });
}
