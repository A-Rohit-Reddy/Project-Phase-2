const API_KEY = '72b544388cd4251b3736f3600c5dccc0';
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI3MmI1NDQzODhjZDQyNTFiMzczNmYzNjAwYzVkY2NjMCIsInN1YiI6IjY1ZjZlODI2ZDY0YWMyMDE2MzM1ZjJhZiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.zXLhkrLYHWWqGE8qz-7UrCZGOFgJhOXQZ_SVX-_qB3o';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Get movie ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const movieId = urlParams.get('id');
const contentType = urlParams.get('type') || 'movie';

// Log the movie ID for debugging
console.log('Movie ID from URL:', movieId);
console.log('Content type:', contentType);

if (!movieId) {
    console.error('No movie ID provided in URL');
    // Show error message to user
    document.body.innerHTML = `
        <div style="text-align: center; padding: 50px; color: white;">
            <h1>Error</h1>
            <p>No movie ID provided. Please go back and try again.</p>
            <a href="javascript:history.back()" style="color: #1f80e0; text-decoration: none;">
                &larr; Go Back
            </a>
        </div>
    `;
}

// Function to format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Function to format runtime
function formatRuntime(minutes) {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
}

// Function to show error message
function showError(message) {
    document.body.innerHTML = `
        <div style="text-align: center; padding: 50px; color: white;">
            <h1>Error</h1>
            <p>${message}</p>
            <a href="javascript:history.back()" style="color: #1f80e0; text-decoration: none;">
                &larr; Go Back
            </a>
        </div>
    `;
}

// API fetch options with Bearer token
const fetchOptions = {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'accept': 'application/json'
    }
};

// Function to fetch and display movie details
async function fetchMovieDetails() {
    try {
        console.log('Fetching movie details for ID:', movieId);
        
        // Fetch movie details
        const response = await fetch(`${BASE_URL}/${contentType}/${movieId}`, fetchOptions);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const movie = await response.json();
        console.log('Received movie data:', movie);

        if (movie.success === false) {
            throw new Error(movie.status_message || 'Failed to fetch movie details');
        }

        // Update backdrop
        const backdropPath = movie.backdrop_path 
            ? `${IMAGE_BASE_URL}/original${movie.backdrop_path}`
            : './images/no-backdrop.jpg';
        document.querySelector('.hero-backdrop').style.backgroundImage = `url('${backdropPath}')`;

        // Update poster
        const posterPath = movie.poster_path 
            ? `${IMAGE_BASE_URL}/w500${movie.poster_path}`
            : './images/no-poster.jpg';
        document.getElementById('movie-poster').src = posterPath;

        // Update basic info
        document.getElementById('movie-title').textContent = contentType === 'tv' ? movie.name : movie.title;
        document.getElementById('release-year').textContent = contentType === 'tv' 
            ? new Date(movie.first_air_date).getFullYear()
            : new Date(movie.release_date).getFullYear();
        document.getElementById('runtime').textContent = contentType === 'tv'
            ? `${movie.number_of_seasons} Season${movie.number_of_seasons !== 1 ? 's' : ''}`
            : formatRuntime(movie.runtime);
        document.getElementById('rating').textContent = movie.vote_average.toFixed(1);
        document.getElementById('overview').textContent = movie.overview;

        // Update genres
        document.getElementById('genres').textContent = movie.genres.map(genre => genre.name).join(', ');

        // Fetch cast and crew
        const creditsResponse = await fetch(`${BASE_URL}/${contentType}/${movieId}/credits`, fetchOptions);
        const credits = await creditsResponse.json();

        // Update cast
        const castList = document.getElementById('cast-list');
        castList.innerHTML = credits.cast.slice(0, 10).map(actor => `
            <div class="cast-member">
                <div class="cast-image-container">
                    <img src="${actor.profile_path 
                        ? `${IMAGE_BASE_URL}/w185${actor.profile_path}`
                        : './images/no-profile.jpg'}" 
                        alt="${actor.name}" 
                        class="cast-image"
                        onerror="this.onerror=null; this.src='./images/no-profile.jpg';">
                </div>
                <h3>${actor.name}</h3>
                <p>${actor.character}</p>
            </div>
        `).join('');

        // Update crew
        const crewList = document.getElementById('crew-list');
        const directors = credits.crew.filter(person => person.job === 'Director');
        crewList.innerHTML = directors.map(director => `
            <div class="crew-member">
                <div class="crew-image-container">
                    <img src="${director.profile_path 
                        ? `${IMAGE_BASE_URL}/w185${director.profile_path}`
                        : './images/no-profile.jpg'}" 
                        alt="${director.name}" 
                        class="crew-image"
                        onerror="this.onerror=null; this.src='./images/no-profile.jpg';">
                </div>
                <h3>${director.name}</h3>
                <p>Director</p>
            </div>
        `).join('');

        // Fetch similar content
        const similarResponse = await fetch(`${BASE_URL}/${contentType}/${movieId}/similar`, fetchOptions);
        const similarContent = await similarResponse.json();

        // Update similar movies/shows
        const similarContainer = document.getElementById('similar-movies');
        similarContainer.innerHTML = similarContent.results.slice(0, 6).map(item => `
            <div class="movie-card" onclick="window.location.href='movie-details.html?id=${item.id}&type=${contentType}'">
                <div class="movie-poster-container">
                    <img src="${item.poster_path 
                        ? `${IMAGE_BASE_URL}/w342${item.poster_path}`
                        : './images/no-poster.jpg'}" 
                        alt="${contentType === 'tv' ? item.name : item.title}" 
                        class="movie-poster"
                        onerror="this.onerror=null; this.src='./images/no-poster.jpg';">
                    <div class="movie-card-overlay">
                        <div class="movie-card-info">
                            <h3>${contentType === 'tv' ? item.name : item.title}</h3>
                            <div class="movie-meta-info">
                                <span class="year">${new Date(contentType === 'tv' ? item.first_air_date : item.release_date).getFullYear()}</span>
                                <span class="rating"><i class="fas fa-star"></i>${item.vote_average.toFixed(1)}</span>
                            </div>
                            <p class="overview">${item.overview}</p>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // Set up trailer button
        const trailerBtn = document.getElementById('trailer-btn');
        const modal = document.getElementById('trailer-modal');
        const closeModal = document.querySelector('.close-modal');
        const trailerContainer = document.getElementById('trailer-container');

        trailerBtn.addEventListener('click', async () => {
            try {
                const videosResponse = await fetch(`${BASE_URL}/${contentType}/${movieId}/videos`, fetchOptions);
                const videos = await videosResponse.json();
                const trailer = videos.results.find(video => video.type === 'Trailer') || videos.results[0];
                
                if (trailer) {
                    trailerContainer.innerHTML = `
                        <iframe
                            src="https://www.youtube.com/embed/${trailer.key}"
                            frameborder="0"
                            allowfullscreen
                        ></iframe>
                    `;
                    modal.style.display = 'block';
                } else {
                    alert('No trailer available');
                }
            } catch (error) {
                console.error('Error fetching trailer:', error);
                alert('Failed to load trailer');
            }
        });

        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
            trailerContainer.innerHTML = '';
        });

        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
                trailerContainer.innerHTML = '';
            }
        });

        // Update page title
        document.title = `${contentType === 'tv' ? movie.name : movie.title} - Movie Details`;

    } catch (error) {
        console.error('Error fetching movie details:', error);
        showError('Failed to load movie details. Please try again later.');
    }
}

// Initialize page
if (movieId) {
    document.addEventListener('DOMContentLoaded', fetchMovieDetails);
}