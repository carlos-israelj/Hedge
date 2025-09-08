#![no_std]
use soroban_sdk::{contract, contractimpl, Env, Address, Symbol, String, Vec, vec};

mod reflector;
mod types;
mod storage;

use crate::reflector::{ReflectorClient, Asset as ReflectorAsset};
use crate::types::*;
use crate::storage::*;

const FOREX_ORACLE_ADDRESS: &str = "CAVLP5DH2GJPZMVO7IJY4CVOD5MWEFTJFVPD2YY2FQXOQHRGHK4D6HLP";

// Direcciones de contratos de tokens LATAM en testnet
const ARS_TOKEN_ADDRESS: &str = "CCRPYMVKZLWGZHEDZ23FOE22E3T3HOCNP5Y2EFZFVRUVIXU5NJ7UNGV2";
// Solo ARS está disponible en testnet actualmente

// Mapeo de monedas a sus direcciones de contrato (testnet)
fn get_token_address(env: &Env, currency: &Symbol) -> Option<Address> {
    let ars = Symbol::new(env, "ARS");
    
    if currency == &ars {
        Some(Address::from_string(&String::from_str(env, ARS_TOKEN_ADDRESS)))
    } else {
        None // Solo ARS disponible en testnet
    }
}

#[contract]
pub struct HedgeContract;

#[contractimpl]
impl HedgeContract {
    
    /// Initialize user's protection configuration
    pub fn setup_protection(
        env: Env,
        user: Address,
        local_currency: Symbol,
        target_percentage: u32,
        threshold_bp: i128,
    ) -> Result<bool, HedgeError> {
        user.require_auth();
        
        if target_percentage > 50 {
            return Err(HedgeError::InvalidPercentage);
        }
        
        if threshold_bp < 50 || threshold_bp > 1000 {
            return Err(HedgeError::InvalidThreshold);
        }

        // Verificar que la moneda sea soportada
        if get_token_address(&env, &local_currency).is_none() {
            return Err(HedgeError::InvalidCurrency);
        }
        
        let config = UserConfig {
            user: user.clone(),
            local_currency,
            target_percentage,
            threshold_bp,
            last_conversion: 0,
            total_protected: 0,
        };
        
        set_user_config(&env, &user, &config);
        Ok(true)
    }
    
    /// Process salary and potentially trigger conversion
    pub fn process_salary(
        env: Env,
        user: Address,
        amount: i128,
    ) -> Result<bool, HedgeError> {
        user.require_auth();
        
        let mut config = get_user_config(&env, &user)?;
        let should_convert = Self::check_conversion_trigger(&env, &config)?;
        
        if should_convert {
            let conversion_amount = (amount * config.target_percentage as i128) / 100;
            Self::execute_conversion(&env, &mut config, conversion_amount)?;
        }
        
        set_user_config(&env, &user, &config);
        Ok(true)
    }
    
    /// Manual conversion
    pub fn convert_now(
        env: Env,
        user: Address,
        amount: i128,
    ) -> Result<bool, HedgeError> {
        user.require_auth();
        
        let mut config = get_user_config(&env, &user)?;
        Self::execute_conversion(&env, &mut config, amount)?;
        set_user_config(&env, &user, &config);
        Ok(true)
    }
    
    /// Get user configuration
    pub fn get_config(env: Env, user: Address) -> Result<UserConfig, HedgeError> {
        get_user_config(&env, &user)
    }

    /// Get supported currencies
    pub fn get_supported_currencies(env: Env) -> Result<Vec<Symbol>, HedgeError> {
        let mut currencies = vec![&env];
        currencies.push_back(Symbol::new(&env, "ARS"));
        // Solo ARS disponible en testnet actualmente
        Ok(currencies)
    }
    
