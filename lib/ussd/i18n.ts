import { Language } from '@/lib/i18n/types';

type USSDParams = Record<string, string | number>;

const en: Record<string, string> = {
  'main_menu': 'Welcome to SmartShamba\nRift Valley & Western Kenya\n\n1. Farmer\n2. Buyer\n3. About / Help\n0. Exit',
  'farmer_menu': 'Farmer Menu\n\n1. Sell Produce\n2. My Group\n3. Market Price & Alerts\n4. Notification/Bank\n5. Quality Check\n6. Web Login\n0. Back',
  'buyer_menu': 'Buyer Menu\n\n1. Post Demand\n2. Live Market Produce\n3. Notification/Bank\n4. Buyer Verification\n5. Web Login\n0. Back',
  
  'buyer_post_demand_product_en': 'Select Product:\n1. Maize\n0. Back',
  'buyer_post_demand_bag_size_en': 'Select Bag Size:\n1. 50kg\n2. 90kg\n0. Back',
  'buyer_post_demand_qty_en': 'Enter number of bags required:',
  'buyer_post_demand_duration_en': 'Select Duration:\n1. 1 Week\n2. 2 Weeks\n3. 1 Month\n0. Back',
  'buyer_post_demand_price_en': 'Enter price per bag (KSh):',
  'buyer_post_demand_confirm_en': 'Confirm Demand:\nProduct: {product}\nBags: {qty}\nSize: {bagSize}kg\nDuration: {duration}\nPrice: KSh{price}/bag\n\n1. Confirm\n2. Cancel',
  'buyer_demand_success_en': 'Demand posted!\nFarmers will see your offer.',
  
  'buyer_market_menu_en': 'Live Market\n1. Individual Posts\n2. Group Posts\n0. Back',
  'buyer_market_list_en': 'Available Maize:\n{list}\n\n0. Back',
  'buyer_market_none_en': 'No active produce available.',
  
  'bank_menu_en': 'Notification/Bank\n1. My Account (Balance/Withdraw)\n2. Subscriptions\n0. Back',
  'bank_smartshamba_id_en': 'Enter your SmartShamba ID:',
  'bank_id_mismatch_en': 'This ID does not match your account.',
  'bank_pin_en': 'Enter your PIN:',
  'bank_pin_error_en': 'Error: {error}',
  'bank_balance_en': 'Balance: KSh {balance}\n\n1. Withdraw\n0. Back',
  'bank_withdraw_amount_en': 'Enter amount to withdraw (KSh):',
  'bank_withdraw_pin_en': 'Enter your PIN to confirm:',
  'bank_withdraw_success_en': 'Withdrawal request submitted!\nKSh {amount} will be sent to your M-PESA.',
  'bank_withdraw_insufficient_en': 'Insufficient balance.',
  'bank_subscriptions_en': 'My Subscriptions:\n{list}\n\nReply with number to cancel:',
  'bank_subscriptions_none_en': 'No active subscriptions.',
  'bank_sub_cancel_en': 'Cancel {type} subscription?\n1. Yes\n2. No',
  'bank_sub_cancelled_en': 'Subscription cancelled.',
  
  'buyer_verify_menu_en': 'Buyer Verification\n1. Monthly (KSh 200)\n2. Yearly (KSh 2000)\n0. Back',
  'buyer_verify_confirm_en': 'Pay KSh {price} for {plan} verification?\n\n1. Pay via M-PESA\n2. Cancel',
  'alerts_paid_initiated_en': 'Payment request sent.\nCheck your phone for M-PESA prompt.',
  'alerts_paid_failed_en': 'Payment initiation failed. Try again later.',
  
  'otp_menu_en': 'We will send an OTP to your phone.\n1. Send OTP\n0. Back',
  'otp_sent_en': 'OTP sent! Use it to login on smartshamba.vercel.app',
  
  'error_generic_en': 'Invalid input. Please dial *384*53374# to try again.',
  'error_service_en': 'END Service error. Please try again later.',
};

