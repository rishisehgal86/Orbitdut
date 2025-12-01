import { relations } from "drizzle-orm/relations";
import { users, jobs, suppliers, payments, reviews, supplierCoverageCountries, supplierPriorityCities, supplierRates, supplierResponseTimeExclusions, supplierResponseTimes, supplierServiceExclusions } from "./schema";

export const jobsRelations = relations(jobs, ({one, many}) => ({
	user: one(users, {
		fields: [jobs.customerId],
		references: [users.id]
	}),
	supplier: one(suppliers, {
		fields: [jobs.assignedSupplierId],
		references: [suppliers.id]
	}),
	payments: many(payments),
	reviews: many(reviews),
}));

export const usersRelations = relations(users, ({many}) => ({
	jobs: many(jobs),
	reviews: many(reviews),
}));

export const suppliersRelations = relations(suppliers, ({many}) => ({
	jobs: many(jobs),
	reviews: many(reviews),
	supplierCoverageCountries: many(supplierCoverageCountries),
	supplierPriorityCities: many(supplierPriorityCities),
	supplierRates: many(supplierRates),
	supplierResponseTimeExclusions: many(supplierResponseTimeExclusions),
	supplierResponseTimes: many(supplierResponseTimes),
	supplierServiceExclusions: many(supplierServiceExclusions),
}));

export const paymentsRelations = relations(payments, ({one}) => ({
	job: one(jobs, {
		fields: [payments.jobId],
		references: [jobs.id]
	}),
}));

export const reviewsRelations = relations(reviews, ({one}) => ({
	job: one(jobs, {
		fields: [reviews.jobId],
		references: [jobs.id]
	}),
	supplier: one(suppliers, {
		fields: [reviews.supplierId],
		references: [suppliers.id]
	}),
	user: one(users, {
		fields: [reviews.customerId],
		references: [users.id]
	}),
}));

export const supplierCoverageCountriesRelations = relations(supplierCoverageCountries, ({one}) => ({
	supplier: one(suppliers, {
		fields: [supplierCoverageCountries.supplierId],
		references: [suppliers.id]
	}),
}));

export const supplierPriorityCitiesRelations = relations(supplierPriorityCities, ({one, many}) => ({
	supplier: one(suppliers, {
		fields: [supplierPriorityCities.supplierId],
		references: [suppliers.id]
	}),
	supplierRates: many(supplierRates),
	supplierServiceExclusions: many(supplierServiceExclusions),
}));

export const supplierRatesRelations = relations(supplierRates, ({one}) => ({
	supplier: one(suppliers, {
		fields: [supplierRates.supplierId],
		references: [suppliers.id]
	}),
	supplierPriorityCity: one(supplierPriorityCities, {
		fields: [supplierRates.cityId],
		references: [supplierPriorityCities.id]
	}),
}));

export const supplierResponseTimeExclusionsRelations = relations(supplierResponseTimeExclusions, ({one}) => ({
	supplier: one(suppliers, {
		fields: [supplierResponseTimeExclusions.supplierId],
		references: [suppliers.id]
	}),
}));

export const supplierResponseTimesRelations = relations(supplierResponseTimes, ({one}) => ({
	supplier: one(suppliers, {
		fields: [supplierResponseTimes.supplierId],
		references: [suppliers.id]
	}),
}));

export const supplierServiceExclusionsRelations = relations(supplierServiceExclusions, ({one}) => ({
	supplier: one(suppliers, {
		fields: [supplierServiceExclusions.supplierId],
		references: [suppliers.id]
	}),
	supplierPriorityCity: one(supplierPriorityCities, {
		fields: [supplierServiceExclusions.cityId],
		references: [supplierPriorityCities.id]
	}),
}));