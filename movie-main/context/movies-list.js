const API_KEY = '72b544388cd4251b3736f3600c5dccc0';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Get category from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const category = urlParams.get('category') || 'popular';

// Update page title
const categoryTitle = document.getElementById('category-title');
categoryTitle.textContent = category.replace(/-/g, ' ');

// Function to fetch movies based on category
async function fetchMovies() {
    const moviesGrid = document.getElementById('movies-grid');
    try {
        let endpoint = '';
        switch(category) {
            case 'recommended':
                endpoint = '/discover/movie?sort_by=vote_average.desc&vote_count.gte=1000';
                break;
            case 'trending':
                endpoint = '/trending/movie/week';
                break;
            case 'upcoming':
                endpoint = '/movie/upcoming';
                break;
            case 'top-rated':
                endpoint = '/movie/top_rated';
                break;
            case 'popular':
                endpoint = '/movie/popular';
                break;
            case 'new-releases':
                endpoint = '/movie/now_playing';
                break;
            default:
                endpoint = '/movie/popular';
        }

        const response = await fetch(`${BASE_URL}${endpoint}?api_key=${API_KEY}&language=en-US&page=1`);
        const data = await response.json();
        
        // Clear loading message
        moviesGrid.innerHTML = '';
        
        // Create card container
        const cardContainer = document.createElement('div');
        cardContainer.className = 'card-container';
        moviesGrid.appendChild(cardContainer);
        
        // Display movies
        data.results.forEach(movie => {
            const movieCard = document.createElement('div');
            movieCard.className = 'card';
            
            const posterPath = movie.poster_path 
                ? `${IMAGE_BASE_URL}/w342${movie.poster_path}`
                : 'https://via.placeholder.com/342x513/1e293b/ffffff?text=No+Image';

            movieCard.innerHTML = `
                <img src="${posterPath}" alt="${movie.title}" class="movie-poster">
                <div class="movie-card-overlay">
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
            `;

            // Add click handler to navigate to movie details
            movieCard.addEventListener('click', () => {
                window.location.href = `movie-details.html?id=${movie.id}`;
            });

            cardContainer.appendChild(movieCard);
        });

    } catch (error) {
        console.error('Error fetching movies:', error);
        moviesGrid.innerHTML = '<div class="loading">Error loading movies. Please try again later.</div>';
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', fetchMovies); 