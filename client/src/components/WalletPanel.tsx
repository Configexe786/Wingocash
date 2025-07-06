
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';

const WalletPanel = ({ user, balance, onBalanceUpdate }) => {
  const [addAmount, setAddAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [accountName, setAccountName] = useState('');

  const handleAddCash = () => {
    const amount = parseInt(addAmount);
    if (!amount || amount < 100) {
      toast({
        title: "Invalid Amount",
        description: "Minimum deposit is ₹100",
        variant: "destructive",
      });
      return;
    }

    // Simulate payment process
    toast({
      title: "Payment Initiated",
      description: "Please complete the payment using UPI",
    });

    // In real app, integrate with payment gateway
    setTimeout(() => {
      const newBalance = balance + amount;
      onBalanceUpdate(newBalance);
      
      // Save transaction
      const transactions = JSON.parse(localStorage.getItem(`tirangaTransactions_${user.id}`) || '[]');
      transactions.push({
        id: Date.now(),
        type: 'deposit',
        amount: amount,
        status: 'completed',
        timestamp: Date.now()
      });
      localStorage.setItem(`tirangaTransactions_${user.id}`, JSON.stringify(transactions));

      toast({
        title: "Deposit Successful",
        description: `₹${amount} added to your account`,
      });
      setAddAmount('');
    }, 2000);
  };

  const handleWithdraw = () => {
    const amount = parseInt(withdrawAmount);
    if (!amount || amount < 200) {
      toast({
        title: "Invalid Amount",
        description: "Minimum withdrawal is ₹200",
        variant: "destructive",
      });
      return;
    }

    if (amount > balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this withdrawal",
        variant: "destructive",
      });
      return;
    }

    if (!upiId || !accountName) {
      toast({
        title: "Missing Details",
        description: "Please provide UPI ID and account name",
        variant: "destructive",
      });
      return;
    }

    // Process withdrawal
    const newBalance = balance - amount;
    onBalanceUpdate(newBalance);

    // Save withdrawal request
    const transactions = JSON.parse(localStorage.getItem(`tirangaTransactions_${user.id}`) || '[]');
    transactions.push({
      id: Date.now(),
      type: 'withdrawal',
      amount: -amount,
      upiId: upiId,
      accountName: accountName,
      status: 'pending',
      timestamp: Date.now()
    });
    localStorage.setItem(`tirangaTransactions_${user.id}`, JSON.stringify(transactions));

    toast({
      title: "Withdrawal Request Sent",
      description: `₹${amount} withdrawal request submitted. It will be processed within 24 hours.`,
    });

    setWithdrawAmount('');
    setUpiId('');
    setAccountName('');
  };

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-green-600 to-blue-600 text-white border-none">
        <CardContent className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Current Balance</h2>
          <div className="text-4xl font-bold mb-2">₹{balance.toLocaleString()}</div>
          <p className="text-green-100">Available for trading and withdrawal</p>
        </CardContent>
      </Card>

      {/* Wallet Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="deposit" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="deposit">Add Cash</TabsTrigger>
              <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
            </TabsList>
            
            <TabsContent value="deposit" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Add Money to Wallet</h3>
                <div className="flex gap-2 mb-3">
                  {[100, 500, 1000, 2000].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      onClick={() => setAddAmount(amount.toString())}
                      className="flex-1"
                    >
                      ₹{amount}
                    </Button>
                  ))}
                </div>
                <Input
                  type="number"
                  placeholder="Enter amount (Min ₹100)"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  className="mb-4"
                />
                <Button
                  onClick={handleAddCash}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                  disabled={!addAmount}
                >
                  Add ₹{addAmount || '0'} to Wallet
                </Button>
              </div>

              {/* Payment Methods */}
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Payment Methods</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>💳</span>
                    <span>UPI, Net Banking, Cards Accepted</span>
                  </div>
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      🎁 <strong>Bonus:</strong> Get 5% extra on deposits above ₹1000!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="withdraw" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Withdraw Money</h3>
                <div className="space-y-3">
                  <Input
                    placeholder="Account Holder Name"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                  />
                  <Input
                    placeholder="UPI ID (e.g., 9876543210@paytm)"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Withdrawal amount (Min ₹200)"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                  />
                  <Button
                    onClick={handleWithdraw}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                    disabled={!withdrawAmount || !upiId || !accountName}
                  >
                    Withdraw ₹{withdrawAmount || '0'}
                  </Button>
                </div>
              </div>

              {/* Withdrawal Info */}
              <Card className="bg-yellow-50">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Withdrawal Information</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Minimum withdrawal: ₹200</li>
                    <li>• Processing time: 2-24 hours</li>
                    <li>• No withdrawal charges</li>
                    <li>• Available: Monday to Sunday</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">₹{balance.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Available Balance</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">24/7</div>
            <div className="text-sm text-gray-600">Support Available</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WalletPanel;
