
-- Enums
CREATE TYPE public.room_status AS ENUM ('waiting', 'in_progress', 'completed');
CREATE TYPE public.participant_status AS ENUM ('idle', 'coding', 'submitted');
CREATE TYPE public.difficulty AS ENUM ('Easy', 'Medium', 'Hard');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  leetcode_username TEXT,
  elo_rating INTEGER NOT NULL DEFAULT 1500,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Rooms table
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  host_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.room_status NOT NULL DEFAULT 'waiting',
  max_players INTEGER NOT NULL DEFAULT 4,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rooms are viewable by everyone" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create rooms" ON public.rooms FOR INSERT WITH CHECK (auth.uid() = host_user_id);
CREATE POLICY "Host can update room" ON public.rooms FOR UPDATE USING (auth.uid() = host_user_id);

-- Room participants
CREATE TABLE public.room_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.participant_status NOT NULL DEFAULT 'idle',
  score INTEGER NOT NULL DEFAULT 0,
  solve_time_seconds INTEGER,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants are viewable by everyone" ON public.room_participants FOR SELECT USING (true);
CREATE POLICY "Authenticated users can join rooms" ON public.room_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own participation" ON public.room_participants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can leave rooms" ON public.room_participants FOR DELETE USING (auth.uid() = user_id);

-- Room problems
CREATE TABLE public.room_problems (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  leetcode_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  difficulty public.difficulty NOT NULL,
  url TEXT NOT NULL,
  topics TEXT[] NOT NULL DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.room_problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room problems are viewable by everyone" ON public.room_problems FOR SELECT USING (true);
CREATE POLICY "Host can insert room problems" ON public.room_problems FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.rooms WHERE id = room_id AND host_user_id = auth.uid())
);

-- Topic mastery
CREATE TABLE public.topic_mastery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  solved_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, topic)
);

ALTER TABLE public.topic_mastery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Topic mastery is viewable by everyone" ON public.topic_mastery FOR SELECT USING (true);
CREATE POLICY "Users can manage their own topic mastery" ON public.topic_mastery FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own topic mastery" ON public.topic_mastery FOR UPDATE USING (auth.uid() = user_id);

-- Solved problems cache
CREATE TABLE public.solved_problems (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leetcode_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  difficulty public.difficulty NOT NULL,
  topics TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, leetcode_id)
);

ALTER TABLE public.solved_problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solved problems viewable by everyone" ON public.solved_problems FOR SELECT USING (true);
CREATE POLICY "Users can insert their solved problems" ON public.solved_problems FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their solved problems" ON public.solved_problems FOR UPDATE USING (auth.uid() = user_id);

-- Timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Random room code generator
CREATE OR REPLACE FUNCTION public.generate_room_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_problems;
