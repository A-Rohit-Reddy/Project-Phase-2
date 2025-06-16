const API_KEY = '2e7b1176bc4b1f712fa0e0338c879c6e';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// API endpoints
const ENDPOINTS = {
    trending: `${BASE_URL}/trending/movie/week`,
    recommended: `${BASE_URL}/movie/popular`,
    search: `${BASE_URL}/search/movie`,
    movieDetails: (movieId) => `${BASE_URL}/movie/${movieId}`,
};

// Function to construct API URLs with API key
function getApiUrl(endpoint, additionalParams = '') {
    const separator = endpoint.includes('?') ? '&' : '?';
    return `${endpoint}${separator}api_key=${API_KEY}${additionalParams}`;
}

// Function to get full image URL
function getImageUrl(path) {
    if (!path) return 'images/no-poster.jpg';
    return `${IMAGE_BASE_URL}${path}`;
}

// Export the functions and constants
export {
    API_KEY,
    BASE_URL,
    IMAGE_BASE_URL,
    ENDPOINTS,
    getApiUrl,
    getImageUrl
}; 