-- Run this in your Supabase SQL Editor

-- 1. Feedback Table
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    message TEXT NOT NULL,
    urgency TEXT NOT NULL,
    grade TEXT,
    status TEXT DEFAULT 'Received',
    is_spam BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Supporters Table
CREATE TABLE IF NOT EXISTS public.supporters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert dummy announcements
INSERT INTO public.announcements (title, description) VALUES 
('Campaign Launch', 'The Fire & Ice campaign has officially launched. Speak up and be heard.'),
('New Anonymous Feedback Live', 'You can now submit your concerns securely and anonymously.');

-- Disable Row Level Security so the anon API key can read/write directly
ALTER TABLE public.feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.supporters DISABLE ROW LEVEL SECURITY;

-- 4. Pulse Table
CREATE TABLE IF NOT EXISTS public.pulse (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    issue_name TEXT UNIQUE NOT NULL,
    votes INTEGER DEFAULT 0
);
ALTER TABLE public.pulse DISABLE ROW LEVEL SECURITY;

INSERT INTO public.pulse (issue_name, votes) VALUES
('Anti-Bullying Initiatives', 0),
('Canteen Quality', 0),
('Homework Load', 0),
('Mental Health Support', 0),
('Communication with Teachers', 0),
('Club Funding', 0),
('Toilet Facilities', 0),
('Study Spaces', 0),
('Safety on Campus', 0),
('Inclusive Events', 0)
ON CONFLICT DO NOTHING;

-- 5. Ideas Table
CREATE TABLE IF NOT EXISTS public.ideas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    idea_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    impact TEXT NOT NULL,
    grade TEXT,
    status TEXT DEFAULT 'Under Review',
    is_spam BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.ideas DISABLE ROW LEVEL SECURITY;

-- 6. Lost & Found Table
CREATE TABLE IF NOT EXISTS public.lost_found (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL,
    item_name TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    contact TEXT,
    date_posted TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now() + interval '14 days') NOT NULL
);
ALTER TABLE public.lost_found DISABLE ROW LEVEL SECURITY;

-- 7. Study Groups Table
CREATE TABLE IF NOT EXISTS public.study_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    looking_for TEXT NOT NULL,
    grade TEXT NOT NULL,
    preferred_time TEXT NOT NULL,
    date_posted TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now() + interval '7 days') NOT NULL
);
ALTER TABLE public.study_groups DISABLE ROW LEVEL SECURITY;

-- 8. Filter Logs Table
CREATE TABLE IF NOT EXISTS public.filter_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    form_type TEXT NOT NULL,
    reason TEXT NOT NULL,
    flagged_tokens TEXT,
    truncated_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.filter_logs DISABLE ROW LEVEL SECURITY;

-- 9. Whitelist Table
CREATE TABLE IF NOT EXISTS public.whitelist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.whitelist DISABLE ROW LEVEL SECURITY;
