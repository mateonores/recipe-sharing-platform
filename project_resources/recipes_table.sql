CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  ingredients JSONB NOT NULL, -- Store as structured data
  instructions JSONB NOT NULL, -- Store as structured data
  image_url TEXT,
  category_id UUID REFERENCES categories(id),
  time INTEGER, -- Cooking time in minutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up Row Level Security
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Policy: Recipes are viewable by everyone
CREATE POLICY "Recipes are viewable by everyone" ON recipes
  FOR SELECT USING (true);

-- Policy: Users can insert their own recipes
CREATE POLICY "Users can insert their own recipes" ON recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own recipes
CREATE POLICY "Users can update their own recipes" ON recipes
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own recipes
CREATE POLICY "Users can delete their own recipes" ON recipes
  FOR DELETE USING (auth.uid() = user_id);