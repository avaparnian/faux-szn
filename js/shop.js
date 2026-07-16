function formatPrice(cents) {
  return "$" + (cents / 100).toFixed(2);
}

// LISTINGS
async function loadListings() {
  const container = document.getElementById("listings");

  try {
    const res = await fetch("data/listings.json");
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
loadListings();

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

// PRODUCT VIEW
const productView = document.getElementById("productView");

// OPEN PRODUCT VIEW
function openProductView(item) {

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

  // OPEN PREVIEW
  productView.classList.add("open");
  document.body.style.overflow = "hidden";
}

// CAROUSEL CONTROLS
const pvTrack = document.querySelector(".pvTrack");

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


// CLOSE PRODUCT VIEW
function closeProductView() {
  productView.classList.remove("open");
  document.body.style.overflow = "";
}

document.querySelector(".pvClose").addEventListener("click", closeProductView);

productView.addEventListener("click", (e) => {
  if (e.target === productView) closeProductView();
});

// HAMBURGER TOGGLE
const hamburgerBtn = document.querySelector(".hamburgerBtn");
const menuDrawer = document.getElementById("menuDrawer");

hamburgerBtn.addEventListener("click", () => {
    menuDrawer.classList.toggle("open");
    hamburgerBtn.classList.toggle("open");
    document.body.classList.toggle("noScroll");

const isOpen = menuDrawer.classList.contains("open");
hamburgerBtn.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
});

// CART TOGGLE
const cartBtn = document.querySelector(".cartBtn");
const cartDrawer = document.getElementById("cartDrawer");

function closeCart() {
    cartDrawer.classList.remove("open");
    cartBtn.classList.remove("open");
    cartBtn.setAttribute("aria-label", "Open cart");
}

function closeMenu() {
    menuDrawer.classList.remove("open");
    hamburgerBtn.classList.remove("open");
    hamburgerBtn.setAttribute("aria-label", "Open menu");
}

cartBtn.addEventListener("click", () => {
    closeMenu();
    cartDrawer.classList.toggle("open");
    cartBtn.classList.toggle("open");
    const isOpen = cartDrawer.classList.contains("open");
    cartBtn.setAttribute("aria-label", isOpen ? "Close cart" : "Open cart");
});