Product Requirements Document (PRD): Recipe Sharing Platform

Project Overview
Build a modern web platform where users can upload, browse, and interact with recipes. The app will use Next.js for the frontend and Supabase for database, authentication, and file storage. The project will not use the /src folder convention from Next.js.
Core Features

User Authentication

    Sign up, login, and logout using Supabase Auth

    User profile management (avatar, bio, etc.)

Recipe Management

    Upload recipes with:

        Title, description, ingredients, instructions

        Image upload for recipe photos

        Categories/tags (e.g., dessert, vegan)

    Edit and delete own recipes

Recipe Browsing and Discovery

    List and detail pages for recipes

    Advanced search and filtering (by ingredient, category, tags)

    Sorting (by rating, newest, most popular)

Community and Engagement

    Commenting on recipes

    Recipe ratings (stars or likes)

    Save/favorite recipes for personal collections

Media Support

    Upload and display images (optional: videos)

    Responsive design for mobile and desktop

Optional Advanced Features

    Meal planning and grocery list generation

Social sharing (share recipes via link or social platforms)

Tech Stack
Layer Technology Notes
Frontend Next.js (Pages Router, no /src) React-based, SSR/SSG support
Styling TailwindCSS, shadcn-ui (optional) Rapid UI development
Backend Supabase PostgreSQL DB, Auth, Storage, Realtime
File Storage Supabase Storage For recipe images and media
Deployment Vercel (recommended) Seamless Next.js deployment

Step-by-Step Implementation Guide

Step 1: Project Setup

    Initialize Next.js app (without /src) (already done)

Step 2: Supabase Configuration

    Create a Supabase project at supabase.com

    In Supabase dashboard:

        Create tables: users, recipes, comments, categories, favorites, ratings

        Enable Row Level Security (RLS) and set policies

    Set up Supabase Auth (email/password, optionally OAuth)

    Configure Supabase Storage for image uploads

Copy Supabase URL and anon key to .env.local:

    text
    NEXT_PUBLIC_SUPABASE_URL=your-url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

Step 3: User Authentication

    Integrate Supabase Auth in Next.js

    Create signup, login, and profile pages

Step 4: Recipe CRUD Functionality

    Create forms/pages to add, edit, and delete recipes

    Use Supabase Storage for image uploads

    Connect recipe data to Supabase tables

Step 5: Browsing & Discovery

    Build recipe list and detail pages

    Implement search and filtering by category, ingredient, tag

    Add sorting options

Step 6: Community Features

    Implement commenting and rating systems

    Allow users to save/favorite recipes

Step 7: User Profiles

    Display user’s uploaded and favorite recipes

    Allow avatar upload (optional)

Step 8: (Optional) Advanced Features

    Add meal planning and grocery list generation

    Enable social sharing of recipes

Step 9: Testing and QA

    Test all user flows (auth, upload, browse, interact)

    Ensure RLS and security policies are correct

Step 10: Deployment

    Deploy to Vercel or preferred platform

    Set environment variables in deployment dashboard

Database Schema Overview
Table Fields
users id, email, name, avatar_url, bio
recipes id, user_id, title, description, ingredients, instructions, image_url, category_id, created_at
categories id, name
comments id, user_id, recipe_id, content, created_at
ratings id, user_id, recipe_id, rating (int), created_at
favorites id, user_id, recipe_id, created_at
