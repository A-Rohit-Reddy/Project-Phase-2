// Constants
const TMDB_API_KEY = '72b544388cd4251b3736f3600c5dccc0';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// State variables
let currentPage = 1;
let isLoading = false;
let hasMoreMovies = true;
let currentCategory = '';

// Category configurations
const categories = {
    'recommended': {
        title: 'Recommended Movies',
        description: 'Personalized movie recommendations just for you',
        endpoint: '/discover/movie',
        params: '&sort_by=popularity.desc'
    },
    'trending': {
        title: 'Trending Movies',
        description: 'Most popular movies right now',
        endpoint: '/trending/movie/week',
        params: ''
    },
    'upcoming': {
        title: 'Upcoming Movies',
        description: 'Exciting new releases coming soon',
        endpoint: '/movie/upcoming',
        params: ''
    },
    'top-rated': {
        title: 'Top Rated Movies',
        description: 'Highest rated movies of all time',
        endpoint: '/movie/top_rated',
        params: ''
    },
    'popular': {
        title: 'Popular Movies',
        description: 'Most watched movies',
        endpoint: '/movie/popular',
        params: ''
    },
    'new-releases': {
        title: 'New Releases',
        description: 'Latest movies to watch',
        endpoint: '/movie/now_playing',
        params: ''
    }
};

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Get category from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentCategory = urlParams.get('category') || 'popular';

    // Set page title and description
    const category = categories[currentCategory];
    if (category) {
        document.getElementById('categoryTitle').textContent = category.title;
        document.getElementById('categoryDescription').textContent = category.description;
        document.title = `${category.title} - Movie Streaming`;
    }

    // Load initial movies
    loadMovies();

    // Add scroll listener for infinite loading
    window.addEventListener('scroll', handleScroll);

    // Add click listener for load more button
    document.getElementById('loadMore').addEventListener('click', loadMovies);
});

