import React, { useState, useEffect, useCallback } from 'react';

// --- TYPES (from types.ts) ---
interface Performer {
  id: string;
  name: string;
}

interface Rating {
  id: string;
  name: string;
  rating: number;
}

// --- MOCK SERVICE (from services/performerService.ts) ---
const getMockPerformers = (): Promise<Performer[]> => {
    const mockPerformers: Performer[] = [
      { id: '1', name: 'The Sonic Weavers' },
      { id: '2', name: 'DJ Electra' },
      { id: '3', name: 'Luna Hart' },
      { id: '4', name: 'Acoustic Echoes' },
      { id: '5', name: 'Rhythm Rebellion' },
    ];
    console.log("Fetching mock performers...");
    return new Promise((resolve) => {
        setTimeout(() => {
          resolve(mockPerformers);
          console.log("Mock performers fetched.");
        }, 800);
      });
};

const submitMockRatings = (ratings: Rating[]): Promise<{status: string}> => {
    console.log("Submitting mock ratings:", ratings);
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ status: 'success' });
            console.log("Mock ratings submitted successfully.");
        }, 1000);
    });
};


// --- REUSABLE COMPONENTS ---

// Button (from components/Button.tsx)
const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, ...props }) => (
  <button
    {...props}
    className="bg-brand-primary text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-violet-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-violet-400 transform hover:scale-105 w-full sm:w-auto"
  >
    {children}
  </button>
);

// StarRating (from components/StarRating.tsx)
const StarIcon: React.FC<{filled: boolean}> = ({filled}) => (
    <svg 
        className={`w-8 h-8 cursor-pointer transition-colors ${filled ? 'text-brand-accent' : 'text-gray-600'}`} 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor"
    >
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
);

const StarRating: React.FC<{count: number; rating: number; onRate: (rating: number) => void;}> = ({ count, rating, onRate }) => {
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

// PerformerCard (from components/PerformerCard.tsx)
const PerformerCard: React.FC<{performer: Performer; rating: number; onRatingChange: (rating: number) => void;}> = ({ performer, rating, onRatingChange }) => (
  <div className="bg-gray-800 rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 border border-gray-700 shadow-md transition-all duration-300 hover:shadow-lg hover:border-brand-primary/50">
    <h3 className="text-xl font-bold text-white text-center sm:text-left">{performer.name}</h3>
    <div className="flex-shrink-0">
      <StarRating count={5} rating={rating} onRate={onRatingChange} />
    </div>
  </div>
);

// Header (from components/Header.tsx)
const MusicNoteIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
);

const Header: React.FC = () => (
  <header className="text-center animate-fade-in">
    <div className="flex items-center justify-center gap-4">
      <MusicNoteIcon className="w-10 h-10 text-brand-primary" />
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
        Performer <span className="text-brand-primary">Rate</span>
      </h1>
    </div>
    <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
      Rate the live performances from today's event.
    </p>
  </header>
);


// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
  const [performers, setPerformers] = useState<Performer[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  useEffect(() => {
    const fetchPerformers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getMockPerformers();
        setPerformers(data);
      } catch (err) {
        setError('Failed to fetch performers. Please try again later.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPerformers();
  }, []);

  const handleRatingChange = (performerId: string, rating: number) => {
    setRatings(prevRatings => ({
      ...prevRatings,
      [performerId]: rating,
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmissionError(null);
    try {
      const ratingsToSubmit: Rating[] = Object.keys(ratings).map((performerId) => {
        const performer = performers.find(p => p.id === performerId)!;
        return {
          id: performerId,
          name: performer.name,
          rating: ratings[performerId],
        };
      });

      await submitMockRatings(ratingsToSubmit);
      setIsSubmitted(true);
      setRatings({});
      setTimeout(() => setIsSubmitted(false), 4000);
    } catch (err) {
      setSubmissionError('Submission Failed. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col justify-center items-center p-4 min-h-[300px]">
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
    
    if (isSubmitted) {
      return (
        <div className="text-center p-8 bg-gray-800 rounded-xl shadow-2xl animate-fade-in">
          <h2 className="text-3xl font-bold text-brand-accent mb-4">Thank You!</h2>
          <p className="text-lg text-gray-300">Your ratings have been submitted successfully.</p>
        </div>
      );
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
  
  const ratedCount = Object.keys(ratings).length;

  return (
    <div className="min-h-screen bg-gray-900 font-sans p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <Header />
        <main className="mt-12">
          {renderContent()}
          {!isLoading && !error && !isSubmitted && performers.length > 0 && (
            <footer className="mt-12 text-center animate-fade-in">
              <p className="mb-4 text-gray-400">{ratedCount} of {performers.length} performers rated.</p>
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
