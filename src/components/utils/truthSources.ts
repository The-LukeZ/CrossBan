import { ButtonInteraction, TextDisplayBuilder, UserSelectMenuInteraction } from "discord.js";
import { dbManager } from "../../database/manager";
import { buildSourceOfTruthMessage, ComponentsV2Flags, MySet } from "../../utils/main";
import { config } from "../../config";

export async function truthSourcesHandler(
  ctx: ButtonInteraction<"cached"> | UserSelectMenuInteraction<"cached">,
  action: "add" | "remove",
) {
  const sources = await dbManager.getSourcesOfTruth(ctx.guildId);
  if (ctx.isButton()) {
    await ctx.update({
      components: buildSourceOfTruthMessage(sources.toArray(), action),
      flags: ComponentsV2Flags,
    });
    return;
  }

  await ctx.update({
    components: [new TextDisplayBuilder().setContent("⏳ Loading...")],
    flags: ComponentsV2Flags,
  });

  const filteredValues = ctx.values.filter((v) => v !== ctx.client.user.id && config.BSID !== v);

  if (action === "add") {
    const finalValues = new MySet([...sources.toArray(), ...filteredValues]);
    await dbManager.addSourcesOfTruth(ctx.user.id, ctx.guildId, ...finalValues.toArray());
  } else {
    await dbManager.removeSourcesOfTruth(ctx.guildId, ...filteredValues);
  }

  const newSources = await dbManager.getSourcesOfTruth(ctx.guildId);

  await ctx.editReply({
    components: buildSourceOfTruthMessage(newSources.toArray()),
    flags: ComponentsV2Flags,
  });
}
