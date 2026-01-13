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

    // Step 1: Create tenant using service role (bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    // Create service role client for tenant creation (bypasses RLS)
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { data: newTenant, error: tenantError } = await serviceClient
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
        { success: false, error: 'Error al crear tienda: ' + (tenantError?.message || 'Unknown error') },
        { status: 500 }
      );
    }

    // Step 2: Create user with Supabase Auth (with tenant metadata)
    const { data: authData, error: authError } = await serviceClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          tenant_id: newTenant.id,
          role: 'admin'
        }
      }
    });

    if (authError || !authData.user) {
      console.error('Auth user creation error:', authError);
      // Rollback tenant creation
      await serviceClient.from('tenants').delete().eq('id', newTenant.id);
      
      return NextResponse.json(
        { success: false, error: 'Error al crear usuario: ' + (authError?.message || 'Unknown error') },
        { status: 500 }
      );
    }

    // Step 3: Sign in user immediately (user record will be created by trigger)
    const { data: sessionData, error: sessionError } = await serviceClient.auth.signInWithPassword({
      email,
      password
    });

    if (sessionError || !sessionData.session) {
      console.error('Session creation error:', sessionError);
      // Cleanup auth user and tenant
      await serviceClient.auth.admin.deleteUser(authData.user.id);
      await serviceClient.from('tenants').delete().eq('id', newTenant.id);
      
      return NextResponse.json(
        { success: false, error: 'Error al crear sesión: ' + (sessionError?.message || 'Unknown error') },
        { status: 500 }
      );
    }

    console.log('=== SUPABASE AUTH TENANT CREATION ===');
    console.log('Tenant:', newTenant);
    console.log('Auth User:', authData.user);
    console.log('Session:', sessionData.session);
    console.log('User record will be created by trigger');
    console.log('=====================================');

    // Redirect to new tenant
    const redirectUrl = `https://${newTenant.subdomain}.zylos.com/dashboard?token=${sessionData.session.access_token}`;
    
    return NextResponse.json({
      success: true,
      data: {
        tenant: newTenant,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: ownerName,
          role: 'admin',
          tenant_id: newTenant.id,
        },
        redirectUrl,
        message: 'Tienda creada exitosamente'
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.issues },
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