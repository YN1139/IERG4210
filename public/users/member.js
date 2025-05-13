document.addEventListener("DOMContentLoaded", function () {
  fetchOrders();
  const switchTo = document.querySelectorAll(".categoryMenu a");
  //console.log(switchTo);
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
      const ordersList = document.getElementById("orders-container");
      ordersList.innerHTML = "";

      if (data.orders.length === 0 && data.customerOrder.length === 0) {
        const noOrders = document.createElement("p");
        noOrders.textContent = "No orders found";
        ordersList.appendChild(noOrders);
        return;
      }

      data.orders.forEach((order) => {
        const box = document.createElement("div");
        box.className = "order-box";

        const customerID = data.customerOrder.find(
          (cID) => cID.orderID === order.orderID
        );
        const idDiv = document.createElement("div");
        idDiv.textContent =
          `Order #` + (customerID ? customerID.customerOrderID : customerID);
        box.appendChild(idDiv);

        const productsDiv = document.createElement("div");

        order.products.forEach((products) => {
          fetch("/api/product/" + products.pid)
            .then((response) => response.json())
            .then((product) => {
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
