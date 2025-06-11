const API_KEY = '72b544388cd4251b3736f3600c5dccc0';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
const DEFAULT_PLACEHOLDER = 'https://via.placeholder.com/500x750/1e293b/ffffff?text=No+Image';

// Get movie ID from URL parameters or use default
function getMovieId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id') || '574475'; // Default movie ID if none provided
}

// Error handling function
function showError(message) {
    console.error(message);
    alert('Error loading movie data. Please check your API key and try again.');
}

// Initialize page
async function initializePage() {
    try {
        // Clear existing content
        document.getElementById('movie-poster').src = '';
        document.getElementById('movie-title').textContent = 'Loading...';
        document.getElementById('rating').textContent = '0.0';
        document.getElementById('release-year').textContent = '';
        document.getElementById('runtime').textContent = '';
        document.getElementById('genres').textContent = '';
        document.getElementById('overview').textContent = 'Loading...';
        document.getElementById('additional-info').innerHTML = '';
        document.getElementById('cast-list').innerHTML = '<div class="loading">Loading cast...</div>';
        document.getElementById('crew-list').innerHTML = '<div class="loading">Loading crew...</div>';
        document.getElementById('similar-movies').innerHTML = '<div class="loading">Loading similar movies...</div>';

        // Get current movie ID
        const currentMovieId = getMovieId();
        
        // Load all data
        await Promise.all([
            fetchMovieDetails(currentMovieId),
            fetchCredits(currentMovieId),
            fetchSimilarMovies(currentMovieId),
            fetchVideos(currentMovieId)
        ]);
    } catch (error) {
        console.error('Error initializing page:', error);
        showError('Error loading page data: ' + error.message);
    }
}

// Fetch movie details
async function fetchMovieDetails(movieId) {
    try {
        const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&append_to_response=keywords,release_dates`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const movie = await response.json();
        
        // Update page title with movie name
        document.title = `${movie.title} - Movie Details`;
        
        // Update movie poster with proper error handling
        const posterImg = document.getElementById('movie-poster');
        if (movie.poster_path) {
            posterImg.src = `${IMAGE_BASE_URL}/w500${movie.poster_path}`;
        } else {
            posterImg.src = DEFAULT_PLACEHOLDER;
        }
        posterImg.onerror = function() {
            this.src = DEFAULT_PLACEHOLDER;
        };

        // Update movie details
        document.getElementById('movie-title').textContent = movie.title;
        document.getElementById('rating').textContent = movie.vote_average.toFixed(1);
        document.getElementById('release-year').textContent = new Date(movie.release_date).getFullYear();
        document.getElementById('runtime').textContent = `${Math.floor(movie.runtime/60)}h ${movie.runtime%60}m`;
        document.getElementById('genres').textContent = movie.genres.map(genre => genre.name).join(', ');
        document.getElementById('overview').textContent = movie.overview;

        // Update backdrop
        const heroBackdrop = document.querySelector('.hero-backdrop');
        if (movie.backdrop_path) {
            heroBackdrop.style.backgroundImage = `url(${IMAGE_BASE_URL}/original${movie.backdrop_path})`;
        } else {
            heroBackdrop.style.backgroundColor = '#13111C';
        }

        // Update additional info
        updateAdditionalInfo(movie);

    } catch (error) {
        console.error('Error fetching movie details:', error);
        showError('Error fetching movie details: ' + error.message);
    }
}

// Update additional movie information
function updateAdditionalInfo(movie) {
    const additionalInfo = document.getElementById('additional-info');
    const keywordsList = movie.keywords?.keywords?.map(keyword => 
        `<span class="keyword">${keyword.name}</span>`
    ).join('') || 'N/A';

    additionalInfo.innerHTML = `
        <div class="info-grid">
            <div class="info-item">
                <h4>Status</h4>
                <p>${movie.status}</p>
            </div>
            <div class="info-item">
                <h4>Budget</h4>
                <p>${movie.budget ? '$' + movie.budget.toLocaleString() : 'N/A'}</p>
            </div>
            <div class="info-item">
                <h4>Revenue</h4>
                <p>${movie.revenue ? '$' + movie.revenue.toLocaleString() : 'N/A'}</p>
            </div>
            <div class="info-item">
                <h4>Original Language</h4>
                <p>${movie.original_language?.toUpperCase() || 'N/A'}</p>
            </div>
            <div class="info-item">
                <h4>Production Companies</h4>
                <p>${movie.production_companies?.map(company => company.name).join(', ') || 'N/A'}</p>
            </div>
            <div class="info-item">
                <h4>Keywords</h4>
                <div class="keywords-list">
                    ${keywordsList}
                </div>
            </div>
        </div>
    `;
}

// Fetch cast and crew
async function fetchCredits(movieId) {
    try {
        const response = await fetch(`${BASE_URL}/movie/${movieId}/credits?api_key=${API_KEY}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const credits = await response.json();
        
        // Display cast
        const castList = document.getElementById('cast-list');
        castList.innerHTML = '';
        
        if (!credits.cast || credits.cast.length === 0) {
            castList.innerHTML = '<p class="no-data">No cast information available</p>';
            return;
        }

        // Filter out cast members without profile images
        const castWithImages = credits.cast.filter(person => person.profile_path);

        if (castWithImages.length === 0) {
            castList.innerHTML = '<p class="no-data">No cast images available</p>';
            return;
        }

        castWithImages.slice(0, 10).forEach(person => {
            const castMember = document.createElement('div');
            castMember.className = 'cast-member';
            
            const imageUrl = `${IMAGE_BASE_URL}/w185${person.profile_path}`;

            castMember.innerHTML = `
                <div class="cast-image-container">
                    <img 
                        src="${imageUrl}"
                        alt="${person.name}"
                        loading="lazy"
                    >
                </div>
                <h3>${person.name}</h3>
                <p>${person.character}</p>
            `;
            castList.appendChild(castMember);

            // Verify image loading
            const img = castMember.querySelector('img');
            img.addEventListener('load', () => {
                img.classList.add('loaded');
                castMember.classList.add('loaded');
            });
        });

        // Display crew
        const crewList = document.getElementById('crew-list');
        crewList.innerHTML = '';
        
        const keyCrewRoles = ['Director', 'Producer', 'Screenplay', 'Writer'];
        const keyCrew = credits.crew
            .filter(person => 
                keyCrewRoles.includes(person.job) && person.profile_path
            )
            .slice(0, 8);
        
        if (!keyCrew || keyCrew.length === 0) {
            crewList.innerHTML = '<p class="no-data">No crew information available</p>';
            return;
        }

        keyCrew.forEach(person => {
            const crewMember = document.createElement('div');
            crewMember.className = 'crew-member';
            
            const imageUrl = `${IMAGE_BASE_URL}/w185${person.profile_path}`;

            crewMember.innerHTML = `
                <div class="crew-image-container">
                    <img 
                        src="${imageUrl}"
                        alt="${person.name}"
                        class="crew-image"
                        loading="lazy"
                    >
                </div>
                <h3>${person.name}</h3>
                <p>${person.job}</p>
            `;
            crewList.appendChild(crewMember);

            // Verify image loading
            const img = crewMember.querySelector('img');
            img.addEventListener('load', () => {
                img.classList.add('loaded');
                crewMember.classList.add('loaded');
            });
        });

    } catch (error) {
        console.error('Error fetching credits:', error);
        document.getElementById('cast-list').innerHTML = '<p class="error-message">Error loading cast</p>';
        document.getElementById('crew-list').innerHTML = '<p class="error-message">Error loading crew</p>';
    }
}

