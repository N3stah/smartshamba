// Numeric state constants for the USSD state machine
// Using ranges to organize menus
export const USSD_STATE = {
  ROOT: 0,
  
  // Farmer Registration Flow (100-199)
  FARMER_REG_LANG: 101,
  FARMER_REG_NAME: 102,
  FARMER_REG_NATIONAL_ID: 103,
  FARMER_REG_COUNTY: 104,
  FARMER_REG_LOCATION_INPUT: 105, // For "Other County"
  FARMER_REG_WARD_SELECT: 106,
  FARMER_REG_VILLAGE_INPUT: 107,
  FARMER_REG_OTP_PROMPT: 108,
  
  // Farmer Main Menu (200-299)
  FARMER_MAIN: 200,
  
  // Farmer > Sell Produce (210-219)
  FARMER_SELL_PRODUCT: 211,
  FARMER_SELL_QTY: 212,
  FARMER_SELL_PRICE: 213,
  FARMER_SELL_CONFIRM: 214,
  
  // Farmer > My Groups (220-229)
  FARMER_GROUPS_MENU: 221,
  
  // Farmer > Market Prices (230-239)
  FARMER_PRICES_MENU: 231,
  
  // Farmer > My Transactions (240-249)
  FARMER_TX_LIST: 241,
  
  // Farmer > Quality Check (250-259)
  FARMER_QC_MOISTURE: 251,
  
  // Farmer > Website Login (260-269)
  FARMER_OTP_MENU: 261,
  
  // Buyer Section (300-399)
  BUYER_MAIN: 300,
  
  // About Section (400-499)
  ABOUT_MENU: 401,
} as const;

export type UssdState = typeof USSD_STATE[keyof typeof USSD_STATE];
