// Global variables to store movies and current user list
let allMovies = [];
let currentUserList = null; // Single user list that persists across searches

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    fetchMovies();
    setupEventListeners();
});

// Fetch all movies from the JSON server
function fetchMovies() {
    fetch('http://localhost:3000/movieAndtvShow')
        .then(response => response.json())
        .then(data => {
            allMovies = data; // Store movies in global variable
            console.log('Movies loaded:', allMovies.length);
        })
        .catch(error => console.error('Error fetching movies:', error));
}

// Set up all event listeners
function setupEventListeners() {
    const searchForm = document.getElementById('search-form');
    const resultsDiv = document.getElementById('results');
    const listsContainer = document.getElementById('lists-container');

    // Handle search form submission
    if (searchForm) {
        searchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const searchInput = document.getElementById('default-search');
            if (!searchInput) {
                console.error('Error: #default-search not found in the DOM');
                return;
            }
            const query = searchInput.value.toLowerCase().trim();
            
            if (query) {
                // Filter movies based on search query
                const filteredMovies = allMovies.filter(movie => 
                    movie.name.toLowerCase().includes(query)
                );
                displaySearchResults(filteredMovies);
            }
        });
    }

    // Handle list name changes and movie deletions
    if (listsContainer) {
        listsContainer.addEventListener('change', (event) => {
            // Update list name when user types in the input field
            if (event.target.classList.contains('list-name')) {
                const newName = event.target.value;
                updateCurrentListName(newName);
            }
        });

        listsContainer.addEventListener('click', (event) => {
            // Delete movie from list when delete button is clicked
            if (event.target.classList.contains('delete-movie')) {
                const movieId = parseInt(event.target.dataset.movieId);
                deleteMovieFromCurrentList(movieId);
            }
        });
    }

    // Handle adding movies to list from search results
    if (resultsDiv) {
        resultsDiv.addEventListener('click', (event) => {
            if (event.target.classList.contains('add-to-list')) {
                const movieId = parseInt(event.target.dataset.movieId);
                addMovieToCurrentList(movieId);
            }
        });
    }
}

// Display search results
function displaySearchResults(movies) {
    const resultsDiv = document.getElementById('results');
    if (!resultsDiv) {
        console.error('Error: #results not found in the DOM');
        return;
    }

    // Clear previous results
    resultsDiv.innerHTML = '';

    if (movies.length === 0) {
        resultsDiv.innerHTML = '<p class="text-gray-500">No movies found matching your search.</p>';
        return;
    }

    // Display each movie in search results
    movies.forEach(movie => {
        const posterUrl = movie.poster || './images/default-poster.jpg';
        const movieDiv = document.createElement('div');
        movieDiv.className = 'movie-result mb-4 p-4 bg-white rounded shadow';
        movieDiv.innerHTML = `
            <img src="${posterUrl}" alt="${movie.name}" width="100" class="mb-2">
            <h3 class="text-lg font-semibold">${movie.name}</h3>
            <p>Platform: ${movie.platform}</p>
            <p>Release Year: ${movie.release_year}</p>
            <button class="add-to-list mt-2 px-4 py-2 bg-blue-500 text-white rounded" data-movie-id="${movie.id}">Add to List</button>
        `;
        resultsDiv.appendChild(movieDiv);
    });

    // Create or update the current user list if it doesn't exist
    if (!currentUserList) {
        createNewUserList();
    }
}

// Create a new user list (only called once)
function createNewUserList() {
    const newList = {
        name: 'My Movie List', // Default name, user can edit
        movies: [] // Start with empty array
    };

    fetch('http://localhost:3000/lists', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newList)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(list => {
        console.log('New list created:', list);
        currentUserList = list; // Store the created list
        displayCurrentList(); // Show the empty list
    })
    .catch(error => {
        console.error('Error creating list:', error);
        alert('Failed to create a list. Please check your server connection.');
    });
}

