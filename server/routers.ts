import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  supplier: router({
    // Get current supplier profile for logged-in user
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      const { getSupplierByUserId } = await import("./db");
      return await getSupplierByUserId(ctx.user.id);
    }),

    // Create supplier company profile
    createProfile: protectedProcedure
      .input(
        z.object({
          companyName: z.string().min(1),
          contactEmail: z.string().email(),
          contactPhone: z.string().optional(),
          address: z.string().optional(),
          city: z.string().optional(),
          country: z.string().length(2),
          taxId: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { createSupplier, linkUserToSupplier } = await import("./db");
        
        // Create supplier company
        const supplierId = await createSupplier({
          companyName: input.companyName,
          contactEmail: input.contactEmail,
          contactPhone: input.contactPhone,
          address: input.address,
          city: input.city,
          country: input.country,
          taxId: input.taxId,
        });
        
        // Link user to supplier as admin
        await linkUserToSupplier(ctx.user.id, supplierId, "supplier_admin");
        
        return { success: true, supplierId };
      }),

    // Update supplier profile
    updateProfile: protectedProcedure
      .input(
        z.object({
          supplierId: z.number(),
          companyName: z.string().min(1).optional(),
          contactEmail: z.string().email().optional(),
          contactPhone: z.string().optional(),
          address: z.string().optional(),
          city: z.string().optional(),
          country: z.string().length(2).optional(),
          taxId: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { updateSupplier } = await import("./db");
        const { supplierId, ...data } = input;
        await updateSupplier(supplierId, data);
        return { success: true };
      }),

    // Get supplier rates
    getRates: protectedProcedure
      .input(z.object({ supplierId: z.number() }))
      .query(async ({ input }) => {
        const { getSupplierRates } = await import("./db");
        return await getSupplierRates(input.supplierId);
      }),

    // Upsert supplier rate
    upsertRate: protectedProcedure
      .input(
        z.object({
          supplierId: z.number(),
          country: z.string().length(2),
          hourlyRate: z.number().min(0),
          currency: z.string().length(3),
        })
      )
      .mutation(async ({ input }) => {
        const { upsertSupplierRate } = await import("./db");
        await upsertSupplierRate(input);
        return { success: true };
      }),

    // Get supplier coverage areas
    getCoverage: protectedProcedure
      .input(z.object({ supplierId: z.number() }))
      .query(async ({ input }) => {
        const { getSupplierCoverage } = await import("./db");
        return await getSupplierCoverage(input.supplierId);
      }),

    // Create coverage area
    createCoverage: protectedProcedure
      .input(
        z.object({
          supplierId: z.number(),
          coverageType: z.enum(["postal_codes", "city_radius", "polygon"]),
          country: z.string().length(2),
          coverageData: z.string().optional(),
          radiusKm: z.number().optional(),
          centerLat: z.string().optional(),
          centerLng: z.string().optional(),
          geoJson: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { createSupplierCoverage } = await import("./db");
        await createSupplierCoverage(input);
        return { success: true };
      }),

    // Delete coverage area
    deleteCoverage: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteSupplierCoverage } = await import("./db");
        await deleteSupplierCoverage(input.id);
        return { success: true };
      }),
  }),

  jobs: router({
    // Calculate price for a job request
    calculatePrice: publicProcedure
      .input(
        z.object({
          country: z.string().length(2),
          latitude: z.string(),
          longitude: z.string(),
          scheduledStart: z.string(),
          estimatedDuration: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        const { calculateJobPrice } = await import("./pricing");
        const pricing = await calculateJobPrice({
          ...input,
          scheduledStart: new Date(input.scheduledStart),
        });

        if (!pricing) {
          throw new Error("No suppliers available for this location");
        }

        return pricing;
      }),

    // Create a new job request
    create: publicProcedure
      .input(
        z.object({
          customerName: z.string(),
          customerEmail: z.string().email(),
          customerPhone: z.string(),
          serviceType: z.string(),
          description: z.string().optional(),
          address: z.string(),
          city: z.string(),
          country: z.string().length(2),
          postalCode: z.string().optional(),
          latitude: z.string(),
          longitude: z.string(),
          scheduledStart: z.string(),
          estimatedDuration: z.number(),
          calculatedPrice: z.number(),
          currency: z.string().length(3),
          isOutOfHours: z.boolean(),
        })
      )
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { jobs } = await import("../drizzle/schema");
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const [result] = await db.insert(jobs).values({
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          serviceType: input.serviceType,
          description: input.description,
          address: input.address,
          city: input.city,
          country: input.country,
          postalCode: input.postalCode,
          latitude: input.latitude,
          longitude: input.longitude,
          scheduledStart: new Date(input.scheduledStart),
          estimatedDuration: input.estimatedDuration,
          calculatedPrice: input.calculatedPrice,
          currency: input.currency,
          isOutOfHours: input.isOutOfHours ? 1 : 0,
          status: "pending_supplier_acceptance",
        });

        const jobId = Number(result.insertId);
        return { success: true, jobId };
      }),

    // Get job by ID
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { jobs } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) return null;

        const result = await db.select().from(jobs).where(eq(jobs.id, input.id)).limit(1);
        return result.length > 0 ? result[0] : null;
      }),

    // Get available jobs for supplier (in their coverage area)
    getAvailableForSupplier: protectedProcedure
      .query(async ({ ctx }) => {
        const { getSupplierByUserId } = await import("./db");
        const { getDb } = await import("./db");
        const { jobs } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const supplier = await getSupplierByUserId(ctx.user.id);
        if (!supplier) return [];

        const db = await getDb();
        if (!db) return [];

        // Get jobs that are pending acceptance in supplier's country
        // TODO: Filter by geographic coverage
        const availableJobs = await db
          .select()
          .from(jobs)
          .where(eq(jobs.status, "pending_supplier_acceptance"))
          .limit(20);

        return availableJobs;
      }),

    // Accept a job
    accept: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getSupplierByUserId } = await import("./db");
        const { getDb } = await import("./db");
        const { jobs } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        const supplier = await getSupplierByUserId(ctx.user.id);
        if (!supplier) {
          throw new Error("Supplier profile not found");
        }

        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Check if job is still available
        const [job] = await db
          .select()
          .from(jobs)
          .where(eq(jobs.id, input.jobId))
          .limit(1);

        if (!job) {
          throw new Error("Job not found");
        }

        if (job.status !== "pending_supplier_acceptance") {
          throw new Error("Job is no longer available");
        }

        // Assign job to supplier
        await db
          .update(jobs)
          .set({
            assignedSupplierId: supplier.supplier.id,
            status: "assigned_to_supplier",
            acceptedAt: new Date(),
          })
          .where(eq(jobs.id, input.jobId));

        return { success: true };
      }),

    // Get supplier's jobs
    getSupplierJobs: protectedProcedure
      .query(async ({ ctx }) => {
        const { getSupplierByUserId } = await import("./db");
        const { getDb } = await import("./db");
        const { jobs } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        const supplier = await getSupplierByUserId(ctx.user.id);
        if (!supplier) return [];

        const db = await getDb();
        if (!db) return [];

        const supplierJobs = await db
          .select()
          .from(jobs)
          .where(eq(jobs.assignedSupplierId, supplier.supplier.id));

        return supplierJobs;
      }),

    // Update job status
    updateStatus: protectedProcedure
      .input(
        z.object({
          jobId: z.number(),
          status: z.enum(["assigned_to_supplier", "en_route", "on_site", "completed"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { getSupplierByUserId } = await import("./db");
        const { getDb } = await import("./db");
        const { jobs } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");

        const supplier = await getSupplierByUserId(ctx.user.id);
        if (!supplier) {
          throw new Error("Supplier profile not found");
        }

        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Verify the job belongs to this supplier
        const [job] = await db
          .select()
          .from(jobs)
          .where(
            and(
              eq(jobs.id, input.jobId),
              eq(jobs.assignedSupplierId, supplier.supplier.id)
            )
          )
          .limit(1);

        if (!job) {
          throw new Error("Job not found or not assigned to you");
        }

        // Update status
        const updateData: any = { status: input.status };
        if (input.status === "completed") {
          updateData.completedAt = new Date();
        }

        await db
          .update(jobs)
          .set(updateData)
          .where(eq(jobs.id, input.jobId));

        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
