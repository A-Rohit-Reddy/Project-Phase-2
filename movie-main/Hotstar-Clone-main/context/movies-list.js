// Constants
const TMDB_API_KEY = '72b544388cd4251b3736f3600c5dccc0';
const TMDB_API_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// Get the category from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const category = urlParams.get('category') || 'popular';

// Update the page title based on category
const categoryTitle = document.getElementById('category-title');
const titles = {
    'popular': 'Popular Movies',
    'upcoming': 'Upcoming Movies',
    'top_rated': 'Top Rated Movies',
    'trending': 'Trending Now',
    'recommended': 'Recommended For You'
};
categoryTitle.textContent = titles[category] || 'Movies';

// Initialize page number and loading state
let currentPage = 1;
let isLoading = false;
let hasMoreMovies = true;

// Function to fetch movies from TMDB API
async function fetchMovies(page = 1) {
    try {
        let endpoint;
        switch (category) {
            case 'trending':
                endpoint = `${TMDB_API_BASE}/trending/movie/week?api_key=${TMDB_API_KEY}&page=${page}`;
                break;
            case 'upcoming':
                endpoint = `${TMDB_API_BASE}/movie/upcoming?api_key=${TMDB_API_KEY}&page=${page}&region=IN`; // Added region=IN for Indian releases
                break;
            case 'top_rated':
                endpoint = `${TMDB_API_BASE}/movie/top_rated?api_key=${TMDB_API_KEY}&page=${page}`;
                break;
            case 'recommended':
                // For recommended, we'll use a mix of popular and top-rated movies
                const popularEndpoint = `${TMDB_API_BASE}/movie/popular?api_key=${TMDB_API_KEY}&page=${page}`;
                const topRatedEndpoint = `${TMDB_API_BASE}/movie/top_rated?api_key=${TMDB_API_KEY}&page=${page}`;
                
                const [popularRes, topRatedRes] = await Promise.all([
                    fetch(popularEndpoint),
                    fetch(topRatedEndpoint)
                ]);
                
                const [popularData, topRatedData] = await Promise.all([
                    popularRes.json(),
                    topRatedRes.json()
                ]);
                
                // Mix and shuffle the results
                const mixedResults = [...popularData.results, ...topRatedData.results]
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 20); // Keep only 20 movies
                
                return {
                    results: mixedResults,
                    page: page,
                    total_pages: Math.min(popularData.total_pages, topRatedData.total_pages)
                };
            case 'popular':
            default:
                endpoint = `${TMDB_API_BASE}/movie/popular?api_key=${TMDB_API_KEY}&page=${page}`;
        }

        if (category !== 'recommended') {
            const response = await fetch(endpoint);
            if (!response.ok) throw new Error('Failed to fetch movies');
            return await response.json();
        }
    } catch (error) {
        console.error('Error fetching movies:', error);
        showError('Failed to load movies. Please try again later.');
        return null;
    }
}

// Function to create movie card HTML
function createMovieCard(movie) {
    const overview = movie.overview || 'No description available.';
    return `
        <div class="card">
            <div class="movie-link" data-movie-id="${movie.id}">
                <img src="${movie.poster_path ? TMDB_IMAGE_BASE + movie.poster_path : 'images/placeholder.png'}" 
                     alt="${movie.title}" 
                     class="card-img">
                <div class="card-body">
                    <h2 class="name">${movie.title}</h2>
                    <h6 class="des">${overview.slice(0, 150)}${overview.length > 150 ? '...' : ''}</h6>
                    <button class="watchlist-btn" data-added="false">
                        + Add to watchlist
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Function to show error message
function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Function to load more movies
async function loadMoreMovies() {
    if (isLoading || !hasMoreMovies) return;

    isLoading = true;
    const moviesGrid = document.getElementById('movies-grid');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.textContent = 'Loading more movies...';
    moviesGrid.appendChild(loadingDiv);

    try {
        const data = await fetchMovies(currentPage);
        if (!data || !data.results || data.results.length === 0) {
            hasMoreMovies = false;
            loadingDiv.remove();
            return;
        }

        // Remove loading message
        loadingDiv.remove();

        // Add new movies to the grid
        data.results.forEach(movie => {
            moviesGrid.insertAdjacentHTML('beforeend', createMovieCard(movie));
        });

        // Update page number
        currentPage++;

        // Check if we've reached the last page
        if (currentPage > data.total_pages) {
            hasMoreMovies = false;
        }

        // Add click handlers to new cards
        addMovieClickHandlers();
        updateWatchlistButtons();
    } catch (error) {
        console.error('Error loading more movies:', error);
        loadingDiv.remove();
        showError('Failed to load more movies. Please try again.');
    } finally {
        isLoading = false;
    }
}

// Function to handle movie card clicks
async function handleMovieClick(event) {
    // Don't handle click if it's on the watchlist button
    if (event.target.closest('.watchlist-btn')) {
        return;
    }

    event.preventDefault();
    const movieLink = event.currentTarget;
    const movieId = movieLink.getAttribute('data-movie-id');
    
    if (!movieId) {
        console.error('No movie ID found');
        showError('Error: Movie ID not found');
        return;
    }

    try {
        // First verify that the movie exists
        const response = await fetch(
            `${TMDB_API_BASE}/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos`
        );
        if (!response.ok) throw new Error('Movie not found');
        
        const movieData = await response.json();
        
        // Store the movie data in localStorage
        localStorage.setItem('currentMovie', JSON.stringify(movieData));

        // Navigate to movie details page
        window.location.href = `./movie-details.html?id=${movieId}`;
    } catch (error) {
        console.error('Error:', error);
        showError('Movie not found. Please try another movie.');
    }
}

// Function to add click handlers to movie cards
function addMovieClickHandlers() {
    document.querySelectorAll('.movie-link').forEach(link => {
        // Remove any existing click listeners
        const newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);
        
        // Add the click listener
        newLink.addEventListener('click', handleMovieClick);
    });
}

// Initialize watchlist from localStorage
let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];

// Function to update watchlist buttons state
function updateWatchlistButtons() {
    document.querySelectorAll('.watchlist-btn').forEach(button => {
        const card = button.closest('.card');
        const movieData = {
            id: card.querySelector('.movie-link').getAttribute('data-movie-id'),
            title: card.querySelector('.name').textContent,
            description: card.querySelector('.des').textContent,
            image: card.querySelector('.card-img').src
        };
        
        const isInWatchlist = watchlist.some(item => item.id === movieData.id);
        button.textContent = isInWatchlist ? '✓ Added to watchlist' : '+ Add to watchlist';
        button.dataset.added = isInWatchlist.toString();

        // Remove any existing click listeners
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);

        // Add click handler for watchlist button
        newButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (!isInWatchlist) {
                watchlist.push(movieData);
                newButton.textContent = '✓ Added to watchlist';
                newButton.dataset.added = 'true';
                showError('Added to watchlist');
            } else {
                watchlist = watchlist.filter(item => item.id !== movieData.id);
                newButton.textContent = '+ Add to watchlist';
                newButton.dataset.added = 'false';
                showError('Removed from watchlist');
            }
            
            localStorage.setItem('watchlist', JSON.stringify(watchlist));
        });
    });
}

// Initial load of movies
loadMoreMovies();

// Add infinite scroll
window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1000) {
        loadMoreMovies();
    }
});
