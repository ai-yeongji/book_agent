import React from 'react';
import { Book } from '../types';
import { Trophy, ChevronRight, ImageOff } from 'lucide-react';

interface BookCardProps {
  book: Book;
  onSelect: (book: Book) => void;
  selected: boolean;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onSelect, selected }) => {
  return (
    <div 
      onClick={() => onSelect(book)}
      className={`
        relative group cursor-pointer rounded-xl border p-4 transition-all duration-300 flex gap-4 overflow-hidden
        ${selected 
          ? 'border-indigo-600 bg-indigo-50 shadow-md ring-2 ring-indigo-200' 
          : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm'
        }
      `}
    >
      {/* Book Cover Image */}
      <div className="w-20 h-28 shrink-0 rounded-md overflow-hidden bg-slate-200 border border-slate-100 shadow-sm relative">
        {book.coverUrl ? (
          <img 
            src={book.coverUrl} 
            alt={book.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              // Fallback if image fails to load
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        
        {/* Fallback Icon */}
        <div className={`absolute inset-0 flex items-center justify-center text-slate-400 ${book.coverUrl ? 'hidden' : 'flex'}`}>
           <ImageOff size={24} />
        </div>

        {/* Rank Badge */}
        <div className={`
          absolute top-0 left-0 w-7 h-7 flex items-center justify-center text-xs font-bold rounded-br-lg z-10
          ${book.rank === 1 ? 'bg-yellow-400 text-yellow-900' : 'bg-slate-800 text-white'}
        `}>
          {book.rank}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
        <div>
          <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full inline-block mb-2">
            {book.keyword}
          </span>
          <h3 className="text-base font-bold text-slate-900 leading-tight mb-1 group-hover:text-indigo-700 transition-colors line-clamp-2">
            {book.title}
          </h3>
          <p className="text-xs text-slate-500 font-medium mb-1 truncate">{book.author}</p>
        </div>
        
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {book.description}
        </p>
      </div>

      {/* Selected Indicator */}
      {selected && (
        <div className="absolute top-4 right-4 text-indigo-600 animate-fade-in">
          <Trophy size={18} />
        </div>
      )}
      
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="text-slate-400" size={18} />
      </div>
    </div>
  );
};