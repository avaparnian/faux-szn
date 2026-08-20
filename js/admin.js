// STUB DATA — replaced by real fetch in the backend phase
let stubListings = [];
let adminToken = null;

async function loadListingsFromServer() {
    const res = await fetch("/api/get-listings");
    stubListings = await res.json();
    renderListingsList();
}

let stubGallery = [
    "https://placehold.co/300x300",
    "https://placehold.co/300x300",
    "https://placehold.co/300x300",
];

// LOGIN
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
        document.getElementById("formError").classList.add("show");
        return;
    }

    const data = await res.json();
    adminToken = data.token;

    document.getElementById("formError").classList.remove("show");
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("dashboard").classList.add("active");

    await loadListingsFromServer();
});

document.getElementById("signOutBtn").addEventListener("click", () => {
    document.getElementById("dashboard").classList.remove("active");
    document.getElementById("loginScreen").style.display = "flex";
});

// SIDE PANEL TOGGLE
const panelBtn = document.getElementById("panelBtn");
const sidePanel = document.getElementById("sidePanel");
const sidePanelOverlay = document.getElementById("sidePanelOverlay");

function closeSidePanel() {
    sidePanel.classList.remove("open");
    sidePanelOverlay.classList.remove("open");
}

panelBtn.addEventListener("click", () => {
    sidePanel.classList.toggle("open");
    sidePanelOverlay.classList.toggle("open");
});

sidePanelOverlay.addEventListener("click", closeSidePanel);

// PAGE SWITCHING
const pageLabel = document.getElementById("pageLabel");
const sideItems = document.querySelectorAll(".sideItem");

sideItems.forEach(btn => {
    btn.addEventListener("click", () => {
        const target = btn.dataset.page;

        sideItems.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
        document.getElementById(`page-${target}`).classList.add("active");

        pageLabel.textContent = target.toUpperCase();
        closeSidePanel();
    });
});

// LISTINGS: SELECTION STATE
let editingListing = null;
let formPhotos = [];

function renderListingsList() {
    const list = document.getElementById("listingsList");
    list.innerHTML = stubListings
        .map(item => `
            <li class="itemRow${editingListing && editingListing.id === item.id ? " selected" : ""}" data-id="${item.id}">
                <img src="${item.images[0]}" alt="${item.name}">
                <span class="itemRowName">${item.name}</span>
                <span class="itemRowPrice">$${(item.price / 100).toFixed(2)}</span>
            </li>
        `)
        .join("");

    list.querySelectorAll(".itemRow").forEach(row => {
        row.addEventListener("click", () => {
            const item = stubListings.find(l => l.id === row.dataset.id);
            openListingForm(item);
        });
    });
}

function renderPhotoGrid() {
    const grid = document.getElementById("photoGrid");
    const tiles = formPhotos
        .map((src, i) => `
            <div class="photoTile" data-index="${i}">
                <img src="${src}" alt="">
                <button type="button" class="photoTileDelete" data-index="${i}">✕</button>
            </div>
        `)
        .join("");

    const uploadTile = formPhotos.length < 10
        ? `<button type="button" class="photoUploadTile" id="photoUploadTile">+</button>`
        : "";

    grid.innerHTML = tiles + uploadTile;

    const uploadBtn = document.getElementById("photoUploadTile");
    if (uploadBtn) {
        uploadBtn.addEventListener("click", () => document.getElementById("photoInput").click());
    }

    grid.querySelectorAll(".photoTileDelete").forEach(btn => {
        btn.addEventListener("click", () => {
            formPhotos.splice(Number(btn.dataset.index), 1);
            renderPhotoGrid();
        });
    });
}

