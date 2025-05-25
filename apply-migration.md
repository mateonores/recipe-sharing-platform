# Database Migration Instructions

Since Docker Desktop is not available, please apply the following SQL migration manually through the Supabase dashboard:

## Steps:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the following SQL commands in order:

```sql
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
```

## What this migration does:

1. **Adds rating column to comments**: Each comment can now optionally include a 1-5 star rating
2. **Allows multiple comments per user**: Users can ask questions and have conversations
3. **Ensures one review per user**: Only one comment with a rating per user per recipe (using partial unique index)
4. **Adds performance index**: Improves query performance for comments by recipe and user
5. **Removes ratings table**: Completely drops the separate ratings table since we're consolidating into comments
6. **Creates compatibility views**: Provides views for potential future needs

## After applying the migration:

- Users can add multiple comments per recipe (for questions, discussions, etc.)
- Users can add a rating to any of their comments (making it a review)
- Only one comment with a rating per user per recipe is allowed
- If a user adds a rating to a new comment, their previous review rating is removed
- Comments are displayed in two sections: "All Comments" and "Reviews Only"
- Recipe owners can comment but cannot rate their own recipes
- The system supports both conversational comments and review comments
