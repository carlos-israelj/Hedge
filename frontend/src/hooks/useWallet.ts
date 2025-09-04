import { useState, useEffect } from 'react';

export const useWallet = () => {
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);

  const connectWallet = async () => {
    try {
      // Para el hackathon, usar la cuenta alice directamente
      const alicePublicKey = 'GBYL...'; // La dirección pública de alice
      setPublicKey(alicePublicKey);
      setConnected(true);
      return { success: true };
    } catch (error) {
      console.error('Wallet connection failed:', error);
      return { success: false, error };
    }
  };

  const disconnect = () => {
    setConnected(false);
    setPublicKey(null);
  };

  return {
    connected,
    publicKey,
    connectWallet,
    disconnect
  };
};