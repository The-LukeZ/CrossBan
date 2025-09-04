import { ChatInputCommandInteraction, Colors, ContainerBuilder, TextDisplayBuilder } from "discord.js";
import { dbManager } from "../../database/manager";
import { buildSourceOfTruthMessage, EphemeralFlags, EphemeralV2Flags } from "../../utils/main";
import { UnbanMode } from "../../database/types";

export async function handleConfigInteraction(ctx: ChatInputCommandInteraction<"cached">) {
  const subcommand = ctx.options.getSubcommand();

  switch (subcommand) {
    case "sources-of-truth":
      await handleSourcesOfTruth(ctx);
      return;
    case "unban-logging":
      await handleUnbanLogging(ctx);
      return;
    case "unban-sync":
      await handleUnbanSync(ctx);
      return;
    case "incoming-bans":
      await handleIncomingBans(ctx);
      return;
    case "outgoing-bans":
      await handleOutgoingBans(ctx);
      return;
    default:
      await ctx.reply({ content: "Unknown subcommand", flags: 64 });
      return;
  }
}

async function handleSourcesOfTruth(ctx: ChatInputCommandInteraction<"cached">) {
  await ctx.deferReply({ flags: EphemeralV2Flags });
  const sources = await dbManager.getSourcesOfTruth(ctx.guildId);
  await ctx.editReply({
    components: buildSourceOfTruthMessage(sources.toArray()),
    flags: EphemeralV2Flags,
  });
}

async function handleUnbanLogging(ctx: ChatInputCommandInteraction<"cached">) {
  // Just set the unban log channel
  const channel = ctx.options.getChannel("channel", true);
  await dbManager.updateGuildConfig(ctx.guildId, { loggingChannelId: channel.id });
  await ctx.reply({
    flags: EphemeralV2Flags,
    components: [
      new ContainerBuilder()
        .setAccentColor(Colors.Green)
        .addTextDisplayComponents((t) => t.setContent(`✅ Unban logging channel set to <#${channel.id}>.`)),
    ],
  });
}

async function handleUnbanSync(ctx: ChatInputCommandInteraction<"cached">) {
  // Just set the unban mode (directly from the comand option)
  const mode = ctx.options.getString("behavior", true) as UnbanMode;
  await dbManager.updateGuildConfig(ctx.guildId, { unbanMode: mode });
  const container = new ContainerBuilder()
    .setAccentColor(Colors.Green)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`✅ Unban mode set to **${mode}**.`));
  if (mode === "REVIEW") {
    container.addSeparatorComponents((s) => s);
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "⚠️ **Don't forget to set a logging channel with `/config unban-logging` - otherwise you won't see unban notifications.**",
      ),
    );
  }
  await ctx.reply({
    flags: EphemeralV2Flags,
    components: [container],
  });
}

const incomingBansDescription = (value: boolean) =>
  value
    ? "Incoming bans are enabled.\nBans issued on connected servers **will be** also applied to this server."
    : "Incoming bans are disabled.\nBans issued on connected servers **will not** be applied to this server.";

async function handleIncomingBans(ctx: ChatInputCommandInteraction<"cached">) {
  // Just set the boolean option
  const enabled = ctx.options.getBoolean("enabled", true);
  await dbManager.updateGuildConfig(ctx.guildId, { autoBan: enabled });
  await ctx.reply({
    flags: EphemeralV2Flags,
    components: [
      new ContainerBuilder()
        .setAccentColor(Colors.Green)
        .addTextDisplayComponents((t) => t.setContent(`✅ ${incomingBansDescription(enabled)}`)),
    ],
  });
}

const outgoingBansDescription = (value: boolean) =>
  value
    ? "Outgoing bans are enabled.\nBans issued on this server **will be** shared with connected servers."
    : "Outgoing bans are disabled.\nBans issued on this server **will not** be shared.";

async function handleOutgoingBans(ctx: ChatInputCommandInteraction<"cached">) {
  // Just set the boolean option
  const enabled = ctx.options.getBoolean("enabled", true);
  await dbManager.updateGuildConfig(ctx.guildId, { enabled: enabled });
  await ctx.reply({
    flags: EphemeralV2Flags,
    components: [
      new ContainerBuilder()
        .setAccentColor(Colors.Green)
        .addTextDisplayComponents((t) => t.setContent(`✅ ${outgoingBansDescription(enabled)}`)),
    ],
  });
}
