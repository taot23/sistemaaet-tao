import { pgTable, text, serial, integer, boolean, timestamp, json, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true,
  createdAt: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Vehicle types
export const vehicleTypes = [
  "Unidade Tratora (Cavalo)",
  "Semirreboque",
  "Reboque",
  "Dolly",
  "Prancha"
] as const;

export const vehicleTypeSchema = z.enum(vehicleTypes);
export type VehicleType = z.infer<typeof vehicleTypeSchema>;

// Vehicles
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  licensePlate: text("license_plate").notNull().unique(),
  vehicleType: text("vehicle_type").notNull(),
  weight: integer("weight").notNull(), // Tara in kg
  documentYear: integer("document_year").notNull(), // CRLV year
  documentUrl: text("document_url"), // URL to PDF/image of CRLV
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  createdAt: true
});

export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;

// License types
export const licenseSetTypes = [
  "Rodotrem 9 eixos",
  "Bitrem 9 eixos",
  "Bitrem 7 eixos",
  "Bitrem 6 eixos",
  "Prancha"
] as const;

export const licenseSetTypeSchema = z.enum(licenseSetTypes);
export type LicenseSetType = z.infer<typeof licenseSetTypeSchema>;

// License statuses
export const licenseStatuses = [
  "Pendente Cadastro",
  "Cadastro em Andamento",
  "Reprovado – Pendência de Documentação",
  "Análise do Órgão",
  "Pendente Liberação",
  "Liberada"
] as const;

export const licenseStatusSchema = z.enum(licenseStatuses);
export type LicenseStatus = z.infer<typeof licenseStatusSchema>;

// States
export const states = [
  "SP", "MG", "MT", "PE", "TO", "MS", "PR", "ES", 
  "DNIT", "RS", "BA", "PA", "SC", "DF", "MA", 
  "GO", "RJ", "CE", "AL", "SE"
] as const;

export const stateSchema = z.enum(states);
export type State = z.infer<typeof stateSchema>;

// Licenses
export const licenses = pgTable("licenses", {
  id: serial("id").primaryKey(),
  licenseNumber: text("license_number"),
  isDraft: boolean("is_draft").default(true).notNull(),
  setType: text("set_type").notNull(),
  primaryVehicleId: integer("primary_vehicle_id").notNull().references(() => vehicles.id),
  firstTrailerId: integer("first_trailer_id").references(() => vehicles.id),
  dollyId: integer("dolly_id").references(() => vehicles.id),
  secondTrailerId: integer("second_trailer_id").references(() => vehicles.id),
  setLength: text("set_length").notNull(),
  states: json("states").notNull().$type<State[]>(),
  status: text("status").default("Pendente Cadastro").notNull(),
  licenseFileUrl: text("license_file_url"),
  issueDate: timestamp("issue_date"),
  expirationDate: timestamp("expiration_date"),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertLicenseSchema = createInsertSchema(licenses).omit({
  id: true,
  licenseNumber: true,
  licenseFileUrl: true,
  issueDate: true,
  expirationDate: true,
  createdAt: true,
  updatedAt: true
});

export type InsertLicense = z.infer<typeof insertLicenseSchema>;
export type License = typeof licenses.$inferSelect;

// Activities
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  licenseId: integer("license_id").references(() => licenses.id),
  vehicleId: integer("vehicle_id").references(() => vehicles.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true
});

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;
