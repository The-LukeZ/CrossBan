import { ActivityType, Client, Collection, Events, GatewayIntentBits, Options } from "discord.js";
import { config } from "./config.js";
import { dbManager } from "./database/manager.js";
import InteractionHandler from "./utils/interactionHandler.js";

import { readdirSync } from "node:fs";
import { join as pathJoin } from "path";
import { getBanSyncManager, initBanSyncManager } from "./utils/banSyncManager.js";
import { initUnbanLogger } from "./utils/unbanLogger.js";
import { deployCommands } from "./utils/commandHelper.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildModeration,
  ],
  allowedMentions: { parse: [], repliedUser: false },
  makeCache: Options.cacheWithLimits({
    MessageManager: 128,
    GuildMessageManager: 128,
  }),
});

let commands = new Collection<string, any>();
let components = new Collection<string, any>();

const FILE_EXTENSION = config.NODE_ENV === "development" ? ".ts" : ".js";

// Function to load commands
async function loadCommands() {
  const newCommands = new Collection<string, () => Promise<any>>();
  const commandsPath = pathJoin(__dirname, "commands");
  const commandFiles = readdirSync(commandsPath, { encoding: "utf-8" })
    .filter((fn) => fn.endsWith(FILE_EXTENSION))
    .map((fn) => pathJoin(commandsPath, fn));

  console.debug("Commands path:", commandsPath);
  console.debug("Command files found:", commandFiles);

  console.debug("Loading commands...", {
    count: commandFiles.length,
  });

  for (const file of commandFiles) {
    try {
      const command = require(file);

      if (typeof command == "object" && "data" in command && "run" in command) {
        newCommands.set(command.data.name, command);
      } else {
        console.error(`The command at ${file} is missing a required "data" or "run" property.`);
      }
    } catch (error) {
      console.error(`Error loading command file ${file}`, {
        error,
      });
    }
  }

  // Replace the commands collection
  commands.clear();
  newCommands.forEach((value, key) => {
    commands.set(key, value);
  });
  return commands;
}

// Function to load components
async function loadComponents() {
  const newComponents = new Collection<string, any>();
  const componentsPath = pathJoin(__dirname, "components");
  const componentFiles = readdirSync(componentsPath)
    .filter((file) => file.endsWith(FILE_EXTENSION))
    .map((fn) => pathJoin(componentsPath, fn));

  console.debug("Loading components...");

  for (const file of componentFiles) {
    try {
      const comp = require(file);

      if (comp && "prefix" in comp && "run" in comp) {
        newComponents.set(comp.prefix, comp);
      } else {
        console.error(`The component file at ${file} is missing a required "prefix" or "run" property.`);
      }
    } catch (error) {
      console.error(`Error loading component file ${file}`, {
        error,
      });
    }
  }

  // Replace the components collection
  components.clear();
  newComponents.forEach((value, key) => {
    components.set(key, value);
  });
  return components;
}

// Function to load event listeners
async function loadEvents() {
  const eventsPath = pathJoin(__dirname, "events");
  console.log("Events path:", eventsPath);
  const eventsFolders = readdirSync(eventsPath, { encoding: "utf-8" });
  console.log("Events folders found:", eventsFolders);
  const clearedEventFolders = eventsFolders.filter((f) => Object.values(Events).includes(f as Events));
  console.log("Cleared event folders:", clearedEventFolders);

  console.info("Loading events...");

  for (const event of clearedEventFolders) {
    let eventPath = pathJoin(eventsPath, event);
    console.log("Event path:", eventPath);
    let eventFiles = readdirSync(eventPath)
      .filter((file) => file.endsWith(FILE_EXTENSION))
      .map((fn) => pathJoin(eventPath, fn));
    console.log(`Event files for ${event}:`, eventFiles);

    for (let file of eventFiles) {
      console.log(`Loading event file: ${file}`);
      try {
        const func = require(file).default;
        console.log("typeof func:", typeof func);
        if (typeof func !== "function") continue;

        client.on(event, (...args) => func(...args));
        console.log(`Added listener for event: ${event} (${func.name || "anonymous function"})`);
      } catch (error) {
        console.error(`Error loading event file ${file}`, {
          error,
        });
      }
    }
  }
}

function setupInteractionHandlers() {
  client.on("interactionCreate", new InteractionHandler(client, commands, components).handler());
}

// Function to load all modules
async function loadAllModules() {
  await loadCommands();
  await loadComponents();
  await loadEvents();
  setupInteractionHandlers();
}

client.once("clientReady", async (_client) => {
  config.setClientId(_client.application.id);
  console.log(`${_client.user.username} is online!`);

  initUnbanLogger(_client);
  initBanSyncManager(_client);

  await deployCommands(pathJoin(__dirname, "commands"), {
    appId: _client.application.id,
    appToken: _client.token,
    fileExtension: FILE_EXTENSION,
  });

  const cfgs = await dbManager.getGuildConfigsForAutoban();

  _client.user.setActivity({
    name: `${cfgs.length} guild${cfgs.length === 1 ? "" : "s"}`,
    type: ActivityType.Watching,
  });
});

(async function start() {
  console.info("[APP] Starting application initialization...");

  console.debug("[APP] Loading modules...");
  await loadAllModules();
  console.info("[APP] All modules loaded successfully");

  console.debug("[DB] Initializing database manager...");
  await dbManager.initialize();
  console.info("[DB] Database manager initialized");

  console.debug("[CONFIG] Checking guild configurations...");
  const guildIds = config.guildIds;
  console.info(`[CONFIG] Found ${guildIds.length} guild(s) in configuration`);

  const presentGuilds = await dbManager.query("SELECT guild_id FROM guilds WHERE guild_id = ANY($1)", [guildIds]);
  const presentGuildIds = new Set(presentGuilds.rows.map((row) => row.guild_id));
  console.debug(`[DB] Found ${presentGuildIds.size} existing guild configuration(s) in database`);

  for (const guildId of guildIds) {
    if (!presentGuildIds.has(guildId)) {
      console.info(`[DB] Creating database configuration for guild ${guildId}...`);
      const result = await dbManager.setGuildConfig({ guildId });
      console.info(`[DB] Successfully created database config for guild ${guildId}`, { result });
    }
  }

  // Delete obsolete guilds and truth sources from db
  console.debug("[DB] Cleaning up obsolete database entries...");
  const envGuilds = config.guildIds;

  const deletedGuilds = await dbManager.query("DELETE FROM guilds WHERE guild_id != ALL($1)", [envGuilds]);
  console.debug(`[DB] Deleted ${deletedGuilds.rowCount || 0} obsolete guild(s) from database`);

  const deletedTruthSources = await dbManager.query("DELETE FROM truth_sources WHERE guild_id != ALL($1)", [envGuilds]);
  console.debug(`[DB] Deleted ${deletedTruthSources.rowCount || 0} obsolete truth source(s) from database`);

  console.debug("[DB] Loading truth sources from database...");
  const truthSources = await dbManager.query("SELECT guild_id, user_id FROM truth_sources");

  truthSources.rows.forEach((row) => {
    config.addTruthSource(row.guild_id, row.user_id);
  });
  console.info(`[DB] Loaded ${truthSources.rows.length} truth source(s) from database`);

  console.info("[APP] Logging in to Discord...");
  client.login(config.botToken);

  console.info("[APP] Enabling ban sync manager...");
  getBanSyncManager().enable();

  console.info("[APP] Application startup completed successfully");
})();
