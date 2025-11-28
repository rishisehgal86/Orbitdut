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
});

export type AppRouter = typeof appRouter;
