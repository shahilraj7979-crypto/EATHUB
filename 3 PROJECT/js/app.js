// Main Application Logic
// Renders food cards, manages local placeholders, handles filtering

document.addEventListener("DOMContentLoaded", () => {
  const foodGrid = document.getElementById("foodGrid");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const cartBadge = document.getElementById("cartBadge");
  const toast = document.getElementById("toastNotice");
  const toastMessage = document.getElementById("toastMessage");

  let activeCategory = "All";
  // Cart state: itemId -> quantity
  const cart = {};

  function getTotalCartCount() {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  }

  function updateCartBadge() {
    cartBadge.textContent = getTotalCartCount();
  }

  // Create local placeholder element (Zero external network calls)
  function createLocalPlaceholder(itemName, itemCategory) {
    const placeholder = document.createElement("div");
    placeholder.className = "food-card-placeholder";
    placeholder.setAttribute("role", "img");
    placeholder.setAttribute("aria-label", `${itemName} (Image awaiting upload)`);

    placeholder.innerHTML = `
      <svg class="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
      </svg>
      <span class="placeholder-title">${itemName}</span>
      <span class="placeholder-subtitle">Awaiting ${itemCategory} Image</span>
    `;
    return placeholder;
  }

  // Fallback handler when an image file does not exist locally
  function handleFoodImageError(imgElement, itemName, itemCategory) {
    const mediaContainer = imgElement.parentElement;
    if (!mediaContainer) return;
    const placeholder = createLocalPlaceholder(itemName, itemCategory);
    imgElement.remove();
    mediaContainer.appendChild(placeholder);
  }

  // Render the action button or the + / - quantity control
  function renderItemAction(item, actionSlot) {
    const qty = cart[item.id] || 0;
    actionSlot.innerHTML = "";

    if (qty > 0) {
      const qtyControl = document.createElement("div");
      qtyControl.className = "quantity-control";
      qtyControl.setAttribute("data-id", item.id);

      const minusBtn = document.createElement("button");
      minusBtn.className = "qty-btn qty-minus";
      minusBtn.setAttribute("aria-label", `Decrease quantity of ${item.name}`);
      minusBtn.textContent = "−";
      minusBtn.addEventListener("click", () => {
        if (cart[item.id] > 1) {
          cart[item.id]--;
          showToast(`Updated ${item.name} quantity to ${cart[item.id]}`);
        } else {
          delete cart[item.id];
          showToast(`Removed ${item.name} from order`);
        }
        updateCartBadge();
        renderItemAction(item, actionSlot);
      });

      const qtySpan = document.createElement("span");
      qtySpan.className = "qty-value";
      qtySpan.textContent = qty;

      const plusBtn = document.createElement("button");
      plusBtn.className = "qty-btn qty-plus";
      plusBtn.setAttribute("aria-label", `Increase quantity of ${item.name}`);
      plusBtn.textContent = "+";
      plusBtn.addEventListener("click", () => {
        cart[item.id] = (cart[item.id] || 0) + 1;
        updateCartBadge();
        showToast(`Added another ${item.name} (Total: ${cart[item.id]})`);
        renderItemAction(item, actionSlot);
      });

      qtyControl.appendChild(minusBtn);
      qtyControl.appendChild(qtySpan);
      qtyControl.appendChild(plusBtn);

      actionSlot.appendChild(qtyControl);
    } else {
      const addBtn = document.createElement("button");
      addBtn.className = "btn-add";
      addBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Add to Order
      `;
      addBtn.addEventListener("click", () => {
        cart[item.id] = 1;
        updateCartBadge();
        showToast(`Added ${item.name} to your order!`);
        renderItemAction(item, actionSlot);
      });

      actionSlot.appendChild(addBtn);
    }
  }

  // Render food cards
  function renderFoodCards(items) {
    foodGrid.innerHTML = "";

    if (!items || items.length === 0) {
      foodGrid.innerHTML = `
        <div class="empty-state">
          <h3>No items found</h3>
          <p>There are no food items matching the selected category.</p>
        </div>
      `;
      return;
    }

    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "food-card";
      card.setAttribute("data-category", item.category);

      // Media container
      const media = document.createElement("div");
      media.className = "food-card-media";

      const badge = document.createElement("span");
      badge.className = "category-badge";
      badge.textContent = item.category;

      const img = document.createElement("img");
      img.className = "food-card-img";
      img.src = item.image;
      img.alt = item.alt || item.name;
      img.loading = "lazy";

      // Robust local fallback on missing image
      img.addEventListener("error", () => {
        handleFoodImageError(img, item.name, item.category);
      });

      media.appendChild(badge);
      media.appendChild(img);

      // Card Body
      const body = document.createElement("div");
      body.className = "food-card-body";

      const titleRow = document.createElement("div");
      titleRow.className = "food-title-row";

      const nameEl = document.createElement("h3");
      nameEl.className = "food-name";
      nameEl.textContent = item.name;

      const priceEl = document.createElement("span");
      priceEl.className = "food-price";
      priceEl.textContent = `₹${item.price}`;

      titleRow.appendChild(nameEl);
      titleRow.appendChild(priceEl);

      const descEl = document.createElement("p");
      descEl.className = "food-description";
      descEl.textContent = item.description;

      const footer = document.createElement("div");
      footer.className = "food-card-footer";

      const idTag = document.createElement("span");
      idTag.className = "item-id-tag";
      idTag.textContent = `Item #${item.id}`;

      const actionSlot = document.createElement("div");
      actionSlot.className = "item-action-slot";
      renderItemAction(item, actionSlot);

      footer.appendChild(idTag);
      footer.appendChild(actionSlot);

      body.appendChild(titleRow);
      body.appendChild(descEl);
      body.appendChild(footer);

      card.appendChild(media);
      card.appendChild(body);

      foodGrid.appendChild(card);
    });
  }

  // Toast feedback
  let toastTimer = null;
  function showToast(message) {
    if (toastTimer) clearTimeout(toastTimer);
    toastMessage.textContent = message;
    toast.classList.add("show");
    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2400);
  }

  // Category filter handling
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeCategory = btn.getAttribute("data-category");

      if (activeCategory === "All") {
        renderFoodCards(foodData);
      } else {
        const filtered = foodData.filter((item) => item.category === activeCategory);
        renderFoodCards(filtered);
      }
    });
  });

  // Initial render
  if (typeof foodData !== "undefined" && Array.isArray(foodData)) {
    renderFoodCards(foodData);
  } else {
    foodGrid.innerHTML = `<div class="empty-state"><p>Food data could not be loaded.</p></div>`;
  }
});
