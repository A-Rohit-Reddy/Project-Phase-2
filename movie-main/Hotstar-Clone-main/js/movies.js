// TMDB API configuration
const API_KEY = '72b544388cd4251b3736f3600c5dccc0'; // TMDB API key
const API_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Function to add a movie to watchlist
function addToWatchlist(movieData) {
    try {
        if (!API_KEY) {
            alert('Please add your TMDB API key in movies.js first!');
            return;
        }

        // Parse the movie data if it's a string
        const movie = typeof movieData === 'string' ? JSON.parse(movieData) : movieData;

        const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
        
        // Check if movie is already in watchlist
        if (!watchlist.some(m => m.id === movie.id)) {
            // Make sure we have all required data
            const movieToSave = {
                id: movie.id,
                title: movie.title,
                overview: movie.overview || '',
                poster_path: movie.poster_path,
                release_date: movie.release_date,
                vote_average: movie.vote_average
            };

            watchlist.push(movieToSave);
            localStorage.setItem('watchlist', JSON.stringify(watchlist));
            
            // Update button state
            const btn = document.querySelector(`[data-movie-id="${movie.id}"]`);
            if (btn) {
                btn.textContent = 'Added to Watchlist';
                btn.dataset.added = 'true';
            }

            console.log('Added movie to watchlist:', movieToSave);
            showToast('Movie added to watchlist!');
        } else {
            showToast('This movie is already in your watchlist!');
        }
    } catch (error) {
        console.error('Error adding movie to watchlist:', error);
        showToast('Error adding movie to watchlist');
    }
}

// Function to show toast notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

// Function to create movie card
function createMovieCard(movie) {
    if (!movie) return '';

    const posterPath = movie.poster_path 
        ? `${IMAGE_BASE_URL}${movie.poster_path}`
        : 'images/no-poster.png';

    return `
        <div class="movie-card" data-id="${movie.id}">
            <img src="${posterPath}" alt="${movie.title}" class="movie-poster" 
                onerror="this.src='images/no-poster.png'">
            <div class="movie-info">
                <h3 class="movie-title">${movie.title}</h3>
                <p class="movie-description">${movie.overview.slice(0, 100)}${movie.overview.length > 100 ? '...' : ''}</p>
                <button class="watchlist-btn" onclick="toggleWatchlist(${movie.id}, '${movie.title.replace(/'/g, "\\'")}')">
                    Add to Watchlist
                </button>
            </div>
        </div>
    `;
}

// Fetch movies from TMDB API
async function fetchMovies(category) {
    try {
        const response = await fetch(`${API_BASE_URL}/movie/${category}?api_key=${API_KEY}&language=en-US&page=1`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.status_message || 'Failed to fetch movies');
        }

        return data.results;
    } catch (error) {
        console.error('Error fetching movies:', error);
        return [];
    }
}

// Toggle movie in watchlist
function toggleWatchlist(movieId, movieTitle) {
    const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    const index = watchlist.findIndex(item => item.id === movieId);
    const button = document.querySelector(`[data-id="${movieId}"] .watchlist-btn`);

    if (index === -1) {
        // Add to watchlist
        watchlist.push({
            id: movieId,
            title: movieTitle,
            type: 'movie'
        });
        button.textContent = 'Remove from Watchlist';
        button.dataset.added = 'true';
        showToast(`${movieTitle} added to watchlist`);
    } else {
        // Remove from watchlist
        watchlist.splice(index, 1);
        button.textContent = 'Add to Watchlist';
        button.dataset.added = 'false';
        showToast(`${movieTitle} removed from watchlist`);
    }

    localStorage.setItem('watchlist', JSON.stringify(watchlist));
}

// Search functionality
const searchInput = document.getElementById('searchInput');
const suggestionsList = document.getElementById('suggestions');

searchInput.addEventListener('input', debounce(handleSearch, 500));

async function handleSearch() {
    const query = searchInput.value.trim();
    
    if (query.length < 2) {
        suggestionsList.innerHTML = '';
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1`
        );
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.status_message || 'Search failed');
        }

        displaySearchResults(data.results.slice(0, 5));
    } catch (error) {
        console.error('Search error:', error);
        suggestionsList.innerHTML = '<li class="suggestion-item">Search failed. Please try again.</li>';
    }
}

function displaySearchResults(results) {
    if (results.length === 0) {
        suggestionsList.innerHTML = '<li class="suggestion-item">No results found</li>';
        return;
    }

    suggestionsList.innerHTML = results
        .map(movie => `
            <li class="suggestion-item" onclick="handleMovieSelect(${movie.id})">
                <img src="${movie.poster_path ? IMAGE_BASE_URL + movie.poster_path : 'images/no-poster.png'}" 
                    alt="${movie.title}" class="suggestion-poster">
                <div class="suggestion-info">
                    <h4>${movie.title}</h4>
                    <p>${movie.release_date?.split('-')[0] || 'N/A'}</p>
                </div>
            </li>
        `)
        .join('');
}

function handleMovieSelect(movieId) {
    // Clear search
    searchInput.value = '';
    suggestionsList.innerHTML = '';
    
    // You can implement movie details view here
    console.log('Selected movie:', movieId);
}

// Debounce function to limit API calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Update watchlist buttons on page load
document.addEventListener('DOMContentLoaded', () => {
    const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    
    watchlist.forEach(item => {
        if (item.type === 'movie') {
            const button = document.querySelector(`[data-id="${item.id}"] .watchlist-btn`);
            if (button) {
                button.textContent = 'Remove from Watchlist';
                button.dataset.added = 'true';
            }
        }
    });
});

// Load movies when page loads
document.addEventListener('DOMContentLoaded', async () => {
    if (!API_KEY) {
        document.body.innerHTML = `
            <div style="text-align: center; padding: 50px; color: red;">
                <h1>⚠️ API Key Missing!</h1>
                <p>Please add your TMDB API key in movies.js to load movies.</p>
                <p>You can get an API key from: <a href="https://www.themoviedb.org/settings/api" target="_blank">TMDB API Settings</a></p>
            </div>
        `;
        return;
    }

    // Load popular movies
    const popularMovies = await fetchMovies('popular');
    const popularContainer = document.getElementById('popular-movies');
    if (popularContainer) {
        if (popularMovies.length === 0) {
            popularContainer.innerHTML = '<p style="color: white; text-align: center;">No movies available. Please check your API key.</p>';
        } else {
            popularContainer.innerHTML = popularMovies
                .map(movie => createMovieCard(movie))
                .filter(card => card) // Remove empty cards
                .join('');
        }
    }

    // Load new releases (upcoming)
    const newReleases = await fetchMovies('upcoming');
    const newReleasesContainer = document.getElementById('new-releases');
    if (newReleasesContainer) {
        newReleasesContainer.innerHTML = newReleases
            .map(movie => createMovieCard(movie))
            .join('');
    }

    // Load top rated movies
    const topRated = await fetchMovies('top_rated');
    const topRatedContainer = document.getElementById('top-rated');
    if (topRatedContainer) {
        topRatedContainer.innerHTML = topRated
            .map(movie => createMovieCard(movie))
            .join('');
    }
}); 