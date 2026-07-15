import {
  ActionRowBuilder,
  APIMessageTopLevelComponent,
  ButtonBuilder,
  ContainerBuilder,
  JSONEncodable,
  MessageFlags,
  UserSelectMenuBuilder,
} from "discord.js";

export function parseCustomId(customId: string, onlyPrefix: true): string;
export function parseCustomId(
  customId: string,
  onlyPrefix?: false,
): {
  compPath: string[];
  prefix: string;
  lastPathItem: string;
  component: string | null;
  params: string[];
  firstParam: string | null;
  lastParam: string | null;
};

// Implementieren Sie die Funktion
export function parseCustomId(customId: string, onlyPrefix: boolean = false) {
  if (onlyPrefix) {
    return customId.match(/^(?<prefix>.+?)(\/|\?)/i)?.groups?.prefix || customId;
  }
  const [path, params] = customId.split("?");
  const pathS = path.split("/");
  const parms = params?.split("/") || [];
  return {
    compPath: pathS,
    prefix: pathS[0],
    lastPathItem: pathS[pathS.length - 1],
    component: pathS[1] || null,
    params: parms || [],
    firstParam: parms[0] || null,
    lastParam: parms[parms.length - 1] || null,
  };
}

export const ComponentsV2Flags = MessageFlags.IsComponentsV2;
export const EphemeralFlags = MessageFlags.Ephemeral;
export const EphemeralV2Flags = ComponentsV2Flags | EphemeralFlags;

export function buildSourceOfTruthMessage(
  sources: string[],
  action?: "add" | "remove",
): JSONEncodable<APIMessageTopLevelComponent>[] {
  const container = new ContainerBuilder().addTextDisplayComponents(
    (t) => t.setContent("### Sources of Truth\n-# Only bans and unbans from sources of truth are getting synced."),
    (t) => t.setContent(sources.map((s) => `- <@${s}>`).join("\n") || "_No sources of truth configured yet._"),
  );
  const rows: JSONEncodable<APIMessageTopLevelComponent>[] = [
    new ActionRowBuilder<ButtonBuilder>().setComponents(
      new ButtonBuilder({
        customId: "config/sourcesOfTruth/?add",
        label: "Add",
        emoji: {
          name: "➕",
        },
        style: action === "add" ? 3 : 2,
      }),
      new ButtonBuilder({
        customId: "config/sourcesOfTruth?remove",
        label: "Remove",
        emoji: {
          name: "➖",
        },
        style: action === "remove" ? 3 : 2,
      }),
    ),
  ];
  if (action) {
    rows.push(
      new ActionRowBuilder<UserSelectMenuBuilder>().setComponents(
        new UserSelectMenuBuilder()
          .setCustomId("config/sourcesOfTruth/select?" + action)
          .setPlaceholder("Select a users")
          .setMaxValues(25),
      ),
    );
  }
  return [container, ...rows];
}

export class MySet<T> extends Set<T> {
  constructor(iterable?: Iterable<T>) {
    super(iterable);
  }

  /**
   * Converts the set to an array.
   * @returns An array containing the elements of the set.
   */
  toArray() {
    return Array.from(this);
  }
}

export function delay(seconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}
