import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, protectedProcedure } from "./middleware";
import { getServiceDb } from "./queries/connection";

type Challenge = {
  id: string;
  title: string;
  skillKey: string;
  kind: "choice" | "code";
  prompt: string;
  snippet?: string;
  choices?: { value: string; label: string }[];
  hints: [string, string, string];
  exercise: string;
  accepted: string[];
  explanation: string;
  hinglish: string;
  bossStage?: number;
};

// Fixed, reviewed assessments. User submissions are compared to these rules; code is never executed.
const CHALLENGES: Challenge[] = [
  { id: "detective-syntax", title: "Missing expression", skillKey: "syntax", kind: "choice", prompt: "What kind of mistake stops this statement from being valid JavaScript?", snippet: "const total = ;", choices: [{ value: "missing-expression", label: "The assignment has no value/expression after =" }, { value: "off-by-one", label: "The loop runs one extra time" }, { value: "wrong-index", label: "The array index is out of range" }], hints: ["Look at the token immediately after the equals sign.", "An assignment needs an expression on its right-hand side.", "The value is missing, so the parser cannot finish the statement."], exercise: "Complete the safe assignment: const total = 2 + 3; Which value is assigned?", accepted: ["missing-expression"], explanation: "The right-hand side is empty; provide an expression after `=`.", hinglish: "`=` ke baad koi value/expression nahi hai. Parser ko assignment complete karne ke liye value chahiye." },
  { id: "detective-loop", title: "Loop boundary", skillKey: "loops", kind: "choice", prompt: "Which bug is present in this loop when reading every array item?", snippet: "for (let i = 0; i <= items.length; i++) {\n  console.log(items[i]);\n}", choices: [{ value: "off-by-one", label: "<= reaches items.length, which is not a valid last index" }, { value: "missing-update", label: "The loop never increments i" }, { value: "wrong-variable", label: "items should be declared with const" }], hints: ["For an array of length 3, valid indexes are 0, 1, and 2.", "The condition is still true when i equals the length.", "Use a strict less-than comparison for a zero-based array loop."], exercise: "For a 4-item array, which condition visits every valid index exactly once?", accepted: ["off-by-one"], explanation: "The last valid index is `items.length - 1`; `<= items.length` attempts one extra read.", hinglish: "Array ka last valid index `length - 1` hota hai. `<= length` ek extra invalid index tak chala jaata hai." },
  { id: "detective-condition", title: "Condition assignment", skillKey: "conditions", kind: "choice", prompt: "Why is this condition likely wrong when checking a score?", snippet: "if (score = 10) {\n  unlockReward();\n}", choices: [{ value: "assignment-condition", label: "= assigns 10 instead of comparing the score" }, { value: "wrong-scope", label: "if statements cannot call functions" }, { value: "missing-loop", label: "A condition must be inside a loop" }], hints: ["Inspect the operator between score and 10.", "One equals sign is assignment in JavaScript.", "A comparison usually uses === when types should match too."], exercise: "Which operator checks that score equals 10 without assigning?", accepted: ["assignment-condition"], explanation: "A single `=` assigns; use a comparison such as `===` to test a value.", hinglish: "Single `=` value assign karta hai, compare nahi. Check karne ke liye `===` use karo." },
  { id: "detective-index", title: "Array indexing", skillKey: "indexing", kind: "choice", prompt: "What is wrong with this access when items is a non-empty array?", snippet: "const last = items[items.length];", choices: [{ value: "wrong-index", label: "The first index after the array is out of range" }, { value: "empty-array", label: "Arrays cannot contain strings" }, { value: "immutable", label: "const prevents reading an array" }], hints: ["Array indexes start at zero.", "A length of 3 means the last index is 2.", "Subtract one from length to get the final valid index."], exercise: "Write the index expression for the last item in a non-empty array named items.", accepted: ["items.length-1", "items[items.length-1]", "items[items.length - 1]"], explanation: "For a non-empty array, the last item is at `length - 1`, not at `length`.", hinglish: "Non-empty array ka last index `length - 1` hai, `length` nahi." },
  { id: "detective-logic", title: "Boolean logic", skillKey: "logic", kind: "choice", prompt: "Which operator allows either requirement to pass, rather than requiring both?", snippet: "if (isMember && hasInvite) {\n  enter();\n}", choices: [{ value: "or-operator", label: "|| (OR)" }, { value: "and-operator", label: "&& (AND)" }, { value: "not-operator", label: "! (NOT)" }], hints: ["&& requires both sides to be true.", "The prompt says either requirement is enough.", "The OR operator in JavaScript is two vertical bars."], exercise: "A user can enter as a member OR with an invite. Which operator expresses that rule?", accepted: ["or-operator"], explanation: "`&&` requires both values; `||` is true when either value is true.", hinglish: "`&&` dono conditions true maangta hai. Kisi ek ke true hone par `||` sahi operator hai." },
  { id: "detective-practice-syntax", title: "Practice · Expressions", skillKey: "syntax", kind: "choice", prompt: "What value is assigned by const total = 2 + 3;?", choices: [{ value: "5", label: "5" }, { value: "23", label: "23" }, { value: "undefined", label: "undefined" }], hints: ["The plus sign adds the two numeric values.", "Evaluate the right-hand expression before assigning it.", "2 + 3 equals 5."], exercise: "A valid assignment needs an expression after the equals sign.", accepted: ["5"], explanation: "The expression evaluates to 5, which is assigned to total.", hinglish: "2 + 3 ka result 5 hai, wahi total mein assign hota hai." },
  { id: "detective-practice-loops", title: "Practice · Loop boundaries", skillKey: "loops", kind: "choice", prompt: "Which condition visits every valid index in an array exactly once?", choices: [{ value: "i < items.length", label: "i < items.length" }, { value: "i <= items.length", label: "i <= items.length" }, { value: "i <= items.length - 1", label: "i <= items.length - 1" }], hints: ["Indexes begin at zero.", "The final valid index is length minus one.", "Stop when i reaches the length; do not include it."], exercise: "Compare the last valid index with the array length.", accepted: ["i<items.length"], explanation: "Strictly less than length covers indices 0 through length - 1.", hinglish: "`i < items.length` zero se length - 1 tak valid indexes cover karta hai." },
  { id: "detective-practice-conditions", title: "Practice · Comparisons", skillKey: "conditions", kind: "choice", prompt: "Which operator compares values without assigning?", choices: [{ value: "===", label: "=== (strict equality)" }, { value: "=", label: "= (assignment)" }, { value: "++", label: "++ (increment)" }], hints: ["A single equals sign assigns.", "JavaScript has a strict equality comparison operator.", "Use three equals signs for strict equality."], exercise: "Choose the comparison operator, not the assignment operator.", accepted: ["==="], explanation: "`===` compares values and types without changing the variable.", hinglish: "`===` value aur type compare karta hai, variable ko assign nahi karta." },
  { id: "detective-practice-indexing", title: "Practice · Array indexes", skillKey: "indexing", kind: "choice", prompt: "What index expression accesses the last item in a non-empty array?", choices: [{ value: "items.length - 1", label: "items.length - 1" }, { value: "items.length", label: "items.length" }, { value: "items.length + 1", label: "items.length + 1" }], hints: ["The first index is zero.", "An array of length 3 has indexes 0, 1, and 2.", "Subtract one from the length."], exercise: "Turn an array length into its final zero-based index.", accepted: ["items.length-1"], explanation: "The final valid index is one less than the array length.", hinglish: "Last valid index array ki length se ek kam hota hai." },
  { id: "detective-practice-logic", title: "Practice · Boolean logic", skillKey: "logic", kind: "choice", prompt: "Use which operator when either condition may allow access?", choices: [{ value: "||", label: "|| (OR)" }, { value: "&&", label: "&& (AND)" }, { value: "!", label: "! (NOT)" }], hints: ["AND requires both conditions.", "OR requires at least one condition.", "In JavaScript, OR is written as two vertical bars."], exercise: "Translate the word either into a Boolean operator.", accepted: ["||"], explanation: "`||` is true when either side is true.", hinglish: "`||` par expression true hota hai jab dono mein se koi ek true ho." },
  { id: "boss-apprentice-stage-1", title: "Stage 1 · Predict output", skillKey: "loops", kind: "choice", prompt: "What values are printed, in order?", snippet: "for (let i = 0; i < 3; i++) console.log(i);", choices: [{ value: "0,1,2", label: "0, 1, 2" }, { value: "1,2,3", label: "1, 2, 3" }, { value: "0,1,2,3", label: "0, 1, 2, 3" }], hints: ["Start with i = 0.", "The body runs while i is strictly less than 3.", "The final printed value is 2."], exercise: "For i = 0; i < 2; i++, what two values are printed?", accepted: ["0,1,2"], explanation: "The loop begins at zero and stops before 3, so it prints 0, 1, and 2.", hinglish: "Loop 0 se start hota hai aur 3 se pehle rukta hai, isliye output 0, 1, 2 hai.", bossStage: 1 },
  { id: "boss-apprentice-stage-2", title: "Stage 2 · Identify the bug", skillKey: "indexing", kind: "choice", prompt: "Find the indexing bug in this snippet.", snippet: "const item = items[items.length];", choices: [{ value: "out-of-range", label: "The index should be items.length - 1" }, { value: "off-by-zero", label: "The first array index is 1" }, { value: "missing-return", label: "Array reads must use return" }], hints: ["JavaScript arrays are zero-indexed.", "For length 5, valid indexes go from 0 through 4.", "The last valid index is length minus one."], exercise: "For a non-empty 5-item array, what is its last valid index?", accepted: ["out-of-range"], explanation: "`items.length` is one past the last index; use `items.length - 1`.", hinglish: "`items.length` last index se ek aage hai. `items.length - 1` use karo.", bossStage: 2 },
  { id: "boss-apprentice-stage-3", title: "Stage 3 · Complete the code", skillKey: "loops", kind: "code", prompt: "Fill the loop condition so every valid item is visited once.", snippet: "for (let i = 0; CONDITION; i++) {\n  visit(items[i]);\n}", hints: ["The first index is zero.", "Stop before the array length.", "Use i < items.length."], exercise: "For a 2-item array, the condition i < items.length visits indexes 0 and 1.", accepted: ["i<items.length", "i<items.length;", "i < items.length"], explanation: "`i < items.length` visits every valid index without reading beyond the array.", hinglish: "`i < items.length` har valid index visit karta hai aur array ke bahar nahi jaata.", bossStage: 3 },
  { id: "boss-apprentice-stage-4", title: "Stage 4 · Final challenge", skillKey: "logic", kind: "code", prompt: "Complete the function body to return the sum of all numeric prices. Do not execute code here; submit the expression for validation.", snippet: "function total(prices) {\n  // return the sum, starting at 0\n  YOUR ANSWER\n}", hints: ["A running total needs an initial value of zero.", "Array reduce combines the values into one result.", "Return prices.reduce((sum, price) => sum + price, 0);"], exercise: "Trace the reduction for [2, 3]: start at 0, add 2, then add 3.", accepted: ["returnprices.reduce((sum,price)=>sum+price,0)", "returnprices.reduce((sum,price)=>sum+price,0);", "returnprices.reduce((total,price)=>total+price,0)", "returnprices.reduce((total,price)=>total+price,0);"], explanation: "The reducer accumulates each price from an initial total of zero.", hinglish: "Reducer zero se start karke har price ko total mein add karta hai.", bossStage: 4 },
];

