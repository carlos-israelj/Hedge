import { ContractAddresses } from '../types';

// Contract addresses for different networks
export const CONTRACTS: Record<'testnet' | 'mainnet', ContractAddresses> = {
  testnet: {
    hedge: 'CARCB6GR4ZMONFVEAD567ETTOWR3LSFDIA3MHZRIELDMRE6UHRAOVVTJ',
    reflectorForex: 'CCSSOHTBL3LEWUCBBEB5NJFC2OKFRC74OWEIJIZLRJBGAAU4VMU5NV4W',
    reflectorCrypto: 'CAFJZQWSED6YAWZU3GWRTOCNPPCGBN32L7QV43XX5LZLFTK6JLN34DLN',
    nativeToken: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'
  },
  mainnet: {
    hedge: 'CARCB6GR4ZMONFVEAD567ETTOWR3LSFDIA3MHZRIELDMRE6UHRAOVVTJ',
    reflectorForex: 'CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC',
    reflectorCrypto: 'CAFJZQWSED6YAWZU3GWRTOCNPPCGBN32L7QV43XX5LZLFTK6JLN34DLN',
    nativeToken: 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA'
  }
};

// Supported currencies
export const CURRENCIES = [
  { code: 'MXN', name: 'Mexican Peso', flag: '🇲🇽', supported: true },
  { code: 'COP', name: 'Colombian Peso', flag: '🇨🇴', supported: true },
  { code: 'BRL', name: 'Brazilian Real', flag: '🇧🇷', supported: true },
  { code: 'ARS', name: 'Argentine Peso', flag: '🇦🇷', supported: true },
  { code: 'CLP', name: 'Chilean Peso', flag: '🇨🇱', supported: true },
  { code: 'PEN', name: 'Peruvian Sol', flag: '🇵🇪', supported: true }
];

// Default configuration values
export const DEFAULTS = {
  MIN_PERCENTAGE: 10,
  MAX_PERCENTAGE: 50,
  DEFAULT_PERCENTAGE: 25,
  MIN_THRESHOLD: 1.0,
  MAX_THRESHOLD: 5.0,
  DEFAULT_THRESHOLD: 2.0,
  CONVERSION_COOLDOWN_DAYS: 7
};

// Helper functions
export const getCurrentNetwork = (): 'testnet' | 'mainnet' => {
  return 'testnet'; // Por ahora usar siempre testnet para desarrollo
};

export const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : undefined,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};
