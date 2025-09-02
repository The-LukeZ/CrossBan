import { Pool, type PoolClient, type QueryResultRow } from "pg";
import * as fs from "fs/promises";
import * as path from "path";
import { config } from "../config";
import { BanEvent, BanEventInsert, GuildBan, GuildBanInsert, GuildConfig, GuildConfigInsert } from "./types";
import { dbBanEventToObject, dbGuildBanToObject, dbGuildConfigToObject } from "./utils";
import { MySet } from "../utils/main";

export class DBManager {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({ connectionString: config.dbUrl, max: 10 });
  }

  async initialize(): Promise<void> {
    const client: PoolClient = await this.pool.connect();

    try {
      const files = await fs.readdir(path.join(__dirname, "./schemas"));
      const sqlFiles = files.filter((file) => file.endsWith(".sql"));

      for (const file of sqlFiles) {
        const filePath = path.join(__dirname, "./schemas", file);
        const sqlContent = await fs.readFile(filePath, "utf-8");

        await client.query(sqlContent);
        console.log(`Executed SQL file: ${file}`);
      }
    } catch (error) {
      console.error("Error initializing database:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  async query<R extends QueryResultRow = any>(text: string, params?: any[]) {
    return this.pool.query<R>(text, params);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  /* Guild Helpers */
  async setGuildConfig(record: GuildConfigInsert): Promise<GuildConfig> {
    const query = `
      INSERT INTO guilds (guild_id, enabled, auto_ban, unban_mode, logging_channel_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [
      record.guildId,
      record.enabled ?? true,
      record.autoBan ?? true,
      record.unbanMode ?? "AUTO",
      record.loggingChannelId ?? null,
    ];

    const res = await this.query(query, values);
    return dbGuildConfigToObject(res.rows[0]);
  }

  async updateGuildConfig(
    guildId: string,
    updates: Partial<Omit<GuildConfig, "guildId" | "createdAt">>,
  ): Promise<GuildConfig | null> {
    const setParts: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.enabled !== undefined) {
      setParts.push(`enabled = $${paramIndex++}`);
      values.push(updates.enabled);
    }
    if (updates.autoBan !== undefined) {
      setParts.push(`auto_ban = $${paramIndex++}`);
      values.push(updates.autoBan);
    }
    if (updates.unbanMode !== undefined) {
      setParts.push(`unban_mode = $${paramIndex++}`);
      values.push(updates.unbanMode);
    }
    if (updates.loggingChannelId !== undefined) {
      setParts.push(`logging_channel_id = $${paramIndex++}`);
      values.push(updates.loggingChannelId);
    }

    if (setParts.length === 0) {
      return this.getGuildConfig(guildId);
    }

    const query = `
    UPDATE guilds 
    SET ${setParts.join(", ")}
    WHERE guild_id = $${paramIndex}
    RETURNING *
  `;
    values.push(guildId);

    const result = await this.query(query, values);

    if (result.rows.length === 0) return null;

    return dbGuildConfigToObject(result.rows[0]);
  }

  async getAllGuildConfigs(): Promise<GuildConfig[]> {
    const result = await this.query("SELECT * FROM guilds");
    return result.rows.map(dbGuildConfigToObject);
  }

  async getGuildConfigsForAutoban(): Promise<GuildConfig[]> {
    const result = await this.query("SELECT * FROM guilds WHERE auto_ban = TRUE AND enabled = TRUE");
    return result.rows.map(dbGuildConfigToObject);
  }

  async getGuildConfig(guildId: string): Promise<GuildConfig | null> {
    const query = `
      SELECT * FROM guilds WHERE guild_id = $1
    `;
    const result = await this.query(query, [guildId]);

    if (result.rows.length === 0) return null;

    return dbGuildConfigToObject(result.rows[0]);
  }

  async addBan(record: BanEventInsert): Promise<BanEvent> {
    const query = `
      INSERT INTO ban_events (user_id, source_guild, source_user, reason)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [record.userId, record.sourceGuild, record.sourceUser, record.reason];

    const res = await this.query(query, values);
    return dbBanEventToObject(res.rows[0]);
  }

  async getBanById(id: bigint): Promise<BanEvent | null> {
    const query = `
      SELECT * FROM ban_events WHERE id = $1
    `;
    const result = await this.query(query, [id]);

    if (result.rows.length === 0) return null;

    return dbBanEventToObject(result.rows[0]);
  }

  async getBan(userId: string, onlyActive = true): Promise<BanEvent | null> {
    const result = await this.query("SELECT * FROM ban_events WHERE user_id = $1 AND revoked = $2", [userId, !onlyActive]);

    if (result.rows.length === 0) return null;

    return dbBanEventToObject(result.rows[0]);
  }

  async removeBan(userId: string): Promise<void> {
    await this.query("UPDATE ban_events SET revoked = TRUE WHERE user_id = $1 AND revoked = FALSE", [userId]);
  }

  async createGuildBan(data: GuildBanInsert): Promise<GuildBan> {
    const query = `
      INSERT INTO guild_bans (user_id, guild_id, is_banned, ban_event_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, guild_id, is_banned) 
      DO UPDATE SET 
        ban_event_id = EXCLUDED.ban_event_id,
        last_updated = NOW()
      RETURNING *
    `;
    const values = [data.userId, data.guildId, data.isBanned ?? true, data.banEventId ?? null];

    const res = await this.query(query, values);
    return dbGuildBanToObject(res.rows[0]);
  }

  async getGuildBan(userId: string, guildId: string): Promise<GuildBan | null> {
    const query = `
      SELECT * FROM guild_bans 
      WHERE user_id = $1 AND guild_id = $2 AND is_banned = TRUE
    `;
    const result = await this.query(query, [userId, guildId]);

    if (result.rows.length === 0) return null;

    return dbGuildBanToObject(result.rows[0]);
  }

  async removeGuildBan(userId: string, guildId: string): Promise<void> {
    await this.query("UPDATE guild_bans SET is_banned = FALSE, last_updated = NOW() WHERE user_id = $1 AND guild_id = $2", [userId, guildId]);
  }

  async getGuildBansForUser(userId: string): Promise<GuildBan[]> {
    const result = await this.query("SELECT * FROM guild_bans WHERE user_id = $1 AND is_banned = TRUE", [userId]);
    return result.rows.map(dbGuildBanToObject);
  }

  async getGuildBansForGuild(guildId: string): Promise<GuildBan[]> {
    const result = await this.query("SELECT * FROM guild_bans WHERE guild_id = $1 AND is_banned = TRUE", [guildId]);
    return result.rows.map(dbGuildBanToObject);
  }

  async getBanEventWithGuildBans(banEventId: bigint): Promise<{ banEvent: BanEvent; guildBans: GuildBan[] } | null> {
    const banEventResult = await this.query("SELECT * FROM ban_events WHERE id = $1", [banEventId]);
    
    if (banEventResult.rows.length === 0) return null;

    const guildBansResult = await this.query("SELECT * FROM guild_bans WHERE ban_event_id = $1", [banEventId]);

    return {
      banEvent: dbBanEventToObject(banEventResult.rows[0]),
      guildBans: guildBansResult.rows.map(dbGuildBanToObject)
    };
  }

  async isUserBannedInGuild(userId: string, guildId: string): Promise<boolean> {
    const result = await this.query("SELECT 1 FROM guild_bans WHERE user_id = $1 AND guild_id = $2 AND is_banned = TRUE", [userId, guildId]);
    return result.rows.length > 0;
  }

  async getSourcesOfTruth(guildId: string): Promise<MySet<string>> {
    const result = await this.query<{ user_id: string }>("SELECT user_id FROM truth_sources WHERE guild_id = $1", [guildId]);

    return new MySet(result.rows.map((row) => row.user_id));
  }

  async addSourcesOfTruth(author: string, guildId: string, ...sources: string[]): Promise<void> {
    if (sources.length === 0) return;

    const placeholders = sources
      .map((_, index) => {
        const base = index * 3;
        return `($${base + 1}, $${base + 2}, $${base + 3})`;
      })
      .join(", ");

    const query = `INSERT INTO truth_sources (guild_id, user_id, created_by) VALUES ${placeholders} ON CONFLICT DO NOTHING`;
    const values = sources.flatMap((source) => [guildId, source, author]);
    await this.query(query, values);
  }

  async removeSourcesOfTruth(guildId: string, ...userIds: string[]): Promise<void> {
    if (userIds.length === 0) return;

    const placeholders = userIds.map((_, index) => `$${index + 2}`).join(", ");
    const query = `DELETE FROM truth_sources WHERE guild_id = $1 AND user_id IN (${placeholders})`;
    const values = [guildId, ...userIds];
    await this.query(query, values);
  }
}

export const dbManager = new DBManager();
