document.addEventListener("DOMContentLoaded", function () {
  fetchCategories();
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
        showOrders();
        hideForms();
        fetchOrders();
      } else {
        hideOrders();
        showForm();
        loadForm();
      }
    });
  });
});

function showOrders() {
  const ordersContainer = document.getElementById("orders-container");
  ordersContainer.style.display = "flex";
}

function hideOrders() {
  const ordersContainer = document.getElementById("orders-container");
  ordersContainer.style.display = "none";
}

function showForm() {
  const label = document.getElementById("action-label");
  label.style.display = "block";
  const dropdown = document.getElementById("action");
  dropdown.style.display = "block";
  const forms = document.querySelectorAll("form");
  console.log(forms);
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
  if (formValue === "add") {
    fetchCategories();
  }
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
    await fetchCategories();
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

async function fetchOrders() {
  fetch("/api/orders")
    .then((response) => response.json())
    .then(async (data) => {
      console.log(data);
      const ordersList = document.getElementById("orders-container");
      ordersList.innerHTML = "";

      data.forEach((order) => {
        console.log(order);
        const box = document.createElement("div");
        box.className = "order-box";
        const idDiv = document.createElement("div");
        idDiv.textContent = `Order #${order.orderID}`;
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

async function fetchCategories() {
  await fetch("/api/cat")
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      const editCategoriesList = document.getElementById("edit-category");
      const deleteCategoriesList = document.getElementById("delete-category");

      if (editCategoriesList) {
        editCategoriesList.innerHTML = "";
        data.forEach((category) => {
          const option = document.createElement("option");
          option.value = category.catid;
          option.textContent = category.name;
          editCategoriesList.appendChild(option);
        });
      }
      if (deleteCategoriesList) {
        deleteCategoriesList.innerHTML = "";
        data.forEach((category) => {
          const option = document.createElement("option");
          option.value = category.catid;
          option.textContent = category.name;
          deleteCategoriesList.appendChild(option);
        });
      }
    });
}
