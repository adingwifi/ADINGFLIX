    // Execute when the DOM content is fully loaded
    document.addEventListener("DOMContentLoaded", () => {
    // API key and base URL for movie images
    const api_key = "b3ed38e76b5ff721c6199860fd2e1b0f";
    const imageBaseURL = "https://image.tmdb.org/t/p/";

    // DOM elements
    const playerContainer = document.getElementById("moviePlayerContainer");
    const backButton = document.getElementById("backButton");
    const addToListButton = document.getElementById("addToListButton");
    const searchContainer = document.getElementById("searchContainer");
    const searchInput = document.getElementById("searchInput");
    const searchButton = document.getElementById("searchButton");
    const movieTitleElement = document.getElementById("movieTitle");
    const movieOverviewElement = document.getElementById("movieOverview");
    const movieReleaseDateElement = document.getElementById("movieReleaseDate");
    const movieRatingElement = document.getElementById("movieRating");
    
    // Variables
    let currentMovie; // To store currently selected movie
    const myList = {}; // To store the list of saved movies

    // Load My List from local storage if available
const savedList = localStorage.getItem("myList");
if (savedList) {
    Object.assign(myList, JSON.parse(savedList));
    const myListContainer = document.getElementById("movies-list");
    // Fetch poster images for movies in myList and add them to the container
    Promise.all(
        Object.values(myList).map(movie => {
            const movieURL = `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${api_key}&language=en-US`;
            return fetch(movieURL)
                .then(response => {
                    if (!response.ok) {
                        throw new Error("Network response was not ok");
                    }
                    return response.json();
                })
                .then(data => addMovieToContainer(data, myListContainer, 'list'))
                .catch(error => console.error("Error fetching movie:", error));
        })
    ).then(() => console.log("All movies added to My List container"));
}

    // Sections and their corresponding IDs
    const sections = {
        search: "movies-search",
        list: "movies-list",
        trending: "movies-trending",
        recommend: "movies-recommend",
        toprated: "movies-toprated",
        popular: "movies-popular",
        series: "series-picks"
    };

    // URLs for different sections
    const urls = {
        popular: `https://api.themoviedb.org/3/discover/movie?api_key=${api_key}&sort_by=popularity.desc`,
        trending: `https://api.themoviedb.org/3/trending/movie/week?api_key=${api_key}`,
        toprated: `https://api.themoviedb.org/3/movie/top_rated?api_key=${api_key}&region=PH`,
        recommend: `https://api.themoviedb.org/3/movie/popular?api_key=${api_key}`, // Placeholder for recommendations
        series: `https://api.themoviedb.org/3/tv/popular?api_key=${api_key}`
    };

    // Function to fetch movies from API
    function fetchMovies(url, section) {
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then(data => {
                const container = document.getElementById(sections[section]);
                container.innerHTML = "";
                const results = data.results.filter(item => item.poster_path);
                if (results.length > 0) {
                    container.parentElement.style.display = "block"; // Show section if results are found
                    results.forEach(item => addMovieToContainer(item, container, section));
                } else if (section === "search") {
                    container.parentElement.style.display = "none"; // Hide search section if no results
                }
            })
            .catch(error => {
                console.error("Error:", error.message);
            });
    }

    // Function to add movie to container
function addMovieToContainer(item, container, section) {
    console.log("Adding movie to container:", item);
    const movieListItem = document.createElement("div");
    const movieImg = document.createElement("img");
    console.log("Poster path:", item.poster_path);
    if (item.poster_path) {
        movieImg.src = `${imageBaseURL}/w342${item.poster_path}`;
    } else {
        console.log("No poster path found for:", item);
        movieImg.src = "https://via.placeholder.com/150"; // Placeholder image if no poster available
    }
    console.log("Image source:", movieImg.src);
    movieImg.alt = item.title || item.name; // Handle title for both movies and TV series
    movieImg.className = "movie-img";
    movieImg.setAttribute("data-movie-id", item.id);
    movieImg.setAttribute("data-movie-rating", item.vote_average); // Add rating data attribute
    movieImg.setAttribute("data-section", section); // Add section data attribute to differentiate between movies and series
    movieImg.addEventListener("click", playMedia);

    // Create elements for title and rating
    const titleElement = document.createElement("h3");
    titleElement.textContent = item.title || item.name; // Handle title for both movies and TV series
    titleElement.className = "movie-title";

    const ratingElement = document.createElement("p");
    ratingElement.textContent = `Rating: ${item.vote_average}/10`;
    ratingElement.className = "movie-rating";

    // Append movie poster, title, and rating to movie list item
    movieListItem.appendChild(movieImg);
    movieListItem.appendChild(titleElement);
    movieListItem.appendChild(ratingElement);

    container.appendChild(movieListItem);
}


    // Function to play media (movie or series)
    function playMedia(event) {
        const mediaId = event.target.getAttribute("data-movie-id");
        const mediaTitle = event.target.alt;
        const mediaRating = event.target.getAttribute("data-movie-rating");
        const mediaSection = event.target.getAttribute("data-section");
        let iframeSrc;

        // Set iframe source based on section
        if (mediaSection === "series") {
            iframeSrc = `https://vidsrc.me/embed/tv?tmdb=${mediaId}`; // Correct URL for TV series
        } else {
            iframeSrc = `https://vidsrc.me/embed/movie?tmdb=${mediaId}`;
        }

        const videoFrame = document.getElementById("videoFrame");
        videoFrame.src = iframeSrc;
        movieTitleElement.textContent = mediaTitle;
        fetchMediaDetails(mediaId, mediaSection);
        document.getElementById("movielist").style.display = "none"; // Hide the movielist section
        playerContainer.classList.remove("hidden");
        searchContainer.classList.add("hidden");
        currentMovie = { id: mediaId, title: mediaTitle, poster_path: event.target.src, vote_average: mediaRating }; // Assign rating
        updateListButton();
    }

    // Function to fetch media details
    function fetchMediaDetails(mediaId, section) {
        let detailsUrl;
        if (section === "series") {
            detailsUrl = `https://api.themoviedb.org/3/tv/${mediaId}?api_key=${api_key}&language=en-US`;
        } else {
            detailsUrl = `https://api.themoviedb.org/3/movie/${mediaId}?api_key=${api_key}&language=en-US`;
        }

        fetch(detailsUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then(media => {
                movieOverviewElement.textContent = media.overview ? `Overview: ${media.overview}` : "No overview available.";
                movieReleaseDateElement.textContent = media.release_date ? `Release Date: ${media.release_date}` : media.first_air_date ? `First Air Date: ${media.first_air_date}` : "Release Date: N/A";
                movieRatingElement.textContent = media.vote_average ? `Rating: ${media.vote_average}/10` : "Rating: N/A";
           
            })
            .catch(error => {
                console.error("Error:", error.message);
                movieOverviewElement.textContent = "No overview available.";
                movieReleaseDateElement.textContent = "Release Date: N/A";
                movieRatingElement.textContent = "Rating: N/A";
            });
    }

    // Function to add movie to My List
    function addToMyList() {
        if (currentMovie) {
            myList[currentMovie.id] = currentMovie;
            updateLocalStorage(); // Update local storage
            const myListContainer = document.getElementById("movies-list");
            addMovieToContainer(currentMovie, myListContainer, 'list');
            updateListButton();
        }
    }

    // Function to remove movie from My List
    function removeFromMyList() {
        if (currentMovie && myList[currentMovie.id]) {
            delete myList[currentMovie.id];
            updateLocalStorage(); // Update local storage
            const myListContainer = document.getElementById("movies-list");
            myListContainer.innerHTML = '';
            Object.values(myList).forEach(movie => addMovieToContainer(movie, myListContainer, 'list'));
            updateListButton();
        }
    }

    // Function to update local storage with My List
    function updateLocalStorage() {
        localStorage.setItem("myList", JSON.stringify(myList));
    }

    // Function to update Add to My List button
    function updateListButton() {
        if (currentMovie && myList[currentMovie.id]) {
            addToListButton.textContent = "Remove from My Favorite";
            addToListButton.removeEventListener("click", addToMyList);
            addToListButton.addEventListener("click", removeFromMyList);
        } else {
            addToListButton.textContent = "Add to My Favorite";
            addToListButton.removeEventListener("click", removeFromMyList);
            addToListButton.addEventListener("click", addToMyList);
        }

        // Hide sections when movie player is shown
        const sectionsToHide = ["movies-search", "movies-list", "movies-trending", "movies-recommend", "movies-toprated", "movies-popular", "series"];
        if (!playerContainer.classList.contains("hidden")) {
            sectionsToHide.forEach(section => {
                const container = document.getElementById(sections[section]);
                if (container) { // Check if the container exists
                    container.classList.add("hidden");
                }
            });
        }
    }

    // Event listener for back button
    backButton.addEventListener("click", () => {
        document.querySelectorAll('.movie-list').forEach(list => list.classList.remove("hidden"));
        playerContainer.classList.add("hidden");
        searchContainer.classList.remove("hidden");
        document.getElementById("movielist").style.display = "block"; // Show the movielist section
        updateListButton();
    });

    // Event listener for search button
    searchButton.addEventListener("click", () => {
        const query = searchInput.value.trim();
        if (query) {
            const searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${api_key}&query=${encodeURIComponent(query)}`;
            fetchMovies(searchUrl, "search");
        }
    });

    // Fetch and display movies for each section
    fetchMovies(urls.popular, "popular");
    fetchMovies(urls.trending, "trending");
    fetchMovies(urls.toprated, "toprated");
    fetchMovies(urls.recommend, "recommend");
    fetchMovies(urls.series, "series");
});
