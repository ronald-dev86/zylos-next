-- Script para ejecutar migraciones directamente
-- Este archivo temporal nos ayudará a correr las migraciones

\echo 'Iniciando migraciones para Zylos ERP...'

-- Ejecutar primera migración
\echo 'Ejecutando 001_initial_schema.sql...'
\i supabase/migrations/001_initial_schema.sql

-- Ejecutar segunda migración  
\echo 'Ejecutando 002_business_functions.sql...'
\i supabase/migrations/002_business_functions.sql

\echo 'Migraciones completadas exitosamente!'