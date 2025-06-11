// TMDB API configuration
const API_KEY = '72b544388cd4251b3736f3600c5dccc0';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/original';

// DOM Elements
const moviesGrid = document.getElementById('movies-grid');
const loadingSpinner = document.getElementById('loading');
const filterButtons = document.querySelectorAll('.filter-button');
const searchInput = document.getElementById('searchInput');
const heroBackground = document.getElementById('hero-background');

// State
let currentFilter = 'all';
let currentPage = 1;
let isLoading = false;
let hasMorePages = true;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadMovies();
    setupInfiniteScroll();
    setupFilterButtons();
    setupSearch();
    loadRandomHeroMovie();
});

// Load random hero movie
async function loadRandomHeroMovie() {
    try {
        const response = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&page=1`);
        const data = await response.json();
        const randomMovie = data.results[Math.floor(Math.random() * data.results.length)];
        
        if (randomMovie.backdrop_path) {
            heroBackground.src = `${BACKDROP_BASE_URL}${randomMovie.backdrop_path}`;
        }
    } catch (error) {
        console.error('Error loading hero movie:', error);
    }
}

// Setup infinite scroll
function setupInfiniteScroll() {
    window.addEventListener('scroll', () => {
        if (isLoading || !hasMorePages) return;

        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        if (scrollTop + clientHeight >= scrollHeight - 800) {
            currentPage++;
            loadMovies(false);
        }
    });
}

// Setup filter buttons
function setupFilterButtons() {
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (button.dataset.filter === currentFilter) return;

            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            currentFilter = button.dataset.filter;
            currentPage = 1;
            hasMorePages = true;
            moviesGrid.innerHTML = '';
            loadMovies();
        });
    });
}

// Setup search functionality
function setupSearch() {
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = e.target.value.trim();
            currentPage = 1;
            hasMorePages = true;
            moviesGrid.innerHTML = '';
            
            if (query) {
                searchMovies(query);
            } else {
                loadMovies();
            }
        }, 500);
    });
}

// Load movies based on current filter
async function loadMovies(showLoading = true) {
    if (isLoading) return;
    isLoading = true;
    
    if (showLoading) {
        loadingSpinner.style.display = 'flex';
    }

    try {
        let endpoint;
        switch (currentFilter) {
            case 'trending':
                endpoint = '/trending/movie/week';
                break;
            case 'latest':
                endpoint = '/movie/now_playing';
                break;
            case 'top_rated':
                endpoint = '/movie/top_rated';
                break;
            case 'upcoming':
                endpoint = '/movie/upcoming';
                break;
            default:
                endpoint = '/movie/popular';
        }

        const response = await fetch(
            `${BASE_URL}${endpoint}?api_key=${API_KEY}&page=${currentPage}`
        );
        const data = await response.json();
        
        if (data.results.length === 0) {
            hasMorePages = false;
            if (currentPage === 1) {
                showNoResults();
            }
            return;
        }

        renderMovies(data.results);
        hasMorePages = currentPage < data.total_pages;
    } catch (error) {
        console.error('Error loading movies:', error);
        showError();
    } finally {
        isLoading = false;
        loadingSpinner.style.display = 'none';
    }
}

// Search movies
async function searchMovies(query) {
    if (isLoading) return;
    isLoading = true;
    loadingSpinner.style.display = 'flex';

    try {
        const response = await fetch(
            `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${currentPage}`
        );
        const data = await response.json();
        
        if (data.results.length === 0) {
            hasMorePages = false;
            if (currentPage === 1) {
                showNoResults();
            }
            return;
        }

        renderMovies(data.results);
        hasMorePages = currentPage < data.total_pages;
    } catch (error) {
        console.error('Error searching movies:', error);
        showError();
    } finally {
        isLoading = false;
        loadingSpinner.style.display = 'none';
    }
}

// Render movies to grid
function renderMovies(movies) {
    movies.forEach(movie => {
        if (!movie.poster_path) return;

        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';
        
        const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
        const isInWatchlist = watchlist.some(item => item.id === movie.id);
        
        movieCard.innerHTML = `
            <img src="${IMAGE_BASE_URL}${movie.poster_path}" alt="${movie.title}" class="movie-poster">
            <div class="movie-info">
                <h3 class="movie-title">${movie.title}</h3>
                <div class="movie-meta">
                    <div class="movie-rating">
                        <i class="fas fa-star"></i>
                        <span>${movie.vote_average.toFixed(1)}</span>
                    </div>
                    <span>${new Date(movie.release_date).getFullYear()}</span>
                </div>
                <button class="watchlist-btn ${isInWatchlist ? 'added' : ''}" data-movie-id="${movie.id}">
                    ${isInWatchlist ? '✓ Added to watchlist' : '+ Add to watchlist'}
                </button>
            </div>
        `;

        // Add click event for movie card
        movieCard.addEventListener('click', (e) => {
            if (!e.target.closest('.watchlist-btn')) {
                window.location.href = `./movie-details.html?id=${movie.id}`;
            }
        });

        // Add click event for watchlist button
        const watchlistBtn = movieCard.querySelector('.watchlist-btn');
        watchlistBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleWatchlist(movie, watchlistBtn);
        });

        moviesGrid.appendChild(movieCard);
    });
}

// Toggle watchlist status
function toggleWatchlist(movie, button) {
    const movieData = {
        id: movie.id,
        title: movie.title,
        overview: movie.overview,
        poster_path: movie.poster_path,
        vote_average: movie.vote_average,
        release_date: movie.release_date
    };
    
    if (isInWatchlist(movie.id)) {
        removeFromWatchlist(movie.id);
        button.textContent = '+ Add to watchlist';
        button.classList.remove('added');
        showToast('Removed from watchlist');
    } else {
        if (addToWatchlist(movieData)) {
            button.textContent = '✓ Added to watchlist';
            button.classList.add('added');
            showToast('Added to watchlist');
        }
    }
}

// Show toast notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 2000);
}

// Show no results message
function showNoResults() {
    moviesGrid.innerHTML = `
        <div class="no-results">
            <i class="fas fa-search fa-3x"></i>
            <p>No movies found</p>
        </div>
    `;
}

// Show error message
function showError() {
    moviesGrid.innerHTML = `
        <div class="no-results">
            <i class="fas fa-exclamation-circle fa-3x"></i>
            <p>Something went wrong. Please try again later.</p>
        </div>
    `;
} 