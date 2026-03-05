let input = document.getElementById("input-box");
let button = document.getElementById("submit-button");
let showContainer = document.getElementById("show-container");
let listContainer = document.querySelector(".list");

// SuperHero API Configuration
// Get your free API access token from: https://superheroapi.com/index.html
const API_ACCESS_TOKEN = "YOUR_API_TOKEN_HERE"; // Replace with your actual token
const BASE_URL = `https://superheroapi.com/api/${API_ACCESS_TOKEN}`;

// Cache for storing character details
let characterCache = {};

function displayWords(value) {
  input.value = value;
  removeElements();
}

function removeElements() {
  listContainer.innerHTML = "";
}

// Autocomplete: search for superheroes based on user input
input.addEventListener("keyup", async () => {
  removeElements();
  if (input.value.length < 2) {
    return;
  }

  const searchTerm = input.value.trim();
  const url = `${BASE_URL}/search/${encodeURIComponent(searchTerm)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return;

    const data = await response.json();

    if (data.response === "success" && data.results) {
      data.results.forEach(char => {
        characterCache[char.name.toLowerCase()] = char;
      });

      const suggestions = data.results.slice(0, 5);
      suggestions.forEach(character => {
        let name = character.name;
        let div = document.createElement("div");
        div.style.cursor = "pointer";
        div.classList.add("autocomplete-items");
        div.setAttribute("onclick", `displayWords('${name.replace(/'/g, "\\'")}')`);

        const matchIndex = name.toLowerCase().indexOf(searchTerm.toLowerCase());
        let word;
        if (matchIndex !== -1) {
          word = name.substr(0, matchIndex) +
                 "<b>" + name.substr(matchIndex, searchTerm.length) + "</b>" +
                 name.substr(matchIndex + searchTerm.length);
        } else {
          word = name;
        }
        div.innerHTML = `<p class="item">${word}</p>`;
        listContainer.appendChild(div);
      });
    }
  } catch (error) {
    console.error("Error:", error);
  }
});

// Button click: fetch and display the superhero character details
button.addEventListener("click", async () => {
  if (input.value.trim().length < 1) {
    alert("Input cannot be blank");
    return;
  }

  showContainer.innerHTML = "<p style='color:#aaa'>Loading...</p>";
  removeElements();

  const searchTerm = input.value.trim();

  try {
    let character = characterCache[searchTerm.toLowerCase()];

    if (!character) {
      const url = `${BASE_URL}/search/${encodeURIComponent(searchTerm)}`;
      const response = await fetch(url);
      if (!response.ok) {
        showContainer.innerHTML = "<p style='color:#fff'>Error connecting to API</p>";
        return;
      }

      const data = await response.json();

      if (data.response === "success" && data.results) {
        character = data.results.find(
          c => c.name.toLowerCase() === searchTerm.toLowerCase()
        ) || data.results[0];
        characterCache[character.name.toLowerCase()] = character;
      } else {
        showContainer.innerHTML = "<p style='color:#fff'>Character not found</p>";
        return;
      }
    }

    const imageUrl = character.image?.url || "";
    const fullName = character.biography?.["full-name"] || character.name;
    const publisher = character.biography?.publisher || "Unknown";
    const alignment = character.biography?.alignment || "Unknown";
    const gender = character.appearance?.gender || "N/A";
    const race = character.appearance?.race || "N/A";
    const firstAppearance = character.biography?.["first-appearance"] || "Unknown";

    showContainer.innerHTML = `
      <div class="card-container">
        <img src="${imageUrl}" alt="${character.name}" onerror="this.src='https://via.placeholder.com/300x220?text=No+Image'" />
        <div class="character-name">${character.name}</div>
        <div class="info-list">
          <div class="info-row">
            <span class="info-label">Full name:</span>
            <span class="info-value">${fullName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Publisher:</span>
            <span class="info-value">${publisher}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Alignment:</span>
            <span class="info-value">${alignment}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Gender:</span>
            <span class="info-value">${gender}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Race:</span>
            <span class="info-value">${race}</span>
          </div>
          <div class="info-row">
            <span class="info-label">First appearance:</span>
            <span class="info-value">${firstAppearance}</span>
          </div>
        </div>
        <div class="character-id-badge">ID: ${character.id}</div>
      </div>`;
  } catch (error) {
    console.error("Error:", error);
    showContainer.innerHTML = "<p style='color:#fff'>Error fetching character data</p>";
  }
});

// Load a random SuperHero character name on page load
window.onload = async () => {
  try {
    const randomId = Math.floor(Math.random() * 731) + 1;
    const response = await fetch(`${BASE_URL}/${randomId}`);
    const data = await response.json();
    if (data.response === "success" && data.name) {
      input.value = data.name;
      characterCache[data.name.toLowerCase()] = data;
    }
  } catch (error) {
    console.error("Error loading initial character:", error);
  }
};
