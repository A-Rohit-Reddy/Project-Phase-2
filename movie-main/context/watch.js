const API_KEY = '72b544388cd4251b3736f3600c5dccc0';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Get series ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const seriesId = urlParams.get('id');

// Log the series ID for debugging
console.log('Series ID from URL:', seriesId);

if (!seriesId) {
    console.error('No series ID provided in URL');
    // Show error message to user
    document.body.innerHTML = `
        <div style="text-align: center; padding: 50px; color: white;">
            <h1>Error</h1>
            <p>No series ID provided. Please go back and try again.</p>
            <a href="javascript:history.back()" style="color: #1f80e0; text-decoration: none;">
                &larr; Go Back
            </a>
        </div>
    `;
}

// Function to format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Function to show error message
function showError(message) {
    document.body.innerHTML = `
        <div style="text-align: center; padding: 50px; color: white;">
            <h1>Error</h1>
            <p>${message}</p>
            <a href="javascript:history.back()" style="color: #1f80e0; text-decoration: none;">
                &larr; Go Back
            </a>
        </div>
    `;
}

// Function to fetch and display series details
async function fetchSeriesDetails() {
    try {
        console.log('Fetching series details for ID:', seriesId);
        const response = await fetch(${BASE_URL}/tv/${seriesId}?api_key=${API_KEY}&language=en-US);
        
        if (!response.ok) {
            throw new Error(HTTP error! status: ${response.status});
        }
        
        const series = await response.json();
        console.log('Received series data:', series);

        if (series.success === false) {
            throw new Error(series.status_message || 'Failed to fetch series details');
        }

        // Update backdrop
        const backdropPath = series.backdrop_path 
            ? ${IMAGE_BASE_URL}/original${series.backdrop_path}
            : 'https://via.placeholder.com/1920x1080?text=No+Backdrop';
        document.getElementById('backdrop').src = backdropPath;

        // Update poster
        const posterPath = series.poster_path 
            ? ${IMAGE_BASE_URL}/w500${series.poster_path}
            : 'https://via.placeholder.com/500x750?text=No+Poster';
        document.getElementById('poster').src = posterPath;

        // Update basic info
        document.getElementById('title').textContent = series.name;
        document.getElementById('release-date').textContent = formatDate(series.first_air_date);
        document.getElementById('seasons').textContent = ${series.number_of_seasons} Season${series.number_of_seasons !== 1 ? 's' : ''};
        document.getElementById('status').textContent = series.status;
        document.getElementById('rating').textContent = series.vote_average.toFixed(1);
        document.getElementById('vote-count').textContent = series.vote_count.toLocaleString();
        document.getElementById('overview').textContent = series.overview;

        // Update genres
        const genresContainer = document.getElementById('genres');
        genresContainer.innerHTML = series.genres
            .map(genre => <span class="genre">${genre.name}</span>)
            .join('');

        // Update additional info
        document.getElementById('first-air-date').textContent = formatDate(series.first_air_date);
        document.getElementById('last-air-date').textContent = formatDate(series.last_air_date);
        document.getElementById('network').textContent = series.networks?.[0]?.name || 'N/A';
        document.getElementById('episodes').textContent = ${series.number_of_episodes} Episode${series.number_of_episodes !== 1 ? 's' : ''};

        // Update page title
        document.title = ${series.name} - Disney+ Clone;

    } catch (error) {
        console.error('Error fetching series details:', error);
        showError('Failed to load series details. Please try again later.');
    }
}

// Initialize page
if (seriesId) {
    document.addEventListener('DOMContentLoaded', fetchSeriesDetails);
}