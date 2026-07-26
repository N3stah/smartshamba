import { Language } from '@/lib/i18n/types';

type USSDParams = Record<string, string | number>;

const en: Record<string, string> = {
  // Main Menu
  'main_menu': 'Welcome to SmartShamba\nRift Valley & Western Kenya\n\n1. Farmer\n2. Buyer\n3. About / Help\n0. Exit',
  'exit': 'Thank you for using SmartShamba. Goodbye!',
  'unauthorized': 'END Unauthorized request.',

  // Farmer Menu
  'farmer_menu': 'Farmer Menu\n\n1. Sell Produce\n2. My Groups\n3. Market Prices\n4. My Transactions\n5. Quality Check\n6. Website Login\n0. Back',
  
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
  'sell_step3_en': 'Enter price per 90kg bag (KSh):',
  'sell_step3_sw': 'Ingiza bei kwa kila gunia cha 90kg (KSh):',
  'sell_invalid_price_en': 'Invalid price. Please dial *384*53374# to try again.',
  'sell_invalid_price_sw': 'Bei batili. Tafadhali piga *384*53374# kujaribu tena.',
  'sell_confirm_en': 'Confirm Listing:\nProduct: {product}\nBags: {quantity}\nPrice: KSh {price}/bag\n\n1. Confirm\n2. Cancel',
  'sell_confirm_sw': 'Thibitisha Orodha:\nBidhaa: {product}\nMakuba: {quantity}\nBei: KSh {price}/gunia\n\n1. Thibitisha\n2. Ghairi',
  'sell_cancel_en': 'Listing cancelled.',
  'sell_cancel_sw': 'Orodha imeghairiwa.',
  'sell_success_en': 'Produce posted!\n{quantity} bags of {product} @ KSh {price}.\nBuyers will see your listing.',
  'sell_success_sw': 'Bidhaa imewekwa!\nMakuba {quantity} ya {product} @ KSh {price}.\nWanunuzi wataona orodha yako.',

  // Groups
  'groups_menu_en': 'My Groups\n1. Join Village Group\n2. Create New Group\n3. My Active Groups\n0. Back',
  'groups_menu_sw': 'Makundi Yangu\n1. Jiunge na Kundi\n2. Unda Kundi Jipya\n3. Makundi Yangu\n0. Rudi',
  'groups_defer_en': 'Please visit smartshamba.vercel.app/dashboard/groups to manage your groups easily.',
  'groups_defer_sw': 'Tafadhali tembelea smartshamba.vercel.app/dashboard/groups kudhibiti makundi yako.',

  // Market Prices
  'prices_menu_en': 'Market Prices & Alerts\n1. Current Prices\n2. Subscribe to Alerts\n0. Back',
  'prices_menu_sw': 'Bei ya Soko & Arifa\n1. Bei za Sasa\n2. Jisajili kwa Arifa\n0. Rudi',
  'prices_current_en': 'Current Top Maize Price:\nKSh {price} per 90kg bag',
  'prices_current_sw': 'Bei ya Juu ya Mahindi Sasa:\nKSh {price} kwa kila gunia cha 90kg',
  'prices_subscribe_en': 'You are subscribed to weekly market reports. Manage preferences on the website.',
  'prices_subscribe_sw': 'Umesajiliwa kwa ripoti za kila wiki. Dhibiti mapendeleo kwenye tovuti.',

  // Transactions
  'tx_none_en': 'You have no transactions yet.',
  'tx_none_sw': 'Huna miamala bado.',
  'tx_list_en': 'My transactions:\n{list}\n\nReply with number for details:',
  'tx_list_sw': 'Miamala yangu:\n{list}\n\nJibu kwa namba kwa maelezo:',
  'tx_details_en': 'Ref: {ref}\nBuyer: {buyer}\nBags: {bags}\nTotal: KSh {total}\nStatus: {status}',
  'tx_details_sw': 'Ref: {ref}\nMnunuzi: {buyer}\nMakuba: {bags}\nJumla: KSh {total}\nHali: {status}',
  'tx_invalid_en': 'Invalid selection.',
  'tx_invalid_sw': 'Uchaguzi batili.',

  // Quality Check
  'qc_step1_en': 'Quality Check\nEnter moisture level (e.g. 13):',
  'qc_step1_sw': 'Ukaguzi wa Ubora\nIngiza kiwango cha unyevu (mfano 13):',
  'qc_invalid_en': 'Invalid input. Please enter a number.',
  'qc_invalid_sw': 'Ingizo batili. Tafadhali ingiza namba.',
  'qc_premium_en': 'Grade: Premium (Low Moisture).\nYou qualify for top buyer prices!',
  'qc_premium_sw': 'Daraja: Premium (Unyevu wa Chini).\nUnastahili bei za juu za wanunuzi!',
  'qc_standard_en': 'Grade: Standard (High Moisture).\nDry your maize further for better prices.',
  'qc_standard_sw': 'Daraja: Kawaida (Unyevu wa Juu).\nKauka mahindi yako zaidi kwa bei nzuri.',

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

const sw: Record<string, string> = { ...en }; // Fallback to English for any missing keys

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