    /// Get protection metrics (production version with oracle)
    pub fn get_metrics(
        env: Env, 
        user: Address,
        days_back: u32,
    ) -> Result<ProtectionMetrics, HedgeError> {
        let config = get_user_config(&env, &user)?;
        
        let fx_oracle = Address::from_string(&String::from_str(&env, FOREX_ORACLE_ADDRESS));
        let reflector = ReflectorClient::new(&env, &fx_oracle);
        
        // Convertir moneda local a dirección de contrato
        let token_address = get_token_address(&env, &config.local_currency)
            .ok_or(HedgeError::InvalidCurrency)?;
        let asset = ReflectorAsset::Stellar(token_address);
        
        let now = env.ledger().timestamp();
        let past = now - (days_back as u64 * 86400);
        
        let current_price = reflector.lastprice(&asset)
            .ok_or(HedgeError::NoPrice)?;
        
        let past_price = reflector.price(&asset, &past)
            .ok_or(HedgeError::NoPrice)?;
        
        let devaluation = if past_price.price > current_price.price {
            ((past_price.price - current_price.price) * 10000) / past_price.price
        } else {
            0
        };
        
        Ok(ProtectionMetrics {
            total_protected: config.total_protected,
            currency_devaluation_bp: devaluation,
            days_tracked: days_back,
            current_rate: current_price.price,
        })
    }

    /// Get protection metrics (mock version for testing without oracle)
    pub fn get_metrics_mock(
        env: Env, 
        user: Address,
        days_back: u32,
    ) -> Result<ProtectionMetrics, HedgeError> {
        let config = get_user_config(&env, &user)?;
        
        // Simular datos realistas para ARS
        let simulated_devaluation = match days_back {
            1 => 25,    // 0.25% en 1 día
            7 => 180,   // 1.8% en 1 semana
            30 => 520,  // 5.2% en 1 mes
            _ => (days_back as i128) * 25, // ~0.25% por día
        };
        
        let simulated_rate = 1000000; // Simular 0.001 USD por ARS (con decimals del oracle)
        
        Ok(ProtectionMetrics {
            total_protected: config.total_protected,
            currency_devaluation_bp: simulated_devaluation,
            days_tracked: days_back,
            current_rate: simulated_rate,
        })
    }
    
    /// Check if conversion should be triggered
    fn check_conversion_trigger(env: &Env, config: &UserConfig) -> Result<bool, HedgeError> {
        if env.ledger().timestamp() < config.last_conversion + 604800 {
            return Ok(false);
        }
        
        let fx_oracle = Address::from_string(&String::from_str(env, FOREX_ORACLE_ADDRESS));
        let reflector = ReflectorClient::new(env, &fx_oracle);
        
        let token_address = get_token_address(env, &config.local_currency)
            .ok_or(HedgeError::InvalidCurrency)?;
        let asset = ReflectorAsset::Stellar(token_address);
        
        let current = reflector.lastprice(&asset).ok_or(HedgeError::NoPrice)?;
        let week_ago = reflector.price(&asset, &(env.ledger().timestamp() - 604800))
            .ok_or(HedgeError::NoPrice)?;
        
        let weekly_devaluation = if week_ago.price > current.price {
            ((week_ago.price - current.price) * 10000) / week_ago.price
        } else {
            0
        };
        
        Ok(weekly_devaluation >= config.threshold_bp)
    }
    
    /// Execute currency conversion
    fn execute_conversion(
        env: &Env,
        config: &mut UserConfig,
        amount: i128,
    ) -> Result<(), HedgeError> {
        let fx_oracle = Address::from_string(&String::from_str(env, FOREX_ORACLE_ADDRESS));
        let reflector = ReflectorClient::new(env, &fx_oracle);
        
        let token_address = get_token_address(env, &config.local_currency)
            .ok_or(HedgeError::InvalidCurrency)?;
        let asset = ReflectorAsset::Stellar(token_address);
        
        let price_data = reflector.lastprice(&asset).ok_or(HedgeError::NoPrice)?;
        let decimals = reflector.decimals();
        
        let usd_amount = (amount * 10i128.pow(decimals)) / price_data.price;
        
        let event = ConversionEvent {
            timestamp: env.ledger().timestamp(),
            local_amount: amount,
            usd_amount,
            exchange_rate: price_data.price,
        };
        
        add_conversion_event(env, &config.user, &event);
        
        config.total_protected += usd_amount;
        config.last_conversion = env.ledger().timestamp();
        
        Ok(())
    }
}