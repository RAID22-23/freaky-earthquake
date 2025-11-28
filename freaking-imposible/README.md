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

   ### Configura la API Key de TMDB

   Para que la aplicación muestre películas necesitas la API key de The Movie Database (TMDB). Puedes definirla como variable de entorno `EXPO_PUBLIC_API_KEY` antes de iniciar Expo:

   ```pwsh
   set "EXPO_PUBLIC_API_KEY=YOUR_API_KEY"
   npx expo start
   ```

   Alternativamente, la puedes añadir en `app.json` dentro de `expo.extra` (solo para uso local/de pruebas).

### Guardar la API Key en `app.json` (opcional / local)
Si prefieres no establecer la variable de entorno en tu shell, puedes colocar la clave en `app.json` para pruebas locales. Agrega la clave en `expo.extra`:

```json
{
   "expo": {
      "extra": {
         "EXPO_PUBLIC_API_KEY": "YOUR_API_KEY"
      }
   }
}
```

> Nota: No dejes claves en el control de versiones; usar `app.config.js` o EAS secrets para producción.

## Mejoras de UI/UX incluidas

- Tema central (paleta y dimensiones): `app/utils/theme.ts` y `app/_context/ThemeProvider.tsx`.
- Toasts para feedback: `app/_context/ToastContext.tsx`.
- Grid y tarjetas animadas (`app/components/MovieCard.tsx`) con stripe de acento y animaciones de Reanimated.
- Pantalla de Detalles con carousel, badges y chips: `app/movie/[id].tsx`.
- Persistencia de favoritos con AsyncStorage: `app/_context/MovieContext.tsx`.
- Scroll infinito y optimizaciones de `FlatList` para rendimiento.
- Prefetch y caching: la app ahora prefetch las imágenes y detalles de las películas visibles y en la siguiente página, usando una cache en memoria con persistencia limitada, mejorando la velocidad al navegar entre pantallas.

## Pruebas rápidas
1. Inicia la app:

```pwsh
cd "freaking-imposible"
npm install
set "EXPO_PUBLIC_API_KEY=YOUR_API_KEY"
npx expo start
```

2. Acciones a verificar:
- Buscar y navegar por resultados (grid + animaciones).
- Agregar/Remover favoritos desde un card o desde pantalla de detalles; verificar toast y que se mantenga tras reiniciar app.
- Pulsar hasta el final para activar scroll infinito.
 - Comprobar la velocidad de carga al abrir una película (prefetch de detalle + poster), y que el scroll carga más rápido por la caché.

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
