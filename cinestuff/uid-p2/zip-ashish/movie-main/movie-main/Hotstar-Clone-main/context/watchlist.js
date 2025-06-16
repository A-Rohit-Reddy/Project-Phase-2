// Constants
const TMDB_API_KEY = '72b544388cd4251b3736f3600c5dccc0';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Watchlist Manager
const WatchlistManager = {
    // Get watchlist from localStorage
    getWatchlist() {
        const watchlist = localStorage.getItem('watchlist');
        return watchlist ? JSON.parse(watchlist) : [];
    },

    // Save watchlist to localStorage
    saveWatchlist(watchlist) {
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
    },

    // Add movie to watchlist
    addToWatchlist(movieId) {
        const watchlist = this.getWatchlist();
        if (!watchlist.includes(movieId)) {
            watchlist.push(movieId);
            this.saveWatchlist(watchlist);
            return true;
        }
        return false;
    },

    // Remove movie from watchlist
    removeFromWatchlist(movieId) {
        const watchlist = this.getWatchlist();
        const index = watchlist.indexOf(movieId);
        if (index > -1) {
            watchlist.splice(index, 1);
            this.saveWatchlist(watchlist);
            return true;
        }
        return false;
    },

    // Check if movie is in watchlist
    isInWatchlist(movieId) {
        const watchlist = this.getWatchlist();
        return watchlist.includes(movieId);
    },

    // Get watchlist items with full details
    async getWatchlistItems() {
        try {
            const watchlist = this.getWatchlist();
            const items = [];

            // Fetch movie details
            for (const movieId of watchlist) {
                try {
                    const response = await fetch(`${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}`);
                    if (response.ok) {
                        const data = await response.json();
                        items.push({
                            ...data,
                            type: 'movie',
                            addedAt: new Date().toISOString()
                        });
                    }
                } catch (error) {
                    console.error(`Error fetching movie ${movieId}:`, error);
                }
            }

            // Sort by added date (newest first)
            return items.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
        } catch (error) {
            console.error('Error getting watchlist items:', error);
            return [];
        }
    },

    // Get watchlist statistics
    getWatchlistStats() {
        const watchlist = this.getWatchlist();
        return {
            totalMovies: watchlist.length,
            totalItems: watchlist.length
        };
    },

    // Clear watchlist
    clearWatchlist() {
        localStorage.removeItem('watchlist');
    },

    // Export watchlist
    exportWatchlist() {
        const watchlist = this.getWatchlist();
        const blob = new Blob([JSON.stringify(watchlist, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'watchlist.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // Import watchlist
    importWatchlist(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (Array.isArray(data)) {
                this.saveWatchlist(data);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error importing watchlist:', error);
            return false;
        }
    },

    // Show toast notification
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 2000);
        }, 100);
    }
};

// Make WatchlistManager globally available
window.WatchlistManager = WatchlistManager;

// Initialize watchlist functionality
document.addEventListener('DOMContentLoaded', () => {
    // Clean up any duplicates in existing watchlist
    const watchlist = WatchlistManager.getWatchlist();
    WatchlistManager.saveWatchlist(watchlist);
});

// Simple functions to manage watchlist
function addToWatchlist(movieId) {
    const watchlist = WatchlistManager.getWatchlist();
    if (!watchlist.includes(movieId)) {
        watchlist.push(movieId);
        WatchlistManager.saveWatchlist(watchlist);
        return true;
    }
    return false;
}

function removeFromWatchlist(movieId) {
    const watchlist = WatchlistManager.getWatchlist();
    const index = watchlist.indexOf(movieId);
    if (index > -1) {
        watchlist.splice(index, 1);
        WatchlistManager.saveWatchlist(watchlist);
        return true;
    }
    return false;
}

function isInWatchlist(movieId) {
    const watchlist = WatchlistManager.getWatchlist();
    return watchlist.includes(movieId);
}

// Function to show toast notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

// Make functions available globally
window.addToWatchlist = addToWatchlist;
window.removeFromWatchlist = removeFromWatchlist;
window.isInWatchlist = isInWatchlist;
window.showToast = showToast; 