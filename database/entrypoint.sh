#!/bin/bash

# Start the background initialization process
/usr/local/bin/wait-and-init.sh &

# Call the original PostgreSQL entrypoint with all arguments
exec /usr/local/bin/docker-entrypoint.sh "$@"