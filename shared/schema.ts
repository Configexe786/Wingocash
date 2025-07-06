import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("50.00").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const gameRounds = pgTable("game_rounds", {
  id: serial("id").primaryKey(),
  periodNumber: text("period_number").notNull().unique(),
  result: text("result").notNull(), // 'red', 'green', 'violet'
  number: integer("number").notNull(), // 0-9
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bets = pgTable("bets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  roundId: integer("round_id").references(() => gameRounds.id).notNull(),
  betType: text("bet_type").notNull(), // 'color' or 'number'
  betValue: text("bet_value").notNull(), // 'red', 'green', 'violet' or '0'-'9'
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  payout: decimal("payout", { precision: 10, scale: 2 }).default("0.00"),
  status: text("status").default("pending").notNull(), // 'pending', 'won', 'lost'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertGameRoundSchema = createInsertSchema(gameRounds).pick({
  periodNumber: true,
  result: true,
  number: true,
});

export const insertBetSchema = createInsertSchema(bets).pick({
  userId: true,
  betType: true,
  betValue: true,
  amount: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type GameRound = typeof gameRounds.$inferSelect;
export type InsertGameRound = z.infer<typeof insertGameRoundSchema>;
export type Bet = typeof bets.$inferSelect;
export type InsertBet = z.infer<typeof insertBetSchema>;
