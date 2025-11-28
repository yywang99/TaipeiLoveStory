import React, { useState } from 'react';
import StartScreen from './components/StartScreen';
import GameScreen from './components/GameScreen';
import LoadingScreen from './components/LoadingScreen';
import { generateCharacters, generateStoryTurn } from './services/geminiService';
import { Character, GameState, ScenarioType } from './types';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    scenario: null,
    heroine: null,
    npcs: [],
    currentTurn: null,
    history: [],
    status: 'IDLE',
    affinity: 50,
    model: 'gemini-2.5-flash',
    summary: "Story start.",
    turnCount: 0,
    heroineAlbum: [],
    sceneAlbum: [],
    currentBgImage: '', // Initialize empty
    currentBgToken: '' // Initialize empty
  });

  const [loadingText, setLoadingText] = useState('Initializing...');

  const handleModelChange = (model: string) => {
    setGameState(prev => ({ ...prev, model }));
  };

  const handlePortraitUpdate = (url: string) => {
    setGameState(prev => {
      if (!prev.heroine) return prev;
      const newAlbum = prev.heroineAlbum.includes(url) 
        ? prev.heroineAlbum 
        : [url, ...prev.heroineAlbum];

      return {
        ...prev,
        heroine: {
          ...prev.heroine,
          portraitUrl: url
        },
        heroineAlbum: newAlbum
      };
    });
  };

  const handleBackgroundUpdate = (url: string, token: string) => {
    setGameState(prev => {
      const newAlbum = prev.sceneAlbum.includes(url)
        ? prev.sceneAlbum
        : [url, ...prev.sceneAlbum];
      
      return {
        ...prev,
        currentBgImage: url,
        currentBgToken: token,
        sceneAlbum: newAlbum
      };
    });
  };

  const handleExportSave = () => {
    try {
      const dataStr = JSON.stringify(gameState, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
      link.download = `Taipei_Romance_Save_${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed", e);
      alert("Failed to create save file.");
    }
  };

  const handleImportSave = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        // Basic validation checking for essential fields
        if (json.heroine && json.history && json.status) {
          setGameState(json);
        } else {
          alert("Invalid save file structure.");
        }
      } catch (err) {
        console.error("Failed to load save", err);
        alert("Failed to parse save file.");
      }
    };
    reader.readAsText(file);
    // Reset input value to allow selecting the same file again if needed
    e.target.value = '';
  };

  const handleScenarioSelect = async (scenario: ScenarioType) => {
    setGameState(prev => ({ ...prev, status: 'GENERATING_CHARACTERS', scenario }));
    setLoadingText(`Searching Taipei using ${gameState.model}...`);

    try {
      const { heroine, npcs } = await generateCharacters(scenario, gameState.model);
      
      setGameState(prev => ({
        ...prev,
        heroine,
        npcs,
        status: 'PLAYING',
        summary: `The story begins in Taipei with ${heroine.name}, a ${heroine.archetype}.`,
        turnCount: 0,
        affinity: 40, 
        heroineAlbum: [], 
        sceneAlbum: [],
        currentBgImage: '', // Reset bg on new game
        currentBgToken: ''
      }));

      await startStory(scenario, heroine, npcs);

    } catch (error) {
      console.error("Failed to generate characters", error);
      alert("AI Service overloaded or model unavailable. Please refresh or try a different model.");
      setGameState(prev => ({ ...prev, status: 'IDLE' }));
    }
  };

  const startStory = async (scenario: ScenarioType, heroine: Character, npcs: Character[]) => {
    setLoadingText('Weaving destiny...');
    
    try {
      const turn = await generateStoryTurn(
        scenario, 
        heroine, 
        npcs, 
        [], 
        undefined, 
        gameState.model,
        gameState.summary,
        0,
        undefined // No previous token for first turn
      );
      
      setGameState(prev => ({
        ...prev,
        currentTurn: turn,
        history: [{ role: 'model', content: JSON.stringify(turn) }],
        status: 'PLAYING',
        summary: turn.newSummary,
        turnCount: 1
        // Background token will be updated by GameScreen upon first generation
      }));
    } catch (error) {
      console.error("Failed to start story", error);
    }
  };

  const handleChoice = async (choice: string) => {
    if (!gameState.heroine || !gameState.scenario) return;

    setGameState(prev => ({ ...prev, status: 'GENERATING_CHARACTERS' }));
    setLoadingText('Fate is turning...');

    try {
      const newHistory = [
        ...gameState.history,
        { role: 'user', content: `Selected Choice: ${choice}` }
      ];

      const nextTurn = await generateStoryTurn(
        gameState.scenario, 
        gameState.heroine,
        gameState.npcs,
        newHistory, 
        choice,
        gameState.model,
        gameState.summary, 
        gameState.turnCount,
        gameState.currentBgToken // Pass the persistent token for consistency
      );

      const affinityChange = nextTurn.affinityChange || 0;
      const newAffinity = Math.min(100, Math.max(0, gameState.affinity + affinityChange));

      setGameState(prev => ({
        ...prev,
        history: [...newHistory, { role: 'model', content: JSON.stringify(nextTurn) }],
        currentTurn: nextTurn,
        status: 'PLAYING',
        summary: nextTurn.newSummary,
        turnCount: prev.turnCount + 1,
        affinity: newAffinity
      }));

    } catch (error) {
      console.error("Error progressing story", error);
      setGameState(prev => ({ ...prev, status: 'PLAYING' })); 
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {gameState.status === 'IDLE' && (
        <StartScreen 
          onSelect={handleScenarioSelect} 
          currentModel={gameState.model}
          onModelChange={handleModelChange}
          onImportSave={handleImportSave}
        />
      )}

      {gameState.status === 'GENERATING_CHARACTERS' && (
        <LoadingScreen text={loadingText} />
      )}

      {gameState.status === 'PLAYING' && gameState.currentTurn && gameState.heroine && (
        <GameScreen 
          turn={gameState.currentTurn} 
          heroine={gameState.heroine}
          npcs={gameState.npcs}
          onChoice={handleChoice}
          isGenerating={false}
          currentModel={gameState.model}
          onModelChange={handleModelChange}
          history={gameState.history}
          affinity={gameState.affinity}
          onExportSave={handleExportSave}
          onPortraitUpdate={handlePortraitUpdate}
          heroineAlbum={gameState.heroineAlbum}
          sceneAlbum={gameState.sceneAlbum}
          
          savedBgImage={gameState.currentBgImage}
          savedBgToken={gameState.currentBgToken}
          onBackgroundUpdate={handleBackgroundUpdate}
        />
      )}
    </div>
  );
};

export default App;