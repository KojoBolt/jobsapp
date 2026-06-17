-- Enable pg_cron and http extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Create a function to trigger the drip-batch edge function
CREATE OR REPLACE FUNCTION public.trigger_drip_batch()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- We use net_post to call the edge function asynchronously
  -- SUPABASE_URL and SERVICE_ROLE should be handled by the environment or replaced with actual values
  -- However, in a migration, we can use the project's internal URL if known, 
  -- but generally, we use the HTTP extension if available.
  
  -- For now, we will use a simpler approach: 
  -- Most users use a cron schedule to call the edge function via an external service 
  -- OR they use pg_cron with the 'net' extension.
  
  PERFORM extensions.http_post(
    url := 'https://pempjibekapukdoethro.supabase.co/functions/v1/drip-batch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(current_setting('app.settings.service_role_key', true), 'REPLACE_WITH_YOUR_SERVICE_ROLE_KEY')
    ),
    body := '{}'
  );
END;
$$;

-- Schedule the cron job to run every 10 minutes
-- (The drip-batch function itself checks 'next_batch_at' for each campaign)
SELECT cron.schedule(
  'drip-batch-scheduler',
  '*/10 * * * *',
  $$ SELECT public.trigger_drip_batch(); $$
);
