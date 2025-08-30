import type { Client, Guild, User } from "discord.js";
import { GuildConfig, type BanEvent, type BanEventInsert } from "../database/types";
import { dbManager } from "../database/manager";
import { dbGuildConfigToObject } from "../database/utils";
import { UnbanLogger, UnbanMessageType } from "./unbanLogger";

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

    const banEvent = await dbManager.addBan(data);
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

    const successfulGuildIds: string[] = [];
    for (const guildConfig of targetGuilds) {
      const guild = this.client.guilds.cache.get(guildConfig.guildId);

      if (!guild || !guild.available) {
        console.error(`Failed to sync ban to guild ${guildConfig.guildId}: Guild not found or unavailable.`);
        continue;
      }

      try {
        await guild.bans.create(event.userId, {
          reason: `Synced ban from source ${event.sourceGuild}. Reason: ${event.reason}`,
        });
        successfulGuildIds.push(guildConfig.guildId);
        console.log(`Successfully synced ban to guild ${guild.name}`);
      } catch (error) {
        console.error(`Failed to sync ban to guild ${guildConfig.guildId}:`, error);
      }
    }

    if (successfulGuildIds.length > 0) {
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
    const guildConfigs = await dbManager.getAllGuildConfigs();
    const targetGuilds = guildConfigs.filter((config) => config.guildId !== sourceGuild.id && config.enabled);

    // Implement unban logic here
    for (const cfg of targetGuilds) {
      if (cfg.unbanMode === "AUTO") {
        await this.reallyUnbanUserFromGuild(ban.userId, cfg.guildId);
      } else {
        await this.sendUnbanLogToServer(ban, sourceGuild, cfg, executorId);
      }
    }
  }

  private async reallyUnbanUserFromGuild(userId: string, guildId: string): Promise<void> {
    const guild = this.client?.guilds.cache.get(guildId);
    if (!guild) return;

    try {
      await guild.bans.remove(userId);
      console.log(`Successfully unbanned user ${userId} from guild ${guild.name}`);
    } catch (error) {
      console.error(`Failed to unban user ${userId} from guild ${guildId}:`, error);
    }
  }

  /**
   * This method is called when a review of an unban is needed.
   */
  private async sendUnbanLogToServer(ban: BanEvent, guild: Guild, guildConfig: GuildConfig, executorId: string): Promise<void> {
    if (!this.client) return;
    if (!guildConfig.loggingChannelId) return;

    const user = await this.client.users.fetch(ban.userId).catch(() => null);
    if (!user) {
      console.error(`Failed to fetch user ${ban.userId} for unban log. Canceling log.`);
      return;
    }

    try {
      await new UnbanLogger().sendLog({
        ban: ban,
        executorId: executorId,
        user: user,
        guildName: guild.name,
        loggingChannelId: guildConfig.loggingChannelId,
        type: UnbanMessageType.REVIEW
      });
    } catch (error) {
      console.error(`Failed to send unban log to channel ${guildConfig.loggingChannelId}:`, error);
    }
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

    await dbManager.removeBan(data.userId); // doesnt actually remove the ban, but marks it as revoked
    await this.syncUnbanToGuilds(ban, data.sourceGuild, data.executorId);
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
