import React from 'react';

export default function ShinyText({ 
  text, 
  disabled = false, 
  speed = 3, 
  className = '' 
}) {
  return (
    <span className={`inline-block ${className}`}>
      {text}
    </span>
  );
}
