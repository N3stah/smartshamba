export type Language = 'en' | 'sw';

export interface Dictionary {
  common: {
    appName: string;
    welcome: string;
    loading: string;
    save: string;
    cancel: string;
    confirm: string;
    search: string;
    filter: string;
    actions: string;
    status: string;
    date: string;
    reference: string;
    logout: string;
    back: string;
    language: string;
    english: string;
    kiswahili: string;
  };
  emptyStates: {
    noTransactions: string;
    noBuyers: string;
    noGroups: string;
    noNotifications: string;
    noAdvisories: string;
    noDisputes: string;
  };
  dashboard: {
    title: string;
    overview: string;
    registeredFarmers: string;
    verifiedBuyers: string;
    totalTransactions: string;
    systemStatus: string;
    operational: string;
    totalBagsSold: string;
    totalValue: string;
    readyToSell: string;
    dialUssd: string;
    recentTransactions: string;
    viewAll: string;
  };
}
