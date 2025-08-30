# TODO

## Before beta test

- [ ] Write wiki article about why there are no logs

  - because there is no need for them, because the bot is designed to synchronize bans and unbans - not log them.
  - And since the bans are coming from external sources anyways, why even bother logging them?

- [ ] Write wiki article about the bot's concept

  - The bot is designed to synchronize bans and unbans across multiple servers, ensuring easier moderation for server administrators.
  - It achieves this by listening to ban and unban events from various sources and propagating those events to all connected servers.
  - The bot also maintains a list of "truth sources" - users who are allowed to issue ban and unban commands - to prevent abuse and ensure consistency.
  - The bot is designed to be lightweight and efficient, minimizing its impact on server performance while providing essential moderation features.
  - Since the bot does not log any events, it is important for server administrators to understand that the only way to see data is by accessing the database directly. Maybe there will be an implementation of an "export"-command in the future.

- [ ] Write wiki article about the bot's setup
  - Discord bot needs to be created in the Discord Developer Portal.
  - Bot token needs to be obtained and put in the env-file.
  - Bot needs to be invited to the servers where it will be used.
    - Minimum permissions required for the bot to function properly:
      - Send Messages & Embed Links (in the logging channel, if set)
      - Ban Members
      - See Audit Log (because it is necessary for the bot to verify ban and unban events)
  - Bot needs to be configured with the appropriate database connection settings. (env-file)

- [ ] Write wiki page about "how to self-host a discord bot"
