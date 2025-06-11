// TMDB API configuration
const TMDB_API_KEY = '72b544388cd4251b3736f3600c5dccc0';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/original';

// DOM Elements
const popularSeriesContainer = document.getElementById('popular-series');
const newReleasesContainer = document.getElementById('new-releases');
const topRatedContainer = document.getElementById('top-rated');
const searchInput = document.getElementById('searchInput');
const suggestionsList = document.getElementById('suggestions');
const carousel = document.querySelector('.carousel');

// Carousel functionality
async function setupCarousel() {
    try {
        const response = await fetch(`${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}&language=en-US`);
        const data = await response.json();
        const series = data.results.slice(0, 5); // Get top 5 series

        carousel.innerHTML = series.map((show, index) => `
            <div class="slider" style="display: ${index === 0 ? 'block' : 'none'}">
                <div class="slide-content">
                    <h2 class="series-title">${show.name}</h2>
                    <p class="series-description">${show.overview}</p>
                    <div class="series-info">
                        <span class="info-item">
                            <i class="fas fa-star"></i>
                            ${show.vote_average.toFixed(1)}
                        </span>
                        <span class="info-item">
                            <i class="fas fa-calendar"></i>
                            ${new Date(show.first_air_date).getFullYear()}
                        </span>
                        <span class="info-item">
                            <i class="fas fa-film"></i>
                            TV Series
                        </span>
                    </div>
                    <button class="watch-btn">
                        <i class="fas fa-play"></i>
                        Watch Now
                    </button>
                </div>
                <img src="${TMDB_BACKDROP_BASE_URL}${show.backdrop_path}" alt="${show.name}">
            </div>
        `).join('');

        // Auto slide functionality
        let currentSlide = 0;
        const slides = carousel.querySelectorAll('.slider');
        
        setInterval(() => {
            slides[currentSlide].style.display = 'none';
            currentSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].style.display = 'block';
        }, 5000);

    } catch (error) {
        console.error('Error setting up carousel:', error);
    }
}

// Video card hover effect
document.querySelectorAll('.video-card').forEach(card => {
    const video = card.querySelector('.card-video');
    
    card.addEventListener('mouseenter', () => {
        video.play();
    });
    
    card.addEventListener('mouseleave', () => {
        video.pause();
        video.currentTime = 0;
    });
});

// Create series card
function createSeriesCard(series) {
    const card = document.createElement('div');
    card.className = 'card';
    
    // Check if series is in watchlist
    const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
    const isInWatchlist = watchlist.some(item => item.id === series.id && item.type === 'tv');
    
    card.innerHTML = `
        <div class="movie-link">
            <img src="${TMDB_IMAGE_BASE_URL}${series.poster_path}" alt="${series.name}" class="card-img">
            <div class="card-body">
                <h2 class="name">${series.name}</h2>
                <h6 class="des">${series.overview.substring(0, 80)}...</h6>
                <button class="watchlist-btn ${isInWatchlist ? 'added' : ''}" data-id="${series.id}" data-type="tv" data-added="${isInWatchlist}">
                    ${isInWatchlist ? 'Remove from Watch Later' : '+ Add to Watch Later'}
                </button>
            </div>
        </div>
    `;
    
    // Add click event for watchlist button
    const watchlistBtn = card.querySelector('.watchlist-btn');
    watchlistBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const isAdded = watchlistBtn.getAttribute('data-added') === 'true';
        
        if (isAdded) {
            removeFromWatchlist(series.id, 'tv');
            watchlistBtn.textContent = '+ Add to Watch Later';
            watchlistBtn.classList.remove('added');
        } else {
            addToWatchlist(series);
            watchlistBtn.textContent = 'Remove from Watch Later';
            watchlistBtn.classList.add('added');
        }
        
        watchlistBtn.setAttribute('data-added', (!isAdded).toString());
    });
    
    return card;
}

// Add to watchlist
function addToWatchlist(series) {
    try {
        let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
        
        // Check if series is already in watchlist
        if (!watchlist.some(item => item.id === series.id && item.type === 'tv')) {
            const newItem = {
                id: series.id,
                type: 'tv',
                title: series.name,
                name: series.name,
                poster_path: series.poster_path,
                overview: series.overview,
                vote_average: series.vote_average,
                first_air_date: series.first_air_date,
                addedAt: new Date().toISOString()
            };
            
            watchlist.push(newItem);
            localStorage.setItem('watchlist', JSON.stringify(watchlist));
            
            // Show feedback
            showToast('Added to Watch Later list');
            
            // Log for debugging
            console.log('Added to watchlist:', newItem);
            console.log('Current watchlist:', watchlist);
        }
    } catch (error) {
        console.error('Error adding to watchlist:', error);
        showToast('Error adding to Watch Later list', true);
    }
}

// Remove from watchlist
function removeFromWatchlist(id, type) {
    try {
        let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
        const initialLength = watchlist.length;
        
        watchlist = watchlist.filter(item => !(item.id === id && item.type === type));
        
        if (watchlist.length < initialLength) {
            localStorage.setItem('watchlist', JSON.stringify(watchlist));
            showToast('Removed from Watch Later list');
            
            // Log for debugging
            console.log('Removed item:', { id, type });
            console.log('Current watchlist:', watchlist);
        }
    } catch (error) {
        console.error('Error removing from watchlist:', error);
        showToast('Error removing from Watch Later list', true);
    }
}

// Show toast notification
function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'error' : ''}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Add animation
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });
    
    // Remove after delay
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// Fetch series from TMDB
async function fetchSeries(endpoint) {
    try {
        const response = await fetch(`${TMDB_BASE_URL}${endpoint}?api_key=${TMDB_API_KEY}&language=en-US`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error('Error fetching series:', error);
        return [];
    }
}

// Load series into container
async function loadSeries(endpoint, container) {
    const series = await fetchSeries(endpoint);
    container.innerHTML = '';
    series.forEach(show => {
        if (show.poster_path) {
            container.appendChild(createSeriesCard(show));
        }
    });
}

// Search series
async function searchSeries(query) {
    if (!query) {
        suggestionsList.innerHTML = '';
        return;
    }
    
    try {
        const response = await fetch(
            `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
        );
        const data = await response.json();
        
        suggestionsList.innerHTML = '';
        data.results.slice(0, 5).forEach(series => {
            if (series.poster_path) {
                const li = document.createElement('li');
                li.textContent = series.name;
                li.addEventListener('click', () => {
                    searchInput.value = series.name;
                    suggestionsList.innerHTML = '';
                });
                suggestionsList.appendChild(li);
            }
        });
    } catch (error) {
        console.error('Error searching series:', error);
    }
}

// Initialize page
async function initializePage() {
    // Setup carousel
    await setupCarousel();
    
    // Load popular series
    loadSeries('/tv/popular', popularSeriesContainer);
    
    // Load new releases (on the air)
    loadSeries('/tv/on_the_air', newReleasesContainer);
    
    // Load top rated series
    loadSeries('/tv/top_rated', topRatedContainer);
    
    // Setup search with debouncing
    searchInput.addEventListener('input', debounce((e) => {
        searchSeries(e.target.value);
    }, 300));
    
    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            suggestionsList.innerHTML = '';
        }
    });
}

// Debounce function for search
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePage); 