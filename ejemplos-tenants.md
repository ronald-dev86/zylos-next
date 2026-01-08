// Ejemplos de tenants que puedes crear
const ejemploTenants = [
  {
    storeName: "Tecnología XYZ",
    subdomain: "tecnologixyz",
    ownerName: "Carlos Rodríguez",
    email: "carlos@tecnologixyz.com",
    password: "password123"
  },
  {
    storeName: "Moda Chic",
    subdomain: "modachic", 
    ownerName: "Ana Martínez",
    email: "ana@modachic.com",
    password: "password123"
  },
  {
    storeName: "Food Express",
    subdomain: "foodexpress",
    ownerName: "Roberto Díaz",
    email: "roberto@foodexpress.com", 
    password: "password123"
  },
  {
    storeName: "AutoParts Pro",
    subdomain: "autopartspro",
    ownerName: "Luis Hernández",
    email: "luis@autopartspro.com",
    password: "password123"
  },
  {
    storeName: "Belleza Total",
    subdomain: "bellezatotal",
    ownerName: "María González",
    email: "maria@bellezatotal.com",
    password: "password123"
  }
];

// Cada uno será accesible en:
// - tecnologixyz.zylos.com/dashboard
// - modachic.zylos.com/dashboard
// - foodexpress.zylos.com/dashboard
// etc.

// Con su propia base de datos aislada por RLS