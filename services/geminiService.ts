
import { GoogleGenAI, Schema, Type } from "@google/genai";
import { Character, ScenarioType, StoryTurn } from "../types";
import { SYSTEM_INSTRUCTION_CORE } from "../constants";

// Initialize AI Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Schemas ---

const characterSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    heroine: {
      type: Type.OBJECT,
      properties: {
        character_id: { type: Type.STRING },
        name: { type: Type.STRING },
        age: { type: Type.STRING },
        archetype: { type: Type.STRING },
        appearance: {
          type: Type.OBJECT,
          properties: {
            hair: { type: Type.STRING },
            eyes: { type: Type.STRING },
            clothing_style: { type: Type.STRING },
            distinctive_feature: { type: Type.STRING }
          }
        },
        personality: {
          type: Type.OBJECT,
          properties: {
            surface: { type: Type.STRING },
            inner: { type: Type.STRING },
            speech_pattern: { type: Type.STRING }
          }
        },
        locations: { type: Type.ARRAY, items: { type: Type.STRING } },
        secret: { type: Type.STRING },
        bio: { type: Type.STRING }
      },
      required: ["name", "appearance", "personality", "bio"]
    },
    npcs: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          character_id: { type: Type.STRING },
          name: { type: Type.STRING },
          bio: { type: Type.STRING } // Simplified for NPCs
        },
        required: ["name", "bio"]
      }
    }
  }
};

const storyTurnSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    narrative: { type: Type.STRING, description: "Main descriptive text, rich in sensory details." },
    dialogue: { type: Type.STRING, description: "The specific line of dialogue OR internal thought reacting to the player. MUST be included to show the character's reaction box." },
    speaker: { type: Type.STRING, description: "Name of the speaker (Heroine, NPC, or 'Inner Monologue')." },
    choices: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "2-3 distinct choices for the player. Format: [Type] Text"
    },
    location: { type: Type.STRING, description: "The current physical setting." },
    time: { type: Type.STRING, description: "The time of day." },
    mood: { type: Type.STRING, description: "Current atmosphere (e.g., Melancholic, Romantic, Tense)" },
    backgroundKeyword: { type: Type.STRING, description: "A single English keyword to search for a background image (e.g., Taipei101, NightMarket, Cafe)" },
    heartbeatLevel: { type: Type.INTEGER, description: "Intensity of romantic tension 0-100" },
    isClimax: { type: Type.BOOLEAN },
    newSummary: { type: Type.STRING, description: "A concise summary (max 100 words) of the 'Story So Far', updated with the events of THIS turn." },
    phaseLabel: { type: Type.STRING, description: "Current Story Act (e.g., 'Act 1: The Encounter', 'Act 2: The Rival', 'Act 3: The Decision')." },
    emotionalStatus: { type: Type.STRING, description: "Short description of the relationship status (e.g., 'Awkward Strangers', 'Secretly Dating', 'Cold War')." },
    
    affinityUpdates: { 
      type: Type.ARRAY, 
      description: "List of affinity changes for characters involved.",
      items: {
        type: Type.OBJECT,
        properties: {
          target: { type: Type.STRING, description: "Name of the character (e.g. 'Heroine' or NPC Name)." },
          change: { type: Type.INTEGER, description: "Integer value (-15 to +15)." }
        },
        required: ["target", "change"]
      }
    },

    visualToken: { type: Type.STRING, description: "A unique identifier string for the current scene visuals (e.g., 'OFFICE_NIGHT_RAIN', 'PARK_DAY'). IMPORTANT: This MUST remain identical to the previous turn's token unless the scene physically changes." },
    sceneChanged: { type: Type.BOOLEAN, description: "Set to TRUE only if the location or time has significantly changed, requiring a new background image." },
    soundKeyword: { type: Type.STRING, description: "One of: RAIN, CAFE, OFFICE, MRT, NIGHT_MARKET, PARK. Or null if no specific sound." }
  },
  required: ["narrative", "dialogue", "speaker", "choices", "location", "time", "backgroundKeyword", "newSummary", "phaseLabel", "emotionalStatus", "affinityUpdates", "visualToken", "sceneChanged"]
};

// --- API Functions ---

