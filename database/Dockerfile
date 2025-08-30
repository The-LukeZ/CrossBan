FROM postgres:17

# Copy custom entrypoint and init scripts
COPY ./entrypoint.sh /usr/local/bin/
COPY ./wait-and-init.sh /usr/local/bin/

# Make scripts executable
RUN chmod +x /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/wait-and-init.sh

# Set custom entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["postgres"]