import React, { useEffect, useRef, useState } from 'react';
import { Character, StoryTurn } from '../types';
import { Heart, MapPin, Clock, Users, X, Settings2, MessageSquarePlus, Loader2, BookOpen, Download, Activity, Film, GripHorizontal, Sparkles, Check, Type, Upload, Camera, Image as ImageIcon, RotateCcw } from 'lucide-react';
import { generateSceneImage, generateCharacterPortrait } from '../services/geminiService';

interface Props {
  turn: StoryTurn;
  heroine: Character;
  npcs: Character[];
  onChoice: (choice: string) => void;
  isGenerating: boolean;
  currentModel: string;
  onModelChange: (model: string) => void;
  history: { role: string; content: string }[];
  affinity: number;
  onExportSave: () => void;
  onPortraitUpdate: (url: string) => void;
  heroineAlbum: string[];
  sceneAlbum: string[];
  
  // Visual Token Props for Persistence
  savedBgImage: string;
  savedBgToken: string;
  onBackgroundUpdate: (url: string, token: string) => void;
}

const GameScreen: React.FC<Props> = ({ 
  turn, 
  heroine, 
  npcs, 
  onChoice, 
  isGenerating,
  currentModel,
  onModelChange,
  history,
  affinity,
  onExportSave,
  onPortraitUpdate,
  heroineAlbum,
  sceneAlbum,
  savedBgImage,
  savedBgToken,
  onBackgroundUpdate
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [showChoices, setShowChoices] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showStoryLog, setShowStoryLog] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [isTypingDone, setIsTypingDone] = useState(false);
  const [galleryTab, setGalleryTab] = useState<'heroine' | 'scene'>('heroine');
  
  const [fontScale, setFontScale] = useState(0);
  
  // Background State: Initialize with the saved global state OR placeholder
  const [currentBg, setCurrentBg] = useState<string>(
     savedBgImage || (sceneAlbum.length > 0 ? sceneAlbum[0] : `https://picsum.photos/seed/${turn.backgroundKeyword}/1920/1080?blur=2`)
  );
  const [nextBg, setNextBg] = useState<string | null>(null);
  const [isBgLoading, setIsBgLoading] = useState(false);

  // Heroine Portrait State: Use prop as initial value
  const [heroineImage, setHeroineImage] = useState<string>(
    heroine.portraitUrl || (heroineAlbum.length > 0 ? heroineAlbum[0] : `https://picsum.photos/seed/${heroine.character_id}/800/1200`)
  );
  const [isGeneratingPortrait, setIsGeneratingPortrait] = useState(false);

  const [isCustomInputMode, setIsCustomInputMode] = useState(false);
  const [customInput, setCustomInput] = useState('');

  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  
  const textContainerRef = useRef<HTMLDivElement>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Speaker Logic
  const isHeroineSpeaker = turn.speaker?.includes(heroine.name);
  const isNpcSpeaker = npcs.some(npc => turn.speaker?.includes(npc.name));

  const speakerTagClass = isNpcSpeaker
    ? "bg-indigo-600 text-white border-indigo-400 shadow-indigo-500/30"
    : isHeroineSpeaker
      ? "bg-pink-600 text-white border-pink-400 shadow-pink-500/30"
      : "bg-gray-700 text-gray-300 border-gray-600";

  const dialogueBorderClass = isNpcSpeaker
    ? "border-indigo-500 bg-indigo-950/30"
    : isHeroineSpeaker
      ? "border-pink-500 bg-pink-950/30"
      : "border-gray-500 bg-white/5";

  const dialogueTextClass = isNpcSpeaker
    ? "text-indigo-100"
    : isHeroineSpeaker
      ? "text-pink-100"
      : "text-gray-200";

  const fontSizes = {
    narrative: ['text-sm md:text-lg', 'text-base md:text-xl', 'text-lg md:text-2xl'],
    dialogue: ['text-lg md:text-2xl', 'text-xl md:text-3xl', 'text-2xl md:text-4xl'],
    choice: ['text-sm md:text-base', 'text-base md:text-lg', 'text-lg md:text-xl']
  };

  const toggleFontSize = () => {
    setFontScale(prev => (prev + 1) % 3);
  };

  // --- Image Generation Logic using Visual Tokens ---
  useEffect(() => {
    let isMounted = true;

    // DETERMINISTIC CHECK:
    // Only generate if the AI-provided visualToken differs from what we currently have saved.
    // If savedBgToken is empty, it's the first run, so generate.
    if (turn.visualToken === savedBgToken) {
        // Token matches, no visual change needed.
        // Ensure currentBg is consistent with savedBgImage (handles remounts)
        if (savedBgImage && currentBg !== savedBgImage) {
            setCurrentBg(savedBgImage);
        }
        return;
    }
    
    const fetchData = async () => {
      setIsBgLoading(true);
      
      const currLocation = turn.location || '';
      const currTime = turn.time || '';

      // Fallback placeholder
      const fallbackUrl = `https://picsum.photos/seed/${turn.backgroundKeyword}${currLocation.replace(/\s/g, '')}/1920/1080?blur=2`;
      
      const context = `Location: ${currLocation}, Time: ${currTime}, Mood: ${turn.mood}. Narrative Context: ${turn.narrative.substring(0, 100)}...`;

      const prevPortrait = heroineImage.startsWith('data:') ? heroineImage : undefined;

      try {
        const [generatedBg, generatedPortrait] = await Promise.all([
            generateSceneImage(currLocation, currTime, turn.mood, turn.backgroundKeyword),
            heroine.appearance ? generateCharacterPortrait(heroine.appearance, prevPortrait, context) : Promise.resolve(null)
        ]);
      
        if (isMounted) {
            // --- Background Logic ---
            if (generatedBg) {
                setNextBg(generatedBg);
                // Update Global State with new Image and Token
                onBackgroundUpdate(generatedBg, turn.visualToken);
            } else {
                // Fail: Check album
                if (sceneAlbum.length > 0) {
                    const randomOldBg = sceneAlbum[Math.floor(Math.random() * sceneAlbum.length)];
                    setNextBg(randomOldBg);
                    onBackgroundUpdate(randomOldBg, turn.visualToken);
                } else {
                    setNextBg(fallbackUrl);
                    onBackgroundUpdate(fallbackUrl, turn.visualToken);
                }
            }
            
            // --- Portrait Logic ---
            if (generatedPortrait) {
                setHeroineImage(generatedPortrait);
                onPortraitUpdate(generatedPortrait);
            } else {
                if (heroineAlbum.length > 1) { 
                    const randomOldPortrait = heroineAlbum[Math.floor(Math.random() * heroineAlbum.length)];
                    setHeroineImage(randomOldPortrait);
                }
            }

            setIsBgLoading(false);
        }
      } catch (e) {
        console.error("Auto generation failed", e);
        if (isMounted) {
             if (sceneAlbum.length > 0) {
                const bg = sceneAlbum[Math.floor(Math.random() * sceneAlbum.length)];
                setNextBg(bg);
                onBackgroundUpdate(bg, turn.visualToken);
             } else {
                setNextBg(fallbackUrl);
                onBackgroundUpdate(fallbackUrl, turn.visualToken);
             }
             setIsBgLoading(false);
        }
      }
    };

    fetchData();

    return () => { isMounted = false; };
  }, [turn.visualToken, savedBgToken]); // Only depend on tokens

  useEffect(() => {
    if (nextBg) {
      const timer = setTimeout(() => {
        setCurrentBg(nextBg);
        setNextBg(null);
      }, 1000); 
      return () => clearTimeout(timer);
    }
  }, [nextBg]);
  
  useEffect(() => {
    setDisplayedText('');
    setShowChoices(false);
    setIsCustomInputMode(false);
    setCustomInput('');
    setIsTypingDone(false);
    
    const fullText = (turn.narrative || '').trim();
    let charIndex = 0;
    
    const timer = setInterval(() => {
      charIndex++;
      setDisplayedText(fullText.slice(0, charIndex));
      
      if (textContainerRef.current) {
        textContainerRef.current.scrollTop = textContainerRef.current.scrollHeight;
      }
      
      if (charIndex >= fullText.length) {
        clearInterval(timer);
        setIsTypingDone(true);
        setTimeout(() => setShowChoices(true), 500);
      }
    }, 30); 

    return () => clearInterval(timer);
  }, [turn]);

  useEffect(() => {
    if (showStoryLog && logContainerRef.current) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [showStoryLog]);

  const heartbeatAnim = turn.heartbeatLevel > 50 ? 'animate-pulse text-red-500' : 'text-pink-300';
  const displayHeartbeat = 60 + Math.floor(turn.heartbeatLevel * 0.6);

  const handleCustomSubmit = () => {
    if (customInput.trim()) {
      onChoice(customInput);
    }
  };

  const handleExport = () => {
    const textContent = history.map(entry => {
      if (entry.role === 'user') {
        return `\n[Player Choice]\n> ${entry.content.replace('Selected Choice: ', '')}\n`;
      }
      try {
        const data = JSON.parse(entry.content);
        let text = `\n[${data.time} - ${data.location}]\n[${data.phaseLabel || 'Story'}]\n${data.narrative}`;
        if (data.dialogue) {
            text += `\n\n"${data.dialogue}"`;
        }
        return text;
      } catch { 
        return ''; 
      }
    }).join('\n----------------------------------------\n');

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Taipei_Romance_Story_Log_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const url = reader.result as string;
        setHeroineImage(url);
        onPortraitUpdate(url); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAiGeneratePortrait = async () => {
    if (!heroine.appearance) return;
    setIsGeneratingPortrait(true);
    
    const context = `Location: ${turn.location}, Time: ${turn.time}, Mood: ${turn.mood}.`;
    const prevPortrait = heroineImage.startsWith('data:') ? heroineImage : undefined;
    
    try {
        const img = await generateCharacterPortrait(heroine.appearance, prevPortrait, context);
        if (img) {
          setHeroineImage(img);
          onPortraitUpdate(img); 
        } else {
             if (heroineAlbum.length > 0) {
                 const random = heroineAlbum[Math.floor(Math.random() * heroineAlbum.length)];
                 setHeroineImage(random);
             }
        }
    } catch (e) {
        console.error("Manual portrait gen failed", e);
    }
    setIsGeneratingPortrait(false);
  };
  
  const handleSelectFromGallery = (url: string, type: 'heroine' | 'scene') => {
      if (type === 'heroine') {
          setHeroineImage(url);
          onPortraitUpdate(url); 
      } else {
          setNextBg(url); 
          onBackgroundUpdate(url, turn.visualToken); // Update persisted state
      }
      setShowGallery(false);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - dragPos.x,
      y: e.clientY - dragPos.y
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setDragPos({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-black text-white selection:bg-pink-500/30 touch-none">
      
      {/* Background Layer: Current */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] ease-linear transform scale-105"
        style={{ backgroundImage: `url(${currentBg})` }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60"></div>
      </div>

      {/* Background Layer: Next (Fading In) */}
      <div 
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${nextBg ? 'opacity-100' : 'opacity-0'}`}
        style={{ backgroundImage: nextBg ? `url(${nextBg})` : 'none' }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60"></div>
      </div>

      {/* --- Character Portrait Layer --- */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-20 w-full md:w-[45vh] h-[80vh] opacity-90 transition-opacity duration-1000">
           <img 
             src={heroineImage}
             alt={heroine.name}
             className="w-full h-full object-cover object-top"
             style={{ 
               maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
               WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)' 
             }}
           />
        </div>
      </div>

      {/* --- HUD Layer 1: System Bar --- */}
      <div className="absolute top-0 left-0 w-full z-50 pointer-events-none">
        <div className="absolute inset-0 h-24 bg-gradient-to-b from-black/80 to-transparent -z-10" />

        <div className="flex justify-between items-start pt-2 px-2 md:p-6">
          <div className="flex flex-col md:flex-row gap-2 pointer-events-auto">
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur text-xs md:text-sm text-gray-300">
                 <MapPin className="w-3 h-3 text-blue-400" />
                 <span>{turn.location}</span>
            </div>
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur text-xs md:text-sm text-gray-300">
                 <Clock className="w-3 h-3 text-blue-400" />
                 <span>{turn.time}</span>
            </div>
             {isBgLoading && (
               <div className="flex items-center gap-2 text-pink-400 animate-pulse bg-black/40 px-3 py-1.5 rounded-full border border-pink-500/20 text-xs md:text-sm">
                 <Loader2 className="w-3 h-3 animate-spin" />
                 <span className="hidden md:inline">Dreaming...</span>
               </div>
             )}
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
             <div className="flex items-center bg-black/40 rounded-full border border-white/10 backdrop-blur p-1">
                <div className="relative border-r border-white/10 pr-2 mr-2 hidden md:block">
                     <Settings2 className="w-4 h-4 text-gray-400 absolute left-2 top-1.5 pointer-events-none" />
                     <select
                        value={currentModel}
                        onChange={(e) => onModelChange(e.target.value)}
                        className="bg-transparent text-gray-300 text-xs py-1 pl-8 pr-2 outline-none cursor-pointer hover:text-white transition-colors appearance-none"
                     >
                        <option value="gemini-2.5-flash">Flash</option>
                        <option value="gemini-2.5-pro">Pro</option>
                        <option value="gemini-3-pro-preview">3.0</option>
                     </select>
                </div>
                <div className="md:hidden relative border-r border-white/10 pr-2 mr-2">
                     <Settings2 className="w-4 h-4 text-gray-400 ml-2" />
                     <select
                        value={currentModel}
                        onChange={(e) => onModelChange(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                     >
                        <option value="gemini-2.5-flash">Flash</option>
                        <option value="gemini-2.5-pro">Pro</option>
                        <option value="gemini-3-pro-preview">3.0</option>
                     </select>
                </div>

                <div className="flex items-center gap-1">
                    <button onClick={toggleFontSize} className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all" title="Font Size">
                        <Type className="w-4 h-4" />
                    </button>
                    {/* Export Save Button */}
                    <button onClick={onExportSave} className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all" title="Export Save">
                        <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => setShowGallery(true)} className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all" title="Gallery">
                        <ImageIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => setShowStoryLog(true)} className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all" title="Story Log">
                        <BookOpen className="w-4 h-4" />
                    </button>
                    <button onClick={() => setShowProfile(true)} className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all" title="Characters">
                        <Users className="w-4 h-4" />
                    </button>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* --- HUD Layer 2: Status Dashboard --- */}
      <div className="absolute top-14 md:top-20 left-0 w-full flex justify-end z-40 pointer-events-none px-2 md:px-6">
        <div className="flex items-center gap-3 md:gap-6 bg-black/60 backdrop-blur-xl border border-white/10 px-4 md:px-6 py-2 rounded-full shadow-2xl animate-in fade-in slide-in-from-top-4 duration-700 pointer-events-auto">
            
            <div className="flex items-center gap-2 border-r border-white/10 pr-3 md:pr-6 min-w-fit">
                <Film className="w-3 h-3 text-yellow-500" />
                <span className="text-yellow-100 font-serif uppercase text-[10px] md:text-xs tracking-[0.2em] whitespace-nowrap">
                    {turn.phaseLabel?.split(':')[0] || "ACT I"}
                </span>
            </div>

            <div className="flex flex-col w-20 md:w-32 gap-1">
                 <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-gray-400">
                     <span className="flex items-center gap-1"><Sparkles className="w-2 h-2 text-fuchsia-400"/> Love</span>
                     <span className="text-white">{affinity}%</span>
                 </div>
                 <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-fuchsia-500 to-pink-500 transition-all duration-700 ease-out"
                      style={{ width: `${affinity}%` }}
                    ></div>
                 </div>
            </div>

            <div className="flex items-center gap-2 border-l border-white/10 pl-3 md:pl-6 min-w-fit">
                <Heart className={`w-3 h-3 md:w-4 md:h-4 ${heartbeatAnim}`} fill={turn.heartbeatLevel > 50 ? "currentColor" : "none"} />
                <div className="flex flex-col leading-none">
                     <span className="text-[10px] text-pink-400 font-mono">{displayHeartbeat} BPM</span>
                     <span className="text-[10px] text-gray-400 hidden md:block max-w-[100px] truncate">{turn.emotionalStatus}</span>
                </div>
            </div>

        </div>
      </div>

      {/* --- Floating Narrative Window --- */}
      <div className="absolute inset-0 flex flex-col justify-end items-center pb-2 px-2 md:pb-8 md:px-4 z-30 pointer-events-none">
        
        <div 
           className="w-full max-w-4xl pointer-events-auto transition-transform duration-75 ease-linear will-change-transform"
           style={{ transform: `translate(${dragPos.x}px, ${dragPos.y}px)` }}
        >
          <div className="bg-black/85 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/5">
            
            <div 
              className="h-8 bg-white/5 flex items-center justify-center cursor-grab active:cursor-grabbing border-b border-white/5 hover:bg-white/10 transition-colors touch-none"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <GripHorizontal className="w-5 h-5 text-gray-500" />
            </div>

            <div className="p-4 md:p-8 flex flex-col gap-4 md:gap-6">
              
              <div 
                ref={textContainerRef}
                className={`font-serif ${fontSizes.narrative[fontScale]} leading-relaxed text-gray-400 whitespace-pre-wrap max-h-[30vh] md:max-h-[25vh] overflow-y-auto custom-scrollbar pr-2`}
              >
                {displayedText}
              </div>

              {turn.dialogue && isTypingDone && (
                 <div className="relative animate-in fade-in slide-in-from-bottom-3 duration-700">
                    {turn.speaker && (
                      <div className={`absolute -top-3 left-0 z-10 px-3 py-0.5 text-xs font-bold tracking-widest uppercase shadow-lg border rounded-full ${speakerTagClass}`}>
                        {turn.speaker}
                      </div>
                    )}
                    
                    <div className={`relative p-4 md:p-6 rounded-xl border-l-4 shadow-inner flex items-center ${dialogueBorderClass}`}>
                       <p className={`${fontSizes.dialogue[fontScale]} font-medium font-serif tracking-wide leading-snug ${dialogueTextClass}`}>
                         "{turn.dialogue}"
                       </p>
                    </div>
                 </div>
              )}

              <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-700 to-transparent opacity-50"></div>

              <div className={`transition-all duration-500 ease-out transform ${showChoices ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                
                {!isCustomInputMode ? (
                  <div className="grid gap-2">
                    {turn.choices.map((choice, idx) => (
                      <button
                        key={idx}
                        disabled={isGenerating}
                        onClick={() => onChoice(choice)}
                        className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/5 hover:border-pink-500/50 p-2.5 md:p-3 rounded-lg transition-all group flex items-center gap-3 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                         <span className="w-1.5 h-1.5 rounded-full bg-pink-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                        <span className={`group-hover:text-pink-200 transition-colors font-medium tracking-wide ${fontSizes.choice[fontScale]} text-gray-300`}>
                          {choice}
                        </span>
                      </button>
                    ))}
                    
                    <button
                      onClick={() => setIsCustomInputMode(true)}
                      disabled={isGenerating}
                      className="w-full text-center p-2 rounded-lg transition-all text-gray-500 hover:text-pink-300 text-xs md:text-sm flex items-center justify-center gap-1.5 hover:bg-white/5 mt-1"
                    >
                      <MessageSquarePlus className="w-3 h-3" />
                      <span>Action Input</span>
                    </button>
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-bottom-2">
                    <textarea
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        placeholder="描述你的行動或對話..."
                        className="w-full bg-black/50 text-white p-3 rounded border border-slate-700 focus:border-pink-500 outline-none min-h-[80px] text-lg font-serif mb-3 resize-none placeholder:text-gray-600"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleCustomSubmit();
                          }
                        }}
                    />
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={() => setIsCustomInputMode(false)}
                            className="px-4 py-2 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-sm"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleCustomSubmit}
                            disabled={!customInput.trim()}
                            className="px-6 py-2 rounded bg-pink-900/80 hover:bg-pink-800 text-pink-100 border border-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium tracking-wider"
                        >
                            Send
                        </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {showGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div 
             className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity"
             onClick={() => setShowGallery(false)}
           />
           <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl flex flex-col h-[85vh] animate-in fade-in zoom-in-95 duration-200">
              
              <div className="flex items-center justify-between p-4 md:p-6 border-b border-zinc-800 bg-zinc-950/50 rounded-t-xl">
                 <div className="flex items-center gap-4">
                    <h2 className="text-lg md:text-xl font-serif tracking-widest text-white uppercase flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-pink-400"/> Gallery
                    </h2>
                    <div className="flex bg-zinc-800 rounded-lg p-1 gap-1">
                        <button 
                          onClick={() => setGalleryTab('heroine')}
                          className={`px-3 py-1 rounded-md text-sm transition-colors ${galleryTab === 'heroine' ? 'bg-pink-900/50 text-pink-200' : 'text-gray-400 hover:text-white'}`}
                        >
                            Heroine
                        </button>
                        <button 
                           onClick={() => setGalleryTab('scene')}
                           className={`px-3 py-1 rounded-md text-sm transition-colors ${galleryTab === 'scene' ? 'bg-blue-900/50 text-blue-200' : 'text-gray-400 hover:text-white'}`}
                        >
                            Scenery
                        </button>
                    </div>
                 </div>
                 <button onClick={() => setShowGallery(false)} className="p-1 hover:bg-white/10 rounded-full"><X className="w-5 h-5 text-gray-400" /></button>
              </div>

              <div className="overflow-y-auto p-4 md:p-8 custom-scrollbar bg-zinc-900/95 flex-1">
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {(galleryTab === 'heroine' ? heroineAlbum : sceneAlbum).length === 0 && (
                        <div className="col-span-full text-center text-gray-500 py-10 italic">No images collected yet.</div>
                    )}
                    {(galleryTab === 'heroine' ? heroineAlbum : sceneAlbum).map((url, idx) => (
                        <div 
                           key={idx} 
                           onClick={() => handleSelectFromGallery(url, galleryTab)}
                           className="group relative aspect-[3/4] (galleryTab==='scene'?'aspect-video':'aspect-[3/4]') overflow-hidden rounded-lg cursor-pointer border border-white/5 hover:border-pink-500/50 transition-all"
                           style={{ aspectRatio: galleryTab === 'scene' ? '16/9' : '3/4' }}
                        >
                            <img src={url} alt="Gallery" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-xs bg-black/60 px-2 py-1 rounded flex items-center gap-1">
                                    <RotateCcw className="w-3 h-3"/> Use This
                                </span>
                            </div>
                        </div>
                    ))}
                 </div>
              </div>

           </div>
        </div>
      )}

      {showProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity"
            onClick={() => setShowProfile(false)}
          />
          
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-slate-950/50">
              <h2 className="text-xl font-serif tracking-widest text-pink-200 uppercase">Persona Database</h2>
              <button 
                onClick={() => setShowProfile(false)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar">
              
              <div className="space-y-4">
                <div className="flex items-start justify-between border-l-2 border-pink-500 pl-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{heroine.name}</h3>
                    <div className="text-pink-400 text-sm font-mono mt-1 uppercase tracking-wider">
                      {heroine.archetype} • {heroine.age}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-6 bg-black/20 p-4 rounded-xl border border-white/5">
                   <div className="relative w-32 h-44 rounded-lg overflow-hidden border-2 border-pink-500/30 shadow-lg group shrink-0">
                     <img src={heroineImage} alt="Heroine Portrait" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                     {isGeneratingPortrait && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
                        </div>
                     )}
                   </div>
                   
                   <div className="flex-1 space-y-3">
                      <p className="text-gray-400 text-xs italic">
                        Current visualization of {heroine.name}.
                      </p>
                      <div className="flex gap-3 flex-wrap">
                         <label className="cursor-pointer px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-xs flex items-center gap-2 transition-colors text-gray-300">
                           <Upload className="w-3 h-3" />
                           Upload
                           <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                         </label>
                         <button 
                           onClick={handleAiGeneratePortrait}
                           disabled={isGeneratingPortrait}
                           className="px-3 py-2 bg-pink-900/30 hover:bg-pink-900/50 border border-pink-700/30 hover:border-pink-500/50 rounded-md text-xs flex items-center gap-2 transition-all text-pink-200 disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                           <Camera className="w-3 h-3" />
                           AI Gen
                         </button>
                         <button 
                           onClick={() => { setShowProfile(false); setShowGallery(true); setGalleryTab('heroine'); }}
                           className="px-3 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-md text-xs flex items-center gap-2 transition-all text-gray-200"
                         >
                           <ImageIcon className="w-3 h-3" />
                           From Album
                         </button>
                      </div>
                   </div>
                </div>

                <p className="text-gray-300 italic leading-relaxed text-sm bg-black/20 p-4 rounded-lg border border-white/5">
                  "{heroine.bio || 'No biography available.'}"
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <h4 className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-2">Appearance</h4>
                    <div className="flex gap-2 text-gray-400">
                      <span className="w-4 text-center text-gray-600">✂</span> 
                      <span>{heroine.appearance?.hair}</span>
                    </div>
                    <div className="flex gap-2 text-gray-400">
                      <span className="w-4 text-center text-gray-600">👁</span>
                      <span>{heroine.appearance?.eyes}</span>
                    </div>
                    <div className="flex gap-2 text-gray-400">
                      <span className="w-4 text-center text-gray-600">👕</span>
                      <span>{heroine.appearance?.clothing_style}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-2">Personality</h4>
                    <div className="bg-white/5 p-2 rounded">
                      <span className="text-xs text-gray-500 block mb-1">Surface</span>
                      <span className="text-gray-300">{heroine.personality?.surface}</span>
                    </div>
                    <div className="bg-white/5 p-2 rounded">
                      <span className="text-xs text-gray-500 block mb-1">Inner</span>
                      <span className="text-gray-300">{heroine.personality?.inner}</span>
                    </div>
                  </div>
                </div>
                
                 {heroine.secret && (
                   <div className="mt-4 pt-4 border-t border-white/5">
                     <h4 className="text-red-900/50 font-bold text-xs uppercase tracking-wider mb-1">Confidential / Secret</h4>
                     <p className="text-red-200/50 text-xs blur-[3px] hover:blur-0 transition-all duration-300 cursor-help select-none">
                       {heroine.secret}
                     </p>
                   </div>
                 )}
              </div>

              {npcs.length > 0 && (
                <div className="space-y-4 pt-6 border-t border-slate-700">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Supporting Cast</h3>
                  <div className="grid gap-4">
                    {npcs.map((npc, idx) => (
                      <div key={idx} className="bg-slate-800/50 p-4 rounded-lg border border-white/5 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-200">{npc.name}</span>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed">
                          {npc.bio || 'No details available.'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {showStoryLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div 
             className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity"
             onClick={() => setShowStoryLog(false)}
           />
           
           <div className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl flex flex-col h-[80vh] animate-in fade-in zoom-in-95 duration-200">
             
             <div className="flex items-center justify-between p-4 md:p-6 border-b border-zinc-800 bg-zinc-950/50 rounded-t-xl">
               <div className="flex items-center gap-3">
                 <BookOpen className="w-5 h-5 text-pink-400" />
                 <h2 className="text-lg md:text-xl font-serif tracking-widest text-white uppercase">Story Log</h2>
               </div>
               <div className="flex gap-2">
                 <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-900/30 text-blue-200 hover:bg-blue-900/50 border border-blue-800/50 rounded-lg text-sm transition-colors"
                 >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export Novel</span>
                 </button>
                 <button 
                   onClick={() => setShowStoryLog(false)}
                   className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                 >
                   <X className="w-5 h-5 text-gray-400" />
                 </button>
               </div>
             </div>
 
             <div 
                ref={logContainerRef}
                className="overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar flex-1 bg-zinc-900/95"
             >
               {history.length === 0 ? (
                 <p className="text-center text-gray-500 italic mt-10">The story has just begun...</p>
               ) : (
                 history.map((entry, idx) => {
                   if (entry.role === 'user') {
                     return (
                       <div key={idx} className="flex justify-end">
                         <div className="max-w-[80%] bg-pink-900/20 border border-pink-500/20 text-pink-100 px-4 py-3 rounded-2xl rounded-tr-none text-sm md:text-base font-medium">
                           {entry.content.replace('Selected Choice: ', '')}
                         </div>
                       </div>
                     );
                   } else {
                     let content = "";
                     let dialogue = "";
                     try {
                        const data = JSON.parse(entry.content);
                        content = data.narrative;
                        dialogue = data.dialogue || "";
                     } catch {
                        content = "Error parsing memory...";
                     }
                     return (
                       <div key={idx} className="flex flex-col gap-2 max-w-[90%]">
                         <div className="text-zinc-300 font-serif leading-relaxed text-sm md:text-base whitespace-pre-wrap">
                           {content}
                         </div>
                         {dialogue && (
                           <div className="text-pink-200/90 border-l-2 border-pink-500/50 pl-4 py-1 italic text-sm md:text-base">
                             "{dialogue}"
                           </div>
                         )}
                         <div className="w-full h-px bg-zinc-800 my-4"></div>
                       </div>
                     );
                   }
                 })
               )}
             </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default GameScreen;