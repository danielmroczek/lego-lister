const API_BASE = "https://rebrickable.com/api/v3/lego";
const STORAGE_KEY = "rebrickable_api_key";

function legoListerApp() {
  return {
    apiKey: "",
    setNumberInput: "",
    setData: null,
    loading: false,
    errorMessage: "",
    apiKeyNotice: "",
    counts: {
      setParts: 0,
      minifigsCount: 0,
      minifigPartsCount: 0,
      totalParts: 0,
    },
    regularParts: [],
    spareRegularParts: [],
    minifigGroups: [],

    async init() {
      try {
        this.apiKey = await this.getApiKey();
      } catch (error) {
        console.error("Failed to initialize:", error);
        this.errorMessage = error.message;
      }
    },

    get setImageLink() {
      if (!this.setData?.set_num) {
        return "#";
      }
      return `https://www.bricklink.com/v2/catalog/catalogitem.page?S=${this.setData.set_num}#T=I`;
    },

    get themeDisplay() {
      if (!this.setData?.theme) {
        return "Unknown";
      }

      return `${this.setData.theme.name}${
        this.setData.theme.parent ? ` (${this.setData.theme.parent.name})` : ""
      }`;
    },

    formatSetNumber(rawValue) {
      return rawValue.includes("-") ? rawValue : `${rawValue}-1`;
    },

    async promptForApiKey(
      message = `Please enter your Rebrickable API key.

Security Notice:
Your Rebrickable API key will be stored only in your browser's local storage and will be used only to communicate with the Rebrickable API. The key never leaves your browser except to contact Rebrickable directly.`
    ) {
      const key = prompt(message);
      if (!key) {
        throw new Error("API key is required");
      }

      try {
        const response = await fetch(`${API_BASE}/colors/0/?key=${key}`);
        if (!response.ok) {
          throw new Error("Invalid API key");
        }
        localStorage.setItem(STORAGE_KEY, key);
        this.apiKeyNotice = "";
        return key;
      } catch (error) {
        throw new Error("Invalid API key");
      }
    },

    async getApiKey() {
      let key = localStorage.getItem(STORAGE_KEY);
      if (!key) {
        this.apiKeyNotice = "Enter your Rebrickable API key to load set data.";
        key = await this.promptForApiKey();
      }
      return key;
    },

    async handleApiError(error) {
      if (!String(error?.message || "").includes("401")) {
        return false;
      }

      localStorage.removeItem(STORAGE_KEY);
      this.apiKey = await this.promptForApiKey(
        "Invalid API key. Please enter a new one:"
      );
      return true;
    },

    getBlPartId(part) {
      const ids = part?.part?.external_ids?.BrickLink;
      if (!Array.isArray(ids) || ids.length === 0) {
        return "Unknown";
      }
      return String(ids[ids.length - 1]);
    },

    getBlColorId(part) {
      const ids = part?.color?.external_ids?.BrickLink?.ext_ids;
      if (!Array.isArray(ids) || ids.length === 0) {
        return "0";
      }
      return String(ids[0]);
    },

    getColorDescription(part) {
      const descrs = part?.color?.external_ids?.BrickLink?.ext_descrs;
      if (!Array.isArray(descrs) || descrs.length === 0) {
        return part?.color?.name || "Unknown";
      }
      return String(descrs[0]);
    },

    sortParts(parts) {
      return [...parts].sort((a, b) => {
        const colorA = parseInt(this.getBlColorId(a), 10);
        const colorB = parseInt(this.getBlColorId(b), 10);

        if (colorA !== colorB) {
          return colorA - colorB;
        }

        return this.getBlPartId(a).localeCompare(this.getBlPartId(b), undefined, {
          numeric: true,
        });
      });
    },

    toPartViewModel(part, sourceKey = "") {
      const blPartId = this.getBlPartId(part);
      const blColorId = this.getBlColorId(part);
      const colorDescription = this.getColorDescription(part);
      const rebrickablePartId = part?.part?.part_num || blPartId;

      return {
        id: `${sourceKey}-${rebrickablePartId}-${blColorId}-${part.quantity}`,
        name: part?.part?.name || "Unknown part",
        imageUrl: part?.part?.part_img_url || "",
        quantity: part?.quantity || 0,
        isSpare: Boolean(part?.is_spare),
        blPartId,
        blColorId,
        colorDescription,
        bricklinkUrl: `https://www.bricklink.com/v2/catalog/catalogitem.page?P=${blPartId}&C=${blColorId}`,
      };
    },

    async handleSubmit() {
      if (!this.setNumberInput) {
        return;
      }

      const setNumber = this.formatSetNumber(this.setNumberInput);
      await this.fetchSetData(setNumber);
    },

    async fetchSetData(setNumber) {
      this.loading = true;
      this.errorMessage = "";

      try {
        const setResponse = await fetch(`${API_BASE}/sets/${setNumber}/?key=${this.apiKey}`);

        if (!setResponse.ok) {
          if (setResponse.status === 401 && (await this.handleApiError({ message: "401" }))) {
            return this.fetchSetData(setNumber);
          }
          throw new Error("Set not found");
        }

        const setData = await setResponse.json();

        if (setData.theme_id) {
          const themeResponse = await fetch(`${API_BASE}/themes/${setData.theme_id}/?key=${this.apiKey}`);
          const themeData = await themeResponse.json();
          setData.theme = themeData;

          if (themeData.parent_id) {
            const parentThemeResponse = await fetch(`${API_BASE}/themes/${themeData.parent_id}/?key=${this.apiKey}`);
            const parentThemeData = await parentThemeResponse.json();
            setData.theme.parent = parentThemeData;
          }
        }

        const [partsResponse, minifigsResponse] = await Promise.all([
          fetch(`${API_BASE}/sets/${setNumber}/parts/?key=${this.apiKey}&page_size=1000`),
          fetch(`${API_BASE}/sets/${setNumber}/minifigs/?key=${this.apiKey}`),
        ]);

        if (!partsResponse.ok || !minifigsResponse.ok) {
          throw new Error("Failed to load set parts");
        }

        const partsData = await partsResponse.json();
        const minifigsData = await minifigsResponse.json();

        let minifigParts = [];
        if (minifigsData.results.length > 0) {
          const minifigPartsPromises = minifigsData.results.map(async (minifig) => {
            const response = await fetch(`${API_BASE}/minifigs/${minifig.set_num}/parts/?key=${this.apiKey}`);
            if (!response.ok) {
              return { minifig, results: [] };
            }

            const data = await response.json();
            return { ...data, minifig };
          });

          const minifigPartsResults = await Promise.all(minifigPartsPromises);
          minifigParts = minifigPartsResults.flatMap((result) =>
            result.results.map((part) => ({
              ...part,
              from_minifig: true,
              minifig: result.minifig,
            }))
          );
        }

        const setPartsCount = partsData.results.reduce((sum, part) => sum + part.quantity, 0);
        const minifigPartsCount = minifigParts.reduce((sum, part) => sum + part.quantity, 0);
        const minifigsCount = minifigsData.results.length;

        const regularRawParts = partsData.results.filter((part) => !part.is_spare);
        const spareRawParts = partsData.results.filter((part) => part.is_spare);

        this.regularParts = this.sortParts(regularRawParts).map((part) =>
          this.toPartViewModel(part, "regular")
        );

        this.spareRegularParts = this.sortParts(spareRawParts).map((part) =>
          this.toPartViewModel(part, "spare")
        );

        const groupedMinifigParts = minifigParts.reduce((groups, part) => {
          const minifigId = part.minifig?.set_num || "unknown-minifig";
          if (!groups[minifigId]) {
            groups[minifigId] = { info: part.minifig, parts: [] };
          }
          groups[minifigId].parts.push(part);
          return groups;
        }, {});

        this.minifigGroups = Object.keys(groupedMinifigParts)
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
          .map((id) => {
            const group = groupedMinifigParts[id];
            return {
              id,
              name: group.info?.set_name || id,
              url: `https://rebrickable.com/minifigs/${id}`,
              parts: this.sortParts(group.parts).map((part) =>
                this.toPartViewModel(part, `minifig-${id}`)
              ),
            };
          });

        this.counts = {
          setParts: setPartsCount,
          minifigsCount,
          minifigPartsCount,
          totalParts: setPartsCount + minifigPartsCount,
        };

        this.setData = setData;

        document.documentElement.style.setProperty(
          "--print-title",
          `"Part list for Lego set ${setData.set_num}"`
        );
      } catch (error) {
        if (await this.handleApiError(error)) {
          return this.fetchSetData(setNumber);
        }
        this.errorMessage = `Error: ${error.message}`;
      } finally {
        this.loading = false;
      }
    },
  };
}

window.legoListerApp = legoListerApp;
