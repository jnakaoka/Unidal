import React from 'react';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className="border border-gray-300 p-2 rounded w-full"
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';
