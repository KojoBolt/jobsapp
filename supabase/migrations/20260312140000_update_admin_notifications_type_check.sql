-- Add support_message to the admin_notifications type check constraint
-- We need to drop and recreate the constraint to include support_message

ALTER TABLE public.admin_notifications DROP CONSTRAINT IF EXISTS admin_notifications_type_check;

ALTER TABLE public.admin_notifications 
ADD CONSTRAINT admin_notifications_type_check 
CHECK (type IN ('new_application', 'new_user', 'campaign_complete', 'campaign_failed', 'support_message'));