export const generateCharacters = async (scenario: ScenarioType, model: string): Promise<{ heroine: Character, npcs: Character[] }> => {
  const prompt = `Generate a cast for a "${scenario}" romance visual novel set in Taipei.
  Context keywords: ${scenario === ScenarioType.OFFICE ? 'Xinyi District, Elite, Secret, Overtime, Alcohol, Taipei 101' : 'National Taiwan University, Library, Bicycles, Night Market, First Love, Gongguan'}.
  
  Create:
  1. Main Heroine: Must have a complex personality and a secret.
  2. Two (2) Side Heroines (NPCs): These are NOT random people. They are potential LOVE RIVALS (e.g., Ex-girlfriend, Flirty Colleague, Childhood Friend, Seductive Bar Owner).
  
  The Side Heroines must have a brief 'bio' explaining their romantic interest in the player or how they threaten the Main Heroine's relationship.`;

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION_CORE,
      responseMimeType: "application/json",
      responseSchema: characterSchema
    }
  });

  const json = JSON.parse(response.text || "{}");
  return { heroine: json.heroine, npcs: json.npcs || [] };
};

export const generateStoryTurn = async (
  scenario: ScenarioType,
  heroine: Character,
  npcs: Character[],
  history: { role: string, content: string }[],
  lastChoice: string | undefined,
  model: string,
  currentSummary: string = "",
  turnCount: number = 0,
  previousVisualToken?: string
): Promise<StoryTurn> => {

  const npcContext = (npcs || []).map(n => `- Side Heroine (Rival): ${n.name}, Bio: ${n.bio}`).join('\n');
  
  // Strict Pacing Logic (The Director)
  let pacingInstruction = "";

  if (turnCount <= 3) {
    pacingInstruction = "PHASE: INTRODUCTION (Turns 1-3). Focus on establishing the vibe and the initial chemistry. Keep it subtle. Do not rush.";
  } else if (turnCount <= 8) {
    pacingInstruction = "PHASE: DEVELOPMENT & RIVALRY (Turns 4-8). CRITICAL: Bring in the Side Heroines/Rivals to create jealousy or obstacles. Hint strongly at the Main Heroine's secret. Raise the stakes.";
  } else if (turnCount <= 11) {
    pacingInstruction = "PHASE: CLIMAX (Turns 9-11). The tension peaks. Force the player to make a difficult choice between the Heroine and the Rivals, or confront the secret directly.";
  } else {
    pacingInstruction = "PHASE: CONCLUSION (Turn 12+). Wrap up the story based on affinity. The story will be completed after describing explicit sexual scenes.";
  }

  // Visual Token Logic for Consistency
  const visualTokenInstruction = previousVisualToken 
    ? `VISUAL TOKEN INSTRUCTION: The previous scene token was "${previousVisualToken}". 
       If the characters are still in the same general location and time period (e.g., still in the office, still chatting), YOU MUST RETURN EXACTLY "${previousVisualToken}" as the 'visualToken'. 
       Only generate a NEW token (e.g. "NEW_LOC_TIME") if they physically move or time shifts drastically.`
    : `VISUAL TOKEN INSTRUCTION: Generate a concise, uppercase identifier for this scene (e.g., "OFFICE_NIGHT", "MRT_STATION").`;

  let userPrompt = "";
  if (!lastChoice) {
    // Opening Scene
    userPrompt = `Start the story. Scenario: ${scenario}.
    Main Heroine: ${heroine.name} (${heroine.archetype || 'Mystery'}).
    Available Side Heroines (Rivals):
    ${npcContext}
    
    Setting: The Encounter in Taipei.
    Create a highly atmospheric opening scene where the protagonist meets or interacts with ${heroine.name}.
    Use sensory details (sound of rain, scooters, MRT chimes, humidity).
    
    IMPORTANT: You MUST provide a specific 'dialogue' line for the character (or inner thought) to display in the reaction box.
    
    Initialize the 'newSummary' with the premise of this meeting.
    Set 'phaseLabel' to 'Act I: The Encounter'.
    Set 'emotionalStatus' to 'Strangers'.
    Set 'affinityUpdates' to [{ "target": "Heroine", "change": 0 }].
    ${visualTokenInstruction}
    Select a 'soundKeyword' appropriate for the opening scene (RAIN, CAFE, OFFICE, MRT, NIGHT_MARKET, PARK) or null.
    Set 'sceneChanged' to true (start of game).`;
  } else {
    userPrompt = `Player chose: "${lastChoice}".
    
    [STORY CONTEXT - DO NOT IGNORE]:
    "${currentSummary}"
    
    ${visualTokenInstruction}
    
    [STRICT PACING DIRECTOR - Current Turn: ${turnCount}]:
    ${pacingInstruction}
    
    Main Heroine: ${heroine.name} (Secret: ${heroine.secret}).
    Available Side Heroines (Rivals):
    ${npcContext}

    Instructions:
    1. Continue the narrative based on the choice and the Context.
    2. Evaluate the player's choice against ALL characters.
       - Did it please the Main Heroine?
       - Did it favor a Rival NPC? If so, INCREASE the Rival's affinity and DECREASE the Main Heroine's affinity (Jealousy).
       - Populate 'affinityUpdates' accordingly. Target name must match Heroine or NPC names exactly.
    3. Advance the plot.
    4. Generate a 'phaseLabel' and 'emotionalStatus'.
    5. CRITICAL: Update 'newSummary'.
    6. MANDATORY: Provide a 'dialogue' line (spoken or internal) that reacts to the player's choice.
    7. Select a 'soundKeyword' that matches the location/mood (RAIN, CAFE, OFFICE, MRT, NIGHT_MARKET, PARK) or null.
    8. Set 'sceneChanged' to true ONLY if location or time changed significantly.`;
  }

  // Construct history for context
  const contextParts = history.slice(-4).map(h => ({
    role: h.role === 'user' ? 'user' : 'model',
    parts: [{ text: h.content }]
  }));

  const response = await ai.models.generateContent({
    model: model,
    contents: [
      ...contextParts as any,
      { role: 'user', parts: [{ text: userPrompt }] }
    ],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION_CORE,
      responseMimeType: "application/json",
      responseSchema: storyTurnSchema,
      temperature: 0.8, 
    }
  });

  const json = JSON.parse(response.text || "{}");
  // Safety defaults
  if (!json.choices) json.choices = [];
  if (!json.affinityUpdates) json.affinityUpdates = [];
  
  return json as StoryTurn;
};

