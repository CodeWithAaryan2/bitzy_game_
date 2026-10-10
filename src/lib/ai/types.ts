// ====================================================
// BITZY SUB AI TYPES
// ====================================================

export type AIMode =
  | "teacher"
  | "debug"
  | "interview"
  | "project";


export interface AIUser {
  name: string;
  level: number;
  xp: number;
  streak: number;
}


export interface MemoryMessage {
  role: "user" | "assistant";
  content: string;
}

// Legacy alias
export type AIMessage = MemoryMessage;


export interface AIRequest {
  message: string;

  mode: AIMode;

  user?: AIUser;

  history: MemoryMessage[];
}


export interface AIChallenge {
  title: string;

  xpReward: number;
}


export interface AIResponse {
  text: string;

  // "bitzy" = local KB, "claude" = Claude AI
  source:
    | "bitzy"
    | "claude"
    | "gemini"; // kept for backward compat

  confidence: number;

  challenge?: AIChallenge;
}


// Used inside the React UI
export interface ChatMessage {
  id: string;

  role:
    | "user"
    | "assistant";

  content: string;

  time: string;

  source?:
    | "bitzy"
    | "claude"
    | "gemini";

  challenge?: AIChallenge;
}
