let API_KEY;
const API_BASE = "https://rebrickable.com/api/v3/lego";
const STORAGE_KEY = "rebrickable_api_key";

async function promptForApiKey(
  message = `Please enter your Rebrickable API key. 
  
Security Notice:
Your Rebrickable API key will be stored only in your browser's local storage and will be used only to communicate with the Rebrickable API. The key never leaves your browser except to contact Rebrickable directly.`
) {
  const key = prompt(message);
  if (!key) {
    throw new Error("API key is required");
  }
  // Test the key
  try {
    const response = await fetch(`${API_BASE}/colors/0/?key=${key}`);
    if (!response.ok) throw new Error("Invalid API key");
    localStorage.setItem(STORAGE_KEY, key);
    return key;
  } catch (error) {
    throw new Error("Invalid API key");
  }
}

async function getApiKey() {
  let key = localStorage.getItem(STORAGE_KEY);
  if (!key) {
    key = await promptForApiKey();
  }
  return key;
}

async function handleApiError(error) {
  if (error.message.includes("401")) {
    // Clear invalid key
    localStorage.removeItem(STORAGE_KEY);
    // Prompt for new key
    API_KEY = await promptForApiKey("Invalid API key. Please enter a new one:");
    return true; // Retry operation
  }
  return false; // Don't retry
}

async function init() {
  try {
    API_KEY = await getApiKey();

    // Initialize form listener after getting API key
    document
      .getElementById("searchForm")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const setNumber = document.getElementById("setNumber").value.trim();
        const formattedSetNumber = setNumber.includes("-")
          ? setNumber
          : `${setNumber}-1`;
        await fetchSetData(formattedSetNumber);
      });
  } catch (error) {
    console.error("Failed to initialize:", error);
    alert(error.message);
  }
}

async function fetchSetData(setNumber) {
  try {
    const setResponse = await fetch(
      `${API_BASE}/sets/${setNumber}/?key=${API_KEY}`
    );
    if (!setResponse.ok) {
      if (setResponse.status === 401) {
        if (await handleApiError({ message: "401" })) {
          // Retry with new key
          return fetchSetData(setNumber);
        }
      }
      throw new Error("Set not found");
    }
    const setData = await setResponse.json();

    // Fetch theme data if theme_id exists
    if (setData.theme_id) {
      const themeResponse = await fetch(
        `${API_BASE}/themes/${setData.theme_id}/?key=${API_KEY}`
      );
      const themeData = await themeResponse.json();
      setData.theme = themeData;

      // Fetch parent theme if it exists
      if (themeData.parent_id) {
        const parentThemeResponse = await fetch(
          `${API_BASE}/themes/${themeData.parent_id}/?key=${API_KEY}`
        );
        const parentThemeData = await parentThemeResponse.json();
        setData.theme.parent = parentThemeData;
      }
    }

    // Fetch parts and minifigures
    const [partsResponse, minifigsResponse] = await Promise.all([
      fetch(
        `${API_BASE}/sets/${setNumber}/parts/?key=${API_KEY}&page_size=1000`
      ),
      fetch(`${API_BASE}/sets/${setNumber}/minifigs/?key=${API_KEY}`),
    ]);

    const partsData = await partsResponse.json();
    const minifigsData = await minifigsResponse.json();

    // Get all minifigure parts
    let minifigParts = [];
    if (minifigsData.results.length > 0) {
      const minifigPartsPromises = minifigsData.results.map((minifig) =>
        fetch(
          `${API_BASE}/minifigs/${minifig.set_num}/parts/?key=${API_KEY}`
        ).then((response) => response.json())
        .then((data) => ({
          ...data,
          minifig
    }))
      );

      const minifigPartsResults = await Promise.all(minifigPartsPromises);
      minifigParts = minifigPartsResults.flatMap((result) =>
        result.results.map((part) => ({
          ...part,
          from_minifig: true,
          minifig: result.minifig,
        }))
      );
    }

    // Combine regular parts with minifigure parts
    const allParts = [...partsData.results, ...minifigParts];

    // Calculate parts counts
    const setParts = partsData.results.reduce(
      (sum, part) => sum + part.quantity,
      0
    );
    const minifigPartsCount = minifigParts.reduce(
      (sum, part) => sum + part.quantity,
      0
    );
    const minifigsCount = minifigsData.results.length;
    const totalParts = setParts + minifigPartsCount;

    displaySetInfo(setData, {
      setParts,
      minifigsCount,
      minifigPartsCount,
      totalParts,
    });
    displayParts(allParts);
  } catch (error) {
    if (await handleApiError(error)) {
      // Retry with new key
      return fetchSetData(setNumber);
    }
    alert("Error: " + error.message);
  }
}

function displaySetInfo(setData, counts) {
  document.getElementById("setInfo").classList.remove("hidden");
  const setImage = document.getElementById("setImage");
  setImage.src = setData.set_img_url;
  setImage.classList.remove("hidden");

  // Set the BrickLink URL for the anchor
  const bricklinkUrl = `https://www.bricklink.com/v2/catalog/catalogitem.page?S=${setData.set_num}#T=I`;
  document.getElementById("setImageLink").href = bricklinkUrl;

  document.getElementById("setName").textContent = setData.name;
  document.getElementById("setNumberDisplay").textContent = setData.set_num;
  document.getElementById("setTheme").textContent = setData.theme
    ? `${setData.theme.name}${
        setData.theme.parent ? ` (${setData.theme.parent.name})` : ""
      }`
    : "Unknown";
  document.getElementById("setYear").textContent = setData.year || "Unknown";
  document.getElementById("totalParts").textContent = counts.setParts;
  document.getElementById("minifigsCount").textContent = counts.minifigsCount;
  document.getElementById("minifigPartsCount").textContent =
    counts.minifigPartsCount;
  document.getElementById("allPartsCount").textContent = counts.totalParts;

  // Set print title in CSS variable
  document.documentElement.style.setProperty(
    "--print-title",
    `"Part list for Lego set ${setData.set_num}"`
  );
}

