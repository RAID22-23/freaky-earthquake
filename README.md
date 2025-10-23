# Freaky Earthquake - Aplicación de Películas

## Descripción del Proyecto

Freaky Earthquake es una aplicación web desarrollada con React y TypeScript que permite a los usuarios explorar películas populares y gestionar una lista de películas favoritas. La aplicación utiliza la API de The Movie Database (TMDB) para obtener información sobre películas, incluyendo pósters, títulos, fechas de lanzamiento y descripciones.

### Características Principales
- **Búsqueda de Películas**: Busca películas por título utilizando la API de TMDB.
- **Lista de Películas Populares**: Muestra una lista de películas populares por defecto.
- **Gestión de Favoritos**: Agrega y elimina películas de una lista de favoritos personal.
- **Interfaz Responsiva**: Diseño moderno y adaptable a diferentes dispositivos.
- **Navegación Simple**: Barra de navegación para alternar entre la página principal y los favoritos.

## Estructura Organizacional

El proyecto sigue una estructura modular y organizada para facilitar el mantenimiento y la escalabilidad:

```
freaky-earthquake/
├── LICENSE                    # Licencia GPL v3
├── README.md                  # Este archivo
└── app/                       # Directorio principal de la aplicación
    ├── eslint.config.js       # Configuración de ESLint para linting
    ├── index.html             # Archivo HTML principal
    ├── package.json           # Dependencias y scripts del proyecto
    ├── README.md              # README específico de la aplicación (plantilla Vite)
    ├── tsconfig.app.json      # Configuración TypeScript para la aplicación
    ├── tsconfig.json          # Configuración TypeScript principal
    ├── tsconfig.node.json     # Configuración TypeScript para Node.js
    ├── vite.config.ts         # Configuración de Vite para el bundler
    ├── public/                # Archivos estáticos públicos
    └── src/                   # Código fuente de la aplicación
        ├── App.css            # Estilos específicos del componente App
        ├── App.tsx            # Componente principal de la aplicación
        ├── Favourites.tsx     # Componente para la página de favoritos
        ├── Home.tsx           # Componente para la página principal
        ├── index.css          # Estilos globales
        ├── main.tsx           # Punto de entrada de la aplicación React
        ├── MovieCard.tsx      # Componente para mostrar una tarjeta de película
        ├── MovieContext.tsx   # Contexto para gestionar el estado de películas favoritas
        ├── NavBar.tsx         # Componente de la barra de navegación
        └── assets/            # Recursos estáticos (imágenes, iconos, etc.)
```

## Componentes y Funcionalidades

### Componentes Principales

#### App.tsx
- **Descripción**: Componente raíz de la aplicación que configura el enrutamiento y el proveedor de contexto.
- **Funcionalidad**: Envuelve la aplicación con `MovieProvider` para el estado global de favoritos y configura las rutas usando React Router.
- **Dependencias**: Utiliza `BrowserRouter`, `Routes`, `Route` de `react-router-dom`.

#### NavBar.tsx
- **Descripción**: Barra de navegación simple con enlaces a las páginas principales.
- **Funcionalidad**: Proporciona navegación entre "Home" y "Favourites" usando enlaces de React Router.
- **Estilos**: Estilos inline básicos para separación de enlaces.

#### Home.tsx
- **Descripción**: Página principal que muestra la lista de películas y permite búsquedas.
- **Funcionalidad**:
  - Carga películas populares por defecto desde TMDB.
  - Formulario de búsqueda para filtrar películas por título.
  - Manejo de estado de carga durante las peticiones API.
  - Renderiza una cuadrícula de `MovieCard` para cada película.
- **API**: Utiliza Axios para hacer peticiones a la API de TMDB.

#### Favourites.tsx
- **Descripción**: Página que muestra la lista de películas marcadas como favoritas.
- **Funcionalidad**: Accede al contexto de películas para mostrar solo las favoritas. Si no hay favoritos, muestra un mensaje informativo.
- **Renderizado**: Utiliza `MovieCard` para mostrar cada película favorita en una cuadrícula.

#### MovieCard.tsx
- **Descripción**: Componente reutilizable que representa una película individual.
- **Funcionalidad**:
  - Muestra el póster, título y fecha de lanzamiento de la película.
  - Botón para agregar o remover de favoritos, cambiando dinámicamente según el estado.
  - Utiliza el contexto `MovieContext` para gestionar favoritos.
