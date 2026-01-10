-- Fix: Update user metadata extraction in trigger
-- This migration fixes the trigger to properly extract metadata from JSON

-- Update the trigger function to properly extract JSON metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_tenant_id UUID;
BEGIN
    -- Extract tenant_id from user metadata (set during registration)
    user_tenant_id := NEW.raw_user_meta_data::jsonb ->> 'tenant_id';
    
    -- Insert into users table
    INSERT INTO public.users (id, email, tenant_id, role)
    VALUES (
        NEW.id,
        NEW.email,
        user_tenant_id,
        COALESCE((NEW.raw_user_meta_data::jsonb ->> 'role')::tenant_role, 'admin')
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;