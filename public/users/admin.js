document.addEventListener("DOMContentLoaded", function () {
  const formDropdown = document.getElementById("action");
  formDropdown.addEventListener("change", function () {
    showForm();
    loadForm();
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

function loadForm() {
  const formValue = document.getElementById("action").value;
  console.log(formValue);
  if (formValue === "delete") {
    fetch("/api/prod")
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
    fetch("/api/prod")
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        const selectProduct = document.getElementById("edit-dropdown");
        selectProduct.name = "pid";
        selectProduct.id = "edit-dropdown";
        data.forEach((product) => {
          const option = document.createElement("option");
          option.value = product.pid;
          option.textContent = product.name;
          selectProduct.appendChild(option);
          const prodName = document.getElementsByName("name")[0];
          prodName.value = product.name;
          const prodPrice = document.getElementsByName("price")[0];
          prodPrice.value = product.price;
          const prodDesc = document.getElementsByName("description")[0];
          prodDesc.value = product.description;
        });
      });
  }
}
