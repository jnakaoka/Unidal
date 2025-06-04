import React from 'react';

export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ children, ...props }) => {
  return (
    <label className="block mb-1 font-medium text-gray-700" {...props}>
      {children}
    </label>
  );
};
