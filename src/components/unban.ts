import { StringSelectMenuInteraction } from "discord.js";

export default {
  prefix: "unban",

  async run(ctx: StringSelectMenuInteraction<"cached">) {
    await ctx.reply("Not implemented yet, sorry.");
  },
};
