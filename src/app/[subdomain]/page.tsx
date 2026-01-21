"use client";

import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { Link } from 'next/link';

export default function HomePage() {
  // Esta página solo se muestra si el middleware permite el acceso
  // El middleware ya redirigió a dashboard o login según corresponda
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"></div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">Zylos ERP</span>
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          Sistema Multi-tenant
        </h1>
        
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          Accede al dashboard de tu tienda o inicia sesión para continuar
        </p>
        
        <div className="space-y-4">
          <Link href="/dashboard">
            <Button className="w-full">
              Ir al Dashboard
            </Button>
          </Link>
          
          <Link href="/login">
            <Button variant="outline" className="w-full">
              Iniciar Sesión
            </Button>
          </Link>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            <strong>Nota:</strong> Serás redirigido automáticamente según tu estado de autenticación
          </p>
        </div>
      </Card>
    </div>
  );
}