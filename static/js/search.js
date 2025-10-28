// Search functionality for Hugo site
(function() {
    'use strict';
    
    let searchIndex = [];
    let isIndexLoaded = false;

    // Load search index
    async function loadSearchIndex() {
        try {
            const response = await fetch('/search-index.json');
            const data = await response.json();
            searchIndex = data.posts || [];
            isIndexLoaded = true;
        } catch (error) {
            console.error('Error loading search index:', error);
        }
    }

    // Simple text matching search function
    function searchPosts(query) {
        if (!query || query.length < 2) {
            return [];
        }

        const queryLower = query.toLowerCase();
        const results = [];

        searchIndex.forEach(post => {
            const titleMatch = post.title.toLowerCase().includes(queryLower);
            const summaryMatch = post.summary.toLowerCase().includes(queryLower);
            const contentMatch = post.content.toLowerCase().includes(queryLower);

            if (titleMatch || summaryMatch || contentMatch) {
                let score = 0;
                if (titleMatch) score += 10;
                if (summaryMatch) score += 5;
                if (contentMatch) score += 1;

                results.push({
                    ...post,
                    score: score
                });
            }
        });

        // Sort by relevance
        results.sort((a, b) => b.score - a.score);
        return results.slice(0, 5); // Limit to 5 results
    }

    // Highlight search terms in text
    function highlightText(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    // Display search results
    function displayResults(results, query) {
        const resultsContainer = document.getElementById('search-results');
        
        if (results.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">No results found.</div>';
            return;
        }

        const resultsHTML = results.map(post => `
            <a href="${post.url}" class="search-result-item">
                <div class="search-result-title">${highlightText(post.title, query)}</div>
                <div class="search-result-summary">${highlightText(post.summary, query)}</div>
                <div class="search-result-date">${post.date}</div>
            </a>
        `).join('');

        resultsContainer.innerHTML = resultsHTML;
    }

    // Initialize search when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        const searchInput = document.getElementById('search-input');
        const searchResults = document.getElementById('search-results');

        // Load search index
        loadSearchIndex();

        // Handle search input
        let searchTimeout;
        searchInput.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            
            const query = e.target.value.trim();

            if (query.length < 2) {
                searchResults.innerHTML = '';
                searchResults.classList.remove('show');
                return;
            }

            searchTimeout = setTimeout(() => {
                if (!isIndexLoaded) {
                    searchResults.innerHTML = '<div class="no-results">Loading...</div>';
                    searchResults.classList.add('show');
                    // Wait a bit more for index to load
                    setTimeout(() => {
                        if (isIndexLoaded) {
                            const results = searchPosts(query);
                            displayResults(results, query);
                            searchResults.classList.add('show');
                        }
                    }, 100);
                    return;
                }

                const results = searchPosts(query);
                displayResults(results, query);
                searchResults.classList.add('show');
            }, 150);
        });

        // Close results when clicking outside
        document.addEventListener('click', function(e) {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.classList.remove('show');
                searchInput.value = '';
                searchResults.innerHTML = '';
            }
        });

        // Handle keyboard navigation
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                searchResults.classList.remove('show');
                searchInput.value = '';
                searchResults.innerHTML = '';
            }
        });
    });
})();

