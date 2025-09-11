# How Ban Synchronization Works

### Ban Process

1. A user is banned in Server A.
2. The bot records the ban in its database, noting the reason and executor.
3. It checks connected servers (those with "incoming bans" enabled).
4. If auto-ban is on, it bans the user there. Otherwise, the server is skipped. _Maybe this will be changed to "review" in the future._

### Unban Process

1. A user is unbanned in Server A.
2. The bot marks the user as "no longer banned" in the database for this server.
3. For connected servers:
   * Auto mode: Unbans immediately.
   * Review mode: Sends a log message with options to "Unban locally" or "Ignore".

### Truth Sources

* These are trusted users (e.g., server owners, moderation bots).
* Only the bans and unbans of trusted sources are synced.
* Manage via `/config sources-of-truth`.

The bot ignores a special user ID because of an agreement with the owner of this bot.
