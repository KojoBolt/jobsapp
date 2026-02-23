-- Migration to add 'role' column to 'profiles' table
ALTER TABLE public.profiles ADD COLUMN role text;
