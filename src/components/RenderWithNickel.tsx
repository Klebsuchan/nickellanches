import React from 'react';
import NickelText from './NickelText';

export default function RenderWithNickel({ text }: { text: string }) {
  if (!text || typeof text !== 'string') return <>{text}</>;
  
  // Case-insensitive replacement for 'nickel', but we want to split by it
  const parts = text.split(/(Nickel|NICKEL|nickel)/g);
  
  return (
    <>
      {parts.map((part, i) => {
        if (part.toLowerCase() === 'nickel') {
          return <span key={i}><NickelText /></span>;
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}
