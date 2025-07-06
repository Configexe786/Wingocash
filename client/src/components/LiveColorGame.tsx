import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface GameRound {
  id: number;
  periodNumber: string;
  result: string;
  number: number;
  createdAt: string;
}

interface User {
  id: number;
  username: string;
  balance: string;
}

interface LiveColorGameProps {
  user: User;
  onBalanceUpdate: (newBalance: string) => void;
}

const LiveColorGame: React.FC<LiveColorGameProps> = ({ user, onBalanceUpdate }) => {
  const [selectedBet, setSelectedBet] = useState<{type: string, value: string} | null>(null);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [currentPeriod, setCurrentPeriod] = useState<string>('');
  const [currentRoundId, setCurrentRoundId] = useState<number | null>(null);
  const [userActiveBets, setUserActiveBets] = useState<Set<number>>(new Set());
  const [lastProcessedRound, setLastProcessedRound] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch current game state
  const { data: gameState, refetch } = useQuery({
    queryKey: ['/api/game/current'],
    refetchInterval: 2000, // Poll every 2 seconds for real-time updates
  });

  // Fetch user bets to track wins/losses
  const { data: userBets } = useQuery({
    queryKey: ['/api/user', user.id, 'bets'],
    refetchInterval: 3000, // Check for bet results
  });

  // Function to refresh balance by invalidating queries and checking latest bet results
  const checkAndUpdateBalance = async () => {
    // Force refresh of user bets to get latest results
    queryClient.invalidateQueries({ queryKey: ['/api/user', user.id, 'bets'] });
    
    // Get the latest user balance from the server using bet history
    try {
      const betsResponse = await apiRequest(`/api/user/${user.id}/bets`);
      if (betsResponse && betsResponse.length > 0) {
        // Check if there are recent wins that need balance updates
        const recentWins = betsResponse.filter((bet: any) => 
          bet.status === 'won' && userActiveBets.has(bet.roundId)
        );
        
        if (recentWins.length > 0) {
          // Calculate expected balance based on wins
          let balanceAdjustment = 0;
          recentWins.forEach((bet: any) => {
            balanceAdjustment += parseFloat(bet.payout);
          });
          
          if (balanceAdjustment > 0) {
            const newBalance = (parseFloat(user.balance) + balanceAdjustment).toString();
            onBalanceUpdate(newBalance);
          }
        }
      }
    } catch (error) {
      console.error('Failed to check balance:', error);
    }
  };

  // Place bet mutation
  const placeBetMutation = useMutation({
    mutationFn: (betData: any) => apiRequest('/api/game/bet', {
      method: 'POST',
      body: JSON.stringify({
        userId: user.id,
        betType: betData.type,
        betValue: betData.value,
        amount: betData.amount.toString(),
      }),
    }),
    onSuccess: (data) => {
      toast({
        title: "Bet Placed!",
        description: `₹${betAmount} bet placed successfully`,
      });
      // Track this bet for result notifications
      setUserActiveBets(prev => new Set([...prev, data.bet.roundId]));
      // Update user balance
      const newBalance = (parseFloat(user.balance) - betAmount).toString();
      onBalanceUpdate(newBalance);
      queryClient.invalidateQueries({ queryKey: ['/api/game/current'] });
      setSelectedBet(null);
    },
    onError: (error: any) => {
      toast({
        title: "Bet Failed",
        description: error.message || "Failed to place bet",
        variant: "destructive",
      });
    },
  });

  // TODO: Re-enable WebSocket for real-time updates after fixing conflicts
  // For now, relying on polling via React Query refetchInterval

  // Timer logic
  useEffect(() => {
    if (gameState?.currentRound?.createdAt) {
      const roundStartTime = new Date(gameState.currentRound.createdAt).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - roundStartTime) / 1000);
      const remaining = Math.max(0, 30 - elapsed);
      setTimeLeft(remaining);
      setCurrentPeriod(gameState.currentRound.periodNumber);

      if (remaining > 0) {
        const interval = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(interval);
      }
    }
  }, [gameState]);

  // Check for bet results and show win/lose notifications
  useEffect(() => {
    if (userBets && userBets.length > 0) {
      const recentBets = userBets.slice(0, 5); // Check last 5 bets
      
      recentBets.forEach((bet: any) => {
        const roundId = bet.roundId;
        
        // If this bet has a result and we haven't processed it yet
        if (bet.status !== 'pending' && userActiveBets.has(roundId)) {
          const betAmount = parseFloat(bet.amount);
          const payout = parseFloat(bet.payout);
          
          if (bet.status === 'won') {
            toast({
              title: "🎉 You Won!",
              description: `Bet: ₹${betAmount.toFixed(2)} → Won: ₹${payout.toFixed(2)}`,
              duration: 5000,
            });
            // Update balance immediately with the payout
            const newBalance = (parseFloat(user.balance) + payout).toString();
            onBalanceUpdate(newBalance);
          } else if (bet.status === 'lost') {
            toast({
              title: "❌ You Lost",
              description: `Lost ₹${betAmount.toFixed(2)} bet`,
              variant: "destructive",
              duration: 3000,
            });
          }
          
          // Remove from active bets so we don't show notification again
          setUserActiveBets(prev => {
            const newSet = new Set(prev);
            newSet.delete(roundId);
            return newSet;
          });
        }
      });
    }
  }, [userBets, userActiveBets, user.balance, onBalanceUpdate]);

  const handleBetSelection = (type: string, value: string) => {
    if (timeLeft <= 5) {
      toast({
        title: "Betting Closed",
        description: "Betting is closed for this round",
        variant: "destructive",
      });
      return;
    }
    setSelectedBet({ type, value });
  };

  const handlePlaceBet = () => {
    if (!selectedBet) return;
    
    if (parseFloat(user.balance) < betAmount) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance to place this bet",
        variant: "destructive",
      });
      return;
    }

    placeBetMutation.mutate({
      type: selectedBet.type,
      value: selectedBet.value,
      amount: betAmount,
    });
  };

  const getColorClass = (color: string) => {
    switch (color) {
      case 'red': return 'bg-red-500 text-white';
      case 'green': return 'bg-green-500 text-white';
      case 'violet': return 'bg-purple-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getNumberColor = (num: number): string => {
    if (num === 0) return 'red-violet';
    if (num === 5) return 'green-violet';
    if ([1, 3, 7, 9].includes(num)) return 'green';
    return 'red';
  };

  return (
    <div className="space-y-6">
      {/* Game Header */}
      <Card className="bg-gradient-to-r from-slate-800 to-slate-900 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Live Color Trading</h2>
              <p className="text-slate-300">Period: {currentPeriod}</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">
                {String(timeLeft).padStart(2, '0')}
              </div>
              <p className="text-slate-300">seconds left</p>
            </div>
          </div>
          
          {/* Status indicator */}
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${timeLeft > 5 ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            <span className="text-white">
              {timeLeft > 5 ? 'Betting Open' : 'Betting Closed'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Betting Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Color Betting */}
        <Card>
          <CardHeader>
            <CardTitle>Bet on Colors</CardTitle>
            <CardDescription>Choose a color and place your bet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={selectedBet?.type === 'color' && selectedBet?.value === 'red' ? 'default' : 'outline'}
                className="h-20 bg-red-500 hover:bg-red-600 text-white border-red-500"
                onClick={() => handleBetSelection('color', 'red')}
                disabled={timeLeft <= 5}
              >
                <div className="text-center">
                  <div className="text-lg font-bold">Red</div>
                  <div className="text-sm">1.95x</div>
                </div>
              </Button>
              
              <Button
                variant={selectedBet?.type === 'color' && selectedBet?.value === 'violet' ? 'default' : 'outline'}
                className="h-20 bg-purple-500 hover:bg-purple-600 text-white border-purple-500"
                onClick={() => handleBetSelection('color', 'violet')}
                disabled={timeLeft <= 5}
              >
                <div className="text-center">
                  <div className="text-lg font-bold">Violet</div>
                  <div className="text-sm">4.5x</div>
                </div>
              </Button>
              
              <Button
                variant={selectedBet?.type === 'color' && selectedBet?.value === 'green' ? 'default' : 'outline'}
                className="h-20 bg-green-500 hover:bg-green-600 text-white border-green-500"
                onClick={() => handleBetSelection('color', 'green')}
                disabled={timeLeft <= 5}
              >
                <div className="text-center">
                  <div className="text-lg font-bold">Green</div>
                  <div className="text-sm">1.95x</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Number Betting */}
        <Card>
          <CardHeader>
            <CardTitle>Bet on Numbers</CardTitle>
            <CardDescription>Choose a number (0-9) for higher payout</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 10 }, (_, i) => (
                <Button
                  key={i}
                  variant={selectedBet?.type === 'number' && selectedBet?.value === i.toString() ? 'default' : 'outline'}
                  className={`h-12 ${getNumberColor(i) === 'green' ? 'border-green-500' : 
                    getNumberColor(i) === 'red' ? 'border-red-500' : 'border-purple-500'}`}
                  onClick={() => handleBetSelection('number', i.toString())}
                  disabled={timeLeft <= 5}
                >
                  <div className="text-center">
                    <div className="font-bold">{i}</div>
                    <div className="text-xs">9x</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bet Amount & Place Bet */}
      {selectedBet && (
        <Card className="border-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Selected: {selectedBet.type === 'color' ? selectedBet.value : `Number ${selectedBet.value}`}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <span>Amount:</span>
                  <select 
                    value={betAmount} 
                    onChange={(e) => setBetAmount(Number(e.target.value))}
                    className="border rounded px-2 py-1"
                  >
                    <option value={10}>₹10</option>
                    <option value={50}>₹50</option>
                    <option value={100}>₹100</option>
                    <option value={500}>₹500</option>
                  </select>
                </div>
              </div>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setSelectedBet(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handlePlaceBet}
                  disabled={placeBetMutation.isPending || timeLeft <= 5}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                >
                  {placeBetMutation.isPending ? 'Placing...' : 'Place Bet'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Results */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Results</CardTitle>
          <CardDescription>Latest 20 game results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 md:grid-cols-10 gap-2">
            {gameState?.recentRounds?.slice(0, 20).map((round: GameRound) => (
              <div key={round.id} className="text-center p-2 border rounded">
                <div className="text-xs text-gray-500 mb-1">
                  {round.periodNumber.slice(-4)}
                </div>
                <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-white text-sm font-bold ${getColorClass(round.result)}`}>
                  {round.number}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveColorGame;