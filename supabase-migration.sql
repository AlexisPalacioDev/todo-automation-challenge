-- Migration to add category fields to todos table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE todos 
ADD COLUMN IF NOT EXISTS category_is_custom BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS category_reason TEXT;

-- Add comments to document the new columns
COMMENT ON COLUMN todos.category IS 'Category assigned by AI (e.g., "compras", "trabajo")';
COMMENT ON COLUMN todos.category_is_custom IS 'Whether the category is custom (true) or from predefined list (false)';
COMMENT ON COLUMN todos.category_reason IS 'AI explanation for why this category was chosen';

-- Optional: Create an index on category for better filtering performance
CREATE INDEX IF NOT EXISTS idx_todos_category ON todos(category);