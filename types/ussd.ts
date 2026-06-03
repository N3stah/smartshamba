/**
 * The standard payload sent by Africa's Talking to your /api/ussd endpoint
 */
export interface USSDRequest {
  sessionId: string;   // Unique ID for the session, used for state tracking
  phoneNumber: string; // The farmer's mobile number (e.g., +2547XXXXXXXX)
  networkCode: string; // The mobile service provider code
  serviceCode: string; // The USSD code dialed (e.g., *384#)
  text: string;        // The raw input string from the user (e.g., "1*50*1")
}

/**
 * Enumeration of the different states in the SmartShamba USSD journey
 */
export enum USSDState {
  START = 'START',
  REGISTER_NAME = 'REGISTER_NAME',
  REGISTER_LOCATION = 'REGISTER_LOCATION',
  MAIN_MENU = 'MAIN_MENU',
  VIEW_BUYERS = 'VIEW_BUYERS',
  ENTER_AMOUNT = 'ENTER_AMOUNT',
  CONFIRM_OFFER = 'CONFIRM_OFFER',
  COMPLETE = 'COMPLETE'
}

/**
 * Internal session data used to persist progress between USSD hops
 */
export interface USSDSessionData {
  farmerId?: string;
  selectedBuyerId?: string;
  amountBags?: number;
  step: USSDState;
}

/**
 * Formatted response for Africa's Talking
 * Prefix with "CON " to keep the session open
 * Prefix with "END " to terminate the session
 */
export type USSDResponse = string;