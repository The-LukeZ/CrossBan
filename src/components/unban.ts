import { StringSelectMenuInteraction } from "discord.js";

export const prefix = "unban";

export async function run(ctx: StringSelectMenuInteraction<"cached">) {
  await ctx.message.edit({ components: ctx.message.components });
  await ctx.reply("Not implemented yet, sorry.");
}
