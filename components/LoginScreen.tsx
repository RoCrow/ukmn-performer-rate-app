import React, { useState, useEffect } from 'react';
import Button from './Button';
import { requestLoginLink, getVenuesForToday } from '../services/performerService';

interface LoginScreenProps {
  initialError?: string | null;
}

type LoginState = 'IDLE' | 'SENDING' | 'SENT' | 'ERROR';

const LoginScreen: React.FC<LoginScreenProps> = ({ initialError }) => {
  const [email, setEmail] = useState('');
  const [venue, setVenue] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loginState, setLoginState] = useState<LoginState>('IDLE');

  const [venues, setVenues] = useState<string[]>([]);
  const [isVenuesLoading, setIsVenuesLoading] = useState<boolean>(true);
  const [venuesError, setVenuesError] = useState<string | null>(null);

  useEffect(() => {
      if(initialError) {
          setError(initialError);
          setLoginState('ERROR');
      }
  }, [initialError]);

  useEffect(() => {
      const fetchVenues = async () => {
          try {
              setIsVenuesLoading(true);
              setVenuesError(null);
              const fetchedVenues = await getVenuesForToday();
              setVenues(fetchedVenues);
              if (fetchedVenues.length > 0) {
                  setVenue(fetchedVenues[0]);
              }
          } catch(err) {
              const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
              setVenuesError(`Could not load venues: ${errorMessage}`);
          } finally {
              setIsVenuesLoading(false);
          }
      }
      fetchVenues();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !venue.trim() || !firstName.trim() || !lastName.trim()) {
      setError('All fields are required.');
      setLoginState('ERROR');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      setLoginState('ERROR');
      return;
    }
    
    setError(null);
    setLoginState('SENDING');

    try {
        await requestLoginLink(email, venue, firstName, lastName);
        setLoginState('SENT');
    } catch(err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to send login link: ${errorMessage}`);
        setLoginState('ERROR');
    }
  };

  if (loginState === 'SENT') {
      return (
        <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4 font-sans animate-fade-in text-center">
            <div className="w-full max-w-md bg-gray-800 p-8 rounded-xl shadow-2xl">
                <h2 className="text-3xl font-bold text-brand-accent mb-4">Check Your Inbox!</h2>
                <p className="text-lg text-gray-300">
                    A secure login link has been sent to <strong className="text-white">{email}</strong>. Please click the link to continue.
                </p>
                <p className="mt-4 text-sm text-gray-500">
                    (You can close this tab.)
                </p>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4 font-sans animate-fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
                Performer <span className="text-brand-primary">Rate</span>
            </h1>
          <p className="mt-4 text-lg text-gray-400">
            Enter your details to receive a login link.
          </p>
        </div>
        
        <form 
            onSubmit={handleSubmit}
            className="bg-gray-800 p-8 rounded-xl shadow-2xl space-y-6"
        >
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                    First Name
                    </label>
                    <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    aria-required="true"
                    disabled={loginState === 'SENDING'}
                    />
                </div>
                <div className="flex-1">
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                    Last Name
                    </label>
                    <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    aria-required="true"
                    disabled={loginState === 'SENDING'}
                    />
                </div>
            </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Your Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              aria-required="true"
              disabled={loginState === 'SENDING'}
            />
          </div>

          <div>
            <label htmlFor="venue" className="block text-sm font-medium text-gray-300 mb-2">
              Venue Name
            </label>
            <select
              id="venue"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed"
              aria-required="true"
              disabled={loginState === 'SENDING' || isVenuesLoading || venues.length === 0}
            >
                {isVenuesLoading && <option>Loading venues...</option>}
                {!isVenuesLoading && venues.length === 0 && <option>No events scheduled for today</option>}
                {venues.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            {venuesError && (
                <p className="text-sm text-red-400 mt-2">{venuesError}</p>
            )}
          </div>

          {(loginState === 'ERROR' && error) && (
            <p className="text-red-400 bg-red-900/30 text-center p-3 rounded-md">
              {error}
            </p>
          )}

          <div className="pt-2">
            <Button type="submit" className="w-full" disabled={loginState === 'SENDING' || isVenuesLoading || venues.length === 0}>
              {loginState === 'SENDING' ? 'Sending...' : 'Send Login Link'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;