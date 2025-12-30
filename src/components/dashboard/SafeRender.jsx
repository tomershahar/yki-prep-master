import React from 'react';

// Safe rendering utility component
export const SafeRender = ({ children, fallback = null }) => {
  try {
    return <>{children}</>;
  } catch (error) {
    console.error('Safe render error:', error);
    return fallback || <span className="text-red-500">Error loading content</span>;
  }
};

// Safe text rendering function
export const safeText = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'object') {
    if (value.en) return String(value.en);
    if (value.text) return String(value.text);
    if (value.title) return String(value.title);
    return fallback;
  }
  return String(value);
};

// Safe number rendering function
export const safeNumber = (value, fallback = 0) => {
  const num = Number(value);
  return isNaN(num) ? fallback : num;
};