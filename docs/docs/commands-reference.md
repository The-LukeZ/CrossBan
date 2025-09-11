# Commands Reference

All commands start with config and require admin permissions by default - and should be kept to that.

* **Sources of Truth**:
  * `/config sources-of-truth`: Manage trusted users.
* **Unban Logging**:
  * `/config unban-logging channel:<channel>`: Set log channel.
* **Unban Sync**:
  * `/config unban-sync behavior:<mode>`: Set to "Automatic" or "Review".
* **Incoming/Outgoing Bans**:
  * `/config incoming-bans enabled:<True/False>`: Set syncing incoming bans.
  * `/config outgoing-bans enabled:<True/False>`: Set sharing outgoing bans.

Interactions (like buttons in logs) handle unban decisions without commands.
