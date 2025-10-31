// Importación de React y componentes necesarios
import React from "react";
import { useMovieContext } from "./MovieContext";
import MovieCard from "./MovieCard";

// Componente funcional para mostrar la lista de películas favoritas
const Favourites: React.FC = () => {
  // Obtiene la lista de películas favoritas del contexto
  const { favourites } = useMovieContext();

  // Renderiza el componente
  return (
    <div>
      {/* Título de la página */}
      <h1>My Favourites</h1>
      {/* Condicional: si no hay favoritos, muestra mensaje; de lo contrario, muestra la cuadrícula */}
      {favourites.length === 0
        ? <p>No favourite movies yet.</p>
        : (
          <div className="movie-grid">
            {/* Mapea cada película favorita a un componente MovieCard */}
            {favourites.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
    </div>
  );
};

// Exporta el componente por defecto
export default Favourites;
