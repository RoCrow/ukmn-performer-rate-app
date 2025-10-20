import React, { useState, useEffect, useCallback } from 'react';
import type { Performer, Rating } from './types';
import { getPerformers, submitRatings, requestLoginLink, loginWithToken } from './services/performerService';
import Header from './components/Header';
import PerformerCard from './components/PerformerCard';
import Button from './components/Button';
import LoginScreen from './components/LoginScreen';

type AuthState = 'LOGGED_OUT' | 'CHECKING_TOKEN' | 'LOGGED_IN' | 'TOKEN_ERROR';

const App: React.FC = () => {
  const [performers, setPerformers] = useState<Performer[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  
  const [raterEmail, setRaterEmail] = useState<string | null>(null);
  const [venueName, setVenueName] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthState>('LOGGED_OUT');
  const [tokenError, setTokenError] = useState<string | null>(null);


  useEffect(() => {
    // Check for a session in localStorage first
    const savedSession = localStorage.getItem('performer-rater-session');
    if (savedSession) {
      const { email, venue } = JSON.parse(savedSession);
      setRaterEmail(email);
      setVenueName(venue);
      setAuthState('LOGGED_IN');
      return;
    }

    // If no session, check for a login token in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      setAuthState('CHECKING_TOKEN');
      loginWithToken(token)
        .then(({ email, venue }) => {
          setRaterEmail(email);
          setVenueName(venue);
          setAuthState('LOGGED_IN');
          // Persist session
          localStorage.setItem('performer-rater-session', JSON.stringify({ email, venue }));
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


  const fetchPerformers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getPerformers();
      setPerformers(data);
    } catch (err) {
      setError('Failed to fetch performers. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authState === 'LOGGED_IN') {
      fetchPerformers();
    }
  }, [authState, fetchPerformers]);

  const handleRatingChange = (performerId: string, rating: number) => {
    setRatings(prevRatings => ({
      ...prevRatings,
      [performerId]: rating,
    }));
  };

  const handleSubmit = async () => {
    if (!raterEmail || !venueName) {
        setSubmissionError("Authentication error. Please log in again.");
        return;
    }
    setIsSubmitting(true);
    setSubmissionError(null);
    try {
      const ratingsToSubmit: Rating[] = Object.keys(ratings).map((performerId) => {
        const performer = performers.find(p => p.id === performerId);
        return {
          id: performerId,
          name: performer ? performer.name : 'Unknown Performer',
          rating: ratings[performerId],
        };
      });

      await submitRatings(ratingsToSubmit, raterEmail, venueName);
      setIsSubmitted(true);
      setRatings({});
      setTimeout(() => setIsSubmitted(false), 4000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setSubmissionError(`Submission Failed: ${errorMessage}`);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('performer-rater-session');
    setRaterEmail(null);
    setVenueName(null);
    setRatings({});
    setPerformers([]);
    setAuthState('LOGGED_OUT');
    setIsLoading(true);
  };

  const ratedCount = Object.keys(ratings).length;
  const totalPerformers = performers.length;

  if (authState === 'LOGGED_OUT' || authState === 'TOKEN_ERROR') {
    return <LoginScreen initialError={tokenError} />;
  }

  if (authState === 'CHECKING_TOKEN' || (authState === 'LOGGED_IN' && isLoading)) {
     return (
        <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-primary"></div>
            <p className="mt-4 text-gray-400">{authState === 'CHECKING_TOKEN' ? 'Verifying login...' : 'Loading performers...'}</p>
        </div>
     );
  }

  const renderContent = () => {
    if (error) {
      return (
        <div className="text-center text-red-400 bg-red-900/20 p-4 rounded-lg">
          <p>{error}</p>
        </div>
      );
    }
    
    if (isSubmitted) {
        return (
            <div className="text-center p-8 bg-gray-800 rounded-xl shadow-2xl animate-fade-in">
                <h2 className="text-3xl font-bold text-brand-accent mb-4">Thank You!</h2>
                <p className="text-lg text-gray-300">Your ratings have been submitted successfully.</p>
            </div>
        )
    }

    return (
      <div className="space-y-4">
        {performers.map((performer, index) => (
          <div key={performer.id} className="animate-slide-in-bottom" style={{ animationDelay: `${index * 100}ms`}}>
            <PerformerCard
              performer={performer}
              rating={ratings[performer.id] || 0}
              onRatingChange={(rating) => handleRatingChange(performer.id, rating)}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 font-sans p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <Header venueName={venueName} onLogout={handleLogout} />
        <main className="mt-12">
          {renderContent()}
          {!isLoading && !error && !isSubmitted && performers.length > 0 && (
            <footer className="mt-12 text-center animate-fade-in">
              <p className="mb-4 text-gray-400">{ratedCount} of {totalPerformers} performers rated.</p>
              <Button onClick={handleSubmit} disabled={ratedCount === 0 || isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit All Ratings'}
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