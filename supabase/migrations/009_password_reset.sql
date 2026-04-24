-- Migration: Add password reset verification codes table
-- This table stores temporary verification codes for password reset functionality

CREATE TABLE IF NOT EXISTS password_reset_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(100) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick lookup by email
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_email ON password_reset_codes(email);

-- Index for quick lookup by code
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_code ON password_reset_codes(code);

-- Auto-delete old unused codes (older than 24 hours)
-- This is handled in application logic for now

COMMENT ON TABLE password_reset_codes IS 'Stores temporary verification codes for password reset functionality';
COMMENT ON COLUMN password_reset_codes.code IS '6-digit verification code';
COMMENT ON COLUMN password_reset_codes.expires_at IS 'Code expiration time, typically 10 minutes after creation';
COMMENT ON COLUMN password_reset_codes.used_at IS 'Timestamp when code was used, NULL if not yet used';
