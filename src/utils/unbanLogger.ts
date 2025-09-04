import {
  AllowedMentionsTypes,
  APIMessageTopLevelComponent,
  JSONEncodable,
  Routes,
  User,
  type Client,
  type RESTPostAPIChannelMessageJSONBody,
} from "discord.js";
import type { BanEvent } from "../database/types";
import { ComponentsV2Flags } from "./main";

import {
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ThumbnailBuilder,
  SectionBuilder,
  ContainerBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  StringSelectMenuOptionBuilder,
  type MessageActionRowComponentBuilder,
} from "discord.js";

export interface UnbanDetails<T extends UnbanMessageType = UnbanMessageType> {
  /**
   * The unbanned user.
   */
  user: User | { id: string; defaultAvatarURL: string; avatarURL?: () => string | null };
  /**
   * The guild name where the unban occurred.
   */
  guildName: string;
  /**
   * The guild icon URL, if available.
   */
  guildIconUrl?: string;
  /**
   * The unix timestamp of when the unban occurred.
   */
  unbanTimestamp: number;
  /**
   * The unix timestamp of when the ban occurred.
   */
  banTimestamp: number;
  /**
   * The ID of the executor who performed the initial ban.
   */
  banExecutorId: string;
  /**
   * The ID of the executor who performed the initial unban.
   */
  unbanExecutorId: string;
  /**
   * The ID of the executor who performed the unban action (if applicable).
   */
  actionExecutorId?: T extends UnbanMessageType.REVIEW ? never : string;
  /**
   * The reason for the initial ban.
   */
  banReason: string;
}

export enum UnbanMessageType {
  REVIEW = "review",
  SUCCESS = "success",
  IGNORED = "ignored",
}

export class UnbanMessageBuilder<T extends UnbanMessageType> {
  private static readonly COLORS = {
    [UnbanMessageType.REVIEW]: 41983,
    [UnbanMessageType.SUCCESS]: 3331645,
    [UnbanMessageType.IGNORED]: 6429210,
  };

  constructor() {}

  private static actionText(type: Exclude<UnbanMessageType, UnbanMessageType.REVIEW>, userId: string) {
    const texts = {
      [UnbanMessageType.SUCCESS]: "🔨 Unbanned",
      [UnbanMessageType.IGNORED]: "❌ Ignored",
    };
    return `### Action Taken\n- **Action:** ${texts[type]}\n- **Action Executor:** <@${userId}>`;
  }

  public build(details: UnbanDetails<T>, type: T): APIMessageTopLevelComponent[] {
    const components: JSONEncodable<APIMessageTopLevelComponent>[] = [this.buildMainContainer(details, type)];

    if (type === UnbanMessageType.REVIEW) {
      components.push(this.buildActionRow(details.user.id));
    }

    return components.map((component) => component.toJSON());
  }

