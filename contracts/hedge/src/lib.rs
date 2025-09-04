#![no_std]
use soroban_sdk::{contract, contractimpl, Env, Address, Symbol, String};

mod reflector;
mod types;
mod storage;

use crate::reflector::{ReflectorClient, Asset as ReflectorAsset};
use crate::types::*;
use crate::storage::*;

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
        threshold_bp: i128, // basis points (e.g., 200 = 2%)
    ) -> Result<bool, HedgeError> {
        user.require_auth();
        
        if target_percentage > 50 {
            return Err(HedgeError::InvalidPercentage);
        }
        
        if threshold_bp < 50 || threshold_bp > 1000 {
            return Err(HedgeError::InvalidThreshold);
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
    
    /// Get protection metrics
    pub fn get_metrics(
        env: Env, 
        user: Address,
        days_back: u32,
    ) -> Result<ProtectionMetrics, HedgeError> {
        let config = get_user_config(&env, &user)?;
        
        // Get forex oracle
        let fx_oracle = Address::from_string(&String::from_str(&env, FOREX_ORACLE_ADDRESS));
        let reflector = ReflectorClient::new(&env, &fx_oracle);
        
        let asset = ReflectorAsset::Other(config.local_currency);
        let now = env.ledger().timestamp();
        let past = now - (days_back as u64 * 86400); // days to seconds
        
        let current_price = reflector.lastprice(&asset)
            .ok_or(HedgeError::NoPrice)?;
        
        let past_price = reflector.price(&asset, &past)
            .ok_or(HedgeError::NoPrice)?;
        
        // Calculate devaluation
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
    
    /// Check if conversion should be triggered
    fn check_conversion_trigger(env: &Env, config: &UserConfig) -> Result<bool, HedgeError> {
        // Don't convert more than once per week
        if env.ledger().timestamp() < config.last_conversion + 604800 {
            return Ok(false);
        }
        
        let fx_oracle = Address::from_string(&String::from_str(env, FOREX_ORACLE_ADDRESS));
        let reflector = ReflectorClient::new(env, &fx_oracle);
        let asset = ReflectorAsset::Other(config.local_currency.clone());
        
        let current = reflector.lastprice(&asset).ok_or(HedgeError::NoPrice)?;
        let week_ago = reflector.price(&asset, &(env.ledger().timestamp() - 604800))
            .ok_or(HedgeError::NoPrice)?;
        
        // Calculate weekly devaluation in basis points
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
        // Get current rate
        let fx_oracle = Address::from_string(&String::from_str(env, FOREX_ORACLE_ADDRESS));
        let reflector = ReflectorClient::new(env, &fx_oracle);
        let asset = ReflectorAsset::Other(config.local_currency.clone());
        
        let price_data = reflector.lastprice(&asset).ok_or(HedgeError::NoPrice)?;
        let decimals = reflector.decimals();
        
        // Calculate USD equivalent
        let usd_amount = (amount * 10i128.pow(decimals)) / price_data.price;
        
        // Record conversion event
        let event = ConversionEvent {
            timestamp: env.ledger().timestamp(),
            local_amount: amount,
            usd_amount,
            exchange_rate: price_data.price,
        };
        
        add_conversion_event(env, &config.user, &event);
        
        // Update config
        config.total_protected += usd_amount;
        config.last_conversion = env.ledger().timestamp();
        
        Ok(())
    }
}

// Contract constants
const FOREX_ORACLE_ADDRESS: &str = "CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC";