import type { UnbanMode as UnbanModeValues } from "./enums";

export type UnbanMode = (typeof UnbanModeValues)[keyof typeof UnbanModeValues];

/**
 * Represents a ban event record.
 */
export type BanEvent = {
  /** Unique identifier for the ban event. */
  id: number;
  /** Discord user ID of the banned user. */
  userId: string;
  /** Discord guild ID where the ban originated. */
  sourceGuild: string;
  /** Discord user ID of the user who issued the ban. */
  sourceUser: string;
  /** Reason for the ban. */
  reason: string | null;
  /** Timestamp when the ban event was created. */
  createdAt: Date;
  /** Whether the ban has been revoked (lifted). */
  revoked: boolean;
};

/**
 * Used for inserting a new ban event.
 * Omits 'id', 'createdAt', and 'revoked', but allows partial 'createdAt' and 'revoked'.
 */
export type BanEventInsert = Omit<BanEvent, "id" | "createdAt" | "revoked"> & Partial<Pick<BanEvent, "createdAt" | "revoked">>;

/**
 * Represents a guild ban record (synced bans).
 */
export type GuildBan = {
  /** Unique identifier for the guild ban record. */
  id: number;
  /** Discord user ID of the banned user. */
  userId: string;
  /** Discord guild ID where the ban is applied. */
  guildId: string;
  /** Whether the user is currently banned. */
  isBanned: boolean;
  /** Reference to the originating ban event. */
  banEventId: number | null;
  /** Timestamp when the ban was applied. */
  appliedAt: Date;
  /** Timestamp when the record was last updated. */
  lastUpdated: Date;
};

/**
 * Used for inserting a new guild ban.
 * Omits 'id', 'appliedAt', and 'lastUpdated', but allows partial for those fields.
 */
export type GuildBanInsert = Omit<GuildBan, "id" | "appliedAt" | "lastUpdated"> &
  Partial<Pick<GuildBan, "appliedAt" | "lastUpdated">>;

/**
 * Represents a source of truth for bans in a guild.
 */
export type TruthSource = {
  /** Discord guild ID for the source. */
  guildId: string;
  /** Discord user ID for the source. */
  userId: string;
  /** Timestamp when the source was created. */
  createdAt: Date;
  /** Discord user ID of the creator. */
  createdBy: string;
};

/**
 * Used for inserting a new truth source.
 * Omits 'createdAt' and 'enabled', but allows partial 'createdAt' and 'enabled'.
 */
export type TruthSourceInsert = Omit<TruthSource, "createdAt" | "enabled"> & Partial<Pick<TruthSource, "createdAt" | "enabled">>;

/**
 * Configuration for a guild.
 */
export type GuildConfig = {
  /** Discord guild ID. */
  guildId: string;
  /** Whether outgoing bans are enabled for this guild. */
  enabled: boolean;
  /** Whether incoming bans are enabled for this guild. */
  autoBan: boolean;
  /** Indicates how incoming unbans should be handled. */
  unbanMode: UnbanMode;
  /** Channel ID for logging actions, or null if not set. */
  loggingChannelId: string | null;
  /** Timestamp when the config was created. */
  createdAt: Date;
};

/**
 * Used for inserting a new guild config.
 * Only 'guildId' is required, others are optional.
 */
export type GuildConfigInsert = Pick<GuildConfig, "guildId"> & Partial<Omit<GuildConfig, "guildId" | "createdAt">>; // Everything has a default value, except the guild id

/**
 * Raw database representation of a guild config.
 */
export type RawGuildConfig = {
  /** Discord guild ID. */
  guild_id: string;
  /** Whether CrossBan is enabled for this guild. */
  enabled: boolean;
  /** Whether auto-ban is enabled for this guild. */
  auto_ban: boolean;
  /** Whether auto-unban is enabled for this guild. */
  auto_unban: boolean;
  /** Channel ID for logging actions, or null if not set. */
  logging_channel_id: string | null;
  /** Timestamp when the config was created. */
  created_at: Date;
};
