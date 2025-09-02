import { Client, ClientEvents, Collection, TextDisplayBuilder } from "discord.js";
import { ComponentsV2Flags, EphemeralFlags, EphemeralV2Flags, parseCustomId } from "./main";
import { config } from "../config";

interface IInteractionHandler {
  // Props
  client: Client;
  commands: Collection<string, any>;
  components: Collection<string, any>;

  // Methods
  handler(): (...args: ClientEvents["interactionCreate"]) => void;
}

class InteractionHandler implements IInteractionHandler {
  #client: Client;
  #commands: Collection<string, any>;
  #components: Collection<string, any>;

  constructor(client: Client, commands: Collection<string, any>, components: Collection<string, any>) {
    this.#client = client;
    this.#commands = commands;
    this.#components = components;
    console.log("InteractionHandler initialized.");
  }

  get client(): Client {
    return this.#client;
  }

  get commands(): Collection<string, any> {
    return this.#commands;
  }

  get components(): Collection<string, any> {
    return this.#components;
  }

  private async handleError(interaction: any, error: any, context: string, extra: Record<string, any> = {}) {
    const errorContent =
      `There was an error while executing this ${context}!\n` +
      "### Please contact support!\n" +
      "```\n" +
      String(error) +
      "\n```";

    if (interaction.replied || interaction.deferred) {
      await interaction
        .editReply({
          components: [new TextDisplayBuilder().setContent(errorContent)],
          flags: ComponentsV2Flags,
        })
        .catch((e: any) => console.error(e));
    } else {
      await interaction
        .reply({
          components: [new TextDisplayBuilder().setContent(errorContent)],
          flags: EphemeralV2Flags,
        })
        .catch((e: any) => console.error(e));
    }
  }

  handler(): (...args: ClientEvents["interactionCreate"]) => void {
    return async (...args) => {
      const [interaction] = args;

      if (!config.guildIds.includes(interaction.guildId!)) {
        if (!interaction.isAutocomplete()) {
          await interaction.reply({
            components: [new TextDisplayBuilder().setContent(":x: This server is not configured.")],
            flags: EphemeralV2Flags,
          });
        }
        return;
      }

      if (interaction.isCommand() || interaction.isAutocomplete()) {
        const command = this.#commands.get(interaction.commandName);

        if (!command) {
          console.log(`No command matching '${interaction.commandName}' was found.`);
          if (!interaction.isAutocomplete()) {
            await interaction.reply({
              components: [new TextDisplayBuilder().setContent("This command was not found.")],
              flags: EphemeralV2Flags,
            });
          }
          return;
        }

        try {
          if (interaction.isAutocomplete()) {
            await command.autocomplete(interaction);
          } else {
            await command.run(interaction);
          }
        } catch (error) {
          await this.handleError(interaction, error, "command", {
            commandName: interaction.commandName,
            userId: interaction.user.id,
            interaction: interaction.toJSON(),
          });
        }
      } else if ((interaction.isMessageComponent() || interaction.isModalSubmit()) && !interaction.customId.startsWith("~/")) {
        const comp = this.#components.get(parseCustomId(interaction.customId, true));

        if (!comp) {
          console.log(`No component matching '${interaction.customId}' was found.`);
          await interaction.reply({
            components: [new TextDisplayBuilder().setContent("This component was not found.")],
            flags: EphemeralV2Flags,
          });
          return;
        }

        try {
          await comp.run(interaction);
        } catch (error) {
          await this.handleError(interaction, error, "component", {
            customId: interaction.customId,
            userId: interaction.user.id,
            interaction: interaction.toJSON(),
          });
        }
      }

      return;
    };
  }
}

export default InteractionHandler;
