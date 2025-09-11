# Configuration

Configuration is done via Discord slash commands. Only administrators should be able use these.

<mark style="color:$primary;">The default permissions needed for config commands is</mark> <mark style="color:$primary;"></mark><mark style="color:$primary;">**Admin**</mark><mark style="color:$primary;">.</mark>

### Basic Setup

* Invite the bot to all servers you want to connect.
* Run `/config sources-of-truth` to add trusted users/bots (their bans are treated as authoritative).

### Key Settings

* **Incoming Bans**: Enable/disable syncing bans from other servers to this one.
* **Outgoing Bans**: Enable/disable sharing this server's bans with others.
* **Unban Mode**: Choose "Automatic" (auto-unban) or "Review" (manual decision via logs).
* **Logging Channel**: Set a channel for unban notifications. **This is needed when the Unban Mode is set to "Review"!**

Changes are saved to the database automatically. The bot cleans up old data on startup (guild configurations which are not present anymore in the loaded env-file).

{% hint style="danger" %}
If you start up the bot without the correct command, which doesn't use the correct env-file, the bot will delete old guild configuration (not bans). So make sure to use the correct commands if you're not using the `pnpm` commands.
{% endhint %}
