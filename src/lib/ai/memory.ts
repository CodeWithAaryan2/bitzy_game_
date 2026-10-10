import type { AIMessage } from "./types";


// Store recent messages
class MemoryManager {

  private history: AIMessage[] = [];


  add(role: "user" | "assistant", content: string) {

    this.history.push({
      role,
      content,
    });


    // Keep only last 20 messages
    if (this.history.length > 20) {
      this.history.shift();
    }
  }


  getHistory() {
    return this.history;
  }


  clear() {
    this.history = [];
  }


  getLastTopic() {

    const lastUser =
      [...this.history]
        .reverse()
        .find(msg => msg.role === "user");

    return lastUser?.content || null;
  }

}


// Single global memory
export const subAIMemory =
  new MemoryManager();