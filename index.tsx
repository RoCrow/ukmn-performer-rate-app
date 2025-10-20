
import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';

// =================================================================================
// TYPES (from types.ts)
// =================================================================================
export interface Performer {
  id: string;
  name: string;
}

export interface Rating {
  id: string;
  name: string;
  rating: number;
}


// =================================================================================
// SERVICES (from services/performerService.ts)
// =================================================================================
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwVzj7Czo4ae1mWFIs2FFkCfF1kyO-5IwJUkT2g4RQiUCgiRO0nOA64k9ysOex6CFjI/exec';

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
            if (errorText.toLowerCase().includes('<html')) {
                throw new Error(`The server returned an HTML error page (Status: ${response.status}). This strongly indicates a permission issue with your Google Apps Script.`);
            }
            try {
                const errorJson = JSON.parse(errorText);
                throw new Error(errorJson.message || `The server responded with an error: ${response.status}`);
            } catch (e) {
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
        throw error;
    }
};

const requestLoginLink = async (email: string, venueName: string): Promise<void> => {
    await postToWebApp({ action: 'requestLogin', email, venueName });
};

const loginWithToken = async (token: string): Promise<{ email: string, venue: string }> => {
    const result = await postToWebApp({ action: 'verifyToken', token });
    return { email: result.email, venue: result.venue };
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
};

