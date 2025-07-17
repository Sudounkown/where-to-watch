// Global variables to store movies and lists data
let allMovies = [];
let allLists = [];
let currentListId = null; // Track the current auto-generated list

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    fetchMovies();
    fetchLists();
    setupEventListeners();
});

// Fetch all movies from the JSON server
function fetchMovies() {
    fetch('http://localhost:3000/movieAndtvShow')
        .then(response => response.json())
        .then(data => {
            allMovies = data; // Store movies in global variable
        })
        .catch(error => console.error('Error fetching movies:', error));
}

// Fetch all lists from the JSON server
function fetchLists() {
    fetch('http://localhost:3000/lists')
        .then(response => response.json())
        .then(data => {
            // Ensure data is an array; if not, log an error and set allLists to an empty array
            if (!Array.isArray(data)) {
                console.error('Expected an array for lists, got:', data);
                allLists = [];
            } else {
                // Normalize each list to have a movies array, defaulting to empty if undefined
                allLists = data.map(list => ({ ...list, movies: list.movies || [] }));
            }
            displayLists();
        })
        .catch(error => console.error('Error fetching lists:', error));
}

// Display all lists in the lists-container
function displayLists() {
    const listsContainer = document.getElementById('lists-container');
    if (!listsContainer) {
        console.error('Error: #lists-container not found in the DOM');
        return;
    }
    listsContainer.innerHTML = ''; // Clear existing content
    allLists.forEach(list => {
        const listDiv = document.createElement('div');
        listDiv.className = 'list mb-4 p-2 bg-white rounded shadow';
        listDiv.innerHTML = `
            <input type="text" value="${list.name}" class="list-name w-full p-1 border rounded" data-id="${list.id}">
            <div class="movies mt-2">
                ${list.movies.map(movieId => {
                    const movie = allMovies.find(m => m.id === movieId);
                    const posterUrl = movie ? (movie.poster || './images/default-poster.jpg') : './images/default-poster.jpg';
                    return movie ? `
                        <div class="movie-item flex items-center justify-between p-2 border-b">
                            <div class="flex items-center">
                                <img src="${posterUrl}" alt="${movie.name}" width="50" class="mr-2">
                                <span>${movie.name}</span>
                            </div>
                            <button class="delete-movie text-red-500" data-list-id="${list.id}" data-movie-id="${movie.id}">Delete</button>
                        </div>
                    ` : '';
                }).join('')}
            </div>
        `;
        listsContainer.appendChild(listDiv);
    });
}

// Set up all event listeners with safety checks
function setupEventListeners() {
    const searchForm = document.getElementById('search-form');
    const resultsDiv = document.getElementById('results');
    const listsContainer = document.getElementById('lists-container');

    if (searchForm) {
        searchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const searchInput = document.getElementById('default-search');
            if (!searchInput) {
                console.error('Error: #default-search not found in the DOM');
                return;
            }
            const query = searchInput.value.toLowerCase();
            const filteredMovies = allMovies.filter(movie => movie.name.toLowerCase().includes(query));
            displaySearchResults(filteredMovies);
        });
    } else {
        console.error('Error: #search-form not found in the DOM');
    }

    if (listsContainer) {
        listsContainer.addEventListener('change', (event) => {
            if (event.target.classList.contains('list-name')) {
                const listId = event.target.dataset.id;
                const newName = event.target.value;
                updateListName(listId, newName);
            }
        });

        listsContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('delete-movie')) {
                const listId = event.target.dataset.listId;
                const movieId = parseInt(event.target.dataset.movieId);
                deleteMovieFromList(listId, movieId);
            }
        });
    } else {
        console.error('Error: #lists-container not found in the DOM');
    }

    if (resultsDiv) {
        resultsDiv.addEventListener('click', (event) => {
            if (event.target.classList.contains('add-to-list')) {
                const movieId = parseInt(event.target.dataset.movieId);
                addMovieToCurrentList(movieId);
            }
        });
    } else {
        console.error('Error: #results not found in the DOM');
    }
}

// Display search results with fallback for posters
function displaySearchResults(movies) {
    const resultsDiv = document.getElementById('results');
    if (!resultsDiv) {
        console.error('Error: #results not found in the DOM');
        return;
    }
    resultsDiv.innerHTML = '';
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

    // Auto-generate a list with these results if there are any
    if (movies.length > 0) {
        autoGenerateList(movies);
    }
}

// Auto-generate a new list with search results and error handling
function autoGenerateList(movies) {
    const movieIds = movies.map(movie => movie.id);
    const newList = {
        name: 'New List', // Default name, editable by user
        movies: movieIds
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
        console.log('List created:', list); // Debug: Check the response
        allLists.push(list);
        currentListId = list.id; // Set this as the current list
        displayLists(); // Update the UI
    })
    .catch(error => {
        console.error('Error creating list:', error);
        alert('Failed to create a list. Check the console and server.');
    });
}

// Update the name of a list
function updateListName(listId, newName) {
    fetch(`http://localhost:3000/lists/${listId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newName })
    })
    .then(() => {
        const list = allLists.find(l => l.id == listId);
        list.name = newName; // Update local data
    })
    .catch(error => console.error('Error updating list name:', error));
}

// Delete a movie from a list
function deleteMovieFromList(listId, movieId) {
    const list = allLists.find(l => l.id == listId);
    list.movies = list.movies.filter(id => id !== movieId);
    fetch(`http://localhost:3000/lists/${listId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ movies: list.movies })
    })
    .then(() => {
        displayLists(); // Refresh the lists display
    })
    .catch(error => console.error('Error deleting movie:', error));
}

// Add a movie to the current auto-generated list with checks
function addMovieToCurrentList(movieId) {
    if (!currentListId) {
        console.error('No current list ID. Search failed to create a list.');
        alert('Please search for movies first to generate a list.');
        return;
    }
    const list = allLists.find(l => l.id == currentListId);
    if (!list) {
        console.log('Item not found');
        return;
    }
    if (!list.movies.includes(movieId)) {
        list.movies.push(movieId);
        fetch(`http://localhost:3000/lists/${currentListId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ movies: list.movies })
        })
        .then(() => {
            displayLists(); // Refresh the lists display
        })
        .catch(error => console.error('Error adding movie:', error));
    }
}