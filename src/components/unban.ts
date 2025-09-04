import { type StringSelectMenuInteraction, TextDisplayBuilder } from "discord.js";
import { delay, EphemeralFlags, EphemeralV2Flags, parseCustomId } from "../utils/main";
import { dbManager } from "../database/manager";
import { getUnbanLogger, type UnbanDetails, UnbanMessageType } from "../utils/unbanLogger";

export const prefix = "unban";

export async function run(ctx: StringSelectMenuInteraction<"cached">) {
  const originalMessageId = ctx.message.id;
  await ctx.message.edit({ components: ctx.message.components });

  const { firstParam: userId } = parseCustomId(ctx.customId) as { firstParam: string };
  const ban = await ctx.guild.bans.fetch(userId).catch(() => null);
  const gBan = !!ban ? await dbManager.getBan(userId) : null;

  if (!ban || !gBan) {
    await ctx.reply({
      flags: EphemeralV2Flags,
      components: [new TextDisplayBuilder().setContent(`:x: <@${userId}> is not banned in this server.`)],
    });
    // TODO: Maybe create new guild ban for user in db if not exists? (with is_banned = false)
    return;
  }

  await ctx.deferReply({ flags: EphemeralFlags });
  const unban = (ctx.values[0] as "unban" | "ignore") === "unban";

  if (unban) {
    try {
      await ctx.guild.bans.remove(userId, `${gBan.id}: Manually unbanned by @${ctx.user.username} (${ctx.user.id})`);
    } catch (error) {
      console.error(`Failed to unban user ${userId} in guild ${ctx.guild.id}:`, error);
      await ctx.editReply({
        flags: EphemeralV2Flags,
        components: [new TextDisplayBuilder().setContent(`:x: Failed to unban <@${userId}>. Do I have the correct permissions?`)],
      });
      return;
    }
    await dbManager.removeGuildBan(userId, ctx.guild.id);
  }
  //If ignored, do nothing because the ban is still active in the guild

  let user: UnbanDetails<any>["user"] | null = await ctx.client.users.fetch(userId).catch(() => null);
  if (!user) {
    user = {
      id: userId,
      defaultAvatarURL: `https://cdn.discordapp.com/embed/avatars/${(Number(userId) >> 22) % 6}.png`,
      avatarURL: () => null,
    };
  }

  await delay(1000); // Don't get ratelimited

  await getUnbanLogger().sendLog(
    {
      user: user,
      banExecutorId: gBan.sourceUser,
      banReason: gBan.reason ?? "No reason provided",
      banTimestamp: ~~(gBan.createdAt.getTime() / 1000),
      guildName: ctx.guild.name,
      unbanExecutorId: ctx.user.id,
      unbanTimestamp: ~~(Date.now() / 1000),
      guildIconUrl: ctx.guild.iconURL() ?? undefined,
      actionExecutorId: ctx.user.id,
      loggingChannelId: ctx.channelId,
      type: unban ? UnbanMessageType.SUCCESS : UnbanMessageType.IGNORED,
    },
    originalMessageId,
  );

  await ctx.reply({
    flags: EphemeralV2Flags,
    components: [
      new TextDisplayBuilder().setContent(unban ? `✅ Unbanned <@${userId}> locally.` : `❎ Ignored the ban for <@${userId}>.`),
    ],
  });
}
