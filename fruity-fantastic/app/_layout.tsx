import { Stack } from "expo-router";
import { MovieProvider } from "./_context/MovieContext";
import { ThemeProvider } from "./_context/ThemeProvider";
import { ToastProvider } from "./_context/ToastContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <MovieProvider>
          <Stack
            screenOptions={{ headerShown: true }}
          >
            {/* Define titles for common routes */}
            <Stack.Screen name="index" options={{ title: 'Home' }} />
            <Stack.Screen name="favourites" options={{ title: 'Favourites' }} />
            <Stack.Screen name="movie/[id]" options={{ title: 'Movie' }} />
          </Stack>
        </MovieProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
