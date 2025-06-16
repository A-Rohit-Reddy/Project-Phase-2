let movies = [
  {
    name: "Loki",
    des: "Loki is an American television series created by Michael Waldron for the streaming service Disney.",
    image: "./videos/marvel.mp4",
  },
  {
    name: "Leo",
    des: "Falcon and the Winter Soldier is an American television series created for the streaming platform Disney+.",
    image: "./videos/leo1.mp4",
  },
  {
    name: "Chhaava",
    des: "WandaVision is an American television series created for the streaming service Disney+.",
    image: "./videos/chava.mp4",
  },
  {
    name: "Salaar",
    des: "Raya and the Last Dragon is an animated Disney film released in 2021.",
    image: "./videos/salaar.mp4",
  },
  {
    name: "Kantara",
    des: "Luca is a Disney-Pixar animated film released in 2021.",
    image: "./videos/kantara.mp4",
  },
];

// === Carousel Logic ===
const carousel = document.querySelector(".carousel");
let sliders = [];
let slideIndex = 0;

const createSlide = () => {
  if (slideIndex >= movies.length) {
    slideIndex = 0;
  }

  const slide = document.createElement("div");
  const content = document.createElement("div");
  const h1 = document.createElement("h1");
  const p = document.createElement("p");

  const currentMovie = movies[slideIndex];
  const isVideo = currentMovie.image.endsWith(".mp4");

  let mediaElement;
  if (isVideo) {
    mediaElement = document.createElement("video");
    mediaElement.src = currentMovie.image;
    mediaElement.autoplay = true;
    mediaElement.loop = true;
    mediaElement.muted = true;
    mediaElement.classList.add("slide-video");

    // Make Salaar and Marvel videos larger
    if (
      currentMovie.name === "Raya and the Last Dragon" ||
      currentMovie.name === "Loki"
    ) {
      mediaElement.classList.add("large-video");
    }
  } else {
    mediaElement = document.createElement("img");
    mediaElement.src = currentMovie.image;
  }

  h1.textContent = currentMovie.name;
  p.textContent = currentMovie.des;

  content.appendChild(h1);
  content.appendChild(p);
  slide.appendChild(content);
  slide.appendChild(mediaElement);
  carousel.appendChild(slide);

  slide.className = "slider";
  content.className = "slide-content";
  h1.className = "movie-title";
  p.className = "movie-des";

  sliders.push(slide);

  if (sliders.length > 1) {
    sliders[0].style.marginLeft = `calc(-${100 * (sliders.length - 2)}% - ${
      30 * (sliders.length - 2)
    }px)`;
  }

  slideIndex++;
};

// Load initial slides
for (let i = 0; i < 3; i++) {
  createSlide();
}

// Add new slide every 3 seconds
setInterval(createSlide, 3000);

// === Video Card Hover Play ===
const videoCards = document.querySelectorAll(".video-card");

videoCards.forEach((card) => {
  const video = card.querySelector("video");
  if (video) {
    card.addEventListener("mouseover", () => video.play());
    card.addEventListener("mouseleave", () => video.pause());
  }
});

// === Card Slider Logic ===
const cardContainers = document.querySelectorAll(".card-container");
const preBtns = document.querySelectorAll(".pre-btn");
const nxtBtns = document.querySelectorAll(".nxt-btn");

preBtns.forEach((btn, index) => {
  btn.addEventListener("click", () => {
    cardContainers[index].scrollLeft -= cardContainers[index].clientWidth;
  });
});

nxtBtns.forEach((btn, index) => {
  btn.addEventListener("click", () => {
    cardContainers[index].scrollLeft += cardContainers[index].clientWidth;
  });
});

// === Movie Search with TMDB API ===
const apiKey = '72b544388cd4251b3736f3600c5dccc0';
const apiBase = 'https://api.themoviedb.org/3';

async function searchMovie(query) {
  try {
    const res = await fetch(`${apiBase}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&append_to_response=credits,videos`);
    const data = await res.json();
    return data.results[0];
  } catch (err) {
    console.error("Search failed:", err);
    return null;
  }
}

function handleSearchSubmit(event) {
  event.preventDefault();
  const query = document.getElementById("searchInput").value.trim();
  if (!query) return alert("Please enter a movie name.");

  searchMovie(query).then((movie) => {
    if (movie) {
      window.location.href = `movie-details.html?id=${movie.id}`;
    } else {
      alert("Movie not found!");
    }
  });
}

const searchForm = document.getElementById("searchForm");
if (searchForm) {
  searchForm.addEventListener("submit", handleSearchSubmit);
}

// Search Functionality
const searchInput = document.getElementById('searchInput');
const suggestionsList = document.getElementById('suggestions');
const imageBase = 'https://image.tmdb.org/t/p/w500';

let searchTimeout;

searchInput.addEventListener('input', (e) => {
  const query = e.target.value.trim();
  
  // Clear previous timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  // Hide suggestions if query is too short
  if (query.length < 2) {
    suggestionsList.style.display = 'none';
    return;
  }

  // Add debounce to prevent too many API calls
  searchTimeout = setTimeout(async () => {
    try {
      const response = await fetch(
        `${apiBase}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&include_adult=false`
      );
      const data = await response.json();
      
      // Get top 8 results
      const movies = data.results.slice(0, 8);
      renderSuggestions(movies);
      suggestionsList.style.display = movies.length ? 'block' : 'none';
    } catch (error) {
      console.error('Search error:', error);
      suggestionsList.style.display = 'none';
    }
  }, 300);
});

function renderSuggestions(movies) {
  suggestionsList.innerHTML = '';
  
  if (movies.length === 0) {
    suggestionsList.innerHTML = '<li class="no-results">No movies found</li>';
    return;
  }
  
  movies.forEach(movie => {
    const li = document.createElement('li');
    const posterPath = movie.poster_path 
      ? `${imageBase}${movie.poster_path}`
      : 'https://via.placeholder.com/92x138/1e293b/ffffff?text=No+Image';
    
    li.innerHTML = `
      <div class="suggestion-item" onclick="window.location.href='movie-details.html?id=${movie.id}'">
        <img src="${posterPath}" alt="${movie.title}" class="suggestion-poster" onerror="this.src='https://via.placeholder.com/92x138/1e293b/ffffff?text=No+Image'">
        <div class="suggestion-info">
          <h4>${movie.title}</h4>
          <div class="suggestion-meta">
            <span>${movie.release_date?.slice(0, 4) || 'N/A'}</span>
            ${movie.vote_average ? `
              <span class="rating">
                <i class="fas fa-star"></i>
                ${movie.vote_average.toFixed(1)}
              </span>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    suggestionsList.appendChild(li);
  });
}

// Close suggestions when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-container')) {
    suggestionsList.style.display = 'none';
  }
});

// Prevent suggestions from closing when clicking inside
suggestionsList.addEventListener('click', (e) => {
  e.stopPropagation();
});



