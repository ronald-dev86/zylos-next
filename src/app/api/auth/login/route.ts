import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  subdomain: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, subdomain } = loginSchema.parse(body);

    // Create Supabase client with anon key for login
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Step 1: Authenticate user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: 'Credenciales incorrectas' },
        { status: 401 }
      );
    }

    // Step 2: Get user's tenant from metadata or custom table
    let tenantData = null;
    
    // First, try to get from auth user metadata
    if (authData.user.user_metadata?.tenant_id) {
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', authData.user.user_metadata.tenant_id)
        .single();
      
      if (!tenantError && tenant) {
        tenantData = tenant;
      }
    }

    // If not found in metadata, try custom users table
    if (!tenantData) {
      const { data: customUser, error: customUserError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('email', email)
        .single();
      
      if (!customUserError && customUser) {
        const { data: tenant, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', customUser.tenant_id)
          .single();
        
        if (!tenantError && tenant) {
          tenantData = tenant;
        }
      }
    }

    if (!tenantData) {
      return NextResponse.json(
        { success: false, error: 'Usuario no tiene tenant asociado' },
        { status: 403 }
      );
    }

    // Step 3: Get user role from metadata or custom table
    let userRole = authData.user.user_metadata?.role || 'user';
    let userName = authData.user.user_metadata?.name || authData.user.email.split('@')[0];

    console.log('=== SUPABASE AUTH LOGIN ===');
    console.log('Auth User:', authData.user);
    console.log('Tenant:', tenantData);
    console.log('Session:', authData.session);
    console.log('==========================');

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: userName,
          role: userRole,
          tenant_id: tenantData.id
        },
        tenant: tenantData,
        auth: {
          token: authData.session.access_token,
          refreshToken: authData.session.refresh_token,
          expiresAt: authData.session.expires_at ? new Date(authData.session.expires_at).toISOString() : null,
          type: 'Bearer'
        }
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 401 }
    );
  }
}