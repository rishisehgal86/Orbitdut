import { eq, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  suppliers,
  InsertSupplier,
  supplierUsers,
  InsertSupplierUser,
  supplierRates,
  InsertSupplierRate,
  supplierCoverageCountries,
  InsertSupplierCoverageCountry,
  supplierPriorityCities,
  InsertSupplierPriorityCity,
  supplierResponseTimes,
  InsertSupplierResponseTime,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.email) {
    throw new Error("User email is required for upsert");
  }
  if (!user.accountType) {
    throw new Error("User accountType is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      email: user.email,
      accountType: user.accountType,
      openId: user.openId || null,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "loginMethod", "passwordHash"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Supplier Management Functions
 */

export async function createSupplier(supplier: InsertSupplier): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(suppliers).values(supplier);
  return Number(result.insertId);
}

export async function getSupplierById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getSupplierByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select({
      supplier: suppliers,
      supplierUser: supplierUsers,
    })
    .from(supplierUsers)
    .innerJoin(suppliers, eq(supplierUsers.supplierId, suppliers.id))
    .where(eq(supplierUsers.userId, userId))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function updateSupplier(id: number, data: Partial<InsertSupplier>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(suppliers).set(data).where(eq(suppliers.id, id));
}

export async function linkUserToSupplier(userId: number, supplierId: number, role: "supplier_admin" | "supplier_tech") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(supplierUsers).values({
    userId,
    supplierId,
    role,
  });
}

/**
 * Supplier Rates Functions
 */

export async function getSupplierRates(supplierId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(supplierRates).where(eq(supplierRates.supplierId, supplierId));
}

export async function upsertSupplierRate(rate: InsertSupplierRate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(supplierRates).values(rate).onDuplicateKeyUpdate({
    set: {
      hourlyRate: rate.hourlyRate,
      updatedAt: new Date(),
    },
  });
}

/**
 * Supplier Coverage Functions
 */

// Tier 1: Country Coverage
export async function getSupplierCountries(supplierId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(supplierCoverageCountries).where(eq(supplierCoverageCountries.supplierId, supplierId));
}

export async function upsertSupplierCountries(supplierId: number, countryCodes: string[], isExcluded: boolean = false) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete existing countries
  await db.delete(supplierCoverageCountries).where(eq(supplierCoverageCountries.supplierId, supplierId));
  
  // Insert new countries
  if (countryCodes.length > 0) {
    await db.insert(supplierCoverageCountries).values(
      countryCodes.map(code => ({
        supplierId,
        countryCode: code,
        isExcluded: isExcluded ? 1 : 0,
      }))
    );
  }
}

// Tier 2: Priority Cities
export async function getSupplierPriorityCities(supplierId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(supplierPriorityCities).where(eq(supplierPriorityCities.supplierId, supplierId));
}

export async function addSupplierPriorityCity(city: InsertSupplierPriorityCity) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(supplierPriorityCities).values(city);
}

export async function deleteSupplierPriorityCity(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(supplierPriorityCities).where(eq(supplierPriorityCities.id, id));
}

// Tier 4: Response Times
export async function getSupplierResponseTimes(supplierId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(supplierResponseTimes).where(eq(supplierResponseTimes.supplierId, supplierId));
}

export async function upsertSupplierResponseTime(responseTime: InsertSupplierResponseTime) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Build where conditions
  const conditions = [
    eq(supplierResponseTimes.supplierId, responseTime.supplierId),
  ];
  
  if (responseTime.countryCode) {
    conditions.push(eq(supplierResponseTimes.countryCode, responseTime.countryCode));
  } else {
    conditions.push(sql`${supplierResponseTimes.countryCode} IS NULL`);
  }
  
  if (responseTime.cityName) {
    conditions.push(eq(supplierResponseTimes.cityName, responseTime.cityName));
  } else {
    conditions.push(sql`${supplierResponseTimes.cityName} IS NULL`);
  }
  
  // Check if exists
  const existing = await db.select().from(supplierResponseTimes)
    .where(and(...conditions));
  
  if (existing.length > 0) {
    // Update
    await db.update(supplierResponseTimes)
      .set({ responseTimeHours: responseTime.responseTimeHours, updatedAt: new Date() })
      .where(eq(supplierResponseTimes.id, existing[0]!.id));
  } else {
    // Insert
    await db.insert(supplierResponseTimes).values(responseTime);
  }
}

export async function deleteSupplierResponseTime(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(supplierResponseTimes).where(eq(supplierResponseTimes.id, id));
}
