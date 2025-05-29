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

export type Camera = typeof cameras.$inferSelect;
export type InsertCamera = z.infer<typeof insertCameraSchema>;
export type StreamSession = typeof streamSessions.$inferSelect;
export type InsertStreamSession = z.infer<typeof insertStreamSessionSchema>;
export type StreamStats = typeof streamStats.$inferSelect;
export type InsertStreamStats = z.infer<typeof insertStreamStatsSchema>;
