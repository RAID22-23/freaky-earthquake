// Importaciones necesarias: React hooks, axios para API, componentes y tipos
import React, { useEffect, useRef, useState, useCallback } from "react";
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeQuery, setActiveQuery] = useState("");
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const pendingPreserveRef = useRef<{ id: string | null; top: number } | null>(null);

  // Función asíncrona para obtener películas de la API
  const fetchMovies = async (query: string = "", page: number = 1, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true); // Activa el indicador de carga
    }
    try {
      // Construye el endpoint según si hay búsqueda o no
      const endpoint = query
        ? `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}&page=${page}`
        : `${BASE_URL}/movie/popular?api_key=${API_KEY}&page=${page}`;
      const response = await axios.get(endpoint); // Realiza la petición
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.debug(`[Home] fetchMovies(page=${page}, append=${append}) -> results=${response.data.results.length}`);
      setMovies((prev) => (append ? [...prev, ...response.data.results] : response.data.results)); // Actualiza las películas
      setTotalPages(response.data.total_pages); // Actualiza el total de páginas
    } catch (error) {
      console.error("Error fetching movies:", error); // Manejo de errores
    } finally {
      setLoading(false); // Desactiva el indicador de carga
      setLoadingMore(false);
    }
  };

  // Efecto para cargar películas cuando cambian la consulta o la página
  useEffect(() => {
    // Si es la primera página, reemplazamos; si no, añadimos resultados
    const append = currentPage > 1;
    const preserve = append && pendingPreserveRef.current && pendingPreserveRef.current.id !== null;
    fetchMovies(activeQuery, currentPage, append).then(() => {
      // Si tenemos que preservar foco/posición, restauramos basado en el elemento superior visible
      if (preserve && pendingPreserveRef.current) {
        const id = pendingPreserveRef.current.id;
        const prevTop = pendingPreserveRef.current.top;
          if (id) {
          const el = document.querySelector(`[data-movie-id="${id}"]`) as HTMLElement | null;
          if (el) {
            const newTop = el.getBoundingClientRect().top;
            const delta = newTop - prevTop;
            // Mantener la posición estable
            window.scrollBy({ top: delta, left: 0, behavior: "auto" });
          }
        }
      }
      pendingPreserveRef.current = null;
    });
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
      // Preserve the topmost visible card so we can restore its position
      const topInfo = getTopVisibleCardInfo();
      pendingPreserveRef.current = { id: topInfo.id, top: topInfo.top };
      setCurrentPage(currentPage + 1); // Incrementa la página
    }
  };

  // Manejador para ir a la página anterior
  const handlePrevPage = () => {
    if (currentPage > 1) {
      const topInfo = getTopVisibleCardInfo();
      pendingPreserveRef.current = { id: topInfo.id, top: topInfo.top };
      setCurrentPage(currentPage - 1); // Decrementa la página
    }
  };

  // Busca el primer card visible y guarda su id y posición para preservar foco
  const getTopVisibleCardInfo = useCallback(() => {
    const cards = Array.from(document.querySelectorAll(".movie-card")) as HTMLElement[];
    for (const card of cards) {
      const rect = card.getBoundingClientRect();
      if (rect.top >= 0 && rect.top < window.innerHeight) {
        return { id: card.dataset.movieId || null, top: rect.top };
      }
    }
    return { id: null, top: 0 };
  }, []);

  // Observador para el scroll infinito
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        console.debug(`[Home] observer entry isIntersecting=${entry.isIntersecting}, currentPage=${currentPage}, totalPages=${totalPages}`);
        if (entry.isIntersecting && !loading && !loadingMore && currentPage < totalPages) {
          // Guardar el elemento superior visible para preservar el foco
          const topInfo = getTopVisibleCardInfo();
          pendingPreserveRef.current = { id: topInfo.id, top: topInfo.top };
          setCurrentPage((prev) => prev + 1);
        }
      },
      { root: null, rootMargin: "200px" }
    );
    const el = sentinelRef.current;
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [currentPage, totalPages, loading, loadingMore, getTopVisibleCardInfo]);

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
        {/* Sentinel para detectar cuando estamos cerca del final de la lista */}
        <div ref={sentinelRef} className="list-sentinel" />
      </div>
      {loadingMore && <div className="loading-spinner">Loading more...</div>}
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
