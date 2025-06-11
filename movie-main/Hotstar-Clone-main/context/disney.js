// TMDB API configuration
const API_KEY = 'YOUR_TMDB_API_KEY';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Disney company ID in TMDB
const DISNEY_COMPANY_ID = 2;

// Function to fetch movies by Disney
async function fetchDisneyMovies(type, containerId) {
  try {
    let url;
    switch(type) {
      case 'animated':
        // Fetch animated Disney movies
        url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_companies=${DISNEY_COMPANY_ID}&with_genres=16&sort_by=popularity.desc`;
        break;
      case 'live-action':
        // Fetch live action Disney movies
        url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_companies=${DISNEY_COMPANY_ID}&without_genres=16&sort_by=popularity.desc`;
        break;
      case 'channel':
        // Fetch Disney Channel movies
        url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_companies=${DISNEY_COMPANY_ID}&with_keywords=179377&sort_by=popularity.desc`; // Disney Channel keyword
        break;
      default:
        url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_companies=${DISNEY_COMPANY_ID}&sort_by=popularity.desc`;
    }

    const response = await fetch(url);
    const data = await response.json();
    displayMovies(data.results, containerId);
  } catch (error) {
    console.error('Error fetching Disney movies:', error);
  }
}

// Function to display movies in the container
function displayMovies(movies, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  movies.forEach(movie => {
    const card = document.createElement('div');
    card.className = 'movie-card';
    
    const posterPath = movie.poster_path ? 
      `${IMAGE_BASE_URL}${movie.poster_path}` : 
      'images/no-poster.png';

    card.innerHTML = `
      <img src="${posterPath}" alt="${movie.title}">
      <div class="movie-info">
        <h3 class="movie-title">${movie.title}</h3>
        <p class="movie-description">${movie.overview.slice(0, 100)}...</p>
        <button class="watchlist-btn" data-movie-id="${movie.id}" data-added="false">
          + Add to watchlist
        </button>
      </div>
    `;

    // Add watchlist functionality
    const watchlistBtn = card.querySelector('.watchlist-btn');
    watchlistBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const movieId = watchlistBtn.dataset.movieId;
      const isAdded = watchlistBtn.dataset.added === 'true';
      
      if (!isAdded) {
        addToWatchlist({
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          overview: movie.overview
        });
        watchlistBtn.dataset.added = 'true';
        watchlistBtn.textContent = '✓ Added to watchlist';
      } else {
        removeFromWatchlist(movie.id);
        watchlistBtn.dataset.added = 'false';
        watchlistBtn.textContent = '+ Add to watchlist';
      }
    });

    // Check if movie is in watchlist
    if (isInWatchlist(movie.id)) {
      watchlistBtn.dataset.added = 'true';
      watchlistBtn.textContent = '✓ Added to watchlist';
    }

    container.appendChild(card);
  });
}

// Initialize page content
document.addEventListener('DOMContentLoaded', () => {
  fetchDisneyMovies('animated', 'disney-classics');
  fetchDisneyMovies('live-action', 'disney-live-action');
  fetchDisneyMovies('channel', 'disney-channel');

  // Search functionality
  const searchInput = document.getElementById('searchInput');
  const suggestionsList = document.getElementById('suggestions');
  let searchTimeout;

  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value;

    if (query.length < 2) {
      suggestionsList.innerHTML = '';
      return;
    }

    searchTimeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}&with_companies=${DISNEY_COMPANY_ID}`
        );
        const data = await response.json();
        displaySearchResults(data.results.slice(0, 5));
      } catch (error) {
        console.error('Error searching movies:', error);
      }
    }, 500);
  });

  function displaySearchResults(results) {
    suggestionsList.innerHTML = '';
    results.forEach(movie => {
      const li = document.createElement('li');
      li.className = 'suggestion-item';
      const posterPath = movie.poster_path ? 
        `${IMAGE_BASE_URL}${movie.poster_path}` : 
        'images/no-poster.png';
      
      li.innerHTML = `
        <img src="${posterPath}" alt="${movie.title}" class="suggestion-poster">
        <div class="suggestion-info">
          <h4>${movie.title}</h4>
          <p>${movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}</p>
        </div>
      `;
      suggestionsList.appendChild(li);
    });
  }

  // Hide suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      suggestionsList.innerHTML = '';
    }
  });
}); 