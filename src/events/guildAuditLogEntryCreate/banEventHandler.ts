import { AuditLogEvent, type Guild, type GuildAuditLogsEntry } from "discord.js";
import { config } from "../../config";
import { getBanSyncManager } from "../../utils/banSyncManager";
import { sendLog } from "../../utils/logger";

function shouldIgnore(entry: GuildAuditLogsEntry, guildId: string) {
  if (entry.action !== AuditLogEvent.MemberBanAdd && entry.action !== AuditLogEvent.MemberBanRemove) return true;
  if (!config.guildIds.includes(guildId)) return true;
  if (!entry.executorId || entry.executorId === config.clientId || !config.isTruthSourceFor(guildId, entry.executorId))
    return true; // We only care about sources of truth and not the bot itself.
  return false;
}

export default async function banEventHandler(entry: GuildAuditLogsEntry, guild: Guild) {
  console.log("Incoming audit log entry create event!");
  sendLog(["Incoming event", entry.toJSON(), "Guild ID: " + guild.id]);
  if (shouldIgnore(entry, guild.id)) return;
  sendLog(`Event not ignored, processing...`);

  const { targetId, executorId, action, reason } = entry;

  if (action === AuditLogEvent.MemberBanAdd) {
    sendLog(`Processing ban event...`);
    await getBanSyncManager().handleBan({
      userId: targetId!,
      sourceGuild: guild.id,
      sourceUser: executorId!,
      reason: reason ?? "Unknown Reason",
    });
  } else if (action === AuditLogEvent.MemberBanRemove) {
    sendLog(`Processing unban event...`);
    await getBanSyncManager().removeBan({ userId: targetId!, sourceGuild: guild, executorId: executorId! });
  }
}
