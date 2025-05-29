import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const cameras = pgTable("cameras", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ip: text("ip").notNull(),
  port: integer("port").notNull(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  rtspUrl: text("rtsp_url").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const streamSessions = pgTable("stream_sessions", {
  id: serial("id").primaryKey(),
  cameraId: integer("camera_id").references(() => cameras.id),
  sessionId: text("session_id").notNull(),
  isActive: boolean("is_active").default(true),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
});

export const streamStats = pgTable("stream_stats", {
  id: serial("id").primaryKey(),
  cameraId: integer("camera_id").references(() => cameras.id),
  bandwidth: text("bandwidth"),
  fps: integer("fps"),
  latency: integer("latency"),
  droppedFrames: integer("dropped_frames").default(0),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Purchase System Tables
export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  slipNo: text("slip_no"),
  slipInTime: timestamp("slip_in_time"),
  firstWeight: decimal("first_weight", { precision: 10, scale: 2 }),
  secondWeight: decimal("second_weight", { precision: 10, scale: 2 }),
  netWeight: decimal("net_weight", { precision: 10, scale: 2 }),
  bardanaWeight: decimal("bardana_weight", { precision: 10, scale: 2 }),
  grossWeight: decimal("gross_weight", { precision: 10, scale: 2 }),
  freight: decimal("freight", { precision: 10, scale: 2 }),
  remarks: text("remarks"),
  poNo: text("po_no"),
  driverName: text("driver_name"),
  vendor: text("vendor"),
  companyId: integer("company_id"),
  branchId: integer("branch_id"),
  onlineEntry: text("online_entry"),
  offlineEntry: text("offline_entry"),
  createdBy: integer("created_by"),
  creationDate: timestamp("creation_date").defaultNow(),
  lastUpdatedBy: integer("last_updated_by"),
  lastUpdatedDate: timestamp("last_updated_date").defaultNow(),
  manualDcNo: text("manual_dc_no"),
  entryType: text("entry_type"),
  slipOutTime: timestamp("slip_out_time"),
  status: text("status"),
  slipDate: timestamp("slip_date"),
});

export const purchaseItems = pgTable("purchase_items", {
  id: serial("id").primaryKey(),
  wbItemPId: integer("wb_item_p_id"),
  wbId: integer("wb_id"),
  manualDcNo: text("manual_dc_no"),
  doId: integer("do_id"),
  doNo: text("do_no"),
  customerId: integer("customer_id"),
  customerName: text("customer_name"),
  vehicleNo: text("vehicle_no"),
  doDate: timestamp("do_date"),
  itemId: integer("item_id"),
  itemCode: text("item_code"),
  itemDesc: text("item_desc"),
  createdBy: integer("created_by"),
  creationDate: timestamp("creation_date").defaultNow(),
  lastUpdatedBy: integer("last_updated_by"),
  lastUpdatedDate: timestamp("last_updated_date").defaultNow(),
  poId: integer("po_id"),
  poNo: text("po_no"),
  poQty: decimal("po_qty", { precision: 10, scale: 2 }),
  igpQty: decimal("igp_qty", { precision: 10, scale: 2 }),
  balanceQty: decimal("balance_qty", { precision: 10, scale: 2 }),
  baradanaType: text("baradana_type"),
  igpNo: text("igp_no"),
  manualIgpNo: text("manual_igp_no"),
  igpId: integer("igp_id"),
  vendorId: integer("vendor_id"),
  vendorName: text("vendor_name"),
  noOfBags: decimal("no_of_bags", { precision: 10, scale: 2 }),
  weightPerBags: decimal("weight_per_bags", { precision: 10, scale: 2 }),
  bardanaWeight: decimal("bardana_weight", { precision: 10, scale: 2 }),
  igpDate: timestamp("igp_date"),
  qualityDeduction: decimal("quality_deduction", { precision: 10, scale: 2 }),
  supplierWeight: decimal("supplier_weight", { precision: 10, scale: 2 }),
  supWeightWithoutBardana: decimal("sup_weight_without_bardana", { precision: 10, scale: 2 }),
  netSupplierWeight: decimal("net_supplier_weight", { precision: 10, scale: 2 }),
  bagCondition: text("bag_condition"),
  bardanaTypeId: integer("bardana_type_id"),
});

export const insertCameraSchema = createInsertSchema(cameras).omit({
  id: true,
  createdAt: true,
});

export const insertStreamSessionSchema = createInsertSchema(streamSessions).omit({
  id: true,
  startedAt: true,
  endedAt: true,
});

export const insertStreamStatsSchema = createInsertSchema(streamStats).omit({
  id: true,
  timestamp: true,
});

export const insertPurchaseSchema = createInsertSchema(purchases).omit({
  id: true,
  creationDate: true,
  lastUpdatedDate: true,
});

export const insertPurchaseItemSchema = createInsertSchema(purchaseItems).omit({
  id: true,
  creationDate: true,
  lastUpdatedDate: true,
});

export type Camera = typeof cameras.$inferSelect;
export type InsertCamera = z.infer<typeof insertCameraSchema>;
export type StreamSession = typeof streamSessions.$inferSelect;
export type InsertStreamSession = z.infer<typeof insertStreamSessionSchema>;
export type StreamStats = typeof streamStats.$inferSelect;
export type InsertStreamStats = z.infer<typeof insertStreamStatsSchema>;
export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type PurchaseItem = typeof purchaseItems.$inferSelect;
export type InsertPurchaseItem = z.infer<typeof insertPurchaseItemSchema>;
