import { relations } from "drizzle-orm";
import {
  users, profiles, courses, modules, lessons, quizzes,
  challenges, achievements, userAchievements,
  codeSubmissions, leaderboardEntries,
  chatMessages,
} from "./schema";

export const usersRelations = relations(users, ({ one }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  modules: many(modules),
  lessons: many(lessons),
  quizzes: many(quizzes),
}));

export const modulesRelations = relations(modules, ({ one, many }) => ({
  course: one(courses, { fields: [modules.courseId], references: [courses.id] }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one }) => ({
  course: one(courses, { fields: [lessons.courseId], references: [courses.id] }),
  module: one(modules, { fields: [lessons.moduleId], references: [modules.id] }),
}));

export const quizzesRelations = relations(quizzes, ({ one }) => ({
  course: one(courses, { fields: [quizzes.courseId], references: [courses.id] }),
}));

export const challengesRelations = relations(challenges, ({ many }) => ({
  submissions: many(codeSubmissions),
}));

export const codeSubmissionsRelations = relations(codeSubmissions, ({ one }) => ({
  challenge: one(challenges, { fields: [codeSubmissions.challengeId], references: [challenges.id] }),
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  achievement: one(achievements, { fields: [userAchievements.achievementId], references: [achievements.id] }),
}));

export const leaderboardEntriesRelations = relations(leaderboardEntries, ({ one }) => ({
  user: one(users, { fields: [leaderboardEntries.userId], references: [users.id] }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, { fields: [chatMessages.userId], references: [users.id] }),
}));
