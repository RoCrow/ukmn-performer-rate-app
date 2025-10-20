
import React from 'react';

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

export default Button;
