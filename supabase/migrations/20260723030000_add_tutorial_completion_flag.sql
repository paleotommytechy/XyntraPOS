-- Migration: Add has_completed_tutorial Flag to Profiles Table

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_completed_tutorial BOOLEAN DEFAULT false;
