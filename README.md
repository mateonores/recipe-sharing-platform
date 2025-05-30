# Recipe Sharing Platform

A modern web platform built with Next.js and Supabase where users can upload, browse, and interact with recipes.

## Features

- User authentication (email/password)
- User profiles with customizable usernames and display names
- Create, edit and share recipes with ingredients and step-by-step instructions
- Upload recipe images with automatic storage
- Browse recipes by category
- Comment on recipes
- Rate recipes
- Save favorite recipes

## Tech Stack

- **Frontend**: Next.js 15 with App Router
- **UI**: TailwindCSS, shadcn/ui
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- A Supabase account

### Setting up the Supabase Project

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Set up the database tables using the SQL scripts in the `project_resources` folder, in this order:

   - users_table.sql
   - categories_table.sql
   - recipes_table.sql
   - comments_table.sql
   - ratings_table.sql
   - favorites_table.sql

3. Enable Row Level Security (RLS) for all tables

4. Configure Supabase Auth to allow Sign Up with Email

5. **Set up Storage for Recipe Images:**

   Follow the detailed instructions in `project_resources/storage_setup.md` to configure the storage bucket and policies through the Supabase Dashboard.

   **Quick Summary:**

   - Create a bucket named `recipe-images` and set it to Public
   - Configure 4 storage policies through the dashboard:
     1. Public read access for all users
     2. Upload access for authenticated users
     3. Update access for users on their own images
     4. Delete access for users on their own images

   **Note:** You cannot create storage policies through the SQL Editor due to permission restrictions. Use the Supabase Dashboard interface instead.

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```
# Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Site URL (used for authentication callbacks)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Replace `your-supabase-url` and `your-supabase-anon-key` with your actual values from the Supabase dashboard.

### Installing Dependencies

```bash
npm install
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `app/`: Contains the Next.js pages and layouts
- `components/`: Reusable UI components
- `lib/`: Utility functions and client setup
- `public/`: Static assets
- `types/`: TypeScript type definitions
- `project_resources/`: SQL scripts and documentation

## Authentication Flow

1. Users sign up with email and password
2. A record is created in the Supabase Auth system
3. A corresponding record is created in the `users` table with username and optional full_name
4. Protected routes are guarded by middleware

## Database Schema

- **users**: User profiles
- **recipes**: Recipe information including ingredients and instructions
- **categories**: Recipe categories
- **comments**: User comments on recipes
- **ratings**: User ratings for recipes
- **favorites**: User's saved recipes

## Recipe Creation Features

- **Rich Form Validation**: Comprehensive validation using Zod schema
- **Dynamic Categories**: Categories loaded from database
- **Image Upload**: Support for recipe images with automatic resizing
- **Ingredients & Instructions**: Dynamic add/remove functionality
- **Real-time Preview**: Image preview before upload
- **Error Handling**: Graceful handling of upload failures

## Storage Configuration

The app uses Supabase Storage for recipe images. Images are stored in the `recipe-images` bucket with the following structure:

```
recipe-images/
  ├── {user-id}-{timestamp}.{extension}
  └── ...
```

**Important Notes:**

- Maximum file size: 5MB
- Supported formats: All image types (jpg, png, gif, webp, etc.)
- Images are automatically made public for viewing
- Users can only delete their own uploaded images

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
