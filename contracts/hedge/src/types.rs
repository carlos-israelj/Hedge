use soroban_sdk::{contracttype, contracterror, Address, Symbol};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum HedgeError {
    UserNotFound = 1,
    InvalidPercentage = 2,
    InvalidThreshold = 3,
    NoPrice = 4,
    InsufficientBalance = 5,
    TooEarlyToConvert = 6,
    ConversionFailed = 7,
    InvalidCurrency = 8,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct UserConfig {
    pub user: Address,
    pub local_currency: Symbol,     // MXN, COP, BRL, etc.
    pub target_percentage: u32,     // 10-50, percentage to protect
    pub threshold_bp: i128,         // basis points for trigger (200 = 2%)
    pub last_conversion: u64,       // timestamp of last conversion
    pub total_protected: i128,      // total USD protected so far
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct ConversionEvent {
    pub timestamp: u64,
    pub local_amount: i128,         // amount in local currency
    pub usd_amount: i128,          // USD received
    pub exchange_rate: i128,        // rate used for conversion
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct ProtectionMetrics {
    pub total_protected: i128,      // total USD value protected
    pub currency_devaluation_bp: i128, // basis points of devaluation
    pub days_tracked: u32,          // number of days in calculation
    pub current_rate: i128,         // current exchange rate
}

// Por:
pub const SUPPORTED_CURRENCIES: &[&str] = &["ARS", "BRL", "PEN"];

// Oracle addresses for different networks
// Cambiar las direcciones a mainnet:
pub const MAINNET_FOREX_ORACLE: &str = "CALI2BYU2JE6WVRUFYTS6MSBNEHGJ35P4AVCZYF3B6QOE3QKOB2PLE6M";
pub const TESTNET_FOREX_ORACLE: &str = "CCSSOHTBL3LEWUCBBEB5NJFC2OKFRC74OWEIJIZLRJBGAAU4VMU5N4W";

// Time constants
pub const SECONDS_PER_WEEK: u64 = 604800;
pub const SECONDS_PER_DAY: u64 = 86400;