const sw: Record<string, string> = {
  'main_menu': 'Karibu SmartShamba\nBonde la Ufa & Magharibi mwa Kenya\n\n1. Mkulima\n2. Mnunuzi\n3. Kuhusu / Msaada\n0. Toka',
  'farmer_menu': 'Menyu ya Mkulima\n\n1. Uza Mazao\n2. Kundi Langu\n3. Bei ya Soko & Arifa\n4. Arifa/Benki\n5. Ukaguzi wa Ubora\n6. Ingia Tovuti\n0. Rudi',
  'buyer_menu': 'Menyu ya Mnunuzi\n\n1. Weka Hitaji\n2. Soko la Haraka\n3. Arifa/Benki\n4. Uthibitisho wa Mnunuzi\n5. Ingia Tovuti\n0. Rudi',
  
  'buyer_post_demand_product_sw': 'Chagua Bidhaa:\n1. Mahindi\n0. Rudi',
  'buyer_post_demand_bag_size_sw': 'Chagua Ukubwa wa Gunia:\n1. 50kg\n2. 90kg\n0. Rudi',
  'buyer_post_demand_qty_sw': 'Ingiza idadi ya gunia inayohitajika:',
  'buyer_post_demand_duration_sw': 'Chagua Muda:\n1. Wiki 1\n2. Wiki 2\n3. Mwezi 1\n0. Rudi',
  'buyer_post_demand_price_sw': 'Ingiza bei kwa kila gunia (KSh):',
  'buyer_post_demand_confirm_sw': 'Thibitisha Hitaji:\nBidhaa: {product}\nMakuba: {qty}\nUkubwa: {bagSize}kg\nMuda: {duration}\nBei: KSh{price}/gunia\n\n1. Thibitisha\n2. Ghairi',
  'buyer_demand_success_sw': 'Hitaji limewekwa!\nWakulima wataona ofa yako.',
  
  'buyer_market_menu_sw': 'Soko la Haraka\n1. Machapisho ya Binafsi\n2. Machapisho ya Kundi\n0. Rudi',
  'buyer_market_list_sw': 'Mahindi Yaliyopo:\n{list}\n\n0. Rudi',
  'buyer_market_none_sw': 'Hakuna mazao yaliyopo sasa.',
  
  'bank_menu_sw': 'Arifa/Benki\n1. Akaunti Yangu\n2. Michango\n0. Rudi',
  'bank_smartshamba_id_sw': 'Ingiza Kitambulisho chako:',
  'bank_id_mismatch_sw': 'Kitambulisho hakitakiili na akaunti yako.',
  'bank_pin_sw': 'Ingiza PIN yako:',
  'bank_pin_error_sw': 'Hitilafu: {error}',
  'bank_balance_sw': 'Salio: KSh {balance}\n\n1. Toa\n0. Rudi',
  'bank_withdraw_amount_sw': 'Ingiza kiasi cha kutoa (KSh):',
  'bank_withdraw_pin_sw': 'Ingiza PIN kuthibitisha:',
  'bank_withdraw_success_sw': 'Ombi la kutoa limewasilishwa!\nKSh {amount} itatumwa kwa M-PESA.',
  'bank_withdraw_insufficient_sw': 'Salio haitoshi.',
  'bank_subscriptions_sw': 'Michango Yangu:\n{list}\n\nJibu kwa namba kughairi:',
  'bank_subscriptions_none_sw': 'Hakuna michango inayoendelea.',
  'bank_sub_cancel_sw': 'Ghairi {type}?\n1. Ndiyo\n2. Hapana',
  'bank_sub_cancelled_sw': 'Michango imeghairiwa.',
  
  'buyer_verify_menu_sw': 'Uthibitisho wa Mnunuzi\n1. Ya Mwezi (KSh 200)\n2. Ya Mwaka (KSh 2000)\n0. Rudi',
  'buyer_verify_confirm_sw': 'Lipa KSh {price} kwa {plan}?\n\n1. Lipa kwa M-PESA\n2. Ghairi',
  'alerts_paid_initiated_sw': 'Ombi la malipo limetumwa.\nAngalia simu yako kwa M-PESA.',
  'alerts_paid_failed_sw': 'Imeshindwa kuanzisha malipo. Jaribu tena.',
  
  'otp_menu_sw': 'Tutatuma OTP kwenye simu yako.\n1. Tuma OTP\n0. Rudi',
  'otp_sent_sw': 'OTP imetumwa! Tumia ili kuingia kwenye smartshamba.vercel.app',
  
  'error_generic_sw': 'Ingizo batili. Tafadhali piga *384*53374# kujaribu tena.',
  'error_service_sw': 'END Hitilafu ya huduma. Tafadhali jaribu tena baadaye.',
};

export function getUssdText(lang: Language | string | undefined, key: string, params?: USSDParams): string {
  const language = lang === 'sw' ? 'sw' : 'en';
  const dict = language === 'sw' ? sw : en;
  let str = dict[key] || en[key] || key;
  if (params) {
    Object.keys(params).forEach(p => {
      str = str.replace(new RegExp(`{${p}}`, 'g'), String(params[p]));
    });
  }
  return str;
}
