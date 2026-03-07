"use client";

import { useState } from 'react';
import { Search } from 'lucide-react';

export function SearchBar() {
  const [search, setSearch] = useState('');

  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
      <input
        type="text"
        placeholder="Buscar por número ou nome..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </div>
  );
}