// Display only the current user's list
function displayCurrentList() {
    const listsContainer = document.getElementById('lists-container');
    if (!listsContainer) {
        console.error('Error: #lists-container not found in the DOM');
        return;
    }

    // Clear existing content
    listsContainer.innerHTML = '';

    // If no current list, show nothing
    if (!currentUserList) {
        console.log('No current list to display');
        return;
    }

    // Debug: Check what we have
    console.log('Current list movies:', currentUserList.movies);
    console.log('All movies loaded:', allMovies.length);

    // Create the list display
    const listDiv = document.createElement('div');
    listDiv.className = 'list mb-4 p-4 bg-white rounded shadow';
    
    // Build the movies HTML with better debugging
    const moviesHTML = currentUserList.movies.map(movieId => {
        console.log('Looking for movie ID:', movieId, 'Type:', typeof movieId);
        
        // Make sure we're comparing the right types
        const movie = allMovies.find(m => m.id == movieId); // Use == instead of === for type flexibility
        
        if (!movie) {
            console.log('Movie not found for ID:', movieId);
            return ''; // Skip if movie not found
        }
        
        console.log('Found movie:', movie.name);
        const posterUrl = movie.poster || './images/default-poster.jpg';
        return `
            <div class="movie-item flex items-center justify-between p-2 border-b">
                <div class="flex items-center">
                    <img src="${posterUrl}" alt="${movie.name}" width="50" class="mr-2">
                    <div>
                        <span class="font-medium">${movie.name}</span>
                        <p class="text-sm text-gray-600">${movie.platform} • ${movie.release_year}</p>
                    </div>
                </div>
                <button class="delete-movie px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600" data-movie-id="${movie.id}">Delete</button>
            </div>
        `;
    }).join('');

    // Show debug info in console
    console.log('Generated movies HTML length:', moviesHTML.length);

    listDiv.innerHTML = `
        <div class="mb-3">
            <input type="text" value="${currentUserList.name}" class="list-name w-full p-2 border rounded font-semibold" placeholder="Enter list name">
        </div>
        <div class="movies">
            ${moviesHTML || '<p class="text-gray-500 text-center py-4">No movies in your list yet. Search and add some!</p>'}
        </div>
        <div class="mt-2 text-sm text-gray-500">
            Movies in list: ${currentUserList.movies.length}
        </div>
    `;

    listsContainer.appendChild(listDiv);
}

// Update the current list name
function updateCurrentListName(newName) {
    if (!currentUserList) return;

    currentUserList.name = newName; // Update local data immediately

    fetch(`http://localhost:3000/lists/${currentUserList.id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newName })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        console.log('List name updated successfully');
    })
    .catch(error => {
        console.error('Error updating list name:', error);
    });
}

// Add a movie to the current list
function addMovieToCurrentList(movieId) {
    if (!currentUserList) {
        console.error('No current list available');
        alert('Please search for movies first to create a list.');
        return;
    }

    // Ensure we have movies loaded
    if (allMovies.length === 0) {
        console.error('Movies not loaded yet');
        alert('Movies are still loading. Please wait and try again.');
        return;
    }

    // Check if movie is already in the list
    if (currentUserList.movies.includes(movieId)) {
        alert('This movie is already in your list!');
        return;
    }

    // Debug: Check what we're adding
    console.log('Adding movie ID:', movieId, 'to list:', currentUserList.id);
    console.log('Current movies in list:', currentUserList.movies);

    // Add movie to local list immediately
    currentUserList.movies.push(movieId);

    // Update the server
    fetch(`http://localhost:3000/lists/${currentUserList.id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ movies: currentUserList.movies })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Server response after adding movie:', data);
        console.log('Movie added to list successfully');
        displayCurrentList(); // Refresh the list display
    })
    .catch(error => {
        console.error('Error adding movie to list:', error);
        // Remove movie from local list if server update failed
        currentUserList.movies = currentUserList.movies.filter(id => id !== movieId);
        alert('Failed to add movie to list. Please try again.');
    });
}

// Delete a movie from the current list
function deleteMovieFromCurrentList(movieId) {
    if (!currentUserList) return;

    // Remove movie from local list immediately
    currentUserList.movies = currentUserList.movies.filter(id => id !== movieId);

    // Update the server
    fetch(`http://localhost:3000/lists/${currentUserList.id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ movies: currentUserList.movies })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        console.log('Movie deleted from list successfully');
        displayCurrentList(); // Refresh the list display
    })
    .catch(error => {
        console.error('Error deleting movie from list:', error);
        // Add movie back to local list if server update failed
        currentUserList.movies.push(movieId);
        alert('Failed to delete movie from list. Please try again.');
    });
}