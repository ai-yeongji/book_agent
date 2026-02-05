import React, { useState, useCallback, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import { BookCard } from './components/BookCard';
import { ResultDisplay } from './components/ResultDisplay';
import { fetchKyoboBestsellers, generateSocialContent, generateImagesForScenes, generateImage } from './services/openaiService';
import { Book, AppState, GeneratedContent } from './types';
import { Search, Loader2, Sparkles, AlertCircle, BookOpen } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [books, setBooks] = useState<Book[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [generatedResult, setGeneratedResult] = useState<GeneratedContent | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Scanning Bookshelf...");
  
  // Ref to hold the interval ID so we can clear it if the component unmounts or state changes
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearLoadingInterval = () => {
    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
      loadingIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearLoadingInterval();
  }, []);

  const handleFetchBooks = useCallback(async () => {
    setState(AppState.SEARCHING);
    setErrorMsg("");
    
    // Cycle through loading messages to keep user engaged
    const messages = [
      "Connecting to Kyobo Book Centre...",
      "Accessing weekly bestseller charts...",
      "Analyzing book trends and keywords...",
      "Retrieving cover images...",
      "Finalizing book data..."
    ];
    let msgIndex = 0;
    setLoadingMessage(messages[0]);
    
    clearLoadingInterval();
    loadingIntervalRef.current = setInterval(() => {
      msgIndex = (msgIndex + 1) % messages.length;
      setLoadingMessage(messages[msgIndex]);
    }, 2500); // Change message every 2.5 seconds

    try {
      const data = await fetchKyoboBestsellers();
      setBooks(data.books);
      setSources(data.sourceUrls);
      setState(AppState.SELECTING);
    } catch (e) {
      console.error(e);
      setErrorMsg("Failed to retrieve bestseller data. Please check your network or try again.");
      setState(AppState.ERROR);
    } finally {
      clearLoadingInterval();
    }
  }, []);

  const handleGenerate = async (type: 'instagram_post' | 'reels_script') => {
    if (!selectedBook) return;
    
    setState(AppState.GENERATING);
    setGeneratedResult(null);
    setIsGeneratingImages(false);

    try {
      // 1. Generate Text Content (Script or Caption)
      const result = await generateSocialContent(selectedBook, type);
      setGeneratedResult(result);
      setState(AppState.RESULT);

      // 2. Background Image Generation Logic with Cover Reference
      const coverUrl = selectedBook.coverUrl;

      // A) For Reels: Generate images for each scene
      if (type === 'reels_script' && result.scenes && result.scenes.length > 0) {
        setIsGeneratingImages(true);
        generateImagesForScenes(result.scenes, coverUrl, selectedBook.title).then((updatedScenes) => {
           setGeneratedResult(prev => {
             if (!prev) return null;
             return { ...prev, scenes: updatedScenes };
           });
           setIsGeneratingImages(false);
        }).catch(err => {
           console.error("Background image generation failed", err);
           setIsGeneratingImages(false);
        });
      }

      // B) For Post: Generate a single cover image
      if (type === 'instagram_post' && result.imagePrompt) {
        setIsGeneratingImages(true);
        generateImage(result.imagePrompt, coverUrl, selectedBook.title).then((url) => {
          setGeneratedResult(prev => {
            if (!prev) return null;
            return { ...prev, imageUrl: url };
          });
          setIsGeneratingImages(false);
        }).catch(err => {
          console.error("Background cover generation failed", err);
          setIsGeneratingImages(false);
        });
      }

    } catch (e) {
      console.error(e);
      setErrorMsg("Failed to generate content.");
      setState(AppState.ERROR);
    }
  };

  const handleReset = () => {
    setGeneratedResult(null);
    setIsGeneratingImages(false);
    setState(AppState.SELECTING);
  };

  const handleFullReset = () => {
    clearLoadingInterval();
    setBooks([]);
    setSelectedBook(null);
    setGeneratedResult(null);
    setIsGeneratingImages(false);
    setState(AppState.IDLE);
  };

  return (
    <Layout>
      {/* Error Banner */}
      {state === AppState.ERROR && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="text-red-800 font-medium">Error Occurred</h3>
            <p className="text-red-600 text-sm mt-1">{errorMsg}</p>
            <button 
              onClick={handleFullReset}
              className="mt-3 text-xs font-semibold text-red-700 hover:text-red-900 underline"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* State: IDLE */}
      {state === AppState.IDLE && (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
          <div className="bg-indigo-100 p-6 rounded-full mb-6">
            <BookOpen size={48} className="text-indigo-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            베스트셀러, AI가 추천해드립니다
          </h2>
          <p className="text-slate-500 max-w-md mb-8 leading-relaxed">
            점메추 말고 <span className="font-semibold text-indigo-600">베셀추!</span><br/>
            베스트셀러로 바이럴 콘텐츠를 자동 생성하세요
          </p>
          <button
            onClick={handleFetchBooks}
            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-full font-semibold shadow-lg hover:bg-indigo-600 hover:shadow-indigo-200 transition-all duration-300 transform hover:-translate-y-1"
          >
            <Search size={20} className="group-hover:scale-110 transition-transform" />
            <span>베스트셀러 검색</span>
          </button>
        </div>
      )}

      {/* State: SEARCHING */}
      {state === AppState.SEARCHING && (
        <div className="flex flex-col items-center justify-center py-32 animate-pulse">
          <Loader2 size={48} className="text-indigo-600 animate-spin mb-4" />
          <h3 className="text-xl font-medium text-slate-900 transition-all duration-300 min-h-[1.75rem]">
            {loadingMessage}
          </h3>
          <p className="text-slate-500 text-sm mt-2">알라딘 베스트셀러를 분석 중...</p>
        </div>
      )}

      {/* State: SELECTING or GENERATING */}
      {(state === AppState.SELECTING || state === AppState.GENERATING) && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">베스트셀러 TOP 10</h2>
              <p className="text-slate-500 text-sm mt-1">책을 선택하면 콘텐츠를 생성해드려요</p>
              <p className="text-slate-400 text-xs mt-0.5">📚 알라딘 베스트셀러 기준</p>
            </div>
            <button onClick={handleFullReset} className="text-sm text-slate-400 hover:text-slate-600">
              Reset
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {books.map((book) => (
              <BookCard 
                key={book.title} 
                book={book} 
                onSelect={setSelectedBook} 
                selected={selectedBook?.title === book.title}
              />
            ))}
          </div>

          {sources.length > 0 && (
            <div className="text-xs text-slate-400 mt-2">
              <a href={sources[0]} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-500 underline">
                알라딘 베스트셀러 바로가기 →
              </a>
            </div>
          )}

          {/* Sticky Action Bar */}
          <div className={`
            fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-lg px-4 transition-all duration-500 z-40
            ${selectedBook ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}
          `}>
            <div className="bg-slate-900/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-700/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-300 truncate max-w-[200px]">
                  {selectedBook?.title}
                </span>
                <span className="text-xs bg-indigo-600 px-2 py-0.5 rounded text-white">Selected</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleGenerate('instagram_post')}
                  disabled={state === AppState.GENERATING}
                  className="flex-1 bg-white text-slate-900 py-3 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {state === AppState.GENERATING ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16} />}
                  Post Caption
                </button>
                <button
                  onClick={() => handleGenerate('reels_script')}
                  disabled={state === AppState.GENERATING}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity flex justify-center items-center gap-2 disabled:opacity-50"
                >
                   {state === AppState.GENERATING ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16} />}
                  Reels Storyboard
                </button>
              </div>
            </div>
          </div>
          
          {/* Spacer for sticky bar */}
          <div className="h-32"></div>
        </div>
      )}

      {/* State: RESULT */}
      {state === AppState.RESULT && generatedResult && (
        <div className="max-w-3xl mx-auto">
          <ResultDisplay 
            result={generatedResult} 
            onReset={handleReset} 
            isGeneratingImages={isGeneratingImages}
          />
        </div>
      )}
    </Layout>
  );
};

export default App;