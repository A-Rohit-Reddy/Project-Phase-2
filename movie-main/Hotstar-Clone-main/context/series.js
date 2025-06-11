// TMDB API configuration
const API_KEY = '72b544388cd4251b3736f3600c5dccc0';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/original';

// DOM Elements
const seriesGrid = document.getElementById('series-grid');
const loadingSpinner = document.getElementById('loading');
const filterButtons = document.querySelectorAll('.filter-button');
const searchInput = document.getElementById('searchInput');
const heroBackground = document.getElementById('hero-background');

// State
let currentFilter = 'all';
let currentPage = 1;
let isLoading = false;
let hasMorePages = true;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSeries();
    setupInfiniteScroll();
    setupFilterButtons();
    setupSearch();
    loadRandomHeroSeries();
});

// Load random hero series
async function loadRandomHeroSeries() {
    try {
        const response = await fetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}&page=1`);
        const data = await response.json();
        const randomSeries = data.results[Math.floor(Math.random() * data.results.length)];
        
        if (randomSeries.backdrop_path) {
            heroBackground.src = `${BACKDROP_BASE_URL}${randomSeries.backdrop_path}`;
        }
    } catch (error) {
        console.error('Error loading hero series:', error);
    }
}

// Setup infinite scroll
function setupInfiniteScroll() {
    window.addEventListener('scroll', () => {
        if (isLoading || !hasMorePages) return;

        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        if (scrollTop + clientHeight >= scrollHeight - 800) {
            currentPage++;
            loadSeries(false);
        }
    });
}

// Setup filter buttons
function setupFilterButtons() {
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (button.dataset.filter === currentFilter) return;

            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            currentFilter = button.dataset.filter;
            currentPage = 1;
            hasMorePages = true;
            seriesGrid.innerHTML = '';
            loadSeries();
        });
    });
}

// Setup search functionality
function setupSearch() {
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = e.target.value.trim();
            currentPage = 1;
            hasMorePages = true;
            seriesGrid.innerHTML = '';
            
            if (query) {
                searchSeries(query);
            } else {
                loadSeries();
            }
        }, 500);
    });
}

// Load series based on current filter
async function loadSeries(showLoading = true) {
    if (isLoading) return;
    isLoading = true;
    
    if (showLoading) {
        loadingSpinner.style.display = 'flex';
    }

    try {
        let endpoint;
        switch (currentFilter) {
            case 'trending':
                endpoint = '/trending/tv/week';
                break;
            case 'latest':
                endpoint = '/tv/on_the_air';
                break;
            case 'top_rated':
                endpoint = '/tv/top_rated';
                break;
            case 'airing':
                endpoint = '/tv/airing_today';
                break;
            default:
                endpoint = '/tv/popular';
        }

        const response = await fetch(
            `${BASE_URL}${endpoint}?api_key=${API_KEY}&page=${currentPage}`
        );
        const data = await response.json();
        
        if (data.results.length === 0) {
            hasMorePages = false;
            if (currentPage === 1) {
                showNoResults();
            }
            return;
        }

        renderSeries(data.results);
        hasMorePages = currentPage < data.total_pages;
    } catch (error) {
        console.error('Error loading series:', error);
        showError();
    } finally {
        isLoading = false;
        loadingSpinner.style.display = 'none';
    }
}

// Search series
async function searchSeries(query) {
    if (isLoading) return;
    isLoading = true;
    loadingSpinner.style.display = 'flex';

    try {
        const response = await fetch(
            `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${currentPage}`
        );
        const data = await response.json();
        
        if (data.results.length === 0) {
            hasMorePages = false;
            if (currentPage === 1) {
                showNoResults();
            }
            return;
        }

        renderSeries(data.results);
        hasMorePages = currentPage < data.total_pages;
    } catch (error) {
        console.error('Error searching series:', error);
        showError();
    } finally {
        isLoading = false;
        loadingSpinner.style.display = 'none';
    }
}

// Render series to grid
function renderSeries(series) {
    series.forEach(show => {
        if (!show.poster_path) return;

        const seriesCard = document.createElement('div');
        seriesCard.className = 'series-card';
        
        const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
        const isInWatchlist = watchlist.some(item => item.id === show.id);
        
        seriesCard.innerHTML = `
            <img src="${IMAGE_BASE_URL}${show.poster_path}" alt="${show.name}" class="series-poster">
            <div class="series-info">
                <h3 class="series-title">${show.name}</h3>
                <div class="series-meta">
                    <div class="series-rating">
                        <i class="fas fa-star"></i>
                        <span>${show.vote_average.toFixed(1)}</span>
                    </div>
                    <span>${show.first_air_date ? new Date(show.first_air_date).getFullYear() : 'N/A'}</span>
                </div>
                <button class="watchlist-btn ${isInWatchlist ? 'added' : ''}" data-series-id="${show.id}">
                    ${isInWatchlist ? '✓ Added to watchlist' : '+ Add to watchlist'}
                </button>
            </div>
        `;

        // Add click event for series card
        seriesCard.addEventListener('click', (e) => {
            if (!e.target.closest('.watchlist-btn')) {
                window.location.href = `./series-details.html?id=${show.id}`;
            }
        });

        // Add click event for watchlist button
        const watchlistBtn = seriesCard.querySelector('.watchlist-btn');
        watchlistBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleWatchlist(show, watchlistBtn);
        });

        seriesGrid.appendChild(seriesCard);
    });
}

// Toggle watchlist status
function toggleWatchlist(series, button) {
    const seriesData = {
        id: series.id,
        type: 'tv',
        title: series.name,
        overview: series.overview,
        poster_path: series.poster_path
    };
    
    const isInWatchlist = WatchlistManager.isInWatchlist(series.id, 'tv');
    
    if (isInWatchlist) {
        if (WatchlistManager.removeFromWatchlist(series.id, 'tv')) {
            button.textContent = '+ Add to watchlist';
            button.classList.remove('added');
            WatchlistManager.showToast('Removed from watchlist');
        }
    } else {
        if (WatchlistManager.addToWatchlist(seriesData)) {
            button.textContent = '✓ Added to watchlist';
            button.classList.add('added');
            WatchlistManager.showToast('Added to watchlist');
        }
    }
}

// Show toast notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 2000);
}

// Show no results message
function showNoResults() {
    seriesGrid.innerHTML = `
        <div class="no-results">
            <i class="fas fa-search fa-3x"></i>
            <p>No series found</p>
        </div>
    `;
}

// Show error message
function showError() {
    seriesGrid.innerHTML = `
        <div class="no-results">
            <i class="fas fa-exclamation-circle fa-3x"></i>
            <p>Something went wrong. Please try again later.</p>
        </div>
    `;
} 