  private buildMainContainer(details: UnbanDetails<T>, type: T) {
    const container = new ContainerBuilder()
      .setAccentColor(UnbanMessageBuilder.COLORS[type])
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### Unban of <@${details.user.id}>\n-# \`${details.user.id}\``),
      )
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));

    if (details.guildIconUrl) {
      container.addSectionComponents(this.buildUnbanDetailsSection(details, details.guildIconUrl));
    } else {
      container.addTextDisplayComponents(...this.buildUnbanDetailsSection(details));
    }

    container
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addSectionComponents(this.buildBanSummarySection(details));

    if (type !== UnbanMessageType.REVIEW) {
      container
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            UnbanMessageBuilder.actionText(type as Exclude<UnbanMessageType, UnbanMessageType.REVIEW>, details.actionExecutorId!),
          ),
        );
    }

    return container;
  }

  private buildUnbanDetailsSection(details: UnbanDetails<T>): TextDisplayBuilder[];
  private buildUnbanDetailsSection(details: UnbanDetails<T>, guildIconUrl: string): SectionBuilder;
  private buildUnbanDetailsSection(details: UnbanDetails<T>, guildIconUrl?: string) {
    const unbanDetailsTexts = [
      new TextDisplayBuilder().setContent("**Initial Unban Details**"),
      new TextDisplayBuilder().setContent(
        `- **Servername:** ${details.guildName}\n- **Timestamp:** <t:${details.unbanTimestamp}:f>\n- **Executor:** <@${details.unbanExecutorId}>`,
      ),
    ];
    if (guildIconUrl) {
      return new SectionBuilder()
        .setThumbnailAccessory(new ThumbnailBuilder().setURL(guildIconUrl))
        .addTextDisplayComponents(...unbanDetailsTexts);
    } else {
      return unbanDetailsTexts;
    }
  }

  private buildBanSummarySection(details: UnbanDetails<T>) {
    return new SectionBuilder()
      .setThumbnailAccessory(new ThumbnailBuilder().setURL(details.user.avatarURL?.() ?? details.user.defaultAvatarURL))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent("**Ban Summary**"),
        new TextDisplayBuilder().setContent(
          `- **Servername:** ${details.guildName}\n` +
            `- **Timestamp:** <t:${details.banTimestamp}:f>\n` +
            `- **Executor:** <@${details.banExecutorId}>\n` +
            `- **Reason:**\n  ${details.banReason}`,
        ),
      );
  }

  private buildActionRow(userId: string) {
    return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("unban?" + userId)
        .setPlaceholder("Take Action!")
        .addOptions(
          new StringSelectMenuOptionBuilder().setLabel("Unban locally").setValue("unban").setEmoji({ name: "📍" }),
          new StringSelectMenuOptionBuilder().setLabel("Ignore").setValue("ignore").setEmoji({ name: "❎" }),
        ),
    );
  }
}

type SendLogArgs<T extends UnbanMessageType = UnbanMessageType> = UnbanDetails<T> & {
  loggingChannelId: string;
  type: T;
};

export class UnbanLogger {
  private _client: Client<true> | null;
  private _enabled: boolean = false;

  constructor(client?: Client<true> | null) {
    this._client = client ?? null;
  }

  get enabled() {
    return this._enabled;
  }

  public enable() {
    this._enabled = true;
  }

  public disable() {
    this._enabled = false;
  }

  public setClient(client: Client<true>) {
    this._client = client;
  }

  public buildLogMessage<T extends UnbanMessageType = UnbanMessageType>(
    type: T,
    details: UnbanDetails<T>,
  ): RESTPostAPIChannelMessageJSONBody {
    // Will build the base layout and if unbanned, make a "success" message and if not, make a "review" message
    const builder = new UnbanMessageBuilder<T>();
    return {
      flags: ComponentsV2Flags,
      components: builder.build(details, type),
      allowed_mentions: {
        users: [details.user.id],
      },
    };
  }

  public async sendLog<T extends UnbanMessageType = UnbanMessageType>(data: SendLogArgs<T>, messageId?: string) {
    if (!this.enabled) return;
    if (!this._client) {
      console.error("UnbanLogger: Client not set. Cannot send log messages.");
      throw new Error("UnbanLogger: Client not set. Cannot send log messages.");
    }

    const { loggingChannelId, ...rest } = data;

    const logMessage = this.buildLogMessage(data.type, rest);
    if (!messageId) {
      await this._client.rest.post(Routes.channelMessages(data.loggingChannelId), { body: logMessage });
    } else {
      await this._client.rest.patch(Routes.channelMessage(data.loggingChannelId, messageId), { body: logMessage });
    }
  }
}

const unbanLogger = new UnbanLogger();

export function getUnbanLogger() {
  return unbanLogger;
}

/**
 * Sets the client for the unban logger and enables it.
 */
export function initUnbanLogger(client: Client<true>): UnbanLogger {
  unbanLogger.setClient(client);
  unbanLogger.enable();
  return getUnbanLogger();
}
