
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TransactionHistory = ({ user }) => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const userTransactions = JSON.parse(localStorage.getItem(`tirangaTransactions_${user.id}`) || '[]');
    setTransactions(userTransactions.reverse()); // Most recent first
  }, [user.id]);

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit': return '💰';
      case 'withdrawal': return '💸';
      case 'bet': return '🎮';
      case 'win': return '🎉';
      default: return '📄';
    }
  };

  const getStatusBadge = (transaction) => {
    if (transaction.status === 'completed') {
      return <Badge className="bg-green-500">Completed</Badge>;
    } else if (transaction.status === 'pending') {
      return <Badge className="bg-yellow-500">Pending</Badge>;
    } else if (transaction.status === 'failed') {
      return <Badge className="bg-red-500">Failed</Badge>;
    }
    return null;
  };

  const filterTransactions = (type) => {
    if (type === 'all') return transactions;
    return transactions.filter(t => t.type === type);
  };

  const calculateStats = () => {
    const totalDeposits = transactions
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalWithdrawals = transactions
      .filter(t => t.type === 'withdrawal')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const totalBets = transactions
      .filter(t => t.type === 'bet')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const totalWins = transactions
      .filter(t => t.type === 'win')
      .reduce((sum, t) => sum + t.amount, 0);

    return { totalDeposits, totalWithdrawals, totalBets, totalWins };
  };

  const stats = calculateStats();

  const TransactionCard = ({ transaction }) => (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getTransactionIcon(transaction.type)}</span>
            <div>
              <h4 className="font-semibold capitalize">
                {transaction.type === 'bet' ? `Bet on ${transaction.color?.toUpperCase()}` : transaction.type}
              </h4>
              <p className="text-sm text-gray-600">
                {formatDate(transaction.timestamp)}
              </p>
              {transaction.period && (
                <p className="text-xs text-gray-500">Period #{transaction.period}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-lg font-bold ${
              transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {transaction.amount > 0 ? '+' : ''}₹{Math.abs(transaction.amount).toLocaleString()}
            </div>
            {getStatusBadge(transaction)}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xl font-bold text-green-600">₹{stats.totalDeposits.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Deposits</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xl font-bold text-red-600">₹{stats.totalWithdrawals.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Withdrawals</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xl font-bold text-blue-600">₹{stats.totalBets.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Bets</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xl font-bold text-purple-600">₹{stats.totalWins.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Winnings</div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="deposit">Deposits</TabsTrigger>
              <TabsTrigger value="withdrawal">Withdrawals</TabsTrigger>
              <TabsTrigger value="bet">Bets</TabsTrigger>
              <TabsTrigger value="win">Wins</TabsTrigger>
            </TabsList>
            
            {['all', 'deposit', 'withdrawal', 'bet', 'win'].map((type) => (
              <TabsContent key={type} value={type}>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filterTransactions(type).length > 0 ? (
                    filterTransactions(type).map((transaction) => (
                      <TransactionCard key={transaction.id} transaction={transaction} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <span className="text-4xl mb-4 block">📄</span>
                      <p>No {type === 'all' ? '' : type} transactions found</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Win/Loss Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Gaming Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                ₹{(stats.totalWins - stats.totalBets).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">
                {stats.totalWins > stats.totalBets ? 'Net Profit' : 'Net Loss'}
              </div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalBets > 0 ? Math.round((stats.totalWins / stats.totalBets) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">Win Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionHistory;
