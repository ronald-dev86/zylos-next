import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useUserCreation(userId: string, tenantId: string) {
  const [isCreating, setIsCreating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 10;
    
    const checkUserCreation = async () => {
      try {
        // First check if user exists in database
        const { data: dbUser, error: dbError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (dbUser && !dbError) {
          setUser(dbUser);
          setIsCreating(false);
          return;
        }

        // Trigger background check
        const response = await fetch('/api/auth/user-complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            tenantId,
            retryCount
          })
        });

        const result = await response.json();

        if (result.success) {
          setUser(result.user);
          setIsCreating(false);
        } else if (result.pending && retryCount < maxRetries) {
          retryCount++;
          setTimeout(checkUserCreation, 2000); // Check again in 2 seconds
        } else {
          setError(result.error || 'User creation failed');
          setIsCreating(false);
        }

      } catch (err) {
        console.error('User creation check failed:', err);
        setError('Failed to complete user creation');
        setIsCreating(false);
      }
    };

    if (userId && tenantId) {
      // Start checking after a short delay to allow trigger
      setTimeout(checkUserCreation, 500);
    }
  }, [userId, tenantId, supabase]);

  return { isCreating, error, user };
}