/**
 * Watchlist Management
 * Handles all client-side interactions with the watchlist feature
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize watchlist buttons
  const watchlistButtons = document.querySelectorAll('.watchlist-toggle');
  watchlistButtons.forEach(button => {
    const mediaId = button.dataset.id;
    const mediaType = button.dataset.type;
    
    if (mediaId && mediaType) {
      // Check initial watchlist status
      checkWatchlistStatus(mediaId, mediaType, button);
      
      // Add click handler
      button.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const isInWatchlist = this.classList.contains('in-watchlist');
        
        if (isInWatchlist) {
          removeFromWatchlist(mediaId, mediaType, this);
        } else {
          const item = {
            id: mediaId,
            type: mediaType,
            title: this.dataset.title,
            poster: this.dataset.poster,
            year: this.dataset.year
          };
          addToWatchlist(item, this);
        }
      });
    }
  });
  
  // Initialize remove buttons on watchlist page
  const removeButtons = document.querySelectorAll('.watchlist-remove');
  removeButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const itemCard = this.closest('.watchlist-item');
      const mediaId = itemCard.dataset.id;
      const mediaType = itemCard.dataset.type;
      
      if (mediaId && mediaType && itemCard) {
        if (confirm('Remove this item from your watchlist?')) {
          itemCard.classList.add('animate__animated', 'animate__fadeOut');
          
          setTimeout(() => {
            removeFromWatchlist(mediaId, mediaType, null, itemCard);
          }, 300);
        }
      }
    });
  });
});

/**
 * Check if an item is in the watchlist
 */
function checkWatchlistStatus(mediaId, mediaType, buttonElement) {
  fetch(`/watchlist/check?id=${mediaId}&type=${mediaType}`)
    .then(response => response.json())
    .then(data => {
      if (data.inWatchlist) {
        buttonElement.classList.add('in-watchlist', 'bg-green-600');
        buttonElement.classList.remove('bg-gray-700');
        buttonElement.innerHTML = '<i class="fas fa-check mr-2"></i> In Watchlist';
      } else {
        buttonElement.classList.remove('in-watchlist', 'bg-green-600');
        buttonElement.classList.add('bg-gray-700');
        buttonElement.innerHTML = '<i class="fas fa-plus mr-2"></i> Add to Watchlist';
      }
    })
    .catch(error => {
      console.error('Error checking watchlist status:', error);
      showNotification('Error checking watchlist status', 'error');
    });
}

/**
 * Add an item to the watchlist
 */
function addToWatchlist(item, buttonElement) {
  fetch('/watchlist/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(item)
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      buttonElement.classList.add('in-watchlist', 'bg-green-600');
      buttonElement.classList.remove('bg-gray-700');
      buttonElement.innerHTML = '<i class="fas fa-check mr-2"></i> In Watchlist';
      showNotification('Added to watchlist', 'success');
    } else {
      showNotification(data.error || 'Failed to add to watchlist', 'error');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    showNotification('Failed to add to watchlist', 'error');
  });
}

/**
 * Remove an item from the watchlist
 */
function removeFromWatchlist(mediaId, mediaType, buttonElement, itemCard = null) {
  fetch('/watchlist/remove', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id: mediaId, type: mediaType })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      if (buttonElement) {
        buttonElement.classList.remove('in-watchlist', 'bg-green-600');
        buttonElement.classList.add('bg-gray-700');
        buttonElement.innerHTML = '<i class="fas fa-plus mr-2"></i> Add to Watchlist';
      }
      if (itemCard) {
        itemCard.remove();
        checkEmptyWatchlist();
      }
      showNotification('Removed from watchlist', 'success');
    } else {
      showNotification(data.error || 'Failed to remove from watchlist', 'error');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    showNotification('Failed to remove from watchlist', 'error');
  });
}

/**
 * Check if the watchlist is empty
 */
function checkEmptyWatchlist() {
  const remainingItems = document.querySelectorAll('.watchlist-item');
  if (remainingItems.length === 0) {
    const container = document.querySelector('.grid');
    if (container) {
      container.innerHTML = `
        <div class="col-span-full text-center py-16 animate__animated animate__fadeIn">
          <i class="fas fa-bookmark text-6xl text-gray-600 mb-6"></i>
          <h2 class="text-2xl font-bold mb-2">Your Watchlist is Empty</h2>
          <p class="text-gray-400 mb-8">Add movies and TV shows to your watchlist to keep track of what you want to watch.</p>
          
          <div class="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <a href="/browse" class="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition flex items-center">
              <i class="fas fa-film mr-2"></i> Browse Movies
            </a>
            
            <a href="/browse/tv" class="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition flex items-center">
              <i class="fas fa-tv mr-2"></i> Browse TV Shows
            </a>
          </div>
        </div>
      `;
    }
  }
}

/**
 * Display a notification message
 */
function showNotification(message, type = 'info') {
  const toast = document.getElementById('notification-toast');
  const messageElement = document.getElementById('notification-message');
  
  if (toast && messageElement) {
    messageElement.textContent = message;
    toast.className = 'fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg animate__animated animate__fadeInUp z-50';
    
    switch (type) {
      case 'success':
        toast.classList.add('bg-green-600', 'text-white');
        break;
      case 'error':
        toast.classList.add('bg-red-600', 'text-white');
        break;
      case 'info':
        toast.classList.add('bg-blue-600', 'text-white');
        break;
      default:
        toast.classList.add('bg-gray-800', 'text-white');
    }
    
    toast.classList.remove('hidden');
    
    setTimeout(() => {
      toast.classList.remove('animate__fadeInUp');
      toast.classList.add('animate__fadeOutDown');
      setTimeout(() => {
        toast.classList.add('hidden');
        toast.classList.remove('animate__fadeOutDown');
        toast.className = 'fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg hidden';
      }, 300);
    }, 3000);
  }
} 