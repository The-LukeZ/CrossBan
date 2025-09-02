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

export interface UnbanDetails {
  /**
   * The unbanned user.
   */
  user: User;
  guildName: string;
  guildIconUrl?: string;
  timestamp: number;
  executorId: string;
  banReason: string;
}

export enum UnbanMessageType {
  REVIEW = "review",
  SUCCESS = "success",
  IGNORED = "ignored",
}

export class UnbanMessageBuilder {
  private static readonly COLORS = {
    [UnbanMessageType.REVIEW]: 41983,
    [UnbanMessageType.SUCCESS]: 3331645,
    [UnbanMessageType.IGNORED]: 6429210,
  };

  private static actionText(type: Exclude<UnbanMessageType, UnbanMessageType.REVIEW>, executorId: string) {
    const texts = {
      [UnbanMessageType.SUCCESS]: "🔨 Unbanned",
      [UnbanMessageType.IGNORED]: "❌ Ignored",
    };
    return `### Action Taken\n- **Action:** ${texts[type]}\n- **Executor:** <@${executorId}>`;
  }

  public static build(details: UnbanDetails, type: UnbanMessageType): APIMessageTopLevelComponent[] {
    const components: JSONEncodable<APIMessageTopLevelComponent>[] = [this.buildMainContainer(details, type)];

    if (type === UnbanMessageType.REVIEW) {
      components.push(this.buildActionRow());
    }

    return components.map((component) => component.toJSON());
  }

  private static buildMainContainer(details: UnbanDetails, type: UnbanMessageType) {
    const container = new ContainerBuilder()
      .setAccentColor(this.COLORS[type])
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### Entbannung von <@${details.user.id}>\n-# **User ID:** \`${details.user.id}\``),
      )
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));

    if (details.guildIconUrl) {
      container.addSectionComponents(this.buildUnbanDetailsSection(details) as SectionBuilder);
    } else {
      container.addTextDisplayComponents(...(this.buildUnbanDetailsSection(details) as TextDisplayBuilder[]));
    }

    container
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addSectionComponents(this.buildBanSummarySection(details));

    if (type !== UnbanMessageType.REVIEW) {
      container
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(this.actionText(type, details.executorId) + `<@${details.executorId}>`),
        );
    }

    return container;
  }

  private static buildUnbanDetailsSection(details: UnbanDetails): SectionBuilder | TextDisplayBuilder[] {
    if (details.guildIconUrl) {
      return new SectionBuilder()
        .setThumbnailAccessory(new ThumbnailBuilder().setURL(details.guildIconUrl))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("**Unban Details**"),
          new TextDisplayBuilder().setContent(
            `- **Servername:** ${details.guildName}\n- **Timestamp:** <t:${details.timestamp}:f>\n- **Executor:** <@${details.executorId}>`,
          ),
        );
    } else {
      return [
        new TextDisplayBuilder().setContent("**Unban Details**"),
        new TextDisplayBuilder().setContent(
          `- **Servername:** ${details.guildName}\n- **Timestamp:** <t:${details.timestamp}:f>\n- **Executor:** <@${details.executorId}>`,
        ),
      ];
    }
  }

  private static buildBanSummarySection(details: UnbanDetails) {
    return new SectionBuilder()
      .setThumbnailAccessory(new ThumbnailBuilder().setURL(details.user.avatarURL() ?? details.user.defaultAvatarURL))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent("**Ban Summary**"),
        new TextDisplayBuilder().setContent(
          `- **Servername:** ${details.guildName}\n` +
            `- **Timestamp:** <t:${details.timestamp}:f>\n` +
            `- **Executor:** <@${details.executorId}>\n` +
            `- **Reason:**\n  ${details.banReason}`,
        ),
      );
  }

  private static buildActionRow() {
    return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("unban")
        .setPlaceholder("Take Action!")
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel("Unban locally")
            .setValue("f487c44975644e34a3ba771d45b8cfef")
            .setEmoji({ name: "📍" }),
          new StringSelectMenuOptionBuilder()
            .setLabel("Ignore")
            .setValue("4af3e581c2cb4823e351cba5cb6f9f21")
            .setEmoji({ name: "❎" }),
        ),
    );
  }
}

type SendLogArgs = {
  loggingChannelId: string;
  ban: BanEvent;
  executorId: string;
  guildName: string;
  guildIconUrl?: string;
  /**
   * The unbanned user.
   */
  user: User;
  type: UnbanMessageType;
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

  private buildLogMessage(details: UnbanDetails, type: UnbanMessageType): RESTPostAPIChannelMessageJSONBody {
    // Will build the base layout and if unbanned, make a "success" message and if not, make a "review" message
    return {
      flags: ComponentsV2Flags,
      components: UnbanMessageBuilder.build(details, type),
      allowed_mentions: {
        users: [details.user.id],
      },
    };
  }

  public async sendLog(data: SendLogArgs) {
    if (!this.enabled) return;
    if (!this._client) {
      console.error("UnbanLogger: Client not set. Cannot send log messages.");
      throw new Error("UnbanLogger: Client not set. Cannot send log messages.");
    }

    const logMessage = this.buildLogMessage(
      {
        banReason: data.ban.reason ?? "No reason provided.",
        executorId: data.executorId,
        guildIconUrl: data.guildIconUrl,
        guildName: data.guildName,
        timestamp: ~~(data.ban.createdAt.getTime() / 1000),
        user: data.user,
      },
      data.type,
    );
    await this._client.rest.post(Routes.channelMessages(data.loggingChannelId), { body: logMessage });
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
