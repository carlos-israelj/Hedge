import { useState } from 'react';
import * as StellarSDK from '@stellar/stellar-sdk';

const CONTRACT_ID = 'CBZZXCULCVYKINB323TBNWKKGKFFQMBU2R2BSEFS3BTKEIL7L6APB54N'; // Reemplaza con el ID real
const RPC_URL = 'https://soroban-testnet.stellar.org';

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
    // Implementación similar para obtener configuración
    console.log('Get config called', userAddress);
    return null;
  };

  return {
    setupProtection,
    getConfig,
    loading,
    error
  };
};