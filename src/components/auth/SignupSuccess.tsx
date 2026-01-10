'use client';

import { useUserCreation } from '@/hooks/useUserCreation';

interface SignupSuccessProps {
  userId: string;
  tenantId: string;
  onUserReady: (user: any) => void;
}

export function SignupSuccess({ userId, tenantId, onUserReady }: SignupSuccessProps) {
  const { isCreating, error, user } = useUserCreation(userId, tenantId);

  useEffect(() => {
    if (user) {
      onUserReady(user);
    }
  }, [user, onUserReady]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Error: {error}</p>
        <p className="text-sm text-red-600 mt-1">
          Por favor recarga la página o contacta soporte.
        </p>
      </div>
    );
  }

  if (isCreating) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <div>
            <p className="text-blue-800 font-medium">Configurando tu cuenta...</p>
            <p className="text-sm text-blue-600">
              Estamos completando la configuración de tu tienda. Esto tomará solo un momento.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-md p-4">
      <p className="text-green-800 font-medium">¡Tienda creada exitosamente!</p>
      <p className="text-sm text-green-600 mt-1">
        Tu cuenta está lista para usar.
      </p>
    </div>
  );
}