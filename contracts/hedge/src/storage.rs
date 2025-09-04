use soroban_sdk::{Env, Address, Symbol, Vec, vec};
use crate::types::{UserConfig, ConversionEvent, HedgeError};

// Storage keys
const USER_CONFIG_KEY: &str = "CONFIG";
const CONVERSION_EVENTS_KEY: &str = "EVENTS";

/// Store user configuration
pub fn set_user_config(env: &Env, user: &Address, config: &UserConfig) {
    let key = (user.clone(), Symbol::new(env, USER_CONFIG_KEY));
    env.storage().persistent().set(&key, config);
}

/// Retrieve user configuration
pub fn get_user_config(env: &Env, user: &Address) -> Result<UserConfig, HedgeError> {
    let key = (user.clone(), Symbol::new(env, USER_CONFIG_KEY));
    env.storage()
        .persistent()
        .get(&key)
        .ok_or(HedgeError::UserNotFound)
}

/// Add conversion event to user's history
pub fn add_conversion_event(env: &Env, user: &Address, event: &ConversionEvent) {
    let key = (user.clone(), Symbol::new(env, CONVERSION_EVENTS_KEY));
    
    let mut events: Vec<ConversionEvent> = env.storage()
        .persistent()
        .get(&key)
        .unwrap_or(vec![env]);
    
    events.push_back(event.clone());
    
    // Keep only last 50 events to manage storage costs
    if events.len() > 50 {
        events.remove(0);
    }
    
    env.storage().persistent().set(&key, &events);
}

/// Get user's conversion history
pub fn get_conversion_events(env: &Env, user: &Address) -> Vec<ConversionEvent> {
    let key = (user.clone(), Symbol::new(env, CONVERSION_EVENTS_KEY));
    env.storage()
        .persistent()
        .get(&key)
        .unwrap_or(vec![env])
}

/// Check if user exists
pub fn user_exists(env: &Env, user: &Address) -> bool {
    let key = (user.clone(), Symbol::new(env, USER_CONFIG_KEY));
    env.storage().persistent().has(&key)
}

/// Remove user data (for cleanup/migration)
pub fn remove_user_data(env: &Env, user: &Address) {
    let config_key = (user.clone(), Symbol::new(env, USER_CONFIG_KEY));
    let events_key = (user.clone(), Symbol::new(env, CONVERSION_EVENTS_KEY));
    
    env.storage().persistent().remove(&config_key);
    env.storage().persistent().remove(&events_key);
}