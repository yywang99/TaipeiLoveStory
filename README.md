# 台北戀愛物語 (Taipei Love Story)

這是一個以台北為背景的 AI 驅動互動式戀愛視覺小說。本專案利用生成式 AI 根據玩家的選擇，即時創造獨特的角色、劇情、對話和視覺效果。

## 🌟 特色

*   **動態敘事**：每次遊玩都是獨一無二的。故事、對話和旁白皆由 Google 的 Gemini 2.5 Flash 模型即時生成。
*   **AI 生成角色**：根據選擇的場景（辦公室或校園）創建角色（女主角和情敵），包含完整的個性、秘密和背景故事。
*   **視覺小說體驗**：
    *   **沉浸式背景**：反映即時地點、時間和氛圍的 AI 生成動漫風格背景。
    *   **角色立繪**：根據情境生成並更新的一致性角色立繪。
    *   **環境音效**：建議的環境音效（如雨聲、捷運聲、夜市聲）以增強沉浸感。
*   **互動選擇**：你的選擇至關重要。它們將影響角色好感度、劇情走向以及最終結局。
*   **好感度系統**：追蹤你與女主角及情敵 NPC 的關係狀態。
*   **存檔/讀檔系統**：匯出與匯入你的遊戲進度，隨時繼續你的故事。
*   **客製化設定**：可調整字體大小和靜音設定。

## 🛠️ 技術堆疊

*   **前端框架**：[React](https://react.dev/) (v19) 搭配 [Vite](https://vitejs.dev/)
*   **語言**：[TypeScript](https://www.typescriptlang.org/)
*   **樣式**：[Tailwind CSS](https://tailwindcss.com/)
*   **AI 模型**：[Google Gemini API](https://ai.google.dev/) (`gemini-2.5-flash` 用於文字，`gemini-2.5-flash-image` 用於視覺)
*   **SDK**：`@google/genai`
*   **圖示**：[Lucide React](https://lucide.dev/)

## 🚀 快速開始

### 先決條件

*   Node.js (推薦 v18 或更高版本)
*   npm 或 yarn
*   擁有已啟用 Gemini API 的 Google Cloud 專案及 API 金鑰。

### 安裝

1.  **複製專案庫**
    ```bash
    git clone <repository-url>
    cd 台北戀愛物語
    ```

2.  **安裝依賴套件**
    ```bash
    npm install
    ```

3.  **設定環境變數**
    在根目錄建立一個 `.env.local` 檔案，並加入你的 Google Gemini API 金鑰：
    ```env
    VITE_GEMINI_API_KEY=your_api_key_here
    ```
    *(注意：請確保你的程式碼使用正確的 process.env 或 import.meta.env 來存取 Vite 環境變數。目前的程式碼庫使用 `process.env.API_KEY`，你可能需要設定 `vite-plugin-environment` 或切換至 `import.meta.env.VITE_GEMINI_API_KEY`)*

4.  **執行開發伺服器**
    ```bash
    npm run dev
    ```

5.  **建置生產版本**
    ```bash
    npm run build
    ```

## 📂 專案結構

```
/
├── components/         # UI 元件
│   ├── StartScreen.tsx   # 場景選擇
│   ├── LoadingScreen.tsx # 載入狀態
│   └── GameScreen.tsx    # 主要視覺小說介面
├── services/           # 後端/AI 邏輯
│   └── geminiService.ts  # 與 Google GenAI 的互動（文字與圖片）
├── App.tsx             # 主要應用程式狀態和路由
├── types.ts            # TypeScript 介面 (GameState, Character, StoryTurn)
└── constants.ts        # 系統提示詞和設定
```

## 🧠 運作原理

1.  **初始化**：使用者選擇一個場景（例如：辦公室或校園）。
2.  **角色生成**：AI 生成一位`女主角`和兩位`情敵 NPC`，並為該場景量身打造特定的原型和秘密。
3.  **故事迴圈**：
    *   **回合生成**：AI 生成下一個故事片段（`StoryTurn`），包含敘述、對話、選擇和視覺提示。
    *   **狀態更新**：遊戲根據玩家的選擇更新好感度分數、歷史記錄和庫存。
    *   **視覺效果**：背景和立繪會根據 `visualToken` 邏輯生成或重複使用，以確保一致性。
4.  **節奏導演**：故事遵循由回合數控制的結構化弧線（介紹 -> 發展 -> 高潮 -> 結局）。

## 🤝 貢獻

歡迎提交貢獻！請隨時提交 Pull Request。

## 📄 授權

[MIT License](LICENSE)
