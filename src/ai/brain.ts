import { searchKnowledge } from './search';
import * as KB from '../data/subAiKnowledge';

const knowledge = Object.values(KB).find(Array.isArray) as any[];

const defaultContext = {
  name: 'Aaryan',
  level: 1,
  xp: 0,
  coins: 0,
  energy: 100,
  maxEnergy: 100,
  streak: 0,
  lessonsCompleted: 0,
  challengesSolved: 0,
};

export async function askBitzyAI(question: string) {
  const local = searchKnowledge(question);

  if (!local) {
    return {
      source: 'llama',
      text: 'Knowledge not found. Qwen will answer this offline.'
    };
  }

  const entry = knowledge.find((item) =>
    JSON.stringify(item.keywords) === JSON.stringify(local.keywords)
  );

  let answer = local.response;

  if (entry && typeof entry.response === 'function') {
    answer = entry.response(defaultContext);
  }

  return {
    source: 'knowledge',
    text: answer,
  };
}