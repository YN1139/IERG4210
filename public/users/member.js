document.addEventListener("DOMContentLoaded", function () {
  fetchOrders();
  const switchTo = document.querySelectorAll(".categoryMenu a");
  console.log(switchTo);
  switchTo.forEach((a) => {
    a.addEventListener("click", function () {
      if (a.textContent === "Orders") {
        fetchOrders();
      }
    });
  });
});

function fetchOrders() {
  fetch("/api/user-orders")
    .then((response) => response.json())
    .then(async (data) => {
      console.log(data);

      const ordersList = document.getElementById("orders-container");
      ordersList.innerHTML = "";

      if (data.length === 0) {
        const noOrders = document.createElement("p");
        noOrders.textContent = "No orders found";
        ordersList.appendChild(noOrders);
        return;
      }

      data.orders.forEach((order) => {
        console.log(order);
        const box = document.createElement("div");
        box.className = "order-box";
        const idDiv = document.createElement("div");
        idDiv.textContent = `Order #` + data.customerOrder[0].customerOrderID;
        box.appendChild(idDiv);

        const productsDiv = document.createElement("div");

        order.products.forEach((products) => {
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
        totalDiv.innerHTML = `<b>Total:</b><br>HKD $${order.total}`;
        box.appendChild(totalDiv);

        const statusDiv = document.createElement("div");
        statusDiv.className = "order-status";
        statusDiv.innerHTML = `<b>Status:</b><br>${order.status}`;
        box.appendChild(statusDiv);

        ordersList.appendChild(box);
      });
    });
}
