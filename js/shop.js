function formatPrice(cents) {
  return "$" + (cents / 100).toFixed(2);
}

let cart = JSON.parse(localStorage.getItem("cart") || "[]");

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

let currentItem = null;
let selectedSize = null;

// CARDS
function renderCard(item) {
  const card = document.createElement("article");
  card.className = "productCard";
  card.innerHTML = `
    <img class="productImg" src="${item.images[0]}" alt="${item.name}">
    <div class="productInfo">
        <h2 class="productName">${item.name}</h2>
        <p class="productPrice">${formatPrice(item.price)}</p>
    </div>
  `;
  card.addEventListener("click", () => openProductView(item));

  return card;
}

// ELEMENT REFERENCES
const productView = document.getElementById("productView");
const hamburgerBtn = document.querySelector(".hamburgerBtn");
const menuDrawer = document.getElementById("menuDrawer");
const cartBtn = document.querySelector(".cartBtn");
const cartDrawer = document.getElementById("cartDrawer");
const pvTrack = document.querySelector(".pvTrack");

// OVERLAY CONTROL — one mechanism, mutual exclusion
function closeMenu() {
    menuDrawer.classList.remove("open");
    hamburgerBtn.classList.remove("open");
    hamburgerBtn.setAttribute("aria-label", "Open menu");
}

function closeCart() {
    cartDrawer.classList.remove("open");
    cartBtn.classList.remove("open");
    cartBtn.setAttribute("aria-label", "Open cart");
}

function closeProductView() {
    productView.classList.remove("open");
}

function closeAllOverlays() {
    closeMenu();
    closeCart();
    closeProductView();
    document.body.classList.remove("noScroll");
}

// HAMBURGER TOGGLE
hamburgerBtn.addEventListener("click", () => {
    const wasOpen = menuDrawer.classList.contains("open");
    closeAllOverlays();

    if (!wasOpen) {
        menuDrawer.classList.add("open");
        hamburgerBtn.classList.add("open");
        hamburgerBtn.setAttribute("aria-label", "Close menu");
        document.body.classList.add("noScroll");
    }
});

// CART TOGGLE
cartBtn.addEventListener("click", () => {
    const wasOpen = cartDrawer.classList.contains("open");
    closeAllOverlays();

    if (!wasOpen) {
        cartDrawer.classList.add("open");
        cartBtn.classList.add("open");
        cartBtn.setAttribute("aria-label", "Close cart");
        document.body.classList.add("noScroll");
    }
});

// OPEN PRODUCT VIEW
function openProductView(item) {
  closeAllOverlays();

  currentItem = item;

  // TEXT
  document.querySelector(".pvTitle").textContent = item.name;
  document.querySelector(".pvPrice").textContent = formatPrice(item.price);
  document.querySelector(".pvDescription").textContent = item.description;

  // CAROUSEL
  const track = document.querySelector(".pvTrack");
  track.innerHTML = item.images
    .map(src => `<img src="${src}" alt="${item.name}">`)
    .join("");
  pvTrack.scrollTo({left: 0});

  // IMAGE COUNTER
  const dots = document.querySelector(".pvDots");
  dots.innerHTML = item.images
    .map((_,i) => `<span class="pvDot ${i === 0 ? "active" : ""}"></span>`)
    .join("");

  // SIZES
  const sizes = document.querySelector(".pvSizes");
  sizes.innerHTML = Object.entries(item.sizes)
    .map(([size, inStock]) =>
      `<button class="sizeBtn${inStock ? "" : " unavailable"}" ${inStock ? "" : "disabled"}>${size}</button>`)
    .join("");

  selectedSize = null;

  // OPEN PREVIEW
  productView.classList.add("open");
  document.body.classList.add("noScroll");
}

document.querySelector(".pvClose").addEventListener("click", closeAllOverlays);

productView.addEventListener("click", (e) => {
  if (e.target === productView) closeAllOverlays();
});

// SIZE SELECTION
document.querySelector(".pvSizes").addEventListener("click", (e) => {
  const btn = e.target.closest(".sizeBtn");
  if (!btn || btn.disabled) return;

  document.querySelectorAll(".sizeBtn").forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");
  selectedSize = btn.textContent;
});

