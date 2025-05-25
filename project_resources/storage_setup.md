# Supabase Storage Setup for Recipe Images

Since you cannot create storage policies directly through the SQL Editor due to permission restrictions, follow these steps to set up storage through the Supabase Dashboard:

## Step 1: Create the Storage Bucket

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Set the bucket name to: `recipe-images`
5. Set the bucket to **Public** (this allows public read access to images)
6. Click **"Create bucket"**

## Step 2: Configure Storage Policies

1. In the Storage section, click on your `recipe-images` bucket
2. Go to the **"Policies"** tab
3. You should see options to create policies for different operations

### Policy 1: Public Read Access (SELECT)

- Click **"New Policy"**
- Choose **"For full customization"**
- Set the following:
  - **Policy name**: `Public Access`
  - **Allowed operation**: `SELECT`
  - **Target roles**: `public` (or leave empty for public access)
  - **USING expression**: `true` (allows everyone to read)
- Click **"Review"** then **"Save policy"**

### Policy 2: Authenticated Upload (INSERT)

- Click **"New Policy"**
- Choose **"For full customization"**
- Set the following:
  - **Policy name**: `Authenticated users can upload images`
  - **Allowed operation**: `INSERT`
  - **Target roles**: `authenticated`
  - **WITH CHECK expression**: `true`
- Click **"Review"** then **"Save policy"**

### Policy 3: Users can update own images (UPDATE)

- Click **"New Policy"**
- Choose **"For full customization"**
- Set the following:
  - **Policy name**: `Users can update own images`
  - **Allowed operation**: `UPDATE`
  - **Target roles**: `authenticated`
  - **USING expression**: `auth.uid()::text = (storage.foldername(name))[1]`
- Click **"Review"** then **"Save policy"**

### Policy 4: Users can delete own images (DELETE)

- Click **"New Policy"**
- Choose **"For full customization"**
- Set the following:
  - **Policy name**: `Users can delete own images`
  - **Allowed operation**: `DELETE`
  - **Target roles**: `authenticated`
  - **USING expression**: `auth.uid()::text = (storage.foldername(name))[1]`
- Click **"Review"** then **"Save policy"**

## Step 3: Verify Setup

After creating all policies, you should see 4 policies listed in the Policies tab:

1. Public Access (SELECT)
2. Authenticated users can upload images (INSERT)
3. Users can update own images (UPDATE)
4. Users can delete own images (DELETE)

## Alternative: Simple Setup

If you're having trouble with the custom policies, you can use Supabase's policy templates:

1. When creating a new policy, look for templates like:

   - **"Enable read access for all users"** (for public read access)
   - **"Enable insert for authenticated users only"** (for authenticated uploads)
   - **"Enable update for users based on user_id"** (for user-specific updates)
   - **"Enable delete for users based on user_id"** (for user-specific deletes)

2. Select the appropriate template and modify as needed.

## Testing the Setup

Once configured, test the setup by:

1. Running your Next.js app (`npm run dev`)
2. Logging in as a user
3. Going to `/recipes/create`
4. Try uploading an image with a new recipe

If you encounter any issues, check the browser console and Supabase logs for error messages.
