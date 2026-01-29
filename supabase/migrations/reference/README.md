# Migraciones de Referencia

Este directorio contiene migraciones históricas que fueron utilizadas para crear el schema inicial de la base de datos de producción.

## IMPORTANTE

- **NO aplicar estas migraciones en producción**: Estas migraciones ya han sido aplicadas manualmente en la base de datos de producción.
- **Solo para referencia**: Estos archivos sirven como documentación histórica del schema inicial.
- **Backup disponible**: El estado actual completo de la base de datos está en `/backup/schema_actual_20260128.sql`

## Contenido

Las migraciones en este directorio incluyen:

1. Habilitación de extensiones (PostGIS, UUID, etc.)
2. Creación de todas las tablas principales
3. Definición de relaciones y foreign keys
4. Índices espaciales y de rendimiento
5. Configuración de Row Level Security (RLS)

## Para nuevas migraciones

Las nuevas migraciones deben crearse en el directorio padre (`/migrations/`) y NO en este directorio de referencia.

## Historial

- **2026-01-28**: Migraciones iniciales movidas a referencia después de aplicación manual en producción
