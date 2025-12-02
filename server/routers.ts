import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    signup: publicProcedure
      .input(
        z.object({
          name: z.string().min(1),
          email: z.string().email(),
          password: z.string().min(8),
          accountType: z.enum(["customer", "supplier"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { hashPassword, createToken } = await import("./auth");
        const { getDb } = await import("./db");
        const { users } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Check if user already exists
        const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
        if (existing.length > 0) {
          throw new Error("Email already registered");
        }

        // Hash password
        const passwordHash = await hashPassword(input.password);

        // Create user
        const result = await db.insert(users).values({
          name: input.name,
          email: input.email,
          passwordHash,
          accountType: input.accountType,
          loginMethod: "local",
          lastSignedIn: new Date(),
        });

        const userId = Number((result as any).insertId);

        // Create JWT token
        const token = await createToken({
          userId,
          email: input.email,
          accountType: input.accountType,
        });

        // Set cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return {
          success: true,
          user: {
            id: userId,
            name: input.name,
            email: input.email,
            accountType: input.accountType,
          },
        };
      }),

    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { verifyPassword, createToken } = await import("./auth");
        const { getDb } = await import("./db");
        const { users } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Find user by email
        const result = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
        if (result.length === 0) {
          throw new Error("Invalid email or password");
        }

        const user = result[0];

        // Verify password
        if (!user.passwordHash) {
          throw new Error("Invalid account - no password set");
        }

        const isValid = await verifyPassword(input.password, user.passwordHash);
        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        // Update last signed in
        await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));

        // Create JWT token
        const token = await createToken({
          userId: user.id,
          email: user.email,
          accountType: user.accountType,
        });

        // Set cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return {
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            accountType: user.accountType,
          },
        };
      }),

    // Request password reset - generates token and sends email
    requestPasswordReset: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { users, passwordResetTokens } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { sendPasswordResetEmail } = await import("./_core/email");
        const crypto = await import("crypto");

        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Find user by email
        const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
        
        // Always return success to prevent email enumeration
        if (!user) {
          return { success: true, message: "If an account exists, a reset email has been sent" };
        }

        // Generate secure random token
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Delete any existing tokens for this user
        await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));

        // Store token
        await db.insert(passwordResetTokens).values({
          userId: user.id,
          token,
          expiresAt,
        });

        // Send email
        await sendPasswordResetEmail(user.email, user.name || "User", token);

        return { success: true, message: "If an account exists, a reset email has been sent" };
      }),

    // Reset password using token
    resetPassword: publicProcedure
      .input(
        z.object({
          token: z.string(),
          newPassword: z.string().min(8),
        })
      )
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { users, passwordResetTokens } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { hashPassword } = await import("./auth");

        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Find token
        const [resetToken] = await db
          .select()
          .from(passwordResetTokens)
          .where(eq(passwordResetTokens.token, input.token))
          .limit(1);

        if (!resetToken) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid or expired reset token",
          });
        }

        // Check if token is expired
        if (new Date() > new Date(resetToken.expiresAt)) {
          await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, resetToken.id));
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Reset token has expired",
          });
        }

        // Hash new password
        const passwordHash = await hashPassword(input.newPassword);

        // Update user password
        await db.update(users).set({ passwordHash }).where(eq(users.id, resetToken.userId));

        // Delete used token
        await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, resetToken.id));

        return { success: true, message: "Password reset successfully" };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  user: router({    // Update user profile
    updateProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).optional(),
          email: z.string().email().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const { users } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Check if email is already taken by another user
        if (input.email) {
          const existing = await db
            .select()
            .from(users)
            .where(eq(users.email, input.email))
            .limit(1);
          if (existing.length > 0 && existing[0].id !== ctx.user.id) {
            throw new Error("Email already in use");
          }
        }

        // Update user
        await db
          .update(users)
          .set({
            ...input,
            updatedAt: new Date(),
          })
          .where(eq(users.id, ctx.user.id));

        return { success: true };
      }),

    // Change password
    changePassword: protectedProcedure
      .input(
        z.object({
          currentPassword: z.string(),
          newPassword: z.string().min(8),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { hashPassword, verifyPassword } = await import("./auth");
        const { getDb } = await import("./db");
        const { users } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Get current user
        const result = await db
          .select()
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1);
        if (result.length === 0) {
          throw new Error("User not found");
        }

        const user = result[0];

        // Verify current password
        if (!user.passwordHash) {
          throw new Error("No password set for this account");
        }

        const isValid = await verifyPassword(input.currentPassword, user.passwordHash);
        if (!isValid) {
          throw new Error("Current password is incorrect");
        }

        // Hash new password
        const newPasswordHash = await hashPassword(input.newPassword);

        // Update password
        await db
          .update(users)
          .set({
            passwordHash: newPasswordHash,
            updatedAt: new Date(),
          })
          .where(eq(users.id, ctx.user.id));

        return { success: true };
      }),

    // Get user preferences
    getPreferences: protectedProcedure.query(async ({ ctx }) => {
      const { getDb } = await import("./db");
      const { userPreferences } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Get or create preferences
      let prefs = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, ctx.user.id))
        .limit(1);

      if (prefs.length === 0) {
        // Create default preferences
        await db.insert(userPreferences).values({
          userId: ctx.user.id,
        });
        prefs = await db
          .select()
          .from(userPreferences)
          .where(eq(userPreferences.userId, ctx.user.id))
          .limit(1);
      }

      return prefs[0];
    }),

    // Update user preferences
    updatePreferences: protectedProcedure
      .input(
        z.object({
          emailNotifications: z.number().min(0).max(1).optional(),
          jobStatusUpdates: z.number().min(0).max(1).optional(),
          supplierMessages: z.number().min(0).max(1).optional(),
          timezone: z.string().optional(),
          language: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const { userPreferences } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Check if preferences exist
        const existing = await db
          .select()
          .from(userPreferences)
          .where(eq(userPreferences.userId, ctx.user.id))
          .limit(1);

        if (existing.length === 0) {
          // Create new preferences
          await db.insert(userPreferences).values({
            userId: ctx.user.id,
            ...input,
          });
        } else {
          // Update existing preferences
          await db
            .update(userPreferences)
            .set({
              ...input,
              updatedAt: new Date(),
            })
            .where(eq(userPreferences.userId, ctx.user.id));
        }

        return { success: true };
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
      .mutation(async ({ ctx, input }) => {
        const { updateSupplier } = await import("./db");
        const { supplierId, ...data } = input;
        await updateSupplier(supplierId, ctx.user.id, data);
        return { success: true };
      }),

    // ========== NEW RATE MANAGEMENT SYSTEM ==========
    
    // Get all rates for a supplier
    getRates: protectedProcedure
      .input(z.object({ supplierId: z.number() }))
      .query(async ({ input }) => {
        const { getSupplierRates } = await import("./rates");
        return await getSupplierRates(input.supplierId);
      }),

    // Upsert a single rate
    upsertRate: protectedProcedure
      .input(
        z.object({
          supplierId: z.number(),
          countryCode: z.string().length(2).optional(),
          cityId: z.number().optional(),
          serviceType: z.string(),
          responseTimeHours: z.number(),
          rateUsdCents: z.number().nullable(),
        })
      )
      .mutation(async ({ input }) => {
        const { upsertRate } = await import("./rates");
        await upsertRate(input);
        return { success: true };
      }),

    // Bulk upsert rates (for "Apply to All" functionality)
    bulkUpsertRates: protectedProcedure
      .input(
        z.object({
          rates: z.array(
            z.object({
              supplierId: z.number(),
              countryCode: z.string().length(2).optional(),
              cityId: z.number().optional(),
              serviceType: z.string(),
              responseTimeHours: z.number(),
              rateUsdCents: z.number().nullable(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        const { bulkUpsertRates } = await import("./rates");
        await bulkUpsertRates(input.rates);
        return { success: true };
      }),

    // Get rate completion statistics
    getRateCompletionStats: protectedProcedure
      .input(z.object({ supplierId: z.number() }))
      .query(async ({ input }) => {
        const { getRateCompletionStats } = await import("./rates");
        return await getRateCompletionStats(input.supplierId);
      }),

    // Clean up orphaned rates (manual cleanup script)
    cleanupOrphanedRates: protectedProcedure
      .input(z.object({ supplierId: z.number() }))
      .mutation(async ({ input }) => {
        const { cleanupOrphanedRates } = await import("./rates");
        const deletedCount = await cleanupOrphanedRates(input.supplierId);
        return { success: true, deletedCount };
      }),

    // Download Excel template with current rates
    downloadExcelTemplate: protectedProcedure
      .input(z.object({ supplierId: z.number() }))
      .query(async ({ input }) => {
        const { generateExcelTemplate } = await import("./excelTemplate");
        return await generateExcelTemplate(input.supplierId);
      }),

    // Parse and validate uploaded Excel file
    parseExcelFile: protectedProcedure
      .input(z.object({ 
        supplierId: z.number(),
        fileData: z.string() // base64 encoded Excel file
      }))
      .mutation(async ({ input }) => {
        try {
          console.log('[parseExcelFile] Starting parse for supplier:', input.supplierId);
          const { parseExcelFile } = await import("./excelImport");
          const result = await parseExcelFile(input.fileData);
          console.log('[parseExcelFile] Parse complete, returning result');
          return result;
        } catch (error: any) {
          console.error('[parseExcelFile] Error:', error);
          throw new TRPCError({ 
            code: 'INTERNAL_SERVER_ERROR', 
            message: error.message || 'Failed to parse Excel file' 
          });
        }
      }),

    // Import rates from parsed Excel data
    importRatesFromExcel: protectedProcedure
      .input(z.object({
        supplierId: z.number(),
        rates: z.array(z.object({
          serviceType: z.string(),
          locationType: z.enum(["country", "city"]),
          countryCode: z.string().optional(),
          cityId: z.number().optional(),
          cityName: z.string().optional(),
          responseTimeHours: z.number(),
          rateUsd: z.number(),
          rowNumber: z.number(),
        }))
      }))
      .mutation(async ({ input }) => {
        const { bulkUpsertRates } = await import("./db");
        const { dollarsToCents } = await import("../shared/rates");
        const db = await import("./db").then(m => m.getDb());
        
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        }

        // Convert parsed rates to database format
        const ratesToInsert = [];
        
        for (const rate of input.rates) {
          // For city rates, look up cityId from supplier_priority_cities
          let cityId = rate.cityId;
          
          if (rate.locationType === "city" && rate.cityName && rate.countryCode) {
            const { supplierPriorityCities } = await import("../drizzle/schema");
            const { eq, and } = await import("drizzle-orm");
            
            const city = await db
              .select()
              .from(supplierPriorityCities)
              .where(
                and(
                  eq(supplierPriorityCities.supplierId, input.supplierId),
                  eq(supplierPriorityCities.cityName, rate.cityName),
                  eq(supplierPriorityCities.countryCode, rate.countryCode)
                )
              )
              .limit(1);
            
            if (city.length === 0) {
              // Skip rates for cities not in supplier's priority cities
              continue;
            }
            
            cityId = city[0].id;
          }

          ratesToInsert.push({
            supplierId: input.supplierId,
            serviceType: rate.serviceType,
            responseTimeHours: rate.responseTimeHours,
            countryCode: rate.locationType === "country" ? rate.countryCode : null,
            cityId: rate.locationType === "city" ? cityId : null,
            rateUsdCents: dollarsToCents(rate.rateUsd),
          });
        }

        // Bulk upsert rates
        await bulkUpsertRates(input.supplierId, ratesToInsert as any);
        
        return { 
          success: true, 
          imported: ratesToInsert.length,
          skipped: input.rates.length - ratesToInsert.length 
        };
      }),

    // ========== SERVICE EXCLUSIONS ==========
    
    // Get all service exclusions for a supplier
    getServiceExclusions: protectedProcedure
      .input(z.object({ supplierId: z.number() }))
      .query(async ({ input }) => {
        const { getServiceExclusions } = await import("./serviceExclusions");
        return await getServiceExclusions(input.supplierId);
      }),

    // Add a single service exclusion
    addServiceExclusion: protectedProcedure
      .input(
        z.object({
          supplierId: z.number(),
          countryCode: z.string().length(2).optional(),
          cityId: z.number().optional(),
          serviceType: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { addServiceExclusion } = await import("./serviceExclusions");
        await addServiceExclusion(input);
        
        // Automatic cleanup: Remove orphaned rates after service exclusion
        const { cleanupOrphanedRates } = await import("./rates");
        await cleanupOrphanedRates(input.supplierId);
        
        return { success: true };
      }),

    // Remove a service exclusion
    removeServiceExclusion: protectedProcedure
      .input(z.object({ id: z.number(), supplierId: z.number() }))
      .mutation(async ({ input }) => {
        const { removeServiceExclusion } = await import("./serviceExclusions");
        await removeServiceExclusion(input.id, input.supplierId);
        return { success: true };
      }),

    // Bulk add service exclusions
    bulkAddServiceExclusions: protectedProcedure
      .input(
        z.object({
          supplierId: z.number(),
          exclusions: z.array(
            z.object({
              supplierId: z.number(),
              countryCode: z.string().length(2).optional(),
              cityId: z.number().optional(),
              serviceType: z.string(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        const { bulkAddServiceExclusions, syncRatesWithAvailability } = await import("./serviceExclusions");
        await bulkAddServiceExclusions(input.exclusions);
        
        // Sync rates: mark excluded services as unavailable (isServiceable = 0)
        for (const exclusion of input.exclusions) {
          await syncRatesWithAvailability(
            exclusion.supplierId,
            { countryCode: exclusion.countryCode, cityId: exclusion.cityId },
            exclusion.serviceType,
            false // not available
          );
        }
        
        return { success: true };
      }),

    // Bulk sync all rates with current service availability
    bulkSyncRatesWithAvailability: protectedProcedure
      .input(
        z.object({
          supplierId: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        const { bulkSyncAllRatesWithAvailability } = await import("./serviceExclusions");
        await bulkSyncAllRatesWithAvailability(input.supplierId);
        return { success: true };
      }),

    // Bulk remove service exclusions
    bulkRemoveServiceExclusions: protectedProcedure
      .input(
        z.object({
          supplierId: z.number(),
          exclusions: z.array(
            z.object({
              supplierId: z.number(),
              countryCode: z.string().length(2).optional(),
              cityId: z.number().optional(),
              serviceType: z.string(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        const { bulkRemoveServiceExclusions, syncRatesWithAvailability } = await import("./serviceExclusions");
        
        // Remove each exclusion
        for (const exclusion of input.exclusions) {
          await bulkRemoveServiceExclusions(exclusion.supplierId, {
            countryCode: exclusion.countryCode,
            cityId: exclusion.cityId,
            serviceType: exclusion.serviceType,
          });
          
          // Sync rates: mark re-enabled services as available (isServiceable = 1)
          await syncRatesWithAvailability(
            exclusion.supplierId,
            { countryCode: exclusion.countryCode, cityId: exclusion.cityId },
            exclusion.serviceType,
            true // now available
          );
        }
        
        return { success: true };
      }),

    // Response time exclusions - granular control at response time level
    addResponseTimeExclusion: protectedProcedure
      .input(
        z.object({
          supplierId: z.number(),
          countryCode: z.string().length(2).optional(),
          cityId: z.number().optional(),
          serviceType: z.string(),
          responseTimeHours: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        const { addResponseTimeExclusion } = await import("./responseTimeExclusions");
        await addResponseTimeExclusion(input);
        
        // Automatic cleanup: Remove orphaned rates after response time exclusion
        const { cleanupOrphanedRates } = await import("./rates");
        await cleanupOrphanedRates(input.supplierId);
        
        return { success: true };
      }),

    removeResponseTimeExclusion: protectedProcedure
      .input(
        z.object({
          supplierId: z.number(),
          countryCode: z.string().length(2).optional(),
          cityId: z.number().optional(),
          serviceType: z.string(),
          responseTimeHours: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        const { removeResponseTimeExclusion } = await import("./responseTimeExclusions");
        await removeResponseTimeExclusion(input);
        return { success: true };
      }),

    getResponseTimeExclusions: protectedProcedure
      .input(z.object({ supplierId: z.number() }))
      .query(async ({ input }) => {
        const { getResponseTimeExclusions } = await import("./responseTimeExclusions");
        return await getResponseTimeExclusions(input.supplierId);
      }),

    // Note: Old upsertRate procedure removed - replaced by new rate management system in server/rates.ts

    // Tier 1: Country Coverage
    getCountries: protectedProcedure
      .input(z.object({ supplierId: z.number() }))
      .query(async ({ input }) => {
        const { getSupplierCountries } = await import("./db");
        return await getSupplierCountries(input.supplierId);
      }),

    updateCountries: protectedProcedure
      .input(
        z.object({
          supplierId: z.number(),
          countryCodes: z.array(z.string()),
          isExcluded: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { upsertSupplierCountries } = await import("./db");
        await upsertSupplierCountries(input.supplierId, input.countryCodes, input.isExcluded);
        
        // Automatic cleanup: Remove orphaned rates after coverage change
        const { cleanupOrphanedRates } = await import("./rates");
        await cleanupOrphanedRates(input.supplierId);
        
        return { success: true };
      }),

    // Tier 2: Priority Cities
    getPriorityCities: protectedProcedure
      .input(z.object({ supplierId: z.number() }))
      .query(async ({ input }) => {
        const { getSupplierPriorityCities } = await import("./db");
        return await getSupplierPriorityCities(input.supplierId);
      }),

    addPriorityCity: protectedProcedure
      .input(
        z.object({
          supplierId: z.number(),
          countryCode: z.string(),
          cityName: z.string(),
          stateProvince: z.string().optional(),
          placeId: z.string().optional(),
          formattedAddress: z.string().optional(),
          latitude: z.number().optional(),
          longitude: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { addSupplierPriorityCity } = await import("./db");
        await addSupplierPriorityCity(input);
        return { success: true };
      }),

    deletePriorityCity: protectedProcedure
      .input(z.object({ id: z.number(), supplierId: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteSupplierPriorityCity } = await import("./db");
        await deleteSupplierPriorityCity(input.id, input.supplierId);
        
        // Automatic cleanup: Remove orphaned rates after city removal
        const { cleanupOrphanedRates } = await import("./rates");
        await cleanupOrphanedRates(input.supplierId);
        
        return { success: true };
      }),

    // Tier 4: Response Times
    getResponseTimes: protectedProcedure
      .input(z.object({ supplierId: z.number() }))
      .query(async ({ input }) => {
        const { getSupplierResponseTimes } = await import("./db");
        return await getSupplierResponseTimes(input.supplierId);
      }),

    updateResponseTime: protectedProcedure
      .input(
        z.object({
          supplierId: z.number(),
          countryCode: z.string().nullable(),
          cityName: z.string().nullable().optional(),
          responseTimeHours: z.number(),
          isDefault: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { upsertSupplierResponseTime } = await import("./db");
        await upsertSupplierResponseTime(input);
        return { success: true };
      }),

    deleteResponseTime: protectedProcedure
      .input(z.object({ id: z.number(), supplierId: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteSupplierResponseTime } = await import("./db");
        await deleteSupplierResponseTime(input.id, input.supplierId);
        return { success: true };
      }),
  }),

  jobs: router({
    // Note: Old calculatePrice procedure removed - pricing logic needs to be reimplemented

    // Create a new job request
    create: protectedProcedure
      .input(
        z.object({
          // Basic job info
          jobToken: z.string(),
          customerName: z.string(),
          customerEmail: z.string().email(),
          customerPhone: z.string(),
          
          // Service details
          serviceType: z.string(),
          description: z.string().optional(),
          estimatedDuration: z.number().min(120, "Duration must be at least 2 hours (120 minutes)").max(960, "Duration must not exceed 16 hours (960 minutes)"),
          bookingType: z.enum(["full_day", "hourly", "multi_day"]).optional(),
          downTime: z.boolean().optional(),
          
          // Site location
          siteName: z.string().optional(),
          siteAddress: z.string(),
          city: z.string(),
          siteState: z.string().optional(),
          country: z.string().length(2),
          postalCode: z.string().optional(),
          siteLatitude: z.string(),
          siteLongitude: z.string(),
          timezone: z.string().optional(),
          
          // Site contact
          siteContactName: z.string().optional(),
          siteContactNumber: z.string().optional(),
          
          // Site access & requirements
          accessInstructions: z.string().optional(),
          specialRequirements: z.string().optional(),
          equipmentNeeded: z.string().optional(),
          
          // Scheduling
          scheduledDateTime: z.string(),
          
          // Project/Ticket info
          projectName: z.string().optional(),
          changeNumber: z.string().optional(),
          incidentNumber: z.string().optional(),
          
          // Communication
          videoConferenceLink: z.string().optional(),
          notes: z.string().optional(),
          
          // Pricing
          calculatedPrice: z.number(),
          currency: z.string().length(3),
          isOutOfHours: z.boolean(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { jobs } = await import("../drizzle/schema");
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const [result] = await db.insert(jobs).values({
          // Basic job info
          jobToken: input.jobToken,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          
          // Service details
          serviceType: input.serviceType,
          description: input.description,
          estimatedDuration: input.estimatedDuration,
          bookingType: input.bookingType,
          downTime: input.downTime,
          
          // Site location
          siteName: input.siteName,
          siteAddress: input.siteAddress,
          city: input.city,
          siteState: input.siteState,
          country: input.country,
          postalCode: input.postalCode,
          siteLatitude: input.siteLatitude,
          siteLongitude: input.siteLongitude,
          timezone: input.timezone,
          
          // Site contact
          siteContactName: input.siteContactName,
          siteContactNumber: input.siteContactNumber,
          
          // Site access & requirements
          accessInstructions: input.accessInstructions,
          specialRequirements: input.specialRequirements,
          equipmentNeeded: input.equipmentNeeded,
          
          // Scheduling
          scheduledDateTime: new Date(input.scheduledDateTime),
          
          // Project/Ticket info
          projectName: input.projectName,
          changeNumber: input.changeNumber,
          incidentNumber: input.incidentNumber,
          
          // Communication
          videoConferenceLink: input.videoConferenceLink,
          notes: input.notes,
          
          // Pricing
          calculatedPrice: input.calculatedPrice,
          currency: input.currency,
          isOutOfHours: input.isOutOfHours ? 1 : 0,
          status: "pending_supplier_acceptance",
          
          // Link to customer user
          customerId: ctx.user.id,
        });

        const jobId = Number(result.insertId);
        return { success: true, jobId };
      }),

    // Get job by ID (only if user is customer or assigned supplier)
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const { getDb, getSupplierByUserId } = await import("./db");
        const { jobs } = await import("../drizzle/schema");
        const { eq, or, and } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) return null;

        // Get supplier if user is a supplier
        const supplier = await getSupplierByUserId(ctx.user.id);
        
        // User can only see jobs they created or jobs assigned to their supplier
        const conditions = [
          eq(jobs.customerId, ctx.user.id), // User is the customer
        ];
        
        if (supplier) {
          conditions.push(eq(jobs.assignedSupplierId, supplier.supplier.id)); // User's supplier is assigned
        }

        const result = await db
          .select()
          .from(jobs)
          .where(
            and(
              eq(jobs.id, input.id),
              or(...conditions)
            )
          )
          .limit(1);
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

        // Send email notification to customer
        if (job.customerId) {
          const { users } = await import("../drizzle/schema");
          const [customer] = await db
            .select()
            .from(users)
            .where(eq(users.id, job.customerId))
            .limit(1);

          if (customer) {
            const { sendJobStatusEmail } = await import("./_core/email");
            // Fire and forget - don't wait for email
            sendJobStatusEmail(
              customer.email,
              customer.name,
              job.id,
              job.serviceType,
              "pending_supplier_acceptance",
              "assigned_to_supplier"
            ).catch((error) => {
              console.error("Failed to send job acceptance email:", error);
            });
          }
        }

        return { success: true };
      }),

    // Get supplier's jobs
    getSupplierJobs: protectedProcedure
      .query(async ({ ctx }) => {
        const { getSupplierByUserId } = await import("./db");
        const { getDb } = await import("./db");
        const { jobs } = await import("../drizzle/schema");
        const { eq, and, ne } = await import("drizzle-orm");

        const supplier = await getSupplierByUserId(ctx.user.id);
        if (!supplier) return [];

        const db = await getDb();
        if (!db) return [];

        // Get jobs assigned to this supplier, excluding pending_supplier_acceptance
        // (those appear in Available Jobs tab)
        const supplierJobs = await db
          .select()
          .from(jobs)
          .where(
            and(
              eq(jobs.assignedSupplierId, supplier.supplier.id),
              ne(jobs.status, 'pending_supplier_acceptance')
            )
          );

        return supplierJobs;
      }),

    // Update job status
    updateStatus: protectedProcedure
      .input(
        z.object({
          jobId: z.number(),
          status: z.enum(["supplier_accepted", "sent_to_engineer", "engineer_accepted", "en_route", "on_site", "completed"]),
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

        // Update status with automatic timestamp tracking
        const oldStatus = job.status;
        const updateData: any = { status: input.status };
        
        // Set timestamps based on status
        const now = new Date();
        if (input.status === "en_route") {
          updateData.enRouteAt = now;
        } else if (input.status === "on_site") {
          updateData.arrivedAt = now;
        } else if (input.status === "completed") {
          updateData.completedAt = now;
        }

        await db
          .update(jobs)
          .set(updateData)
          .where(eq(jobs.id, input.jobId));

        // Send email notification to customer
        if (job.customerId) {
          const { users } = await import("../drizzle/schema");
          const [customer] = await db
            .select()
            .from(users)
            .where(eq(users.id, job.customerId))
            .limit(1);

          if (customer) {
            const { sendJobStatusEmail } = await import("./_core/email");
            // Fire and forget - don't wait for email
            sendJobStatusEmail(
              customer.email,
              customer.name,
              job.id,
              job.serviceType,
              oldStatus,
              input.status
            ).catch((error) => {
              console.error("Failed to send job status email:", error);
            });
          }
        }

        return { success: true };
      }),

    // Accept available job
    acceptJob: protectedProcedure
      .input(z.object({
        jobId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getJobById, addJobStatusHistory, updateJob, getSupplierByUserId } = await import("./db");

        const job = await getJobById(input.jobId);
        if (!job) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });
        }

        // Verify job is available for acceptance
        if (job.status !== 'pending_supplier_acceptance') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Job is not available for acceptance' });
        }

        // Get supplier info
        const supplier = await getSupplierByUserId(ctx.user.id);
        if (!supplier) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'You must be a supplier to accept jobs' });
        }

        // Update job status and assign to supplier
        await updateJob(job.id, {
          status: 'supplier_accepted',
          assignedSupplierId: supplier.supplier.id,
        });

        await addJobStatusHistory({
          jobId: job.id,
          status: 'supplier_accepted',
          notes: `Job accepted by ${supplier.supplier.companyName}`,
        });

        return { success: true };
      }),

    // Assign engineer to job
    assignEngineer: protectedProcedure
      .input(z.object({
        jobId: z.number(),
        engineerName: z.string(),
        engineerEmail: z.string().email(),
        engineerPhone: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getJobById, addJobStatusHistory, updateJob } = await import("./db");
        const { sendJobAssignmentNotification } = await import("./_core/email");
        const { randomBytes } = await import("crypto");

        const job = await getJobById(input.jobId);
        if (!job) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });
        }

        // Verify job has been accepted by supplier
        if (job.status !== 'supplier_accepted') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Job must be accepted before assigning an engineer' });
        }

        // Ensure only the assigned supplier can assign an engineer
        const { getSupplierByUserId } = await import("./db");
        const supplier = await getSupplierByUserId(ctx.user.id);
        if (!supplier || job.assignedSupplierId !== supplier.supplier.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'You are not authorized to assign this job' });
        }

        const engineerToken = randomBytes(32).toString('hex');

        await updateJob(job.id, {
          engineerName: input.engineerName,
          engineerEmail: input.engineerEmail,
          engineerPhone: input.engineerPhone,
          engineerToken: engineerToken,
          status: 'sent_to_engineer',
        });

        await addJobStatusHistory({
          jobId: job.id,
          status: 'sent_to_engineer',
          notes: `Assigned to engineer ${input.engineerName} (${input.engineerEmail})`,
        });

        // Send email to engineer
        const baseUrl = getBaseUrl(ctx.req);
        await sendJobAssignmentNotification({
          engineerEmail: input.engineerEmail,
          engineerName: input.engineerName,
          jobId: job.id,
          siteName: job.siteName || "Site",
          siteAddress: job.siteAddress,
          scheduledDateTime: job.scheduledDateTime,
          jobToken: engineerToken,
          baseUrl,
        });

        return { success: true, engineerToken };
      }),

    // Get timezone from coordinates using Google Maps API
    getTimezone: publicProcedure
      .input(z.object({
        latitude: z.union([z.number(), z.string().transform(Number)]),
        longitude: z.union([z.number(), z.string().transform(Number)]),
        timestamp: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const { makeRequest } = await import("./_core/map");
        
        // Use current timestamp if not provided
        const timestamp = input.timestamp || Math.floor(Date.now() / 1000);
        
        try {
          // Call Google Maps Timezone API
          const response: any = await makeRequest(
            "/maps/api/timezone/json",
            {
              location: `${input.latitude},${input.longitude}`,
              timestamp: timestamp.toString(),
            }
          );

          if (response.status === "OK") {
            return {
              timeZoneId: response.timeZoneId as string,
              timeZoneName: response.timeZoneName as string,
              rawOffset: response.rawOffset as number,
              dstOffset: response.dstOffset as number,
            };
          } else {
            throw new Error(`Timezone API error: ${response.status}`);
          }
        } catch (error) {
          console.error("Error fetching timezone:", error);
          // Fallback to UTC if API fails
          return {
            timeZoneId: "UTC",
            timeZoneName: "Coordinated Universal Time",
            rawOffset: 0,
            dstOffset: 0,
          };
        }
      }),

    // Get customer's jobs
    getCustomerJobs: protectedProcedure
      .query(async ({ ctx }) => {
        const { getDb } = await import("./db");
        const { jobs } = await import("../drizzle/schema");
        const { eq, desc, or } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) return [];

        // Get jobs for this customer (by user ID or email)
        // This handles cases where jobs were created before user logged in
        const customerJobs = await db
          .select()
          .from(jobs)
          .where(
            or(
              eq(jobs.customerId, ctx.user.id),
              eq(jobs.customerEmail, ctx.user.email)
            )
          )
          .orderBy(desc(jobs.createdAt));

        return customerJobs;
      }),

    // Get job by engineer token (no auth required)
    getByEngineerToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const { getJobByEngineerToken } = await import("./db");
        return await getJobByEngineerToken(input.token);
      }),

    // Update job status by engineer token (no auth required)
    updateStatusByToken: publicProcedure
      .input(z.object({
        token: z.string(),
        status: z.enum(["accepted", "declined", "en_route", "on_site", "completed"]),
      }))
      .mutation(async ({ input }) => {
        const { getJobByEngineerToken, updateJob, addJobStatusHistory } = await import("./db");
        const { getDb } = await import("./db");
        const { jobs } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        const job = await getJobByEngineerToken(input.token);
        if (!job) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });
        }

        // Update status with automatic timestamp tracking
        const updateData: any = { status: input.status };
        const now = new Date();
        
        if (input.status === "accepted") {
          updateData.acceptedAt = now;
        } else if (input.status === "en_route") {
          updateData.enRouteAt = now;
        } else if (input.status === "on_site") {
          updateData.arrivedAt = now;
        } else if (input.status === "completed") {
          updateData.completedAt = now;
        }

        await updateJob(job.id, updateData);

        // Add status history entry
        await addJobStatusHistory({
          jobId: job.id,
          status: input.status,
          notes: `Status updated by engineer via token`,
        });

        // Send email notification to customer
        if (job.customerId) {
          const db = await getDb();
          if (db) {
            const { users } = await import("../drizzle/schema");
            const [customer] = await db
              .select()
              .from(users)
              .where(eq(users.id, job.customerId))
              .limit(1);

            if (customer) {
              const { sendJobStatusEmail } = await import("./_core/email");
              sendJobStatusEmail(
                customer.email,
                customer.name || "Customer",
                job.id,
                job.serviceType,
                job.status,
                input.status
              ).catch((error) => {
                console.error("Failed to send job status email:", error);
              });
            }
          }
        }

        return { success: true };
      }),

    // Add GPS location by engineer token (no auth required)
    addLocationByToken: publicProcedure
      .input(z.object({
        token: z.string(),
        latitude: z.string(),
        longitude: z.string(),
        accuracy: z.string(),
        trackingType: z.enum(["milestone", "en_route", "on_site"]),
      }))
      .mutation(async ({ input }) => {
        const { getJobByEngineerToken } = await import("./db");
        const { getDb } = await import("./db");
        const { jobLocations } = await import("../drizzle/schema");

        const job = await getJobByEngineerToken(input.token);
        if (!job) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        }

        await db.insert(jobLocations).values({
          jobId: job.id,
          latitude: input.latitude,
          longitude: input.longitude,
          accuracy: input.accuracy,
          trackingType: input.trackingType,
          timestamp: new Date(),
        });

        return { success: true };
      }),

    // Get latest location for a job by token
    getLatestLocationByToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const { getJobByEngineerToken } = await import("./db");
        const { getDb } = await import("./db");
        const { jobLocations } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");

        const job = await getJobByEngineerToken(input.token);
        if (!job) return null;

        const db = await getDb();
        if (!db) return null;

        const [latestLocation] = await db
          .select()
          .from(jobLocations)
          .where(eq(jobLocations.jobId, job.id))
          .orderBy(desc(jobLocations.timestamp))
          .limit(1);

        return latestLocation || null;
      }),

    // Get latest location for a job by job ID (for customers)
    getLatestLocationByJobId: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .query(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { jobs, jobLocations } = await import("../drizzle/schema");
        const { eq, desc, and } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) return null;

        // Verify the job belongs to the current user (customer)
        const [job] = await db
          .select()
          .from(jobs)
          .where(and(
            eq(jobs.id, input.jobId),
            eq(jobs.customerId, ctx.user.id)
          ))
          .limit(1);

        if (!job) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }

        const [latestLocation] = await db
          .select()
          .from(jobLocations)
          .where(eq(jobLocations.jobId, input.jobId))
          .orderBy(desc(jobLocations.timestamp))
          .limit(1);

        return latestLocation || null;
      }),

    // Submit site visit report by engineer token (no auth required)
    submitSiteVisitReport: publicProcedure
      .input(z.object({
        token: z.string(),
        workCompleted: z.string(),
        findings: z.string().optional(),
        recommendations: z.string().optional(),
        customerName: z.string(),
        signatureDataUrl: z.string(),
        photos: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        const { getJobByEngineerToken } = await import("./db");
        const { getDb } = await import("./db");
        const { siteVisitReports, svrMediaFiles } = await import("../drizzle/schema");

        const job = await getJobByEngineerToken(input.token);
        if (!job) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        }

        // Create site visit report
        const [report] = await db.insert(siteVisitReports).values({
          jobId: job.id,
          workCompleted: input.workCompleted,
          findings: input.findings || null,
          recommendations: input.recommendations || null,
          customerName: input.customerName,
          customerSignature: input.signatureDataUrl,
          completedAt: new Date(),
        }).$returningId();

        // Save photos if provided
        if (input.photos && input.photos.length > 0) {
          for (const photoDataUrl of input.photos) {
            await db.insert(svrMediaFiles).values({
              reportId: report.id,
              fileType: 'photo',
              fileUrl: photoDataUrl,
              uploadedAt: new Date(),
            });
          }
        }

        return { success: true, reportId: report.id };
      }),

    // Get site visit report by job ID
    getSiteVisitReport: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .query(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { jobs, siteVisitReports, svrMediaFiles } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) return null;

        // Verify the job belongs to the current user (customer)
        const [job] = await db
          .select()
          .from(jobs)
          .where(and(
            eq(jobs.id, input.jobId),
            eq(jobs.customerId, ctx.user.id)
          ))
          .limit(1);

        if (!job) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }

        // Get the report
        const [report] = await db
          .select()
          .from(siteVisitReports)
          .where(eq(siteVisitReports.jobId, input.jobId))
          .limit(1);

        if (!report) return null;

        // Get media files
        const mediaFiles = await db
          .select()
          .from(svrMediaFiles)
          .where(eq(svrMediaFiles.reportId, report.id));

        return { ...report, mediaFiles };
      }),

    // Get job timeline with status history and GPS locations
    getJobTimeline: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const { jobs, jobStatusHistory, jobLocations } = await import("../drizzle/schema");
        const { eq, and, desc } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Verify user has access to this job
        const [job] = await db
          .select()
          .from(jobs)
          .where(eq(jobs.id, input.jobId))
          .limit(1);

        if (!job) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });
        }

        // Check access: customer or supplier
        const hasAccess = 
          job.customerId === ctx.user.id || 
          (job.assignedSupplierId && await (async () => {
            const { supplierUsers } = await import("../drizzle/schema");
            const [supplierUser] = await db
              .select()
              .from(supplierUsers)
              .where(and(
                eq(supplierUsers.userId, ctx.user.id),
                eq(supplierUsers.supplierId, job.assignedSupplierId!)
              ))
              .limit(1);
            return !!supplierUser;
          })());

        if (!hasAccess) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }

        // Get status history
        const statusHistory = await db
          .select()
          .from(jobStatusHistory)
          .where(eq(jobStatusHistory.jobId, input.jobId))
          .orderBy(jobStatusHistory.timestamp);

        // Get GPS locations for milestone events
        const locations = await db
          .select()
          .from(jobLocations)
          .where(and(
            eq(jobLocations.jobId, input.jobId),
            eq(jobLocations.trackingType, "milestone")
          ))
          .orderBy(jobLocations.timestamp);

        // Build timeline events with duration calculations
        const events = statusHistory.map((event, index) => {
          // Find matching GPS location
          const location = locations.find(loc => 
            Math.abs(new Date(loc.timestamp).getTime() - new Date(event.timestamp).getTime()) < 60000 // Within 1 minute
          );

          // Calculate duration in this status (time until next status change)
          let duration: number | undefined;
          if (index < statusHistory.length - 1) {
            const nextEvent = statusHistory[index + 1];
            const durationMs = new Date(nextEvent.timestamp).getTime() - new Date(event.timestamp).getTime();
            duration = Math.floor(durationMs / 60000); // Convert to minutes
          } else if (job.status === event.status) {
            // Still in this status - calculate duration until now
            const durationMs = Date.now() - new Date(event.timestamp).getTime();
            duration = Math.floor(durationMs / 60000);
          }

          return {
            id: event.id,
            status: event.status,
            timestamp: event.timestamp,
            notes: event.notes,
            latitude: location?.latitude,
            longitude: location?.longitude,
            duration,
          };
        });

        return { events, currentStatus: job.status };
      }),
  }),
});

export type AppRouter = typeof appRouter;
