import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { userId, tenantId, retryCount = 0 } = await request.json();

    if (!userId || !tenantId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Check if user record exists
    const { data: user, error } = await serviceClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Database error checking user:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (user) {
      // User exists, success!
      console.log('User record found:', user);
      return NextResponse.json({
        success: true,
        user,
        message: 'User record successfully created'
      });
    }

    // User doesn't exist yet, check if we should retry
    if (retryCount >= 5) {
      // After 5 retries, create manually
      console.log('Max retries reached, creating user manually');
      
      // Get auth user info
      const { data: authUser } = await serviceClient.auth.admin.getUser(userId);
      
      if (authUser.user) {
        const { data: manualUser, error: manualError } = await serviceClient
          .from('users')
          .insert({
            id: userId,
            email: authUser.user.email,
            tenant_id: tenantId,
            role: 'admin'
          })
          .select()
          .single();

        if (manualError) {
          return NextResponse.json(
            { error: 'Failed to create user manually: ' + manualError.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          user: manualUser,
          message: 'User record created manually after trigger timeout'
        });
      }
    }

    // Schedule retry with exponential backoff
    const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s, 8s, 16s
    
    setTimeout(async () => {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/user-complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            tenantId,
            retryCount: retryCount + 1
          })
        });
      } catch (retryError) {
        console.error('Retry failed:', retryError);
      }
    }, delay);

    return NextResponse.json({
      pending: true,
      retryCount: retryCount + 1,
      message: `User creation in progress... (${retryCount + 1}/5)`
    });

  } catch (error) {
    console.error('Background worker error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}