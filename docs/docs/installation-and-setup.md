# Installation and Setup

### Prerequisites

* A computer or server with Docker and Docker Compose installed.
* A Discord bot token (create one at the [Discord Developer Portal](https://discord.com/developers/applications)).
* PostgreSQL database access (handled via Docker).

### Step-by-Step Setup

1.  **Clone the Repository**:

    ```bash
    git clone https://github.com/The-LukeZ/CrossBan.git
    cd CrossBan
    ```
2. **Prepare Environment File**:
   * Copy the example: `cp .env.example .env`
   * Edit .env with your details.
3.  **Start the Bot**:

    ```bash
    pnpm docker:build  # run this only once, otherwise data will be lost
    pnpm docker:start  # use this once you have built the container
    ```

    * This builds and runs the app in containers.
4. **Invite the Bot**:
   * Use the Discord Developer portal to generate an invite link with permissions for managing bans and messages, and most importantly seeing Audit Logs.
5. **Verify**:
   * The bot should appear online in your servers. Run config to start configuring.

