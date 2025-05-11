document.addEventListener("DOMContentLoaded", function () {
  const formDropdown = document.getElementById("action");
  formDropdown.addEventListener("change", function () {
    showForm();
    loadForm();
  });
  const switchTo = document.querySelectorAll(".categoryMenu a");
  console.log(switchTo);
  switchTo.addEventListener("click", function () {
    if (switchTo.textContent === "Orders") {
      fetchOrders();
    }
  });
});

function showForm() {
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

function fetchOrders() {
  fetch("/api/orders")
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      const orderContainer = document.createElement("tr");
      orderContainer.id = "order-container";
      data.forEach((order) => {
        const orderItem = document.createElement("td");
        orderItem.textContent = order.id;
        const orderProducts = document.createElement("td");
        orderProducts.textContent = order.products;
        const orderTotal = document.createElement("td");
        orderTotal.textContent = order.total;
        const orderStatus = document.createElement("td");
        orderStatus.textContent = order.status;
        orderContainer.appendChild(orderItem);
        orderContainer.appendChild(orderProducts);
        orderContainer.appendChild(orderTotal);
        orderContainer.appendChild(orderStatus);
      });
      document.getElementById("orders-list").appendChild(orderContainer);
    });
}
