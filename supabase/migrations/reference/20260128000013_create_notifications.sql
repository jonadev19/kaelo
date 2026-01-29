-- Create notifications table
-- Stores user notifications and alerts

CREATE TABLE IF NOT EXISTS public.notifications (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign keys
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Notification details
    type TEXT NOT NULL CHECK (
        type IN (
            'route_published', 'route_featured', 'new_follower', 'new_review',
            'review_response', 'order_status', 'coupon_unlocked', 'badge_earned',
            'level_up', 'route_completion', 'business_promotion', 'system_announcement'
        )
    ),
    title TEXT NOT NULL,
    message TEXT NOT NULL,

    -- Related entities
    related_route_id UUID REFERENCES public.routes(id) ON DELETE CASCADE,
    related_business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    related_order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    related_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Additional data
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Action
    action_url TEXT,
    action_label TEXT,

    -- Status
    is_read BOOLEAN NOT NULL DEFAULT false,
    is_archived BOOLEAN NOT NULL DEFAULT false,

    -- Priority
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (
        priority IN ('low', 'normal', 'high', 'urgent')
    ),

    -- Timestamps
    read_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_metadata CHECK (jsonb_typeof(metadata) = 'object')
);

-- Add table comment
COMMENT ON TABLE public.notifications IS 'User notifications and alerts';

-- Add column comments
COMMENT ON COLUMN public.notifications.type IS 'Type of notification';
COMMENT ON COLUMN public.notifications.metadata IS 'Additional notification data';
COMMENT ON COLUMN public.notifications.action_url IS 'URL to navigate to when notification is clicked';
COMMENT ON COLUMN public.notifications.priority IS 'Notification priority level';
COMMENT ON COLUMN public.notifications.expires_at IS 'When notification should be automatically archived';

-- Create index on user_id and read status
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
ON public.notifications(user_id, is_read, created_at DESC);

-- Create index on user_id and archived status
CREATE INDEX IF NOT EXISTS idx_notifications_user_archived
ON public.notifications(user_id, is_archived, created_at DESC);

-- Create index on type for filtering
CREATE INDEX IF NOT EXISTS idx_notifications_type
ON public.notifications(type);

-- Create index on expires_at for cleanup
CREATE INDEX IF NOT EXISTS idx_notifications_expires
ON public.notifications(expires_at)
WHERE expires_at IS NOT NULL;

-- Create function to set read timestamp
CREATE OR REPLACE FUNCTION public.handle_notification_read()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_read = true AND (OLD.is_read IS NULL OR OLD.is_read = false) THEN
        NEW.read_at = NOW();
    ELSIF NEW.is_read = false THEN
        NEW.read_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_read_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_notification_read();

-- Create function to set archived timestamp
CREATE OR REPLACE FUNCTION public.handle_notification_archived()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_archived = true AND (OLD.is_archived IS NULL OR OLD.is_archived = false) THEN
        NEW.archived_at = NOW();
    ELSIF NEW.is_archived = false THEN
        NEW.archived_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_archived_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_notification_archived();

-- Create function to automatically archive expired notifications
CREATE OR REPLACE FUNCTION public.archive_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
    rows_updated INTEGER;
BEGIN
    UPDATE public.notifications
    SET is_archived = true
    WHERE expires_at IS NOT NULL
    AND expires_at < NOW()
    AND is_archived = false;

    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    RETURN rows_updated;
END;
$$ LANGUAGE plpgsql;

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign key
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Preferences by notification type
    route_published BOOLEAN NOT NULL DEFAULT true,
    route_featured BOOLEAN NOT NULL DEFAULT true,
    new_follower BOOLEAN NOT NULL DEFAULT true,
    new_review BOOLEAN NOT NULL DEFAULT true,
    review_response BOOLEAN NOT NULL DEFAULT true,
    order_status BOOLEAN NOT NULL DEFAULT true,
    coupon_unlocked BOOLEAN NOT NULL DEFAULT true,
    badge_earned BOOLEAN NOT NULL DEFAULT true,
    level_up BOOLEAN NOT NULL DEFAULT true,
    route_completion BOOLEAN NOT NULL DEFAULT true,
    business_promotion BOOLEAN NOT NULL DEFAULT true,
    system_announcement BOOLEAN NOT NULL DEFAULT true,

    -- Delivery preferences
    push_enabled BOOLEAN NOT NULL DEFAULT true,
    email_enabled BOOLEAN NOT NULL DEFAULT true,
    sms_enabled BOOLEAN NOT NULL DEFAULT false,

    -- Quiet hours
    quiet_hours_enabled BOOLEAN NOT NULL DEFAULT false,
    quiet_hours_start TIME,
    quiet_hours_end TIME,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_user_preferences UNIQUE (user_id)
);

-- Add table comment
COMMENT ON TABLE public.notification_preferences IS 'User notification delivery preferences';

-- Create trigger to automatically update updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
