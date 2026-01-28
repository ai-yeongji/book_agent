import React from 'react';
import { BookOpen, Instagram } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <BookOpen size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Kyobo<span className="text-indigo-600">Seller</span> AI
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
             <span className="hidden sm:inline">Powered by Gemini</span>
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-100 border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-3xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>© {new Date().getFullYear()} BookContent AI. Data grounded by Google Search.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;