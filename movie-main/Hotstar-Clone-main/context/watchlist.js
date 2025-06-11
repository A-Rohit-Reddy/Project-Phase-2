// Constants
const TMDB_API_KEY = '72b544388cd4251b3736f3600c5dccc0';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Watchlist Manager
const WatchlistManager = {
  // Get watchlist from localStorage
  getWatchlist() {
    try {
      const watchlist = localStorage.getItem('watchlist');
      return watchlist ? JSON.parse(watchlist) : [];
    } catch (error) {
      console.error('Error getting watchlist:', error);
      return [];
    }
  },

  // Save watchlist to localStorage
  saveWatchlist(watchlist) {
    try {
      // Remove duplicates before saving
      const uniqueWatchlist = this.removeDuplicates(watchlist);
      localStorage.setItem('watchlist', JSON.stringify(uniqueWatchlist));
    } catch (error) {
      console.error('Error saving watchlist:', error);
    }
  },

  // Remove duplicates from watchlist
  removeDuplicates(watchlist) {
    const seen = new Set();
    return watchlist.filter(item => {
      const key = `${item.id}-${item.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  // Add item to watchlist
  addToWatchlist(item) {
    try {
      if (!item.id || !item.type) {
        console.error('Invalid item data:', item);
        return false;
      }

      const watchlist = this.getWatchlist();
      const isInWatchlist = this.isInWatchlist(item.id, item.type);

      if (!isInWatchlist) {
        watchlist.push({
          id: String(item.id),
          type: item.type,
          title: item.title || item.name,
          overview: item.overview,
          poster_path: item.poster_path,
          vote_average: item.vote_average,
          release_date: item.release_date
        });
        this.saveWatchlist(watchlist);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      return false;
    }
  },

  // Remove from watchlist
  removeFromWatchlist(id, type) {
    try {
      let watchlist = this.getWatchlist();
      watchlist = watchlist.filter(item => !(item.id === String(id) && item.type === type));
      this.saveWatchlist(watchlist);
      return true;
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      return false;
    }
  },

  // Check if item is in watchlist
  isInWatchlist(id, type) {
    const watchlist = this.getWatchlist();
    return watchlist.some(item => item.id === String(id) && item.type === type);
  },

  // Update button state
  updateButtonState(button, isInWatchlist) {
    if (isInWatchlist) {
      button.textContent = '✓ Added to watchlist';
      button.classList.add('added');
      button.setAttribute('data-added', 'true');
    } else {
      button.textContent = '+ Add to watchlist';
      button.classList.remove('added');
      button.setAttribute('data-added', 'false');
    }
  },

  // Show toast notification
  showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = `toast-notification${isError ? ' error' : ''}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 2000);
  }
};

// Initialize watchlist functionality
document.addEventListener('DOMContentLoaded', () => {
  // Clean up any duplicates in existing watchlist
  const watchlist = WatchlistManager.getWatchlist();
  WatchlistManager.saveWatchlist(watchlist);
});

// Simple functions to manage watchlist
function addToWatchlist(movie) {
    let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
    
    // Check if movie is already in watchlist
    if (!watchlist.some(item => item.id === movie.id)) {
        watchlist.push(movie);
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
        return true;
    }
    return false;
}

function removeFromWatchlist(movieId) {
    let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
    watchlist = watchlist.filter(movie => movie.id !== movieId);
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
}

function isInWatchlist(movieId) {
    const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
    return watchlist.some(movie => movie.id === movieId);
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