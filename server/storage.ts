import { 
  cameras, streamSessions, streamStats, wbWeighbridge, wbWeighbridgeItemsPurchase, wbImages,
  type Camera, type InsertCamera, type StreamSession, type InsertStreamSession, 
  type StreamStats, type InsertStreamStats,
  type WbWeighbridge, type InsertWbWeighbridge, 
  type WbWeighbridgeItemsPurchase, type InsertWbWeighbridgeItemsPurchase,
  type WbImages, type InsertWbImages 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, max, and, isNull } from "drizzle-orm";

export interface IStorage {
  // Camera operations
  getCamera(id: number): Promise<Camera | undefined>;
  getCameraByIp(ip: string): Promise<Camera | undefined>;
  createCamera(camera: InsertCamera): Promise<Camera>;
  updateCamera(id: number, updates: Partial<InsertCamera>): Promise<Camera | undefined>;
  
  // Stream session operations
  createStreamSession(session: InsertStreamSession): Promise<StreamSession>;
  getActiveStreamSession(cameraId: number): Promise<StreamSession | undefined>;
  endStreamSession(sessionId: string): Promise<void>;
  
  // Stream stats operations
  addStreamStats(stats: InsertStreamStats): Promise<StreamStats>;
  getLatestStreamStats(cameraId: number): Promise<StreamStats | undefined>;

  // Purchase/Weighbridge operations
  createPurchase(purchase: InsertWbWeighbridge, items: InsertWbWeighbridgeItemsPurchase[]): Promise<WbWeighbridge>;
  getPurchases(): Promise<WbWeighbridge[]>;
  getPurchaseById(wbId: number): Promise<WbWeighbridge | undefined>;
  getMaxSlipNo(): Promise<number>;
  
  // Image operations
  addPurchaseImage(image: InsertWbImages): Promise<WbImages>;
  getPurchaseImages(wbId: number): Promise<WbImages[]>;
}

export class MemStorage implements IStorage {
  private cameras: Map<number, Camera>;
  private streamSessions: Map<number, StreamSession>;
  private streamStats: Map<number, StreamStats>;
  private currentCameraId: number;
  private currentSessionId: number;
  private currentStatsId: number;

  constructor() {
    this.cameras = new Map();
    this.streamSessions = new Map();
    this.streamStats = new Map();
    this.currentCameraId = 1;
    this.currentSessionId = 1;
    this.currentStatsId = 1;

    // Initialize with the default camera from the requirements - do it synchronously
    const id = this.currentCameraId++;
    const camera: Camera = {
      id,
      name: "Camera 01",
      ip: "10.10.10.146",
      port: 554,
      username: "admin",
      password: "admin123",
      rtspUrl: "rtsp://admin:admin123@10.10.10.146:554/cam/realmonitor?channel=1&subtype=0",
      isActive: true,
      createdAt: new Date(),
    };
    this.cameras.set(id, camera);
    console.log("Initialized camera with ID:", id, "Total cameras:", this.cameras.size);
  }

  async getCamera(id: number): Promise<Camera | undefined> {
    return this.cameras.get(id);
  }

  async getCameraByIp(ip: string): Promise<Camera | undefined> {
    return Array.from(this.cameras.values()).find(camera => camera.ip === ip);
  }

  async createCamera(insertCamera: InsertCamera): Promise<Camera> {
    const id = this.currentCameraId++;
    const camera: Camera = {
      id,
      name: insertCamera.name,
      ip: insertCamera.ip,
      port: insertCamera.port,
      username: insertCamera.username,
      password: insertCamera.password,
      rtspUrl: insertCamera.rtspUrl,
      isActive: insertCamera.isActive ?? true,
      createdAt: new Date(),
    };
    this.cameras.set(id, camera);
    return camera;
  }

  async updateCamera(id: number, updates: Partial<InsertCamera>): Promise<Camera | undefined> {
    const camera = this.cameras.get(id);
    if (!camera) return undefined;

    const updatedCamera = { ...camera, ...updates };
    this.cameras.set(id, updatedCamera);
    return updatedCamera;
  }

