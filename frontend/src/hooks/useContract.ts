import { useState } from 'react';
import * as StellarSDK from '@stellar/stellar-sdk';

// Configuración para diferentes redes
const TESTNET_CONTRACT_ID = 'CCQYSKW4OZRDB7WGHTMZLKBP3QZB32RLHZQQIZ235GZRAMUJTA63TXCV';
const MAINNET_CONTRACT_ID = 'TU_CONTRACT_ID_MAINNET'; // Cuando despliegues en mainnet
const TESTNET_RPC_URL = 'https://soroban-testnet.stellar.org';
const MAINNET_RPC_URL = 'https://soroban-rpc.mainnet.stellar.org';

// Detectar red actual
const isTestnet = process.env.NODE_ENV === 'development' || 
                  window.location.hostname.includes('localhost') ||
                  window.location.hostname.includes('testnet');

const CONTRACT_ID = isTestnet ? TESTNET_CONTRACT_ID : MAINNET_CONTRACT_ID;
const RPC_URL = isTestnet ? TESTNET_RPC_URL : MAINNET_RPC_URL;

export const useContract = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setupProtection = async (
    userAddress: string,
    currency: string,
    percentage: number,
    threshold: number
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const server = new StellarSDK.SorobanRpc.Server(RPC_URL);
      
      // Convertir threshold de porcentaje a basis points
      const thresholdBp = Math.floor(threshold * 100);
      
      const contract = new StellarSDK.Contract(CONTRACT_ID);
      const operation = contract.call(
        'setup_protection',
        StellarSDK.Address.fromString(userAddress),
        StellarSDK.nativeToScVal(currency, { type: 'symbol' }),
        StellarSDK.nativeToScVal(percentage, { type: 'u32' }),
        StellarSDK.nativeToScVal(thresholdBp, { type: 'i128' })
      );

      // Aquí necesitarías la lógica completa de transacción
      // Para el hackathon, retornar mock success
      console.log('Setup protection called', { userAddress, currency, percentage, threshold });
      return { success: true };
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const getConfig = async (userAddress: string) => {
    setLoading(true);
    setError(null);

    try {
      const server = new StellarSDK.SorobanRpc.Server(RPC_URL);
      const contract = new StellarSDK.Contract(CONTRACT_ID);
      
      const operation = contract.call(
        'get_config',
        StellarSDK.Address.fromString(userAddress)
      );

      // Mock response para desarrollo
      console.log('Get config called', userAddress);
      return {
        user: userAddress,
        local_currency: 'ARS',
        target_percentage: 25,
        threshold_bp: 200,
        last_conversion: 0,
        total_protected: 0
      };

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getMetrics = async (userAddress: string, daysBack: number = 7) => {
    setLoading(true);
    setError(null);

    try {
      const server = new StellarSDK.SorobanRpc.Server(RPC_URL);
      const contract = new StellarSDK.Contract(CONTRACT_ID);
      
      // Usar get_metrics_mock en testnet, get_metrics en mainnet
      const methodName = isTestnet ? 'get_metrics_mock' : 'get_metrics';
      
      const operation = contract.call(
        methodName,
        StellarSDK.Address.fromString(userAddress),
        StellarSDK.nativeToScVal(daysBack, { type: 'u32' })
      );

      // Mock response para desarrollo
      console.log(`${methodName} called`, { userAddress, daysBack });
      
      // Simular respuesta realista
      const mockMetrics = {
        total_protected: 0,
        currency_devaluation_bp: isTestnet ? 180 : 150, // 1.8% en testnet, 1.5% en mainnet
        days_tracked: daysBack,
        current_rate: isTestnet ? 1000000 : 720000 // Diferentes rates simulados
      };

      return mockMetrics;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getSupportedCurrencies = async () => {
    setLoading(true);
    setError(null);

    try {
      const server = new StellarSDK.SorobanRpc.Server(RPC_URL);
      const contract = new StellarSDK.Contract(CONTRACT_ID);
      
      const operation = contract.call('get_supported_currencies');

      // Mock response
      console.log('Get supported currencies called');
      return ['ARS']; // Solo ARS disponible en testnet

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    setupProtection,
    getConfig,
    getMetrics,
    getSupportedCurrencies,
    loading,
    error,
    isTestnet, // Exportar para uso en UI
    contractId: CONTRACT_ID
  };
};