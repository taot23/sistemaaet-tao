import { users, type User, type InsertUser, 
         vehicles, type Vehicle, type InsertVehicle,
         licenses, type License, type InsertLicense,
         activities, type Activity, type InsertActivity } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Vehicle operations
  getVehicle(id: number): Promise<Vehicle | undefined>;
  getVehicleByLicensePlate(licensePlate: string): Promise<Vehicle | undefined>;
  getVehiclesByUserId(userId: number): Promise<Vehicle[]>;
  getVehiclesByType(type: string, userId: number): Promise<Vehicle[]>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: number): Promise<boolean>;
  
  // License operations
  getLicense(id: number): Promise<License | undefined>;
  getLicensesByUserId(userId: number): Promise<License[]>;
  getDraftLicensesByUserId(userId: number): Promise<License[]>;
  getInProgressLicensesByUserId(userId: number): Promise<License[]>;
  getCompletedLicensesByUserId(userId: number): Promise<License[]>;
  createLicense(license: InsertLicense): Promise<License>;
  updateLicense(id: number, license: Partial<InsertLicense>): Promise<License | undefined>;
  deleteLicense(id: number): Promise<boolean>;
  
  // Activity operations
  getActivitiesByUserId(userId: number, limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Dashboard statistics
  getUserStats(userId: number): Promise<{
    licenseCount: number,
    pendingLicenses: number,
    vehicleCount: number
  }>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private vehicles: Map<number, Vehicle>;
  private licenses: Map<number, License>;
  private activities: Map<number, Activity>;
  private userIdCounter: number;
  private vehicleIdCounter: number;
  private licenseIdCounter: number;
  private activityIdCounter: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.vehicles = new Map();
    this.licenses = new Map();
    this.activities = new Map();
    this.userIdCounter = 1;
    this.vehicleIdCounter = 1;
    this.licenseIdCounter = 1;
    this.activityIdCounter = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { ...userData, id, createdAt };
    this.users.set(id, user);
    return user;
  }

  // Vehicle operations
  async getVehicle(id: number): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }

  async getVehicleByLicensePlate(licensePlate: string): Promise<Vehicle | undefined> {
    return Array.from(this.vehicles.values()).find(vehicle => 
      vehicle.licensePlate.toLowerCase() === licensePlate.toLowerCase()
    );
  }

  async getVehiclesByUserId(userId: number): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values()).filter(vehicle => vehicle.userId === userId);
  }

  async getVehiclesByType(type: string, userId: number): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values()).filter(vehicle => 
      vehicle.vehicleType === type && vehicle.userId === userId
    );
  }

  async createVehicle(vehicleData: InsertVehicle): Promise<Vehicle> {
    const id = this.vehicleIdCounter++;
    const createdAt = new Date();
    const vehicle: Vehicle = { ...vehicleData, id, createdAt };
    this.vehicles.set(id, vehicle);
    return vehicle;
  }

  async updateVehicle(id: number, vehicleData: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const existingVehicle = this.vehicles.get(id);
    if (!existingVehicle) return undefined;

    const updatedVehicle = { ...existingVehicle, ...vehicleData };
    this.vehicles.set(id, updatedVehicle);
    return updatedVehicle;
  }

  async deleteVehicle(id: number): Promise<boolean> {
    return this.vehicles.delete(id);
  }

  // License operations
  async getLicense(id: number): Promise<License | undefined> {
    return this.licenses.get(id);
  }

  async getLicensesByUserId(userId: number): Promise<License[]> {
    return Array.from(this.licenses.values()).filter(license => license.userId === userId);
  }

  async getDraftLicensesByUserId(userId: number): Promise<License[]> {
    return Array.from(this.licenses.values()).filter(license => 
      license.userId === userId && license.isDraft === true
    );
  }

  async getInProgressLicensesByUserId(userId: number): Promise<License[]> {
    return Array.from(this.licenses.values()).filter(license => 
      license.userId === userId && 
      license.isDraft === false && 
      license.status !== "Liberada"
    );
  }

  async getCompletedLicensesByUserId(userId: number): Promise<License[]> {
    return Array.from(this.licenses.values()).filter(license => 
      license.userId === userId && 
      license.isDraft === false && 
      license.status === "Liberada"
    );
  }

  async createLicense(licenseData: InsertLicense): Promise<License> {
    const id = this.licenseIdCounter++;
    const createdAt = new Date();
    const updatedAt = new Date();
    let licenseNumber: string | null = null;
    
    if (!licenseData.isDraft) {
      licenseNumber = `AET-${new Date().getFullYear()}-${id.toString().padStart(4, '0')}`;
    }
    
    const license: License = { 
      ...licenseData, 
      id, 
      licenseNumber, 
      createdAt, 
      updatedAt,
      licenseFileUrl: null,
      issueDate: null,
      expirationDate: null
    };
    
    this.licenses.set(id, license);
    return license;
  }

  async updateLicense(id: number, licenseData: Partial<InsertLicense>): Promise<License | undefined> {
    const existingLicense = this.licenses.get(id);
    if (!existingLicense) return undefined;

    // If transitioning from draft to actual license, generate license number
    let licenseNumber = existingLicense.licenseNumber;
    if (existingLicense.isDraft && licenseData.isDraft === false) {
      licenseNumber = `AET-${new Date().getFullYear()}-${id.toString().padStart(4, '0')}`;
    }

    const updatedLicense = { 
      ...existingLicense, 
      ...licenseData, 
      licenseNumber,
      updatedAt: new Date() 
    };
    
    this.licenses.set(id, updatedLicense);
    return updatedLicense;
  }

  async deleteLicense(id: number): Promise<boolean> {
    return this.licenses.delete(id);
  }

  // Activity operations
  async getActivitiesByUserId(userId: number, limit?: number): Promise<Activity[]> {
    const activities = Array.from(this.activities.values())
      .filter(activity => activity.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return limit ? activities.slice(0, limit) : activities;
  }

  async createActivity(activityData: InsertActivity): Promise<Activity> {
    const id = this.activityIdCounter++;
    const createdAt = new Date();
    const activity: Activity = { ...activityData, id, createdAt };
    this.activities.set(id, activity);
    return activity;
  }

  // Dashboard statistics
  async getUserStats(userId: number): Promise<{
    licenseCount: number,
    pendingLicenses: number,
    vehicleCount: number
  }> {
    const userLicenses = await this.getLicensesByUserId(userId);
    const completedLicenses = userLicenses.filter(license => 
      license.isDraft === false && license.status === "Liberada"
    );
    const pendingLicenses = userLicenses.filter(license => 
      license.isDraft === false && license.status !== "Liberada"
    );
    const userVehicles = await this.getVehiclesByUserId(userId);

    return {
      licenseCount: completedLicenses.length,
      pendingLicenses: pendingLicenses.length,
      vehicleCount: userVehicles.length
    };
  }
}

export const storage = new MemStorage();
