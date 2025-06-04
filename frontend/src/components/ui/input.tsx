import React from 'react';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ ...props }, ref) => {
    return (
      <input
        ref={ref}
        className="border border-gray-300 p-2 rounded w-full"
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
