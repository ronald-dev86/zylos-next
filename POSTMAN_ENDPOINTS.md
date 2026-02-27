# 📋 GUÍA COMPLETA DE ENDPOINTS - ZYLOS ERP
## Para probar desde Postman

---

## 🔐 AUTHENTICATION

### 1. POST /api/auth/login
**Descripción:** Iniciar sesión de usuario

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "admin@tuempresa.com",
  "password": "tu_password"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "user": { ... },
    "tenant": { ... },
    "redirectUrl": "/dashboard"
  },
  "timestamp": "2026-02-27T12:00:00.000Z"
}
```

---

### 2. GET /api/auth/me
**Descripción:** Obtener usuario autenticado

**Headers:**
```
Content-Type: application/json
Cookie: zylos_auth=...
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "user": { ... },
    "tenant": { ... },
    "isAuthenticated": true
  }
}
```

---

### 3. POST /api/auth/logout
**Descripción:** Cerrar sesión

**Headers:**
```
Content-Type: application/json
Cookie: zylos_auth=...
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Sesión cerrada exitosamente"
  }
}
```

---

### 4. POST /api/auth/signup
**Descripción:** Crear nueva tienda (tenant) y usuario admin

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "subdomain": "mitienda",
  "storeName": "Mi Tienda SAC",
  "email": "admin@mitienda.com",
  "password": "password123",
  "fullName": "Juan Pérez"
}
```

---

### 5. POST /api/auth/user-complete
**Descripción:** Completar datos de usuario

**Headers:**
```
Content-Type: application/json
Cookie: zylos_auth=...
```

**Body:**
```json
{
  "fullName": "Juan Pérez",
  "phone": "+51123456789"
}
```

---

### 6. GET /api/auth
**Descripción:** Documentación de endpoints auth

**Headers:** Ninguno

---

### 7. GET /api/auth/context
**Descripción:** Obtener contexto del tenant

**Headers:**
```
Cookie: zylos_auth=...
```

---

### 8. GET /api/auth/health
**Descripción:** Verificar estado del sistema

**Headers:** Ninguno

---

### 9. POST /api/auth/error
**Descripción:** Reportar errores

**Headers:**
```
Content-Type: application/json
Cookie: zylos_auth=...
```

**Body:**
```json
{
  "error": "Descripción del error",
  "context": "Contexto donde ocurrió"
}
```

---

## 👥 USERS

### 10. GET /api/users
**Descripción:** Listar usuarios con paginación

**Headers:**
```
Content-Type: application/json
Cookie: zylos_auth=...
```

**Query Parameters:**
```
?page=1&limit=20
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "data": [ ... ],
    "pagination": { "page": 1, "limit": 20, "total": 10, "totalPages": 1 }
  }
}
```

---

### 11. POST /api/users
**Descripción:** Crear usuario

**Headers:**
```
Content-Type: application/json
Cookie: zylos_auth=...
```

**Body:**
```json
{
  "email": "usuario@empresa.com",
  "fullName": "Usuario Nuevo",
  "password": "password123",
  "role": "employee"
}
```

---

### 12. GET /api/users/[id]
**Descripción:** Obtener usuario específico

**Headers:**
```
Cookie: zylos_auth=...
```

---

### 13. PUT /api/users/[id]
**Descripción:** Actualizar usuario

**Headers:**
```
Content-Type: application/json
Cookie: zylos_auth=...
```

**Body:**
```json
{
  "fullName": "Nombre Actualizado",
  "phone": "+51123456789"
}
```

---

### 14. DELETE /api/users/[id]
**Descripción:** Eliminar usuario

**Headers:**
```
Cookie: zylos_auth=...
```

---

### 15. PUT /api/users/[id]/role
**Descripción:** Actualizar rol de usuario

**Headers:**
```
Content-Type: application/json
Cookie: zylos_auth=...
```

**Body:**
```json
{
  "role": "admin"
}
```

---

### 16. GET /api/users/by-email/[email]
**Descripción:** Buscar usuario por email

**Headers:**
```
Cookie: zylos_auth=...
```

---

### 17. POST /api/users/create
**Descripción:** Crear usuario alternativo

**Headers:**
```
Content-Type: application/json
Cookie: zylos_auth=...
```

