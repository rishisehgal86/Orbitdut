import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";

describe("FSM Job Creation", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    // Create a caller without authentication (using publicProcedure)
    caller = appRouter.createCaller({ user: null });
  });

  it("should create a job with all FSM fields", async () => {
    const jobData = {
      // Basic job info
      jobToken: `TEST-${Date.now()}-FSM`,
      customerName: "John Doe",
      customerEmail: "john.doe@example.com",
      customerPhone: "+1-555-0123",

      // Service details
      serviceType: "L1_EUC",
      description: "Replace faulty network switch in server room",
      estimatedDuration: 240, // 4 hours
      bookingType: "hourly" as const,
      downTime: true,

      // Site location
      siteName: "Main Data Center",
      siteAddress: "123 Tech Street, San Francisco, CA 94105",
      city: "San Francisco",
      siteState: "California",
      country: "US",
      postalCode: "94105",
      siteLatitude: "37.7749",
      siteLongitude: "-122.4194",
      timezone: "America/Los_Angeles",

      // Site contact
      siteContactName: "Jane Smith",
      siteContactNumber: "+1-555-0456",

      // Site access & requirements
      accessInstructions: "Use gate code #1234. Check in at security desk.",
      specialRequirements: "Must have data center certification. Wear ESD protection.",
      equipmentNeeded: "Bring replacement switch (Cisco Catalyst 9300)",

      // Scheduling
      scheduledDateTime: new Date("2025-01-15T09:00:00-08:00").toISOString(),

      // Project/Ticket info
      projectName: "Q1 Infrastructure Upgrade",
      changeNumber: "CHG0012345",
      incidentNumber: "INC0067890",

      // Communication
      videoConferenceLink: "https://zoom.us/j/1234567890",
      notes: "This is a critical production system. Please coordinate with on-site team before starting work.",

      // Pricing
      calculatedPrice: 40000, // $400.00 in cents
      currency: "USD",
      isOutOfHours: false,
    };

    // Create the job
    const result = await caller.jobs.create(jobData);

    // Verify creation succeeded
    expect(result.success).toBe(true);
    expect(result.jobId).toBeGreaterThan(0);

    // Fetch the created job to verify all fields were saved
    const { getDb } = await import("./db");
    const { jobs } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    
    if (!db) throw new Error("Database not available");

    const [createdJob] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, result.jobId))
      .limit(1);

    // Verify all FSM fields
    expect(createdJob).toBeDefined();
    expect(createdJob.jobToken).toBe(jobData.jobToken);
    
    // Customer info
    expect(createdJob.customerName).toBe(jobData.customerName);
    expect(createdJob.customerEmail).toBe(jobData.customerEmail);
    expect(createdJob.customerPhone).toBe(jobData.customerPhone);

    // Service details
    expect(createdJob.serviceType).toBe(jobData.serviceType);
    expect(createdJob.description).toBe(jobData.description);
    expect(createdJob.estimatedDuration).toBe(jobData.estimatedDuration);
    expect(createdJob.bookingType).toBe(jobData.bookingType);
    expect(createdJob.downTime).toBe(true);

    // Site location
    expect(createdJob.siteName).toBe(jobData.siteName);
    expect(createdJob.siteAddress).toBe(jobData.siteAddress);
    expect(createdJob.city).toBe(jobData.city);
    expect(createdJob.siteState).toBe(jobData.siteState);
    expect(createdJob.country).toBe(jobData.country);
    expect(createdJob.postalCode).toBe(jobData.postalCode);
    expect(createdJob.siteLatitude).toBe(jobData.siteLatitude);
    expect(createdJob.siteLongitude).toBe(jobData.siteLongitude);
    expect(createdJob.timezone).toBe(jobData.timezone);

    // Site contact
    expect(createdJob.siteContactName).toBe(jobData.siteContactName);
    expect(createdJob.siteContactNumber).toBe(jobData.siteContactNumber);

    // Site access & requirements
    expect(createdJob.accessInstructions).toBe(jobData.accessInstructions);
    expect(createdJob.specialRequirements).toBe(jobData.specialRequirements);
    expect(createdJob.equipmentNeeded).toBe(jobData.equipmentNeeded);

    // Scheduling
    expect(createdJob.scheduledDateTime).toBeInstanceOf(Date);

    // Project/Ticket info
    expect(createdJob.projectName).toBe(jobData.projectName);
    expect(createdJob.changeNumber).toBe(jobData.changeNumber);
    expect(createdJob.incidentNumber).toBe(jobData.incidentNumber);

    // Communication
    expect(createdJob.videoConferenceLink).toBe(jobData.videoConferenceLink);
    expect(createdJob.notes).toBe(jobData.notes);

    // Pricing
    expect(createdJob.calculatedPrice).toBe(jobData.calculatedPrice);
    expect(createdJob.currency).toBe(jobData.currency);
    expect(createdJob.isOutOfHours).toBe(0); // Stored as int

    // Status
    expect(createdJob.status).toBe("pending_supplier_acceptance");

    console.log("✅ All FSM fields verified successfully!");
  });

  it("should create a job with minimal required fields (optional FSM fields omitted)", async () => {
    const minimalJobData = {
      // Required fields only
      jobToken: `TEST-${Date.now()}-MINIMAL`,
      customerName: "Minimal Test",
      customerEmail: "minimal@example.com",
      customerPhone: "+1-555-0000",
      serviceType: "L1_NETWORK",
      siteAddress: "456 Simple St, New York, NY 10001",
      city: "New York",
      country: "US",
      siteLatitude: "40.7128",
      siteLongitude: "-74.0060",
      scheduledDateTime: new Date("2025-01-20T14:00:00-05:00").toISOString(),
      estimatedDuration: 120, // 2 hours minimum
      calculatedPrice: 20000, // $200.00
      currency: "USD",
      isOutOfHours: false,
    };

    const result = await caller.jobs.create(minimalJobData);

    expect(result.success).toBe(true);
    expect(result.jobId).toBeGreaterThan(0);

    // Verify optional fields are null/undefined
    const { getDb } = await import("./db");
    const { jobs } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    
    if (!db) throw new Error("Database not available");

    const [createdJob] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, result.jobId))
      .limit(1);

    expect(createdJob.siteName).toBeNull();
    expect(createdJob.siteState).toBeNull();
    expect(createdJob.siteContactName).toBeNull();
    expect(createdJob.accessInstructions).toBeNull();
    expect(createdJob.projectName).toBeNull();
    expect(createdJob.videoConferenceLink).toBeNull();

    console.log("✅ Minimal job creation verified successfully!");
  });
});
