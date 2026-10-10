import { askBitzyAI } from '../src/ai/brain';

const run = async () => {
  const answer = await askBitzyAI('Explain JavaScript closure');
  console.log(answer);
};

run();