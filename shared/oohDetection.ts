/**
 * Out-of-Hours (OOH) Detection Utility
 * 
 * Detects if a booking falls outside standard business hours (9 AM - 5 PM, Monday-Friday)
 * and calculates the appropriate premium based on service level.
 */

export interface OOHDetectionResult {
  isOOH: boolean;
  premiumPercent: number | null; // 25% flat rate
  reasons: string[]; // Array of reasons why it's OOH
}

/**
 * Standard business hours
 */
const BUSINESS_HOURS_START = 9; // 9 AM
const BUSINESS_HOURS_END = 17; // 5 PM (17:00)

/**
 * Premium percentage - flat 25% for all service levels
 */
const OOH_PREMIUM = 25; // +25% flat rate for all OOH bookings

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Check if a time (HH:MM format) is outside business hours
 */
function isOutsideBusinessHours(timeString: string): boolean {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours < BUSINESS_HOURS_START || hours >= BUSINESS_HOURS_END;
}

/**
 * Parse time string (HH:MM) to hours as decimal
 */
function parseTimeToHours(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours + minutes / 60;
}

/**
 * Detect if a booking is out-of-hours and calculate premium
 * 
 * @param scheduledDate - Date string in YYYY-MM-DD format
 * @param scheduledTime - Time string in HH:MM format
 * @param durationMinutes - Duration in minutes
 * @param serviceLevel - Service level: 'same_business_day', 'next_business_day', or 'scheduled'
 * @returns OOHDetectionResult with isOOH flag, premium percentage, and reasons
 */
export function detectOOH(
  scheduledDate: string,
  scheduledTime: string,
  durationMinutes: number,
  serviceLevel: 'same_business_day' | 'next_business_day' | 'scheduled'
): OOHDetectionResult {
  const reasons: string[] = [];
  let isOOH = false;

  // Parse the scheduled date and time
  const date = new Date(`${scheduledDate}T${scheduledTime}`);
  
  // Check 1: Weekend booking
  if (isWeekend(date)) {
    isOOH = true;
    const dayName = date.getDay() === 0 ? 'Sunday' : 'Saturday';
    reasons.push(`Weekend booking (${dayName})`);
  }

  // Check 2: Start time outside business hours
  if (isOutsideBusinessHours(scheduledTime)) {
    isOOH = true;
    const startHour = parseTimeToHours(scheduledTime);
    if (startHour < BUSINESS_HOURS_START) {
      reasons.push(`Early morning start (before ${BUSINESS_HOURS_START} AM)`);
    } else {
      reasons.push(`Evening start (after ${BUSINESS_HOURS_END - 12} PM)`);
    }
  }

  // Check 3: End time extends beyond business hours
  const startHours = parseTimeToHours(scheduledTime);
  const endHours = startHours + durationMinutes / 60;
  
  if (endHours > BUSINESS_HOURS_END) {
    isOOH = true;
    const endTime = Math.floor(endHours);
    const endMinutes = Math.round((endHours - endTime) * 60);
    const formattedEndTime = `${endTime}:${endMinutes.toString().padStart(2, '0')}`;
    reasons.push(`Work extends beyond business hours (ends at ${formattedEndTime})`);
  }

  // Calculate premium - flat 25% for all OOH bookings
  const premiumPercent = isOOH ? OOH_PREMIUM : null;

  return {
    isOOH,
    premiumPercent,
    reasons,
  };
}

/**
 * Format OOH reasons for display
 */
export function formatOOHReasons(reasons: string[]): string {
  if (reasons.length === 0) return '';
  if (reasons.length === 1) return reasons[0];
  if (reasons.length === 2) return `${reasons[0]} and ${reasons[1]}`;
  
  const lastReason = reasons[reasons.length - 1];
  const otherReasons = reasons.slice(0, -1).join(', ');
  return `${otherReasons}, and ${lastReason}`;
}

/**
 * Get OOH premium label for display
 */
export function getOOHPremiumLabel(premiumPercent: number): string {
  return `+${premiumPercent}% OOH Surcharge`;
}
