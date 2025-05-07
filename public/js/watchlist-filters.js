document.addEventListener('DOMContentLoaded', () => {
    const sortSelect = document.getElementById('sort-select');
    const filterSelect = document.getElementById('filter-select');
    
    if (sortSelect && filterSelect) {
        // Set initial values from URL params
        const urlParams = new URLSearchParams(window.location.search);
        const currentSort = urlParams.get('sort') || 'date-added-desc';
        const currentFilter = urlParams.get('filter') || 'all';
        
        sortSelect.value = currentSort;
        filterSelect.value = currentFilter;
        
        // Handle sort change
        sortSelect.addEventListener('change', () => {
            updateUrlAndReload();
        });
        
        // Handle filter change
        filterSelect.addEventListener('change', () => {
            updateUrlAndReload();
        });
    }
    
    function updateUrlAndReload() {
        const sort = sortSelect.value;
        const filter = filterSelect.value;
        const currentPage = new URLSearchParams(window.location.search).get('page') || '1';
        
        // Construct new URL with updated parameters
        const newUrl = new URL(window.location.href);
        const params = newUrl.searchParams;
        
        params.set('sort', sort);
        params.set('filter', filter);
        params.set('page', '1'); // Reset to first page when sorting/filtering
        
        // Update URL and reload page
        window.location.href = newUrl.toString();
    }
}); 