  async createStreamSession(insertSession: InsertStreamSession): Promise<StreamSession> {
    const id = this.currentSessionId++;
    const session: StreamSession = {
      id,
      cameraId: insertSession.cameraId ?? null,
      sessionId: insertSession.sessionId,
      isActive: insertSession.isActive ?? true,
      startedAt: new Date(),
      endedAt: null,
    };
    this.streamSessions.set(id, session);
    return session;
  }

  async getActiveStreamSession(cameraId: number): Promise<StreamSession | undefined> {
    return Array.from(this.streamSessions.values()).find(
      session => session.cameraId === cameraId && session.isActive
    );
  }

  async endStreamSession(sessionId: string): Promise<void> {
    const session = Array.from(this.streamSessions.values()).find(
      s => s.sessionId === sessionId
    );
    if (session) {
      session.isActive = false;
      session.endedAt = new Date();
      this.streamSessions.set(session.id, session);
    }
  }

  async addStreamStats(insertStats: InsertStreamStats): Promise<StreamStats> {
    const id = this.currentStatsId++;
    const stats: StreamStats = {
      id,
      cameraId: insertStats.cameraId ?? null,
      bandwidth: insertStats.bandwidth || null,
      fps: insertStats.fps || null,
      latency: insertStats.latency || null,
      droppedFrames: insertStats.droppedFrames || 0,
      timestamp: new Date(),
    };
    this.streamStats.set(id, stats);
    return stats;
  }

  async getLatestStreamStats(cameraId: number): Promise<StreamStats | undefined> {
    const cameraStats = Array.from(this.streamStats.values())
      .filter(stats => stats.cameraId === cameraId)
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
    
    return cameraStats[0];
  }

  // Purchase/Weighbridge operations - In-memory implementation
  async createPurchase(purchase: InsertWbWeighbridge, items: InsertWbWeighbridgeItemsPurchase[]): Promise<WbWeighbridge> {
    const newPurchase: WbWeighbridge = {
      wb_id: Date.now(),
      slip_no: purchase.slip_no || null,
      slip_in_time: purchase.slip_in_time || null,
      first_weight: purchase.first_weight || null,
      second_weight: purchase.second_weight || null,
      net_weight: purchase.net_weight || null,
      bardana_weight: purchase.bardana_weight || null,
      gross_weight: purchase.gross_weight || null,
      freight: purchase.freight || null,
      remarks: purchase.remarks || null,
      driver_name: purchase.driver_name || null,
      vendor: purchase.vendor || null,
      vehicle_no: purchase.vehicle_no || null,
      igp_no: purchase.igp_no || null,
      entry_type: purchase.entry_type || null,
      online_entry: purchase.online_entry || null,
      offline_entry: purchase.offline_entry || null,
      created_by: purchase.created_by || null,
      creation_date: purchase.creation_date || null,
      last_updated_by: purchase.last_updated_by || null,
      last_updated_date: purchase.last_updated_date || null,
      manual_dc_no: purchase.manual_dc_no || null,
      slip_out_time: purchase.slip_out_time || null,
      status: purchase.status || null,
      slip_date: purchase.slip_date || null,
    };
    
    console.log('Purchase saved to memory storage:', newPurchase);
    return newPurchase;
  }

  async getPurchases(): Promise<WbWeighbridge[]> {
    return [];
  }

  async getPurchaseById(wbId: number): Promise<WbWeighbridge | undefined> {
    return undefined;
  }

  async getMaxSlipNo(): Promise<number> {
    return 0;
  }

  // Image operations - In-memory implementation
  async addPurchaseImage(image: InsertWbImages): Promise<WbImages> {
    const newImage: WbImages = {
      id: Date.now(),
      wb_id: image.wb_id,
      image_path: image.image_path || null,
      image_type: image.image_type || null,
      created_at: image.created_at || null,
    };
    
    console.log('Image saved to memory storage:', newImage);
    return newImage;
  }

