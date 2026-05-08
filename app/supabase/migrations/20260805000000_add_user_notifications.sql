-- Migration: Add user_notifications table for In-App messaging (Phase 1)
-- Created: 2026-08-05

-- 1. Create user_notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    sender_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'direct' CHECK (type IN ('direct', 'mass', 'system')),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Index for fast unread counts and user lookups
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_unread ON user_notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_user_notifications_created ON user_notifications(created_at DESC);

-- 3. Enable RLS
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- 4. Policies
-- Users can only see their own notifications
CREATE POLICY "Users see own notifications"
    ON user_notifications FOR SELECT
    USING (auth.uid()::text = user_id);

-- Users can update only their own notifications (mark as read)
CREATE POLICY "Users mark own notifications read"
    ON user_notifications FOR UPDATE
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

-- Admins can insert notifications to any user
CREATE POLICY "Admins can send notifications"
    ON user_notifications FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()::text AND role = 'admin'
        )
    );

-- Admins can delete notifications they sent or any system notification
CREATE POLICY "Admins can delete notifications"
    ON user_notifications FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()::text AND role = 'admin'
        )
    );
