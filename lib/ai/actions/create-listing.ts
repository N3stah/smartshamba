import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { AIAction, AIActionContext } from './types';
import * as Sentry from '@sentry/nextjs';

const CreateListingSchema = z.object({
  crop: z.string().min(1, "Crop is required"),
  bags: z.number().int().positive("Bags must be a positive integer"),
  price: z.number().positive("Price must be a positive number")
}).strict(); // Reject unknown fields

export const createListingHandler = async (context: AIActionContext, params: unknown): Promise<string> => {
  if (context.role !== 'FARMER') {
    return "Action rejected: Only farmers can create produce listings.";
  }

  const parsed = CreateListingSchema.safeParse(params);
  if (!parsed.success) {
    return `I understood you want to create a listing, but the details were invalid: ${parsed.error.issues.map(i => i.message).join(', ')}. Please use the 'Sell Produce' page to create it manually.`;
  }

  const { crop, bags, price } = parsed.data;

  try {
    // Check if farmer is frozen (Trust Guard logic)
    const farmer = await prisma.farmer.findUnique({ where: { id: context.userId }, select: { isFrozen: true } });
    if (farmer?.isFrozen) {
      return "Action rejected: Your account is currently frozen and you cannot create new listings.";
    }

    await prisma.produceListing.create({
      data: {
        farmerId: context.userId,
        product: crop,
        quantityBags: bags,
        pricePerBag: price,
        status: 'ACTIVE'
      }
    });

    return "✅ Done! I've created the produce listing for you. You can view it in your 'Sell Produce' dashboard.";
  } catch (error) {
    console.error('[AI_ACTION] Create listing error:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
    return "I encountered an error while creating the listing. Please try again or use the 'Sell Produce' page.";
  }
};

export const createListingAction: AIAction = {
  type: 'CREATE_LISTING',
  handler: createListingHandler
};