- **Estilos**: Clase CSS `movie-card` para el diseño de la tarjeta.

#### MovieContext.tsx
- **Descripción**: Contexto de React para gestionar el estado global de las películas favoritas.
- **Funcionalidad**:
  - Define la interfaz `Movie` con propiedades como id, title, poster_path, etc.
  - Proporciona funciones para agregar, remover y verificar favoritos.
  - Utiliza `useState` para mantener la lista de favoritos en el estado local.
- **Hook**: Exporta `useMovieContext` para acceder al contexto en componentes hijos.

### Archivos de Configuración

#### package.json
- **Descripción**: Archivo de configuración de npm que define dependencias, scripts y metadatos del proyecto.
- **Dependencias Principales**:
  - `react` y `react-dom`: Biblioteca principal para la interfaz de usuario.
  - `react-router-dom`: Para el enrutamiento de páginas.
  - `axios`: Para realizar peticiones HTTP a la API de TMDB.
- **Scripts**:
  - `dev`: Inicia el servidor de desarrollo con Vite.
  - `build`: Compila el proyecto para producción.
  - `lint`: Ejecuta ESLint para verificar el código.
  - `preview`: Previsualiza la build de producción.

#### vite.config.ts
- **Descripción**: Configuración del bundler Vite para el desarrollo y construcción del proyecto.
- **Plugins**: Incluye `@vitejs/plugin-react` para soporte de React con Fast Refresh.

#### tsconfig.json, tsconfig.app.json, tsconfig.node.json
- **Descripción**: Configuraciones de TypeScript para diferentes partes del proyecto.
- `tsconfig.json`: Configuración principal que referencia las otras.
- `tsconfig.app.json`: Para el código de la aplicación (src/), con JSX y tipos de DOM.
- `tsconfig.node.json`: Para archivos de configuración de Node.js como vite.config.ts.

#### eslint.config.js
- **Descripción**: Configuración de ESLint para linting del código TypeScript y React.
- **Reglas**: Incluye configuraciones recomendadas para JavaScript, TypeScript, React Hooks y React Refresh.

### Archivos de Estilos y Recursos

#### index.css y App.css
- **Descripción**: Archivos CSS para estilos globales y específicos de componentes.
- **Uso**: `index.css` para resets y estilos base, `App.css` para estilos del componente App.

#### index.html
- **Descripción**: Archivo HTML principal que sirve como punto de entrada para la aplicación.
- **Contenido**: Incluye el div con id "root" donde React monta la aplicación, y referencia al script main.tsx.

#### main.tsx
- **Descripción**: Punto de entrada de JavaScript/TypeScript para la aplicación React.
- **Funcionalidad**: Crea la raíz de React y renderiza el componente `App` en modo estricto.

#### public/
- **Descripción**: Directorio para archivos estáticos que se sirven directamente (favicon, imágenes públicas).

#### assets/
- **Descripción**: Directorio para recursos importados en el código (imágenes, fuentes), procesados por Vite.

## Tecnologías Utilizadas

- **React 19**: Biblioteca para construir interfaces de usuario.
- **TypeScript**: Superset de JavaScript con tipado estático.
- **Vite**: Herramienta de construcción rápida para desarrollo web moderno.
- **React Router DOM**: Para navegación y enrutamiento en la aplicación.
- **Axios**: Cliente HTTP para peticiones a la API.
- **TMDB API**: Fuente de datos para información de películas.
- **ESLint**: Herramienta de linting para mantener calidad del código.

## Instalación y Uso

1. **Clona el repositorio**:
   ```bash
   git clone https://github.com/RAID22-23/freaky-earthquake.git
   cd freaky-earthquake/app
   ```

2. **Instala las dependencias**:
   ```bash
   npm install
   ```

3. **Configura la API Key**:
   - Obtén una API key gratuita de [TMDB](https://www.themoviedb.org/settings/api).
   - Reemplaza la `API_KEY` en `src/Home.tsx` con tu clave.

4. **Ejecuta la aplicación en modo desarrollo**:
   ```bash
   npm run dev
   ```

5. **Construye para producción**:
   ```bash
   npm run build
   npm run preview
   ```

## Licencia

Este proyecto está bajo la Licencia GPL v3. Consulta el archivo `LICENSE` para más detalles.