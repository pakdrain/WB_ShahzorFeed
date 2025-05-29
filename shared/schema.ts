import { pgTable, text, serial, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
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

// Weighbridge Master Table
export const wbWeighbridge = pgTable("wb_weighbridge", {
  wbId: serial("wb_id").primaryKey(),
  slipNo: text("slip_no"),
  slipInTime: timestamp("slip_in_time"),
  firstWeight: numeric("first_weight", { precision: 10, scale: 2 }),
  secondWeight: numeric("second_weight", { precision: 10, scale: 2 }),
  netWeight: numeric("net_weight", { precision: 10, scale: 2 }),
  bardanaWeight: numeric("bardana_weight", { precision: 10, scale: 2 }),
  grossWeight: numeric("gross_weight", { precision: 10, scale: 2 }),
  freight: numeric("freight", { precision: 10, scale: 2 }),
  remarks: text("remarks"),
  driverName: text("driver_name"),
  vendor: text("vendor"),
  vehicleNo: text("vehicle_no"),
  igpNo: text("igp_no"),
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

// Weighbridge Purchase Items Table
export const wbWeighbridgeItemsPurchase = pgTable("wb_weighbridge_items_purchase", {
  wbItemPId: serial("wb_item_p_id").primaryKey(),
  wbId: integer("wb_id").references(() => wbWeighbridge.wbId),
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
  poQty: numeric("po_qty", { precision: 10, scale: 2 }),
  igpQty: numeric("igp_qty", { precision: 10, scale: 2 }),
  balanceQty: numeric("balance_qty", { precision: 10, scale: 2 }),
  bardanaType: text("bardana_type"),
  igpNo: text("igp_no"),
  manualIgpNo: text("manual_igp_no"),
  igpId: integer("igp_id"),
  vendorId: integer("vendor_id"),
  vendorName: text("vendor_name"),
  noOfBags: integer("no_of_bags"),
  weightPerBags: numeric("weight_per_bags", { precision: 10, scale: 2 }),
  bardanaWeight: numeric("bardana_weight", { precision: 10, scale: 2 }),
  igpDate: timestamp("igp_date"),
  qualityDeduction: numeric("quality_deduction", { precision: 10, scale: 2 }),
  supplierWeight: numeric("supplier_weight", { precision: 10, scale: 2 }),
  supWeightWthoutBardana: numeric("sup_weight_wthout_bardana", { precision: 10, scale: 2 }),
  netSupplierWeight: numeric("net_supplier_weight", { precision: 10, scale: 2 }),
  bagCondition: text("bag_condition"),
  bardanaTypeId: integer("bardana_type_id"),
});

// Images Table for storing purchase images
export const wbImages = pgTable("wb_images", {
  imageId: serial("image_id").primaryKey(),
  wbId: integer("wb_id").references(() => wbWeighbridge.wbId),
  imagePath: text("image_path").notNull(),
  imageType: text("image_type"), // 'camera', 'upload', etc.
  createdAt: timestamp("created_at").defaultNow(),
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

export const insertWbWeighbridgeSchema = createInsertSchema(wbWeighbridge).omit({
  wbId: true,
  creationDate: true,
  lastUpdatedDate: true,
});

export const insertWbWeighbridgeItemsPurchaseSchema = createInsertSchema(wbWeighbridgeItemsPurchase).omit({
  wbItemPId: true,
  creationDate: true,
  lastUpdatedDate: true,
});

export const insertWbImagesSchema = createInsertSchema(wbImages).omit({
  imageId: true,
  createdAt: true,
});

export type Camera = typeof cameras.$inferSelect;
export type InsertCamera = z.infer<typeof insertCameraSchema>;
export type StreamSession = typeof streamSessions.$inferSelect;
export type InsertStreamSession = z.infer<typeof insertStreamSessionSchema>;
export type StreamStats = typeof streamStats.$inferSelect;
export type InsertStreamStats = z.infer<typeof insertStreamStatsSchema>;

export type WbWeighbridge = typeof wbWeighbridge.$inferSelect;
export type InsertWbWeighbridge = z.infer<typeof insertWbWeighbridgeSchema>;
export type WbWeighbridgeItemsPurchase = typeof wbWeighbridgeItemsPurchase.$inferSelect;
export type InsertWbWeighbridgeItemsPurchase = z.infer<typeof insertWbWeighbridgeItemsPurchaseSchema>;
export type WbImages = typeof wbImages.$inferSelect;
export type InsertWbImages = z.infer<typeof insertWbImagesSchema>;
