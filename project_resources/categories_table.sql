CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  emoji TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policy: Categories are viewable by everyone
CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

-- Policy: Only admins can modify categories (you'll need to implement admin role)