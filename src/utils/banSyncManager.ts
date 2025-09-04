import type { Client, Guild, User } from "discord.js";
import { GuildConfig, type BanEvent, type BanEventInsert } from "../database/types";
import { dbManager } from "../database/manager";
import { getUnbanLogger, UnbanMessageType } from "./unbanLogger";
import { sendLog } from "./logger";

class BanSyncManager {
  private client?: Client<true>;
  private _enabled: boolean = false;

  constructor(client?: Client<true>) {
    this.client = client;
  }

  get enabled() {
    return this._enabled;
  }

  enable() {
    this._enabled = true;
  }

  disable() {
    this._enabled = false;
  }

  setClient(client: Client<true>) {
    this.client = client;
  }

  async handleBan(data: BanEventInsert): Promise<void> {
    if (!this.enabled) return;

    const banEvent = await dbManager.addBanEvent(data);
    await dbManager.createGuildBan({
      banEventId: banEvent.id,
      guildId: data.sourceGuild,
      isBanned: true,
      userId: data.userId,
      isSource: true,
      appliedAt: banEvent.createdAt,
    });
    sendLog(["Ban event created", banEvent, "Syncing..."]);
    await this.syncBanToGuilds(banEvent, data.sourceGuild);
  }

  private async syncBanToGuilds(event: BanEvent, sourceGuildId: string): Promise<void> {
    if (!this.enabled) return;
    if (!this.client) {
      console.error("BanSyncManager: Client not set. Cannot sync bans.");
      throw new Error("BanSyncManager: Client not set. Cannot sync bans.");
    }

    // Get all guild configs that have auto-ban enabled, excluding the source guild
    const autoBanGuilds = await dbManager.getGuildConfigsForAutoban();
    const targetGuilds = autoBanGuilds.filter((config) => config.guildId !== sourceGuildId);
    sendLog([
      "Found auto_ban guilds for ban sync:",
      ...autoBanGuilds.map((config) => config.guildId),
      "Target guilds filtered:",
      ...targetGuilds.map((config) => config.guildId),
      "Starting ban sync...",
    ]);

    const successfulGuildIds: string[] = [];
    for (const guildConfig of targetGuilds) {
      const logs = [`Syncing ban to guild ${guildConfig.guildId}...`];
      const guild = this.client.guilds.cache.get(guildConfig.guildId);

      if (!guild || !guild.available) {
        logs.push(`Failed to sync ban to guild ${guildConfig.guildId}: Guild not found or unavailable.`);
        console.error(`Failed to sync ban to guild ${guildConfig.guildId}: Guild not found or unavailable.`);
        sendLog(logs);
        continue;
      }

      try {
        logs.push(`Banning user ${event.userId} in guild ${guild.name} (${guild.id})`);
        await guild.bans.create(event.userId, {
          reason: `Synced ban from source ${event.sourceGuild}. Reason: ${event.reason}`,
        });
        logs.push(`Successfully synced ban to guild ${guild.name}`);
        successfulGuildIds.push(guildConfig.guildId);
        console.log(`Successfully synced ban to guild ${guild.name}`);
      } catch (error) {
        console.error(`Failed to sync ban to guild ${guildConfig.guildId}:`, error);
      } finally {
        sendLog(logs);
      }
    }

    if (successfulGuildIds.length > 0) {
      sendLog(["Successfully synced bans to guilds:", ...successfulGuildIds.map((id) => `- ${id}`)]);
      for (const guildId of successfulGuildIds) {
        await dbManager.createGuildBan({
          userId: event.userId,
          guildId: guildId,
          isBanned: true,
          banEventId: event.id,
        });
      }
    }
  }

