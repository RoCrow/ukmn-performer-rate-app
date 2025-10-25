import React, { useState } from 'react';
import RegistrationForm from './RegistrationForm.tsx';
import LoginScreen from './LoginScreen.tsx';
import type { ProfileData } from '../App.tsx';

type RegistrationType = 'AUDIENCE' | 'PERFORMER';

interface PerformerLoginRegisterPageProps {
  onLoginOrRegisterSuccess: (data: ProfileData) => void;
  onAudienceRegisterSuccess: (details: { email: string, venue: string, firstName: string, lastName: string }) => void;
  onSwitchToLogin: () => void;
  defaultType?: RegistrationType | null;
}

const PerformerLoginRegisterPage: React.FC<PerformerLoginRegisterPageProps> = ({ 
  onLoginOrRegisterSuccess, 
  onAudienceRegisterSuccess,
  onSwitchToLogin,
  defaultType = null
}) => {
  const [registrationType, setRegistrationType] = useState<RegistrationType | null>(defaultType);

  const commonButtonClasses = 'w-full py-4 text-lg font-bold rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900';
  const selectedButtonClasses = 'bg-brand-primary text-white shadow-lg focus:ring-brand-primary';
  const unselectedButtonClasses = 'bg-gray-700 text-gray-300 hover:bg-gray-600 focus:ring-gray-500';

  return (
    <div className="w-full max-w-xl animate-fade-in">
        <div className="text-center mb-8">
            <p className="text-lg text-gray-400">
                How would you like to join? Select an option below to get started.
            </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <button 
              onClick={() => setRegistrationType('AUDIENCE')} 
              className={`${commonButtonClasses} ${registrationType === 'AUDIENCE' ? selectedButtonClasses : unselectedButtonClasses}`}
            >
              I'm an Audience Member
            </button>
            <button 
              onClick={() => setRegistrationType('PERFORMER')} 
              className={`${commonButtonClasses} ${registrationType === 'PERFORMER' ? selectedButtonClasses : unselectedButtonClasses}`}
            >
              I'm a Performer
            </button>
        </div>

        <div className="text-center mb-8">
            <button type="button" onClick={onSwitchToLogin} className="text-sm text-gray-400">
                Already have an account?{' '}
                <span className="font-semibold text-green-500 hover:underline">
                    Login here.
                </span>
            </button>
        </div>

        <div className="transition-opacity duration-500">
            {registrationType === 'PERFORMER' && (
                <div className="animate-fade-in">
                    <RegistrationForm onRegistrationSuccess={onLoginOrRegisterSuccess} />
                </div>
            )}
            {registrationType === 'AUDIENCE' && (
                <div className="animate-fade-in">
                    <LoginScreen
                        mode="AUDIENCE_REGISTER"
                        onDetailsChanged={onAudienceRegisterSuccess}
                        onLogin={() => {}} // Not used in this mode
                        onSwitchToRegister={() => {}} // Not used in this mode
                    />
                </div>
            )}
        </div>
    </div>
  );
};

export default PerformerLoginRegisterPage;