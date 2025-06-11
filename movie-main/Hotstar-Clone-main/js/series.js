const API_KEY = '72b544388cd4251b3736f3600c5dccc0'; // TMDB API key
const API_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Fetch TV series from TMDB API
async function fetchSeries(category) {
    try {
        const response = await fetch(`${API_BASE_URL}/tv/${category}?api_key=${API_KEY}&language=en-US&page=1`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.status_message || 'Failed to fetch TV series');
        }

        return data.results;
    } catch (error) {
        console.error('Error fetching TV series:', error);
        return [];
    }
}

// Create a TV series card
function createSeriesCard(series) {
    if (!series) return '';

    const posterPath = series.poster_path 
        ? `${IMAGE_BASE_URL}${series.poster_path}`
        : 'images/no-poster.png';

    return `
        <div class="series-card" data-id="${series.id}">
            <img src="${posterPath}" alt="${series.name}" class="series-poster" 
                onerror="this.src='images/no-poster.png'">
            <div class="series-info">
                <h3 class="series-title">${series.name}</h3>
                <div class="series-meta">
                    <span class="series-rating">
                        <i class="fas fa-star"></i>
                        ${series.vote_average.toFixed(1)}
                    </span>
                    <span>${series.first_air_date?.split('-')[0] || 'N/A'}</span>
                </div>
                <button class="watchlist-btn" onclick="toggleWatchlist(${series.id}, '${series.name}')">
                    Add to Watchlist
                </button>
            </div>
        </div>
    `;
}

// Toggle series in watchlist
function toggleWatchlist(seriesId, seriesName) {
    const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    const index = watchlist.findIndex(item => item.id === seriesId);
    const button = document.querySelector(`[data-id="${seriesId}"] .watchlist-btn`);

    if (index === -1) {
        // Add to watchlist
        watchlist.push({
            id: seriesId,
            name: seriesName,
            type: 'tv'
        });
        button.textContent = 'Remove from Watchlist';
        button.dataset.added = 'true';
        showToast(`${seriesName} added to watchlist`);
    } else {
        // Remove from watchlist
        watchlist.splice(index, 1);
        button.textContent = 'Add to Watchlist';
        button.dataset.added = 'false';
        showToast(`${seriesName} removed from watchlist`);
    }

    localStorage.setItem('watchlist', JSON.stringify(watchlist));
}

// Search functionality
const searchInput = document.getElementById('searchInput');
const suggestionsList = document.getElementById('suggestions');

searchInput.addEventListener('input', debounce(handleSearch, 500));

async function handleSearch() {
    const query = searchInput.value.trim();
    
    if (query.length < 2) {
        suggestionsList.innerHTML = '';
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1`
        );
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.status_message || 'Search failed');
        }

        displaySearchResults(data.results.slice(0, 5));
    } catch (error) {
        console.error('Search error:', error);
        suggestionsList.innerHTML = '<li class="suggestion-item">Search failed. Please try again.</li>';
    }
}

function displaySearchResults(results) {
    if (results.length === 0) {
        suggestionsList.innerHTML = '<li class="suggestion-item">No results found</li>';
        return;
    }

    suggestionsList.innerHTML = results
        .map(show => `
            <li class="suggestion-item" onclick="handleSeriesSelect(${show.id})">
                <img src="${show.poster_path ? IMAGE_BASE_URL + show.poster_path : 'images/no-poster.png'}" 
                    alt="${show.name}" class="suggestion-poster">
                <div class="suggestion-info">
                    <h4>${show.name}</h4>
                    <p>${show.first_air_date?.split('-')[0] || 'N/A'}</p>
                </div>
            </li>
        `)
        .join('');
}

function handleSeriesSelect(seriesId) {
    // Clear search
    searchInput.value = '';
    suggestionsList.innerHTML = '';
    
    // You can implement series details view here
    console.log('Selected series:', seriesId);
}

// Debounce function to limit API calls
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

// Update watchlist buttons on page load
document.addEventListener('DOMContentLoaded', () => {
    const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    
    watchlist.forEach(item => {
        if (item.type === 'tv') {
            const button = document.querySelector(`[data-id="${item.id}"] .watchlist-btn`);
            if (button) {
                button.textContent = 'Remove from Watchlist';
                button.dataset.added = 'true';
            }
        }
    });
}); 