  private async syncUnbanToGuilds(ban: BanEvent, sourceGuild: Guild, executorId: string): Promise<void> {
    // Get all guild configs where unbanning should occur, excluding the source guild
    const guildCfgs = await dbManager.getAllGuildConfigs();
    const targetCfgs = guildCfgs.filter((cfg) => cfg.guildId !== sourceGuild.id);
    sendLog(["Found target guilds for unban sync:", ...targetCfgs.map((config) => config.guildId)]);

    // Implement unban logic here
    for (const cfg of targetCfgs) {
      const logs = [`Unbanning user ${ban.userId} in guild ${cfg.guildId}`];

      const isBanned = await dbManager.isUserBannedInGuild(ban.userId, cfg.guildId);
      if (!isBanned) {
        logs.push(`User ${ban.userId} is not banned in guild ${cfg.guildId}. Skipping.`);
        sendLog(logs);
        continue;
      }

      if (cfg.unbanMode === "AUTO") {
        logs.push(`Auto-unban mode: Proceeding to unban user in guild ${cfg.guildId}`);
        await this.reallyUnbanUserFromGuild(ban.userId, cfg.guildId);
      } else {
        logs.push(`Manual unban mode: Logging unban action for guild ${cfg.guildId}`);
        const hasSent = await this.sendUnbanLogToServer(ban, sourceGuild, cfg, executorId);
        logs.push(`Unban log ${hasSent ? "successfully" : "failed"} sent for guild ${cfg.guildId}`);
      }
      sendLog(logs);
    }
  }

  private async reallyUnbanUserFromGuild(userId: string, guildId: string): Promise<void> {
    const guild = this.client?.guilds.cache.get(guildId);
    if (!guild) return;

    try {
      await guild.bans.remove(userId, `Synced unban from ${guildId}`);
      console.log(`Successfully unbanned user ${userId} from guild ${guild.name}`);
    } catch (error) {
      console.error(`Failed to unban user ${userId} from guild ${guildId}:`, error);
    }
  }

  /**
   * This method is called when a review of an unban is needed.
   */
  private async sendUnbanLogToServer(
    ban: BanEvent,
    guild: Guild,
    guildConfig: GuildConfig,
    executorId: string,
  ): Promise<boolean> {
    if (!this.client) return false;
    if (!guildConfig.loggingChannelId) {
      console.warn(`No logging channel configured for guild ${guild.name}. Skipping...`);
      return false;
    }

    const user = await this.client.users.fetch(ban.userId).catch(() => null);
    if (!user) {
      console.error(`Failed to fetch user ${ban.userId} for unban log. Canceling log.`);
      return false;
    }

    try {
      await getUnbanLogger().sendLog({
        loggingChannelId: guildConfig.loggingChannelId,
        type: UnbanMessageType.REVIEW,
        banExecutorId: ban.sourceUser,
        user: user,
        banReason: ban.reason ?? "No reason provided",
        banTimestamp: ~~(ban.createdAt.getTime() / 1000),
        guildName: guild.name,
        unbanExecutorId: executorId,
        unbanTimestamp: ~~(Date.now() / 1000),
        guildIconUrl: guild.iconURL() ?? undefined,
      });
      return true;
    } catch (error) {
      console.error(`Failed to send unban log to channel ${guildConfig.loggingChannelId}:`, error);
      sendLog(["Failed to send unban log to server " + guild.id, String(error)]);
    }

    return false;
  }

  async removeBan(data: { userId: string; sourceGuild: Guild; executorId: string }): Promise<void> {
    const ban = await dbManager.getBan(data.userId);
    if (!ban) return;
    if (!this.enabled) {
      console.error("BanSyncManager: Not enabled. Cannot remove bans.");
      return;
    } else if (!this.client) {
      console.error("BanSyncManager: Client not set. Cannot remove bans.");
    }

    sendLog(`Removing the ban for ${data.userId} in ${data.sourceGuild.name}`);

    await dbManager.removeGuildBan(data.userId, data.sourceGuild.id);
    await this.syncUnbanToGuilds(ban, data.sourceGuild, data.executorId);
    sendLog(`Finished processing unban sync for ${data.userId}`);
  }
}

const banSyncManager = new BanSyncManager();

export function getBanSyncManager() {
  return banSyncManager;
}

/**
 * Sets the client for the ban sync manager and enables it.
 */
export function initBanSyncManager(client: Client<true>): BanSyncManager {
  banSyncManager.setClient(client);
  banSyncManager.enable();
  return getBanSyncManager();
}
