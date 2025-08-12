# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Choose your organization and enter project details
5. Wait for the project to be created

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to Settings > API
2. Copy your Project URL and anon/public key
3. Create a `.env.local` file in your project root with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 3. Create the Users Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Create users table
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'participant')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || NEW.id::text), COALESCE(NEW.raw_user_meta_data->>'role', 'participant'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically insert user data
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 4. Configure Authentication

1. In your Supabase dashboard, go to Authentication > Settings
2. Configure your site URL (e.g., `http://localhost:3000` for development)
3. Set up email templates if desired

## 5. Test the Setup

1. Start your development server: `npm run dev`
2. Navigate to `/signup` to test user registration
3. Navigate to `/login` to test user authentication
4. Check your Supabase dashboard to see created users

## Features Implemented

- ✅ User registration with email/password/username/role
- ✅ User login with email/password
- ✅ Custom users table for username and role storage
- ✅ Username and role selection during signup
- ✅ Automatic redirect to `/main` after auth
- ✅ Error handling and loading states
- ✅ Row Level Security (RLS) policies

## Security Notes

- Row Level Security is enabled on the users table
- Users can only access their own data
- The trigger function automatically creates user records
- Passwords are handled securely by Supabase Auth
