import React from 'react';

export const CanopyCarapace: React.FC = () => (
  <svg
    aria-hidden="true"
    className="pointer-events-none absolute inset-x-0 top-0 z-20 h-8 w-full overflow-visible"
    viewBox="0 0 1440 32"
    preserveAspectRatio="none"
  >
    <defs>
      <linearGradient id="carapace-gold" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#fff8d6" />
        <stop offset="0.28" stopColor="#f5c441" />
        <stop offset="0.58" stopColor="#E0CA3C" />
        <stop offset="0.82" stopColor="#b8861b" />
        <stop offset="1" stopColor="#634305" />
      </linearGradient>
      <linearGradient id="carapace-edge" x1="0" x2="1">
        <stop offset="0" stopColor="#634305" stopOpacity="0" />
        <stop offset="0.16" stopColor="#b8861b" />
        <stop offset="0.5" stopColor="#fff8d6" />
        <stop offset="0.84" stopColor="#b8861b" />
        <stop offset="1" stopColor="#634305" stopOpacity="0" />
      </linearGradient>
      <radialGradient id="carapace-gem" cx="50%" cy="25%" r="75%">
        <stop offset="0" stopColor="#fff8d6" />
        <stop offset="0.42" stopColor="#f5c441" />
        <stop offset="1" stopColor="#634305" />
      </radialGradient>
    </defs>
    <path
      d="M0 2H548l26 5h292l26-5h548v5h-536l-27 5H589l-27-5H0z"
      fill="url(#carapace-gold)"
      stroke="#634305"
      strokeWidth="1"
    />
    <path d="M38 3H535M905 3h497" stroke="url(#carapace-edge)" strokeWidth="1" />
    <path
      d="M0 14h558l28 5h268l28-5h558"
      fill="none"
      stroke="url(#carapace-edge)"
      strokeWidth="2"
    />
    <path d="M570 8l-14 5 14 4M870 8l14 5-14 4" fill="#b8861b" stroke="#fff8d6" strokeWidth="0.8" />
    <path d="M720 5l17 7-17 15-17-15z" fill="url(#carapace-gem)" stroke="#fff8d6" strokeWidth="1.2" />
    <path d="M720 8l8 4-8 8-8-8z" fill="none" stroke="#634305" strokeWidth="1" />
    <circle cx="720" cy="12" r="2" fill="#fff8d6" />
    <path d="M698 12h-16m60 0h-20" stroke="#E0CA3C" strokeWidth="1" />
  </svg>
);
