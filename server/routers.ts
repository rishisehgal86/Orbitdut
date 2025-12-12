import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, superadminProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { users, jobs, siteVisitReports, svrMediaFiles } from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";

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
          // Supplier-specific fields
          companyName: z.string().optional(),
          phone: z.string().optional(),
          country: z.string().length(2).optional(), // ISO country code
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

        // Get the inserted user ID
        const userId = Number(result[0].insertId);
        if (!userId) {
          throw new Error("Failed to create user account");
        }

        // If supplier account, create supplier company and link user
        if (input.accountType === "supplier") {
          const { suppliers, supplierUsers } = await import("../drizzle/schema");
          
          // Create supplier company with provided or default values
          const supplierResult = await db.insert(suppliers).values({
            companyName: input.companyName || input.name + "'s Company",
            contactEmail: input.email,
            contactPhone: input.phone || null,
            country: input.country || "US",
            verificationStatus: "pending",
            isVerified: 0,
            rating: 200, // Default 2.0/5.0 rating for new suppliers
          });

          // Get the inserted supplier ID
          const supplierId = Number(supplierResult[0].insertId);
          if (!supplierId) {
            throw new Error("Failed to create supplier company");
          }

          // Link user to supplier
          await db.insert(supplierUsers).values({
            userId: userId,
            supplierId: supplierId,
            role: "supplier_admin",
          });

          // Send welcome email
          const { sendSupplierWelcomeEmail } = await import("./_core/email");
          await sendSupplierWelcomeEmail(input.email, input.name || "Supplier", input.companyName || "Your Company");
        }

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
            role: user.role,
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
        await sendPasswordResetEmail(user.email, token);

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

    // Update out-of-hours availability
    updateOutOfHoursAvailability: protectedProcedure
      .input(
        z.object({
          supplierId: z.number(),
          offersOutOfHours: z.boolean(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const { suppliers, supplierUsers } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Verify user owns this supplier
        const supplierUser = await db
          .select()
          .from(supplierUsers)
          .where(
            and(
              eq(supplierUsers.supplierId, input.supplierId),
              eq(supplierUsers.userId, ctx.user.id)
            )
          )
          .limit(1);

        if (supplierUser.length === 0) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to update this supplier" });
        }

        await db
          .update(suppliers)
          .set({ offersOutOfHours: input.offersOutOfHours ? 1 : 0 })
          .where(eq(suppliers.id, input.supplierId));

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

    // Get rate configuration summary for dashboard
    getRateConfigurationSummary: protectedProcedure
      .input(z.object({ supplierId: z.number() }))
      .query(async ({ input }) => {
        const { getRateConfigurationSummary } = await import("./rateStats");
        return await getRateConfigurationSummary(input.supplierId);
      }),

    // Upsert a single rate
    upsertRate: protectedProcedure
      .input(
        z.object({
          supplierId: z.number(),
          countryCode: z.string().length(2).optional(),
          cityId: z.number().optional(),
          serviceType: z.string(),
          serviceLevel: z.enum(["same_business_day", "next_business_day", "scheduled"]),
          rateUsdCents: z.number().nullable(),
        })
      )
      .mutation(async ({ input }) => {
        const { upsertRate } = await import("./rates");
        try {
          await upsertRate(input);
          return { success: true };
        } catch (error) {
          console.error("[upsertRate] Error saving rate:", error);
          throw error;
        }
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
              serviceLevel: z.enum(["same_business_day", "next_business_day", "scheduled"]),
              rateUsdCents: z.number().nullable(),
            })
          ),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { bulkUpsertRates } = await import("./rates");
        await bulkUpsertRates(input.rates);
        
        // Send email notification on first rates completion
        if (input.rates.length > 0 && ctx.user) {
          const supplierId = input.rates[0].supplierId;
          const { getSupplierById } = await import("./db");
          const supplier = await getSupplierById(supplierId);
          
          if (supplier) {
            // Count unique service types
            const serviceTypes = new Set(input.rates.map(r => r.serviceType));
            const { sendRatesCompletedEmail } = await import("./_core/email");
            await sendRatesCompletedEmail(
              ctx.user.email,
              supplier.companyName,
              input.rates.length,
              serviceTypes.size
            );
          }
        }
        
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
    // TODO: Re-implement cleanupOrphanedRates for service level system
    // cleanupOrphanedRates: protectedProcedure
    //   .input(z.object({ supplierId: z.number() }))
    //   .mutation(async ({ input }) => {
    //     const { cleanupOrphanedRates } = await import("./rates");
    //     const deletedCount = await cleanupOrphanedRates(input.supplierId);
    //     return { success: true, deletedCount };
    //   }),

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

          // Map response time hours to service level
          const { HOURS_TO_SERVICE_LEVEL } = await import("../shared/rates");
          const serviceLevel = HOURS_TO_SERVICE_LEVEL[rate.responseTimeHours as 4 | 24 | 48 | 72 | 96];
          
          if (!serviceLevel) {
            // Skip invalid response times
            continue;
          }

          ratesToInsert.push({
            supplierId: input.supplierId,
            serviceType: rate.serviceType,
            serviceLevel,
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
        
        // TODO: Re-implement automatic cleanup for service level system
        // const { cleanupOrphanedRates } = await import("./rates");
        // await cleanupOrphanedRates(input.supplierId);
        
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

    // Preview bulk rate adjustment
    previewBulkAdjustment: protectedProcedure
      .input(
        z.object({
          supplierId: z.number(),
          adjustmentPercent: z.number(),
          serviceTypes: z.array(z.string()).optional(),
          serviceLevels: z.array(z.enum(["same_business_day", "next_business_day", "scheduled"])).optional(),
          countryCodes: z.array(z.string().length(2)).optional(),
          cityIds: z.array(z.number()).optional(),
        })
      )
      .query(async ({ input }) => {
        const { previewBulkAdjustment } = await import("./bulkRateAdjustment");
        return await previewBulkAdjustment(
          {
            supplierId: input.supplierId,
            serviceTypes: input.serviceTypes as any,
            serviceLevels: input.serviceLevels,
            countryCodes: input.countryCodes,
            cityIds: input.cityIds,
          },
          input.adjustmentPercent
        );
      }),

    // Apply bulk rate adjustment
    applyBulkAdjustment: protectedProcedure
      .input(
        z.object({
          supplierId: z.number(),
          adjustmentPercent: z.number(),
          serviceTypes: z.array(z.string()).optional(),
          serviceLevels: z.array(z.enum(["same_business_day", "next_business_day", "scheduled"])).optional(),
          countryCodes: z.array(z.string().length(2)).optional(),
          cityIds: z.array(z.number()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { applyBulkAdjustment } = await import("./bulkRateAdjustment");
        return await applyBulkAdjustment(
          {
            supplierId: input.supplierId,
            serviceTypes: input.serviceTypes as any,
            serviceLevels: input.serviceLevels,
            countryCodes: input.countryCodes,
            cityIds: input.cityIds,
          },
          input.adjustmentPercent
        );
      }),

    // Get rate analytics and market comparison
    getRateAnalytics: protectedProcedure
      .input(
        z.object({
          supplierId: z.number(),
          serviceTypes: z.array(z.string()).optional(),
          serviceLevels: z.array(z.enum(["same_business_day", "next_business_day", "scheduled"])).optional(),
          countryCodes: z.array(z.string().length(2)).optional(),
        })
      )
      .query(async ({ input }) => {
        const { getSupplierRateAnalytics } = await import("./rateAnalytics");
        return await getSupplierRateAnalytics(input.supplierId, {
          serviceTypes: input.serviceTypes as any,
          serviceLevels: input.serviceLevels,
          countryCodes: input.countryCodes,
        });
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

    // Response time exclusions - granular control at service level
    addResponseTimeExclusion: protectedProcedure
      .input(
        z.object({
          supplierId: z.number(),
          countryCode: z.string().length(2).optional(),
          cityId: z.number().optional(),
          serviceType: z.string(),
          serviceLevel: z.enum(["same_business_day", "next_business_day", "scheduled"]),
        })
      )
      .mutation(async ({ input }) => {
        const { addResponseTimeExclusion } = await import("./responseTimeExclusions");
        await addResponseTimeExclusion(input);
        return { success: true };
      }),

    removeResponseTimeExclusion: protectedProcedure
      .input(
        z.object({
          supplierId: z.number(),
          countryCode: z.string().length(2).optional(),
          cityId: z.number().optional(),
          serviceType: z.string(),
          serviceLevel: z.enum(["same_business_day", "next_business_day", "scheduled"]),
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
      .mutation(async ({ input, ctx }) => {
        const { upsertSupplierCountries } = await import("./db");
        await upsertSupplierCountries(input.supplierId, input.countryCodes, input.isExcluded);
        
        // TODO: Re-implement automatic cleanup for service level system
        // const { cleanupOrphanedRates } = await import("./rates");
        // await cleanupOrphanedRates(input.supplierId);
        
        // Send email notification when coverage is configured
        if (input.countryCodes.length > 0 && ctx.user) {
          const { getSupplierById } = await import("./db");
          const supplier = await getSupplierById(input.supplierId);
          
          if (supplier) {
            const { sendCoverageCompletedEmail } = await import("./_core/email");
            await sendCoverageCompletedEmail(
              ctx.user.email,
              supplier.companyName,
              input.countryCodes.length,
              0 // City count not available
            );
          }
        }
        
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
        
        // TODO: Re-implement automatic cleanup for service level system
        // const { cleanupOrphanedRates } = await import("./rates");
        // await cleanupOrphanedRates(input.supplierId);
        
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
    // Check service coverage for location and service type
    checkCoverage: publicProcedure
      .input(
        z.object({
          serviceType: z.string(),
          latitude: z.string(),
          longitude: z.string(),
          city: z.string().optional(),
          country: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        // TODO: Implement actual coverage check logic
        // - Query suppliers table for companies serving this location
        // - Check if any suppliers offer the requested service type
        // - Consider distance/radius from supplier service areas
        // - Return availability status and estimated response time
        
        // Placeholder response
        return {
          available: true,
          message: "Coverage check coming soon",
          supplierCount: 0,
          estimatedResponseTime: null,
        };
      }),

    // Calculate pricing estimate
    calculatePricing: publicProcedure
      .input(
        z.object({
          serviceType: z.string(),
          serviceLevel: z.enum(["same_day", "next_day", "scheduled"]),
          estimatedDuration: z.number(),
          downTime: z.boolean().optional(),
          outOfHours: z.boolean().optional(),
          latitude: z.string().optional(),
          longitude: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        // TODO: Implement actual pricing calculation logic
        // - Base rate by service level (same_day: 4hrs, next_day: 24hrs, scheduled: 48hrs+)
        // - Duration multiplier
        // - Downtime surcharge
        // - Out-of-hours surcharge
        // - Location-based pricing adjustments
        // - Supplier rate variations
        
        // Placeholder response
        return {
          baseRate: 0,
          durationCharge: 0,
          downtimeSurcharge: 0,
          outOfHoursSurcharge: 0,
          totalEstimate: 0,
          currency: "USD",
          breakdown: [
            { item: "Base rate", amount: 0 },
            { item: "Duration", amount: 0 },
          ],
          message: "Pricing calculation coming soon",
        };
      }),

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
        const { randomBytes } = await import("crypto");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Generate engineer token and short code once at job creation
        const engineerToken = randomBytes(32).toString('hex');
        const shortCode = randomBytes(4).toString('hex').toUpperCase(); // 8-character hex code

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
          
          // Engineer token and short code (generated once at creation)
          engineerToken: engineerToken,
          shortCode: shortCode,
          
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
        const { jobs, siteVisitReports, svrMediaFiles } = await import("../drizzle/schema");
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
          .leftJoin(siteVisitReports, eq(jobs.id, siteVisitReports.jobId))
          .leftJoin(svrMediaFiles, eq(siteVisitReports.id, svrMediaFiles.svrId))
          .where(
            and(
              eq(jobs.id, input.id),
              or(...conditions)
            )
          );

        if (result.length === 0) return null;

        const jobData = result[0].jobs;
        const reportData = result[0].siteVisitReports;
        const photos = result.map(r => r.svrMediaFiles).filter(p => p);

        return {
          ...jobData,
          siteVisitReport: reportData ? { ...reportData, photos } : null,
        };
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
            status: "supplier_accepted",
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
              job.id,
              "supplier_accepted",
              customer.name || "Customer",
              job.siteAddress
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
              job.id,
              input.status,
              customer.name || "Customer",
              job.siteAddress
            ).catch((error) => {
              console.error("Failed to send job status email:", error);
            });
          }
        }

        return { success: true };
      }),

    // Accept available job (supplier)
    acceptJobAsSupplier: protectedProcedure
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

        // Update job status and assign to supplier (token already exists from job creation)
        await updateJob(job.id, {
          status: 'supplier_accepted',
          assignedSupplierId: supplier.supplier.id,
        });

        await addJobStatusHistory({
          jobId: job.id,
          status: 'supplier_accepted',
          notes: `Job accepted by ${supplier.supplier.companyName}`,
        });

        // Return existing engineer token (generated at job creation)
        return { success: true, engineerToken: job.engineerToken };
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

        // Use existing engineer token (generated at job creation)
        await updateJob(job.id, {
          engineerName: input.engineerName,
          engineerEmail: input.engineerEmail,
          engineerPhone: input.engineerPhone,
          status: 'sent_to_engineer',
        });

        await addJobStatusHistory({
          jobId: job.id,
          status: 'sent_to_engineer',
          notes: `Assigned to engineer ${input.engineerName} (${input.engineerEmail})`,
        });

        // Send email to engineer (using existing token from job creation)
        await sendJobAssignmentNotification(
          input.engineerEmail,
          input.engineerName,
          job.id,
          job.siteName || "Site",
          job.siteAddress,
          job.scheduledDateTime?.toISOString() || new Date().toISOString(),
          job.engineerToken!
        );

        return { success: true, engineerToken: job.engineerToken };
      }),

    // Engineer claims job by providing their details
    claimJob: publicProcedure
      .input(z.object({
        token: z.string(),
        engineerName: z.string().min(1, "Name is required"),
        engineerEmail: z.string().email("Valid email is required"),
        engineerPhone: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getJobByEngineerToken, updateJob, addJobStatusHistory } = await import("./db");
        const { sendJobAssignmentNotification } = await import("./_core/email");

        const job = await getJobByEngineerToken(input.token);
        if (!job) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });
        }

        // Verify job is in supplier_accepted status (not yet claimed)
        if (job.status !== 'supplier_accepted') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Job has already been claimed or is not available' });
        }

        // Verify no engineer is assigned yet
        if (job.engineerName || job.engineerEmail) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Job has already been assigned to an engineer' });
        }

        // Update job with engineer details and change status to engineer_accepted (self-claim implies acceptance)
        await updateJob(job.id, {
          engineerName: input.engineerName,
          engineerEmail: input.engineerEmail,
          engineerPhone: input.engineerPhone,
          status: 'engineer_accepted',
        });

        await addJobStatusHistory({
          jobId: job.id,
          status: 'engineer_accepted',
          notes: `Job claimed and accepted by engineer ${input.engineerName} (${input.engineerEmail})`,
        });

        // Send confirmation email to engineer
        await sendJobAssignmentNotification(
          input.engineerEmail,
          input.engineerName,
          job.id,
          job.siteName || "Site",
          job.siteAddress,
          job.scheduledDateTime?.toISOString() || new Date().toISOString(),
          input.token
        );

        return { success: true };
      }),

    // Engineer accepts manually assigned job and can update their details
    acceptJob: publicProcedure
      .input(z.object({
        token: z.string(),
        engineerName: z.string().min(1, "Name is required"),
        engineerEmail: z.string().email("Valid email is required"),
        engineerPhone: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getJobByEngineerToken, updateJob, addJobStatusHistory } = await import("./db");
        const { sendJobAssignmentNotification } = await import("./_core/email");

        const job = await getJobByEngineerToken(input.token);
        if (!job) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });
        }

        // Verify job is in sent_to_engineer status (manually assigned, awaiting acceptance)
        if (job.status !== 'sent_to_engineer') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Job is not awaiting engineer acceptance' });
        }

        // Update job with engineer's confirmed/updated details and change status to engineer_accepted
        // Engineer's input supersedes supplier's manual assignment
        await updateJob(job.id, {
          engineerName: input.engineerName,
          engineerEmail: input.engineerEmail,
          engineerPhone: input.engineerPhone,
          status: 'engineer_accepted',
        });

        await addJobStatusHistory({
          jobId: job.id,
          status: 'engineer_accepted',
          notes: `Job accepted by engineer ${input.engineerName} (${input.engineerEmail})`,
        });

        // Send confirmation email to engineer with updated details
        await sendJobAssignmentNotification(
          input.engineerEmail,
          input.engineerName,
          job.id,
          job.siteName || "Site",
          job.siteAddress,
          job.scheduledDateTime?.toISOString() || new Date().toISOString(),
          input.token
        );

        return { success: true };
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

    // Get job by short code (no auth required) - for /e/:shortCode redirect
    getByShortCode: publicProcedure
      .input(z.object({ shortCode: z.string() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const { jobs } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) return null;

        const result = await db
          .select()
          .from(jobs)
          .where(eq(jobs.shortCode, input.shortCode))
          .limit(1);
        
        return result.length > 0 ? result[0] : null;
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
                job.id,
                input.status,
                customer.name || "Customer",
                job.siteAddress
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
        const { jobs, jobLocations, supplierUsers } = await import("../drizzle/schema");
        const { eq, desc, and } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) return null;

        // Verify the job belongs to the current user (customer or assigned supplier)
        const [job] = await db
          .select()
          .from(jobs)
          .where(eq(jobs.id, input.jobId))
          .limit(1);

        if (!job) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });
        }

        // Check if user is the customer
        const isCustomer = job.customerId === ctx.user.id;

        // Check if user belongs to the assigned supplier company
        let isAssignedSupplier = false;
        if (job.assignedSupplierId) {
          const [supplierUser] = await db
            .select()
            .from(supplierUsers)
            .where(and(
              eq(supplierUsers.supplierId, job.assignedSupplierId),
              eq(supplierUsers.userId, ctx.user.id)
            ))
            .limit(1);
          isAssignedSupplier = !!supplierUser;
        }

        if (!isCustomer && !isAssignedSupplier) {
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
        const { siteVisitReports, svrMediaFiles, jobStatusHistory } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");

        const job = await getJobByEngineerToken(input.token);
        if (!job) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        }

        // Get on-site timestamp from status history
        const statusHistory = await db
          .select()
          .from(jobStatusHistory)
          .where(eq(jobStatusHistory.jobId, job.id));

        const onSiteEntry = statusHistory.find(h => h.status === 'on_site');
        
        // Use current timestamp as "left site" time since submitting the report means the job is complete
        const currentTime = new Date();

        // Create site visit report - map form fields to database schema
        const reportData = {
          jobId: job.id,
          visitDate: new Date(),
          engineerName: job.engineerName || 'Unknown Engineer',
          timeOnsite: onSiteEntry?.timestamp ? new Date(onSiteEntry.timestamp).toISOString() : null,
          timeLeftSite: currentTime.toISOString(), // Current time = when engineer left site
          issueFault: input.findings || null,
          actionsPerformed: input.workCompleted,
          recommendations: input.recommendations || null,
          issueResolved: true, // Assuming completion means issue is resolved
          contactAgreed: true, // Customer signature implies agreement
          clientSignatory: input.customerName,
          clientSignatureData: input.signatureDataUrl,
          signedAt: new Date(),
        };
        
        // Check if a site visit report already exists for this job
        const [existingReport] = await db
          .select()
          .from(siteVisitReports)
          .where(eq(siteVisitReports.jobId, job.id))
          .limit(1);
        
        let reportId: number;
        
        if (existingReport) {
          // Update existing report
          await db
            .update(siteVisitReports)
            .set({
              visitDate: reportData.visitDate,
              engineerName: reportData.engineerName,
              timeOnsite: reportData.timeOnsite,
              timeLeftSite: reportData.timeLeftSite,
              issueFault: reportData.issueFault,
              actionsPerformed: reportData.actionsPerformed,
              recommendations: reportData.recommendations,
              issueResolved: reportData.issueResolved,
              contactAgreed: reportData.contactAgreed,
              clientSignatory: reportData.clientSignatory,
              clientSignatureData: reportData.clientSignatureData,
              signedAt: reportData.signedAt,
            })
            .where(eq(siteVisitReports.id, existingReport.id));
          
          reportId = existingReport.id;
        } else {
          // Insert new report
          await db.insert(siteVisitReports).values(reportData);
          
          // Query back to get the created report
          const [createdReport] = await db
            .select()
            .from(siteVisitReports)
            .where(eq(siteVisitReports.jobId, job.id))
            .limit(1);
          
          if (!createdReport) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create site visit report' });
          }
          
          reportId = createdReport.id;
        }

        // Save photos if provided (store as base64 in database)
        if (input.photos && input.photos.length > 0) {
          for (let i = 0; i < input.photos.length; i++) {
            const photoDataUrl = input.photos[i];
            
            // Extract mime type from data URL
            const mimeTypeMatch = photoDataUrl.match(/data:([^;]+);/);
            const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
            
            // Calculate file size from base64
            const base64Data = photoDataUrl.split(',')[1];
            const fileSize = Math.ceil((base64Data.length * 3) / 4); // Approximate size in bytes
            
            // Generate file key for reference (not used for storage)
            const timestamp = Date.now();
            const randomSuffix = Math.random().toString(36).substring(7);
            const fileKey = `site-visit-reports/${job.id}/photo-${i + 1}-${timestamp}-${randomSuffix}.jpg`;
            
            // Save to database with base64 data URL
            await db.insert(svrMediaFiles).values({
              svrId: reportId,
              fileKey: fileKey,
              fileUrl: photoDataUrl, // Store base64 data URL directly
              fileName: `photo-${i + 1}.jpg`,
              fileType: 'image' as const,
              mimeType: mimeType,
              fileSize: fileSize,
            });
          }
        }

        // Update job status to completed
        const { jobs } = await import("../drizzle/schema");
        
        await db
          .update(jobs)
          .set({ status: 'completed' })
          .where(eq(jobs.id, job.id));
        
        // Add status history entry
        await db.insert(jobStatusHistory).values({
          jobId: job.id,
          status: 'completed',
          timestamp: new Date(),
        });

        return { success: true, reportId: reportId };
      }),

    // Get site visit report by job ID
    getSiteVisitReport: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .query(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { jobs, siteVisitReports, svrMediaFiles, supplierUsers } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) return null;

        // Verify the job belongs to the current user (customer or assigned supplier)
        const [job] = await db
          .select()
          .from(jobs)
          .where(eq(jobs.id, input.jobId))
          .limit(1);

        if (!job) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });
        }

        // Check if user is the customer
        const isCustomer = job.customerId === ctx.user.id;

        // Check if user belongs to the assigned supplier company
        let isAssignedSupplier = false;
        if (job.assignedSupplierId) {
          const [supplierUser] = await db
            .select()
            .from(supplierUsers)
            .where(and(
              eq(supplierUsers.supplierId, job.assignedSupplierId),
              eq(supplierUsers.userId, ctx.user.id)
            ))
            .limit(1);
          isAssignedSupplier = !!supplierUser;
        }

        if (!isCustomer && !isAssignedSupplier) {
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
          .where(eq(svrMediaFiles.svrId, report.id));

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

  // Supplier Verification System
  verification: router({
    // Get verification status for current supplier
    getStatus: protectedProcedure.query(async ({ ctx }) => {
      const { getSupplierByUserId } = await import("./db");
      const { supplierVerification, supplierCompanyProfile, verificationDocuments } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get supplier
      const result = await getSupplierByUserId(ctx.user.id);
      if (!result) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Supplier not found" });
      }
      const supplier = result.supplier;

      // Get or create verification record
      let verification = await db.select().from(supplierVerification)
        .where(eq(supplierVerification.supplierId, supplier.id))
        .limit(1)
        .then(rows => rows[0]);

      if (!verification) {
        await db.insert(supplierVerification).values({
          supplierId: supplier.id,
          status: "not_started",
        });
        verification = await db.select().from(supplierVerification)
          .where(eq(supplierVerification.supplierId, supplier.id))
          .limit(1)
          .then(rows => rows[0]);
      }

      // Get company profile
      const profile = await db.select().from(supplierCompanyProfile)
        .where(eq(supplierCompanyProfile.supplierId, supplier.id))
        .limit(1)
        .then(rows => rows[0] || null);

      // Get documents
      const documents = await db.select().from(verificationDocuments)
        .where(eq(verificationDocuments.supplierId, supplier.id));

      return {
        verification,
        profile,
        documents,
        isVerified: supplier.isVerified === 1,
      };
    }),

    // Submit company profile
    submitCompanyProfile: protectedProcedure
      .input(
        z.object({
          companyName: z.string().min(1),
          registrationNumber: z.string().optional(),
          yearFounded: z.number().optional(),
          headquarters: z.string().optional(),
          regionalOffices: z.array(z.object({
            city: z.string(),
            country: z.string(),
            address: z.string(),
          })).optional(),
          ownershipStructure: z.enum(["private", "group", "subsidiary"]),
          parentCompany: z.string().optional(),
          missionStatement: z.string().optional(),
          coreValues: z.string().optional(),
          companyOverview: z.string().optional(),
          numberOfEmployees: z.number().optional(),
          annualRevenue: z.number().optional(),
          websiteUrl: z.string().optional(),
          linkedInUrl: z.string().optional(),
          primaryContactName: z.string().optional(),
          primaryContactTitle: z.string().optional(),
          primaryContactEmail: z.string().email().optional(),
          primaryContactPhone: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { getSupplierByUserId } = await import("./db");
        const { supplierCompanyProfile, supplierVerification } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await getSupplierByUserId(ctx.user.id);
        if (!result) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Supplier not found" });
        }
        const supplier = result.supplier;

        // Check if profile exists
        const existing = await db.select().from(supplierCompanyProfile)
          .where(eq(supplierCompanyProfile.supplierId, supplier.id))
          .limit(1)
          .then(rows => rows[0]);

        if (existing) {
          // Update existing profile
          await db.update(supplierCompanyProfile)
            .set({
              ...input,
              updatedAt: new Date(),
            })
            .where(eq(supplierCompanyProfile.supplierId, supplier.id));
        } else {
          // Create new profile
          await db.insert(supplierCompanyProfile).values({
            supplierId: supplier.id,
            ...input,
          });
        }

        // Update verification status to in_progress
        await db.update(supplierVerification)
          .set({ status: "in_progress" })
          .where(eq(supplierVerification.supplierId, supplier.id));

        return { success: true };
      }),

    // Upload verification document
    uploadDocument: protectedProcedure
      .input(
        z.object({
          documentType: z.enum([
            "insurance_liability",
            "insurance_indemnity",
            "insurance_workers_comp",
            "dpa_signed",
            "nda_signed",
            "non_compete_signed",
            "background_verification_signed",
            "right_to_work_signed",
            "security_compliance",
            "engineer_vetting_policy",
            "other",
          ]),
          documentName: z.string(),
          fileData: z.string(), // base64
          mimeType: z.string(),
          fileSize: z.number(),
          expiryDate: z.string().optional(),
          // Signature metadata (for signed documents)
          signedBy: z.string().optional(),
          signatureData: z.string().optional(), // base64 signature image
          signedAt: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { getSupplierByUserId } = await import("./db");
        const { verificationDocuments, supplierVerification } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { storagePut } = await import("./storage");

        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await getSupplierByUserId(ctx.user.id);
        if (!result) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Supplier not found" });
        }
        const supplier = result.supplier;

        // Upload to S3
        const fileBuffer = Buffer.from(input.fileData.split(",")[1], "base64");
        const fileKey = `verification/${supplier.id}/${input.documentType}/${Date.now()}-${input.documentName}`;
        const { url: fileUrl } = await storagePut(fileKey, fileBuffer, input.mimeType);

        // Upload signature image if provided
        let signatureUrl: string | null = null;
        if (input.signatureData) {
          const signatureBuffer = Buffer.from(input.signatureData.split(",")[1], "base64");
          const signatureKey = `verification/${supplier.id}/${input.documentType}/signature-${Date.now()}.png`;
          const signatureResult = await storagePut(signatureKey, signatureBuffer, "image/png");
          signatureUrl = signatureResult.url;
        }

        // Get client IP and user agent from request
        const clientIp = ctx.req?.headers['x-forwarded-for'] || ctx.req?.socket?.remoteAddress || null;
        const userAgent = ctx.req?.headers['user-agent'] || null;

        // Save to database
        await db.insert(verificationDocuments).values({
          supplierId: supplier.id,
          documentType: input.documentType,
          documentName: input.documentName,
          fileUrl,
          fileKey,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
          uploadedBy: ctx.user.id,
          expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
          status: "pending_review",
          // Signature metadata
          signedBy: input.signedBy || null,
          signatureUrl: signatureUrl,
          signedAt: input.signedAt ? new Date(input.signedAt) : null,
          signerIpAddress: typeof clientIp === 'string' ? clientIp : (Array.isArray(clientIp) ? clientIp[0] : null),
          signerUserAgent: typeof userAgent === 'string' ? userAgent : null,
        });

        // Update verification status
        await db.update(supplierVerification)
          .set({ status: "in_progress" })
          .where(eq(supplierVerification.supplierId, supplier.id));

        // Send email with PDF attachment for signed legal documents
        const signedDocTypes = ['dpa_signed', 'nda_signed', 'non_compete_signed', 'background_verification_signed', 'right_to_work_signed'];
        if (signedDocTypes.includes(input.documentType) && input.signatureData) {
          try {
            // Generate PDF with signature
            const { generateLegalPDF } = await import("../client/src/lib/generateLegalPDF");
            const docTypeMap: Record<string, string> = {
              'dpa_signed': 'dpa',
              'nda_signed': 'nda',
              'non_compete_signed': 'nonCompete',
              'background_verification_signed': 'backgroundVerification',
              'right_to_work_signed': 'rightToWork',
            };
            
            const pdfBlob = await generateLegalPDF(
              docTypeMap[input.documentType] as any,
              {
                supplierName: supplier.companyName,
                contactName: input.signedBy || ctx.user.email,
                signatureData: input.signatureData,
                title: input.signedBy || '',
                signedAt: new Date().toISOString(),
              }
            );
            
            const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());
            const { sendSignedDocumentEmail } = await import("./_core/email");
            await sendSignedDocumentEmail(
              ctx.user.email,
              supplier.companyName,
              input.documentType,
              input.documentName,
              input.signedAt || new Date().toISOString(),
              pdfBuffer
            );
          } catch (emailError) {
            console.error('Failed to send signed document email:', emailError);
            // Don't fail the upload if email fails
          }
        }

        return { success: true, fileUrl };
      }),

    // Submit for verification review
    submitForReview: protectedProcedure.mutation(async ({ ctx }) => {
      const { getSupplierByUserId } = await import("./db");
      const { supplierVerification, supplierCompanyProfile, verificationDocuments } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await getSupplierByUserId(ctx.user.id);
      if (!result) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Supplier not found" });
      }
      const supplier = result.supplier;

      // Validate: must have company profile
      const profile = await db.select().from(supplierCompanyProfile)
        .where(eq(supplierCompanyProfile.supplierId, supplier.id))
        .limit(1)
        .then(rows => rows[0]);

      if (!profile) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Company profile not completed" });
      }

      // Validate: must have required documents
      const documents = await db.select().from(verificationDocuments)
        .where(eq(verificationDocuments.supplierId, supplier.id));

      const requiredDocs = [
        "insurance_liability",
        "insurance_indemnity",
        "insurance_workers_comp",
        "dpa_signed",
        "nda_signed",
        "non_compete_signed",
      ];

      const uploadedTypes = documents.map(d => d.documentType);
      const missingDocs = requiredDocs.filter(type => !uploadedTypes.includes(type as any));

      if (missingDocs.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Missing required documents: ${missingDocs.join(", ")}`,
        });
      }

      // Update verification status
      await db.update(supplierVerification)
        .set({
          status: "pending_review",
          submittedAt: new Date(),
        })
        .where(eq(supplierVerification.supplierId, supplier.id));

      // TODO: Send email notification to admin team

      return { success: true };
    }),

    // Get uploaded documents
    getDocuments: protectedProcedure.query(async ({ ctx }) => {
      const { getSupplierByUserId } = await import("./db");
      const { verificationDocuments } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await getSupplierByUserId(ctx.user.id);
      if (!result) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Supplier not found" });
      }
      const supplier = result.supplier;

      const documents = await db.select().from(verificationDocuments)
        .where(eq(verificationDocuments.supplierId, supplier.id));

      return documents;
    }),
  }),

  // Admin Verification Review
  admin: router({
    // Get pending verifications queue
    getPendingVerifications: superadminProcedure.query(async ({ ctx }) => {
      const { supplierVerification, suppliers } = await import("../drizzle/schema");
      const { eq, inArray } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // TODO: Add admin role check
      // if (ctx.user.role !== "admin") {
      //   throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      // }

      // Get all pending/under_review verifications
      const verifications = await db.select({
        id: supplierVerification.id,
        supplierId: supplierVerification.supplierId,
        status: supplierVerification.status,
        submittedAt: supplierVerification.submittedAt,
        companyName: suppliers.companyName,
        contactEmail: suppliers.contactEmail,
      })
        .from(supplierVerification)
        .leftJoin(suppliers, eq(supplierVerification.supplierId, suppliers.id))
        .where(inArray(supplierVerification.status, ["pending_review", "under_review"]));

      return verifications;
    }),

    // Get verification details for review
    getVerificationDetails: superadminProcedure
      .input(z.object({ supplierId: z.number() }))
      .query(async ({ input, ctx }) => {
        const { supplierVerification, supplierCompanyProfile, verificationDocuments, suppliers, supplierCoverageCountries, supplierPriorityCities, users, supplierUsers } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Get supplier
        const supplier = await db.select().from(suppliers)
          .where(eq(suppliers.id, input.supplierId))
          .limit(1)
          .then(rows => rows[0]);

        if (!supplier) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Supplier not found" });
        }

        // Get verification record
        const verification = await db.select().from(supplierVerification)
          .where(eq(supplierVerification.supplierId, input.supplierId))
          .limit(1)
          .then(rows => rows[0]);

        // Get reviewer info if verification was reviewed
        let reviewer = null;
        if (verification?.reviewedBy) {
          reviewer = await db.select({ name: users.name, email: users.email })
            .from(users)
            .where(eq(users.id, verification.reviewedBy))
            .limit(1)
            .then(rows => rows[0] || null);
        }

        // Get company profile
        const profile = await db.select().from(supplierCompanyProfile)
          .where(eq(supplierCompanyProfile.supplierId, input.supplierId))
          .limit(1)
          .then(rows => rows[0] || null);

        // Get documents with uploader info
        const docs = await db.select().from(verificationDocuments)
          .where(eq(verificationDocuments.supplierId, input.supplierId));
        
        // Fetch uploader names for documents
        const documentsWithUploaders = await Promise.all(
          docs.map(async (doc) => {
            let uploaderName = null;
            if (doc.uploadedBy) {
              const uploader = await db.select({ name: users.name })
                .from(users)
                .where(eq(users.id, doc.uploadedBy))
                .limit(1)
                .then(rows => rows[0]);
              uploaderName = uploader?.name || null;
            }
            return { ...doc, uploaderName };
          })
        );

        // Get coverage countries
        const coverageCountries = await db.select().from(supplierCoverageCountries)
          .where(eq(supplierCoverageCountries.supplierId, input.supplierId));

        // Get priority cities
        const priorityCities = await db.select().from(supplierPriorityCities)
          .where(eq(supplierPriorityCities.supplierId, input.supplierId));

        // Get supplier users (team members)
        const teamMembers = await db.select({
          userId: supplierUsers.userId,
          role: supplierUsers.role,
          userName: users.name,
          userEmail: users.email,
          joinedAt: supplierUsers.createdAt,
        })
          .from(supplierUsers)
          .leftJoin(users, eq(supplierUsers.userId, users.id))
          .where(eq(supplierUsers.supplierId, input.supplierId));

        return {
          supplier,
          verification,
          reviewer,
          profile,
          documents: documentsWithUploaders,
          coverageCountries,
          priorityCities,
          teamMembers,
        };
      }),

    // Approve verification
    approveVerification: superadminProcedure
      .input(z.object({ supplierId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { supplierVerification, suppliers } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // TODO: Add admin role check

        // Update verification status
        await db.update(supplierVerification)
          .set({
            status: "approved",
            reviewedBy: ctx.user.id,
            reviewedAt: new Date(),
            approvedAt: new Date(),
          })
          .where(eq(supplierVerification.supplierId, input.supplierId));

        // Update supplier isVerified flag
        await db.update(suppliers)
          .set({
            isVerified: 1,
            verificationStatus: "verified",
          })
          .where(eq(suppliers.id, input.supplierId));

        // Get supplier details for email
        const supplier = await db.select()
          .from(suppliers)
          .where(eq(suppliers.id, input.supplierId))
          .limit(1);

        // Send approval email notification
        if (supplier[0]) {
          const { sendVerificationApprovedEmail } = await import("./_core/email");
          await sendVerificationApprovedEmail(
            supplier[0].contactEmail,
            supplier[0].companyName
          ).catch(err => console.error("Failed to send approval email:", err));
        }

        return { success: true };
      }),

    // Reject verification
    rejectVerification: superadminProcedure
      .input(
        z.object({
          supplierId: z.number(),
          reason: z.string().min(1),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { supplierVerification, suppliers } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // TODO: Add admin role check

        // Update verification status
        await db.update(supplierVerification)
          .set({
            status: "rejected",
            reviewedBy: ctx.user.id,
            reviewedAt: new Date(),
            rejectionReason: input.reason,
          })
          .where(eq(supplierVerification.supplierId, input.supplierId));

        // Update supplier status
        await db.update(suppliers)
          .set({
            isVerified: 0,
            verificationStatus: "rejected",
          })
          .where(eq(suppliers.id, input.supplierId));

        // Get supplier details and verification for email
        const supplier = await db.select()
          .from(suppliers)
          .where(eq(suppliers.id, input.supplierId))
          .limit(1);

        const verification = await db.select()
          .from(supplierVerification)
          .where(eq(supplierVerification.supplierId, input.supplierId))
          .limit(1);

        // Send rejection email notification
        if (supplier[0]) {
          const { sendVerificationRejectedEmail } = await import("./_core/email");
          await sendVerificationRejectedEmail(
            supplier[0].contactEmail,
            supplier[0].companyName,
            input.reason,
            verification[0]?.adminNotes || undefined
          ).catch(err => console.error("Failed to send rejection email:", err));
        }

        return { success: true };
      }),

    // Request resubmission
    requestResubmission: superadminProcedure
      .input(
        z.object({
          supplierId: z.number(),
          feedback: z.string().min(1),
          adminNotes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { supplierVerification, suppliers } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // TODO: Add admin role check

        // Update verification status to resubmission_required
        await db.update(supplierVerification)
          .set({
            status: "resubmission_required",
            reviewedBy: ctx.user.id,
            reviewedAt: new Date(),
            rejectionReason: input.feedback,
            adminNotes: input.adminNotes || null,
          })
          .where(eq(supplierVerification.supplierId, input.supplierId));

        // Get supplier details for email
        const supplier = await db.select()
          .from(suppliers)
          .where(eq(suppliers.id, input.supplierId))
          .limit(1);

        // Send resubmission email notification
        if (supplier[0]) {
          const { sendVerificationResubmissionEmail } = await import("./_core/email");
          await sendVerificationResubmissionEmail(
            supplier[0].contactEmail,
            supplier[0].companyName,
            input.feedback,
            input.adminNotes
          ).catch(err => console.error("Failed to send resubmission email:", err));
        }

        return { success: true };
      }),

    // Add admin note
    addNote: superadminProcedure
      .input(
        z.object({
          supplierId: z.number(),
          note: z.string().min(1),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { supplierVerification } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        // TODO: Add admin role check

        // Get existing notes
        const verification = await db.select().from(supplierVerification)
          .where(eq(supplierVerification.supplierId, input.supplierId))
          .limit(1)
          .then(rows => rows[0]);

        const existingNotes = verification?.adminNotes || "";
        const timestamp = new Date().toISOString();
        const newNote = `[${timestamp}] ${ctx.user.name || ctx.user.email}: ${input.note}`;
        const updatedNotes = existingNotes ? `${existingNotes}\n\n${newNote}` : newNote;

        // Update notes
        await db.update(supplierVerification)
          .set({ adminNotes: updatedNotes })
          .where(eq(supplierVerification.supplierId, input.supplierId));

        return { success: true };
      }),

    // Get all suppliers grouped by verification status
    getAllSupplierVerifications: superadminProcedure.query(async () => {
      const { suppliers, supplierVerification, supplierUsers, users, supplierCompanyProfile, verificationDocuments } = await import("../drizzle/schema");
      const { eq, isNull, sql } = await import("drizzle-orm");

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get all suppliers with their verification status and contact info
      const allSuppliers = await db.select({
        supplierId: suppliers.id,
        companyName: suppliers.companyName,
        contactEmail: suppliers.contactEmail,
        contactPhone: suppliers.contactPhone,
        country: suppliers.country,
        isVerified: suppliers.isVerified,
        isActive: suppliers.isActive,
        createdAt: suppliers.createdAt,
        verificationId: supplierVerification.id,
        verificationStatus: supplierVerification.status,
        submittedAt: supplierVerification.submittedAt,
        reviewedAt: supplierVerification.reviewedAt,
        approvedAt: supplierVerification.approvedAt,
        updatedAt: supplierVerification.updatedAt,
        isManuallyVerified: supplierVerification.isManuallyVerified,
        manualVerificationReason: supplierVerification.manualVerificationReason,
        manuallyVerifiedBy: supplierVerification.manuallyVerifiedBy,
        manuallyVerifiedAt: supplierVerification.manuallyVerifiedAt,
      })
        .from(suppliers)
        .leftJoin(supplierVerification, eq(suppliers.id, supplierVerification.supplierId));

      // Get contact person (admin user) for each supplier
      const suppliersWithContact = await Promise.all(
        allSuppliers.map(async (supplier) => {
          const adminUser = await db.select({
            userId: users.id,
            userName: users.name,
            userEmail: users.email,
            userPhone: users.email, // Using email as phone fallback
            lastSignedIn: users.lastSignedIn,
          })
            .from(supplierUsers)
            .leftJoin(users, eq(supplierUsers.userId, users.id))
            .where(eq(supplierUsers.supplierId, supplier.supplierId))
            .limit(1)
            .then(rows => rows[0] || null);

          // Get document count
          const docCount = await db.select({ count: sql<number>`count(*)` })
            .from(verificationDocuments)
            .where(eq(verificationDocuments.supplierId, supplier.supplierId))
            .then(rows => rows[0]?.count || 0);

          // Calculate completion percentage for in-progress verifications
          let completionPercentage = 0;
          if (supplier.verificationStatus === 'in_progress') {
            const profile = await db.select()
              .from(supplierCompanyProfile)
              .where(eq(supplierCompanyProfile.supplierId, supplier.supplierId))
              .limit(1)
              .then(rows => rows[0] || null);
            
            // Simple completion calculation: profile exists (50%) + documents (50%)
            completionPercentage = (profile ? 50 : 0) + (docCount > 0 ? 50 : 0);
          }

          return {
            ...supplier,
            contactName: adminUser?.userName || 'N/A',
            contactPersonEmail: adminUser?.userEmail || supplier.contactEmail,
            contactPersonPhone: supplier.contactPhone || 'N/A',
            lastSignedIn: adminUser?.lastSignedIn,
            documentsCount: docCount,
            completionPercentage,
          };
        })
      );

      // Group by status
      const grouped = {
        notStarted: suppliersWithContact.filter(s => !s.verificationStatus || s.verificationStatus === 'not_started'),
        inProgress: suppliersWithContact.filter(s => s.verificationStatus === 'in_progress'),
        pendingReview: suppliersWithContact.filter(s => s.verificationStatus === 'pending_review'),
        underReview: suppliersWithContact.filter(s => s.verificationStatus === 'under_review'),
        approved: suppliersWithContact.filter(s => s.verificationStatus === 'approved'),
        rejected: suppliersWithContact.filter(s => s.verificationStatus === 'rejected'),
        resubmissionRequired: suppliersWithContact.filter(s => s.verificationStatus === 'resubmission_required'),
      };

      return grouped;
    }),

    // Get all suppliers
    getAllSuppliers: superadminProcedure.query(async () => {
      const { suppliers, supplierUsers, users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const allSuppliers = await db.select({
        id: suppliers.id,
        companyName: suppliers.companyName,
        contactEmail: suppliers.contactEmail,
        contactPhone: suppliers.contactPhone,
        country: suppliers.country,
        verificationStatus: suppliers.verificationStatus,
        isVerified: suppliers.isVerified,
        isActive: suppliers.isActive,
        rating: suppliers.rating,
        createdAt: suppliers.createdAt,
      }).from(suppliers);

      // Get admin user info for each supplier
      const suppliersWithAdmin = await Promise.all(
        allSuppliers.map(async (supplier) => {
          const adminUser = await db.select({
            userId: users.id,
            userName: users.name,
            userEmail: users.email,
            lastSignedIn: users.lastSignedIn,
          })
            .from(supplierUsers)
            .leftJoin(users, eq(supplierUsers.userId, users.id))
            .where(eq(supplierUsers.supplierId, supplier.id))
            .limit(1)
            .then(rows => rows[0] || null);

          return {
            ...supplier,
            adminUser,
          };
        })
      );

      return suppliersWithAdmin;
    }),

    // Get all users
    getAllUsers: superadminProcedure.query(async () => {
      const { users } = await import("../drizzle/schema");
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const allUsers = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        accountType: users.accountType,
        role: users.role,
        loginMethod: users.loginMethod,
        createdAt: users.createdAt,
        lastSignedIn: users.lastSignedIn,
      }).from(users);

      return allUsers;
    }),

    // Get all jobs
    getAllJobs: superadminProcedure.query(async () => {
      const { jobs, users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const allJobs = await db.select({
        id: jobs.id,
        customerId: jobs.customerId,
        assignedSupplierId: jobs.assignedSupplierId,
        siteName: jobs.siteName,
        siteAddress: jobs.siteAddress,
        status: jobs.status,
        calculatedPrice: jobs.calculatedPrice,
        createdAt: jobs.createdAt,
        scheduledDateTime: jobs.scheduledDateTime,
      }).from(jobs);

      // Get customer info for each job
      const jobsWithCustomer = await Promise.all(
        allJobs.map(async (job) => {
          if (!job.customerId) {
            return {
              ...job,
              customer: null,
            };
          }

          const customer = await db.select({
            customerName: users.name,
            customerEmail: users.email,
          })
            .from(users)
            .where(eq(users.id, job.customerId))
            .limit(1)
            .then(rows => rows[0] || null);

          return {
            ...job,
            customer,
          };
        })
      );

      return jobsWithCustomer;
    }),

    // Change verification status manually (superadmin only)
    changeVerificationStatus: superadminProcedure
      .input(
        z.object({
          supplierId: z.number(),
          newStatus: z.enum(["not_started", "in_progress", "pending_review", "under_review", "approved", "rejected", "resubmission_required"]),
          reason: z.string().min(1),
          clearManualFlag: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { supplierVerification, suppliers } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Get current verification record
        const currentVerification = await db.select()
          .from(supplierVerification)
          .where(eq(supplierVerification.supplierId, input.supplierId))
          .limit(1)
          .then(rows => rows[0]);

        if (!currentVerification) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Verification record not found" });
        }

        // Determine if this is a manual verification
        const isManualVerification = input.clearManualFlag ? 0 : 1;

        // Update verification status
        await db.update(supplierVerification)
          .set({
            status: input.newStatus,
            reviewedBy: ctx.user.id,
            reviewedAt: new Date(),
            approvedAt: input.newStatus === "approved" ? new Date() : currentVerification.approvedAt,
            rejectionReason: ["rejected", "resubmission_required"].includes(input.newStatus) ? input.reason : currentVerification.rejectionReason,
            isManuallyVerified: isManualVerification,
            manualVerificationReason: isManualVerification ? input.reason : null,
            manuallyVerifiedBy: isManualVerification ? ctx.user.email : null,
            manuallyVerifiedAt: isManualVerification ? new Date() : null,
          })
          .where(eq(supplierVerification.supplierId, input.supplierId));

        // Update supplier isVerified flag
        const isVerified = input.newStatus === "approved" ? 1 : 0;
        // Map verification status to supplier enum (pending, verified, rejected)
        let supplierStatus: "pending" | "verified" | "rejected" = "pending";
        if (input.newStatus === "approved") {
          supplierStatus = "verified";
        } else if (input.newStatus === "rejected") {
          supplierStatus = "rejected";
        }
        
        await db.update(suppliers)
          .set({
            isVerified,
            verificationStatus: supplierStatus,
          })
          .where(eq(suppliers.id, input.supplierId));

        // Get supplier details for email
        const supplier = await db.select()
          .from(suppliers)
          .where(eq(suppliers.id, input.supplierId))
          .limit(1);

        // Send email notification based on new status
        if (supplier[0]) {
          if (input.newStatus === "approved") {
            const { sendVerificationApprovedEmail } = await import("./_core/email");
            await sendVerificationApprovedEmail(
              supplier[0].contactEmail,
              supplier[0].companyName
            ).catch(err => console.error("Failed to send approval email:", err));
          } else if (input.newStatus === "rejected") {
            const { sendVerificationRejectedEmail } = await import("./_core/email");
            await sendVerificationRejectedEmail(
              supplier[0].contactEmail,
              supplier[0].companyName,
              input.reason,
              undefined
            ).catch(err => console.error("Failed to send rejection email:", err));
          } else if (input.newStatus === "resubmission_required") {
            const { sendVerificationResubmissionEmail } = await import("./_core/email");
            await sendVerificationResubmissionEmail(
              supplier[0].contactEmail,
              supplier[0].companyName,
              input.reason,
              undefined
            ).catch(err => console.error("Failed to send resubmission email:", err));
          }
        }

        return { success: true };
      }),

    // Get coverage statistics
    getCoverageStats: superadminProcedure.query(async () => {
      const { supplierCoverageCountries, suppliers } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const coverageAreas = await db.select({
        countryCode: supplierCoverageCountries.countryCode,
        supplierId: supplierCoverageCountries.supplierId,
        companyName: suppliers.companyName,
      })
        .from(supplierCoverageCountries)
        .leftJoin(suppliers, eq(supplierCoverageCountries.supplierId, suppliers.id));

      return coverageAreas;
    }),

    // ========== RATING SYSTEM MANAGEMENT ==========

    // Get rating distribution statistics
    getRatingStatistics: superadminProcedure.query(async () => {
      const { suppliers } = await import("../drizzle/schema");
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const allSuppliers = await db.select({
        rating: suppliers.rating,
      }).from(suppliers);

      const distribution = {
        "1.0-1.9": 0,
        "2.0-2.9": 0,
        "3.0-3.9": 0,
        "4.0-4.9": 0,
        "5.0": 0,
      };

      let totalRating = 0;
      let count = 0;

      for (const supplier of allSuppliers) {
        const rating = supplier.rating || 200; // Default 2.0
        totalRating += rating;
        count++;

        const ratingValue = rating / 100;
        if (ratingValue >= 5.0) distribution["5.0"]++;
        else if (ratingValue >= 4.0) distribution["4.0-4.9"]++;
        else if (ratingValue >= 3.0) distribution["3.0-3.9"]++;
        else if (ratingValue >= 2.0) distribution["2.0-2.9"]++;
        else distribution["1.0-1.9"]++;
      }

      const averageRating = count > 0 ? totalRating / count : 200;

      return {
        distribution,
        totalSuppliers: count,
        averageRating: averageRating / 100, // Convert to decimal
        averageRatingRaw: averageRating, // Keep as hundredths
      };
    }),

    // Get all suppliers with ratings (paginated)
    getAllSuppliersWithRatings: superadminProcedure
      .input(z.object({
        page: z.number().default(1),
        pageSize: z.number().default(50),
        sortBy: z.enum(["rating", "companyName", "createdAt"]).default("rating"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      }))
      .query(async ({ input }) => {
        const { suppliers } = await import("../drizzle/schema");
        const { asc, desc, sql } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const { page, pageSize, sortBy, sortOrder } = input;
        const offset = (page - 1) * pageSize;

        // Build order by clause
        let orderByClause;
        if (sortBy === "rating") {
          orderByClause = sortOrder === "desc" ? desc(suppliers.rating) : asc(suppliers.rating);
        } else if (sortBy === "companyName") {
          orderByClause = sortOrder === "desc" ? desc(suppliers.companyName) : asc(suppliers.companyName);
        } else {
          orderByClause = sortOrder === "desc" ? desc(suppliers.createdAt) : asc(suppliers.createdAt);
        }

        const results = await db.select({
          id: suppliers.id,
          companyName: suppliers.companyName,
          contactEmail: suppliers.contactEmail,
          country: suppliers.country,
          rating: suppliers.rating,
          isVerified: suppliers.isVerified,
          verificationStatus: suppliers.verificationStatus,
          createdAt: suppliers.createdAt,
        })
          .from(suppliers)
          .orderBy(orderByClause)
          .limit(pageSize)
          .offset(offset);

        const [{ count }] = await db.select({ count: sql<number>`count(*)` })
          .from(suppliers);

        return {
          suppliers: results,
          totalCount: Number(count),
          page,
          pageSize,
          totalPages: Math.ceil(Number(count) / pageSize),
        };
      }),

    // Update supplier rating (admin manual adjustment)
    updateSupplierRating: superadminProcedure
      .input(z.object({
        supplierId: z.number(),
        rating: z.number().min(100).max(500), // 1.0 to 5.0 in hundredths
        reason: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { suppliers } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const { supplierId, rating, reason } = input;

        // Update the supplier rating
        await db.update(suppliers)
          .set({ 
            rating,
            updatedAt: new Date(),
          })
          .where(eq(suppliers.id, supplierId));

        // TODO: Log rating change to history table (future enhancement)
        // await db.insert(ratingHistory).values({
        //   supplierId,
        //   oldRating: oldValue,
        //   newRating: rating,
        //   changedBy: ctx.user.id,
        //   reason,
        // });

        return { success: true };
      }),
  }),

  // Suppliers router
  suppliers: router({
    // Get supplier profile
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      const { getSupplierByUserId } = await import("./db");
      const { users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await getSupplierByUserId(ctx.user.id);
      if (!result) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Supplier not found" });
      }

      // Get user name from users table
      const user = await db.select().from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1)
        .then(rows => rows[0]);

      return {
        ...result.supplier,
        userName: user?.name || "",
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
