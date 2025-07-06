import { users, gameRounds, bets, type User, type InsertUser, type GameRound, type InsertGameRound, type Bet, type InsertBet } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: number, newBalance: string): Promise<void>;
  
  // Game round methods
  createGameRound(round: InsertGameRound): Promise<GameRound>;
  getCurrentRound(): Promise<GameRound | undefined>;
  getRecentRounds(limit: number): Promise<GameRound[]>;
  
  // Bet methods
  createBet(bet: InsertBet): Promise<Bet>;
  getBetsByRoundId(roundId: number): Promise<Bet[]>;
  updateBetResult(betId: number, status: string, payout: string): Promise<void>;
  getBetsByUserId(userId: number, limit?: number): Promise<Bet[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, balance: "50.00" })
      .returning();
    return user;
  }

  async updateUserBalance(userId: number, newBalance: string): Promise<void> {
    await db
      .update(users)
      .set({ balance: newBalance })
      .where(eq(users.id, userId));
  }

  // Game round methods
  async createGameRound(round: InsertGameRound): Promise<GameRound> {
    const [gameRound] = await db
      .insert(gameRounds)
      .values(round)
      .returning();
    return gameRound;
  }

  async getCurrentRound(): Promise<GameRound | undefined> {
    const [round] = await db
      .select()
      .from(gameRounds)
      .orderBy(desc(gameRounds.createdAt))
      .limit(1);
    return round || undefined;
  }

  async getRecentRounds(limit: number): Promise<GameRound[]> {
    return await db
      .select()
      .from(gameRounds)
      .orderBy(desc(gameRounds.createdAt))
      .limit(limit);
  }

  // Bet methods
  async createBet(bet: InsertBet): Promise<Bet> {
    const [newBet] = await db
      .insert(bets)
      .values(bet)
      .returning();
    return newBet;
  }

  async getBetsByRoundId(roundId: number): Promise<Bet[]> {
    return await db
      .select()
      .from(bets)
      .where(eq(bets.roundId, roundId));
  }

  async updateBetResult(betId: number, status: string, payout: string): Promise<void> {
    await db
      .update(bets)
      .set({ status, payout })
      .where(eq(bets.id, betId));
  }

  async getBetsByUserId(userId: number, limit: number = 10): Promise<Bet[]> {
    return await db
      .select()
      .from(bets)
      .where(eq(bets.userId, userId))
      .orderBy(desc(bets.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
