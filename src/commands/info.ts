import { ButtonBuilder, ChatInputCommandInteraction, Colors, ContainerBuilder, Locale, SlashCommandBuilder } from "discord.js";
import { EphemeralV2Flags } from "../utils/main";

export const data = new SlashCommandBuilder().setName("info").setDescription("Get information about the bot");

function getDescription(locale: Locale) {
  switch (locale) {
    case "de":
      return "CrossBan synchronisiert Banns über mehrere Discord-Server hinweg und hilft so, eine konsistente Moderation aufrechtzuerhalten.";
    default:
      return "CrossBan synchronizes bans across multiple Discord servers, helping maintain consistent moderation.";
  }
}

export async function run(ctx: ChatInputCommandInteraction) {
  await ctx.reply({
    flags: EphemeralV2Flags,
    components: [
      new ContainerBuilder()
        .setAccentColor(Colors.DarkAqua)
        .addTextDisplayComponents((t) => t.setContent(getDescription(ctx.locale)))
        .addActionRowComponents((r) =>
          r.setComponents(
            new ButtonBuilder({
              label: "GitHub",
              style: 5,
              url: "https://github.com/The-LukeZ/CrossBan",
            }),
            new ButtonBuilder({
              label: "Documentation",
              style: 5,
              url: "https://lukez.gitbook.io/crossban/" + (ctx.locale.startsWith("de") ? "de/" : ""),
            }),
          ),
        ),
    ],
  });
}