function displayParts(parts) {
  const partsList = document.getElementById("partsList");
  partsList.innerHTML = "";

  const sortParts = (list) => {
    return [...list].sort((a, b) => {
      const colorA = parseInt(a.color.external_ids.BrickLink.ext_ids[0], 10);
      const colorB = parseInt(b.color.external_ids.BrickLink.ext_ids[0], 10);
      if (colorA !== colorB) {
        return colorA - colorB;
      }
      return a.part.external_ids.BrickLink[0].localeCompare(
        b.part.external_ids.BrickLink[0]
      );
    });
  };

  const createPartCard = (part) => {
    const blPartId = part.part.external_ids.BrickLink.slice(-1)[0];
    const blColorId = part.color.external_ids.BrickLink.ext_ids[0];
    const bricklinkUrl = `https://www.bricklink.com/v2/catalog/catalogitem.page?P=${blPartId}&C=${blColorId}`;

    const card = document.createElement("a");
    card.href = bricklinkUrl;
    card.target = "_blank";
    card.classList.add("part-card");
    if (part.is_spare) {
      card.classList.add("spare-part");
    }

    card.innerHTML = `
            <img src="${part.part.part_img_url}" alt="${part.part.name}">
            <div>
                <p><strong>${blPartId}</strong></p>
                <p>${part.color.external_ids.BrickLink.ext_descrs[0]} (${blColorId})</p>
                <p>Qty: <strong>${part.quantity}</strong></p>
                <p class="part-name">${part.part.name}</p>
            </div>
        `;

    return card;
  };

  const createSectionTitle = (text) => {
    const title = document.createElement("h2");
    title.classList.add("parts-section-title");
    title.textContent = text;
    return title;
  };

  const regularParts = parts.filter((part) => !part.from_minifig);
  const minifigParts = parts.filter((part) => part.from_minifig);

  if (regularParts.length > 0) {
    partsList.appendChild(createSectionTitle(`Regular parts (${regularParts.length} types):`));

    const nonSpareRegularParts = regularParts.filter((part) => !part.is_spare);
    const spareRegularParts = regularParts.filter((part) => part.is_spare);

    const regularGrid = document.createElement("div");
    regularGrid.classList.add("parts-grid");
    sortParts(nonSpareRegularParts).forEach((part) => {
      regularGrid.appendChild(createPartCard(part));
    });
    partsList.appendChild(regularGrid);

    if (spareRegularParts.length > 0) {
      const spareTitle = document.createElement("h3");
      spareTitle.classList.add("minifig-group-title");
      spareTitle.textContent = `Spare parts (${spareRegularParts.length})`;
      partsList.appendChild(spareTitle);

      const spareGrid = document.createElement("div");
      spareGrid.classList.add("parts-grid");
      sortParts(spareRegularParts).forEach((part) => {
        spareGrid.appendChild(createPartCard(part));
      });
      partsList.appendChild(spareGrid);
    }
  }

  if (minifigParts.length > 0) {
    const groupedMinifigParts = minifigParts.reduce((groups, part) => {
      const minifigId = part.minifig?.set_num || "unknown-minifig";
      if (!groups[minifigId]) {
        groups[minifigId] = {
          info: part.minifig,
          parts: [],
        };
      }
      groups[minifigId].parts.push(part);
      return groups;
    }, {});

    const minifigCount = Object.keys(groupedMinifigParts).length;
    partsList.appendChild(
      createSectionTitle(`Minifigs (${minifigCount}):`)
    );

    Object.keys(groupedMinifigParts)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .forEach((minifigId) => {
        const groupWrapper = document.createElement("section");
        groupWrapper.classList.add("minifig-group");

        const groupTitle = document.createElement("h3");
        groupTitle.classList.add("minifig-group-title");

        const minifigName = groupedMinifigParts[minifigId].info?.set_name;
        const minifigUrl = `https://rebrickable.com/minifigs/${minifigId}`;

        const minifigIdLabel = document.createElement("span");
        minifigIdLabel.classList.add("minifig-id-label");
        minifigIdLabel.textContent = `${minifigId} (${groupedMinifigParts[minifigId].parts.length} parts) - `;

        const minifigNameLink = document.createElement("a");
        minifigNameLink.href = minifigUrl;
        minifigNameLink.target = "_blank";
        minifigNameLink.classList.add("minifig-name-link");
        minifigNameLink.textContent = minifigName || minifigId;

        groupTitle.appendChild(minifigIdLabel);
        groupTitle.appendChild(minifigNameLink);

        const minifigGrid = document.createElement("div");
        minifigGrid.classList.add("parts-grid");
        sortParts(groupedMinifigParts[minifigId].parts).forEach((part) => {
          minifigGrid.appendChild(createPartCard(part));
        });

        groupWrapper.appendChild(groupTitle);
        groupWrapper.appendChild(minifigGrid);
        partsList.appendChild(groupWrapper);
      });
  }
}

// Start initialization when DOM is loaded
document.addEventListener("DOMContentLoaded", init);
