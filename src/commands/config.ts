import { ChannelType, InteractionContextType, SlashCommandBuilder } from "discord.js";
import { UnbanMode } from "../database/enums";
import { handleConfigInteraction } from "./utils/configUtils";

export const data = new SlashCommandBuilder()
  .setName("config")
  .setDescription("Configure the bot")
  .setDefaultMemberPermissions(8) // Admin
  .setContexts(InteractionContextType.Guild)
  .addSubcommand((sub) => sub.setName("sources-of-truth").setDescription("Configure the sources of truth for this server"))
  .addSubcommand((sub) =>
    sub
      .setName("unban-logging")
      .setDescription("Configure the unban-log-channel for this server")
      .addChannelOption((op) =>
        op
          .setName("channel")
          .setDescription("The channel to send unban logs to")
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildText, ChannelType.PublicThread, ChannelType.PrivateThread),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("unban-sync")
      .setDescription("Set the unban behavior for this server")
      .addStringOption((op) =>
        op.setName("behavior").setDescription("The unban behavior").setRequired(true).setChoices(
          {
            name: "Automatic Unban | Automatically unban users when unbanned on connected servers",
            value: UnbanMode.AUTO,
          },
          {
            name: "Review Only | Manually decide on every unban in a logging channel",
            value: UnbanMode.REVIEW,
          },
        ),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("incoming-bans")
      .setDescription("Configure whether bans from connected servers are applied to this server")
      .addBooleanOption((op) =>
        op
          .setName("enabled")
          .setDescription("Whether to sync incoming bans from connected servers to this server")
          .setRequired(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("outgoing-bans")
      .setDescription("Configure whether bans issued in this server are shared with connected servers")
      .addBooleanOption((op) =>
        op.setName("enabled").setDescription("Whether to sync bans issued in this server to connected servers").setRequired(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("debug-logging")
      .setDescription("Configure whether debug logging is enabled for the bot")
      .addBooleanOption((op) =>
        op.setName("enabled").setDescription("Whether debug logging is enabled for this server").setRequired(true),
      ),
  );

export const run = handleConfigInteraction;
