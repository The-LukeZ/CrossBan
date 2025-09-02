import { ChatInputCommandInteraction, ContainerBuilder } from "discord.js";
import { SlashCommandBuilder } from "discord.js";
import { ComponentsV2Flags, EphemeralFlags } from "../utils/main";
import { getUnbanLogger, UnbanLogger, UnbanMessageType } from "../utils/unbanLogger";
import { dbManager } from "../database/manager";

export const data = new SlashCommandBuilder()
  .setName("test")
  .setDescription("Test command")
  .addChannelOption((op) => op.setName("channel").setDescription("Channel to test with").setRequired(false));

export async function run(ctx: ChatInputCommandInteraction<"cached">) {
  await ctx.deferReply({ flags: EphemeralFlags });

  const channel = ctx.options.getChannel("channel") ?? ctx.channel;

  if (!channel || !channel.isSendable()) {
    await ctx.editReply("I cannot send messages to that channel.");
    return;
  }

  const partialUser = await ctx.client.users.fetch("840579407172075522").catch(() => null);
  if (!partialUser) {
    await ctx.editReply("Failed to fetch user.");
    return;
  }

  const guildCfg = await dbManager.getGuildConfig(ctx.guildId);
  if (!guildCfg || !guildCfg.loggingChannelId) {
    await ctx.editReply("Failed to retrieve guild configuration." + (guildCfg ? "" : " Guild configuration not found."));
    return;
  }

  await getUnbanLogger().sendLog({
    ban: {
      createdAt: new Date(),
      id: 0,
      reason: "Test ban",
      revoked: false,
      sourceGuild: ctx.guildId,
      sourceUser: "1022544757739761676",
      userId: ctx.user.id,
    },
    executorId: "1022544757739761676",
    guildName: "Test Server",
    loggingChannelId: guildCfg?.loggingChannelId,
    type: UnbanMessageType.REVIEW,
    user: partialUser,
    guildIconUrl: ctx.guild.iconURL() ?? undefined,
  });

  await ctx.editReply("Test message sent!");
}
