
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

const ColorGame = ({ user, balance, onBalanceUpdate }) => {
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes in seconds
  const [currentPeriod, setCurrentPeriod] = useState(1);
  const [selectedColor, setSelectedColor] = useState('');
  const [betAmount, setBetAmount] = useState('');
  const [gameHistory, setGameHistory] = useState([]);
  const [canBet, setCanBet] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize game history
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('tirangaGameHistory') || '[]');
    if (history.length === 0) {
      // Initialize with some sample data
      const sampleHistory = [
        { period: 1, result: 'red', timestamp: Date.now() - 180000 },
        { period: 2, result: 'green', timestamp: Date.now() - 360000 },
        { period: 3, result: 'violet', timestamp: Date.now() - 540000 },
        { period: 4, result: 'red', timestamp: Date.now() - 720000 },
        { period: 5, result: 'green', timestamp: Date.now() - 900000 },
      ];
      localStorage.setItem('tirangaGameHistory', JSON.stringify(sampleHistory));
      setGameHistory(sampleHistory);
    } else {
      setGameHistory(history.slice(-10)); // Show last 10 results
    }
  }, []);

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Game round ended
          processGameResult();
          return 180; // Reset to 3 minutes
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Disable betting in last 30 seconds
  useEffect(() => {
    setCanBet(timeLeft > 30);
  }, [timeLeft]);

  const processGameResult = () => {
    setIsProcessing(true);
    
    setTimeout(() => {
      // Generate random result (in real app, this would come from server)
      const colors = ['red', 'green', 'violet'];
      const weights = [45, 45, 10]; // Red: 45%, Green: 45%, Violet: 10%
      const randomNum = Math.random() * 100;
      let result;
      
      if (randomNum < weights[0]) {
        result = 'red';
      } else if (randomNum < weights[0] + weights[1]) {
        result = 'green';
      } else {
        result = 'violet';
      }

      // Check if user had a bet
      const userBets = JSON.parse(localStorage.getItem(`tirangaBets_${user.id}_${currentPeriod}`) || '[]');
      let winnings = 0;

      userBets.forEach(bet => {
        if (bet.color === result) {
          const multiplier = result === 'violet' ? 4.5 : 2;
          winnings += bet.amount * multiplier;
        }
      });

      if (winnings > 0) {
        const newBalance = balance + winnings;
        onBalanceUpdate(newBalance);
        toast({
          title: "🎉 Congratulations!",
          description: `You won ₹${winnings} on ${result.toUpperCase()}!`,
        });

        // Save winning transaction
        const transactions = JSON.parse(localStorage.getItem(`tirangaTransactions_${user.id}`) || '[]');
        transactions.push({
          id: Date.now(),
          type: 'win',
          amount: winnings,
          color: result,
          period: currentPeriod,
          timestamp: Date.now()
        });
        localStorage.setItem(`tirangaTransactions_${user.id}`, JSON.stringify(transactions));
      } else if (userBets.length > 0) {
        toast({
          title: "Better luck next time!",
          description: `Result was ${result.toUpperCase()}. Try again!`,
        });
      }

      // Update game history
      const newResult = {
        period: currentPeriod,
        result,
        timestamp: Date.now()
      };

      const updatedHistory = [...gameHistory, newResult].slice(-10);
      setGameHistory(updatedHistory);
      localStorage.setItem('tirangaGameHistory', JSON.stringify(updatedHistory));

      // Clear user bets for this period
      localStorage.removeItem(`tirangaBets_${user.id}_${currentPeriod}`);

      // Move to next period
      setCurrentPeriod(prev => prev + 1);
      setSelectedColor('');
      setBetAmount('');
      setIsProcessing(false);
    }, 2000);
  };

  const placeBet = () => {
    if (!selectedColor || !betAmount || !canBet) return;

    const amount = parseInt(betAmount);
    if (amount < 10) {
      toast({
        title: "Invalid Bet",
        description: "Minimum bet is ₹10",
        variant: "destructive",
      });
      return;
    }

    if (amount > balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this bet",
        variant: "destructive",
      });
      return;
    }

    // Deduct bet amount from balance
    const newBalance = balance - amount;
    onBalanceUpdate(newBalance);

    // Save bet
    const userBets = JSON.parse(localStorage.getItem(`tirangaBets_${user.id}_${currentPeriod}`) || '[]');
    userBets.push({
      color: selectedColor,
      amount: amount,
      timestamp: Date.now()
    });
    localStorage.setItem(`tirangaBets_${user.id}_${currentPeriod}`, JSON.stringify(userBets));

    // Save transaction
    const transactions = JSON.parse(localStorage.getItem(`tirangaTransactions_${user.id}`) || '[]');
    transactions.push({
      id: Date.now(),
      type: 'bet',
      amount: -amount,
      color: selectedColor,
      period: currentPeriod,
      timestamp: Date.now()
    });
    localStorage.setItem(`tirangaTransactions_${user.id}`, JSON.stringify(transactions));

    toast({
      title: "Bet Placed!",
      description: `₹${amount} bet placed on ${selectedColor.toUpperCase()}`,
    });

    setBetAmount('');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getColorClass = (color) => {
    switch (color) {
      case 'red': return 'bg-red-500 hover:bg-red-600';
      case 'green': return 'bg-green-500 hover:bg-green-600';
      case 'violet': return 'bg-violet-500 hover:bg-violet-600';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Game Status */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none">
        <CardContent className="p-6 text-center">
          <h2 className="text-2xl font-bold mb-2">Period #{currentPeriod}</h2>
          <div className="text-4xl font-mono font-bold mb-2">
            {isProcessing ? 'Processing...' : formatTime(timeLeft)}
          </div>
          <p className="text-blue-100">
            {isProcessing ? 'Calculating results...' : 
             canBet ? 'Place your bets now!' : 'Betting closed - waiting for result'}
          </p>
        </CardContent>
      </Card>

      {/* Betting Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Place Your Bet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Color Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Choose Color</h3>
            <div className="grid grid-cols-3 gap-4">
              {['red', 'green', 'violet'].map((color) => (
                <Button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`h-20 ${getColorClass(color)} ${
                    selectedColor === color ? 'ring-4 ring-white' : ''
                  } flex flex-col text-white font-bold`}
                  disabled={!canBet || isProcessing}
                >
                  <span className="text-2xl mb-1">
                    {color === 'red' ? '🔴' : color === 'green' ? '🟢' : '🟣'}
                  </span>
                  <span className="capitalize">{color}</span>
                  <span className="text-sm">
                    {color === 'violet' ? '4.5x' : '2x'}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* Bet Amount */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Bet Amount</h3>
            <div className="flex gap-2 mb-3">
              {[10, 50, 100, 500].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  onClick={() => setBetAmount(amount.toString())}
                  className="flex-1"
                  disabled={!canBet || isProcessing}
                >
                  ₹{amount}
                </Button>
              ))}
            </div>
            <Input
              type="number"
              placeholder="Enter custom amount"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="mb-4"
              disabled={!canBet || isProcessing}
            />
            <Button
              onClick={placeBet}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              disabled={!selectedColor || !betAmount || !canBet || isProcessing}
            >
              {isProcessing ? 'Processing...' : canBet ? 'Place Bet' : 'Betting Closed'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Game History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 justify-center flex-wrap">
            {gameHistory.slice(-10).reverse().map((game, index) => (
              <div
                key={game.period}
                className={`w-16 h-16 rounded-lg ${getColorClass(game.result)} flex flex-col items-center justify-center text-white font-bold shadow-lg`}
              >
                <span className="text-xs">#{game.period}</span>
                <span className="text-lg">
                  {game.result === 'red' ? 'R' : game.result === 'green' ? 'G' : 'V'}
                </span>
              </div>
            ))}
          </div>
          {gameHistory.length === 0 && (
            <p className="text-center text-gray-500">No results yet</p>
          )}
        </CardContent>
      </Card>

      {/* Rules */}
      <Card>
        <CardHeader>
          <CardTitle>How to Play</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• Choose RED, GREEN, or VIOLET color</p>
          <p>• Place your bet (minimum ₹10)</p>
          <p>• RED/GREEN wins = 2x your bet amount</p>
          <p>• VIOLET wins = 4.5x your bet amount</p>
          <p>• Betting closes 30 seconds before result</p>
          <p>• New round every 3 minutes</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ColorGame;
