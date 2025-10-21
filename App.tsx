import React, { useState, useEffect, useCallback } from 'react';
import type { Performer, Rating, LeaderboardEntry, RaterStats, ScoutLevel } from './types.ts';
import { getPerformers, submitRatings, loginWithToken, getTodaysRatings, getLeaderboardData, getAllTimeLeaderboardData, getFeedbackTags, getRaterStats, getScoutLevels } from './services/performerService.ts';
import Header from './components/Header.tsx';
import PerformerCard from './components/PerformerCard.tsx';
import Button from './components/Button.tsx';
import LoginScreen from './components/LoginScreen.tsx';
import Leaderboard from './components/Leaderboard.tsx';

type AuthState = 'LOGGED_OUT' | 'CHECKING_TOKEN' | 'LOGGED_IN' | 'TOKEN_ERROR';
type SubmissionStatus = 'IDLE' | 'AWAITING_CONSENT' | 'GETTING_LOCATION' | 'SUBMITTING';
type RatingInput = { score: number; tags: string[]; comment: string };
type SubmissionResult = { success: boolean; pointsEarned: number } | null;
type ViewMode = 'TODAY' | 'ALL_TIME';


const App: React.FC = () => {
  const [performers, setPerformers] = useState<Performer[]>([]);
  const [ratings, setRatings] = useState<Record<string, RatingInput>>({});
  const [existingRatings, setExistingRatings] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>('IDLE');
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult>(null);
  
  const [raterEmail, setRaterEmail] = useState<string | null>(null);
  const [venueName, setVenueName] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthState>('LOGGED_OUT');
  const [tokenError, setTokenError] = useState<string | null>(null);
  
  const [leaderboardData, setLeaderboardData] = useState<Record<string, LeaderboardEntry>>({});
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState<boolean>(true);
  
  const [allTimeLeaderboardData, setAllTimeLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isAllTimeLeaderboardLoading, setIsAllTimeLeaderboardLoading] = useState<boolean>(false);
  
  const [feedbackTags, setFeedbackTags] = useState<{positive: string[], constructive: string[]}>({ positive: [], constructive: [] });
  const [raterStats, setRaterStats] = useState<RaterStats | null>(null);
  const [scoutLevels, setScoutLevels] = useState<ScoutLevel[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('TODAY');


  // Persists session data to localStorage.
  // If it's a new login, it creates a new expiry timestamp. Otherwise, it preserves the existing one.
  const updateSession = (data: { email: string, venue: string, firstName: string, lastName: string }, isNewLogin: boolean = false) => {
      const sessionData = { ...data, expiry: 0 };
      if (isNewLogin) {
          const expiryDate = new Date();
          expiryDate.setHours(23, 59, 59, 999);
          sessionData.expiry = expiryDate.getTime();
      } else {
          const savedSession = JSON.parse(localStorage.getItem('performer-rater-session') || '{}');
          sessionData.expiry = savedSession.expiry || 0; // Fallback
      }
      localStorage.setItem('performer-rater-session', JSON.stringify(sessionData));
  }

  // Handler for when the user submits new details from the LoginScreen without a token
  const handleDetailsChanged = (details: { email: string; venue: string; firstName: string; lastName: string; }) => {
      // If there's no existing session, it's a new login for the day.
      const isNewLogin = !localStorage.getItem('performer-rater-session');

      setRaterEmail(details.email);
      setVenueName(details.venue);
      setFirstName(details.firstName);
      setLastName(details.lastName);
      updateSession(details, isNewLogin);
      setAuthState('LOGGED_IN');
  };


  useEffect(() => {
    // Check for a session in localStorage first
    const savedSession = localStorage.getItem('performer-rater-session');
    if (savedSession) {
      const { email, venue, firstName, lastName, expiry } = JSON.parse(savedSession);
      
      // Check if the session is expired
      if (expiry && new Date().getTime() > expiry) {
        // Session expired, remove it and stay logged out
        localStorage.removeItem('performer-rater-session');
      } else {
        // Session is valid, log the user in
        setRaterEmail(email);
        setVenueName(venue);
        setFirstName(firstName);
        setLastName(lastName);
        setAuthState('LOGGED_IN');
        return; // Stop further execution
      }
    }

    // If no session, check for a login token in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      setAuthState('CHECKING_TOKEN');
      loginWithToken(token)
        .then(({ email, venue, firstName, lastName }) => {
          setRaterEmail(email);
          setVenueName(venue);
          setFirstName(firstName);
          setLastName(lastName);
          setAuthState('LOGGED_IN');
          
          // Persist session with an expiry timestamp (midnight)
          updateSession({ email, venue, firstName, lastName }, true);

          // Clean the URL
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch(err => {
          setAuthState('TOKEN_ERROR');
          setTokenError(err.message || 'The login link is invalid or has expired.');
          // Clean the URL
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    }
  }, []);


  const fetchInitialData = useCallback(async () => {
    if (!venueName || !raterEmail) return;

    try {
      setIsLoading(true);
      setIsLeaderboardLoading(true);
      setError(null);
      
      const [performersData, existingRatingsData, leaderboardResult, tagsData, raterStatsData, scoutLevelsData] = await Promise.all([
          getPerformers(venueName),
          getTodaysRatings(raterEmail, venueName),
          getLeaderboardData(venueName),
          getFeedbackTags(),
          getRaterStats(raterEmail),
          getScoutLevels()
      ]);

      setPerformers(performersData);
      setExistingRatings(existingRatingsData);
      setRaterStats(raterStatsData);
      setScoutLevels(scoutLevelsData);
      
      const leaderboardMap = leaderboardResult.reduce((acc, entry) => {
        acc[entry.id] = entry;
        return acc;
      }, {} as Record<string, LeaderboardEntry>);
      setLeaderboardData(leaderboardMap);

      setFeedbackTags(tagsData);

    } catch (err) {
      setError('Failed to fetch performers or ratings. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsLeaderboardLoading(false);
    }
  }, [venueName, raterEmail]);

  useEffect(() => {
    if (authState === 'LOGGED_IN' && venueName && raterEmail) {
      fetchInitialData();
    }
  }, [authState, fetchInitialData, venueName, raterEmail]);

  const handleViewModeChange = useCallback(async (newMode: ViewMode) => {
    setViewMode(newMode);
    if (newMode === 'ALL_TIME' && allTimeLeaderboardData.length === 0) {
        setIsAllTimeLeaderboardLoading(true);
        try {
            // Note: The backend will now ignore the venueName for this call and return global stats.
            const data = await getAllTimeLeaderboardData(venueName || '');
            setAllTimeLeaderboardData(data);
        } catch (err) {
            setError("Could not load all-time stats. Please try again later.");
            console.error(err);
        } finally {
            setIsAllTimeLeaderboardLoading(false);
        }
    }
  }, [venueName, allTimeLeaderboardData.length]);

  const handleRatingChange = (performerId: string, newScore: number) => {
    if (existingRatings[performerId]) return;
    setRatings(prev => ({
      ...prev,
      [performerId]: { ...prev[performerId], score: newScore, comment: prev[performerId]?.comment || '' },
    }));
  };

  const handleFeedbackChange = (performerId: string, newTags: string[]) => {
    if (existingRatings[performerId]) return;
    setRatings(prev => ({
      ...prev,
      [performerId]: { score: prev[performerId]?.score || 0, tags: newTags, comment: prev[performerId]?.comment || '' },
    }));
  };

  const handleCommentChange = (performerId: string, newComment: string) => {
    if (existingRatings[performerId]) return;
    setRatings(prev => ({
        ...prev,
        [performerId]: { 
            score: prev[performerId]?.score || 0, 
            tags: prev[performerId]?.tags || [],
            comment: newComment 
        },
    }));
  };

  const performRatingSubmission = async (coords: GeolocationCoordinates) => {
    if (!raterEmail || !venueName || !firstName || !lastName) {
        setSubmissionError("Authentication error. Please log in again.");
        return;
    }
    setSubmissionStatus('SUBMITTING');
    setSubmissionError(null);
    try {
      const ratingsToSubmit: Rating[] = Object.keys(ratings).map((performerId) => ({
          id: performerId,
          rating: ratings[performerId].score,
          feedbackTags: ratings[performerId].tags || [],
          comment: ratings[performerId].comment || '',
      })).filter(r => r.rating > 0); // Only submit entries that have a star rating

      if (ratingsToSubmit.length === 0) {
        setSubmissionError("No new ratings to submit.");
        setSubmissionStatus('IDLE');
        return;
      }

      const { pointsEarned } = await submitRatings(ratingsToSubmit, raterEmail, venueName, firstName, lastName, coords);
      
      const newExistingRatings = { ...existingRatings };
      ratingsToSubmit.forEach(r => {
        newExistingRatings[r.id] = r.rating;
      });
      setExistingRatings(newExistingRatings);
      setRatings({});
      
      setSubmissionResult({ success: true, pointsEarned: pointsEarned });
      
      // Re-fetch leaderboard and rater stats to show immediate impact
      getLeaderboardData(venueName).then(leaderboardResult => {
          const leaderboardMap = leaderboardResult.reduce((acc, entry) => {
            acc[entry.id] = entry;
            return acc;
          }, {} as Record<string, LeaderboardEntry>);
          setLeaderboardData(leaderboardMap);
      }).catch(err => console.error("Failed to refresh leaderboard", err));

      getRaterStats(raterEmail).then(setRaterStats);

      setTimeout(() => setSubmissionResult(null), 5000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setSubmissionError(`Submission Failed: ${errorMessage}`);
      console.error(err);
    } finally {
      setSubmissionStatus('IDLE');
    }
  };

  const handleInitialSubmit = () => {
    setSubmissionError(null);
    setSubmissionStatus('AWAITING_CONSENT');
  };

  const handleConsentAndSubmit = () => {
    setSubmissionStatus('GETTING_LOCATION');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        performRatingSubmission(position.coords);
      },
      (error) => {
        console.warn(`Geolocation error: ${error.message}`);
        setSubmissionError('Location permission is required to submit ratings. Please enable it in your browser settings and try again.');
        setSubmissionStatus('IDLE');
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };
  
  const handleChangeDetails = () => {
    // We keep firstName, lastName, and email in state.
    // We only clear the venue-specific data and go back to the login screen.
    setVenueName(null);
    setPerformers([]);
    setRatings({});
    setExistingRatings({});
    setAuthState('LOGGED_OUT');
    setIsLoading(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('performer-rater-session');
    window.location.reload();
  };

  const ratedCount = Object.keys(ratings).filter(id => ratings[id] && ratings[id].score > 0).length;
  const totalPerformers = performers.length;

  if (authState === 'LOGGED_OUT' || authState === 'TOKEN_ERROR') {
    // If raterEmail exists, it means we are in the "change details" flow.
    // If not, it's a fresh login.
    const isChanging = !!raterEmail && authState !== 'TOKEN_ERROR';
    return (
        <LoginScreen
            initialError={tokenError}
            isChangingDetails={isChanging}
            onDetailsChanged={handleDetailsChanged}
            initialEmail={raterEmail}
            initialFirstName={firstName}
            initialLastName={lastName}
        />
    );
  }

  if (authState === 'CHECKING_TOKEN' || (authState === 'LOGGED_IN' && isLoading)) {
     return (
        <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-primary"></div>
            <p className="mt-4 text-gray-400">{authState === 'CHECKING_TOKEN' ? 'Verifying login...' : `Loading performers for ${venueName}...`}</p>
        </div>
     );
  }

    const LocationConsentScreen = () => (
        <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm flex flex-col justify-center items-center p-4 z-50 animate-fade-in">
            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl max-w-lg text-center">
                <h2 className="text-2xl font-bold text-brand-accent mb-4">Location Verification Required</h2>
                <div className="text-gray-300 space-y-4 text-left">
                    <p>To ensure all ratings are genuine and prevent fraud, we need to quickly verify you're at the venue.</p>
                    <p>
                        <strong className="text-white">This is a one-time check for this submission only.</strong> We do not track your location continuously or store it after today.
                    </p>
                </div>
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                     <Button onClick={() => setSubmissionStatus('IDLE')} className="bg-gray-600 hover:bg-gray-500 w-full sm:w-auto">
                        Cancel
                     </Button>
                     <Button onClick={handleConsentAndSubmit} className="w-full sm:w-auto">
                        Verify Location & Submit
                     </Button>
                </div>
            </div>
        </div>
    );

  if (submissionStatus === 'AWAITING_CONSENT') {
      return <LocationConsentScreen />;
  }


  const getButtonText = () => {
      switch(submissionStatus) {
          case 'GETTING_LOCATION': return 'Verifying Location...';
          case 'SUBMITTING': return 'Submitting...';
          default: return 'Submit All Ratings';
      }
  }
  
  const leaderboardValues = viewMode === 'TODAY' ? Object.values(leaderboardData) : allTimeLeaderboardData;
  const sortedLeaderboard = leaderboardValues.sort((a, b) => {
      // Both views are now sorted by average rating first, then by rating count as a tie-breaker.
      if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating;
      return b.ratingCount - a.ratingCount;
  });
  const maxRatingCount = leaderboardValues.reduce((max, p) => Math.max(max, p.ratingCount), 0);

  const renderContent = () => {
    if (error) {
      return (
        <div className="text-center text-red-400 bg-red-900/20 p-4 rounded-lg">
          <p>{error}</p>
        </div>
      );
    }
    
    if (submissionResult?.success) {
        return (
            <div className="text-center p-8 bg-gray-800 rounded-xl shadow-2xl animate-fade-in">
                <h2 className="text-3xl font-bold text-brand-accent mb-4">Thank You!</h2>
                <p className="text-lg text-gray-300">Your ratings have been submitted successfully.</p>
                {submissionResult.pointsEarned > 0 && (
                    <p className="mt-4 text-xl font-bold text-sky-400 animate-slide-in-bottom">
                        +{submissionResult.pointsEarned.toLocaleString()} Scout Points Earned!
                    </p>
                )}
            </div>
        )
    }

    const performerList = viewMode === 'TODAY' ? performers : allTimeLeaderboardData;
    const dataMap = viewMode === 'TODAY' ? leaderboardData : allTimeLeaderboardData.reduce((acc, entry) => {
        acc[entry.id] = entry;
        return acc;
    }, {} as Record<string, LeaderboardEntry>);

    if (performerList.length === 0 && viewMode === 'TODAY') {
        return (
             <div className="text-center p-8 bg-gray-800 rounded-xl shadow-2xl animate-fade-in">
                <h2 className="text-2xl font-bold text-white mb-2">No Performers Found</h2>
                <p className="text-lg text-gray-400">There are no performers listed for {venueName} at this time.</p>
            </div>
        )
    }
    
    if (performerList.length === 0 && viewMode === 'ALL_TIME' && !isAllTimeLeaderboardLoading) {
        return (
             <div className="text-center p-8 bg-gray-800 rounded-xl shadow-2xl animate-fade-in">
                <h2 className="text-2xl font-bold text-white mb-2">No Historical Data</h2>
                <p className="text-lg text-gray-400">No performers have been rated at {venueName} yet.</p>
            </div>
        )
    }

    return (
      <div className="space-y-4">
        {performerList.map((p, index) => {
           const performerInfo = viewMode === 'TODAY' ? (p as Performer) : {
               id: (p as LeaderboardEntry).id,
               name: (p as LeaderboardEntry).name,
               bio: (p as LeaderboardEntry).bio,
               socialLink: (p as LeaderboardEntry).socialLink
           };

           const isRated = viewMode === 'TODAY' ? !!existingRatings[performerInfo.id] : true;
           const currentRating = viewMode === 'TODAY' ? (existingRatings[performerInfo.id] || ratings[performerInfo.id]?.score || 0) : (dataMap[performerInfo.id]?.averageRating || 0);
           const currentTags = ratings[performerInfo.id]?.tags || [];
           const currentComment = ratings[performerInfo.id]?.comment || '';
           const leaderboardInfo = dataMap[performerInfo.id];
           
           return (
              <div key={performerInfo.id} className="animate-slide-in-bottom" style={{ animationDelay: `${index * 100}ms`}}>
                <PerformerCard
                  performer={performerInfo}
                  rating={currentRating}
                  onRatingChange={(rating) => handleRatingChange(performerInfo.id, rating)}
                  isRated={isRated}
                  selectedTags={currentTags}
                  onFeedbackChange={(tags) => handleFeedbackChange(performerInfo.id, tags)}
                  comment={currentComment}
                  onCommentChange={(comment) => handleCommentChange(performerInfo.id, comment)}
                  ratingCount={leaderboardInfo?.ratingCount ?? 0}
                  commentCount={leaderboardInfo?.commentCount ?? 0}
                  maxRatingCount={maxRatingCount}
                  xp={leaderboardInfo?.xp}
                  xpTrend={leaderboardInfo?.xpTrend}
                  positiveTags={feedbackTags.positive}
                  constructiveTags={feedbackTags.constructive}
                  venueName={venueName || ''}
                  viewMode={viewMode}
                />
              </div>
            );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 font-sans p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <Header 
            venueName={venueName} 
            userName={firstName} 
            raterStats={raterStats}
            scoutLevels={scoutLevels}
            onChangeDetails={handleChangeDetails} 
            onLogout={handleLogout} 
        />
        <main className="mt-12">

          {/* Leaderboard Section */}
          { authState === 'LOGGED_IN' && (
            <>
              <div className="border-t border-gray-700"></div>
              <div className="mt-8">
                <Leaderboard 
                    data={sortedLeaderboard} 
                    isLoading={viewMode === 'TODAY' ? isLeaderboardLoading : isAllTimeLeaderboardLoading} 
                    maxRatingCount={maxRatingCount} 
                    venueName={venueName || ''}
                    viewMode={viewMode}
                    onViewModeChange={handleViewModeChange}
                />
              </div>
            </>
          )}

          {/* Performer List Section */}
          {!isLoading && !error && !submissionResult && viewMode === 'TODAY' && performers.length > 0 && (
            <>
              <div className="border-t border-gray-700"></div>
              <h2 className="text-2xl sm:text-3xl font-bold text-center mt-8 mb-6 text-white">
                All of Tonight's <span className="text-brand-primary">Performers</span>
              </h2>
            </>
          )}
          
          {renderContent()}

          {!isLoading && !error && !submissionResult && viewMode === 'TODAY' && performers.length > 0 && (
            <footer className="mt-12 text-center animate-fade-in">
              <p className="mb-4 text-gray-400">{ratedCount} of {totalPerformers - Object.keys(existingRatings).length} new performers rated.</p>
              <Button onClick={handleInitialSubmit} disabled={ratedCount === 0 || submissionStatus !== 'IDLE'}>
                {getButtonText()}
              </Button>
              {submissionError && (
                <p className="mt-4 text-red-400 bg-red-900/20 p-3 rounded-lg">{submissionError}</p>

              )}
            </footer>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;