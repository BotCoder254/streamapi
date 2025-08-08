document.addEventListener('DOMContentLoaded', () => {
    const playerContainer = document.getElementById('player-container');
    const moviePlayer = document.getElementById('movie-player');
    const playerLoadingOverlay = document.getElementById('player-loading-overlay');
    const playerLoadingTitle = document.getElementById('player-loading-title');
    const playerTitle = document.getElementById('player-title');
    const closePlayerBtn = document.getElementById('close-player');
    const fullscreenBtn = document.getElementById('player-fullscreen-btn');
    const openDedicatedPlayer = document.getElementById('open-dedicated-player');
    
    // Modern UI enhancements
    function addModernEffects() {
        // Add glass morphism effects to player container
        if (playerContainer) {
            playerContainer.classList.add('backdrop-blur-md', 'bg-black/80', 'border', 'border-gray-700/50', 'rounded-2xl');
        }
        
        // Enhanced loading overlay with modern design
        if (playerLoadingOverlay) {
            playerLoadingOverlay.classList.add('bg-gradient-to-br', 'from-gray-900/95', 'via-slate-800/95', 'to-gray-900/95', 'backdrop-blur-md');
        }
        
        // Add modern button styles
        document.querySelectorAll('.player-option').forEach(option => {
            option.classList.add('backdrop-blur-sm', 'bg-gray-700/80', 'hover:bg-gray-600/80', 'border', 'border-gray-600/50', 'hover:border-green-500/50', 'transition-all', 'duration-300');
        });
    }
    
    // Initialize modern effects
    addModernEffects();
    
    // Handle player options with enhanced animations
    document.querySelectorAll('.player-option').forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            const url = e.currentTarget.href;
            const isExternal = e.currentTarget.hasAttribute('target');
            
            // Add click animation
            option.classList.add('animate__animated', 'animate__pulse');
            setTimeout(() => {
                option.classList.remove('animate__animated', 'animate__pulse');
            }, 600);
            
            if (isExternal) {
                // Open external player in new tab with modern notification
                window.open(url, '_blank');
                showNotification('Opening in new tab...', 'info');
            } else {
                // Load internal player with enhanced loading
                loadPlayer(url);
            }
        });
        
        // Add hover effects
        option.addEventListener('mouseenter', () => {
            option.classList.add('transform', 'scale-105', 'shadow-lg');
        });
        
        option.addEventListener('mouseleave', () => {
            option.classList.remove('transform', 'scale-105', 'shadow-lg');
        });
    });
    
    // Enhanced load player function with modern UI
    function loadPlayer(url) {
        // Show player with modern animation
        playerContainer.classList.remove('hidden');
        playerContainer.classList.add('animate__animated', 'animate__fadeIn');
        
        // Enhanced loading overlay
        playerLoadingOverlay.classList.remove('hidden');
        playerLoadingOverlay.innerHTML = `
            <div class="relative mb-6">
                <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-gradient-to-r from-green-400/20 to-blue-500/20 animate-pulse"></div>
                <div class="w-16 h-16 border-4 border-gray-600/50 border-t-green-500 rounded-full animate-spin shadow-lg"></div>
            </div>
            <p class="text-white text-xl font-semibold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">Loading player...</p>
            <p class="text-sm text-gray-300 mt-3 bg-gray-800/50 px-4 py-2 rounded-full backdrop-blur-sm" id="loading-title"></p>
        `;
        
        const loadingTitle = document.getElementById('loading-title');
        if (loadingTitle) {
            loadingTitle.textContent = document.querySelector('h1')?.textContent || 'Loading content...';
        }
        
        // Smooth scroll to player
        playerContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Set player source with loading state
        moviePlayer.src = url;
        
        // Update player title with modern styling
        if (playerTitle) {
            playerTitle.textContent = document.querySelector('h1')?.textContent || 'StreamAPI Player';
            playerTitle.classList.add('bg-gradient-to-r', 'from-white', 'to-gray-300', 'bg-clip-text', 'text-transparent');
        }
        
        // Store current URL for dedicated player
        if (openDedicatedPlayer) {
            openDedicatedPlayer.href = url;
        }
        
        // Enhanced player load handling
        moviePlayer.onload = () => {
            setTimeout(() => {
                playerLoadingOverlay.classList.add('animate__animated', 'animate__fadeOut');
                setTimeout(() => {
                    playerLoadingOverlay.classList.add('hidden');
                    playerLoadingOverlay.classList.remove('animate__fadeOut');
                    showNotification('Player loaded successfully!', 'success');
                }, 500);
            }, 1500);
        };
        
        // Error handling
        moviePlayer.onerror = () => {
            showNotification('Failed to load player. Please try again.', 'error');
            playerLoadingOverlay.innerHTML = `
                <div class="text-center">
                    <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                    <p class="text-white text-lg font-medium">Failed to load player</p>
                    <p class="text-gray-400 text-sm mt-2">Please try again or use a different player</p>
                    <button onclick="location.reload()" class="mt-4 px-6 py-2 bg-green-600 hover:bg-green-500 rounded-lg transition">
                        Retry
                    </button>
                </div>
            `;
        };
    }
    
    // Modern notification system
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md border animate__animated animate__fadeInRight`;
        
        switch (type) {
            case 'success':
                notification.classList.add('bg-green-500/90', 'border-green-400/50', 'text-white');
                notification.innerHTML = `<i class="fas fa-check-circle mr-2"></i>${message}`;
                break;
            case 'error':
                notification.classList.add('bg-red-500/90', 'border-red-400/50', 'text-white');
                notification.innerHTML = `<i class="fas fa-exclamation-circle mr-2"></i>${message}`;
                break;
            case 'info':
            default:
                notification.classList.add('bg-blue-500/90', 'border-blue-400/50', 'text-white');
                notification.innerHTML = `<i class="fas fa-info-circle mr-2"></i>${message}`;
                break;
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('animate__fadeOutRight');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
    }
    
    // Enhanced close player with animation
    if (closePlayerBtn) {
        closePlayerBtn.addEventListener('click', () => {
            playerContainer.classList.add('animate__animated', 'animate__fadeOut');
            setTimeout(() => {
                playerContainer.classList.add('hidden');
                playerContainer.classList.remove('animate__animated', 'animate__fadeOut');
                moviePlayer.src = '';
            }, 300);
        });
    }
    
    // Fullscreen button
    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            playerContainer.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    });
    
    // Handle fullscreen change
    document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
            fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
        } else {
            fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
        }
    });
    
    // Handle player hover controls
    const playerControls = document.querySelector('.player-controls');
    if (playerControls) {
        let timeout;
        playerContainer.addEventListener('mousemove', () => {
            playerControls.style.opacity = '1';
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                if (!playerControls.matches(':hover')) {
                    playerControls.style.opacity = '0';
                }
            }, 2000);
        });
        
        playerContainer.addEventListener('mouseleave', () => {
            playerControls.style.opacity = '0';
        });
        
        playerControls.addEventListener('mouseenter', () => {
            clearTimeout(timeout);
            playerControls.style.opacity = '1';
        });
    }
    
    // Handle escape key to exit fullscreen or close player
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else if (!playerContainer.classList.contains('hidden')) {
                playerContainer.classList.add('hidden');
                moviePlayer.src = '';
            }
        }
    });
}); 