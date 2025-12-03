import { Stack } from "expo-router";
import { MovieProvider } from "./_context/MovieContext";
import { ThemeProvider } from "./_context/ThemeProvider";
import { ToastProvider } from "./_context/ToastContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <MovieProvider>
          <Stack />
        </MovieProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
