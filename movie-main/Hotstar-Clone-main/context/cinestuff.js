const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const queryType = document.getElementById('query-type');

// Using OMDB API
const OMDB_API_KEY = '3b907cd0'; // Get your API key from http://www.omdbapi.com/

async function handleUserInput() {
    const movieName = userInput.value.trim();
    const type = queryType.value;
    
    if (!movieName) {
        appendMessage('Bot', "Please enter a movie name!");
        return;
    }

    // Add user message
    appendMessage('User', movieName);
    userInput.value = '';

    // Show loading message
    const loadingId = appendMessage('Bot', "🔍 Searching for movie information...");

    try {
        // Search with exact title
        const searchUrl = `http://www.omdbapi.com/?t=${encodeURIComponent(movieName)}&type=movie&plot=full&apikey=${OMDB_API_KEY}`;
        console.log('Fetching from:', searchUrl); // Debug log
        
        const response = await fetch(searchUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('API Response:', data); // Debug log

        // Remove loading message
        loadingId.remove();

        if (data.Response === "False") {
            // Try searching with less strict parameters
            const retryUrl = `http://www.omdbapi.com/?s=${encodeURIComponent(movieName)}&apikey=${OMDB_API_KEY}`;
            const retryResponse = await fetch(retryUrl);
            const retryData = await retryResponse.json();
            
            if (retryData.Response === "True" && retryData.Search && retryData.Search.length > 0) {
                // Found similar movies
                const suggestions = retryData.Search.slice(0, 3)
                    .map(movie => `${movie.Title} (${movie.Year})`)
                    .join('\n');
                appendMessage('Bot', `I couldn't find exact match for "${movieName}". Did you mean:\n${suggestions}\n\nPlease try with the exact movie name.`);
            } else {
                appendMessage('Bot', `Sorry, I couldn't find the movie "${movieName}". Please check the spelling or try another movie!`);
            }
            return;
        }

        let reply = '';
        switch (type) {
            case 'rating':
                if (data.Ratings && data.Ratings.length > 0) {
                    const ratings = data.Ratings.map(r => `${r.Source}: ${r.Value}`).join('\n');
                    reply = `Here are the ratings for "${data.Title}" (${data.Year}):\n${ratings}`;
                } else {
                    reply = `Sorry, no ratings found for "${data.Title}" (${data.Year}).`;
                }
                break;
            case 'cast':
                reply = `The main cast of "${data.Title}" (${data.Year}) includes:\n${data.Actors}`;
                if (data.Director !== "N/A") {
                    reply += `\n\nDirector: ${data.Director}`;
                }
                break;
            case 'review':
                reply = `About "${data.Title}" (${data.Year}):\n${data.Plot}`;
                if (data.Genre !== "N/A") {
                    reply += `\n\nGenre: ${data.Genre}`;
                }
                break;
            case 'age':
                reply = `"${data.Title}" (${data.Year}) is rated ${data.Rated}`;
                if (data.Runtime !== "N/A") {
                    reply += `\nRuntime: ${data.Runtime}`;
                }
                break;
        }

        appendMessage('Bot', reply);
    } catch (error) {
        // Remove loading message
        loadingId.remove();
        console.error('API Error:', error); // Debug log
        appendMessage('Bot', "Sorry, there was an error connecting to the movie database. Please try again in a moment!");
    }
}

function appendMessage(sender, message) {
    const messageDiv = document.createElement('div');
    messageDiv.innerHTML = `<b>${sender}:</b> ${message.replace(/\n/g, '<br>')}`;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return messageDiv;
}

// Handle Enter key press
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleUserInput();
    }
});

// Handle button click
document.querySelector('button[onclick="handleUserInput()"]').addEventListener('click', handleUserInput); 