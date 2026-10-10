import { createRouter } from "./middleware";
import { authRouter } from "./auth-router";
import { gamificationRouter } from "./gamification-router";
import { mentorRouter } from "./mentor-router";
import { courseRouter } from "./course-router";
import { challengeRouter } from "./challenge-router";
import { adminRouter } from "./admin-router";
import { paymentRouter } from "./payment-router";
import { codingRpgRouter } from "./coding-rpg-router";
import { tigerAnalyticsRouter } from "./tiger-analytics-router";

export const appRouter = createRouter({
  auth: authRouter,
  gamification: gamificationRouter,
  mentor: mentorRouter,
  course: courseRouter,
  challenge: challengeRouter,
  admin: adminRouter,
  payment: paymentRouter,
  codingRpg: codingRpgRouter,
  tigerAnalytics: tigerAnalyticsRouter,
});

export type AppRouter = typeof appRouter;