**Body:**
```json
{
  "email": "nuevo@empresa.com",
  "fullName": "Nuevo Usuario",
  "password": "password123",
  "role": "employee"
}
```

---

## 📊 DASHBOARD

### 18. GET /api/dashboard/stats
**Descripción:** Estadísticas generales

**Headers:**
```
Cookie: zylos_auth=...
```

---

### 19. GET /api/dashboard/users
**Descripción:** Datos demográficos de usuarios

**Headers:**
```
Cookie: zylos_auth=...
```

---

## 📦 PRODUCTS

### 20. GET /api/products
**Descripción:** Listar productos

**Headers:**
```
Cookie: zylos_auth=...
```

**Query Parameters:**
```
?page=1&limit=20
```

---

### 21. POST /api/products
**Descripción:** Crear producto

**Headers:**
```
Content-Type: application/json
Cookie: zylos_auth=...
```

**Body:**
```json
{
  "name": "Producto Nuevo",
  "sku": "PROD-001",
  "description": "Descripción del producto",
  "price": 99.99,
  "cost": 50.00,
  "category": "Electrónica",
  "stock": 100,
  "minStock": 10
}
```

---

### 22. GET /api/products/[id]
**Descripción:** Obtener producto

**Headers:**
```
Cookie: zylos_auth=...
```

---

### 23. PUT /api/products/[id]
**Descripción:** Actualizar producto

**Headers:**
```
Content-Type: application/json
Cookie: zylos_auth=...
```

**Body:**
```json
{
  "name": "Producto Actualizado",
  "price": 129.99,
  "stock": 150
}
```

---

### 24. DELETE /api/products/[id]
**Descripción:** Eliminar producto

**Headers:**
```
Cookie: zylos_auth=...
```

---

### 25. GET /api/products/by-sku/[sku]
**Descripción:** Buscar por SKU

**Headers:**
```
Cookie: zylos_auth=...
```

---

### 26. GET /api/products/search
**Descripción:** Búsqueda por nombre

**Headers:**
```
Cookie: zylos_auth=...
```

**Query Parameters:**
```
?q=producto&page=1&limit=20
```

---

### 27. GET /api/products/category/[category]
**Descripción:** Filtrar por categoría

**Headers:**
```
Cookie: zylos_auth=...
```

**Query Parameters:**
```
?page=1&limit=20
```

---

### 28. GET /api/products/low-stock
**Descripción:** Productos con stock bajo

**Headers:**
```
Cookie: zylos_auth=...
```

---

### 29. PUT /api/products/[id]/stock
**Descripción:** Actualizar stock

**Headers:**
```
Content-Type: application/json
Cookie: zylos_auth=...
```

**Body:**
```json
{
  "stock": 200,
  "reason": "Reposición de inventario"
}
```

---

## 🤝 CUSTOMERS

### 30. GET /api/customers
**Descripción:** Listar clientes

**Headers:**
```
Cookie: zylos_auth=...
```

**Query Parameters:**
```
?page=1&limit=20
```

---

### 31. POST /api/customers
**Descripción:** Crear cliente

**Headers:**
```
Content-Type: application/json
Cookie: zylos_auth=...
```

**Body:**
```json
{
  "name": "Cliente Ejemplo SAC",
  "email": "cliente@ejemplo.com",
  "phone": "+51123456789",
  "address": "Av. Principal 123, Lima"
}
```

---

### 32. GET /api/customers/[id]
**Descripción:** Obtener cliente

**Headers:**
```
Cookie: zylos_auth=...
```

---

### 33. PUT /api/customers/[id]
**Descripción:** Actualizar cliente

**Headers:**
```
Content-Type: application/json
Cookie: zylos_auth=...
```

**Body:**
```json
{
  "name": "Cliente Actualizado",
  "phone": "+51987654321"
}
```

---

### 34. DELETE /api/customers/[id]
**Descripción:** Eliminar cliente

**Headers:**
```
Cookie: zylos_auth=...
```

---

### 35. GET /api/customers/by-email/[email]
**Descripción:** Buscar cliente por email

**Headers:**
```
Cookie: zylos_auth=...
```

---

### 36. GET /api/customers/search
**Descripción:** Búsqueda por nombre

**Headers:**
```
Cookie: zylos_auth=...
```

**Query Parameters:**
```
?q=cliente&page=1&limit=20
```

---

## 🏭 SUPPLIERS

