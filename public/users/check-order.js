document.getElementById("check-order-form").addEventListener("submit", (e) => {
  e.preventDefault();
  fetchOrders();
});

async function fetchOrders() {
  const orderID = document.getElementById("order-id").value;
  const response = await fetch("/api/orders/" + orderID, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": document.querySelector('input[name="_csrf"]').value,
    },
  });
  if (!response.ok) {
    alert("Failed to fetch order. Please try again.");
    return;
  }
  const data = await response.json();
  console.log(data);

  const ordersList = document.getElementById("orders-container");
  ordersList.innerHTML = "";

  if (data.length === 0) {
    const noOrders = document.createElement("p");
    noOrders.textContent = "No orders found. Please check your order ID again.";
    ordersList.appendChild(noOrders);
    return;
  }

  const customerOrderID = data.customerOrder[0].customerOrderID;

  data.order.forEach((o) => {
    console.log(o);
    const box = document.createElement("div");
    box.className = "order-box";

    const idDiv = document.createElement("div");
    idDiv.textContent = `Order #` + customerOrderID;
    box.appendChild(idDiv);
    const userDiv = document.createElement("div");
    userDiv.textContent = `User: ` + o.user;
    box.appendChild(userDiv);

    const productsDiv = document.createElement("div");

    o.products.forEach((products) => {
      fetch("/api/product/" + products.pid)
        .then((response) => response.json())
        .then((product) => {
          console.log(product);
          const productDiv = document.createElement("div");
          productDiv.textContent = product[0].name;
          productsDiv.appendChild(productDiv);
          const priceDiv = document.createElement("div");
          priceDiv.textContent = "HKD $" + product[0].price;
          productsDiv.appendChild(priceDiv);
          const quantityDiv = document.createElement("div");
          quantityDiv.textContent = "x" + products.quantity;
          productsDiv.appendChild(quantityDiv);
        });
    });
    box.appendChild(productsDiv);

    const totalDiv = document.createElement("div");
    totalDiv.className = "order-total";
    totalDiv.innerHTML = `<b>Total:</b><br>HKD $${o.total}`;
    box.appendChild(totalDiv);

    const statusDiv = document.createElement("div");
    statusDiv.className = "order-status";
    statusDiv.innerHTML = `<b>Status:</b><br>${o.status}`;
    box.appendChild(statusDiv);

    ordersList.appendChild(box);
  });
}
