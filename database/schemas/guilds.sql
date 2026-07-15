-- Test script to check enum creation with conditional logic

-- Method 1: Use DO block with exception handling
DO $$
BEGIN
    CREATE TYPE UnbanMode AS ENUM ('AUTO', 'REVIEW');
    RAISE NOTICE 'UnbanMode enum created successfully';
EXCEPTION 
    WHEN duplicate_object THEN
        RAISE NOTICE 'UnbanMode enum already exists';
END
$$;

-- Test the enum
SELECT 'AUTO'::UnbanMode AS test_value;

CREATE TABLE
    IF NOT EXISTS guilds (
        guild_id VARCHAR(255) PRIMARY KEY,
        enabled BOOLEAN DEFAULT true,
        auto_ban BOOLEAN DEFAULT true,
        unban_mode UnbanMode DEFAULT 'AUTO',
        logging_channel_id VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT NOW ()
    );