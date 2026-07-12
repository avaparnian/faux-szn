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

function openProductView(item) {
  productView.classList.add("open");
  document.body.style.overflow = "";
}

function closeProductView() {
  productView.classList.remove("open");
  document.body.style.overflow = "";
}

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
