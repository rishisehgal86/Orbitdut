/**
 * Scheduling and Out-Of-Hours (OOH) validation utilities
 * Business hours: 9 AM - 5 PM in site location's timezone
 */

export interface ScheduleValidation {
  isValid: boolean;
  isOutOfHours: boolean;
  message?: string;
  warnings: string[];
}

const BUSINESS_HOURS_START = 9; // 9 AM
const BUSINESS_HOURS_END = 17; // 5 PM
const SAME_DAY_REQUIRED_HOURS = 4; // Same Business Day requires 4 hours

/**
 * Check if a given time is within business hours (9 AM - 5 PM)
 */
export function isWithinBusinessHours(hour: number): boolean {
  return hour >= BUSINESS_HOURS_START && hour < BUSINESS_HOURS_END;
}

/**
 * Calculate business hours remaining in a day from a given time
 */
export function getBusinessHoursRemaining(currentHour: number, currentMinute: number): number {
  if (currentHour >= BUSINESS_HOURS_END) {
    return 0; // After business hours
  }
  if (currentHour < BUSINESS_HOURS_START) {
    return BUSINESS_HOURS_END - BUSINESS_HOURS_START; // Full business day
  }
  
  // Calculate remaining hours
  const remainingHours = BUSINESS_HOURS_END - currentHour;
  const remainingMinutes = -currentMinute;
  return remainingHours + (remainingMinutes / 60);
}

/**
 * Check if work will extend beyond business hours
 */
export function willExtendBeyondBusinessHours(
  startHour: number,
  startMinute: number,
  durationMinutes: number
): boolean {
  const endTimeMinutes = (startHour * 60) + startMinute + durationMinutes;
  const businessEndMinutes = BUSINESS_HOURS_END * 60;
  return endTimeMinutes > businessEndMinutes;
}

/**
 * Validate scheduling based on service level and site timezone
 */
export function validateSchedule(
  serviceLevel: "same_day" | "next_day" | "scheduled",
  scheduledDate: string,
  scheduledTime: string,
  estimatedDurationMinutes: number,
  siteTimezone: string
): ScheduleValidation {
  const result: ScheduleValidation = {
    isValid: true,
    isOutOfHours: false,
    warnings: [],
  };

  if (!scheduledDate || !scheduledTime || !siteTimezone) {
    return {
      isValid: false,
      isOutOfHours: false,
      message: "Please complete all scheduling fields",
      warnings: [],
    };
  }

  try {
    // Parse scheduled time in site timezone
    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const scheduledHour = scheduledDateTime.getHours();
    const scheduledMinute = scheduledDateTime.getMinutes();

    // Get current time in site timezone
    const now = new Date();
    const todayDate = now.toISOString().split('T')[0];
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Check if scheduled time is within business hours
    if (!isWithinBusinessHours(scheduledHour)) {
      result.isOutOfHours = true;
      result.warnings.push(
        `⚠️ Scheduled time (${scheduledTime}) is outside business hours (9 AM - 5 PM). Out-Of-Hours charges will apply.`
      );
    }

    // Check if work will extend beyond business hours
    if (willExtendBeyondBusinessHours(scheduledHour, scheduledMinute, estimatedDurationMinutes)) {
      result.isOutOfHours = true;
      result.warnings.push(
        `⚠️ Estimated work duration will extend beyond 5 PM. Out-Of-Hours charges will apply for time after business hours.`
      );
    }

    // Service level specific validations
    switch (serviceLevel) {
      case "same_day":
        // Must be today
        if (scheduledDate !== todayDate) {
          result.isValid = false;
          result.message = "Same Business Day service must be scheduled for today";
        }

        // Check if enough business hours remain
        const hoursRemaining = getBusinessHoursRemaining(currentHour, currentMinute);
        if (hoursRemaining < SAME_DAY_REQUIRED_HOURS) {
          result.isOutOfHours = true;
          result.warnings.push(
            `⚠️ Less than 4 business hours remaining today (${hoursRemaining.toFixed(1)}h left). Out-Of-Hours charges may apply to meet Same Business Day SLA.`
          );
        }

        // Scheduled time must be within next 4 hours
        const scheduledTimeMinutes = (scheduledHour * 60) + scheduledMinute;
        const currentTimeMinutes = (currentHour * 60) + currentMinute;
        const minutesUntilScheduled = scheduledTimeMinutes - currentTimeMinutes;
        
        if (minutesUntilScheduled > 240) { // 4 hours
          result.isValid = false;
          result.message = "Same Business Day service must start within 4 hours";
        }
        break;

      case "next_day":
        // Must be tomorrow
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDate = tomorrow.toISOString().split('T')[0];
        
        if (scheduledDate !== tomorrowDate) {
          result.isValid = false;
          result.message = "Next Business Day service must be scheduled for tomorrow";
        }
        break;

      case "scheduled":
        // Must be at least 48 hours in advance
        const scheduledTimestamp = scheduledDateTime.getTime();
        const nowTimestamp = now.getTime();
        const hoursInAdvance = (scheduledTimestamp - nowTimestamp) / (1000 * 60 * 60);
        
        if (hoursInAdvance < 48) {
          result.isValid = false;
          result.message = "Scheduled service must be booked at least 48 hours in advance";
        }
        break;
    }

    return result;
  } catch (error) {
    return {
      isValid: false,
      isOutOfHours: false,
      message: "Invalid date or time format",
      warnings: [],
    };
  }
}

/**
 * Get human-readable description of service level requirements
 */
export function getServiceLevelDescription(serviceLevel: "same_day" | "next_day" | "scheduled"): string {
  switch (serviceLevel) {
    case "same_day":
      return "Response within 4 hours during business hours (9 AM - 5 PM)";
    case "next_day":
      return "Service scheduled for next business day";
    case "scheduled":
      return "Service scheduled 48+ hours in advance";
    default:
      return "";
  }
}
