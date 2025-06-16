const API_KEY = '8c247ea0b4b56ed2ff7d41c9a833aa77'; // TMDB API key
const API_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Fetch TV series from TMDB API
async function fetchSeries(category) {
    console.log('Fetching series for category:', category);
    try {
        const url = `${API_BASE_URL}/tv/${category}?api_key=${API_KEY}&language=en-US&page=1`;
        console.log('Fetching from URL:', url);
        
        const response = await fetch(url);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            throw new Error(errorData.status_message || 'Failed to fetch TV series');
        }

        const data = await response.json();
        console.log('Received data:', data);
        
        if (!data.results || !Array.isArray(data.results)) {
            console.error('Invalid data format:', data);
            throw new Error('Invalid data format received from API');
        }

        return data.results;
    } catch (error) {
        console.error('Error in fetchSeries:', error);
        return [];
    }
}

// Create a TV series card
function createSeriesCard(series) {
    console.log('Creating card for series:', series);
    if (!series) {
        console.error('Invalid series data');
        return '';
    }

    try {
        const posterPath = series.poster_path 
            ? `${IMAGE_BASE_URL}${series.poster_path}`
            : 'images/add.png';

        const card = `
            <div class="series-card" data-id="${series.id}" onclick="showSeriesDetails(${series.id})">
                <img src="${posterPath}" alt="${series.name}" class="series-poster" 
                    onerror="this.src='images/add.png'">
                <div class="series-info">
                    <h3 class="series-title">${series.name}</h3>
                    <div class="series-meta">
                        <span class="series-rating">
                            <i class="fas fa-star"></i>
                            ${(series.vote_average || 0).toFixed(1)}
                        </span>
                        <span>${series.first_air_date?.split('-')[0] || 'N/A'}</span>
                    </div>
                    <button class="watchlist-btn" onclick="event.stopPropagation(); toggleWatchlist(${series.id}, '${series.name.replace(/'/g, "\\'")}')">
                        Add to Watchlist
                    </button>
                </div>
            </div>
        `;
        return card;
    } catch (error) {
        console.error('Error creating series card:', error);
        return '';
    }
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

// Function to show series details
async function showSeriesDetails(seriesId) {
    try {
        const response = await fetch(`${API_BASE_URL}/tv/${seriesId}?api_key=${API_KEY}`);
        if (!response.ok) throw new Error('Series not found');
        
        const seriesData = await response.json();
        
        // Convert TV series data to movie format for compatibility with movie-details page
        const movieFormatData = {
            id: seriesData.id,
            title: seriesData.name,
            overview: seriesData.overview,
            poster_path: seriesData.poster_path,
            backdrop_path: seriesData.backdrop_path,
            vote_average: seriesData.vote_average,
            release_date: seriesData.first_air_date,
            runtime: seriesData.episode_run_time[0] || 0,
            genres: seriesData.genres,
            status: seriesData.status,
            tagline: seriesData.tagline,
            type: 'tv'  // Add this to differentiate between movies and TV series
        };
        
        // Store the formatted data in localStorage
        localStorage.setItem('currentMovie', JSON.stringify(movieFormatData));

        // Navigate to movie details page
        window.location.href = `movie-details.html?id=${seriesId}&type=tv`;
    } catch (error) {
        console.error('Error:', error);
        showToast('Series not found. Please try another series.');
    }
} 