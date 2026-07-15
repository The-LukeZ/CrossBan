CREATE TABLE
    IF NOT EXISTS ban_events (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        source_guild VARCHAR(255) NOT NULL,
        source_user VARCHAR(255) NOT NULL,
        reason TEXT,
        created_at TIMESTAMP DEFAULT NOW ()
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
        is_source BOOLEAN DEFAULT FALSE,
        last_updated TIMESTAMP DEFAULT NOW ()
    );

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_indexes 
        WHERE indexname = 'unique_user_guild_when_banned' 
        AND schemaname = 'public'
    ) THEN
        CREATE INDEX unique_user_guild_when_banned ON guild_bans (user_id, guild_id)
        WHERE
            is_banned = TRUE;
    END IF;
END $$;
