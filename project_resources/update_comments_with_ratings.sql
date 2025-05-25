-- Add rating column to comments table
ALTER TABLE comments ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5);

-- Create index for better performance when querying comments with ratings
CREATE INDEX idx_comments_recipe_user ON comments(recipe_id, user_id);

-- Create a partial unique index to ensure only one comment with rating per user per recipe
-- This allows multiple comments without ratings, but only one comment with a rating
CREATE UNIQUE INDEX idx_unique_rating_per_user_recipe 
ON comments(user_id, recipe_id) 
WHERE rating IS NOT NULL;

-- Drop the ratings table completely since we're moving ratings to comments
DROP TABLE IF EXISTS ratings;

-- Create a view to get recipe ratings from comments for backward compatibility
CREATE OR REPLACE VIEW recipe_ratings AS
SELECT 
    recipe_id,
    user_id,
    rating,
    created_at
FROM comments 
WHERE rating IS NOT NULL;

-- Create a view to get average ratings per recipe
CREATE OR REPLACE VIEW recipe_average_ratings AS
SELECT 
    recipe_id,
    AVG(rating::numeric) as average_rating,
    COUNT(rating) as rating_count
FROM comments 
WHERE rating IS NOT NULL
GROUP BY recipe_id; 