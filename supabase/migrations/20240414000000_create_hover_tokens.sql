-- Create hover_tokens table
CREATE TABLE IF NOT EXISTS public.hover_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS hover_tokens_user_id_idx ON public.hover_tokens(user_id);

-- Enable Row Level Security
ALTER TABLE public.hover_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own tokens
CREATE POLICY "Users can read their own hover tokens"
  ON public.hover_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own tokens
CREATE POLICY "Users can insert their own hover tokens"
  ON public.hover_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own tokens
CREATE POLICY "Users can update their own hover tokens"
  ON public.hover_tokens
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own tokens
CREATE POLICY "Users can delete their own hover tokens"
  ON public.hover_tokens
  FOR DELETE
  USING (auth.uid() = user_id); 