import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const signupSchema = z.object({
  storeName: z.string().min(2),
  subdomain: z.string().min(3).regex(/^[a-z0-9]+$/, 'Solo letras y números'),
  ownerName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeName, subdomain, ownerName, email, password } = signupSchema.parse(body);

    // Create Supabase client with anon key for standard operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Step 1: Create tenant first
    const { data: newTenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: storeName,
        subdomain: subdomain.toLowerCase(),
        active: true
      })
      .select()
      .single();

    if (tenantError || !newTenant) {
      console.error('Tenant creation error:', tenantError);
      return NextResponse.json(
        { success: false, error: 'Error al crear tienda: ' + tenantError.message },
        { status: 500 }
      );
    }

    // Step 2: Create user with Supabase Auth (standard)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          tenant_id: newTenant.id,
          name: ownerName,
          role: 'admin'
        }
      }
    });

    if (authError || !authData.user) {
      console.error('Auth user creation error:', authError);
      // Rollback tenant creation
      await supabase.from('tenants').delete().eq('id', newTenant.id);
      
      return NextResponse.json(
        { success: false, error: 'Error al crear usuario: ' + authError.message },
        { status: 500 }
      );
    }

    // Step 3: Create custom user record (link auth to tenant)
    const { data: customUser, error: userError } = await supabase
      .from('users')
      .insert({
        email,
        tenant_id: newTenant.id,
        role: 'admin'
      })
      .select()
      .single();

    if (userError || !customUser) {
      console.error('Custom user creation error:', userError);
      // Cleanup auth user and tenant
      await supabase.auth.admin.deleteUser(authData.user.id);
      await supabase.from('tenants').delete().eq('id', newTenant.id);
      
      return NextResponse.json(
        { success: false, error: 'Error al vincular usuario: ' + userError.message },
        { status: 500 }
      );
    }

    // Step 4: Sign in user to get session
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (sessionError || !sessionData.session) {
      console.error('Session creation error:', sessionError);
      return NextResponse.json(
        { success: false, error: 'Error al crear sesión: ' + sessionError.message },
        { status: 500 }
      );
    }

    console.log('=== SUPABASE AUTH TENANT CREATION ===');
    console.log('Tenant:', newTenant);
    console.log('Auth User:', authData.user);
    console.log('Custom User:', customUser);
    console.log('Session:', sessionData.session);
    console.log('=====================================');

    return NextResponse.json({
      success: true,
      data: {
        tenant: newTenant,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: authData.user.user_metadata?.name || ownerName,
          role: 'admin',
          tenant_id: newTenant.id
        },
        auth: {
          token: sessionData.session.access_token,
          refreshToken: sessionData.session.refresh_token,
          expiresAt: sessionData.session.expires_at ? new Date(sessionData.session.expires_at).toISOString() : null,
          type: 'Bearer'
        },
        message: 'Tienda creada y usuario autenticado exitosamente'
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear la tienda' },
      { status: 500 }
    );
  }
}