const getPerformers = async (): Promise<Performer[]> => {
  try {
    const result = await postToWebApp({ action: 'getPerformers' });
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

const submitRatings = async (ratings: Rating[], raterEmail: string, venueName: string): Promise<void> => {
  const payload = {
    action: 'submitRatings',
    ratings,
    raterEmail,
    venueName,
  };
  await postToWebApp(payload);
};


// =================================================================================
// COMPONENT: Button (from components/Button.tsx)
// =================================================================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, ...props }) => {
  return (
    <button
      {...props}
      className="bg-brand-primary text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-violet-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-violet-400 transform hover:scale-105"
    >
      {children}
    </button>
  );
};

// =================================================================================
// COMPONENT: LoginScreen (from components/LoginScreen.tsx)
// =================================================================================
interface LoginScreenProps {
  initialError?: string | null;
}

type LoginState = 'IDLE' | 'SENDING' | 'SENT' | 'ERROR';

const LoginScreen: React.FC<LoginScreenProps> = ({ initialError }) => {
  const [email, setEmail] = useState('');
  const [venue, setVenue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loginState, setLoginState] = useState<LoginState>('IDLE');

  useEffect(() => {
      if(initialError) {
          setError(initialError);
          setLoginState('ERROR');
      }
  }, [initialError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !venue.trim()) {
      setError('Both email and venue name are required.');
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
        await requestLoginLink(email, venue);
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
            <input
              type="text"
              id="venue"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g., The Grand Concert Hall"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              aria-required="true"
              disabled={loginState === 'SENDING'}
            />
          </div>

          {(loginState === 'ERROR' && error) && (
            <p className="text-red-400 bg-red-900/30 text-center p-3 rounded-md">
              {error}
            </p>
          )}

          <div className="pt-2">
            <Button type="submit" className="w-full" disabled={loginState === 'SENDING'}>
              {loginState === 'SENDING' ? 'Sending...' : 'Send Login Link'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =================================================================================
// COMPONENT: StarRating (from components/StarRating.tsx)
// =================================================================================
interface StarRatingProps {
  count: number;
  rating: number;
  onRate: (rating: number) => void;
}

const StarIcon: React.FC<{filled: boolean; className?: string}> = ({filled, className}) => (
    <svg 
        className={`w-8 h-8 cursor-pointer ${className} ${filled ? 'text-brand-accent' : 'text-gray-600'}`} 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor"
    >
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
);

const StarRating: React.FC<StarRatingProps> = ({ count, rating, onRate }) => {
  const [hoverRating, setHoverRating] = useState(0);
  const stars = Array.from({ length: count }, (_, i) => i + 1);
  return (
    <div className="flex items-center space-x-1">
      {stars.map((starValue) => (
        <button
          key={starValue}
          onMouseEnter={() => setHoverRating(starValue)}
          onMouseLeave={() => setHoverRating(0)}
          onClick={() => onRate(starValue)}
          aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
          className="transition-transform duration-200 ease-in-out hover:scale-125 focus:outline-none focus:ring-2 focus:ring-brand-accent rounded-full"
        >
          <StarIcon filled={(hoverRating || rating) >= starValue} />
        </button>
      ))}
    </div>
  );
};


// =================================================================================
// COMPONENT: PerformerCard (from components/PerformerCard.tsx)
// =================================================================================
interface PerformerCardProps {
  performer: Performer;
  rating: number;
  onRatingChange: (rating: number) => void;
}

const PerformerCard: React.FC<PerformerCardProps> = ({ performer, rating, onRatingChange }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 border border-gray-700 shadow-md transition-all duration-300 hover:shadow-lg hover:border-brand-primary/50">
      <h3 className="text-xl font-bold text-white text-center sm:text-left">{performer.name}</h3>
      <div className="flex-shrink-0">
        <StarRating
          count={5}
          rating={rating}
          onRate={onRatingChange}
        />
      </div>
    </div>
  );
};

// =================================================================================
// COMPONENT: Header (from components/Header.tsx)
// =================================================================================
const MusicNoteIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
);

interface HeaderProps {
    venueName?: string | null;
    onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ venueName, onLogout }) => {
  return (
    <header className="text-center animate-fade-in relative">
        <div className="flex items-center justify-center gap-4">
            <MusicNoteIcon className="w-10 h-10 text-brand-primary" />
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
                Performer <span className="text-brand-primary">Rate</span>
            </h1>
        </div>
      <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
        {venueName ? `Rating performances at: ${venueName}` : "Rate the live performances from today's event."}
      </p>
      {onLogout && (
          <div className="absolute top-0 right-0">
                <button 
                    onClick={onLogout}
                    className="text-sm text-gray-400 hover:text-white bg-gray-800/50 px-3 py-1 rounded-md transition-colors"
                    aria-label="Change rater or venue"
                >
                    Change
                </button>
          </div>
      )}
    </header>
  );
};


// =================================================================================
// COMPONENT: App (from App.tsx)
// =================================================================================
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
    const savedSession = localStorage.getItem('performer-rater-session');
    if (savedSession) {
      const { email, venue } = JSON.parse(savedSession);
      setRaterEmail(email);
      setVenueName(venue);
      setAuthState('LOGGED_IN');
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      setAuthState('CHECKING_TOKEN');
      loginWithToken(token)
        .then(({ email, venue }) => {
          setRaterEmail(email);
          setVenueName(venue);
          setAuthState('LOGGED_IN');
          localStorage.setItem('performer-rater-session', JSON.stringify({ email, venue }));
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch(err => {
          setAuthState('TOKEN_ERROR');
          setTokenError(err.message || 'The login link is invalid or has expired.');
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

// =================================================================================
// ERROR BOUNDARY & RENDER
// =================================================================================

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error: error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Caught an error by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ backgroundColor: '#111827', color: '#f3f4f6', fontFamily: 'monospace', padding: '2rem', height: '100vh', boxSizing: 'border-box' }}>
          <h1 style={{ color: '#ef4444', fontSize: '1.5rem', borderBottom: '1px solid #374151', paddingBottom: '1rem' }}>Application Error</h1>
          <p style={{ color: '#d1d5db', marginTop: '1rem' }}>Something went wrong while rendering the application.</p>
          <pre style={{ backgroundColor: '#1f2937', color: '#e5e7eb', padding: '1rem', borderRadius: '0.5rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all', marginTop: '1rem', border: '1px solid #374151' }}>
            {this.state.error && this.state.error.toString()}
          </pre>
          <details style={{ marginTop: '1.5rem', color: '#9ca3af' }}>
            <summary style={{ cursor: 'pointer', outline: 'none' }}>Click to see component stack trace</summary>
            <pre style={{ backgroundColor: '#1f2937', padding: '1rem', borderRadius: '0.5rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all', marginTop: '0.5rem', border: '1px solid #374151' }}>
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
