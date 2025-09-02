CREATE TABLE
    IF NOT EXISTS ban_events (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        source_guild VARCHAR(255) NOT NULL,
        source_user VARCHAR(255) NOT NULL,
        reason TEXT,
        created_at TIMESTAMP DEFAULT NOW (),
        revoked BOOLEAN DEFAULT false
    );

-- Ban table only has the synced bans in it. The ban events are in the other table above.
CREATE TABLE
    IF NOT EXISTS guild_bans (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        guild_id VARCHAR(255) NOT NULL,
        is_banned BOOLEAN DEFAULT FALSE,
        ban_event_id INTEGER REFERENCES ban_events (id), -- Links to the originating event
        applied_at TIMESTAMP DEFAULT NOW (),
        last_updated TIMESTAMP DEFAULT NOW (),
        UNIQUE (user_id, guild_id, is_banned) -- One state record per user per guild because a user can only be banned once per guild (if they are banned)
    );