### 37. GET /api/suppliers
**Descripción:** Listar proveedores

**Headers:**
```
Cookie: zylos_auth=...
```

**Query Parameters:**
```
?page=1&limit=20
```

---

### 38. POST /api/suppliers
**Descripción:** Crear proveedor

**Headers:**
```
Content-Type: application/json
Cookie: zylos_auth=...
```

**Body:**
```json
{
  "name": "Proveedor Ejemplo SAC",
  "email": "proveedor@ejemplo.com",
  "phone": "+51123456789",
  "address": "Av. Proveedor 456, Lima"
}
```

---

### 39. GET /api/suppliers/[id]
**Descripción:** Obtener proveedor

**Headers:**
```
Cookie: zylos_auth=...
```

---

### 40. PUT /api/suppliers/[id]
**Descripción:** Actualizar proveedor

**Headers:**
```
Content-Type: application/json
Cookie: zylos_auth=...
```

**Body:**
```json
{
  "name": "Proveedor Actualizado",
  "phone": "+51987654321"
}
```

---

### 41. DELETE /api/suppliers/[id]
**Descripción:** Eliminar proveedor

**Headers:**
```
Cookie: zylos_auth=...
```

---

### 42. GET /api/suppliers/by-email/[email]
**Descripción:** Buscar proveedor por email

**Headers:**
```
Cookie: zylos_auth=...
```

---

### 43. GET /api/suppliers/search
**Descripción:** Búsqueda por nombre

**Headers:**
```
Cookie: zylos_auth=...
```

**Query Parameters:**
```
?q=proveedor&page=1&limit=20
```

---

## 💰 SALES

### 44. POST /api/sales
**Descripción:** Crear venta

**Headers:**
```
Content-Type: application/json
Cookie: zylos_auth=...
```

**Body:**
```json
{
  "customerId": "uuid-del-cliente",
  "tax": 18.00,
  "items": [
    {
      "productId": "uuid-del-producto-1",
      "quantity": 2,
      "unitPrice": 99.99
    },
    {
      "productId": "uuid-del-producto-2",
      "quantity": 1,
      "unitPrice": 149.99
    }
  ]
}
```

---

### 45. GET /api/sales/list
**Descripción:** Listar ventas

**Headers:**
```
Cookie: zylos_auth=...
```

**Query Parameters:**
```
?page=1&limit=20
```

---

### 46. GET /api/sales/[id]
**Descripción:** Obtener venta completa

**Headers:**
```
Cookie: zylos_auth=...
```

---

### 47. PUT /api/sales/[id]/status
**Descripción:** Actualizar status de venta

**Headers:**
```
Content-Type: application/json
Cookie: zylos_auth=...
```

**Body:**
```json
{
  "status": "completed"
}
```
*Valores válidos:* `pending`, `completed`, `cancelled`

---

### 48. PUT /api/sales/[id]/payment
**Descripción:** Actualizar estado de pago

**Headers:**
```
Content-Type: application/json
Cookie: zylos_auth=...
```

**Body:**
```json
{
  "paymentStatus": "paid"
}
```
*Valores válidos:* `pending`, `paid`, `refunded`

---

### 49. GET /api/sales/customer/[customerId]
**Descripción:** Ventas por cliente

**Headers:**
```
Cookie: zylos_auth=...
```

**Query Parameters:**
```
?page=1&limit=20
```

---

### 50. GET /api/sales/date-range
**Descripción:** Ventas por rango de fechas

**Headers:**
```
Cookie: zylos_auth=...
```

**Query Parameters:**
```
?startDate=2026-01-01T00:00:00.000Z&endDate=2026-01-31T23:59:59.999Z&page=1&limit=20
```

---

### 51. GET /api/sales/summary
**Descripción:** Resumen de ventas

**Headers:**
```
Cookie: zylos_auth=...
```

**Query Parameters:**
```
?startDate=2026-01-01T00:00:00.000Z&endDate=2026-01-31T23:59:59.999Z
```
*Si no se especifican fechas, usa el último mes*

---

## 📦 INVENTORY

### 52. POST /api/inventory/movements
**Descripción:** Crear movimiento de inventario

**Headers:**
```
Content-Type: application/json
Cookie: zylos_auth=...
```

