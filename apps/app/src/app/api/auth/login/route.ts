import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

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
        { 
          success: false, 
          error: 'Credenciales inválidas',
          code: 'INVALID_CREDENTIALS' 
        },
        { status: 401 }
      );
    }

    // Step 2: Get user's tenant info from our users table
    const { data: userInfo, error: userError } = await supabase
      .from('users')
      .select(`
        tenant_id,
        role,
        tenants!inner (
          id,
          name,
          subdomain,
          active
        )
      `)
      .eq('id', authData.user.id)
      .single();

    if (userError || !userInfo) {
      console.error('User info fetch error:', userError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error al obtener información del usuario',
          code: 'USER_INFO_ERROR' 
        },
        { status: 500 }
      );
    }

    // Check if tenant is active
    if (!userInfo.tenants?.active) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Tenant inactivo',
          code: 'TENANT_INACTIVE' 
        },
        { status: 403 }
      );
    }

    // Update user metadata with current tenant context
    await supabase.auth.updateUser({
      data: {
        current_tenant_id: userInfo.tenant_id,
        current_tenant_name: userInfo.tenants.name,
        current_tenant_subdomain: userInfo.tenants.subdomain,
        current_role: userInfo.role,
      }
    });

    console.log('=== LOGIN SUCCESS ===');
    console.log('User:', authData.user.email);
    console.log('Tenant:', userInfo.tenants);
    console.log('Role:', userInfo.role);
    console.log('===================');

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: authData.user.user_metadata?.name || authData.user.email,
          role: userInfo.role,
        },
        tenant: {
          id: userInfo.tenants.id,
          name: userInfo.tenants.name,
          subdomain: userInfo.tenants.subdomain,
        },
        auth: {
          token: authData.session.access_token,
          refreshToken: authData.session.refresh_token,
          expiresAt: authData.session.expires_at 
            ? new Date(authData.session.expires_at).toISOString() 
            : null,
          type: 'Bearer',
        },
        message: 'Inicio de sesión exitoso'
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Datos inválidos', 
          details: error.errors,
          code: 'INVALID_DATA' 
        },
        { status: 400 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al iniciar sesión',
        code: 'LOGIN_ERROR' 
      },
      { status: 500 }
    );
  }
}