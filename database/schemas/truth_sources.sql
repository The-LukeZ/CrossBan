CREATE TABLE
    IF NOT EXISTS truth_sources (
        user_id VARCHAR(255) NOT NULL,
        guild_id VARCHAR(255) NOT NULL,
        created_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW (),
        PRIMARY KEY (guild_id, user_id)
    )