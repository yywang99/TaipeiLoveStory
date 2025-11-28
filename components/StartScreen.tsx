import React from 'react';
import { SCENARIO_DETAILS } from '../constants';
import { ScenarioType } from '../types';
import { Building2, GraduationCap, Heart, Settings2, Upload } from 'lucide-react';

interface Props {
  onSelect: (scenario: ScenarioType) => void;
  currentModel: string;
  onModelChange: (model: string) => void;
  onImportSave: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const StartScreen: React.FC<Props> = ({ onSelect, currentModel, onModelChange, onImportSave }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[url('https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=2994&auto=format&fit=crop')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      
      <div className="relative z-10 max-w-4xl w-full text-center">
        <h1 className="text-4xl md:text-7xl font-bold mb-2 tracking-tighter text-white serif">
          台北戀愛物語
        </h1>
        <p className="text-xl text-gray-300 mb-12 tracking-widest font-light">
          PROJECT TAIPEI ROMANCE
        </p>

        {/* Load Save Button */}
        <div className="mb-10 flex justify-center">
          <label className="group relative inline-flex items-center gap-3 bg-amber-900/40 hover:bg-amber-900/60 text-amber-200 border border-amber-700/50 px-6 py-3 md:px-8 md:py-4 rounded-xl transition-all cursor-pointer backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 shadow-xl hover:shadow-amber-900/20">
            <Upload className="w-5 h-5 md:w-6 md:h-6" />
            <span className="text-base md:text-lg font-serif tracking-widest">LOAD SAVE DATA</span>
            <input 
              type="file" 
              className="hidden" 
              accept=".json" 
              onChange={onImportSave} 
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2 md:gap-8">
          {/* Office Scenario */}
          <button
            onClick={() => onSelect(ScenarioType.OFFICE)}
            className="group relative overflow-hidden rounded-xl border border-white/10 bg-black/40 hover:bg-black/60 transition-all duration-500 hover:scale-[1.02] hover:border-blue-400/50 p-6 md:p-8 text-left"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <Building2 className="w-8 h-8 md:w-10 md:h-10 text-blue-400 mb-4" />
              <h2 className="text-xl md:text-2xl font-bold text-white mb-2">{SCENARIO_DETAILS[ScenarioType.OFFICE].title}</h2>
              <p className="text-xs md:text-sm text-blue-200 mb-4 font-mono uppercase tracking-wider">{SCENARIO_DETAILS[ScenarioType.OFFICE].subtitle}</p>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                {SCENARIO_DETAILS[ScenarioType.OFFICE].description}
              </p>
              <div className="flex gap-2 flex-wrap">
                {SCENARIO_DETAILS[ScenarioType.OFFICE].keywords.split('、').map((k, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded-full bg-blue-900/40 text-blue-200 border border-blue-800">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </button>

          {/* Campus Scenario */}
          <button
            onClick={() => onSelect(ScenarioType.CAMPUS)}
            className="group relative overflow-hidden rounded-xl border border-white/10 bg-black/40 hover:bg-black/60 transition-all duration-500 hover:scale-[1.02] hover:border-pink-400/50 p-6 md:p-8 text-left"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-pink-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <GraduationCap className="w-8 h-8 md:w-10 md:h-10 text-pink-400 mb-4" />
              <h2 className="text-xl md:text-2xl font-bold text-white mb-2">{SCENARIO_DETAILS[ScenarioType.CAMPUS].title}</h2>
              <p className="text-xs md:text-sm text-pink-200 mb-4 font-mono uppercase tracking-wider">{SCENARIO_DETAILS[ScenarioType.CAMPUS].subtitle}</p>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                {SCENARIO_DETAILS[ScenarioType.CAMPUS].description}
              </p>
              <div className="flex gap-2 flex-wrap">
                {SCENARIO_DETAILS[ScenarioType.CAMPUS].keywords.split('、').map((k, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded-full bg-pink-900/40 text-pink-200 border border-pink-800">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </button>
        </div>
        
        <div className="mt-12 flex flex-col items-center justify-center gap-4 text-gray-500 text-sm">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            <span>Powered by Google Gemini</span>
          </div>
          
          <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-white/10 backdrop-blur">
            <Settings2 className="w-4 h-4 text-gray-400" />
            <select 
              value={currentModel}
              onChange={(e) => onModelChange(e.target.value)}
              className="bg-transparent text-gray-300 text-xs outline-none cursor-pointer hover:text-white transition-colors"
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast)</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro (Balanced)</option>
              <option value="gemini-3-pro-preview">Gemini 3.0 Pro Preview (Complex)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;