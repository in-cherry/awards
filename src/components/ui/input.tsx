import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = '', id, ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <div className="space-y-2">
      {label ? (
        <label
          htmlFor={inputId}
          className="block text-xs text-gray-400 font-bold uppercase tracking-widest"
        >
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={`w-full bg-black/25 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none focus:bg-black/35 transition-all ${className}`}
        {...props}
      />
    </div>
  );
}