// Function to fetch movies
async function fetchMovies(page = 1) {
    try {
        const category = categories[currentCategory];
        if (!category) throw new Error('Invalid category');

        const url = `${TMDB_BASE_URL}${category.endpoint}?api_key=${TMDB_API_KEY}&page=${page}${category.params}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch movies');

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching movies:', error);
        showError('Failed to load movies. Please try again.');
        return null;
    }
}

// Function to create movie card
function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    
    const posterPath = movie.poster_path 
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : 'images/no-poster.jpg';

    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';

    card.innerHTML = `
        <img src="${posterPath}" alt="${movie.title}" class="movie-poster" 
             onerror="this.src='images/no-poster.jpg'">
        <div class="movie-info">
            <h3 class="movie-title">${movie.title}</h3>
            <div class="movie-meta">
                <span>${year}</span>
                <div class="movie-rating">
                    <i class="fas fa-star"></i>
                    <span>${movie.vote_average.toFixed(1)}</span>
                </div>
            </div>
            <div class="movie-actions">
                <button class="watchlist-btn" data-movie-id="${movie.id}">
                    <i class="fas fa-plus"></i> Watchlist
                </button>
            </div>
        </div>
    `;

    // Add click handler for the card
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.watchlist-btn')) {
            window.location.href = `movie-details.html?id=${movie.id}`;
        }
    });

    // Add watchlist button handler
    const watchlistBtn = card.querySelector('.watchlist-btn');
    watchlistBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleWatchlist(movie.id, movie.title);
    });

    // Update button state
    updateWatchlistButton(watchlistBtn, movie.id);

    return card;
}

// Function to toggle watchlist
function toggleWatchlist(movieId, movieTitle) {
    const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
    const isInWatchlist = watchlist.includes(movieId);

    if (isInWatchlist) {
        // Remove from watchlist
        const updatedWatchlist = watchlist.filter(id => id !== movieId);
        localStorage.setItem('watchlist', JSON.stringify(updatedWatchlist));
        showToast(`Removed "${movieTitle}" from watchlist`, 'success');
    } else {
        // Add to watchlist
        watchlist.push(movieId);
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
        showToast(`Added "${movieTitle}" to watchlist`, 'success');
    }

    // Update all watchlist buttons
    updateAllWatchlistButtons();
}

// Function to update watchlist button state
function updateWatchlistButton(button, movieId) {
    const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
    const isInWatchlist = watchlist.includes(movieId);

    if (isInWatchlist) {
        button.innerHTML = '<i class="fas fa-check"></i> In Watchlist';
        button.classList.add('in-watchlist');
    } else {
        button.innerHTML = '<i class="fas fa-plus"></i> Watchlist';
        button.classList.remove('in-watchlist');
    }
}

// Function to update all watchlist buttons
function updateAllWatchlistButtons() {
    const buttons = document.querySelectorAll('.watchlist-btn');
    buttons.forEach(button => {
        const movieId = button.dataset.movieId;
        updateWatchlistButton(button, movieId);
    });
}

// Function to show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }, 100);
}

// Function to load more movies
async function loadMovies() {
    if (isLoading || !hasMoreMovies) return;

    isLoading = true;
    document.getElementById('loading').style.display = 'block';
    document.getElementById('loadMore').style.display = 'none';

    try {
        const data = await fetchMovies(currentPage);
        if (!data || !data.results || data.results.length === 0) {
            hasMoreMovies = false;
            return;
        }

        const moviesGrid = document.getElementById('moviesGrid');
        data.results.forEach(movie => {
            if (movie.poster_path) {
                moviesGrid.insertAdjacentHTML('beforeend', createMovieCard(movie));
            }
        });

        // Update page number and check if more movies are available
        currentPage++;
        hasMoreMovies = currentPage <= data.total_pages;

        // Add click handlers to new cards
        addMovieClickHandlers();
        updateWatchlistButtons();
    } catch (error) {
        console.error('Error loading movies:', error);
        showError('Failed to load movies. Please try again.');
    } finally {
        isLoading = false;
        document.getElementById('loading').style.display = 'none';
        document.getElementById('loadMore').style.display = hasMoreMovies ? 'block' : 'none';
    }
}

// Function to handle infinite scroll
function handleScroll() {
    if (isLoading || !hasMoreMovies) return;

    const scrollPosition = window.innerHeight + window.scrollY;
    const bodyHeight = document.body.offsetHeight;
    const loadMoreThreshold = bodyHeight - (window.innerHeight * 1.5);

    if (scrollPosition >= loadMoreThreshold) {
        loadMovies();
    }
}

// Function to show movie details
async function showMovieDetails(movieId) {
    try {
        const response = await fetch(`${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}`);
        if (!response.ok) throw new Error('Movie not found');
        
        const movieData = await response.json();
        
        // Store the movie data in localStorage
        localStorage.setItem('currentMovie', JSON.stringify(movieData));

        // Navigate to movie details page
        window.location.href = `movie-details.html?id=${movieId}`;
    } catch (error) {
        console.error('Error:', error);
        showError('Movie not found. Please try another movie.');
    }
}

// Function to show error message
function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'error-message';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Function to add click handlers to movie cards
function addMovieClickHandlers() {
    document.querySelectorAll('.movie-link').forEach(card => {
        if (!card.hasClickHandler) {
            card.hasClickHandler = true;
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.watchlist-btn')) {
                    const movieId = card.dataset.movieId;
                    showMovieDetails(movieId);
                }
            });
        }
    });
}

// Function to update watchlist buttons
function updateWatchlistButtons() {
    const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    document.querySelectorAll('.watchlist-btn').forEach(button => {
        const movieId = button.dataset.movieId;
        const isAdded = watchlist.includes(movieId);
        button.dataset.added = isAdded;
        button.textContent = isAdded ? '✓ Added to watchlist' : '+ Add to watchlist';
    });
}

// Function to handle watchlist button clicks
function handleWatchlistClick(button) {
    const movieId = button.dataset.movieId;
    const isAdded = button.dataset.added === 'true';
    
    // Toggle watchlist state
    button.dataset.added = !isAdded;
    button.textContent = isAdded ? '+ Add to watchlist' : '✓ Added to watchlist';
    button.classList.toggle('added');
    
    // Update watchlist in localStorage
    let watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    if (!isAdded) {
        watchlist.push(movieId);
    } else {
        watchlist = watchlist.filter(id => id !== movieId);
    }
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
} 