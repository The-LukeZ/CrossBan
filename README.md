# CrossBan

A Discord bot for ban-synchronization across multiple servers.

> [!IMPORTANT]
> This is not a public bot, but the source code is available for you to self-host.
> Please do not use this bot for malicious purposes.
>
> The license for this code is PolyForm Noncommercial License 1.0.0 - this means everyone is allowed to use it, but you are forbidden to make any money with it and use it for other commercial purposes.

## Installation

### Prerequisites

- Docker and Docker Compose installed on your system
- Git (to clone the repository)

### Setup

1. **Clone the repository**

```bash
git clone https://github.com/The-LukeZ/CrossBan.git
cd CrossBan
```

2. **Create environment file**

```bash
cp .env.example .env.local
```

Edit `.env.local` and replace the placeholders with your actual values.

3. **Start the application**

```bash
docker compose --env-file .env.local -f 'docker-compose.dev.yml' up -d --build
```

<details>
  <summary>Shorter Alternative</summary>

Use the script from the package.json.

```bash
pnpm docker:dev
```

</details>

4. **Verify the installation**

```bash
docker-compose -f docker-compose.dev.yml logs
```

The bot should now be running and connected to your Discord server. The database will be automatically initialized on startup (This is not fully tested yet).

### Stopping the application

```bash
docker-compose -f docker-compose.dev.yml down
```

### Running Production Grade Code

There isn't much difference between the development and production setups.
However, you want to use a different `docker-compose` file for production: `docker-compose.prod.yml`

#### Steps

You maybe want to test out new stuff which you don't want the live database to be affected by.  
You definitely want to change the env-file, because the `docker-compose.prod.yml` uses `.env.production`.

1. Clone a new env file

```bash
# Assuming you have already created a .env.local file
cp .env.local .env.production
# Otherwise clone the example env and fill out the variables
cp .env.example .env.production
```

Now you just have to fill in some proper credentials.

2. Start the production setup

```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## Troubleshooting

### Database not found

It can happen, that an error occurs during the docker build process. if the error is, that the database is not found, this is most likely due to the fact, that the `postgres:17` image automatically creates a new database cluster with the name of `$POSTGRES_DB` on startup.

> [!TIP]
> Check the container's logs before doing anything!

However, it happened to me a lot of times, that the database was not initialized properly. Here are some solutions that may work:

#### Checking the docker-compose, your env-files and the script

1. Make sure, that the `POSTGRES_DB`, `POSTGRES_USER` and `POSTGRES_PASSWORD` variables are set in your env-file.
2. make sure that the file name of the env-file is the same as the one used in the docker-compose file **and** the command parameter you used to run `docker compose`.
3. Make sure you ran the right command.

#### Reinitialize the volume

If nothing helps, terminate it.

> [!DANGER]
> This will delete all existing data in the database. So this is is only recommended for development environments, no other solutions work or there is not data yet.

1. Delete the database container of the database.
2. Delete the volume.
3. Restart the database container.

## License

This project is licensed under the **PolyForm Noncommercial License 1.0.0** - <https://polyformproject.org/licenses/noncommercial/1.0.0/>

This license allows you to use, modify, and distribute the code for noncommercial purposes, but you may not use it for commercial purposes or to make money.