// Fetch similar movies
async function fetchSimilarMovies(movieId) {
    try {
        const response = await fetch(`${BASE_URL}/movie/${movieId}/similar?api_key=${API_KEY}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        const similarMoviesContainer = document.getElementById('similar-movies');
        similarMoviesContainer.innerHTML = '';

        if (!data.results || data.results.length === 0) {
            similarMoviesContainer.innerHTML = '<p class="no-data">No similar movies found</p>';
            return;
        }

        // Filter out movies without posters
        const moviesWithPosters = data.results.filter(movie => movie.poster_path);

        if (moviesWithPosters.length === 0) {
            similarMoviesContainer.innerHTML = '<p class="no-data">No movie posters available</p>';
            return;
        }

        moviesWithPosters.slice(0, 10).forEach((movie, index) => {
            const movieCard = document.createElement('div');
            movieCard.className = 'movie-card';
            
            const imageUrl = `${IMAGE_BASE_URL}/w342${movie.poster_path}`;
            const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
            const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

            movieCard.innerHTML = `
                <div class="movie-poster-container">
                    <img 
                        src="${imageUrl}"
                        alt="${movie.title}"
                        class="movie-poster"
                        loading="lazy"
                    >
                    <div class="movie-card-overlay">
                        <div class="movie-card-info">
                            <h3>${movie.title}</h3>
                            <div class="movie-meta-info">
                                <span class="year">${releaseYear}</span>
                                <div class="rating">
                                    <i class="fas fa-star"></i>
                                    <span>${rating}</span>
                                </div>
                            </div>
                            <p class="overview">${movie.overview.slice(0, 100)}${movie.overview.length > 100 ? '...' : ''}</p>
                        </div>
                    </div>
                </div>
            `;
            
            // Add hover effect class after a delay
            setTimeout(() => {
                movieCard.classList.add('show');
            }, index * 100);

            // Update click handler to use navigation function
            movieCard.addEventListener('click', () => {
                navigateToMovie(movie.id);
            });

            // Handle image loading
            const img = movieCard.querySelector('img');
            img.addEventListener('load', () => {
                img.classList.add('loaded');
                movieCard.classList.add('loaded');
            });

            similarMoviesContainer.appendChild(movieCard);
        });
    } catch (error) {
        console.error('Error fetching similar movies:', error);
        document.getElementById('similar-movies').innerHTML = 
            '<p class="error-message">Error loading similar movies</p>';
    }
}

// Fetch videos (trailers)
async function fetchVideos(movieId) {
    try {
        const response = await fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Find official trailer
        const trailer = data.results.find(video => 
            video.type === "Trailer" && video.site === "YouTube") || data.results[0];

        const trailerBtn = document.getElementById('trailer-btn');
        if (trailer) {
            // Add click event to trailer button
            trailerBtn.addEventListener('click', () => {
                const modal = document.getElementById('trailer-modal');
                const trailerContainer = document.getElementById('trailer-container');
                trailerContainer.innerHTML = `
                    <iframe width="100%" height="500px" 
                        src="https://www.youtube.com/embed/${trailer.key}?autoplay=1" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                `;
                modal.style.display = 'block';
            });
        } else {
            trailerBtn.style.display = 'none';
        }
    } catch (error) {
        console.error('Error fetching videos:', error);
        document.getElementById('trailer-btn').style.display = 'none';
    }
}

// Navigation function
function navigateToMovie(movieId) {
    // Update URL without reloading the page
    const newUrl = `${window.location.pathname}?id=${movieId}`;
    window.history.pushState({ movieId }, '', newUrl);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Reload movie data
    initializePage();
}

// Handle browser back/forward buttons
window.onpopstate = function(event) {
    initializePage();
};

// Initialize modal functionality
const modal = document.getElementById('trailer-modal');
const closeBtn = document.querySelector('.close-modal');

closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    document.getElementById('trailer-container').innerHTML = '';
});

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
        document.getElementById('trailer-container').innerHTML = '';
    }
});

// Search functionality
const searchInput = document.getElementById('searchInput');
const suggestionsList = document.getElementById('suggestions');
const imageBase = 'https://image.tmdb.org/t/p/w92';

let searchTimeout;

function renderSuggestions(movies) {
    suggestionsList.innerHTML = '';
    
    if (movies.length === 0) {
        suggestionsList.innerHTML = '<li class="no-results">No movies found</li>';
        return;
    }
    
    movies.forEach(movie => {
        const li = document.createElement('li');
        const posterPath = movie.poster_path 
            ? `${imageBase}${movie.poster_path}`
            : 'https://via.placeholder.com/92x138/1e293b/ffffff?text=No+Image';
        
        li.innerHTML = `
            <div class="suggestion-item">
                <img src="${posterPath}" alt="${movie.title}" class="suggestion-poster" onerror="this.src='https://via.placeholder.com/92x138/1e293b/ffffff?text=No+Image'">
                <div class="suggestion-info">
                    <h4>${movie.title}</h4>
                    <div class="suggestion-meta">
                        <span>${movie.release_date?.slice(0, 4) || 'N/A'}</span>
                        ${movie.vote_average ? `
                            <span class="rating">
                                <i class="fas fa-star"></i>
                                ${movie.vote_average.toFixed(1)}
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        // Navigate to movie details page when clicked
        li.addEventListener('click', () => {
            window.location.href = `movie-details.html?id=${movie.id}`;
        });

        suggestionsList.appendChild(li);
    });
}

searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    
    // Clear previous timeout
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }

    // Hide suggestions if query is too short
    if (query.length < 2) {
        suggestionsList.style.display = 'none';
        return;
    }

    // Add debounce to prevent too many API calls
    searchTimeout = setTimeout(async () => {
        try {
            const response = await fetch(
                `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`
            );
            const data = await response.json();
            
            // Get top 8 results
            const movies = data.results.slice(0, 8);
            renderSuggestions(movies);
            suggestionsList.style.display = movies.length ? 'block' : 'none';
        } catch (error) {
            console.error('Search error:', error);
            suggestionsList.style.display = 'none';
        }
    }, 300);
});

// Close suggestions when clicking outside
document.addEventListener('click', (event) => {
    if (!event.target.closest('.search-container')) {
        suggestionsList.style.display = 'none';
    }
});

// Watchlist functionality
const watchlistBtns = document.querySelectorAll('.watchlist-btn');
watchlistBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        if (this.getAttribute('data-added') === 'false') {
            this.innerHTML = '<i class="fas fa-check"></i>';
            this.classList.add('added');
            this.setAttribute('data-added', 'true');
        } else {
            this.innerHTML = '<i class="fas fa-plus"></i>';
            this.classList.remove('added');
            this.setAttribute('data-added', 'false');
        }
    });
});

// Initialize page on load
document.addEventListener('DOMContentLoaded', () => {
    initializePage();
}); 