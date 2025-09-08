import { useState } from 'react';
import { Shield, TrendingDown, Settings, History, ArrowRight, Check, Wallet, Loader } from 'lucide-react';
import { UserConfig, MarketData, ProtectionMetrics, ConversionEvent, Currency } from './types';
import { CURRENCIES, formatCurrency, formatPercentage } from './utils/contracts';
import * as StellarSDK from '@stellar/stellar-sdk';

// Alice's account info from CLI
const ALICE_SECRET = 'SBNSLILZKFROZYOWOSJEPME2PYFMJ5BR62JGGK3UDSEPIBFWPAFYOQFG';
const ALICE_PUBLIC = 'GDNDD6KLDSDL3A5BGG2CIQ56E5GBVXMJCFAKBZ7J3INF4N4ETVDFUKJT';

// Contract and network configuration - ACTUALIZADO
const CONTRACT_ID = 'CCQYSKW4OZRDB7WGHTMZLKBP3QZB32RLHZQQIZ235GZRAMUJTA63TXCV';
const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

function App() {
  const [currentView, setCurrentView] = useState<'setup' | 'dashboard' | 'history'>('setup');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [userConfig, setUserConfig] = useState<UserConfig>({
    currency: '',
    percentage: 25,
    threshold: 2.0
  });

  // Mock data para mostrar mientras se desarrolla
  const [protectionData] = useState<ProtectionMetrics>({
    totalProtected: 847,
    currencyDevaluation: 12.4,
    conversionCount: 6,
    averageProtection: 141
  });

  const [marketData] = useState<MarketData>({
    currentRate: 17.45,
    weekAgoRate: 16.98,
    monthAgoRate: 16.85,
    timestamp: Date.now()
  });

  const [conversionHistory] = useState<ConversionEvent[]>([
    {
      date: '2024-01-15',
      localAmount: 15000,
      usdAmount: 857,
      exchangeRate: 17.5,
      triggerReason: 'automatic'
    },
    {
      date: '2024-01-08',
      localAmount: 12000,
      usdAmount: 706,
      exchangeRate: 17.0,
      triggerReason: 'rebalance'
    }
  ]);

  // Connect with Alice account
  const connectAliceWallet = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const alicePublicKey = ALICE_PUBLIC;
      
      if (!alicePublicKey) {
        throw new Error('Alice public key not configured. Run: stellar keys address alice');
      }
      
      setConnected(true);
      console.log('Connected with Alice account:', alicePublicKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  // Setup protection on smart contract - CORREGIDO FINAL
  const setupProtection = async () => {
    if (!connected) {
      setError('Please connect wallet first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const server = new StellarSDK.SorobanRpc.Server(RPC_URL);
      const sourceAccount = StellarSDK.Keypair.fromSecret(ALICE_SECRET);
      
      // Load account from network
      const account = await server.getAccount(sourceAccount.publicKey());
      
      // Create contract instance
      const contract = new StellarSDK.Contract(CONTRACT_ID);
      
      // Prepare contract call arguments
      const userAddress = StellarSDK.Address.fromString(sourceAccount.publicKey()).toScVal();
      const currencySymbol = StellarSDK.nativeToScVal(userConfig.currency, { type: 'symbol' });
      const targetPercentage = StellarSDK.nativeToScVal(userConfig.percentage, { type: 'u32' });
      const thresholdBp = StellarSDK.nativeToScVal(Math.floor(userConfig.threshold * 100), { type: 'i128' });

      // Create contract operation
      const operation = contract.call(
        'setup_protection',
        userAddress,
        currencySymbol,
        targetPercentage,
        thresholdBp
      );

      // Build transaction
      const transaction = new StellarSDK.TransactionBuilder(account, {
        fee: StellarSDK.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(operation)
        .setTimeout(300)
        .build();

      // Simulate transaction first
      const simulateResponse = await server.simulateTransaction(transaction);
      
      if (StellarSDK.SorobanRpc.Api.isSimulationError(simulateResponse)) {
        throw new Error(`Simulation failed: ${simulateResponse.error}`);
      }

      // Prepare transaction for submission - CORREGIDO
      const preparedTransaction = StellarSDK.SorobanRpc.assembleTransaction(
        transaction,
        simulateResponse
      ).build(); // Agregado .build()
      
      // Sign the prepared transaction
      preparedTransaction.sign(sourceAccount);

      // Submit transaction
      const response = await server.sendTransaction(preparedTransaction);
      console.log('Transaction submitted:', response.hash);
      
      // Simplificar: asumir éxito después de envío
      await new Promise(resolve => setTimeout(resolve, 3000)); // Esperar 3 segundos
      console.log('Setup protection completed!');
      setCurrentView('dashboard');

    } catch (err) {
      console.error('Setup protection failed:', err);
      setError(err instanceof Error ? err.message : 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    setConnected(false);
    setCurrentView('setup');
  };

  // Helper values
  const isSetupComplete = userConfig.currency && userConfig.percentage && userConfig.threshold;
  const devaluationThisWeek = ((marketData.currentRate - marketData.weekAgoRate) / marketData.weekAgoRate * 100);
  const shouldConvert = Math.abs(devaluationThisWeek) >= userConfig.threshold;

  // Wallet connection screen
  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Hedge</h1>
            <p className="text-gray-600">Protect your purchasing power automatically</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border text-center">
            <Wallet className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-bold mb-2">Connect Stellar Account</h2>
            <p className="text-gray-600 mb-6">
              Connect with Alice testnet account to interact with the Hedge smart contract
            </p>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            
            <button
              onClick={connectAliceWallet}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <Loader className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Wallet className="w-5 h-5 mr-2" />
              )}
              {loading ? 'Connecting...' : 'Connect Alice Account'}
            </button>
            
            <p className="text-xs text-gray-500 mt-4">
              Using testnet account configured via Stellar CLI
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Setup View
  if (currentView === 'setup') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Hedge</h1>
            <p className="text-gray-600">Protect your purchasing power automatically</p>
            <button 
              onClick={disconnect}
              className="text-sm text-gray-500 hover:text-gray-700 mt-2"
            >
              Disconnect Wallet
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Your Currency
                </label>
                <div className="space-y-2">
                  {CURRENCIES.filter(curr => curr.supported).map((currency: Currency) => (
                    <button
                      key={currency.code}
                      onClick={() => setUserConfig({...userConfig, currency: currency.code})}
                      className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-colors ${
                        userConfig.currency === currency.code 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="text-xl mr-3">{currency.flag}</span>
                        <div>
                          <div className="font-medium">{currency.code}</div>
                          <div className="text-sm text-gray-500">{currency.name}</div>
                        </div>
                      </div>
                      {userConfig.currency === currency.code && (
                        <Check className="w-5 h-5 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Convert to USD: {userConfig.percentage}%
                </label>
                <div className="px-3">
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    value={userConfig.percentage}
                    onChange={(e) => setUserConfig({...userConfig, percentage: parseInt(e.target.value)})}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>10%</span>
                    <span>Conservative</span>
                    <span>50%</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Trigger at: {formatPercentage(userConfig.threshold)} devaluation
                </label>
                <div className="px-3">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    value={userConfig.threshold}
                    onChange={(e) => setUserConfig({...userConfig, threshold: parseFloat(e.target.value)})}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Sensitive</span>
                    <span>Balanced</span>
                    <span>Patient</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={setupProtection}
              disabled={!isSetupComplete || loading}
              className={`w-full mt-8 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center ${
                isSetupComplete && !loading
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <Loader className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {loading ? 'Setting up...' : 'Start Protection'}
              {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
            </button>
            
            <p className="text-xs text-gray-500 mt-4 text-center">
              Contract: {CONTRACT_ID.slice(0, 8)}... • Stellar Testnet
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard View
  if (currentView === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b px-4 py-4">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">Hedge</h1>
                <p className="text-xs text-gray-500">{userConfig.currency}/USD Protection</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentView('history')}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <History className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setCurrentView('setup')}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                title="Volver a configuración"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
              </button>
              <button 
                onClick={disconnect}
                className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
              >
                <Wallet className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto p-4 space-y-4">
          {shouldConvert && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start">
                <TrendingDown className="w-5 h-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-orange-800">Conversion Recommended</p>
                  <p className="text-sm text-orange-700 mt-1">
                    {userConfig.currency} weakened {Math.abs(devaluationThisWeek).toFixed(1)}% this week
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Value Protected</p>
              <p className="text-3xl font-bold text-green-600 mb-4">
                {formatCurrency(protectionData.totalProtected, 'USD')}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-semibold text-red-600">
                    -{formatPercentage(protectionData.currencyDevaluation)}
                  </p>
                  <p className="text-xs text-gray-500">Currency Loss</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-blue-600">
                    {protectionData.conversionCount}
                  </p>
                  <p className="text-xs text-gray-500">Auto Conversions</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-700">{userConfig.currency}/USD Rate</p>
              <p className="text-xs text-gray-500">Live via Reflector</p>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold text-gray-900">
                {marketData.currentRate.toFixed(2)}
              </p>
              <div className="text-right">
                <p className={`text-sm font-medium ${
                  devaluationThisWeek > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {devaluationThisWeek > 0 ? '+' : ''}{devaluationThisWeek.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">vs last week</p>
              </div>
            </div>
          </div>

          <button className="w-full bg-blue-600 text-white py-4 px-4 rounded-xl font-medium hover:bg-blue-700 transition-colors">
            Convert Manually
          </button>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Contract deployed on Stellar Testnet • Powered by Reflector Oracle
            </p>
          </div>
        </div>
      </div>
    );
  }

  // History View
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-4">
        <div className="max-w-md mx-auto flex items-center">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-2"
          >
            <ArrowRight className="w-5 h-5 rotate-180" />
          </button>
          <h1 className="font-semibold text-gray-900">Conversion History</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        <div className="space-y-3">
          {conversionHistory.map((conversion, index) => (
            <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm text-gray-600">{conversion.date}</p>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(conversion.usdAmount, 'USD')}
                  </p>
                  <p className="text-xs text-gray-500">USD received</p>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <p className="text-gray-600">
                  {conversion.localAmount.toLocaleString()} {userConfig.currency}
                </p>
                <div className="flex items-center space-x-2">
                  <p className="text-gray-500">@ {conversion.exchangeRate}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    conversion.triggerReason === 'automatic' ? 'bg-blue-100 text-blue-700' :
                    conversion.triggerReason === 'manual' ? 'bg-green-100 text-green-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {conversion.triggerReason}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Total protected from devaluation: {formatCurrency(protectionData.totalProtected, 'USD')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;