import { AIAction, AIActionContext } from './types';
import { createListingAction } from './create-listing';

// Hard allow-list of supported actions
const actionRegistry: Record<string, AIAction> = {
  CREATE_LISTING: createListingAction
};

export async function processAIAction(
  fullText: string, 
  context: AIActionContext
): Promise<string | null> {
  // Check if it looks like an action
  if (!fullText.startsWith('[ACTION:')) {
    return null;
  }

  const match = fullText.match(/\[ACTION:(.*?):(.*?)\]/);
  if (!match) {
    return "I recognized an action request, but couldn't parse it. Please try again.";
  }

  const actionType = match[1];
  const jsonStr = match[2];

  const action = actionRegistry[actionType];
  if (!action) {
    return `Action '${actionType}' is not supported.`;
  }

  try {
    const params = JSON.parse(jsonStr);
    return await action.handler(context, params);
  } catch (e) {
    return "I understood you want to perform an action, but I couldn't parse the details. Please try again.";
  }
}
