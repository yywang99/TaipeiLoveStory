
export enum ScenarioType {
  OFFICE = 'OFFICE',
  CAMPUS = 'CAMPUS'
}

export interface Character {
  character_id: string;
  name: string;
  age?: string;
  archetype?: string;
  appearance?: {
    hair: string;
    eyes: string;
    clothing_style: string;
    distinctive_feature: string;
  };
  personality?: {
    surface: string;
    inner: string;
    speech_pattern: string;
  };
  locations?: string[];
  secret?: string;
  bio?: string; // Generated summary
  portraitUrl?: string; // User uploaded or AI generated portrait URL
}

export interface StoryTurn {
  narrative: string;
  dialogue?: string; // Specific spoken line if separate
  speaker?: string; // Who is speaking
  choices: string[];
  location: string;
  time: string;
  mood: string; // Used for UI tinting
  backgroundKeyword: string; // Used for image generation seeding
  heartbeatLevel: number; // 0-100, impacts visual effects
  isClimax: boolean;
  newSummary: string; // AI updates the 'Story So Far' to maintain continuity
  
  // New structure control fields
  phaseLabel: string; // e.g., "Act I: The Meeting", "Act II: Jealousy"
  emotionalStatus: string; // e.g., "Strangers", "Awkward Tension", "Passionate"
  
  affinityChange: number; // The impact of the last choice on the relationship (-10 to +10)
  
  // Visual Token for deterministic scene management
  visualToken: string; // e.g., "OFFICE_NIGHT", "PARK_DAY". Only changes when scene physically changes.
}

export interface GameState {
  scenario: ScenarioType | null;
  heroine: Character | null;
  npcs: Character[];
  currentTurn: StoryTurn | null;
  history: { role: string; content: string }[];
  status: 'IDLE' | 'GENERATING_CHARACTERS' | 'PLAYING' | 'ENDING';
  affinity: number; // 0-100
  model: string;
  summary: string; // The condensed "Story So Far"
  turnCount: number; // Tracks the pacing
  
  // Albums for persistence and fallback
  heroineAlbum: string[];
  sceneAlbum: string[];

  // Global Background State (Persists across GameScreen remounts)
  currentBgImage: string;
  currentBgToken: string;
}
