
import React, { useState, useEffect, useCallback } from 'react';
import type { Performer, Rating, LeaderboardEntry, RaterStats, ScoutLevel } from './types.ts';
import { getPerformers, submitRatings, getTodaysRatings, getLeaderboardData, getAllTimeLeaderboardData, getFeedbackTags, getRaterStats, getScoutLevels, loginByEmail } from './services/performerService.ts';
import type { PerformerRegistrationData } from './services/performerService.ts';
import Header from './components/Header.tsx';
import PerformerCard from './components/PerformerCard.tsx';
import Button from './components/Button.tsx';
import LoginScreen from './components/LoginScreen.tsx';
import RunningOrder from './components/RunningOrder.tsx';
import ProfilePage from './components/ProfilePage.tsx';
import PerformerLoginRegisterPage from './components/PerformerLoginRegisterPage.tsx';


type AuthState = 'LOGGED_OUT' | 'LOGGING_IN' | 'LOGGED_IN';
type SubmissionStatus = 'IDLE' | 'AWAITING_CONSENT' | 'GETTING_LOCATION' | 'SUBMITTING';
type Page = 'LOGIN' | 'REGISTER';
export type UserType = 'audience' | 'performer' | null;
export type ActiveView = 'PROFILE' | 'RATING';

type RatingInput = { score: number; tags: string[]; comment: string };
type SubmissionResult = { success: boolean; pointsEarned: number } | null;
export type ProfileData = PerformerRegistrationData & { image: string; id: string; };


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
  const [loginError, setLoginError] = useState<string | null>(null);
  
  const [todaysStatsMap, setTodaysStatsMap] = useState<Record<string, LeaderboardEntry>>({});
  const [allTimeStatsMap, setAllTimeStatsMap] = useState<Record<string, LeaderboardEntry>>({});
  
  const [feedbackTags, setFeedbackTags] = useState<{positive: string[], constructive: string[]}>({ positive: [], constructive: [] });
  const [raterStats, setRaterStats] = useState<RaterStats | null>(null);
  const [scoutLevels, setScoutLevels] = useState<ScoutLevel[]>([]);
  
  const [activePerformerProfile, setActivePerformerProfile] = useState<ProfileData | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('LOGIN');
  const [activeView, setActiveView] = useState<ActiveView>('RATING');
  const [isSelectingVenue, setIsSelectingVenue] = useState<boolean>(false);


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
      
      if (isSelectingVenue) {
          setIsSelectingVenue(false);
      }
      setActiveView('RATING');
  };

  const handlePerformerLoginOrRegisterSuccess = (performerData: ProfileData) => {
      setActivePerformerProfile(performerData);
      // Also establish them as a potential rater to enable switching views.
      setRaterEmail(performerData.email);
      setFirstName(performerData.firstName);
      setLastName(performerData.lastName);
      setAuthState('LOGGED_IN');
      setActiveView('PROFILE');
  };

  const handlePerformerUpdate = (updatedData: ProfileData) => {
      setActivePerformerProfile(updatedData);
  };

  const handleNavigate = (page: Page) => {
    handleLogout(); // Clear any existing session before switching login types
    setCurrentPage(page);
  };

  const handleViewChange = (view: ActiveView) => {
    // If a performer tries to rate without a venue, show the venue selection screen first.
    if (view === 'RATING' && userType === 'performer' && !venueName) {
      setIsSelectingVenue(true);
    } else {
      setActiveView(view);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLogin = async (email: string) => {
    setAuthState('LOGGING_IN');
    setLoginError(null);
    try {
        const { user, userType } = await loginByEmail(email);
        if (userType === 'performer') {
            handlePerformerLoginOrRegisterSuccess(user);
        } else {
            // Logged in as audience, now they need to pick a venue
            setRaterEmail(user.email);
            setFirstName(user.firstName);
            setLastName(user.lastName);
            setAuthState('LOGGED_IN');
            setIsSelectingVenue(true); // Direct them to venue selection
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : "An unknown error occurred.";
        setLoginError(message);
        setAuthState('LOGGED_OUT');
    }
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
        setCurrentPage('LOGIN');
      } else {
        // Session is valid, log the user in
        setRaterEmail(email);
        setVenueName(venue);
        setFirstName(firstName);
        setLastName(lastName);
        setAuthState('LOGGED_IN');
        setActiveView('RATING');
      }
    }
  }, []);


  const fetchInitialData = useCallback(async () => {
    if (!venueName || !raterEmail) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const [
          performersData, 
          existingRatingsData, 
          todaysLeaderboardResult, 
          allTimeLeaderboardResult,
          tagsData, 
          raterStatsData, 
          scoutLevelsData
      ] = await Promise.all([
          getPerformers(venueName),
          getTodaysRatings(raterEmail, venueName),
          getLeaderboardData(venueName),
          getAllTimeLeaderboardData(venueName),
          getFeedbackTags(),
          getRaterStats(raterEmail),
          getScoutLevels()
      ]);

      setPerformers(performersData);
      setExistingRatings(existingRatingsData);
      setRaterStats(raterStatsData);
      setScoutLevels(scoutLevelsData);
      
      const todaysMap = todaysLeaderboardResult.reduce((acc, entry) => {
        acc[entry.id] = entry;
        return acc;
      }, {} as Record<string, LeaderboardEntry>);
      setTodaysStatsMap(todaysMap);
      
      const allTimeMap = allTimeLeaderboardResult.reduce((acc, entry) => {
        acc[entry.id] = entry;
        return acc;
      }, {} as Record<string, LeaderboardEntry>);
      setAllTimeStatsMap(allTimeMap);

      setFeedbackTags(tagsData);

    } catch (err) {
      setError('Failed to fetch performers or ratings. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [venueName, raterEmail]);

  useEffect(() => {
    if (authState === 'LOGGED_IN' && venueName && raterEmail) {
      fetchInitialData();
    }
  }, [authState, fetchInitialData, venueName, raterEmail]);

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
      
      // Refresh all relevant data to show immediate impact.
      const refreshData = async () => {
        try {
          const [todaysLeaderboardResult, newRaterStats, newAllTimeData] = await Promise.all([
            getLeaderboardData(venueName),
            getRaterStats(raterEmail),
            getAllTimeLeaderboardData(venueName),
          ]);

          const todaysMap = (todaysLeaderboardResult as LeaderboardEntry[]).reduce((acc, entry) => {
            acc[entry.id] = entry;
            return acc;
          }, {} as Record<string, LeaderboardEntry>);
          setTodaysStatsMap(todaysMap);

          setRaterStats(newRaterStats as RaterStats);
          
          const allTimeMap = (newAllTimeData as LeaderboardEntry[]).reduce((acc, entry) => {
            acc[entry.id] = entry;
            return acc;
          }, {} as Record<string, LeaderboardEntry>);
          setAllTimeStatsMap(allTimeMap);

        } catch (err) {
          console.error("Failed to refresh data after submission:", err);
        }
      };
      
      refreshData();

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
    setVenueName(null);
    setPerformers([]);
    setRatings({});
    setExistingRatings({});
    setAuthState('LOGGED_IN'); // Stay logged in, but go to venue selection
    setIsSelectingVenue(true);
  };

  const handleLogout = () => {
    // Clear rater-specific state
    setRaterEmail(null);
    setFirstName(null);
    setLastName(null);
    setVenueName(null);
    setAuthState('LOGGED_OUT');
    
    // Clear performer-specific state
    setActivePerformerProfile(null);
    
    // Clear data
    setPerformers([]);
    setRatings({});
    setExistingRatings({});
    
    // Reset to default login page and view
    setCurrentPage('LOGIN');
    setActiveView('RATING');
    setIsSelectingVenue(false);
    setLoginError(null);

    localStorage.removeItem('performer-rater-session');
  };

  const ratedCount = Object.keys(ratings).filter(id => ratings[id] && ratings[id].score > 0).length;
  const totalPerformers = performers.length;

  const userType: UserType = activePerformerProfile ? 'performer' : (authState === 'LOGGED_IN' ? 'audience' : null);

  const renderRatingContent = () => {
    if (isLoading) {
       return (
          <div className="flex flex-col justify-center items-center p-4 min-h-[50vh]">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-primary"></div>
              <p className="mt-4 text-gray-400">Loading performers...</p>
          </div>
       );
    }
    
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

    if (performers.length === 0) {
        return (
             <div className="text-center p-8 bg-gray-800 rounded-xl shadow-2xl animate-fade-in">
                <h2 className="text-2xl font-bold text-white mb-2">No Performers Found</h2>
                <p className="text-lg text-gray-400">There are no performers listed for this venue at this time.</p>
            </div>
        )
    }
    
    const sortedPerformers = [...performers].sort((a, b) => {
        const statsA = todaysStatsMap[a.id];
        const statsB = todaysStatsMap[b.id];
        if (!statsA || statsA.averageRating === 0) return 1;
        if (!statsB || statsB.averageRating === 0) return -1;
        if (statsB.averageRating !== statsA.averageRating) return statsB.averageRating - statsA.averageRating;
        return statsB.ratingCount - statsA.ratingCount;
    });

    const maxTodaysRatingCount = Math.max(0, ...Object.values(todaysStatsMap).map((s: LeaderboardEntry) => s.ratingCount));
    const maxAllTimeRatingCount = Math.max(0, ...Object.values(allTimeStatsMap).map((s: LeaderboardEntry) => s.ratingCount));

    return (
      <div className="space-y-4">
        {sortedPerformers.map((performer, index) => {
           const isRated = !!existingRatings[performer.id];
           const currentRatingInput = ratings[performer.id]?.score || 0;
           const currentTags = ratings[performer.id]?.tags || [];
           const currentComment = ratings[performer.id]?.comment || '';
           const todaysStats = todaysStatsMap[performer.id];
           const allTimeStats = allTimeStatsMap[performer.id];
           const defaultAllTimeStats: LeaderboardEntry = { id: performer.id, name: performer.name, averageRating: 0, ratingCount: 0, commentCount: 0, xp: 0 };

           return (
              <div key={performer.id} id={`performer-${performer.id}`} className="animate-slide-in-bottom scroll-mt-24" style={{ animationDelay: `${index * 100}ms`}}>
                <PerformerCard performer={performer} rank={index} ratingInput={currentRatingInput} onRatingChange={(rating) => handleRatingChange(performer.id, rating)} isRated={isRated} selectedTags={currentTags} onFeedbackChange={(tags) => handleFeedbackChange(performer.id, tags)} comment={currentComment} onCommentChange={(comment) => handleCommentChange(performer.id, comment)} todaysStats={todaysStats} allTimeStats={allTimeStats || defaultAllTimeStats} maxTodaysRatingCount={maxTodaysRatingCount} maxAllTimeRatingCount={maxAllTimeRatingCount} positiveTags={feedbackTags.positive} constructiveTags={feedbackTags.constructive} venueName={venueName || ''} />
              </div>
            );
        })}
      </div>
    );
  };
  
    const LocationConsentScreen = () => (
        <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm flex flex-col justify-center items-center p-4 z-50 animate-fade-in">
            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl max-w-lg text-center">
                <h2 className="text-2xl font-bold text-brand-accent mb-4">Location Verification Required</h2>
                <div className="text-gray-300 space-y-4 text-left">
                    <p>Your ratings are incredibly valuable—they help artists improve and unlock real-world opportunities, including paid gigs.</p>
                    <p>To ensure performers get the right chances, it's vital that all feedback comes from people who have <strong className="text-white">actually seen them perform at this event.</strong></p>
                    <p>That's why we need to quickly verify you're at the venue. We store your long and lat coordinates to let you know about future events nearby. <strong className="text-white">We do not track your device's movement.</strong></p>
                    <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                        <p className="font-semibold text-white">Your Browser Will Ask for Permission:</p>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li><strong className="text-red-500">Recommended:</strong> Select <strong className="text-emerald-400">"Allow while using the app"</strong> or <strong className="text-emerald-400">"Allow"</strong>. <span className="block text-xs text-gray-400">Grant permission just once for today's session—much easier!</span></li>
                            <li>Select <strong className="text-amber-400">"Only this time"</strong>. <span className="block text-xs text-gray-400">You will need to approve your location every time you submit ratings.</span></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                     <button onClick={() => setSubmissionStatus('IDLE')} className="bg-gray-600 text-white font-bold py-3 px-8 rounded-full hover:bg-gray-500 transition-colors w-full sm:w-auto">Cancel</button>
                     <Button onClick={handleConsentAndSubmit} className="bg-green-600 hover:bg-green-700 focus:ring-green-500 w-full sm:w-auto">Verify & Submit</Button>
                </div>
            </div>
        </div>
    );
    
  const getButtonText = () => {
      switch(submissionStatus) {
          case 'GETTING_LOCATION': return 'Verifying Location...';
          case 'SUBMITTING': return 'Submitting...';
          default: return 'Submit All Ratings';
      }
  }

  const renderPage = () => {
    // Priority 0: An already logged-in user needs to select a venue.
    if (isSelectingVenue) {
        return (
            <div className="flex flex-col items-center p-4">
                <LoginScreen
                    mode="CHANGE_VENUE"
                    onDetailsChanged={handleDetailsChanged}
                    onSwitchToRegister={() => {}} // Should not be visible in this mode
                    onLogin={() => {}} // Should not be visible in this mode
                    initialEmail={raterEmail}
                    initialFirstName={firstName}
                    initialLastName={lastName}
                />
            </div>
        );
    }

    // Priority 1: A user is logged in and has a venue. Use activeView to decide what to render.
    if (userType) {
        if (userType === 'performer' && activeView === 'PROFILE' && activePerformerProfile) {
            return (
                <div className="flex flex-col items-center p-4">
                    <ProfilePage 
                        performer={activePerformerProfile} 
                        onExit={() => handleViewChange('RATING')}
                        onUpdate={handlePerformerUpdate}
                    />
                </div>
            );
        }
        
        // Default view for ANY logged-in user (audience, or performer in rating mode) is the rating screen.
        return (
            <>
                <div className="max-w-4xl mx-auto p-4 sm:p-8">
                    <div className="pb-32">
                        {!isLoading && !error && !submissionResult && performers.length > 0 && (
                            <>
                                <div className="mt-8"><RunningOrder performers={performers} /></div>
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl sm:text-3xl font-bold text-white">Tonight's <span className="text-brand-primary">Leaderboard</span> & Rating Sheet</h2>
                                    <p className="text-gray-400 mt-2">Rate performers to see the leaderboard update in real-time.</p>
                                </div>
                            </>
                        )}
                        {renderRatingContent()}
                    </div>
                </div>
                {!isLoading && !error && !submissionResult && performers.length > 0 && (
                    <footer className="fixed bottom-0 left-0 right-0 z-20 p-4 pointer-events-none">
                        <div className="max-w-lg mx-auto pointer-events-auto flex flex-col items-center gap-3 text-center animate-slide-in-bottom">
                            <p className="text-sm text-white bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 shadow-lg">{ratedCount} of {totalPerformers - Object.keys(existingRatings).length} new performers rated.</p>
                            <Button onClick={handleInitialSubmit} disabled={ratedCount === 0 || submissionStatus !== 'IDLE'}>{getButtonText()}</Button>
                            {submissionError && (<p className="text-red-400 bg-red-900/50 p-3 rounded-lg w-full shadow-lg">{submissionError}</p>)}
                        </div>
                    </footer>
                )}
            </>
        );
    }

    // Priority 2: Checking a login token from email link (kept for compatibility)
    // Or showing universal login spinner
    if (authState === 'LOGGING_IN') {
        return (
            <div className="flex flex-col justify-center items-center p-4" style={{minHeight: 'calc(100vh - 5rem)'}}>
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-primary"></div>
                <p className="mt-4 text-gray-400">Logging in...</p>
            </div>
        );
    }

    // Default: Logged out. Show the appropriate page based on currentPage.
    if (currentPage === 'REGISTER') {
        return (
            <div className="flex flex-col items-center p-4">
                <PerformerLoginRegisterPage 
                  onLoginOrRegisterSuccess={handlePerformerLoginOrRegisterSuccess} 
                  onAudienceRegisterSuccess={handleDetailsChanged}
                  onSwitchToLogin={() => handleNavigate('LOGIN')} 
                />
            </div>
        );
    }
    
    // Default to login page
    return (
        <div className="flex flex-col items-center p-4">
            <LoginScreen
                mode="LOGIN"
                initialError={loginError}
                onLogin={handleLogin}
                onSwitchToRegister={() => handleNavigate('REGISTER')}
                onDetailsChanged={() => {}} // Not used in LOGIN mode
            />
        </div>
    );
  };

  let pageTitle: string | null = null;
  if (isSelectingVenue) {
    pageTitle = 'Select a Venue';
  } else if (userType) {
      if (activeView === 'PROFILE') {
          pageTitle = 'Profile';
      } else {
          pageTitle = venueName;
      }
  } else if (authState === 'LOGGING_IN') {
      pageTitle = 'Logging In...';
  } else if (currentPage === 'REGISTER') {
      pageTitle = 'Registration';
  } else {
      pageTitle = 'Login';
  }

  const userNameToShow = userType === 'performer' ? activePerformerProfile?.performingName : firstName;

  return (
    <div className="min-h-screen bg-gray-900 font-sans">
      <Header
          isLoggedIn={!!userType}
          userType={userType}
          userName={userNameToShow}
          raterStats={raterStats}
          scoutLevels={scoutLevels}
          onChangeDetails={handleChangeDetails}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          pageTitle={pageTitle}
          activeView={activeView}
          onViewChange={handleViewChange}
      />
      <main className="pt-20">
        {renderPage()}
      </main>
      {submissionStatus === 'AWAITING_CONSENT' && <LocationConsentScreen />}
    </div>
  );
};

export default App;
