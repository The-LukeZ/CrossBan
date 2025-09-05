# Overview

### What is CrossBan?

CrossBan is a self-hosted Discord bot that automatically shares ban information between connected servers.\
When a user is banned in one server, the bot can ban them in others, preventing banned users from joining through alternative servers. Unbans can also be synced, but handled a little bit different.

### Key Features

* **Ban Synchronization**: Automatically apply bans across servers.
* **Flexible Modes**: Choose automatic bans or manual review.
* **Logging**: Track unbans and bans in dedicated channels.
* **Truth Sources**: Designate trusted users whose bans are synced.
* **Easy Setup**: Runs in Docker for simple deployment.

### How It Works (High-Level)

1. Admins configure the bot for their servers.
2. When a ban occurs, the bot checks connected servers.
3. Based on settings, it either auto-bans or sends a review message.
4. Unbans are handled similarly, with options for manual approval.

The bot uses a database to store ban records and server settings. It's not a public bot - you host it yourself.

{% hint style="info" %}
If you are interested in getting an understanding of how the bot works under the hood, visit [under-the-hood.md](under-the-hood.md "mention").
{% endhint %}
