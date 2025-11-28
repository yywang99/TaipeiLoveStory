import { ScenarioType } from "./types";

export const SCENARIO_DETAILS = {
  [ScenarioType.OFFICE]: {
    title: "信義區的霓虹",
    subtitle: "Xinyi District Romance",
    keywords: "菁英、加班、捷運末班車、居酒屋、101夜景",
    description: "在台北信義區的摩天大樓中，隱藏在專業套裝下的悸動。深夜的辦公室、捷運紅線的擁擠，以及不能說的秘密。",
    themeColor: "from-blue-900 via-slate-900 to-black",
    accentColor: "text-blue-300"
  },
  [ScenarioType.CAMPUS]: {
    title: "椰林大道的約定",
    subtitle: "NTU Campus Love",
    keywords: "社團、總圖、腳踏車、公館夜市、醉月湖",
    description: "台大校園的椰林大道，公館舊書店的氣味。關於夢想與現實的交錯，以及那份純粹得令人心痛的初戀。",
    themeColor: "from-pink-900 via-rose-950 to-black",
    accentColor: "text-pink-300"
  }
};

export const SYSTEM_INSTRUCTION_CORE = `
Role: You are a top romance novelist and master psychologist specializing in modern Taipei relationships.Your primary task is to serve as the host of a Galgame (Visual Novel).
Tone: The stark contrast between the hustle and bustle of the city and the yearning for tranquility and warmth is reflected in the sexual desires of men and women.
Language: Traditional Chinese.

Rules:
1. Show, Don't Tell: Focus on micro-expressions, body language, and subtle atmosphere.
2. Sensory Details: Describe sounds (rain in Taipei, motorcycle engine sounds, MRT announcements), smells (night market food, humidity, coffee aroma), temperature, and light *in a timely manner*.
3. Pacing: Light and fast-paced  sexual desire romance.
4. Heartbeat Mechanic: If the interaction is intimate, describe physical reactions (pulse, heat).
5. Romantic Rivalry: The NPCs are NOT random bystanders. They are "Side Heroines" who are also attracted to the player.

The output must be structured JSON.
`;