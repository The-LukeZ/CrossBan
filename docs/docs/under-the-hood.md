# Under the Hood

This document provides a detailed, technical breakdown of how the CrossBan Discord bot operates, focusing on its code structure, execution flow, and key components. It's aimed at developers or those with programming knowledge. The bot is written in TypeScript using Discord.js and PostgreSQL.

## Overview

CrossBan synchronizes bans across multiple Discord servers. It listens for ban/unban events via Discord's audit logs, stores data in a PostgreSQL database, and propagates actions to connected guilds based on configurations. It uses Docker for deployment and handles logging via webhooks and in-channel messages.

Key technologies:

* **Discord.js**: For interacting with Discord API.
* **PostgreSQL**: For persistent storage.
* **Node.js/TypeScript**: Runtime and language.
* **Docker**: Containerization.

The bot's core is event-driven, with modules loaded dynamically at startup.

## Architecture

The bot is modular:

* **Main Entry (index.ts)**: Initializes the client, loads commands/components/events, and starts the bot.
* **Modules**:
  * **Commands**: Slash commands (e.g., config).
  * **Components**: Interactive elements (e.g., buttons for unban reviews).
  * **Events**: Handlers for Discord events (e.g., audit log entries).
* **Utilities**: Logger, ban sync manager, unban logger.
* **Database**: Manager for queries and schema initialization.
* **Config**: Environment-based settings.

Files are loaded dynamically using `require()` based on file extensions (`.ts` in dev, `.js` in prod).

## Startup Process

The bot starts in `index.ts` via an async IIFE (Immediately Invoked Function Expression).

### Client Initialization

```typescript
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, ...],
  // ... other options
});
```

* Creates a Discord client with intents for guilds, members, messages, and moderation.
* Limits cache for performance (e.g., 128 messages per manager).

### Module Loading

Functions like `loadCommands()`, `loadComponents()`, and `loadEvents()` scan directories and load files:

* **`loadCommands()`**: Reads `commands/` folder, filters by extension, requires each file, and checks for `data` and `run` properties. Stores in a Collection.
* **`loadComponents()`**: Similar for `components/`, checks for `prefix` and `run`.
* **`loadEvents()`**: Scans `events/` subfolders (matching Discord Events enum), loads handlers.

Example for commands:

```typescript
for (const file of commandFiles) {
  try {
    const command = require(file);
    if (typeof command == "object" && "data" in command && "run" in command) {
      // Add to collection
    }
  } catch (error) {
    console.error(`Error loading command file ${file}`, { error });
  }
}
```

#### Interaction Handler Setup

```typescript
function setupInteractionHandlers() {
  client.on("interactionCreate", new InteractionHandler(client, commands, components).handler());
}
```

* Attaches a handler for interactions (commands, buttons, selects).

#### Client Ready Event

```typescript
client.once("clientReady", async (_client) => {
  // deploy commands, set activity, etc
});
```

* Deploys slash commands using `deployCommands()`.
* Initializes unban logger and ban sync manager.
* Sets bot activity to show server count.
* Loads truth sources from DB into config.

#### Database Initialization

* Calls `dbManager.initialize()` to run SQL schemas from `schemas/` folder.
* Cleans up obsolete guilds/truth sources.
* Loads truth sources into memory.

#### Login and Enable Features

* `client.login(config.botToken)` connects to Discord.
* Enables ban sync manager.
* In dev mode, enables logging.

### Event Handling

Events are handled via `guildAuditLogEntryCreate` in `banEventHandler.ts`.

#### Ban/Unban Detection

```typescript
function shouldIgnore(entry: GuildAuditLogsEntry, guildId: string) {
  if (entry.action !== AuditLogEvent.MemberBanAdd && entry.action !== AuditLogEvent.MemberBanRemove) return true;
  if (!config.guildIds.includes(guildId)) return true;
  if (!entry.executorId || entry.executorId === config.clientId || !config.isTruthSourceFor(guildId, entry.executorId))
    return true; // Only process from truth sources
  return false;
}
```

* Ignores non-ban events, non-configured guilds, bot actions, or non-truth-source executors.

#### Processing Bans

For `MemberBanAdd`:

