import React, { useState, useRef } from 'react';
import Button from './Button.tsx';
import type { PerformerRegistrationData } from '../services/performerService.ts';
import { registerPerformer } from '../services/performerService.ts';

interface RegistrationFormProps {
  onSwitchToLogin: () => void;
}

type SubmissionState = 'IDLE' | 'SUBMITTING' | 'SUCCESS' | 'ERROR';

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSwitchToLogin }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        performingName: '',
        email: '',
        countryCode: '',
        mobile: '',
        bio: '',
        socialLink: '',
        streamingLink: '',
    });
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [submissionState, setSubmissionState] = useState<SubmissionState>('IDLE');
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Basic validation for image type and size
            if (!file.type.startsWith('image/')) {
                setError('Please select a valid image file (JPEG, PNG, GIF).');
                return;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError('Image size cannot exceed 5MB.');
                return;
            }
            setError(null);
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (!formData.performingName || !formData.email || !formData.firstName || !formData.lastName) {
            setError("First name, last name, performing name, and email are required.");
            return;
        }
        if (!imageFile) {
            setError("Please upload a thumbnail image.");
            return;
        }

        setSubmissionState('SUBMITTING');

        const reader = new FileReader();
        reader.readAsDataURL(imageFile);
        reader.onload = async () => {
            try {
                const base64String = (reader.result as string).split(',')[1];
                const registrationData: PerformerRegistrationData = {
                    ...formData,
                    imageBase64: base64String,
                    imageFileName: imageFile.name,
                    imageMimeType: imageFile.type,
                };
                await registerPerformer(registrationData);
                setSubmissionState('SUCCESS');
            } catch (err) {
                const message = err instanceof Error ? err.message : "An unknown error occurred.";
                setError(`Registration failed: ${message}`);
                setSubmissionState('ERROR');
            }
        };
        reader.onerror = () => {
            setError("Failed to read the image file.");
            setSubmissionState('ERROR');
        };
    };

    if (submissionState === 'SUCCESS') {
        return (
             <div className="bg-gray-800 p-8 rounded-xl shadow-2xl text-center">
                <h2 className="text-3xl font-bold text-brand-accent mb-4">Registration Complete!</h2>
                <p className="text-lg text-gray-300">Thank you, {formData.performingName}! Your profile has been successfully created. You will now appear on venue lists when scheduled by an event organizer.</p>
                <div className="mt-8">
                     <Button onClick={onSwitchToLogin} className="w-full">
                        Back to Login
                    </Button>
                </div>
            </div>
        )
    }

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
          Performer <span className="text-brand-primary">Registration</span>
        </h1>
        <p className="mt-4 text-lg text-gray-400">
          Create your artist profile to get rated and discovered.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-xl shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
                <input type="text" name="firstName" placeholder="First Name*" value={formData.firstName} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary" required />
                <input type="text" name="lastName" placeholder="Last Name*" value={formData.lastName} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary" required />
            </div>

            <input type="text" name="performingName" placeholder="Performing Name*" value={formData.performingName} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary" required />

            <div className="flex flex-col sm:flex-row gap-4">
                <input type="email" name="email" placeholder="Email Address*" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary" required />
                <div className="flex gap-2 w-full">
                    <input type="text" name="countryCode" placeholder="e.g. 44" value={formData.countryCode} onChange={handleInputChange} className="w-1/3 px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                    <input type="tel" name="mobile" placeholder="Mobile Number" value={formData.mobile} onChange={handleInputChange} className="w-2/3 px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                </div>
            </div>
            
            <textarea name="bio" placeholder="Your Bio (Tell us your story)" value={formData.bio} onChange={handleInputChange} rows={3} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"></textarea>

            <div className="flex flex-col sm:flex-row gap-4">
                <input type="url" name="socialLink" placeholder="Social Media Link (e.g., Instagram)" value={formData.socialLink} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                <input type="url" name="streamingLink" placeholder="Streaming Link (e.g., Spotify)" value={formData.streamingLink} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Thumbnail Image*</label>
                <div 
                    className="mt-2 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md cursor-pointer hover:border-brand-primary"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="space-y-1 text-center">
                        {imagePreview ? (
                            <img src={imagePreview} alt="Thumbnail preview" className="mx-auto h-24 w-24 rounded-full object-cover" />
                        ) : (
                            <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                        <div className="flex text-sm text-gray-400">
                            <p className="pl-1">{imageFile ? `${imageFile.name}` : 'Upload a file (PNG, JPG, GIF up to 5MB)'}</p>
                        </div>
                    </div>
                </div>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" ref={fileInputRef} onChange={handleImageChange} accept="image/png, image/jpeg, image/gif" />
            </div>

            {error && (
                <p className="text-red-400 bg-red-900/30 text-center p-3 rounded-md">{error}</p>
            )}

            <div className="pt-2">
                <Button type="submit" className="w-full" disabled={submissionState === 'SUBMITTING'}>
                    {submissionState === 'SUBMITTING' ? 'Registering...' : 'Register Profile'}
                </Button>
            </div>
             <div className="text-center pt-4">
                <button type="button" onClick={onSwitchToLogin} className="text-sm text-brand-primary hover:underline">
                    Already registered or want to rate? Log in here.
                </button>
            </div>
      </form>
    </>
  );
};

export default RegistrationForm;