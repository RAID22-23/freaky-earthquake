**Fruity Fantastic**

Aplicación móvil construída con React Native + Expo (TypeScript). "Fruity Fantastic" es una demo de catálogo de películas con paginación infinita, favoritos y componentes reutilizables, pensada como base para practicar patrones de contexto, hooks personalizados y arquitectura de componentes.

**Resumen**
- **Propósito:** Mostrar una app móvil con búsqueda/filtrado de películas, paginación infinita y gestión de favoritos.
- **Plataforma:** Expo (iOS/Android), desarrollo en TypeScript.

**Características Principales**
- **Listado de películas**: Paginación infinita mediante un hook personalizado.
- **Detalle de película**: Pantalla individual por id.
- **Favoritos**: Guardado local de favoritos y gestión desde la UI.
- **Contextos globales**: `MovieContext`, `ThemeProvider`, `ToastContext` para estado compartido.
- **Componentes reutilizables**: Tarjetas, botones, barra de filtros y barra de navegación.

**Tecnologías**
- **Framework:** React Native + Expo
- **Lenguaje:** TypeScript
- **Herramientas:** ESLint, Babel, Vite (solo en otros subproyectos), Gradle (Android native folder presente)

**Requisitos previos**
- Node.js (LTS recomendado)
- npm o yarn
- Expo CLI (opcional): `npm install -g expo-cli` o usar `npx expo`
- Android Studio (si vas a ejecutar en emulador Android) o un dispositivo físico con USB debugging habilitado

**Instalación y ejecución (desarrollo)**
Abre una terminal PowerShell en la raíz del proyecto `fruity-fantastic` y ejecuta:

```
cd fruity-fantastic
npm install
npx expo start
```

- Para abrir en un emulador Android conectado o en Android Studio, usa la interfaz de Expo o ejecuta `a` en el terminal de Expo.
- Para ejecutar directamente en Android con la herramienta de expo (requiere configuración nativa):

```
npx expo run:android
```

**Scripts útiles (ejemplos)**
- `npm run lint` — Ejecutar ESLint (si está configurado en `package.json`).
- `npm run android` — Wrapper para iniciar en Android (puede variar según `package.json`).

Comprueba el `package.json` del proyecto para ver los scripts exactos disponibles.

**Estructura del proyecto**
- `app/` : Código de la aplicación React Native (pantallas, componentes, hooks y contextos).
  - `_layout.tsx` : Layout base de la app.
  - `index.tsx` : Punto de entrada de la app dentro de la carpeta `app/` (si aplica a la estructura del proyecto Expo).
  - `_components/` : Componentes reutilizables (ej. `MovieCard.tsx`, `NavBar.tsx`, `AppButton.tsx`).
  - `_context/` : Contextos compartidos: `MovieContext.tsx`, `ThemeProvider.tsx`, `ToastContext.tsx`.
  - `_hooks/` : Hooks personalizados (ej. `useInfiniteMovies.ts`).
  - `_utils/` : Utilidades comunes: `api.ts`, `cache.ts`, `config.ts`, `styles.ts`, `theme.ts`.
- `assets/` : Imágenes y recursos estáticos.
- `android/` : Proyecto Android nativo generado por Expo/React Native.

**Descripción breve de archivos clave**
- `app/_hooks/useInfiniteMovies.ts` : Hook personalizado para paginación infinita y consulta de listas de películas.
- `app/_context/MovieContext.tsx` : Contexto que centraliza el estado de películas, favoritos y funciones para mutar ese estado.
- `app/_components/MovieCard.tsx` : Componente visual que muestra la info resumida de una película.
- `app/_utils/api.ts` : Cliente para llamadas externas a APIs (aquí se centralizan endpoints y lógica de fetch).

**Cómo contribuir**
- Crea una rama descriptiva: `feature/nombre` o `fix/descripcion`.
- Haz commits pequeños y claros.
- Abre un Pull Request y describe el cambio y cómo probarlo.

**Buenas prácticas y recomendaciones**
- Mantener los hooks puros y con lógica separada del render.
- Usar `Context` solo para estado que realmente necesita compartirse.
- Añadir tipos y interfaces TypeScript para mantener la robustez.

**Depuración y testing**
- Usa los logs de Expo y el inspector de React Native para depurar.
- Añade tests unitarios o de integración si se incorpora un runner de tests (Jest/Testing Library), actualmente no incluido por defecto.

**Licencia**
- Revisa el archivo `LICENSE` en la raíz del repositorio padre si aplica.

**Contacto / Soporte**
- Si necesitas ayuda con la configuración del entorno, scripts o añadir CI/CD, abre una issue o pregunta directamente en el repositorio.

---
Si quieres, puedo:
- Actualizar el `README` con instrucciones exactas de `package.json` (puedo leerlo y añadir los scripts reales).
- Añadir secciones específicas sobre la API usada (si compartes la URL o `app/_utils/api.ts`).

# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
