import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { insertBetSchema } from "@shared/schema";

// Live game engine
class LiveGameEngine {
  private currentRoundId: number | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private wsServer: WebSocketServer | null = null;
  private basePeriodNumber: string = "127927270";
  private currentSequence: number = 867;

  constructor() {
    this.initializeSequence();
  }

  private async initializeSequence() {
    try {
      // Get the latest round to determine the next sequence number
      const recentRounds = await storage.getRecentRounds(1);
      if (recentRounds.length > 0) {
        const latestPeriod = recentRounds[0].periodNumber;
        // Extract last 3 digits and increment
        const lastThreeDigits = parseInt(latestPeriod.slice(-3));
        this.currentSequence = lastThreeDigits;
      }
    } catch (error) {
      console.error('Error initializing sequence:', error);
    }
    this.startGameLoop();
  }

  setWebSocketServer(wsServer: WebSocketServer) {
    this.wsServer = wsServer;
  }

  private generatePeriodNumber(): string {
    this.currentSequence++;
    if (this.currentSequence > 999) {
      this.currentSequence = 0;
    }
    return this.basePeriodNumber + this.currentSequence.toString().padStart(3, '0');
  }

  private generateResult(): { color: string; number: number } {
    const number = Math.floor(Math.random() * 10);
    let color: string;
    
    if (number === 0) {
      color = Math.random() < 0.5 ? 'red' : 'violet';
    } else if (number === 5) {
      color = Math.random() < 0.5 ? 'green' : 'violet';
    } else if ([1, 3, 7, 9].includes(number)) {
      color = 'green';
    } else {
      color = 'red';
    }

    return { color, number };
  }

  private async processRoundResult(roundId: number, result: { color: string; number: number }) {
    try {
      // Get all bets for this round
      const bets = await storage.getBetsByRoundId(roundId);
      
      // Process each bet
      for (const bet of bets) {
        let won = false;
        let multiplier = 0;

        if (bet.betType === 'color') {
          if (bet.betValue === result.color) {
            won = true;
            // Updated multipliers: Red/Green = 1.95x, Violet = 4.5x
            multiplier = result.color === 'violet' ? 4.5 : 1.95;
          }
        } else if (bet.betType === 'number') {
          if (parseInt(bet.betValue) === result.number) {
            won = true;
            multiplier = 9;
          }
        }

        const payout = won ? (parseFloat(bet.amount) * multiplier).toString() : "0.00";
        const status = won ? 'won' : 'lost';

        // Update bet result
        await storage.updateBetResult(bet.id, status, payout);

        // Update user balance if won
        if (won) {
          const user = await storage.getUser(bet.userId);
          if (user) {
            const newBalance = (parseFloat(user.balance) + parseFloat(payout)).toString();
            await storage.updateUserBalance(bet.userId, newBalance);
          }
        }
      }
    } catch (error) {
      console.error('Error processing round result:', error);
    }
  }

  private async createNewRound() {
    const periodNumber = this.generatePeriodNumber();
    const result = this.generateResult();
    
    const round = await storage.createGameRound({
      periodNumber,
      result: result.color,
      number: result.number,
    });

    this.currentRoundId = round.id;

    // Process previous round results if any
    const recentRounds = await storage.getRecentRounds(2);
    if (recentRounds.length > 1) {
      await this.processRoundResult(recentRounds[1].id, {
        color: recentRounds[1].result,
        number: recentRounds[1].number
      });
    }

    // Broadcast to all connected clients
    this.broadcastGameUpdate();
  }

  private broadcastGameUpdate() {
    if (this.wsServer) {
      this.wsServer.clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(JSON.stringify({ type: 'game_update' }));
        }
      });
    }
  }

  private startGameLoop() {
    // Create initial round
    this.createNewRound();

    // Create new round every 30 seconds
    this.intervalId = setInterval(() => {
      this.createNewRound();
    }, 30000);
  }

  stopGameLoop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

const gameEngine = new LiveGameEngine();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // TODO: Re-enable WebSocket after fixing conflicts with Vite HMR
  // For now, rely on polling for real-time updates

  // API Routes
  
  // Get current game state
  app.get('/api/game/current', async (req, res) => {
    try {
      const currentRound = await storage.getCurrentRound();
      const recentRounds = await storage.getRecentRounds(20);
      
      res.json({
        currentRound,
        recentRounds,
        serverTime: Date.now()
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get game state' });
    }
  });

  // Place a bet
  app.post('/api/game/bet', async (req, res) => {
    try {
      // Get current round first
      const currentRound = await storage.getCurrentRound();
      if (!currentRound) {
        return res.status(400).json({ error: 'No active round' });
      }

      // Validate bet data (without roundId)
      const validatedBetData = insertBetSchema.parse(req.body);
      
      // Add roundId to the validated data
      const betData = {
        ...validatedBetData,
        roundId: currentRound.id
      };

      // Check if user has sufficient balance
      const user = await storage.getUser(betData.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const betAmount = parseFloat(betData.amount);
      const userBalance = parseFloat(user.balance);

      if (userBalance < betAmount) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      // Create bet
      const bet = await storage.createBet(betData);

      // Deduct bet amount from user balance
      const newBalance = (userBalance - betAmount).toString();
      await storage.updateUserBalance(betData.userId, newBalance);

      res.json({ bet, message: 'Bet placed successfully' });
    } catch (error) {
      console.error('Bet placement error:', error);
      res.status(500).json({ error: 'Failed to place bet' });
    }
  });

  // Get user's bet history
  app.get('/api/user/:userId/bets', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const bets = await storage.getBetsByUserId(userId, 20);
      res.json(bets);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get bet history' });
    }
  });

  // Get user by ID (for balance refresh)
  app.get('/api/user/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);
      
      if (user) {
        res.json({ user: { ...user, password: undefined } });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to get user' });
    }
  });

  // User login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (user && user.password === password) {
        res.json({ user: { ...user, password: undefined } });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // User registration
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      const user = await storage.createUser({ username, password });
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  return httpServer;
}
