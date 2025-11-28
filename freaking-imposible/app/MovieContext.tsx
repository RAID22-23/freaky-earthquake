// This file is a placeholder route to keep expo-router happy. It intentionally doesn't export the real context.

// Placeholder route to prevent expo-router from treating `context/MovieContext.tsx` as a page.
// Please import the real `useMovieContext`, `MovieProvider`, and types from `./context/MovieContext`.
export const useMovieContext = () => {
  throw new Error("Please import useMovieContext from './context/MovieContext'");
};

export default function MovieContextRoute() {
  return null;
}
