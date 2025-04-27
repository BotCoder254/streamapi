/**
 * Watchlist Management
 * Handles all client-side interactions with the watchlist feature
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize watchlist buttons on page load
  initWatchlistButtons();

  // Handle remove from watchlist buttons on the watchlist page
  initWatchlistRemoveButtons();
});

/**
 * Initialize watchlist buttons on movie and TV show pages
 */
function initWatchlistButtons() {
  const watchlistButtons = document.querySelectorAll('.watchlist-toggle');
  
  watchlistButtons.forEach(button => {
    const id = button.dataset.id;
    const type = button.dataset.type;
    
    if (id && type) {
      // Check if this item is already in the watchlist
      checkWatchlistStatus(id, type, button);
      
      // Add click event listener
      button.addEventListener('click', function(e) {
        e.preventDefault();
        
        const isInWatchlist = button.classList.contains('in-watchlist');
        
        if (isInWatchlist) {
          removeFromWatchlist(id, type, button);
        } else {
          const title = button.dataset.title || 'Untitled';
          const poster = button.dataset.poster || '';
          const year = button.dataset.year || '';
          
          addToWatchlist({ id, type, title, poster, year }, button);
        }
      });
    }
  });
}

/**
 * Initialize remove buttons specifically on the watchlist page
 */
function initWatchlistRemoveButtons() {
  const removeButtons = document.querySelectorAll('.watchlist-remove');
  
  removeButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const itemCard = this.closest('.watchlist-item');
      const id = itemCard.dataset.id;
      const type = itemCard.dataset.type;
      
      if (id && type && itemCard) {
        // Confirm removal
        if (confirm('Remove this item from your watchlist?')) {
          // Animate the removal
          itemCard.classList.add('animate__animated', 'animate__fadeOut');
          
          // Send request to remove the item
          setTimeout(() => {
            fetch('/api/watchlist/remove', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ id, type }),
            })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                // Remove the item from DOM
                itemCard.remove();
                
                // Check if watchlist is now empty
                const remainingItems = document.querySelectorAll('.watchlist-item');
                if (remainingItems.length === 0) {
                  // Show empty state
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
                
                showNotification('Removed from watchlist', 'success');
              } else {
                showNotification('Failed to remove from watchlist', 'error');
              }
            })
            .catch(error => {
              console.error('Error:', error);
              showNotification('An error occurred', 'error');
            });
          }, 300);
        }
      }
    });
  });
}

/**
 * Check if an item is in the watchlist
 */
function checkWatchlistStatus(id, type, buttonElement) {
  fetch(`/api/watchlist/check?id=${id}&type=${type}`)
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
    });
}

/**
 * Add an item to the watchlist
 */
function addToWatchlist(item, buttonElement) {
  fetch('/api/watchlist/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(item),
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      buttonElement.classList.add('in-watchlist', 'bg-green-600');
      buttonElement.classList.remove('bg-gray-700');
      buttonElement.innerHTML = '<i class="fas fa-check mr-2"></i> In Watchlist';
      showNotification('Added to watchlist', 'success');
    } else {
      showNotification(data.message, 'info');
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
function removeFromWatchlist(id, type, buttonElement) {
  fetch('/api/watchlist/remove', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, type }),
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      buttonElement.classList.remove('in-watchlist', 'bg-green-600');
      buttonElement.classList.add('bg-gray-700');
      buttonElement.innerHTML = '<i class="fas fa-plus mr-2"></i> Add to Watchlist';
      showNotification('Removed from watchlist', 'success');
    } else {
      showNotification(data.message, 'info');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    showNotification('Failed to remove from watchlist', 'error');
  });
}

/**
 * Display a notification message
 */
function showNotification(message, type = 'info') {
  // Check if notification toast exists
  let toast = document.getElementById('notification-toast');
  
  // Create toast if it doesn't exist
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'notification-toast';
    toast.className = 'fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg hidden animate__animated animate__fadeInUp z-50';
    
    const messageElement = document.createElement('span');
    messageElement.id = 'notification-message';
    toast.appendChild(messageElement);
    
    document.body.appendChild(toast);
  }
  
  // Get or create message element
  let messageElement = document.getElementById('notification-message');
  if (!messageElement) {
    messageElement = document.createElement('span');
    messageElement.id = 'notification-message';
    toast.appendChild(messageElement);
  }
  
  // Set message
  messageElement.textContent = message;
  
  // Set color based on type
  if (type === 'success') {
    toast.className = 'fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg bg-green-600 text-white animate__animated animate__fadeInUp z-50';
  } else if (type === 'error') {
    toast.className = 'fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg bg-red-600 text-white animate__animated animate__fadeInUp z-50';
  } else {
    toast.className = 'fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg bg-blue-600 text-white animate__animated animate__fadeInUp z-50';
  }
  
  // Show the toast
  toast.classList.remove('hidden');
  
  // Hide after 3 seconds
  setTimeout(() => {
    toast.classList.add('animate__fadeOutDown');
    setTimeout(() => {
      toast.classList.add('hidden');
      toast.classList.remove('animate__fadeOutDown');
    }, 300);
  }, 3000);
} 