const normalize = (value: string) => value.toLowerCase().replace(/[\s`;'"{}]/g, "").trim();
const publicChallenge = ({ accepted: _accepted, explanation: _explanation, hinglish: _hinglish, ...c }: Challenge) => c;

export function isCorrectAssessmentAnswer(assessmentId: string, answer: string): boolean {
  const challenge = CHALLENGES.find(c => c.id === assessmentId);
  return Boolean(challenge && challenge.accepted.some(expected => normalize(expected) === normalize(answer)));
}

export const codingRpgRouter = createRouter({
  catalog: protectedProcedure.query(() => ({ challenges: CHALLENGES.map(publicChallenge) })),
  state: protectedProcedure.query(async ({ ctx }) => {
    const db = getServiceDb();
    const [{ data: attempts, error: attemptsError }, { data: mastery, error: masteryError }, { data: rewards, error: rewardsError }] = await Promise.all([
      db.from("coding_rpg_attempts").select("attempt_id,assessment_id,skill_key,answer,is_correct,hints_used,created_at").eq("user_id", ctx.userId).order("created_at", { ascending: false }).limit(200),
      db.from("coding_rpg_mastery").select("skill_key,verified_assessments,verified_at").eq("user_id", ctx.userId),
      db.from("coding_rpg_rewards").select("reward_key,xp_awarded,coins_awarded,created_at").eq("user_id", ctx.userId),
    ]);
    if (attemptsError || masteryError || rewardsError) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not load verified learning progress." });
    const bossStages = new Set((attempts ?? []).filter((a: any) => a.assessment_id.startsWith("boss-apprentice-stage-") && a.is_correct).map((a: any) => a.assessment_id));
    return { attempts: attempts ?? [], mastery: mastery ?? [], rewards: rewards ?? [], bossComplete: [1, 2, 3, 4].every(n => bossStages.has(`boss-apprentice-stage-${n}`)) };
  }),
  submit: protectedProcedure.input(z.object({ assessmentId: z.string().min(1).max(80), answer: z.string().trim().min(1).max(1500), hintsUsed: z.number().int().min(0).max(3).default(0), submissionKey: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const challenge = CHALLENGES.find(c => c.id === input.assessmentId);
    if (!challenge) throw new TRPCError({ code: "NOT_FOUND", message: "Assessment not found." });
    const db = getServiceDb();
    if (challenge.bossStage === 1) {
      const { data: prerequisite } = await db.from("coding_rpg_mastery").select("skill_key").eq("user_id", ctx.userId).limit(1);
      if (!prerequisite?.length) throw new TRPCError({ code: "FORBIDDEN", message: "Complete one verified Bug Detective assessment to unlock the boss." });
    }
    if (challenge.bossStage && challenge.bossStage > 1) {
      const previousId = `boss-apprentice-stage-${challenge.bossStage - 1}`;
      const { data: previous } = await db.from("coding_rpg_attempts").select("attempt_id").eq("user_id", ctx.userId).eq("assessment_id", previousId).eq("is_correct", true).limit(1);
      if (!previous?.length) throw new TRPCError({ code: "FORBIDDEN", message: "Clear the previous boss stage first." });
    }
    const correct = isCorrectAssessmentAnswer(challenge.id, input.answer);
    const { data, error } = await db.rpc("record_coding_rpg_attempt", {
      p_user_id: ctx.userId,
      p_submission_key: input.submissionKey,
      p_assessment_id: challenge.id,
      p_skill_key: challenge.skillKey,
      p_answer: input.answer.slice(0, 1500),
      p_is_correct: correct,
      p_hints_used: input.hintsUsed,
      p_reward_key: challenge.bossStage === 4 ? "boss-apprentice-complete" : null,
      p_boss_stage: challenge.bossStage ?? null,
    });
    if (error) {
      console.error("coding RPG attempt persistence failed", error.message);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Your answer could not be saved. Please try again." });
    }
    const result = Array.isArray(data) ? data[0] : data;
    const verified = Boolean(result?.verified ?? correct);
    return {
      correct: verified,
      explanation: verified ? challenge.explanation : `Review the clue, then try again. ${challenge.explanation}`,
      hinglish: verified ? challenge.hinglish : `Chhota hint: ${challenge.hinglish}`,
      attemptId: result?.attempt_id ?? null,
      xpAwarded: Number(result?.xp_awarded ?? 0),
      coinsAwarded: Number(result?.coins_awarded ?? 0),
      bossComplete: Boolean(result?.boss_complete),
      verifiedSkill: verified ? challenge.skillKey : null,
    };
  }),
});
