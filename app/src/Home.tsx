// Importaciones necesarias: React hooks, axios para API, componentes y tipos
import React, { useEffect, useState } from "react";
import axios from "axios";
import MovieCard from "./MovieCard";
import MovieModal from "./MovieModal";
import type { Movie } from "./MovieContext";

// Claves de API y URL base para The Movie Database
const API_KEY = import.meta.env.VITE_APP_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

// Componente funcional para la página principal
const Home: React.FC = () => {
  // Estados para manejar películas, búsqueda, carga, película seleccionada, paginación y consulta activa
  const [movies, setMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeQuery, setActiveQuery] = useState("");

  // Función asíncrona para obtener películas de la API
  const fetchMovies = async (query: string = "", page: number = 1) => {
    setLoading(true); // Activa el indicador de carga
    try {
      // Construye el endpoint según si hay búsqueda o no
      const endpoint = query
        ? `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}&page=${page}`
        : `${BASE_URL}/movie/popular?api_key=${API_KEY}&page=${page}`;
      const response = await axios.get(endpoint); // Realiza la petición
      setMovies(response.data.results); // Actualiza las películas
      setTotalPages(response.data.total_pages); // Actualiza el total de páginas
    } catch (error) {
      console.error("Error fetching movies:", error); // Manejo de errores
    } finally {
      setLoading(false); // Desactiva el indicador de carga
    }
  };

  // Efecto para cargar películas cuando cambian la consulta o la página
  useEffect(() => {
    fetchMovies(activeQuery, currentPage);
  }, [activeQuery, currentPage]);

  // Manejador para el envío del formulario de búsqueda
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault(); // Previene el comportamiento por defecto
    setActiveQuery(searchQuery); // Actualiza la consulta activa
    setCurrentPage(1); // Reinicia a la primera página
  };

  // Manejador para cuando se hace clic en una película
  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie); // Selecciona la película para el modal
  };

  // Manejador para cerrar el modal
  const handleCloseModal = () => {
    setSelectedMovie(null); // Deselecciona la película
  };

  // Manejador para ir a la página siguiente
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1); // Incrementa la página
    }
  };

  // Manejador para ir a la página anterior
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1); // Decrementa la página
    }
  };

  // Renderiza el componente
  return (
    <div className="page">
      {/* Título de la aplicación */}
      <h1>Movie App</h1>
      {/* Formulario de búsqueda */}
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for movies..."
        />
        <button type="submit">Search</button>
      </form>
      {/* Indicador de carga si está cargando */}
      {loading && <div className="loading-spinner">Loading...</div>}
      {/* Cuadrícula de películas con animación */}
      <div className="movie-grid fade-in">
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onClick={() => handleMovieClick(movie)} // Pasa el manejador de clic
          />
        ))}
      </div>
      {/* Controles de paginación */}
      <div className="pagination">
        <button onClick={handlePrevPage} disabled={currentPage === 1}>
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={handleNextPage} disabled={currentPage === totalPages}>
          Next
        </button>
      </div>
      {/* Modal para mostrar detalles de la película seleccionada */}
      <MovieModal movie={selectedMovie} onClose={handleCloseModal} />
    </div>
  );
};

// Exporta el componente por defecto
export default Home;
