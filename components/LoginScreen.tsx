import React, { useState, useEffect } from 'react';
import Button from './Button.tsx';
import { getVenuesForToday, runDiagnostics, loginOrCreateRater } from '../services/performerService.ts';

type ScreenMode = 'LOGIN' | 'AUDIENCE_REGISTER' | 'CHANGE_VENUE';

interface LoginScreenProps {
  mode: ScreenMode;
  initialError?: string | null;
  onDetailsChanged: (details: { email: string, venue: string, firstName: string, lastName: string }) => void;
  onLogin: (email: string) => void;
  onSwitchToRegister: () => void;
  initialEmail?: string | null;
  initialFirstName?: string | null;
  initialLastName?: string | null;
}

type SubmissionState = 'IDLE' | 'SUBMITTING' | 'ERROR';
type DiagnosticData = {
    today: string;
    timezone: string;
    debugData: {
        row: number;
        originalDate: any;
        dateType: string;
        isDateObject: boolean;
        normalizedDate: string | null;
    }[];
};


const LoginScreen: React.FC<LoginScreenProps> = ({ 
    mode,
    initialError,
    onDetailsChanged,
    onLogin,
    onSwitchToRegister,
    initialEmail,
    initialFirstName,
    initialLastName 
}) => {
  const [email, setEmail] = useState('');
  const [venue, setVenue] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submissionState, setSubmissionState] = useState<SubmissionState>('IDLE');
  const [privacyAccepted, setPrivacyAccepted] = useState(mode === 'CHANGE_VENUE'); // Auto-accept if they've already logged in

  const [venues, setVenues] = useState<string[]>([]);
  const [isVenuesLoading, setIsVenuesLoading] = useState<boolean>(true);
  const [venuesError, setVenuesError] = useState<string | null>(null);
  
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData | null>(null);
  const [diagnosticError, setDiagnosticError] = useState<string | null>(null);


  useEffect(() => {
      if(initialError) {
          setError(initialError);
          setSubmissionState('ERROR');
      }
  }, [initialError]);

  useEffect(() => {
      if (mode === 'CHANGE_VENUE') {
        if(initialEmail) setEmail(initialEmail);
        if(initialFirstName) setFirstName(initialFirstName);
        if(initialLastName) setLastName(initialLastName);
      }
  }, [mode, initialEmail, initialFirstName, initialLastName]);

  useEffect(() => {
      if (mode === 'AUDIENCE_REGISTER' || mode === 'CHANGE_VENUE') {
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
      } else {
        setIsVenuesLoading(false);
      }
  }, [mode]);
  
  const handleRunDiagnostics = async () => {
      setIsDiagnosing(true);
      setDiagnosticData(null);
      setDiagnosticError(null);
      try {
          const data = await runDiagnostics();
          setDiagnosticData(data);
      } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
          setDiagnosticError(`Diagnostic failed: ${errorMessage}`);
      } finally {
          setIsDiagnosing(false);
      }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    
    if (mode !== 'CHANGE_VENUE' && (!normalizedEmail || !/\S+@\S+\.\S+/.test(normalizedEmail))) {
        setError('Please enter a valid email address.');
        setSubmissionState('ERROR');
        return;
    }

    if (mode === 'LOGIN') {
        onLogin(normalizedEmail);
        return;
    }
    
    // Logic for AUDIENCE_REGISTER and CHANGE_VENUE
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (!venue.trim() || !trimmedFirstName || !trimmedLastName) {
      setError('All fields are required.');
      setSubmissionState('ERROR');
      return;
    }

    if (mode === 'AUDIENCE_REGISTER' && !privacyAccepted) {
        setError('You must accept the Privacy Policy to continue.');
        setSubmissionState('ERROR');
        return;
    }
    
    setError(null);
    setSubmissionState('SUBMITTING');

    try {
        await loginOrCreateRater(normalizedEmail, trimmedFirstName, trimmedLastName);
        if (onDetailsChanged) {
            onDetailsChanged({ email: normalizedEmail, venue, firstName: trimmedFirstName, lastName: trimmedLastName });
        }
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`An error occurred: ${errorMessage}`);
        setSubmissionState('ERROR');
    }
  };

  const renderDiagnostics = () => {
    if (diagnosticError) {
        return <div className="mt-4 p-4 bg-red-900/50 text-red-300 rounded-lg">{diagnosticError}</div>
    }
    if (diagnosticData) {
        return (
            <div className="mt-4 p-4 bg-gray-700 rounded-lg text-left text-sm font-mono">
                <h4 className="text-lg font-bold text-brand-accent mb-2">Diagnostic Report</h4>
                <p><span className="text-gray-400">Script's Timezone:</span> {diagnosticData.timezone}</p>
                <p className="mb-2"><span className="text-gray-400">Script's "Today":</span> {diagnosticData.today}</p>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="bg-gray-800 text-gray-300">
                                <th className="p-2 text-left">Row</th>
                                <th className="p-2 text-left">Original Date in Sheet</th>
                                <th className="p-2 text-left">Normalized Result</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-700">
                        {diagnosticData.debugData.map(d => (
                            <tr key={d.row} className="border-t border-gray-600">
                                <td className="p-2">{d.row}</td>
                                <td className="p-2">{String(d.originalDate) || '(empty)'}</td>
                                <td className={`p-2 ${d.normalizedDate === diagnosticData.today ? 'text-green-400' : 'text-amber-400'}`}>{d.normalizedDate || 'null'}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }
    return null;
  }
  
  const getTitle = () => {
      switch(mode) {
          case 'LOGIN': return 'Welcome back! Login to continue.';
          case 'AUDIENCE_REGISTER': return null;
          case 'CHANGE_VENUE': return 'Select a new venue to continue rating.';
      }
  }
  
  const title = getTitle();

  return (
    <div className="w-full max-w-xl animate-fade-in">
      {title && (
        <div className="text-center mb-8">
            <p className="text-lg text-gray-400">{title}</p>
        </div>
      )}
      
      <form 
          onSubmit={handleSubmit}
          className="bg-gray-800 p-8 rounded-xl shadow-2xl space-y-6"
      >
          {mode === 'AUDIENCE_REGISTER' && (
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
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-70 disabled:cursor-not-allowed"
                    aria-required="true"
                    disabled={submissionState === 'SUBMITTING'}
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
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-70 disabled:cursor-not-allowed"
                    aria-required="true"
                    disabled={submissionState === 'SUBMITTING'}
                    />
                </div>
            </div>
          )}

        {mode !== 'CHANGE_VENUE' && (
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
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-70 disabled:cursor-not-allowed"
                aria-required="true"
                disabled={submissionState === 'SUBMITTING'}
            />
            </div>
        )}

        {(mode === 'AUDIENCE_REGISTER' || mode === 'CHANGE_VENUE') && (
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
                disabled={isVenuesLoading || venues.length === 0}
            >
                {isVenuesLoading && <option>Loading venues...</option>}
                {!isVenuesLoading && venues.length === 0 && <option>No events scheduled for today</option>}
                {venues.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            {venuesError && (
                <div className="text-sm text-red-400 mt-2 text-center">
                    <p>{venuesError}</p>
                    <button type="button" onClick={handleRunDiagnostics} disabled={isDiagnosing} className="mt-2 text-xs text-brand-primary hover:underline disabled:text-gray-500">
                        {isDiagnosing ? 'Running Test...' : 'Run Diagnostic Test'}
                    </button>
                </div>
            )}
            {renderDiagnostics()}
            </div>
        )}
      
        {mode === 'AUDIENCE_REGISTER' && (
          <div className="flex items-start">
              <div className="flex items-center h-5">
              <input
                  id="privacy"
                  name="privacy"
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="focus:ring-brand-primary h-4 w-4 text-brand-primary border-gray-600 rounded bg-gray-700"
                  aria-required="true"
              />
              </div>
              <div className="ml-3 text-sm">
              <label htmlFor="privacy" className="font-medium text-gray-300">
                  I agree to the{' '}
                  <a 
                      href="https://ukmusiciansnetwork.com/privacy" 
                      className="text-brand-primary hover:underline" 
                      target="_blank" 
                      rel="noopener noreferrer"
                  >
                  Privacy Policy
                  </a>
              </label>
              </div>
          </div>
        )}


        {(submissionState === 'ERROR' && error) && (
          <p className="text-red-400 bg-red-900/30 text-center p-3 rounded-md">
            {error}
          </p>
        )}

        {mode === 'LOGIN' ? (
          <div className="pt-2 space-y-4">
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="w-full bg-gray-600 text-white font-bold py-3 px-8 rounded-full shadow-md hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-gray-500 transform hover:scale-105"
              disabled={submissionState === 'SUBMITTING'}
            >
              Register
            </button>
            <Button
              type="submit"
              className="w-full"
              disabled={submissionState === 'SUBMITTING'}
            >
              {submissionState === 'SUBMITTING' ? 'Logging In...' : 'Login'}
            </Button>
          </div>
        ) : (
          <div className="pt-2">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isVenuesLoading || (mode !== 'LOGIN' && venues.length === 0) || (mode === 'AUDIENCE_REGISTER' && !privacyAccepted) || submissionState === 'SUBMITTING'}
            >
              {submissionState === 'SUBMITTING' 
                ? 'Please wait...' 
                : (mode === 'CHANGE_VENUE' ? 'Update & Continue' : (mode === 'AUDIENCE_REGISTER' ? 'Start Rating' : 'Login'))}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};

export default LoginScreen;