document.getElementById("photoInput").addEventListener("change", async (e) => {
    const files = Array.from(e.target.files).slice(0, 10 - formPhotos.length);

    for (const file of files) {
        const res = await fetch("/api/upload-image", {
            method: "POST",
            headers: {
                "Content-Type": file.type,
                "x-filename": file.name,
                "Authorization": `Bearer ${adminToken}`,
            },
            body: file,
        });
        const data = await res.json();
        formPhotos.push(data.url);
        renderPhotoGrid();
    }

    e.target.value = "";
});

function openListingForm(item) {
    editingListing = item || null;
    formPhotos = item ? [...item.images] : [];

    document.getElementById("listingEmptyState").style.display = "none";
    document.getElementById("listingForm").style.display = "flex";

    document.getElementById("listingName").value = item ? item.name : "";
    document.getElementById("listingPrice").value = item ? (item.price / 100).toFixed(2) : "";
    document.getElementById("listingDescription").value = item ? (item.description || "") : "";

    document.querySelectorAll(".sizeToggle").forEach(btn => {
        const size = btn.dataset.size;
        const inStock = item && item.sizes ? item.sizes[size] : true;
        btn.classList.toggle("active", inStock !== false);
    });

    renderPhotoGrid();
    renderListingsList();
}

document.querySelectorAll(".sizeToggle").forEach(btn => {
    btn.addEventListener("click", () => btn.classList.toggle("active"));
});

document.getElementById("addListingBtn").addEventListener("click", () => openListingForm(null));

document.getElementById("cancelListingBtn").addEventListener("click", () => {
    if (editingListing) {
        openListingForm(editingListing);
    } else {
        document.getElementById("listingForm").style.display = "none";
        document.getElementById("listingEmptyState").style.display = "block";
        editingListing = null;
        renderListingsList();
    }
});

document.getElementById("listingForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const sizes = {};
    document.querySelectorAll(".sizeToggle").forEach(btn => {
        sizes[btn.dataset.size] = btn.classList.contains("active");
    });

    const data = {
        id: editingListing ? editingListing.id : "new-" + Date.now(),
        name: document.getElementById("listingName").value,
        price: Math.round(parseFloat(document.getElementById("listingPrice").value) * 100),
        description: document.getElementById("listingDescription").value,
        images: formPhotos,
        sizes,
        active: true,
    };

    if (editingListing) {
        const idx = stubListings.findIndex(l => l.id === editingListing.id);
        stubListings[idx] = data;
    } else {
        stubListings.push(data);
    }

    await fetch("/api/save-listings", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${adminToken}`,
        },
        body: JSON.stringify(stubListings),
    });

    editingListing = data;
    renderListingsList();
});

// GALLERY
function renderGalleryGrid() {
    const grid = document.getElementById("galleryGrid");
    grid.innerHTML = stubGallery
        .map((src, i) => `
            <div class="galleryTile" data-index="${i}">
                <img src="${src}" alt="">
                <button class="galleryTileDelete" data-index="${i}" aria-label="Delete photo">✕</button>
            </div>
        `)
        .join("");

    grid.querySelectorAll(".galleryTileDelete").forEach(btn => {
        btn.addEventListener("click", () => {
            const tile = btn.closest(".galleryTile");
            tile.classList.add("removing");

            tile.addEventListener("transitionend", () => {
                stubGallery.splice(Number(btn.dataset.index), 1);
                renderGalleryGrid();
                // real delete-from-backend call goes here in the Functions phase
            }, { once: true });
        });
    });
}

document.getElementById("addGalleryBtn").addEventListener("click", () => {
    document.getElementById("galleryInput").click();
});

document.getElementById("galleryInput").addEventListener("change", async (e) => {
    const files = Array.from(e.target.files);

    for (const file of files) {
        const res = await fetch("/api/upload-image", {
            method: "POST",
            headers: {
                "Content-Type": file.type,
                "x-filename": file.name,
                "Authorization": `Bearer ${adminToken}`,
            },
            body: file,
        });
        const data = await res.json();
        stubGallery.push(data.url);
        renderGalleryGrid();
    }

    e.target.value = "";
});

renderGalleryGrid();