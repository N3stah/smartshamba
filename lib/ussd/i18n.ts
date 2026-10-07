import { Language } from '@/lib/i18n/types';

type USSDParams = Record<string, string | number>;

const en: Record<string, string> = {
  // Main Menu
  'main_menu': 'Welcome to SmartShamba\nRift Valley & Western Kenya\n\n1. Farmer\n2. Buyer\n3. Transport\n4. About / Help\n0. Exit',
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
  'reg_success_sw': 'Usajili umefanikiwa!\nTutatuma OTP kuingia kwenye tovuti.\n\n1. Tuma OTP\n2. Ruka',
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
  'groups_create_name_en': 'Enter group name:',
  'groups_create_name_sw': 'Ingiza jina la kundi:',
  'groups_create_county_en': 'Enter location/county:',
  'groups_create_county_sw': 'Ingiza eneo/kaunti:',
  'groups_create_confirm_en': 'Create group:\nName: {name}\nLocation: {location}\n\n1. Confirm\n2. Cancel',
  'groups_create_confirm_sw': 'Unda kundi:\nJina: {name}\nEneo: {location}\n\n1. Thibitisha\n2. Ghairi',
  'groups_create_success_en': 'Group created!\nPending admin approval.\nYou will be notified when approved.',
  'groups_create_success_sw': 'Kundi imeundwa!\nInasubiri kuidhinishwa.\nUtaarifiwa ikikubaliwa.',
  'groups_active_none_en': 'You have no active group.',
  'groups_active_none_sw': 'Huna kundi lao.',
  'groups_active_list_en': 'My Group: {name}\nStatus: {status}\n\n1. Post Produce\n0. Back',
  'groups_active_list_sw': 'Kundi Langu: {name}\nHali: {status}\n\n1. Weka Bidhaa\n0. Rudi',

  // Market Price & Alerts
  'market_menu_en': 'Market Price & Alerts\n1. Current Price\n2. Subscribe to Alerts\n0. Back',
  'market_menu_sw': 'Bei ya Soko & Arifa\n1. Bei za Sasa\n2. Jisajili kwa Arifa\n0. Rudi',
  'market_prices_en': 'Active Buyer demand:\n{list}\n\n0. Back',
  'market_prices_sw': 'Mahitaki ya Wanunuzi:\n{list}\n\n0. Rudi',
  'market_prices_none_en': 'No active buyer demand. Try selling produce first.',
  'market_prices_none_sw': 'Hakuna mahitaki ya wanunuzi. Jaribu kuuza bidhaa.',
  'alerts_menu_en': 'Subscribe to Alerts\n1. Free Alerts\n2. Paid Alerts\n0. Back',
  'alerts_menu_sw': 'Jisajili kwa Arifa\n1. Arifa za Bure\n2. Arifa za Kulipia\n0. Rudi',
  'alerts_free_menu_en': 'Free Alerts:\n1. Buyer Demand & Prices\n2. Weather Prediction\n3. News\n0. Back',
  'alerts_free_sw': 'Arifa za Bure:\n1. Mahitaki & Bei\n2. Tabia ya Hali ya Hewa\n3. Habari\n0. Rudi',
  'alerts_free_subscribed_en': 'Subscribed to {alert}!\nYou will receive free alerts.',
  'alerts_free_subscribed_sw': 'Umesajiliwa kwa {alert}!\nUtapokea arifa za bure.',
  'alerts_paid_menu_en': 'Paid Alerts:\n1. Weather (KSh 150/mo)\n2. Buyer Demand Instant (KSh 120/mo)\n3. Pest (KSh 80/mo)\n0. Back',
  'alerts_paid_sw': 'Arifa za Kulipia:\n1. Hali ya Hewa (KSh 150/mwezi)\n2. Mahitaki ya Haraka (KSh 120/mwezi)\n3. Wadudu (KSh 80/mwezi)\n0. Rudi',
  'alerts_paid_prompt_en': 'Pay KSh {price} for {plan}?\n\n1. Pay via M-PESA\n2. Cancel',
  'alerts_paid_prompt_sw': 'Lipa KSh {price} kwa {plan}?\n\n1. Lipa kwa M-PESA\n2. Ghairi',
  'alerts_paid_initiated_en': 'Payment request sent.\nCheck your phone for M-PESA prompt.',
  'alerts_paid_initiated_sw': 'Ombi la malipo limetumwa.\nAngalia simu yako kwa M-PESA.',
  'alerts_paid_failed_en': 'Payment initiation failed. Try again later.',
  'alerts_paid_failed_sw': 'Imeshindwa kuanzisha malipo. Jaribu tena.',

  // Notification / Bank
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

  // Buyer Menu
  'buyer_menu': 'Buyer Menu\n\n1. Post Demand\n2. Live Market Produce\n3. Notification/Bank\n4. Buyer Verification\n5. Web Login\n0. Back',
  'buyer_post_demand_product_en': 'Select Product:\n1. Maize\n0. Back',
  'buyer_post_demand_product_sw': 'Chagua Bidhaa:\n1. Mahindi\n0. Rudi',
  'buyer_post_demand_bag_size_en': 'Select Bag Size:\n1. 50kg\n2. 90kg\n0. Back',
  'buyer_post_demand_bag_size_sw': 'Chagua Ukubwa wa Gunia:\n1. 50kg\n2. 90kg\n0. Rudi',
  'buyer_post_demand_qty_en': 'Enter number of bags required:',
  'buyer_post_demand_qty_sw': 'Ingiza idadi ya gunia inayohitajika:',
  'buyer_post_demand_duration_en': 'Select Duration:\n1. 1 Week\n2. 2 Weeks\n3. 1 Month\n0. Back',
  'buyer_post_demand_duration_sw': 'Chagua Muda:\n1. Wiki 1\n2. Wiki 2\n3. Mwezi 1\n0. Rudi',
  'buyer_post_demand_price_en': 'Enter price per bag (KSh):',
  'buyer_post_demand_price_sw': 'Ingiza bei kwa kila gunia (KSh):',
  'buyer_post_demand_confirm_en': 'Confirm Demand:\nProduct: {product}\nBags: {qty}\nSize: {bagSize}kg\nDuration: {duration}\nPrice: KSh{price}/bag\n\n1. Confirm\n2. Cancel',
  'buyer_post_demand_confirm_sw': 'Thibitisha Hitaji:\nBidhaa: {product}\nMakuba: {qty}\nUkubwa: {bagSize}kg\nMuda: {duration}\nBei: KSh{price}/gunia\n\n1. Thibitisha\n2. Ghairi',
  'buyer_demand_success_en': 'Demand posted!\nFarmers will see your offer.',
  'buyer_demand_success_sw': 'Hitaji limewekwa!\nWakulima wataona ofa yako.',
  'buyer_market_menu_en': 'Live Market\n1. Individual Posts\n2. Group Posts\n0. Back',
  'buyer_market_menu_sw': 'Soko la Haraka\n1. Machapisho ya Binafsi\n2. Machapisho ya Kundi\n0. Rudi',
  'buyer_market_list_en': 'Available Maize:\n{list}\n\n0. Back',
  'buyer_market_list_sw': 'Mahindi Yaliyopo:\n{list}\n\n0. Rudi',
  'buyer_market_none_en': 'No active produce available.',
  'buyer_market_none_sw': 'Hakuna mazao yaliyopo sasa.',
  'buyer_verify_menu_en': 'Buyer Verification\n1. Monthly (KSh 200)\n2. Yearly (KSh 2000)\n0. Back',
  'buyer_verify_menu_sw': 'Uthibitisho wa Mnunuzi\n1. Ya Mwezi (KSh 200)\n2. Ya Mwaka (KSh 2000)\n0. Rudi',
  'buyer_verify_confirm_en': 'Pay KSh {price} for {plan} verification?\n\n1. Pay via M-PESA\n2. Cancel',
  'buyer_verify_confirm_sw': 'Lipa KSh {price} kwa {plan}?\n\n1. Lipa kwa M-PESA\n2. Ghairi',

  // Transport Menu
  'transport_menu': 'Transport Menu\n\n1. Register\n2. My Account\n3. Available Loads\n4. Priority Alerts\n5. Web Login\n0. Back',
  'transport_reg_name_en': 'Enter your full name or business name:',
  'transport_reg_national_id_en': 'Enter your National ID or Business Reg:',
  'transport_reg_location_en': 'Enter your base location (County, Town):',
  'transport_reg_plate_en': 'Enter vehicle registration number (e.g. KDA 123A):',
  'transport_reg_license_en': 'Enter your driving license number:',
  'transport_reg_capacity_en': 'Enter vehicle capacity in bags (e.g. 50):',
  'transport_reg_pin_en': 'Set a 4-digit PIN for your account:',
  'transport_reg_success_en': 'Registration successful!\nYour SmartShamba ID is {id}\nPending admin approval.',
  'transport_loads_county_en': 'Select County:\n1. Trans Nzoia\n2. Uasin Gishu\n3. Nakuru\n4. All Counties\n0. Back',
  'transport_loads_list_en': 'Available Loads:\n{list}\n\nReply with number to accept:',
  'transport_loads_none_en': 'No loads available in this area.',
  'transport_loads_confirm_en': 'Accept Load?\nFrom: {pickup}\nTo: {dropoff}\nBags: {bags}\n\n1. Accept\n2. Cancel',
  'transport_loads_success_en': 'Load accepted!\nPickup: {pickup}\nDropoff: {dropoff}',
  'transport_sub_menu_en': 'Priority Load Alerts\n1. Monthly (KSh 100)\n0. Back',
  'transport_sub_confirm_en': 'Pay KSh {price} for {plan}?\n\n1. Pay via M-PESA\n2. Cancel',

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
  
  'transport_loads_county_sw': 'Chagua Kaunti:\n1. Trans Nzoia\n2. Uasin Gishu\n3. Nakuru\n4. Kaunti Zote\n0. Rudi',
  'transport_loads_list_sw': 'Mizigo Inayopatikana:\n{list}\n\nJibu kwa namba kukubali:',
  'transport_loads_none_sw': 'Hakuna mizigo inayopatikana kwenye eneo hili.',
  'transport_loads_confirm_sw': 'Kubali Mizigo?\nKutoka: {pickup}\nKwenda: {dropoff}\nMakuba: {bags}\n\n1. Kubali\n2. Ghairi',
  'transport_loads_success_sw': 'Mzigo umekubaliwa!\nKuchukua: {pickup}\nKupeleka: {dropoff}',
  'transport_sub_menu_sw': 'Arifa za Kipaumbele za Mizigo\n1. Ya Mwezi (KSh 100)\n0. Rudi',
  'transport_sub_confirm_sw': 'Lipa KSh {price} kwa {plan}?\n\n1. Lipa kwa M-PESA\n2. Ghairi',
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

// --- Phase 1C: Farm Costs i18n ---
export function getFarmCostText(lang: string, key: string, params?: Record<string, string>): string {
  const dict: Record<string, Record<string, string>> = {
    en: {
      menu: "My Farm Costs",
      add_cost: "1. Add Cost",
      view_total: "2. View Total",
      back: "0. Back",
      no_cycles: "No crop cycle found.",
      create_cycle: "1. Create crop cycle",
      enter_crop: "Enter crop name:",
      enter_season: "Enter season:",
      enter_amount: "Enter amount in KSh:",
      select_category: "Select Cost:",
      cat_seed: "1. Seed",
      cat_fertilizer: "2. Fertilizer",
      cat_labour: "3. Labour",
      cat_chemicals: "4. Chemicals",
      cat_transport: "5. Transport",
      cat_harvesting: "6. Harvesting",
      cat_storage: "7. Storage",
      cat_other: "8. Other",
      confirm: "Confirm cost:",
      save: "1. Save",
      cancel: "2. Cancel",
      saved: "Cost saved successfully.",
      total: "Total farm costs: KSh {amount}",
      error_amount: "Invalid amount. Try again.",
      error_cycle: "Error: Crop cycle not found.",
      error_generic: "Service unavailable. Try again later."
    },
    sw: {
      menu: "Gharama za Shamba",
      add_cost: "1. Ongeza Gharama",
      view_total: "2. Ona Jumla",
      back: "0. Rudi",
      no_cycles: "Hakuna mzunguko wa mazao uliopatikana.",
      create_cycle: "1. Unda mzunguko wa mazao",
      enter_crop: "Ingiza jina la zao:",
      enter_season: "Ingiza msimu:",
      enter_amount: "Ingiza kiasi kwa KSh:",
      select_category: "Chagua Gharama:",
      cat_seed: "1. Mbegu",
      cat_fertilizer: "2. Mbolea",
      cat_labour: "3. Kazi",
      cat_chemicals: "4. Dawa",
      cat_transport: "5. Usafirishaji",
      cat_harvesting: "6. Kuvuna",
      cat_storage: "7. Hifadhi",
      cat_other: "8. Nyingine",
      confirm: "Thibitisha gharama:",
      save: "1. Hifadhi",
      cancel: "2. Ghairi",
      saved: "Gharama imehifadhiwa.",
      total: "Jumla ya gharama: KSh {amount}",
      error_amount: "Kiasi batili. Jaribu tena.",
      error_cycle: "Hitilafu: Mzunguko wa mazao haujapatikana.",
      error_generic: "Huduma haipatikani. Jaribu tena baadaye."
    }
  };
  const langDict = dict[lang] || dict.en;
  let text = langDict[key] || key;
  if (params) {
    Object.keys(params).forEach(p => {
      text = text.replace(`{${p}}`, params[p]);
    });
  }
  return text;
}
