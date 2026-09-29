import { Language } from '@/lib/i18n/types';

type USSDParams = Record<string, string | number>;

const en: Record<string, string> = {
  'main_menu': 'Welcome to SmartShamba\nRift Valley & Western Kenya\n\n1. Farmer\n2. Buyer\n3. Transport\n4. About / Help\n0. Exit',
  'farmer_menu': 'Farmer Menu\n\n1. Sell Produce\n2. My Group\n3. Market Price & Alerts\n4. Notification/Bank\n5. Quality Check\n6. Web Login\n0. Back',
  'buyer_menu': 'Buyer Menu\n\n1. Post Demand\n2. Live Market Produce\n3. Notification/Bank\n4. Buyer Verification\n5. Web Login\n0. Back',
  
  'transport_menu': 'Transport Menu\n\n1. Register\n2. My Account\n3. Available Loads\n4. Priority Alerts\n5. Web Login\n0. Back',
  
  'transport_reg_name_en': 'Enter your full name or business name:',
  'transport_reg_national_id_en': 'Enter your National ID or Business Reg:',
  'transport_reg_location_en': 'Enter your base location (County, Town):',
  'transport_reg_plate_en': 'Enter vehicle registration number (e.g. KDA 123A):',
  'transport_reg_license_en': 'Enter your driving license number:',
  'transport_reg_capacity_en': 'Enter vehicle capacity in bags (e.g. 50):',
  'transport_reg_pin_en': 'Set a 4-digit PIN for your account:',
  'transport_reg_success_en': 'Registration successful!\nYour SmartShamba ID is {id}\nPending admin approval.',
  
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
  
  'transport_loads_county_en': 'Select County:\n1. Trans Nzoia\n2. Uasin Gishu\n3. Nakuru\n4. All Counties\n0. Back',
  'transport_loads_list_en': 'Available Loads:\n{list}\n\nReply with number to accept:',
  'transport_loads_none_en': 'No loads available in this area.',
  'transport_loads_confirm_en': 'Accept Load?\nFrom: {pickup}\nTo: {dropoff}\nBags: {bags}\n\n1. Accept\n2. Cancel',
  'transport_loads_success_en': 'Load accepted!\nPickup: {pickup}\nDropoff: {dropoff}',
  
  'transport_sub_menu_en': 'Priority Load Alerts\n1. Monthly (KSh 100)\n0. Back',
  'transport_sub_confirm_en': 'Pay KSh {price} for {plan}?\n\n1. Pay via M-PESA\n2. Cancel',
  'alerts_paid_initiated_en': 'Payment request sent.\nCheck your phone for M-PESA prompt.',
  'alerts_paid_failed_en': 'Payment initiation failed. Try again later.',
  
  'otp_menu_en': 'We will send an OTP to your phone.\n1. Send OTP\n0. Back',
  'otp_sent_en': 'OTP sent! Use it to login on smartshamba.vercel.app',
  
  'error_generic_en': 'Invalid input. Please dial *384*53374# to try again.',
  'error_service_en': 'END Service error. Please try again later.',
};

const sw: Record<string, string> = {
  'main_menu': 'Karibu SmartShamba\nBonde la Ufa & Magharibi mwa Kenya\n\n1. Mkulima\n2. Mnunuzi\n3. Usafirishaji\n4. Kuhusu / Msaada\n0. Toka',
  'farmer_menu': 'Menyu ya Mkulima\n\n1. Uza Mazao\n2. Kundi Langu\n3. Bei ya Soko & Arifa\n4. Arifa/Benki\n5. Ukaguzi wa Ubora\n6. Ingia Tovuti\n0. Rudi',
  'buyer_menu': 'Menyu ya Mnunuzi\n\n1. Weka Hitaji\n2. Soko la Haraka\n3. Arifa/Benki\n4. Uthibitisho wa Mnunuzi\n5. Ingia Tovuti\n0. Rudi',
  
  'transport_menu': 'Menyu ya Usafirishaji\n\n1. Jisajili\n2. Akaunti Yangu\n3. Mizigo Inayopatikana\n4. Arifa za Kipaumbele\n5. Ingia Tovuti\n0. Rudi',
  
  'transport_reg_name_sw': 'Ingiza jina lako au jina la biashara:',
  'transport_reg_national_id_sw': 'Ingiza Kitambulisho chako au Usajili wa Biashara:',
  'transport_reg_location_sw': 'Ingiza eneo lako la msingi (Kaunti, Mji):',
  'transport_reg_plate_sw': 'Ingiza namba ya usajili ya gari (mfano KDA 123A):',
  'transport_reg_license_sw': 'Ingiza namba ya leseni ya udereva:',
  'transport_reg_capacity_sw': 'Ingiza uwezo wa gari kwa gunia (mfano 50):',
  'transport_reg_pin_sw': 'Weka PIN ya tarakimu 4 kwa akaunti yako:',
  'transport_reg_success_sw': 'Usajili umefanikiwa!\nKitambulisho chako cha SmartShamba ni {id}\nInasubiri kuidhinishwa.',
  
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
  
  'transport_loads_county_sw': 'Chagua Kaunti:\n1. Trans Nzoia\n2. Uasin Gishu\n3. Nakuru\n4. Kaunti Zote\n0. Rudi',
  'transport_loads_list_sw': 'Mizigo Inayopatikana:\n{list}\n\nJibu kwa namba kukubali:',
  'transport_loads_none_sw': 'Hakuna mizigo inayopatikana kwenye eneo hili.',
  'transport_loads_confirm_sw': 'Kubali Mizigo?\nKutoka: {pickup}\nKwenda: {dropoff}\nMakuba: {bags}\n\n1. Kubali\n2. Ghairi',
  'transport_loads_success_sw': 'Mzigo umekubaliwa!\nKuchukua: {pickup}\nKupeleka: {dropoff}',
  
  'transport_sub_menu_sw': 'Arifa za Kipaumbele za Mizigo\n1. Ya Mwezi (KSh 100)\n0. Rudi',
  'transport_sub_confirm_sw': 'Lipa KSh {price} kwa {plan}?\n\n1. Lipa kwa M-PESA\n2. Ghairi',
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
