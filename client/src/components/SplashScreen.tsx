
import React from 'react';

const SplashScreen = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="mb-8 animate-pulse">
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-r from-red-500 via-white to-green-500 p-1">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-red-500 via-white to-green-500 bg-clip-text text-transparent">
                TP
              </div>
            </div>
          </div>
        </div>
        <h1 className="text-5xl font-bold text-white mb-4 animate-scale-in">
          Tiranga Pro
        </h1>
        <p className="text-xl text-gray-300 mb-8 animate-fade-in">
          Professional Color Trading
        </p>
        <div className="flex justify-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
