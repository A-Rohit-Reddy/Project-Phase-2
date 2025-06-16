// TMDB API configuration
const API_KEY = '72b544388cd4251b3736f3600c5dccc0';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Star Wars collection ID in TMDB
const STAR_WARS_COLLECTION_ID = 10;
const STAR_WARS_KEYWORD_ID = 4367; // Star Wars universe keyword

// Function to fetch Star Wars content
async function fetchStarWarsContent(type, containerId) {
  try {
    let url;
    switch(type) {
      case 'movies':
        // Fetch Star Wars movies
        url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_keywords=${STAR_WARS_KEYWORD_ID}&sort_by=release_date.desc&vote_count.gte=100`;
        break;
      case 'series':
        // Fetch Star Wars TV series
        url = `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_keywords=${STAR_WARS_KEYWORD_ID}&sort_by=vote_average.desc&vote_count.gte=100`;
        break;
      default:
        url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_keywords=${STAR_WARS_KEYWORD_ID}&sort_by=popularity.desc&vote_count.gte=100`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch Star Wars content');
    }
    
    const data = await response.json();
    
    if (type === 'series') {
      displayTVSeries(data.results, containerId);
    } else {
      displayMovies(data.results, containerId);
    }
  } catch (error) {
    console.error('Error fetching Star Wars content:', error);
    showEmptyState(containerId, 'Error loading content');
  }
}

// Function to fetch Star Wars saga movies
async function fetchStarWarsSaga() {
  try {
    const response = await fetch(
      `${BASE_URL}/collection/${STAR_WARS_COLLECTION_ID}?api_key=${API_KEY}&append_to_response=parts`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch Star Wars saga');
    }
    
    const data = await response.json();
    
    if (data.parts && data.parts.length > 0) {
      // Sort movies by episode number/release date
      const sortedMovies = data.parts.sort((a, b) => new Date(a.release_date) - new Date(b.release_date));
      displayMovies(sortedMovies, 'star-wars-saga');
    } else {
      showEmptyState('star-wars-saga', 'No Star Wars saga movies found');
    }
  } catch (error) {
    console.error('Error fetching Star Wars saga:', error);
    showEmptyState('star-wars-saga', 'Error loading Star Wars saga');
  }
}

// Function to fetch Star Wars TV series
async function fetchStarWarsSeries() {
  try {
    const response = await fetch(
      `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_keywords=${STAR_WARS_KEYWORD_ID}&sort_by=vote_average.desc&vote_count.gte=100`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch Star Wars TV series');
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      displayTVSeries(data.results, 'star-wars-series');
    } else {
      showEmptyState('star-wars-series', 'No TV series found');
    }
  } catch (error) {
    console.error('Error fetching Star Wars TV series:', error);
    showEmptyState('star-wars-series', 'Error loading TV series');
  }
}

// Function to display movies in the container
function displayMovies(movies, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  movies.forEach(movie => {
    const card = createMovieCard(movie);
    container.appendChild(card);
  });
}

// Function to display TV series in the container
function displayTVSeries(series, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  series.forEach(show => {
    const card = createShowCard(show);
    container.appendChild(card);
  });
}

// Create movie card
function createMovieCard(movie) {
  const card = document.createElement('div');
  card.className = 'card';
  
  card.innerHTML = `
    <div class="movie-link" data-movie-id="${movie.id}">
      <img src="${IMAGE_BASE_URL}${movie.poster_path}" alt="${movie.title}" class="card-img">
      <div class="card-body">
        <h2 class="name">${movie.title}</h2>
        <h6 class="des">${movie.overview.substring(0, 80)}...</h6>
        <button class="watchlist-btn" data-added="${WatchlistManager.isInWatchlist(movie.id, 'movie')}">
          ${WatchlistManager.isInWatchlist(movie.id, 'movie') ? '✓ Added to watchlist' : '+ Add to watchlist'}
        </button>
      </div>
    </div>
  `;

  // Add watchlist functionality
  const watchlistBtn = card.querySelector('.watchlist-btn');
  watchlistBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const movieData = {
      id: movie.id,
      type: 'movie',
      title: movie.title,
      overview: movie.overview,
      poster_path: movie.poster_path
    };

    const isInWatchlist = WatchlistManager.isInWatchlist(movie.id, 'movie');
    
    if (!isInWatchlist) {
      if (WatchlistManager.addToWatchlist(movieData)) {
        watchlistBtn.dataset.added = 'true';
        watchlistBtn.textContent = '✓ Added to watchlist';
        WatchlistManager.showToast('Added to watchlist');
      }
    } else {
      if (WatchlistManager.removeFromWatchlist(movie.id, 'movie')) {
        watchlistBtn.dataset.added = 'false';
        watchlistBtn.textContent = '+ Add to watchlist';
        WatchlistManager.showToast('Removed from watchlist');
      }
    }
  });

  return card;
}

// Create show card
function createShowCard(show) {
  const card = document.createElement('div');
  card.className = 'card';
  
  card.innerHTML = `
    <div class="movie-link" data-show-id="${show.id}">
      <img src="${IMAGE_BASE_URL}${show.poster_path}" alt="${show.name}" class="card-img">
      <div class="card-body">
        <h2 class="name">${show.name}</h2>
        <h6 class="des">${show.overview.substring(0, 80)}...</h6>
        <button class="watchlist-btn" data-added="${WatchlistManager.isInWatchlist(show.id, 'tv')}">
          ${WatchlistManager.isInWatchlist(show.id, 'tv') ? '✓ Added to watchlist' : '+ Add to watchlist'}
        </button>
      </div>
    </div>
  `;

  // Add watchlist functionality
  const watchlistBtn = card.querySelector('.watchlist-btn');
  watchlistBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const showData = {
      id: show.id,
      type: 'tv',
      title: show.name,
      overview: show.overview,
      poster_path: show.poster_path
    };

    const isInWatchlist = WatchlistManager.isInWatchlist(show.id, 'tv');
    
    if (!isInWatchlist) {
      if (WatchlistManager.addToWatchlist(showData)) {
        watchlistBtn.dataset.added = 'true';
        watchlistBtn.textContent = '✓ Added to watchlist';
        WatchlistManager.showToast('Added to watchlist');
      }
    } else {
      if (WatchlistManager.removeFromWatchlist(show.id, 'tv')) {
        watchlistBtn.dataset.added = 'false';
        watchlistBtn.textContent = '+ Add to watchlist';
        WatchlistManager.showToast('Removed from watchlist');
      }
    }
  });

  return card;
}

// Initialize page content
document.addEventListener('DOMContentLoaded', () => {
  const sections = [
    { type: 'featured', containerId: 'featured-movies', title: 'Featured Movies' },
    { type: 'latest', containerId: 'latest-movies', title: 'Latest Releases' },
    { type: 'top_rated', containerId: 'top-rated-movies', title: 'Top Rated' }
  ];
  
  // Load Star Wars content
  fetchMoviesByCompany(COMPANY_IDS.STAR_WARS, sections);
  fetchStarWarsSaga();
  fetchStarWarsSeries();

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
          fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}&with_keywords=${STAR_WARS_KEYWORD_ID}`),
          fetch(`${BASE_URL}/search/tv?api_key=${API_KEY}&query=${query}&with_keywords=${STAR_WARS_KEYWORD_ID}`)
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