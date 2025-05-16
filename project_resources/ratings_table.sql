CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  recipe_id UUID REFERENCES recipes(id) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, recipe_id) -- One rating per user per recipe
);

-- Set up Row Level Security
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Policy: Ratings are viewable by everyone
CREATE POLICY "Ratings are viewable by everyone" ON ratings
  FOR SELECT USING (true);

-- Policy: Users can insert their own ratings
CREATE POLICY "Users can insert their own ratings" ON ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own ratings
CREATE POLICY "Users can update their own ratings" ON ratings
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own ratings
CREATE POLICY "Users can delete their own ratings" ON ratings
  FOR DELETE USING (auth.uid() = user_id);