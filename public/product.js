const API = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const pid = urlParams.get("pid");
  fetchProduct(pid);
});

async function fetchProduct(pid) {
  fetch(API + "/api/product/" + pid)
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      const product = data[0];

      const productContainer = document.querySelector(".item");
      productContainer.innerHTML = `
        <img 
          src="${product.image}"
          alt="${product.name}"
        >
        <section class="itemInfo">
          <h2>${product.name}</h2>
          <div class="itemDescription">
            ${product.description}
          </div>
          <p>HKD $${product.price}</p>
          <button class="add-to-cart" data-pid="${product.pid}">Add to Cart</button>
        </section>
      `;
    });
}

/* class ShoppingCart {
  constructor() {
    this.items = new Map();
    this.loadFromStorage();
    this.bindEvents();
  }
  bindEvents() {
    // Add to cart button clicks, using event delegation
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("add-to-cart")) {
        const pid = e.target.dataset.pid;
        if (pid) {
          this.addItem(pid);
        }
      }
    });
    // Quantity controls
    document.getElementById("cart-item").addEventListener("click", (e) => {
      const item = e.target.closest(".cart-item");
      if (!item) return;
      const pid = item.dataset.pid;
      if (e.target.classList.contains("increment")) {
        this.updateQuantity(pid, 1);
      } else if (e.target.classList.contains("decrement")) {
        this.updateQuantity(pid, -1);
      } else if (e.target.classList.contains("remove-item")) {
        this.removeItem(pid);
      }
    });
  }
  async fetchProductDetails(pid) {
    try {
      const response = await fetch(`${API}/api/product/${pid}`);
      if (!response.ok) throw new Error("Product not found");

      const data = await response.json();

      const product = data[0]; // Access the first element in the array
      const item = this.items.get(pid);

      if (item) {
        // Update item properties
        item.name = product.name;
        item.price = parseFloat(product.price); // Ensure price is a number
        this.updateUI();
        this.saveToStorage();
      }
    } catch (error) {
      console.error("Failed to fetch:", error);
      this.items.delete(pid);
      alert(`Failed to load product details: ${error.message}`);
    }
  }

  saveToStorage() {
    const data = Array.from(this.items.entries()).map(([pid, item]) => ({
      pid,
      quantity: item.quantity,
      price: item.price,
      name: item.name,
    }));
    localStorage.setItem("shopping-cart", JSON.stringify(data));
  }

  addItem(pid) {
    if (this.items.has(pid)) {
      const item = this.items.get(pid);
      item.quantity++;
    } else {
      this.items.set(pid, {
        quantity: 1,
        price: 0,
        name: "",
      });
      this.fetchProductDetails(pid);
    }
    this.updateUI();
    this.saveToStorage();
  }

  updateQuantity(pid, change) {
    const item = this.items.get(pid);
    item.quantity = Math.max(1, item.quantity + change);
    this.updateUI();
    this.saveToStorage();
  }

  removeItem(pid) {
    this.items.delete(pid);
    this.updateUI();
    this.saveToStorage();
  }

  updateUI() {
    const container = document.getElementById("cart-item");
    container.innerHTML = "";
    let total = 0;
    this.items.forEach((item, pid) => {
      const template = document.getElementById("cart-item-template");
      const clone = template.content.cloneNode(true);
      const itemElement = clone.querySelector(".cart-item");
      itemElement.dataset.pid = pid;
      itemElement.querySelector(".item-name").textContent = item.name;
      itemElement.querySelector(".quantity").value = item.quantity;

      const remove = document.createElement("button");
      remove.textContent = "Remove";
      remove.className = "remove-item";
      itemElement.appendChild(remove);
      itemElement.querySelector(".item-price").textContent = `$${(
        item.price * item.quantity
      ).toFixed(1)}`;
      total += item.price * item.quantity;
      container.appendChild(clone);
    });
    document.getElementById("total-amount").textContent = total.toFixed(1);
  }

  loadFromStorage() {
    const saved = localStorage.getItem("shopping-cart");
    if (!saved) return;

    try {
      const data = JSON.parse(saved);
      data.forEach((item) => {
        // Store properties directly, not nested in an item object
        this.items.set(item.pid, {
          quantity: item.quantity || 1,
          price: parseFloat(item.price) || 0,
          name: item.name || "",
        });

        // Only fetch if we don't have name or price
        if (!item.name || !item.price) {
          this.fetchProductDetails(item.pid);
        }
      });
    } catch (error) {
      console.error("Error loading cart:", error);
      localStorage.removeItem("shopping-cart");
    }
  }
}
 */
