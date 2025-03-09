const API = "http://13.238.18.138:3000";

document.addEventListener("DOMContentLoaded", function () {
  fetchCategories();
  fetchAllProducts();

  window.cart = new ShoppingCart();
});

async function fetchCategories() {
  fetch(API + "/api/cat")
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      const categoryList = document.querySelector(".categoryMenu ul");
      data.forEach((category) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = "#";
        a.textContent = category.name;
        a.addEventListener("click", function () {
          fetchProducts(category.catid);
        });
        li.appendChild(a);
        categoryList.appendChild(li);
      });
    });
}

async function fetchAllProducts() {
  fetch(API + "/api/prod/")
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      const productList = document.querySelector(".productList");
      productList.innerHTML = "";
      data.forEach((product) => {
        const productDiv = document.createElement("div");
        productDiv.className = "product";
        productDiv.innerHTML = `
          <a href="product.html?pid=${product.pid}">
              <img
                src="server/${product.image}"
                alt="${product.name}"
              />
              <div class="productInfo">${product.name}<br>HKD $${product.price}</div>
            </a>
            <button class="add-to-cart" data-pid="${product.pid}">Add to cart</button>
          `;
        productList.appendChild(productDiv);
      });
    });
}

async function fetchProducts(catid = null) {
  fetch(API + "/api/products/" + catid)
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      const productList = document.querySelector(".productList");
      productList.innerHTML = "";
      data.forEach((product) => {
        const productDiv = document.createElement("div");
        productDiv.className = "product";
        productDiv.innerHTML = `
        <a href="product.html?pid=${product.pid}">
            <img
              src="server/${product.image}"
              alt="${product.name}"
            />
            <div class="productInfo">${product.name}<br>HKD $${product.price}</div>
          </a>
          <button class=add-to-cart data-pid="${product.pid}">Add to cart</button>
        `;
        productList.appendChild(productDiv);
      });
    });
}

class ShoppingCart {
  constructor() {
    this.items = new Map();
    this.loadFromStorage();
    this.bindEvents();
  }
  bindEvents() {
    // Add to cart button clicks
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

      // Get the first product from array
      if (!data || !data[0]) {
        throw new Error("Invalid product data");
      }

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
      /* const template = document.getElementById("cart-item-template");
      const clone = template.content.cloneNode(true);
      const itemElement = clone.querySelector(".cart-item");
      itemElement.dataset.pid = pid;
      itemElement.querySelector(".item-name").textContent = item.name;
      itemElement.querySelector(".quantity").value = item.quantity;
      itemElement.querySelector(".item-price").textContent = `$${(
        item.price * item.quantity
      ).toFixed(2)}`;
      total += item.price * item.quantity;
      container.appendChild(clone);
    }); */
      // Create cart item
      const li = document.createElement("li");
      li.className = "cart-item";
      li.dataset.pid = pid;

      li.innerHTML = `
      <span class="item-name">${item.name}</span>
      <div class="quantity-controls">
        <button class="decrement">-</button>
        <input type="number" class="quantity" min="1" value="${item.quantity}">
        <button class="increment">+</button>
      </div>
      <span class="item-price">$${(item.price * item.quantity).toFixed(
        1
      )}</span>
    `;

      total += item.price * item.quantity;
      container.appendChild(li);
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
