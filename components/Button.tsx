
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, className, ...props }) => {
  const defaultClasses = "bg-green-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-green-500 transform hover:scale-105";

  return (
    <button
      {...props}
      className={`${defaultClasses} ${className || ''}`}
    >
      {children}
    </button>
  );
};

export default Button;