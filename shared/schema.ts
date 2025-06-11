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

export const deduction = pgTable("deduction", {
  id: serial("id").primaryKey(),
  wbId: integer("wb_id").notNull(),
  bagId: integer("bag_id").notNull(),
  bags: integer("bags").notNull(),
  pb: decimal("pb", { precision: 10, scale: 2 }),
  percentage: decimal("percentage", { precision: 5, scale: 2 }),
  weight: decimal("weight", { precision: 10, scale: 2 }),
  total: decimal("total", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const salesDetails = pgTable("sales_details", {
  id: serial("id").primaryKey(),
  wbId: integer("wb_id").notNull(),
  doId: text("do_id").notNull(),
  doNo: text("do_no"),
  customerName: text("customer_name"),
  vehicleNo: text("vehicle_no"),
  doDate: text("do_date"),
  itemDescription: text("item_description"),
  dcQty: decimal("dc_qty", { precision: 10, scale: 2 }),
  doQty: decimal("do_qty", { precision: 10, scale: 2 }),
  branch: text("branch"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  userId: serial("user_id").primaryKey(),
  userNo: integer("user_no").notNull().unique(),
  userName: text("user_name").notNull().unique(),
  userPassword: text("user_password").notNull(),
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

export const insertDeductionSchema = createInsertSchema(deduction).omit({
  id: true,
  createdAt: true,
});

export const insertSalesDetailsSchema = createInsertSchema(salesDetails).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  userId: true,
  userNo: true,
  createdAt: true,
});

export const loginSchema = z.object({
  userName: z.string().min(1, "Username is required"),
  userPassword: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  userName: z.string().min(3, "Username must be at least 3 characters").max(50, "Username too long"),
  userPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.userPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type Camera = typeof cameras.$inferSelect;
export type InsertCamera = z.infer<typeof insertCameraSchema>;
export type StreamSession = typeof streamSessions.$inferSelect;
export type InsertStreamSession = z.infer<typeof insertStreamSessionSchema>;
export type StreamStats = typeof streamStats.$inferSelect;
export type InsertStreamStats = z.infer<typeof insertStreamStatsSchema>;
export type Deduction = typeof deduction.$inferSelect;
export type InsertDeduction = z.infer<typeof insertDeductionSchema>;
export type SalesDetails = typeof salesDetails.$inferSelect;
export type InsertSalesDetails = z.infer<typeof insertSalesDetailsSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;