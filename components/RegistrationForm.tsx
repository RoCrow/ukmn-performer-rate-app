

import React, { useState, useRef, useEffect } from 'react';
import Button from './Button.tsx';
import type { PerformerRegistrationData } from '../services/performerService.ts';
import { registerPerformer } from '../services/performerService.ts';
import CountryCodeSelect from './CountryCodeSelect.tsx';
import type { ProfileData } from '../App.tsx';

interface RegistrationFormProps {
  onRegistrationSuccess: (data: ProfileData) => void;
}

type SubmissionState = 'IDLE' | 'SUBMITTING' | 'SUCCESS' | 'ERROR';
type ProcessedImage = {
    base64: string;
    name: string;
    type: string;
};

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onRegistrationSuccess }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        performingName: '',
        email: '',
        countryCode: '44',
        mobile: '',
        bio: '',
        socialLink: '',
        streamingLink: '',
    });
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(null);
    const [submissionState, setSubmissionState] = useState<SubmissionState>('IDLE');
    const [error, setError] = useState<string | null>(null);
    const [registeredData, setRegisteredData] = useState<ProfileData | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (submissionState === 'SUCCESS' && registeredData) {
            onRegistrationSuccess(registeredData);
        }
    }, [submissionState, registeredData, onRegistrationSuccess]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleCountryCodeChange = (code: string) => {
        setFormData(prev => ({ ...prev, countryCode: code }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image file (JPEG, PNG, GIF).');
            return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            setError('Image size cannot exceed 5MB.');
            return;
        }
        
        setError(null);

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    setError("Could not process image.");
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.9); // Convert to JPEG with 90% quality
                const base64 = dataUrl.split(',')[1];
                const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";

                setImagePreview(dataUrl);
                setProcessedImage({
                    base64,
                    name: newFileName,
                    type: 'image/jpeg'
                });
            };
        };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (!formData.performingName || !formData.email || !formData.firstName || !formData.lastName) {
            setError("First name, last name, performing name, and email are required.");
            return;
        }
        if (!processedImage) {
            setError("Please upload a thumbnail image.");
            return;
        }

        setSubmissionState('SUBMITTING');
        
        try {
            const { socialLink, streamingLink, ...restOfFormData } = formData;
            
            let finalSocialLink = socialLink.trim();
            if (finalSocialLink && !finalSocialLink.startsWith('http://') && !finalSocialLink.startsWith('https://')) {
                finalSocialLink = `https://${finalSocialLink}`;
            }

            let finalStreamingLink = streamingLink.trim();
            if (finalStreamingLink && !finalStreamingLink.startsWith('http://') && !finalStreamingLink.startsWith('https://')) {
                finalStreamingLink = `https://${finalStreamingLink}`;
            }

            const registrationData: PerformerRegistrationData = {
                ...restOfFormData,
                email: formData.email.trim().toLowerCase(),
                socialLink: finalSocialLink,
                streamingLink: finalStreamingLink,
                imageBase64: processedImage.base64,
                imageFileName: processedImage.name,
                imageMimeType: processedImage.type,
            };
            const { userId } = await registerPerformer(registrationData);
            
            setRegisteredData({ ...registrationData, image: imagePreview!, id: userId });
            setSubmissionState('SUCCESS');
        } catch (err) {
            const message = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(`Registration failed: ${message}`);
            setSubmissionState('ERROR');
        }
    };

  return (
    <form onSubmit={handleSubmit} className="w-full bg-gray-800 p-8 rounded-xl shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">First Name*</label>
                <input type="text" id="firstName" name="firstName" placeholder="First name..." value={formData.firstName} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary" required />
            </div>
            <div className="flex-1">
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">Last Name*</label>
                <input type="text" id="lastName" name="lastName" placeholder="Last name..." value={formData.lastName} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary" required />
            </div>
        </div>
        
        <div>
                <label htmlFor="performingName" className="block text-sm font-medium text-gray-300 mb-2">Performing Name*</label>
            <input type="text" id="performingName" name="performingName" placeholder="Your artist or band name" value={formData.performingName} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary" required />
        </div>


        <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full">
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Email Address*</label>
                <input type="email" id="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary" required />
            </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-2/5">
                <label htmlFor="countryCode" className="block text-sm font-medium text-gray-300 mb-2">Country Code</label>
                <CountryCodeSelect
                    value={formData.countryCode}
                    onChange={handleCountryCodeChange}
                />
            </div>
            <div className="w-3/5">
                <label htmlFor="mobile" className="block text-sm font-medium text-gray-300 mb-2">Mobile Number</label>
                <input type="tel" id="mobile" name="mobile" placeholder="Your mobile number" value={formData.mobile} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
        </div>
        
        <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-2">Your Bio</label>
            <textarea id="bio" name="bio" placeholder="Tell us your story" value={formData.bio} onChange={handleInputChange} rows={3} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary"></textarea>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full">
                <label htmlFor="socialLink" className="block text-sm font-medium text-gray-300 mb-2">Social Media Link</label>
                <input type="text" id="socialLink" name="socialLink" placeholder="e.g. instagram.com/your-profile" value={formData.socialLink} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div className="w-full">
                <label htmlFor="streamingLink" className="block text-sm font-medium text-gray-300 mb-2">Streaming Link</label>
                <input type="text" id="streamingLink" name="streamingLink" placeholder="e.g. spotify.com/your-artist-page" value={formData.streamingLink} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
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
                    <div className="flex text-sm text-gray-400 justify-center">
                        <p className="pl-1">{processedImage ? `${processedImage.name}` : 'Upload a file (PNG, JPG, GIF up to 5MB)'}</p>
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
    </form>
  );
};

export default RegistrationForm;