
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LiveColorGame from './LiveColorGame';
import WalletPanel from './WalletPanel';
import TransactionHistory from './TransactionHistory';
import { toast } from '@/hooks/use-toast';

const Dashboard = ({ user, onLogout }) => {
  const [currentSection, setCurrentSection] = useState('home');
  const [userBalance, setUserBalance] = useState(user.balance || "50.00");

  const updateBalance = (newBalance) => {
    setUserBalance(newBalance);
    // Update user data in localStorage (keeping for backward compatibility)
    const users = JSON.parse(localStorage.getItem('tirangaProUsers') || '[]');
    const updatedUsers = users.map(u => 
      u.id === user.id ? { ...u, balance: newBalance } : u
    );
    localStorage.setItem('tirangaProUsers', JSON.stringify(updatedUsers));
    
    const updatedUser = { ...user, balance: newBalance };
    localStorage.setItem('tirangaProUser', JSON.stringify(updatedUser));
  };

  const renderContent = () => {
    switch (currentSection) {
      case 'game':
        return <LiveColorGame user={user} onBalanceUpdate={updateBalance} />;
      case 'wallet':
        return <WalletPanel user={user} balance={userBalance} onBalanceUpdate={updateBalance} />;
      case 'history':
        return <TransactionHistory user={user} />;
      default:
        return (
          <div className="space-y-6">
            {/* Welcome Section */}
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Welcome, {user.name}!</h2>
                    <p className="text-blue-100">Ready to start trading colors?</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-100">Current Balance</p>
                    <p className="text-3xl font-bold">₹{userBalance.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                onClick={() => setCurrentSection('game')}
                className="h-24 bg-gradient-to-r from-red-500 to-green-500 hover:from-red-600 hover:to-green-600 flex flex-col"
              >
                <span className="text-2xl mb-1">🎮</span>
                <span>Play Game</span>
              </Button>
              <Button 
                onClick={() => setCurrentSection('wallet')}
                className="h-24 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 flex flex-col"
              >
                <span className="text-2xl mb-1">💰</span>
                <span>Wallet</span>
              </Button>
              <Button 
                onClick={() => setCurrentSection('history')}
                className="h-24 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 flex flex-col"
              >
                <span className="text-2xl mb-1">📊</span>
                <span>History</span>
              </Button>
              <Button 
                className="h-24 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 flex flex-col"
                onClick={() => toast({ title: "Coming Soon!", description: "Support feature will be available soon." })}
              >
                <span className="text-2xl mb-1">🎧</span>
                <span>Support</span>
              </Button>
            </div>

            {/* Game Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                  Live Game Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🎯</div>
                  <h3 className="text-xl font-semibold mb-2">Color Trading Game</h3>
                  <p className="text-gray-600 mb-4">Place your bets on Red, Green, or Violet</p>
                  <Button 
                    onClick={() => setCurrentSection('game')}
                    className="bg-gradient-to-r from-red-500 via-green-500 to-violet-500 hover:from-red-600 hover:via-green-600 hover:to-violet-600"
                  >
                    Start Playing Now
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Results Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 justify-center">
                  {['red', 'green', 'violet', 'red', 'green'].map((color, index) => (
                    <div
                      key={index}
                      className={`w-12 h-12 rounded-full ${
                        color === 'red' ? 'bg-red-500' :
                        color === 'green' ? 'bg-green-500' :
                        'bg-violet-500'
                      } flex items-center justify-center text-white font-bold`}
                    >
                      {color === 'red' ? 'R' : color === 'green' ? 'G' : 'V'}
                    </div>
                  ))}
                </div>
                <p className="text-center text-sm text-gray-600 mt-2">Last 5 results</p>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 via-white to-green-500 p-0.5">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                <span className="text-xs font-bold bg-gradient-to-r from-red-500 via-white to-green-500 bg-clip-text text-transparent">
                  TP
                </span>
              </div>
            </div>
            <h1 className="text-xl font-bold text-white">Tiranga Pro</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-300">Balance</p>
              <p className="text-lg font-bold text-white">₹{userBalance.toLocaleString()}</p>
            </div>
            <Button 
              variant="ghost" 
              onClick={onLogout}
              className="text-white hover:bg-white/10"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      {currentSection !== 'home' && (
        <div className="p-4">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentSection('home')}
            className="text-white hover:bg-white/10"
          >
            ← Back to Home
          </Button>
        </div>
      )}

      {/* Content */}
      <main className="p-4 pb-8">
        <div className="max-w-4xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
