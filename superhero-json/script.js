let input = document.getElementById("input-box");
let button = document.getElementById("submit-button");
let showContainer = document.getElementById("show-container");
let listContainer = document.getElementById("autocomplete-list");

let characters = [];
let currentCharacter = null;

// Load local JSON data and auto-show list
fetch("superhero_characters.json")
  .then((response) => response.json())
  .then((data) => {
    // Sort alphabetically
    characters = data.sort((a, b) => a.name.localeCompare(b.name));
    const random = characters[Math.floor(Math.random() * characters.length)];
    input.value = random.name;
    // Auto-show full list on page load
    buildDropdownItems(characters, "");
  });

function displayWords(value) {
  input.value = value;
  removeElements();
}

function removeElements() {
  listContainer.innerHTML = "";
}

// Build dropdown items
function buildDropdownItems(list, searchTerm) {
  removeElements();
  list.forEach((character) => {
    let name = character.name;
    let div = document.createElement("div");
    div.classList.add("autocomplete-items");
    div.setAttribute("onclick", `displayWords('${name.replace(/'/g, "\\'")}')`);

    let word = name;
    if (searchTerm) {
      const idx = name.toLowerCase().indexOf(searchTerm.toLowerCase());
      if (idx !== -1) {
        word = name.substr(0, idx) +
               "<b>" + name.substr(idx, searchTerm.length) + "</b>" +
               name.substr(idx + searchTerm.length);
      }
    }

    // Show first letter as section label if alphabetical listing
    const letter = name[0].toUpperCase();
    div.setAttribute("data-letter", letter);
    div.innerHTML = `<p class="item">${word}</p>`;
    listContainer.appendChild(div);
  });

  // Add letter group headers for full alphabetical list
  if (!searchTerm) {
    addAlphabetHeaders();
  }
}

function addAlphabetHeaders() {
  const items = listContainer.querySelectorAll(".autocomplete-items");
  let lastLetter = "";
  items.forEach((item) => {
    const letter = item.getAttribute("data-letter");
    if (letter !== lastLetter) {
      const header = document.createElement("div");
      header.classList.add("alpha-header");
      header.textContent = letter;
      listContainer.insertBefore(header, item);
      lastLetter = letter;
    }
  });
}

// Show ALL characters alphabetically on focus / click
input.addEventListener("focus", () => {
  if (input.value.trim().length === 0 || characters.some(c => c.name.toLowerCase() === input.value.toLowerCase())) {
    buildDropdownItems(characters, "");
  }
});

input.addEventListener("click", () => {
  if (listContainer.innerHTML === "") {
    buildDropdownItems(characters, "");
  }
});

// Filter while typing
input.addEventListener("keyup", (e) => {
  if (e.key === "Enter") return;
  const searchTerm = input.value.trim();

  if (searchTerm.length === 0) {
    buildDropdownItems(characters, "");
    return;
  }

  const matches = characters.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (matches.length > 0) {
    buildDropdownItems(matches, searchTerm);
  } else {
    removeElements();
  }
});

// Close dropdown on outside click
document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-wrapper")) removeElements();
});

// ── Helpers ──────────────────────────────────────────────

function getAlignmentClass(alignment) {
  if (alignment === "good") return "alignment-good";
  if (alignment === "bad") return "alignment-bad";
  return "alignment-neutral";
}

