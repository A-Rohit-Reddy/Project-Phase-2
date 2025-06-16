// TMDB API configuration
const API_KEY = '72b544388cd4251b3736f3600c5dccc0';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Company IDs in TMDB
const COMPANY_IDS = {
  DISNEY: 2,    // Walt Disney Pictures
  PIXAR: 3,     // Pixar Animation Studios
  MARVEL: 420,  // Marvel Studios
  STAR_WARS: 1  // Lucasfilm
};

// Function to show loading state
function showLoading(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="loading-spinner">
      <i class="fas fa-spinner fa-spin fa-3x"></i>
    </div>
  `;
}

// Function to show empty state
function showEmptyState(containerId, message) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="empty-state">
      <i class="fas fa-film"></i>
      <p>${message}</p>
    </div>
  `;
}

// Function to fetch movies by company with different categories
async function fetchMoviesByCompany(companyId, sections) {
  try {
    for (const section of sections) {
      // Show loading state
      showLoading(section.containerId);

      let url;
      switch(section.type) {
        case 'featured':
          url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_companies=${companyId}&sort_by=popularity.desc&page=1&vote_count.gte=100`;
          break;
        case 'latest':
          url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_companies=${companyId}&sort_by=release_date.desc&page=1&vote_count.gte=50`;
          break;
        case 'top_rated':
          url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_companies=${companyId}&sort_by=vote_average.desc&vote_count.gte=1000&page=1`;
          break;
        default:
          url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_companies=${companyId}&sort_by=popularity.desc&page=1`;
      }

      console.log(`Fetching ${section.type} movies for company ${companyId}`);
      const response = await fetch(url);
      console.log(`Response status for ${section.type}:`, response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Found ${data.results?.length || 0} movies for ${section.type}`);
      
      if (data.results && data.results.length > 0) {
        displayMovies(data.results, section.containerId);
      } else {
        showEmptyState(section.containerId, `No ${section.type.replace('_', ' ')} movies found`);
      }
    }
  } catch (error) {
    console.error('Error fetching movies:', error);
    sections.forEach(section => {
      showEmptyState(section.containerId, 'Error loading movies. Please try again later.');
    });
  }
}

// Function to display movies in the container
function displayMovies(movies, containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container not found: ${containerId}`);
    return;
  }

  container.innerHTML = ''; // Clear existing content

  if (movies.length === 0) {
    showEmptyState(containerId, 'No movies found');
    return;
  }

  movies.forEach(movie => {
    if (!movie.poster_path) return; // Skip movies without posters
    
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="movie-link" data-movie-id="${movie.id}" data-type="movie">
        <img src="${IMAGE_BASE_URL}${movie.poster_path}" alt="${movie.title}" class="card-img">
        <div class="card-body">
          <h2 class="name">${movie.title}</h2>
          <h6 class="des">${movie.overview ? movie.overview.substring(0, 100) + '...' : 'No description available'}</h6>
          <button class="watchlist-btn" data-added="false">
            + Add to watchlist
          </button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  // Add click event listeners to the new cards
  addCardEventListeners();
}

// Function to display TV series in the container
function displayTVSeries(series, containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container not found: ${containerId}`);
    return;
  }

  container.innerHTML = ''; // Clear existing content

  if (series.length === 0) {
    showEmptyState(containerId, 'No TV series found');
    return;
  }

  series.forEach(show => {
    if (!show.poster_path) return; // Skip shows without posters
    
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="movie-link" data-movie-id="${show.id}" data-type="tv">
        <img src="${IMAGE_BASE_URL}${show.poster_path}" alt="${show.name}" class="card-img">
        <div class="card-body">
          <h2 class="name">${show.name}</h2>
          <h6 class="des">${show.overview ? show.overview.substring(0, 100) + '...' : 'No description available'}</h6>
          <button class="watchlist-btn" data-added="false">
            + Add to watchlist
          </button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  // Add click event listeners to the new cards
  addCardEventListeners();
}

// Function to add event listeners to movie cards
function addCardEventListeners() {
  document.querySelectorAll('.movie-link').forEach(link => {
    link.addEventListener('click', handleMovieClick);
  });

  document.querySelectorAll('.watchlist-btn').forEach(button => {
    button.addEventListener('click', handleWatchlistClick);
  });
}

// Function to handle movie click
async function handleMovieClick(event) {
  if (event.target.closest('.watchlist-btn')) {
    return;
  }

  event.preventDefault();
  const movieLink = event.currentTarget;
  const movieId = movieLink.getAttribute('data-movie-id');
  const contentType = movieLink.getAttribute('data-type') || 'movie';
  
  if (!movieId) {
    console.error('No movie ID found');
    return;
  }

  // Show loading state
  const cardBody = movieLink.querySelector('.card-body');
  const originalContent = cardBody.innerHTML;
  showLoading(cardBody);

  try {
    const endpoint = contentType === 'tv' ? 'tv' : 'movie';
    const response = await fetch(`${BASE_URL}/${endpoint}/${movieId}?api_key=${API_KEY}`);
    
    if (!response.ok) {
      throw new Error('Movie not found');
    }
    
    const data = await response.json();
    
    // Store the movie data in localStorage
    localStorage.setItem('currentMovie', JSON.stringify({
      ...data,
      media_type: contentType
    }));
    
    // Navigate to movie details page
    window.location.href = `./movie-details.html?id=${movieId}&type=${contentType}`;
  } catch (error) {
    console.error('Error:', error);
    restoreContent(cardBody, originalContent);
    showError(cardBody, originalContent, 'Failed to load movie details. Please try again.');
  }
}

// Function to restore original content
function restoreContent(cardBody, originalContent) {
  cardBody.innerHTML = originalContent;
}

// Function to show error state
function showError(cardBody, originalContent, message) {
  cardBody.innerHTML = originalContent;
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Function to handle watchlist button click
function handleWatchlistClick(event) {
  event.preventDefault();
  event.stopPropagation();
  
  const button = event.target;
  const card = button.closest('.card');
  const movieLink = card.querySelector('.movie-link');
  const movieImg = card.querySelector('.card-img');
  
  const movieData = {
    id: movieLink.getAttribute('data-movie-id'),
    type: movieLink.getAttribute('data-type') || 'movie',
    title: card.querySelector('.name').textContent,
    overview: card.querySelector('.des').textContent,
    poster_path: movieImg.getAttribute('src').replace(IMAGE_BASE_URL, ''),
    full_poster_path: movieImg.getAttribute('src')
  };

  const isInWatchlist = WatchlistManager.isInWatchlist(movieData.id);
  
  if (!isInWatchlist) {
    if (WatchlistManager.addToWatchlist(movieData)) {
      button.textContent = '✓ Added to watchlist';
      button.dataset.added = 'true';
      WatchlistManager.showToast('Added to watchlist');
    }
  } else {
    if (WatchlistManager.removeFromWatchlist(movieData.id)) {
      button.textContent = '+ Add to watchlist';
      button.dataset.added = 'false';
      WatchlistManager.showToast('Removed from watchlist');
    }
  }
}

// Initialize based on the current page
document.addEventListener('DOMContentLoaded', () => {
  console.log('brand-movies.js loaded');
  const currentPage = window.location.pathname.split('/').pop();
  console.log('Current page:', currentPage);
  
  const sections = [
    { type: 'featured', containerId: 'featured-movies', title: 'Featured Movies' },
    { type: 'latest', containerId: 'latest-movies', title: 'Latest Releases' },
    { type: 'top_rated', containerId: 'top-rated-movies', title: 'Top Rated' }
  ];
  
  switch (currentPage) {
    case 'disney.html':
      console.log('Loading Disney content');
      fetchMoviesByCompany(COMPANY_IDS.DISNEY, sections);
      break;
    case 'pixar.html':
      console.log('Loading Pixar content');
      fetchMoviesByCompany(COMPANY_IDS.PIXAR, sections);
      break;
    case 'marvel.html':
      console.log('Loading Marvel content');
      fetchMoviesByCompany(COMPANY_IDS.MARVEL, sections);
      break;
    case 'star-wars.html':
      console.log('Loading Star Wars content');
      fetchMoviesByCompany(COMPANY_IDS.STAR_WARS, sections);
      break;
    default:
      console.log('Unknown page:', currentPage);
  }
}); 