<p align="center">
  <img src="assets/images/icon.png" alt="Kaelo Logo" width="120" height="120" style="border-radius: 20px;">
</p>

<h1 align="center">🚴 Kaelo</h1>

<p align="center">
  <strong>Descubre rutas ciclistas y cenotes en Yucatán</strong>
</p>

<p align="center">
  <a href="#características">Características</a> •
  <a href="#tecnologías">Tecnologías</a> •
  <a href="#instalación">Instalación</a> •
  <a href="#configuración">Configuración</a> •
  <a href="#scripts">Scripts</a> •
  <a href="#estructura-del-proyecto">Estructura</a> •
  <a href="#contribuir">Contribuir</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.81.5-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React Native">
  <img src="https://img.shields.io/badge/Expo-54.0-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo">
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Supabase-Auth-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase">
</p>

---

## 📱 Descripción

**Kaelo** es una aplicación móvil diseñada para ciclistas y amantes de la naturaleza en la Península de Yucatán. Explora rutas ciclistas, descubre cenotes escondidos y conecta con una comunidad apasionada por el ciclismo y el ecoturismo.

---

## ✨ Características

### 🗺️ Explorar
- Mapa interactivo con múltiples tipos de visualización (estándar, satélite, híbrido, terreno)
- Geolocalización en tiempo real
- Búsqueda de rutas y cenotes
- Filtros por distancia, dificultad y tipo de bicicleta
- Tarjetas de vista previa de rutas cercanas

### 🛤️ Rutas
- Catálogo de rutas ciclistas verificadas
- Información detallada: distancia, dificultad, tiempo estimado
- Sistema de calificaciones y reseñas

### 🏪 Comercios
- Directorio de tiendas y servicios para ciclistas
- Puntos de interés en la ruta

### 👤 Perfil
- Autenticación segura con Supabase
- Gestión de cuenta de usuario
- Historial y preferencias

---

## 🛠️ Tecnologías

| Categoría | Tecnología |
|-----------|------------|
| **Framework** | [React Native](https://reactnative.dev/) 0.81.5 |
| **Plataforma** | [Expo](https://expo.dev/) SDK 54 |
| **Lenguaje** | [TypeScript](https://www.typescriptlang.org/) 5.9 |
| **Navegación** | [Expo Router](https://docs.expo.dev/router/introduction/) 6.0 |
| **Autenticación** | [Supabase Auth](https://supabase.com/docs/guides/auth) |
| **Mapas** | [React Native Maps](https://github.com/react-native-maps/react-native-maps) |
| **Animaciones** | [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) |
| **Ubicación** | [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/) |
| **Almacenamiento Seguro** | [Expo Secure Store](https://docs.expo.dev/versions/latest/sdk/securestore/) |

---

## 📦 Instalación

### Prerrequisitos

- [Node.js](https://nodejs.org/) (v18 o superior)
- [Yarn](https://yarnpkg.com/) o npm
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Xcode](https://developer.apple.com/xcode/) (para iOS)
- [Android Studio](https://developer.android.com/studio) (para Android)

### Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/kaelo-app.git
cd kaelo-app
```

### Instalar dependencias

```bash
yarn install
# o
npm install
```

---

## ⚙️ Configuración

### Variables de entorno

Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:

```bash
cp .env.example .env
```

Configura las siguientes variables:

```env
EXPO_PUBLIC_SUPABASE_URL=tu_url_de_supabase
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

### Configuración de Supabase

1. Crea un proyecto en [Supabase](https://supabase.com/)
2. Copia la URL y la Anon Key desde la configuración del proyecto
3. Configura las políticas de autenticación según tus necesidades

---

## 📜 Scripts

| Comando | Descripción |
|---------|-------------|
| `yarn start` | Inicia el servidor de desarrollo de Expo |
| `yarn ios` | Ejecuta la app en el simulador de iOS |
| `yarn android` | Ejecuta la app en el emulador de Android |
| `yarn web` | Inicia la versión web de la aplicación |

---

## 📁 Estructura del Proyecto

```
kaelo-app/
├── assets/
│   ├── fonts/          # Tipografías personalizadas
│   └── images/         # Imágenes y recursos gráficos
├── src/
│   ├── app/            # Rutas de Expo Router
│   │   ├── (tabs)/     # Navegación por pestañas
│   │   ├── _layout.tsx # Layout principal
│   │   ├── login.tsx   # Pantalla de login
│   │   └── register.tsx# Pantalla de registro
│   ├── components/     # Componentes reutilizables
│   ├── constants/      # Constantes y configuración
│   │   └── Colors.ts   # Paleta de colores de la app
│   ├── context/        # Contextos de React
│   │   └── AuthContext.tsx
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Configuraciones de librerías
│   │   └── supabase.ts # Cliente de Supabase
│   ├── screens/        # Pantallas de la aplicación
│   │   ├── auth/       # Pantallas de autenticación
│   │   └── tabs/       # Pantallas principales
│   ├── server/         # Lógica del servidor (si aplica)
│   └── utils/          # Utilidades y helpers
├── app.json            # Configuración de Expo
├── babel.config.js     # Configuración de Babel
├── package.json        # Dependencias del proyecto
└── tsconfig.json       # Configuración de TypeScript
```

---

## 🎨 Paleta de Colores

| Color | Código | Uso |
|-------|--------|-----|
| 🟢 **Primary** | `#2DD4BF` | Color principal de la marca |
| 🟢 **Primary Dark** | `#14B8A6` | Estados hover/press |
| ⚪ **Background** | `#FFFFFF` | Fondo principal |
| ⚫ **Text** | `#1F2937` | Texto principal |
| 🔴 **Error** | `#EF4444` | Estados de error |
| 🟢 **Success** | `#10B981` | Estados de éxito |

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor, sigue estos pasos:

1. Haz fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Realiza tus cambios y haz commit (`git commit -m 'Añade nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

### Guías de estilo

- Usa TypeScript para todo el código nuevo
- Sigue las convenciones de nombres de React Native
- Utiliza los colores definidos en `src/constants/Colors.ts`
- Documenta las funciones y componentes complejos

---

## 📄 Licencia

Este proyecto es privado y está protegido por derechos de autor.

---

## 📧 Contacto

Para preguntas o sugerencias, abre un issue en el repositorio.

---

<p align="center">
  Hecho con ❤️ para la comunidad ciclista de Yucatán
</p>
