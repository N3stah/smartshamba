import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

/**
 * Evaluates active weather alerts and applies/releases transport holds.
 * This function is idempotent and safe to run on a cron schedule.
 */
export async function processTransportWeatherHolds() {
  try {
    console.log('[WEATHER] Processing transport holds...');
    
    // 1. Find all active severe alerts
    const activeAlerts = await prisma.weatherAlert.findMany({
      where: { 
        status: 'ACTIVE', 
        severity: { in: ['HIGH', 'CRITICAL'] } 
      }
    });

    if (activeAlerts.length === 0) {
      // No active alerts, release all holds (unless overridden)
      const released = await prisma.transportBooking.updateMany({
        where: { 
          isHalted: true, 
          weatherOverride: false,
          status: { in: ['ACCEPTED', 'LOADED', 'IN_TRANSIT'] }
        },
        data: { 
          isHalted: false, 
          haltReason: null, 
          weatherAlertId: null 
        }
      });
      if (released.count > 0) console.log(`[WEATHER] Released ${released.count} holds (no active alerts).`);
      return;
    }

    const alertCountyIds = activeAlerts.map(a => a.countyId).filter(Boolean) as string[];

    // 2. Find active bookings that are NOT overridden
    const activeBookings = await prisma.transportBooking.findMany({
      where: {
        status: { in: ['ACCEPTED', 'LOADED', 'IN_TRANSIT'] },
        weatherOverride: false,
        OR: [
          { pickupCountyId: { in: alertCountyIds } },
          { dropoffCountyId: { in: alertCountyIds } }
        ]
      }
    });

    let heldCount = 0;
    let releasedCount = 0;

    for (const booking of activeBookings) {
      // Find the first matching alert to link as the reason
      const matchingAlert = activeAlerts.find(a => 
        a.countyId === booking.pickupCountyId || a.countyId === booking.dropoffCountyId
      );

      if (matchingAlert) {
        if (!booking.isHalted || booking.weatherAlertId !== matchingAlert.id) {
          await prisma.transportBooking.update({
            where: { id: booking.id },
            data: {
              isHalted: true,
              weatherAlertId: matchingAlert.id,
              haltReason: `Severe weather warning: ${matchingAlert.message}`
            }
          });
          heldCount++;
        }
      }
    }

    // 3. Release bookings that are halted but no longer match any active alert
    const haltedBookings = await prisma.transportBooking.findMany({
      where: { 
        isHalted: true, 
        weatherOverride: false,
        status: { in: ['ACCEPTED', 'LOADED', 'IN_TRANSIT'] }
      }
    });

    for (const booking of haltedBookings) {
      const stillAffected = activeAlerts.some(a => 
        a.countyId === booking.pickupCountyId || a.countyId === booking.dropoffCountyId
      );

      if (!stillAffected) {
        await prisma.transportBooking.update({
          where: { id: booking.id },
          data: { 
            isHalted: false, 
            haltReason: null, 
            weatherAlertId: null 
          }
        });
        releasedCount++;
      }
    }

    console.log(`[WEATHER] Hold processing complete. Held: ${heldCount}, Released: ${releasedCount}`);
  } catch (error) {
    console.error('[WEATHER] Failed to process transport holds:', error);
    Sentry.captureException(error);
    await Sentry.flush(2000);
  }
}