function buildInlineFallbackSvg(name) {
  const initials = name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "?";

  const safeName = name
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 520">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1a1d2b"/>
          <stop offset="100%" stop-color="#0f1119"/>
        </linearGradient>
      </defs>
      <rect width="640" height="520" fill="url(#bg)"/>
      <circle cx="520" cy="90" r="140" fill="#e01a38" opacity="0.25"/>
      <circle cx="120" cy="460" r="160" fill="#f43f5e" opacity="0.2"/>
      <text x="50%" y="46%" text-anchor="middle" fill="#f8fafc" font-size="132" font-family="Arial, sans-serif" font-weight="700">${initials}</text>
      <text x="50%" y="62%" text-anchor="middle" fill="#cbd5e1" font-size="28" font-family="Arial, sans-serif">${safeName}</text>
      <text x="50%" y="72%" text-anchor="middle" fill="#94a3b8" font-size="18" font-family="Arial, sans-serif">Image unavailable</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function setInlineFallback(imgEl, name) {
  imgEl.onerror = null;
  imgEl.src = buildInlineFallbackSvg(name);
}

function showLoading() {
  showContainer.innerHTML = `
    <div class="loading-card">
      <div class="shimmer-img"></div>
      <div class="shimmer-line" style="width:55%"></div>
      <div class="shimmer-line" style="width:35%"></div>
      <div class="shimmer-line" style="width:70%"></div>
      <div class="shimmer-line" style="width:60%;margin-bottom:1.5em"></div>
    </div>`;
}

// ── Download image ────────────────────────────────────────

function downloadImage(url, filename) {
  // Show downloading feedback
  const btn = document.querySelector(".download-btn");
  if (btn) {
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation:spin 0.8s linear infinite"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.18-4.88"/></svg> Downloading...`;
    btn.disabled = true;
  }

  const img = new Image();
  img.crossOrigin = "anonymous";

  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width  = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext("2d").drawImage(img, 0, 0);

    canvas.toBlob((blob) => {
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename + ".jpg";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 200);

      if (btn) {
        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Downloaded!`;
        setTimeout(() => {
          btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download`;
          btn.disabled = false;
        }, 2000);
      }
    }, "image/jpeg", 0.95);
  };

  img.onerror = () => {
    // Last resort: direct fetch as blob
    fetch(url)
      .then(r => r.blob())
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename + ".jpg";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 200);
      })
      .catch(() => window.open(url, "_blank"));

    if (btn) { btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download`; btn.disabled = false; }
  };

  // Add timestamp to avoid cached no-CORS version
  img.src = url + (url.includes("?") ? "&" : "?") + "_t=" + Date.now();
}

// ── Show Card ─────────────────────────────────────────────

function showCard(character) {
  currentCharacter = character;
  const alignClass = getAlignmentClass(character.alignment);
  const safeName = character.name.replace(/'/g, "\\'");

  showContainer.innerHTML = `
    <div class="card-container">

      <!-- Full Image -->
      <div class="card-image-wrapper">
        <img id="char-img"
             src="${character.image}"
             alt="${character.name}"
             onerror="setInlineFallback(this, '${safeName}')" />
        <div class="card-image-id">ID: ${character.id}</div>

        <!-- Download button over image -->
        <button class="download-btn" onclick="downloadImage('${character.image}', '${safeName}')" title="Download Image">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download
        </button>
      </div>

      <!-- Info -->
      <div class="card-body">
        <div class="character-name">${character.name}</div>
        <span class="alignment-badge ${alignClass}">${character.alignment}</span>
        <div class="divider"></div>
        <div class="info-list">
          <div class="info-row">
            <span class="info-label">Full name</span>
            <span class="info-value">${character.fullName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Publisher</span>
            <span class="info-value">${character.publisher}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Gender</span>
            <span class="info-value">${character.gender}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Race</span>
            <span class="info-value">${character.race}</span>
          </div>
          <div class="info-row">
            <span class="info-label">First appearance</span>
            <span class="info-value">${character.firstAppearance}</span>
          </div>
        </div>
      </div>
    </div>`;
}

// ── Submit ────────────────────────────────────────────────

button.addEventListener("click", () => {
  const val = input.value.trim();
  if (!val) {
    alert("Input cannot be blank");
    return;
  }
  removeElements();
  showLoading();

  setTimeout(() => {
    const character = characters.find(
      (c) => c.name.toLowerCase() === val.toLowerCase()
    );

    if (!character) {
      showContainer.innerHTML = `
        <div class="not-found">
          <span>&#128269;</span>
          Character not found.<br>Click the search bar to browse all heroes.
        </div>`;
      return;
    }

    showCard(character);
  }, 400);
});

// Enter key submits
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") button.click();
});
