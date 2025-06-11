// TMDB API configuration
const API_KEY = 'YOUR_TMDB_API_KEY';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Marvel company ID in TMDB
const MARVEL_COMPANY_ID = 420;

// Function to fetch Marvel content
async function fetchMarvelContent(type, containerId) {
  try {
    let url;
    switch(type) {
      case 'mcu':
        // Fetch MCU movies
        url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_companies=${MARVEL_COMPANY_ID}&sort_by=release_date.desc&with_keywords=180547`; // MCU keyword
        break;
      case 'series':
        // Fetch Marvel TV series
        url = `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_companies=${MARVEL_COMPANY_ID}&sort_by=first_air_date.desc`;
        break;
      case 'animation':
        // Fetch Marvel animated content
        url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_companies=${MARVEL_COMPANY_ID}&with_genres=16&sort_by=release_date.desc`;
        break;
      default:
        url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_companies=${MARVEL_COMPANY_ID}&sort_by=popularity.desc`;
    }

    const response = await fetch(url);
    const data = await response.json();
    
    if (type === 'series') {
      displayTVSeries(data.results, containerId);
    } else {
      displayMovies(data.results, containerId);
    }
  } catch (error) {
    console.error('Error fetching Marvel content:', error);
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

// Function to display TV series in the container
function displayTVSeries(series, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  series.forEach(show => {
    const card = document.createElement('div');
    card.className = 'movie-card';
    
    const posterPath = show.poster_path ? 
      `${IMAGE_BASE_URL}${show.poster_path}` : 
      'images/no-poster.png';

    card.innerHTML = `
      <img src="${posterPath}" alt="${show.name}">
      <div class="movie-info">
        <h3 class="movie-title">${show.name}</h3>
        <p class="movie-description">${show.overview.slice(0, 100)}...</p>
        <button class="watchlist-btn" data-show-id="${show.id}" data-added="false">
          + Add to watchlist
        </button>
      </div>
    `;

    // Add watchlist functionality
    const watchlistBtn = card.querySelector('.watchlist-btn');
    watchlistBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const showId = watchlistBtn.dataset.showId;
      const isAdded = watchlistBtn.dataset.added === 'true';
      
      if (!isAdded) {
        addToWatchlist({
          id: show.id,
          title: show.name,
          poster_path: show.poster_path,
          overview: show.overview,
          type: 'tv'
        });
        watchlistBtn.dataset.added = 'true';
        watchlistBtn.textContent = '✓ Added to watchlist';
      } else {
        removeFromWatchlist(show.id);
        watchlistBtn.dataset.added = 'false';
        watchlistBtn.textContent = '+ Add to watchlist';
      }
    });

    // Check if show is in watchlist
    if (isInWatchlist(show.id)) {
      watchlistBtn.dataset.added = 'true';
      watchlistBtn.textContent = '✓ Added to watchlist';
    }

    container.appendChild(card);
  });
}

// Initialize page content
document.addEventListener('DOMContentLoaded', () => {
  fetchMarvelContent('mcu', 'marvel-mcu');
  fetchMarvelContent('series', 'marvel-series');
  fetchMarvelContent('animation', 'marvel-animation');

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
        // Search both movies and TV shows
        const [movieResponse, tvResponse] = await Promise.all([
          fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}&with_companies=${MARVEL_COMPANY_ID}`),
          fetch(`${BASE_URL}/search/tv?api_key=${API_KEY}&query=${query}&with_companies=${MARVEL_COMPANY_ID}`)
        ]);

        const movieData = await movieResponse.json();
        const tvData = await tvResponse.json();

        // Combine and sort results by popularity
        const combinedResults = [
          ...movieData.results.map(item => ({ ...item, type: 'movie' })),
          ...tvData.results.map(item => ({ 
            ...item, 
            type: 'tv',
            title: item.name,
            release_date: item.first_air_date
          }))
        ].sort((a, b) => b.popularity - a.popularity);

        displaySearchResults(combinedResults.slice(0, 5));
      } catch (error) {
        console.error('Error searching content:', error);
      }
    }, 500);
  });

  function displaySearchResults(results) {
    suggestionsList.innerHTML = '';
    results.forEach(item => {
      const li = document.createElement('li');
      li.className = 'suggestion-item';
      const posterPath = item.poster_path ? 
        `${IMAGE_BASE_URL}${item.poster_path}` : 
        'images/no-poster.png';
      
      li.innerHTML = `
        <img src="${posterPath}" alt="${item.title}" class="suggestion-poster">
        <div class="suggestion-info">
          <h4>${item.title}</h4>
          <p>${item.release_date ? new Date(item.release_date).getFullYear() : 'N/A'} - ${item.type.toUpperCase()}</p>
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