* Calls `banSyncManager.handleBan()` with user ID, source guild, executor, and reason.
* Creates a `BanEvent` in DB.
* Syncs to auto-ban enabled guilds.

For `MemberBanRemove`:

* Calls `banSyncManager.removeBan()` to unban across guilds.

## Ban Synchronization

Handled by banSyncManager.ts.

#### Handling Bans

```typescript
async handleBan(data: BanEventInsert): Promise<void> {
  const banEvent = await dbManager.addBanEvent(data);
  await dbManager.createGuildBan({ /* source ban */ });
  await this.syncBanToGuilds(banEvent, data.sourceGuild);
}
```

* Inserts ban event into `ban_events` table.
* Creates guild ban record for source.
* Syncs to target guilds.

#### Syncing to Guilds

```typescript
private async syncBanToGuilds(event: BanEvent, sourceGuildId: string): Promise<void> {
  const autoBanGuilds = await dbManager.getGuildConfigsForAutoban();
  const targetGuilds = autoBanGuilds.filter((config) => config.guildId !== sourceGuildId);
  for (const guildConfig of targetGuilds) {
    const guild = this.client?.guilds.cache.get(guildConfig.guildId);
    if (guild) {
      await guild.bans.create(event.userId, { reason: `Synced ban...` });
      await dbManager.createGuildBan({ /* target ban */ });
    }
  }
}
```

* Fetches guilds with auto-ban enabled.
* Bans user in each target guild via Discord API.
* Records in DB.

#### Handling Unbans

```typescript
async removeBan(data: { userId: string; sourceGuild: Guild; executorId: string }): Promise<void> {
  await dbManager.removeGuildBan(data.userId, data.sourceGuild.id);
  await this.syncUnbanToGuilds(ban, data.sourceGuild, data.executorId);
}
```

* Marks ban as inactive in DB.
* Syncs unban: Auto-unban or send review log.

For review mode:

* Uses `unbanLogger` to send a message with select menu for unban/ignore.

## Database Interactions

Managed by `manager.ts` using `pg` (PostgreSQL client).

#### Initialization

* Reads `.sql` files from `schemas/` and executes them to create tables (e.g., `guilds`, `ban_events`, `guild_bans`, `truth_sources`).

#### Key Operations

* **Guild Configs**: CRUD for settings (enabled, auto-ban, unban mode, logging channel).
* **Ban Events**: Insert and query global bans.
* **Guild Bans**: Track per-guild ban status.
* **Truth Sources**: Manage trusted users per guild.

Example query:

```typescript
async getBan(userId: string): Promise<BanEvent | null> {
  const result = await this.query("SELECT * FROM ban_events WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1", [userId]);
  // ...
}
```

## Logging and Unban Handling

### General Logging

`logger.ts` uses a queue for sequential webhook sends:

```typescript
async function sendLogInternal(data: any): Promise<void> {
  if (!wh) return;
  // Formats data as JSON or string, sends to webhook.
}
```

* Queues logs to avoid rate limits.
* Enabled when `LOGGING_WEBHOOK` is set in `.env`.

### Unban Logging

`unbanLogger.ts` builds messages using Discord's component builders:

```typescript
public buildLogMessage<T extends UnbanMessageType>(type: T, details: UnbanDetails<T>): RESTPostAPIChannelMessageJSONBody {
  const builder = new UnbanMessageBuilder<T>();
  return {
    flags: ComponentsV2Flags,
    components: builder.build(details, type),
    // ...
  };
}
```

* Creates containers with text, separators, thumbnails for unban details.
* For review type, adds a select menu for actions.
* Sends raw payload via REST API to logging channel.

## Configuration Management

`config.ts` loads from `.env` files:

* Parses `GUILDS` as array.
* Manages truth sources in memory (Map of Sets).
* Provides methods to add/remove sources and check if a user is a truth source.

Example:

```typescript
addTruthSource(guildId: string, source: string) {
  const _sources = this._truthSources.get(guildId) || new Set<string>();
  _sources.add(source);
  this._truthSources.set(guildId, _sources);
}
```

## Error Handling and Edge Cases

* Unhandled rejections/exceptions are logged.
* Database queries use parameterized statements to prevent SQL injection.
* Client checks for availability before actions.
* Rate limiting is handled via delays (e.g., 1s in unban flow).
