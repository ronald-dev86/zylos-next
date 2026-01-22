import { z } from 'zod';

/**
 * Schema de validación para login de usuario
 * Implementa validaciones de negocio y formato
 */
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'El email es requerido' })
    .min(1, 'El email es requerido')
    .email('Formato de email inválido')
    .max(254, 'El email es muy largo (máximo 254 caracteres)'),
  
  password: z
    .string({ required_error: 'La contraseña es requerida' })
    .min(1, 'La contraseña es requerida')
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'La contraseña es muy larga (máximo 128 caracteres)'),
  
  subdomain: z
    .string()
    .min(2, 'El subdominio debe tener al menos 2 caracteres')
    .max(63, 'El subdominio es muy largo (máximo 63 caracteres)')
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 
      'El subdominio solo puede contener letras minúsculas, números y guiones')
    .optional()
});

/**
 * Schema para refrescar token
 */
export const refreshTokenSchema = z.object({
  refreshToken: z
    .string({ required_error: 'El refresh token es requerido' })
    .min(1, 'El refresh token es requerido')
});

/**
 * Schema para registro de usuario
 */
export const registerSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .max(254, 'Email muy largo'),
  
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'La contraseña es muy larga')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'La contraseña debe contener al menos una letra mayúscula, una minúscula, un número y un carácter especial'),
  
  confirmPassword: z
    .string(),
  
  firstName: z
    .string({ required_error: 'El nombre es requerido' })
    .min(1, 'El nombre es requerido')
    .max(50, 'El nombre es muy largo (máximo 50 caracteres)'),
  
  lastName: z
    .string({ required_error: 'El apellido es requerido' })
    .min(1, 'El apellido es requerido')
    .max(50, 'El apellido es muy largo (máximo 50 caracteres)'),
  
  subdomain: z
    .string()
    .min(2, 'El subdominio es requerido')
    .max(63, 'El subdominio es muy largo')
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 
      'Formato de subdominio inválido'),
  
  companyName: z
    .string({ required_error: 'El nombre de la empresa es requerido' })
    .min(1, 'El nombre de la empresa es requerido')
    .max(100, 'El nombre de la empresa es muy largo (máximo 100 caracteres)'),
  
  phone: z
    .string()
    .regex(/^[+]?[1-9]\d{1,14}$/, 'Formato de teléfono inválido')
    .optional()
});

/**
 * Schema para crear usuario
 */
export const createUserSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .max(254),
  
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128),
  
  role: z
    .enum(['admin', 'vendedor', 'contador'], {
      errorMap: (issue, ctx) => ({
        message: 'Rol inválido. Debe ser admin, vendedor o contador',
      }),
    }),
  
  firstName: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(50),
  
  lastName: z
    .string()
    .min(1, 'El apellido es requerido')
    .max(50),
  
  phone: z
    .string()
    .regex(/^[+]?[1-9]\d{1,14}$/, 'Formato de teléfono inválido')
    .optional(),
});

/**
 * Schema para actualizar usuario
 */
export const updateUserSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .max(254)
    .optional(),
  
  firstName: z
    .string()
    .min(1)
    .max(50)
    .optional(),
  
  lastName: z
    .string()
    .min(1)
    .max(50)
    .optional(),
  
  role: z
    .enum(['admin', 'vendedor', 'contador'])
    .optional(),
  
  phone: z
    .string()
    .regex(/^[+]?[1-9]\d{1,14}$/, 'Formato de teléfono inválido')
    .optional(),
  
  isActive: z
    .boolean()
    .optional(),
});

/**
 * Schema para paginación
 */
export const paginationSchema = z.object({
  page: z
    .coerce.number()
    .int()
    .min(1, 'La página debe ser al menos 1')
    .default(1),
  
  limit: z
    .coerce.number()
    .int()
    .min(1, 'El límite debe ser al menos 1')
    .max(100, 'El límite máximo es 100')
    .default(20),
  
  search: z
    .string()
    .min(1, 'El término de búsqueda debe tener al menos 1 caracter')
    .max(100, 'El término de búsqueda es muy largo')
    .optional(),
});

/**
 * Schema para parámetros de búsqueda
 */
export const searchSchema = z.object({
  query: z
    .string()
    .min(1, 'El término de búsqueda es requerido')
    .max(100, 'El término de búsqueda es muy largo'),
  
  field: z
    .enum(['email', 'name', 'phone', 'role'])
    .default('name'),
  
  exact: z
    .boolean()
    .default(false),
});

// Valida que confirmPassword coincida con password
registerSchema.refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type SearchInput = z.infer<typeof searchSchema>;