export const generateSceneImage = async (location: string, time: string, mood: string, keyword: string): Promise<string | null> => {
  try {
    const imagePrompt = `Anime visual novel background art, high quality, Makoto Shinkai style, digital painting, 4k. 
    Scene: ${location} in Taipei. 
    Time: ${time}. 
    Atmosphere: ${mood}. 
    Details: ${keyword}, detailed scenery, no characters, cinematic lighting.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: imagePrompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (e) {
    console.error("Image generation failed", e);
    return null;
  }
};

export const generateCharacterPortrait = async (
  appearance: { hair: string, eyes: string, clothing_style: string, distinctive_feature: string },
  previousImage?: string,
  context?: string
): Promise<string | null> => {
  try {
    const description = `Hair: ${appearance.hair}, Eyes: ${appearance.eyes}, Clothing: ${appearance.clothing_style}, Feature: ${appearance.distinctive_feature}`;
    
    let promptText = `(Masterpiece, Photorealistic, 8k), Portrait of a beautiful Taiwanese woman.
    Character Description: ${description}.
    detailed skin texture, cinematic lighting, depth of field, shot on Sony A7R IV, 85mm lens, looking at camera.`;

    if (context) {
      promptText += `\nCurrent Scenario Context: ${context}. Adapt the lighting and atmosphere to match this context while keeping the character focus.`;
    }

    if (previousImage) {
      promptText += `\nINSTRUCTION: A reference image of the character is provided. You MUST maintain the facial features, hairstyle, and identity of the person in the reference image exactly. Only update the lighting, pose, and background to match the new context.`;
    } else {
      promptText += `\nNatural expression, bokeh background of Taipei street.`;
    }

    const parts: any[] = [{ text: promptText }];

    if (previousImage) {
      const matches = previousImage.match(/^data:(.+);base64,(.+)$/);
      if (matches && matches[2]) {
        parts.push({
          inlineData: {
            mimeType: matches[1],
            data: matches[2]
          }
        });
      }
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: parts
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4" 
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (e) {
    console.error("Portrait generation failed", e);
    return null;
  }
};
