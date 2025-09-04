// User configuration types
export interface UserConfig {
  currency: string;
  percentage: number;
  threshold: number;
  lastConversion?: string;
  totalProtected?: number;
}

// Market data from Reflector
export interface MarketData {
  currentRate: number;
  weekAgoRate: number;
  monthAgoRate: number;
  timestamp: number;
}

// Protection metrics
export interface ProtectionMetrics {
  totalProtected: number;
  currencyDevaluation: number;
  conversionCount: number;
  averageProtection: number;
}

// Conversion history
export interface ConversionEvent {
  date: string;
  localAmount: number;
  usdAmount: number;
  exchangeRate: number;
  triggerReason: 'automatic' | 'manual' | 'rebalance';
}

// Supported currencies
export interface Currency {
  code: string;
  name: string;
  flag: string;
  supported: boolean;
}

// Stellar wallet connection
export interface WalletState {
  connected: boolean;
  publicKey?: string;
  network: 'testnet' | 'mainnet';
}

// Contract interaction states
export type ContractState = 'idle' | 'loading' | 'success' | 'error';

// API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Reflector oracle response
export interface ReflectorPrice {
  price: number;
  timestamp: number;
  decimals: number;
}

// Contract addresses by network
export interface ContractAddresses {
  hedge: string;
  reflectorForex: string;
  reflectorCrypto: string;
  nativeToken: string;
}