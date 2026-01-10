import { headers } from "next/headers";
import Link from "next/link";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";

export default async function Dashboard() {
  const headersList = headers();
  const tenantId = headersList.get("x-tenant-id");
  const tenantName = headersList.get("x-tenant-name");
  const tenantSubdomain = headersList.get("x-tenant-subdomain");

  // Si no hay tenant context, redirigir a login
  if (!tenantId || !tenantName || !tenantSubdomain) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Acceso Requerido
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Por favor inicia sesión para acceder al dashboard
          </p>
          <Link href="/auth/login">
            <Button size="lg" className="w-full">
              Iniciar Sesión
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // TODO: Replace with actual data from database
  const stats = {
    totalSales: "$24,580",
    todaySales: "$1,245",
    totalProducts: 156,
    lowStock: 8,
    pendingOrders: 3,
    monthlyGrowth: "+12.5%"
  };

  const recentActivity = [
    { id: 1, type: "sale", description: "Venta #1234 - $89.90", time: "Hace 2 min" },
    { id: 2, type: "inventory", description: "Stock bajo: Producto X", time: "Hace 15 min" },
    { id: 3, type: "customer", description: "Nuevo cliente registrado", time: "Hace 1 hora" },
    { id: 4, type: "sale", description: "Venta #1233 - $156.50", time: "Hace 2 horas" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"></div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{tenantName}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Dashboard</p>
            </div>
          </div>
          <nav className="flex items-center space-x-4">
            <Link href={`/${tenantSubdomain}/products`}>
              <Button variant="ghost">Productos</Button>
            </Link>
            <Link href={`/${tenantSubdomain}/sales`}>
              <Button variant="ghost">Ventas</Button>
            </Link>
            <Link href={`/${tenantSubdomain}/customers`}>
              <Button variant="ghost">Clientes</Button>
            </Link>
            <Link href={`/${tenantSubdomain}/pos`}>
              <Button>Punto de Venta</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Ventas Totales</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalSales}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Ventas Hoy</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.todaySales}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Productos</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalProducts}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Crecimiento Mensual</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.monthlyGrowth}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Actividad Reciente</h2>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'sale' ? 'bg-green-500' :
                    activity.type === 'inventory' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`} />
                  <span className="text-slate-700 dark:text-slate-300">{activity.description}</span>
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}