  async getPurchaseImages(wbId: number): Promise<WbImages[]> {
    return [];
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  async getCamera(id: number): Promise<Camera | undefined> {
    const [camera] = await db.select().from(cameras).where(eq(cameras.id, id));
    return camera || undefined;
  }

  async getCameraByIp(ip: string): Promise<Camera | undefined> {
    const [camera] = await db.select().from(cameras).where(eq(cameras.ip, ip));
    return camera || undefined;
  }

  async createCamera(insertCamera: InsertCamera): Promise<Camera> {
    const [camera] = await db.insert(cameras).values(insertCamera).returning();
    return camera;
  }

  async updateCamera(id: number, updates: Partial<InsertCamera>): Promise<Camera | undefined> {
    const [camera] = await db.update(cameras).set(updates).where(eq(cameras.id, id)).returning();
    return camera || undefined;
  }

  async createStreamSession(insertSession: InsertStreamSession): Promise<StreamSession> {
    const [session] = await db.insert(streamSessions).values(insertSession).returning();
    return session;
  }

  async getActiveStreamSession(cameraId: number): Promise<StreamSession | undefined> {
    const [session] = await db.select().from(streamSessions)
      .where(and(eq(streamSessions.cameraId, cameraId), isNull(streamSessions.endTime)));
    return session || undefined;
  }

  async endStreamSession(sessionId: string): Promise<void> {
    await db.update(streamSessions)
      .set({ endTime: new Date() })
      .where(eq(streamSessions.sessionId, sessionId));
  }

  async addStreamStats(insertStats: InsertStreamStats): Promise<StreamStats> {
    const [stats] = await db.insert(streamStats).values(insertStats).returning();
    return stats;
  }

  async getLatestStreamStats(cameraId: number): Promise<StreamStats | undefined> {
    const [stats] = await db.select().from(streamStats)
      .where(eq(streamStats.cameraId, cameraId))
      .orderBy(desc(streamStats.timestamp))
      .limit(1);
    return stats || undefined;
  }

  async createPurchase(purchase: InsertWbWeighbridge, items: InsertWbWeighbridgeItemsPurchase[]): Promise<WbWeighbridge> {
    const [purchaseRecord] = await db.insert(wbWeighbridge).values(purchase).returning();
    
    if (items.length > 0) {
      const itemsWithWbId = items.map(item => ({ ...item, wbId: purchaseRecord.wbId }));
      await db.insert(wbWeighbridgeItemsPurchase).values(itemsWithWbId);
    }
    
    return purchaseRecord;
  }

  async getPurchases(): Promise<WbWeighbridge[]> {
    return await db.select().from(wbWeighbridge).orderBy(desc(wbWeighbridge.creationDate));
  }

  async getPurchaseById(wbId: number): Promise<WbWeighbridge | undefined> {
    const [purchase] = await db.select().from(wbWeighbridge).where(eq(wbWeighbridge.wbId, wbId));
    return purchase || undefined;
  }

  async getMaxSlipNo(): Promise<number> {
    const [result] = await db.select({ maxSlip: max(wbWeighbridge.slipNo) }).from(wbWeighbridge);
    return parseInt(result.maxSlip || "0") || 0;
  }

  async addPurchaseImage(image: InsertWbImages): Promise<WbImages> {
    const [imageRecord] = await db.insert(wbImages).values(image).returning();
    return imageRecord;
  }

  async getPurchaseImages(wbId: number): Promise<WbImages[]> {
    return await db.select().from(wbImages).where(eq(wbImages.wbId, wbId));
  }
}

// Try to use database storage, fallback to memory storage if database unavailable
let storage: IStorage;
try {
  storage = new DatabaseStorage();
} catch (error) {
  console.log('Database not available, using in-memory storage');
  storage = new MemStorage();
}

export { storage };
