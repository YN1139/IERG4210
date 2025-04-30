document.addEventListener("DOMContentLoaded", function () {
  if (!window.cart) {
    window.cart = new ShoppingCart();
  }
  window.cart.updateUI();
  if (!stripe) {
    InitStripe();
  }
});

class ShoppingCart {
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

    document.getElementById("checkout").addEventListener("click", async () => {
      if (!stripe) {
        console.log("Stripe not initialized");
        return;
      }
      await this.handleCheckout();
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
        this.items.set(item.pid, {
          quantity: item.quantity || 1,
          price: parseFloat(item.price) || 0,
          name: item.name || "",
        });

        // Fetch product details if missing
        if (!item.name || !item.price) {
          this.fetchProductDetails(item.pid);
        }
      });
    } catch (error) {
      console.error("Error loading cart:", error);
      localStorage.removeItem("shopping-cart");
    }
  }

  async handleCheckout() {
    //pass only pid and quantity to the server
    const cart = Array.from(this.items.entries()).map(([pid, item]) => ({
      pid,
      quantity: item.quantity,
    }));

    const response = await fetch(`${API}/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cart),
    });

    const session = await response.json();

    if (session.error) {
      alert(session.error);
    } else {
      const result = await stripe.redirectToCheckout({
        sessionId: session.id,
      });
      if (result.error) {
        alert(result.error.message);
      } else {
        this.clearCart();
      }
    }
  }
}

async function InitStripe() {
  fetch("/api/stripe")
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      const stripe = Stripe(data);
    });
}
