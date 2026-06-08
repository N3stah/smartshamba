// types/africastalking.d.ts
declare module 'africastalking' {
  interface AfricasTalkingOptions {
    username: string;
    apiKey: string;
  }

  interface SMSRecipient {
    status: string;
    number: string;
    cost: string;
    messageId: string;
  }

  interface SMSResponse {
    SMSMessageData: {
      Message: string;
      Recipients: SMSRecipient[];
    };
  }

  interface SMSSendOptions {
    to: string[];
    message: string;
    from?: string;
  }

  interface SMS {
    send(options: SMSSendOptions): Promise<SMSResponse>;
  }

  interface AfricasTalkingInstance {
    SMS: SMS;
  }

  function AfricasTalking(options: AfricasTalkingOptions): AfricasTalkingInstance;
  export = AfricasTalking;
}