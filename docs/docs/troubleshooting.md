# Troubleshooting

### Common Issues

* **Bot Not Responding**: Check if it's online in Discord. Verify token and permissions.
* **Database Errors**: Ensure PostgreSQL is running. Reinitialize the Docker volume if needed (deletes data!).
* **Bans Not Syncing**: Confirm "incoming bans" is enabled and servers are connected.
* **Logs Not Sending**: Set a logging channel and ensure the bot has message permissions.

### Logs and Debugging

* View Docker logs: `docker compose logs`
* Enable debug logging by setting a webhook in the env file with the key `LOGGING_WEBHOOK`. This will produce **a ton** of logs, so only use it for debugging purposes.
* If issues persist, check the bot's console output.
* Open a GitHub Issue if nothing works.

### Support

* Review the README for advanced tips.
* For code issues, open an Issue on GitHub.