**Body:**
```json
{
  "productId": "uuid-del-producto",
  "type": "in",
  "quantity": 50,
  "reason": "Reposición de inventario",
  "referenceType": "purchase",
  "notes": "Entrada por compra"
}
```
*type valores:* `in`, `out`
*referenceType valores:* `sale`, `purchase`, `adjustment`

---

### 53. GET /api/inventory/movements/list
**Descripción:** Listar movimientos

**Headers:**
```
Cookie: zylos_auth=...
```

**Query Parameters:**
```
?page=1&limit=20
```

---

### 54. GET /api/inventory/movements/[id]
**Descripción:** Obtener movimiento

**Headers:**
```
Cookie: zylos_auth=...
```

---

### 55. GET /api/inventory/movements/product/[productId]
**Descripción:** Movimientos por producto

**Headers:**
```
Cookie: zylos_auth=...
```

**Query Parameters:**
```
?page=1&limit=20
```

---

### 56. GET /api/inventory/movements/date-range
**Descripción:** Movimientos por rango de fechas

**Headers:**
```
Cookie: zylos_auth=...
```

**Query Parameters:**
```
?startDate=2026-01-01T00:00:00.000Z&endDate=2026-01-31T23:59:59.999Z&page=1&limit=20
```

---

### 57. GET /api/inventory/movements/type/[type]
**Descripción:** Movimientos por tipo

**Headers:**
```
Cookie: zylos_auth=...
```

**Query Parameters:**
```
?page=1&limit=20
```
*type valores en URL:* `sale`, `purchase`, `adjustment`

---

## 💳 LEDGER

### 58. POST /api/ledger/entries
**Descripción:** Crear asiento contable

**Headers:**
```
Content-Type: application/json
Cookie: zylos_auth=...
```

**Body:**
```json
{
  "entityType": "customer",
  "entityId": "uuid-del-cliente",
  "type": "credit",
  "amount": 100.00,
  "description": "Pago de factura #001",
  "referenceId": "uuid-de-venta"
}
```
*type valores:* `debit`, `credit`

---

### 59. GET /api/ledger/entries/list
**Descripción:** Listar asientos

**Headers:**
```
Cookie: zylos_auth=...
```

**Query Parameters:**
```
?page=1&limit=20
```

---

### 60. GET /api/ledger/entries/[id]
**Descripción:** Obtener asiento

**Headers:**
```
Cookie: zylos_auth=...
```

---

### 61. GET /api/ledger/entries/entity/[entityType]
**Descripción:** Asientos por tipo de entidad

**Headers:**
```
Cookie: zylos_auth=...
```

**Query Parameters:**
```
?page=1&limit=20
```
*entityType ejemplos:* `customer`, `supplier`, `sale`

---

### 62. GET /api/ledger/entries/entity/[entityType]/[entityId]
**Descripción:** Asientos por entidad específica

**Headers:**
```
Cookie: zylos_auth=...
```

**Query Parameters:**
```
?page=1&limit=20
```

---

### 63. GET /api/ledger/entries/date-range
**Descripción:** Asientos por rango de fechas

**Headers:**
```
Cookie: zylos_auth=...
```

**Query Parameters:**
```
?startDate=2026-01-01T00:00:00.000Z&endDate=2026-01-31T23:59:59.999Z&page=1&limit=20
```

---

### 64. GET /api/ledger/balance/[entityType]
**Descripción:** Balance por tipo de entidad

**Headers:**
```
Cookie: zylos_auth=...
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "entityType": "customer",
    "balance": 1500.00,
    "currency": "USD"
  }
}
```

---

## 🔑 NOTAS IMPORTANTES PARA POSTMAN

### Autenticación
1. **Login:** Haz login en `POST /api/auth/login`
2. **Cookie:** La respuesta setea una cookie `zylos_auth`
3. **Persistencia:** En Postman, habilita "Allow cookies" o copia el valor de la cookie en el header

### Headers Obligatorios
- `Content-Type: application/json` para POST/PUT
- `Cookie: zylos_auth=...` para endpoints protegidos

### Manejo de Errores
**401 No autorizado:**
```json
{
  "success": false,
  "error": "No autenticado"
}
```

**403 Prohibido:**
```json
{
  "success": false,
  "error": "Permisos insuficientes"
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Datos inválidos",
  "details": [ ... ]
}
```

---

*Documento generado automáticamente - Zylos ERP API*
