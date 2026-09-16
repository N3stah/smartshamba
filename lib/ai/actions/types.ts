export type SmartShambaRole = 'FARMER' | 'BUYER' | 'STAFF' | 'TRANSPORT';

export interface AIActionContext {
  userId: string;
  role: SmartShambaRole;
}

export interface AIAction {
  type: string;
  handler: (context: AIActionContext, params: unknown) => Promise<string>;
}
