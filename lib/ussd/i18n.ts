import { Language } from '@/lib/i18n/types';

type USSDParams = Record<string, string | number>;

const en: Record<string, string> = {
  // Main Menu
  'main_menu': 'Welcome to SmartShamba\nRift Valley & Western Kenya\n\n1. Farmer\n2. Buyer\n3. About / Help\n0. Exit',
  'exit': 'Thank you for using SmartShamba. Goodbye!',
  'unauthorized': 'END Unauthorized request.',

  // Farmer Menu
  'farmer_menu': 'Farmer Menu\n\n1. Sell Produce\n2. My Group\n3. Market Price & Alerts\n4. Notification/Bank\n5. Quality Check\n6. Web Login\n0. Back',
  
  // Registration
  'reg_step1': 'Welcome to SmartShamba\nSelect Language:\n1. English\n2. Kiswahili',
  'reg_step2_en': 'Enter your full name:',
  'reg_step2_sw': 'Ingiza jina lako kamili:',
  'reg_step3_en': 'Enter your National ID\n(8 digits):',
  'reg_step3_sw': 'Ingiza Kitambulisho chako\n(tarakimu 8):',
  'reg_invalid_id_en': 'Invalid ID. Must be 8 digits.\nPlease dial *384*53374# to try again.',
  'reg_invalid_id_sw': 'Kitambulisho batili. Lazima kiwe tarakimu 8.\nTafadhali piga *384*53374# kujaribu tena.',
  'reg_county_en': 'Select your county:\n{counties}\n8. Other county',
  'reg_county_sw': 'Chagua kaunti yako:\n{counties}\n8. Kaunti nyingine',
  'reg_ward_en': 'Select your ward:\n{wards}\n9. Other ward',
  'reg_ward_sw': 'Chagua ward yako:\n{wards}\n9. Ward nyingine',
  'reg_village_en': 'Enter your village or\nnearest town name:',
  'reg_village_sw': 'Ingiza kijiji chako au\njina la mji karibu:',
  'reg_location_en': 'Enter your location\n(county, town or village):',
  'reg_location_sw': 'Ingiza eneo lako\n(kaunti, mji au kijiji):',
  'reg_success_en': 'Registration successful!\nWe will send an OTP to login on the website.\n\n1. Send OTP\n2. Skip',
  'reg_success_sw': 'Usajili umefanikiwa!\nTatuma OTP kuingia kwenye tovuti.\n\n1. Tuma OTP\n2. Ruka',
  'reg_other_county_success_en': 'Welcome {name}!\nYou are now registered.\nDial *384*53374# to start selling.',
  'reg_other_county_success_sw': 'Karibu {name}!\nUmeshasajiliwa.\nPiga *384*53374# kuanza kuuza.',

  // Sell Produce
  'sell_step1_en': 'Select Product:\n1. Maize\n2. Beans\n0. Back',
  'sell_step1_sw': 'Chagua Bidhaa:\n1. Mahindi\n2. Maharage\n0. Rudi',
  'sell_invalid_product_en': 'Invalid product. Please dial *384*53374# to try again.',
  'sell_invalid_product_sw': 'Bidhaa batili. Tafadhali piga *384*53374# kujaribu tena.',
  'sell_step2_en': 'Enter number of bags (max 500):',
  'sell_step2_sw': 'Ingiza idadi ya gunia (mikopo 500):',
  'sell_invalid_qty_en': 'Invalid quantity. Must be between 1 and 500.\nPlease dial *384*53374# to try again.',
  'sell_invalid_qty_sw': 'Idadi batili. Lazima iwe kati ya 1 na 500.\nTafadhali piga *384*53374# kujaribu tena.',
  'sell_kg_en': 'Enter kg per bag (50 or 90):',
  'sell_kg_sw': 'Ingiza kg kwa kila gunia (50 au 90):',
  'sell_invalid_kg_en': 'Invalid. Enter 50 or 90.',
  'sell_invalid_kg_sw': 'Batili. Ingiza 50 au 90.',
  'sell_step3_en': 'Enter price per bag (KSh):',
  'sell_step3_sw': 'Ingiza bei kwa kila gunia (KSh):',
  'sell_invalid_price_en': 'Invalid price. Please dial *384*53374# to try again.',
  'sell_invalid_price_sw': 'Bei batili. Tafadhali piga *384*53374# kujaribu tena.',
  'sell_confirm_en': 'Confirm Listing:\nProduct: {product}\nBags: {quantity}\nKg/bag: {kg}\nPrice: KSh{price}/bag\n\n1. Confirm\n2. Cancel',
  'sell_confirm_sw': 'Thibitisha Orodha:\nBidhaa: {product}\nMakuba: {quantity}\nKg/gunia: {kg}\nBei: KSh {price}/gunia\n\n1. Thibitisha\n2. Ghairi',
  'sell_cancel_en': 'Listing cancelled.',
  'sell_cancel_sw': 'Orodha imeghairiwa.',
  'sell_success_en': 'Produce posted!\n{quantity} bags of {product} @ KSh {price}.\nBuyers will see your listing.',
  'sell_success_sw': 'Bidhaa imewekwa!\nMakuba {quantity} ya {product} @ KSh {price}.\nWanunuzi wataona orodha yako.',

  // Groups
  'groups_menu_en': 'My Group\n1. Join Group\n2. Create Group\n3. My Active Group\n0. Back',
  'groups_menu_sw': 'Kundi Langu\n1. Jiunge na Kundi\n2. Unda Kundi\n3. Kundi Langu\n0. Rudi',
  'groups_join_list_en': 'Verified Groups:\n{list}\n\nReply with number to join:',
  'groups_join_list_sw': 'Makundi Yaliyothibitishwa:\n{list}\n\nJibu kwa namba kujiunga:',
  'groups_join_none_en': 'No verified groups available in your area yet.',
  'groups_join_none_sw': 'Hakuna makundi yaliyothibitishwa kwenye eneo lako bado.',
  'groups_join_success_en': 'You joined {name}!\nWhatsApp: {link}',
  'groups_join_success_sw': 'Umejiunga na {name}!\nWhatsApp: {link}',
  'groups_join_success_no_wa_en': 'You joined {name}!',
  'groups_join_success_no_wa_sw': 'Umejiunga na {name}!',
  'groups_join_already_en': 'You are already a member of this group.',
  'groups_join_already_sw': 'Tayari u mwanachama wa kundi hili.',
  'groups_join_invalid_en': 'Invalid selection.',
  'groups_join_invalid_sw': 'Uchaguzi batili.',
  'groups_create_name_en': 'Enter group name:',
  'groups_create_name_sw': 'Ingiza jina la kundi:',
  'groups_create_county_en': 'Enter location/county:',
  'groups_create_county_sw': 'Ingiza eneo/kaunti:',
  'groups_create_confirm_en': 'Create group:\nName: {name}\nLocation: {location}\n\n1. Confirm\n2. Cancel',
  'groups_create_confirm_sw': 'Unda kundi:\nJina: {name}\nEneo: {location}\n\n1. Thibitisha\n2. Ghairi',
  'groups_create_success_en': 'Group created!\nPending admin approval.\nYou will be notified when approved.',
  'groups_create_success_sw': 'Kundi imeundwa!\nInasubiti kuidhinishwa.\nUtaarifiwa ikikubaliwa.',
  'groups_active_none_en': 'You have no active group.',
  'groups_active_none_sw': 'Huna kundi lao.',
  'groups_active_list_en': 'My Group: {name}\nStatus: {status}\n\n1. Post Produce\n0. Back',
  'groups_active_list_sw': 'Kundi Langu: {name}\nHali: {status}\n\n1. Weka Bidhaa\n0. Rudi',

  // Market Price & Alerts
  'market_menu_en': 'Market Price & Alerts\n1. Current Price\n2. Subscribe to Alerts\n0. Back',
  'market_menu_sw': 'Bei ya Soko & Arifa\n1. Bei za Sasa\n2. Jisajili kwa Arifa\n0. Rudi',
  'market_prices_en': 'Active Buyer Demand:\n{list}\n\nReply with number for details:',
  'market_prices_sw': 'Mahitaji ya Wanunuzi:\n{list}\n\nJibu kwa namba kwa maelezo:',
  'market_prices_none_en': 'No active buyer demand. Try selling produce first.',
  'market_prices_none_sw': 'Hakuna mahitaji ya wanunuzi. Jaribu kuuza bidhaa.',
  'alerts_menu_en': 'Subscribe to Alerts\n1. Free Alerts\n2. Paid Alerts\n0. Back',
  'alerts_menu_sw': 'Jisajili kwa Arifa\n1. Arifa za Bure\n2. Arifa za Kulipia\n0. Rudi',
  'alerts_free_menu_en': 'Free Alerts:\n1. Buyer Demand & Prices\n2. Weather Prediction\n3. News\n0. Back',
  'alerts_free_sw': 'Arifa za Bure:\n1. Mahitaji & Bei\n2. Tabia ya Nuru\n3. Habari\n0. Rudi',
  'alerts_free_subscribed_en': 'Subscribed to {alert}!\nYou will receive free alerts.',
  'alerts_free_subscribed_sw': 'Umesajiliwa kwa {alert}!\nUtapokea arifa za bure.',
  'alerts_paid_menu_en': 'Paid Alerts:\n1. Weather (KSh 150/mo)\n2. Buyer Demand Instant (KSh 120/mo)\n3. Pest (KSh 80/mo)\n0. Back',
  'alerts_paid_sw': 'Arifa za Kulipia:\n1. Nuru (KSh 150/mwezi)\n2. Mahitaji (KSh 120/mwezi)\n3. Wadudu (KSh 80/mwezi)\n0. Rudi',
  'alerts_paid_prompt_en': 'Pay KSh {price} for {plan}?\n\n1. Pay via M-PESA\n2. Cancel',
  'alerts_paid_prompt_sw': 'Lipa KSh {price} kwa {plan}?\n\n1. Lipa kwa M-PESA\n2. Ghairi',
  'alerts_paid_initiated_en': 'Payment request sent.\nCheck your phone for M-PESA prompt.',
  'alerts_paid_initiated_sw': 'Ombi la malipo limetumwa.\nAngalia simu yako kwa M-PESA.',
  'alerts_paid_failed_en': 'Payment initiation failed. Try again later.',
  'alerts_paid_failed_sw': 'Imeshindwa kuanzisha malipo. Jaribu tena.',

  // Notification/Bank
  'bank_menu_en': 'Notification/Bank\n1. My Account (Balance/Withdraw)\n2. Subscriptions\n0. Back',
  'bank_menu_sw': 'Arifa/Benki\n1. Akaunti Yangu\n2. Michango\n0. Rudi',
  'bank_smartshamba_id_en': 'Enter your SmartShamba ID:',
  'bank_smartshamba_id_sw': 'Ingiza Kitambulisho chako:',
  'bank_id_mismatch_en': 'This ID does not match your account.',
  'bank_id_mismatch_sw': 'Kitambulisho hakitakiili na akaunti yako.',
  'bank_pin_en': 'Enter your PIN:',
  'bank_pin_sw': 'Ingiza PIN yako:',
  'bank_pin_error_en': 'Error: {error}',
  'bank_pin_error_sw': 'Hitilafu: {error}',
  'bank_balance_en': 'Balance: KSh {balance}\n\n1. Withdraw\n0. Back',
  'bank_balance_sw': 'Salio: KSh {balance}\n\n1. Toa\n0. Rudi',
  'bank_withdraw_amount_en': 'Enter amount to withdraw (KSh):',
  'bank_withdraw_amount_sw': 'Ingiza kiasi cha kutoa (KSh):',
  'bank_withdraw_pin_en': 'Enter your PIN to confirm:',
  'bank_withdraw_pin_sw': 'Ingiza PIN kuthibitisha:',
  'bank_withdraw_success_en': 'Withdrawal request submitted!\nKSh {amount} will be sent to your M-PESA.',
  'bank_withdraw_success_sw': 'Ombi la kutoa limewasilishwa!\nKSh {amount} itatumwa kwa M-PESA.',
  'bank_withdraw_insufficient_en': 'Insufficient balance.',
  'bank_withdraw_insufficient_sw': 'Salio haitoshi.',
  'bank_subscriptions_en': 'My Subscriptions:\n{list}\n\nReply with number to cancel:',
  'bank_subscriptions_sw': 'Michango Yangu:\n{list}\n\nJibu kwa namba kughairi:',
  'bank_subscriptions_none_en': 'No active subscriptions.',
  'bank_subscriptions_none_sw': 'Hakuna michango inayoendelea.',
  'bank_sub_cancel_en': 'Cancel {type} subscription?\n1. Yes\n2. No',
  'bank_sub_cancel_sw': 'Ghairi {type}?\n1. Ndiyo\n2. Hapana',
  'bank_sub_cancelled_en': 'Subscription cancelled.',
  'bank_sub_cancelled_sw': 'Michango imeghairiwa.',

  // Quality Check
  'qc_listing_en': 'Select your listing:\n{list}\n0. Back',
  'qc_listing_sw': 'Chagua orodha yako:\n{list}\n0. Rudi',
  'qc_listing_none_en': 'You have no active listings.',
  'qc_listing_none_sw': 'Huna orodha zilizo wazi.',
  'qc_moisture_en': 'Enter moisture level (e.g. 13):',
  'qc_moisture_sw': 'Ingiza kiwango cha unyevu (mfano 13):',
  'qc_colour_en': 'Grain colour (1=Good, 2=Fair, 3=Poor):',
  'qc_colour_sw': 'Rangi ya nafaka (1=Nzuri, 2=Wastani, 3=Mbaya):',
  'qc_broken_en': 'Broken grain % (0-100):',
  'qc_broken_sw': 'Nafaka iliyovunjika % (0-100):',
  'qc_foreign_en': 'Foreign matter % (0-100):',
  'qc_foreign_sw': 'Vitu vya kigeni % (0-100):',
  'qc_success_en': 'Quality check submitted!\nYour listing has been assessed.',
  'qc_success_sw': 'Ukaguzi wa ubora umewasilishwa!\nOrodha yako imekaguliwa.',

  // OTP / Login
  'otp_menu_en': 'We will send an OTP to your phone.\n1. Send OTP\n0. Back',
  'otp_menu_sw': 'Tutatuma OTP kwenye simu yako.\n1. Tuma OTP\n0. Rudi',
  'otp_sent_en': 'OTP sent! Use it to login on smartshamba.vercel.app',
  'otp_sent_sw': 'OTP imetumwa! Tumia ili kuingia kwenye smartshamba.vercel.app',

  // Generic Errors
  'error_generic_en': 'Invalid input. Please dial *384*53374# to try again.',
  'error_generic_sw': 'Ingizo batili. Tafadhali piga *384*53374# kujaribu tena.',
  'error_service_en': 'END Service error. Please try again later.',
  'error_service_sw': 'END Hitilafu ya huduma. Tafadhali jaribu tena baadaye.',
  'error_session_en': 'Invalid session. Please dial *384*53374# to start again.',
  'error_session_sw': 'Kikao batili. Tafadhali piga *384*53374# kuanza tena.',
  'error_db_en': 'Service error. Please dial *384*53374# to try again.',
  'error_db_sw': 'Hitilafu ya huduma. Tafadhali piga *384*53374# kujaribu tena.',
};

const sw: Record<string, string> = { ...en };

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
