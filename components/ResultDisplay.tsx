import React, { useState } from 'react';
import { GeneratedContent, Scene } from '../types';
import { Copy, Check, Instagram, Video, Image as ImageIcon, Loader2, ExternalLink, Link as LinkIcon, ImageOff, Share2, Download, ClipboardCheck } from 'lucide-react';

interface ResultDisplayProps {
  result: GeneratedContent;
  onReset: () => void;
  isGeneratingImages?: boolean;
}

// Helper to convert Base64 DataURI to Blob for sharing
const dataURItoBlob = (dataURI: string) => {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
};

// A Notion-style Link Preview Card Component
const ReferenceImageCard: React.FC<{ url?: string }> = ({ url }) => {
  const [hasError, setHasError] = useState(false);

  if (!url) return null;

  if (hasError) {
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors group bg-white h-full"
      >
        <div className="shrink-0 w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-slate-400 group-hover:text-indigo-500">
          <LinkIcon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-0.5">Reference Link</div>
          <div className="text-sm font-medium text-slate-700 truncate">Book Cover Source</div>
          <div className="text-xs text-slate-400 truncate opacity-75">{url}</div>
        </div>
        <ExternalLink size={14} className="text-slate-300 group-hover:text-slate-500 shrink-0" />
      </a>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100 group h-full">
      <img
        src={url}
        alt="Original Reference"
        className="w-full h-full object-cover"
        onError={() => setHasError(true)}
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <a href={url} target="_blank" rel="noopener noreferrer" className="bg-white/90 p-1.5 rounded-full text-slate-700 hover:text-indigo-600 shadow-sm block">
          <ExternalLink size={14} />
        </a>
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] font-medium px-3 py-1.5 backdrop-blur-sm">
         Original Reference
      </div>
    </div>
  );
};

const StoryboardScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(scene.imagePrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 border border-slate-200 rounded-xl bg-white hover:border-indigo-200 transition-colors">
      {/* Visual / Image */}
      <div className="w-full md:w-1/3 shrink-0">
        <div className="aspect-[9/16] bg-slate-100 rounded-lg overflow-hidden border border-slate-200 relative">
          {scene.imageUrl ? (
            <img src={scene.imageUrl} alt={`Scene ${scene.sceneNumber}`} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-4 text-center">
              <Loader2 className="animate-spin mb-2" size={24} />
              <span className="text-xs">Generating Visual...</span>
            </div>
          )}
        </div>
      </div>

      {/* Script Info */}
      <div className="flex-1 space-y-3">
        <div className="flex items-center justify-between">
          <span className="bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded">
            {scene.timeRange}
          </span>
          <span className="text-xs font-medium text-slate-500">Scene {scene.sceneNumber}</span>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Visual Action</h4>
          <p className="text-sm text-slate-800 leading-relaxed">{scene.visualDescription}</p>
        </div>

        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
          <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wide mb-1">Audio / Voiceover</h4>
          <p className="text-sm text-indigo-900 font-medium">"{scene.audioScript}"</p>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-1">
             <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Image Prompt</h4>
             <button 
                onClick={handleCopyPrompt}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
             >
                {copied ? <Check size={12}/> : <Copy size={12}/>}
                {copied ? "Copied" : "Copy Prompt"}
             </button>
          </div>
          <p className="text-xs text-slate-500 font-mono bg-slate-50 p-2 rounded border border-slate-100 line-clamp-2 hover:line-clamp-none transition-all cursor-help" title={scene.imagePrompt}>
            {scene.imagePrompt}
          </p>
        </div>
      </div>
    </div>
  );
};

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ 
  result, 
  onReset,
  isGeneratingImages = false
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [showToast, setShowToast] = useState<{message: string, visible: boolean}>({ message: '', visible: false });
  const [captionCopied, setCaptionCopied] = useState(false);

  // Identify capabilities
  const canShare = typeof navigator.share !== 'undefined';
  const canCopyImage = typeof ClipboardItem !== 'undefined';

  const showNotification = (message: string) => {
    setShowToast({ message, visible: true });
    setTimeout(() => setShowToast({ message: '', visible: false }), 3000);
  };

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(result.content);
      setCaptionCopied(true);
      setTimeout(() => setCaptionCopied(false), 2000);
      if (!isSharing) {
        showNotification("Caption copied to clipboard!");
      }
    } catch (err) {
      console.warn("Clipboard access denied", err);
    }
  };

  const handleShareOrAction = async () => {
    if (!result.imageUrl) return;
    
    setIsSharing(true);
    
    // 1. Copy Caption first (Always)
    try {
      await navigator.clipboard.writeText(result.content);
      if (!canShare) {
        // Only show toast here if we aren't opening the system share sheet immediately
        showNotification("Caption copied! Now handling image...");
      }
    } catch (err) {
      console.warn("Clipboard access denied", err);
    }

    const blob = dataURItoBlob(result.imageUrl);

    try {
      // 2A. Mobile Share (Priority)
      if (canShare) {
        const file = new File([blob], "instagram-post.jpg", { type: "image/jpeg" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'New Post',
            text: result.content
          });
          // Note: Toast might be hidden behind share sheet, so we rely on system UI
        } else {
            throw new Error("Sharing not supported for this file type");
        }
      } 
      // 2B. Desktop Copy Image (If Share API not available)
      else if (canCopyImage) {
         try {
           // Clipboard API prefers PNG, but JPEG works in modern Chrome.
           await navigator.clipboard.write([
             new ClipboardItem({ [blob.type]: blob })
           ]);
           showNotification("Image & Caption copied! Ready to paste.");
         } catch (copyErr) {
            console.warn("Image copy failed, falling back to download", copyErr);
            throw new Error("Image copy failed");
         }
      } 
      // 2C. Fallback to Download
      else {
         throw new Error("Fallback to download");
      }
    } catch (error) {
      // Fallback: Download the image
      const link = document.createElement('a');
      link.href = result.imageUrl;
      link.download = 'instagram-post.jpg';
      link.click();
      if (!canShare && !canCopyImage) {
         showNotification("Image downloaded & Caption copied!");
      }
    } finally {
      setIsSharing(false);
    }
  };

  const isPostReady = result.type === 'instagram_post' && !isGeneratingImages && result.imageUrl;

  return (
    <div className="animate-fade-in-up space-y-6 relative">
      {/* Toast Notification */}
      {showToast.visible && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-fade-in-up transition-all">
          <div className="bg-green-500 p-1 rounded-full text-white">
            <ClipboardCheck size={16} />
          </div>
          <div className="text-sm font-medium">
             {showToast.message}
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          {result.type === 'instagram_post' ? (
            <><Instagram className="text-pink-600" /> Generated Post</>
          ) : (
            <><Video className="text-purple-600" /> Generated Reels Script</>
          )}
        </h2>
        <div className="flex gap-2">
           <button 
            onClick={onReset}
            className="text-slate-500 hover:text-slate-900 text-sm font-medium px-4 py-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors"
          >
            Start Over
          </button>
          
          {/* Smart Action Button (Share on Mobile, Copy on Desktop) */}
          {result.type === 'instagram_post' && (
            <button
              onClick={handleShareOrAction}
              disabled={!isPostReady || isSharing}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm text-white
                ${!isPostReady ? 'bg-slate-300 cursor-not-allowed' : 'bg-[#E1306C] hover:opacity-90'}
              `}
            >
              {isSharing ? (
                 <Loader2 size={16} className="animate-spin" />
              ) : canShare ? (
                 <><Share2 size={16} /> Share to App</>
              ) : (
                 /* Replace MonitorArrowUp with Download to fix import error */
                 <><Download size={16} /> Copy / Download</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Post Cover Image Section */}
      {result.type === 'instagram_post' && (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-6 relative">
           
           <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                 <ImageIcon size={14}/> Visual Assets
              </span>
              <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                {canShare ? "Mobile Ready" : "Desktop Ready"}
              </span>
           </div>
           
           <div className="p-6 bg-slate-50">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* Left: Original Reference */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-slate-400 text-center">Reference</span>
                  <div className="aspect-square rounded-lg shadow-sm">
                     {result.originalCoverUrl ? (
                        <ReferenceImageCard url={result.originalCoverUrl} />
                     ) : (
                        <div className="h-full bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 flex-col gap-2">
                           <ImageOff size={24} />
                           <span className="text-xs">No reference found</span>
                        </div>
                     )}
                  </div>
                </div>

                {/* Right: AI Generated */}
                <div className="flex flex-col gap-2">
                   <span className="text-xs font-semibold text-indigo-500 text-center flex items-center justify-center gap-1">
                      <SparklesIcon size={12} /> AI Reimagined
                   </span>
                   <div className="aspect-square bg-slate-200 rounded-lg overflow-hidden shadow-md relative">
                      {result.imageUrl ? (
                        <img src={result.imageUrl} alt="Generated Cover" className="w-full h-full object-cover" />
                      ) : isGeneratingImages ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-white">
                          <Loader2 className="animate-spin mb-3 text-indigo-500" size={32} />
                          <span className="text-xs font-medium text-slate-500">Designing cover...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-100">
                          <ImageIcon size={32} className="mb-2 opacity-50"/>
                          <span className="text-xs">Image generation failed</span>
                        </div>
                      )}
                   </div>
                </div>
             </div>
           </div>
        </div>
      )}

      {/* Storyboard View for Reels */}
      {result.type === 'reels_script' && result.scenes ? (
        <div className="space-y-4">
           {/* Reference Context for Reels */}
           {result.originalCoverUrl && (
              <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 mb-2 shadow-sm">
                 <div className="w-10 h-10 shrink-0 rounded overflow-hidden bg-slate-100">
                    <img src={result.originalCoverUrl} alt="Ref" className="w-full h-full object-cover" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-500 uppercase">Style Reference</div>
                    <div className="text-xs text-slate-400 truncate">{result.originalCoverUrl}</div>
                 </div>
                 <a href={result.originalCoverUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 text-xs font-medium flex items-center gap-1">
                    View Source <ExternalLink size={10} />
                 </a>
              </div>
           )}

           {isGeneratingImages && (
              <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-pulse">
                 <Loader2 className="animate-spin" size={16}/>
                 <span>Generating storyboard visuals...</span>
              </div>
           )}
           
           <div className="grid grid-cols-1 gap-6">
             {result.scenes.map((scene) => (
               <StoryboardScene key={scene.sceneNumber} scene={scene} />
             ))}
           </div>
        </div>
      ) : (
        /* Text View for standard post (fallback if no scenes) */
        result.type === 'instagram_post' && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-100">
              <span className="text-sm font-medium text-slate-500">Caption & Tags</span>
              <button 
                onClick={handleCopyCaption}
                className="flex items-center gap-1 text-xs font-medium bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-full transition-colors"
              >
                {captionCopied ? <Check size={14} /> : <Copy size={14} />}
                {captionCopied ? 'Copied' : 'Copy Text'}
              </button>
            </div>
            <div className="p-6">
              <div className="whitespace-pre-wrap leading-relaxed text-slate-800 font-mono text-sm">
                {result.content}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};

// Helper for the "Sparkles" icon used in the component
const SparklesIcon = ({ size = 16, className = "" }: { size?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z"/>
  </svg>
);