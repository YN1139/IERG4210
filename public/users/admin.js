document.addEventListener("DOMContentLoaded", function () {
  const formDropdown = document.getElementById("action");
  formDropdown.addEventListener("change", function () {
    showForm();
    loadForm();
  });
  const switchTo = document.querySelectorAll(".categoryMenu a");
  console.log(switchTo);
  switchTo.forEach((a) => {
    a.addEventListener("click", function () {
      if (a.textContent === "Orders") {
        hideForms();
        fetchOrders();
      } else {
        hideTable();
        showForm();
        loadForm();
      }
    });
  });
});

function hideTable() {
  const table = document.getElementById("orders-table");
  table.style.display = "none";
}

function showForm() {
  const label = document.getElementById("action-label");
  label.style.display = "block";
  const dropdown = document.getElementById("action");
  dropdown.style.display = "block";
  const forms = document.querySelectorAll("form");
  const selctedValue = document.getElementById("action").value;

  console.log(selctedValue);

  forms.forEach((form) => {
    form.style.display = "none";
  });
  document.getElementById(selctedValue).style.display = "block";
}

async function loadForm() {
  const formValue = document.getElementById("action").value;
  console.log(formValue);
  if (formValue === "delete") {
    await fetch("/api/prod")
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        const productsList = document.getElementById("products-list");
        productsList.innerHTML = "";

        data.forEach((product) => {
          const productDiv = document.createElement("div");
          productDiv.className = "product";

          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.name = "pid";
          checkbox.value = product.pid;

          const productInfo = document.createElement("div");
          productInfo.textContent = product.pid + " - " + product.name;

          productDiv.appendChild(checkbox);
          productDiv.appendChild(productInfo);
          productsList.appendChild(productDiv);
        });
      });
  }

  if (formValue === "edit") {
    await fetch("/api/prod")
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        const selectProduct = document.getElementById("edit-dropdown");
        selectProduct.name = "pid";
        selectProduct.id = "edit-dropdown";
        data.forEach((product) => {
          const option = document.createElement("option");
          option.value = product.pid; //set the value of the option to the pid of the product
          option.textContent = product.name;
          selectProduct.appendChild(option);
        });
        selectProduct.addEventListener("change", function () {
          const selectedPid = selectProduct.value;
          const selectedProduct = data.find(
            (product) => product.pid == selectedPid
          ); //find the product with the selected pid
          const prodCat = document.getElementById("edit-category");
          prodCat.value = selectedProduct.catid;
          const prodName = document.getElementById("edit-name");
          prodName.value = selectedProduct.name;
          const prodPrice = document.getElementById("edit-price");
          prodPrice.value = selectedProduct.price;
          const prodDesc = document.getElementById("edit-description");
          prodDesc.value = selectedProduct.description;
          const prodImage = document.getElementById("ogImage");
          prodImage.src = selectedProduct.image;
        });
      });
  }
}

function hideForms() {
  const label = document.getElementById("action-label");
  label.style.display = "none";
  const dropdown = document.getElementById("action");
  dropdown.style.display = "none";
  const forms = document.querySelectorAll("form");
  forms.forEach((form) => {
    form.style.display = "none";
  });
}

function fetchOrders() {
  fetch("/api/orders")
    .then((response) => response.json())
    .then(async (data) => {
      const ordersList = document.getElementById("orders-list");
      ordersList.innerHTML = "";

      data.forEach((order) => {
        const orderItem = document.createElement("tr");
        orderItem.id = "order-container";
        orderItem.textContent = order.id;
        fetch("api/product/" + order.products[0].pid)
          .then((response) => response.json())
          .then((product) => {
            console.log(product);
            const orderProducts = document.createElement("td");
            orderProducts.textContent = product.name;
            orderContainer.appendChild(orderProducts);
            const orderPrice = document.createElement("td");
            orderPrice.textContent = product.price;
            orderContainer.appendChild(orderPrice);
            const orderQuantity = document.createElement("td");
            orderQuantity.textContent = order.quantity;
            orderContainer.appendChild(orderQuantity);
          });

        orderContainer.appendChild(orderItem);
      });
      const orderTotal = document.createElement("td");
      orderTotal.textContent = data.total;
      const orderStatus = document.createElement("td");
      orderStatus.textContent = data.status;
      orderContainer.appendChild(orderTotal);
      orderContainer.appendChild(orderStatus);
      document.getElementById("orders-list").appendChild(orderContainer);
    });
}