// CAROUSEL CONTROLS
document.querySelector(".pvNext").addEventListener("click", () => {
  pvTrack.scrollBy({left: pvTrack.clientWidth, behavior: "smooth" });
});

document.querySelector(".pvPrev").addEventListener("click", () => {
  pvTrack.scrollBy({left: -pvTrack.clientWidth, behavior: "smooth" });
});

pvTrack.addEventListener("scroll", () =>  {
  const index = Math.round(pvTrack.scrollLeft / pvTrack.clientWidth);
  document.querySelectorAll(".pvDot").forEach((dot, i) => {
    dot.classList.toggle("active", i === index);
  });
});

// ADD TO CART
function addToCart() {
  if (!selectedSize) return;

  cart.push({
    id: currentItem.id,
    name: currentItem.name,
    price: currentItem.price,
    image: currentItem.images[0],
    size: selectedSize,
  });
  saveCart();
  renderCart();

  closeAllOverlays();
  cartDrawer.classList.add("open");
  cartBtn.classList.add("open");
  cartBtn.setAttribute("aria-label", "Close cart");
  document.body.classList.add("noScroll");
}

document.querySelector(".pvAddBtn").addEventListener("click", addToCart);

// CART RENDERING
function renderCart() {
    const list = document.querySelector(".cartItems");

    list.innerHTML = cart
        .map((entry, i) => `
            <li class="cartItem">
                <img class="ciImg" src="${entry.image}" alt="${entry.name}">
                <div class="ciInfo">
                    <p class="ciName">${entry.name}</p>
                    <p class="ciSize">${entry.size}</p>
                    <p class="ciPrice">${formatPrice(entry.price)}</p>
                    <button class="ciRemove" data-index="${i}">REMOVE</button>
                </div>
            </li>
        `)
        .join("");

    const subtotal = cart.reduce((sum, entry) => sum + entry.price, 0);
    const shipping = cart.length ? 1200 : 0;
    document.querySelector(".csCart").textContent = formatPrice(subtotal);
    document.querySelector(".csShipping").textContent = formatPrice(shipping);
    document.querySelector(".csTotalPrice").textContent = formatPrice(subtotal + shipping);
}

document.querySelector(".cartItems").addEventListener("click", (e) => {
    const btn = e.target.closest(".ciRemove");
    if (!btn) return;

    const row = btn.closest(".cartItem");
    row.classList.add("removing");

    row.addEventListener("transitionend", () => {
        cart.splice(btn.dataset.index, 1);
        saveCart();
        renderCart();
    }, { once: true });
});

document.querySelector(".checkoutBtn").addEventListener("click", async () => {
    if (cart.length === 0) return;

    const items = cart.map(entry => ({ id: entry.id, size: entry.size }));

    const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
    });

    const data = await res.json();

    if (data.url) {
        window.location.href = data.url;
    }
});

// LISTINGS
async function loadListings() {
  const container = document.getElementById("listings");

  try {
    const res = await fetch("/api/get-listings");
    if (!res.ok) throw new Error("Request failed: " + res.status);

    const items = await res.json();
    const activeItems = items.filter(item => item.active);

    activeItems.forEach(item => {
      container.appendChild(renderCard(item));
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Could not load products.</p>";
  }
}

// SITE PAGE SWITCHING
const sitePages = document.querySelectorAll(".sitePage");
const navLinks = document.querySelectorAll("[data-page]");

function switchPage(target) {
    closeAllOverlays();

    sitePages.forEach(p => p.classList.remove("active"));
    document.getElementById(`page-${target}`).classList.add("active");

    navLinks.forEach(link => link.classList.toggle("current", link.dataset.page === target));

    window.scrollTo({ top: 0, behavior: "smooth" });
}

navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        switchPage(link.dataset.page);
    });
});

// SHOWCASE
async function loadShowcase() {
    const grid = document.getElementById("showcaseGrid");
    try {
        const res = await fetch("/api/get-gallery");
        const photos = await res.json();
        grid.innerHTML = photos.map(src => `<img src="${src}" alt="">`).join("");
    } catch (err) {
        console.error(err);
    }
}

loadListings();
loadShowcase();
renderCart();