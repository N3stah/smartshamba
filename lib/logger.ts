export type LogPrefix = 
  | '[USSD]' | '[AUTH]' | '[PAYMENT]' | '[SMS]' | '[ADMIN]' 
  | '[BUYER]' | '[FARMER]' | '[GROUP]' | '[NOTIFICATION]' 
  | '[DISPUTE]' | '[SYNC]' | '[DB]' | '[API]';

export const logger = {
  log: (prefix: LogPrefix, ...args: unknown[]) => console.log(prefix, ...args),
  error: (prefix: LogPrefix, ...args: unknown[]) => console.error(prefix, ...args),
  warn: (prefix: LogPrefix, ...args: unknown[]) => console.warn(prefix, ...args),
};
