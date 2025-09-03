import type { BanEvent, GuildBan, GuildConfig } from "./types";

export function dbBanEventToObject(row: any): BanEvent {
  return {
    id: Number(row.id),
    userId: row.user_id,
    sourceGuild: row.source_guild,
    sourceUser: row.source_user,
    reason: row.reason,
    createdAt: new Date(row.created_at),
  };
}

export function dbGuildBanToObject(row: any): GuildBan {
  return {
    id: Number(row.id),
    userId: row.user_id,
    guildId: row.guild_id,
    isBanned: !!row.is_banned,
    banEventId: row.ban_event_id ? Number(row.ban_event_id) : null,
    appliedAt: new Date(row.applied_at),
    lastUpdated: new Date(row.last_updated),
    isSource: !!row.is_source,
  };
}

export function dbGuildConfigToObject(row: any): GuildConfig {
  return {
    guildId: row.guild_id,
    enabled: !!row.enabled,
    autoBan: !!row.auto_ban,
    unbanMode: row.unban_mode ?? "AUTO",
    loggingChannelId: row.logging_channel_id,
    createdAt: new Date(row.created_at),
  };
}
