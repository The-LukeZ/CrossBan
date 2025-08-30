import { ButtonInteraction, UserSelectMenuInteraction } from "discord.js";
import { parseCustomId } from "../utils/main";
import { truthSourcesHandler } from "./utils/truthSources";

export default {
  prefix: "config",

  async run(ctx: ButtonInteraction<"cached"> | UserSelectMenuInteraction<"cached">) {
    const { component, firstParam: action } = parseCustomId(ctx.customId) as { component: string; firstParam: "add" | "remove" };
    if (component === "sourcesOfTruth") {
      await truthSourcesHandler(ctx, action);
      return;
    }
  },
};
