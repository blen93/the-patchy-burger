/* The Patchy Burger — menu filters, responsive nav, cart, and reveal animations */
document.addEventListener("DOMContentLoaded", () => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const money = value => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value).replace("PHP", "₱");

  if (window.lucide) window.lucide.createIcons();

  $("#year").textContent = new Date().getFullYear();

  // Mobile navigation
  const navToggle = $("#nav-toggle");
  const navMenu = $("#nav-menu");
  function closeNav() {
    navMenu.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation");
    navToggle.innerHTML = '<i data-lucide="menu"></i>';
    if (window.lucide) window.lucide.createIcons();
  }
  navToggle.addEventListener("click", () => {
    const open = navMenu.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    navToggle.innerHTML = `<i data-lucide="${open ? "x" : "menu"}"></i>`;
    if (window.lucide) window.lucide.createIcons();
  });
  $$(".nav-link", navMenu).forEach(link => link.addEventListener("click", closeNav));
  window.addEventListener("resize", () => { if (window.innerWidth > 760) closeNav(); });

  // Header shadow on scroll
  const header = $("#header");
  const updateHeader = () => header.classList.toggle("scrolled", window.scrollY > 10);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  // Menu category filters
  $$(".filter-btn").forEach(button => {
    button.addEventListener("click", () => {
      $$(".filter-btn").forEach(item => item.classList.toggle("active", item === button));
      const filter = button.dataset.filter;
      $$(".product-card").forEach(card => {
        const visible = filter === "all" || card.dataset.category === filter;
        card.classList.toggle("is-hidden", !visible);
      });
    });
  });

  // Subtle reveal animations; content remains visible if observer isn't supported.
  const revealItems = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add("visible"));
  }

  // Front-end demo cart. Replace checkout action with your ordering provider/backend.
  const products = {
    classic: { id: "classic", name: "The Patchy Classic", price: 249 },
    double: { id: "double", name: "Double Trouble", price: 329 },
    chicken: { id: "chicken", name: "Crunchy Chick", price: 229 },
    fire: { id: "fire", name: "Firestarter", price: 279 },
    fries: { id: "fries", name: "Golden Fries", price: 99 },
    drink: { id: "drink", name: "Citrus Cooler", price: 79 }
  };
  const cart = new Map();
  const cartDrawer = $("#cart-drawer");
  const cartOverlay = $("#cart-overlay");
  const cartItems = $("#cart-items");
  const toast = $("#toast");
  let toastTimeout;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove("show"), 2300);
  }
  function openCart() {
    cartOverlay.hidden = false;
    requestAnimationFrame(() => cartOverlay.classList.add("visible"));
    cartDrawer.classList.add("open");
    cartDrawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    $("#cart-close").focus();
  }
  function closeCart() {
    cartDrawer.classList.remove("open");
    cartDrawer.setAttribute("aria-hidden", "true");
    cartOverlay.hidden = true;
    document.body.classList.remove("no-scroll");
    $("#cart-open").focus();
  }
  function renderCart() {
    const entries = [...cart.values()];
    const count = entries.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = entries.reduce((sum, item) => sum + item.price * item.quantity, 0);
    $("#cart-count").textContent = count;
    $("#drawer-count").textContent = `(${count})`;
    $("#cart-subtotal").textContent = money(subtotal);

    if (!entries.length) {
      cartItems.innerHTML = `<div class="cart-empty"><i data-lucide="shopping-bag"></i><h3>Your bag is taking a break.</h3><p>Add something delicious from the menu.</p><button class="button button-primary" id="cart-browse">Browse menu</button></div>`;
      $("#cart-browse").addEventListener("click", () => {
        closeCart();
        $("#menu").scrollIntoView({ behavior: "smooth" });
      });
    } else {
      cartItems.innerHTML = entries.map(item => `
        <div class="cart-line" data-cart-id="${item.id}">
          <div><h3>${item.name}</h3><span class="line-price">${money(item.price)} each</span>
            <div class="qty-control">
              <button type="button" data-action="decrease" data-id="${item.id}" aria-label="Decrease ${item.name} quantity"><i data-lucide="minus"></i></button>
              <span>${item.quantity}</span>
              <button type="button" data-action="increase" data-id="${item.id}" aria-label="Increase ${item.name} quantity"><i data-lucide="plus"></i></button>
            </div>
            <button class="remove-item" type="button" data-action="remove" data-id="${item.id}">Remove</button>
          </div>
          <strong>${money(item.price * item.quantity)}</strong>
        </div>`).join("");
      $$("[data-action]", cartItems).forEach(button => {
        button.addEventListener("click", () => {
          const id = button.dataset.id;
          const item = cart.get(id);
          if (!item) return;
          if (button.dataset.action === "increase") item.quantity += 1;
          if (button.dataset.action === "decrease") item.quantity -= 1;
          if (button.dataset.action === "remove" || item.quantity <= 0) cart.delete(id);
          else cart.set(id, item);
          renderCart();
        });
      });
    }
    if (window.lucide) window.lucide.createIcons();
  }

  $$(".add-button").forEach(button => {
    button.addEventListener("click", () => {
      const product = products[button.dataset.id];
      if (!product) return;
      const existing = cart.get(product.id);
      if (existing) existing.quantity += 1;
      else cart.set(product.id, { ...product, quantity: 1 });
      renderCart();
      showToast(`${product.name} added to your bag`);
      button.classList.add("added");
      setTimeout(() => button.classList.remove("added"), 350);
    });
  });
  $("#cart-open").addEventListener("click", openCart);
  $("#cart-close").addEventListener("click", closeCart);
  cartOverlay.addEventListener("click", closeCart);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      if (cartDrawer.classList.contains("open")) closeCart();
      closeNav();
    }
  });
  $("#checkout-button").addEventListener("click", () => {
    if (!cart.size) {
      showToast("Your bag is empty — add a favorite first.");
      return;
    }
    showToast("Demo cart only. Connect this button to your real ordering channel.");
  });
  renderCart();

  // Active navigation link as the user scrolls through sections.
  const sections = ["home", "story", "menu", "reviews", "contact"].map(id => document.getElementById(id)).filter(Boolean);
  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          $$(".nav-link").forEach(link => link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`));
        }
      });
    }, { rootMargin: "-35% 0px -55% 0px" });
    sections.forEach(section => sectionObserver.observe(section));
  }
});
