# Migration Strategy - Kaelo Database

**Created:** 2026-01-28
**Status:** Action Required

## 🎯 PROBLEMA

- ✅ Tablas YA EXISTEN en Supabase production
- ✅ Migraciones generadas (20260128000001-20260128000016) están diseñadas para crear desde cero
- ❌ Aplicar migraciones causaría errores "table already exists"

## 📋 ESTRATEGIA RECOMENDADA: Baseline + Branch Approach

### Opción 1: Baseline Migration (Producción)

**Para el ambiente actual (production):**

1. **Capturar estado actual como baseline**
   ```bash
   # Conectar a Supabase CLI
   supabase link --project-ref <your-project-ref>

   # Generar dump del schema actual
   supabase db dump --schema public --data-only=false > migrations/20260128000000_baseline.sql
   ```

2. **Marcar como aplicada (sin ejecutar)**
   ```bash
   # Esta migración representa el estado actual
   # NO necesita aplicarse porque las tablas ya existen
   ```

3. **Mover migraciones generadas a carpeta de referencia**
   ```bash
   mkdir -p migrations/reference
   mv migrations/20260128*.sql migrations/reference/
   # Mantenerlas como documentación del schema ideal
   ```

---

### Opción 2: Development Branch (RECOMENDADO para desarrollo)

**Crear ambiente limpio para desarrollo:**

```bash
# 1. Crear branch de desarrollo
supabase branches create develop

# 2. El branch inicia vacío - aplicar migraciones limpias
supabase db push --db-url <develop-branch-url>

# 3. Usar branch para desarrollo, producción se mantiene
```

**Ventajas:**
- ✅ Control de versiones completo desde cero
- ✅ Producción no se toca
- ✅ Puedes probar cambios en branch antes de merge
- ✅ Futuras migraciones se aplican limpiamente

**Desventajas:**
- ⚠️ Requiere Supabase Pro plan ($25/mes) para branches
- ⚠️ Datos de prod no están en dev (necesitas seed)

---

### Opción 3: Adoption Migration (Si no quieres usar branches)

**Modificar migraciones para ser idempotentes:**

```sql
-- En cada migración, cambiar:
CREATE TABLE profiles (...)

-- Por:
CREATE TABLE IF NOT EXISTS profiles (...)

-- Y agregar verificación:
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                   WHERE table_name = 'profiles') THEN
        -- Crear tabla
    END IF;
END $$;
```

**Ventajas:**
- ✅ Seguro aplicar en producción
- ✅ No requiere branches adicionales

**Desventajas:**
- ❌ No captura el estado EXACTO actual
- ❌ Diferencias sutiles pueden pasar desapercibidas

---

## 🚀 PLAN DE ACCIÓN RECOMENDADO

### Fase 1: Documentación del Estado Actual ⭐ HACER AHORA

```bash
cd /Users/jona/Desktop/dev/kaelo-app/supabase

# 1. Capturar schema completo actual
supabase db dump --schema public > backup/schema_actual_20260128.sql

# 2. Capturar datos también (opcional, para backup)
supabase db dump --schema public --data-only > backup/data_20260128.sql

# 3. Mover migraciones generadas a carpeta de referencia
mkdir -p migrations/reference
mv migrations/202601280000*.sql migrations/reference/

# 4. Crear nota
echo "Migraciones de referencia - NO aplicar en producción" > migrations/reference/README.md
```

### Fase 2: Establecer Control de Versiones

**Opción A - Si tienes Supabase Pro:**
```bash
# Crear branch de desarrollo
supabase branches create develop

# Aplicar migraciones de referencia al branch
supabase db push --db-url postgresql://postgres:[PASSWORD]@[BRANCH-HOST]:5432/postgres
```

**Opción B - Si usas Free tier:**
```bash
# Marcar estado actual como migración baseline
cp backup/schema_actual_20260128.sql migrations/20260128000000_baseline.sql

# Agregar comentario al archivo
echo "-- BASELINE MIGRATION - Representa estado actual de producción" > temp.sql
echo "-- NO aplicar de nuevo - solo para documentación" >> temp.sql
cat migrations/20260128000000_baseline.sql >> temp.sql
mv temp.sql migrations/20260128000000_baseline.sql

# Futuras migraciones empiezan desde 20260129000001
```

### Fase 3: Futuras Migraciones

De ahora en adelante, para hacer cambios:

```bash
# 1. Crear nueva migración
supabase migration new add_new_feature

# 2. Editar archivo generado
# migrations/20260129000001_add_new_feature.sql

# 3. Probar en local (si tienes Docker)
supabase db reset

# 4. Aplicar en producción
supabase db push
```

---

## 📊 COMPARACIÓN DE OPCIONES

| Aspecto | Baseline + Reference | Development Branch | Adoption Migration |
|---------|---------------------|-------------------|-------------------|
| **Costo** | Gratis | $25/mes (Pro) | Gratis |
| **Setup Time** | 10 min | 30 min | 2 horas |
| **Control Versiones** | Parcial | ✅ Completo | Parcial |
| **Seguridad** | Alta | Muy Alta | Media |
| **Best for** | Equipos pequeños | Equipos profesionales | Quick fix |

---

## ⚠️ LO QUE NO DEBES HACER

❌ **NO ejecutes las migraciones directamente en producción**
```bash
# ESTO CAUSARÁ ERRORES:
supabase db push  # ❌ NO HACER
```

❌ **NO borres las migraciones generadas**
- Son valiosas como documentación
- Útiles para crear branches/replicas

❌ **NO hagas cambios manuales en producción sin migración**
- Siempre crea archivo de migración primero
- Aplica mediante `supabase db push`

---

## 🎯 MI RECOMENDACIÓN PERSONAL

**Para tu caso específico:**

1. **Corto plazo (HOY):**
   - Hacer backup del schema actual
   - Mover migraciones a `/reference`
   - Documentar estado con baseline

2. **Si presupuesto permite:**
   - Upgrade a Supabase Pro ($25/mes)
   - Crear branch `develop`
   - Aplicar migraciones limpias en branch
   - Desarrollo en branch, merge a main cuando listo

3. **Si presupuesto NO permite:**
   - Usar baseline approach
   - Crear migraciones incrementales desde ahora
   - Cuando escales, considerar Pro tier

---

## 📝 PRÓXIMO PASO

**Ejecuta este comando para empezar:**

```bash
cd /Users/jona/Desktop/dev/kaelo-app/supabase

# Crear estructura
mkdir -p backup migrations/reference

# Backup del schema actual
supabase db dump --schema public > backup/schema_actual_20260128.sql

# Revisar el dump
cat backup/schema_actual_20260128.sql | head -50
```

**Después de hacer el backup, dime:**
1. ¿Tienes Supabase Pro o Free tier?
2. ¿Prefieres usar branches o baseline approach?
3. ¿Viste algún error en el dump?

Y te guío con los siguientes pasos específicos.
