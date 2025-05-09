document.addEventListener("DOMContentLoaded", function () {
  const formDropdown = document.getElementById("action");
  formDropdown.addEventListener("change", function () {
    showForm();
    loadForm();
  });

  const deleteForm = document.getElementById("delete");
  deleteForm.addEventListener("submit", function (e) {
    // Get the CSRF token
    const csrfToken = document.querySelector('input[name="_csrf"]').value;
    if (!csrfToken) {
      e.preventDefault();
      alert("CSRF token is missing. Please refresh the page and try again.");
      return;
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
          checkbox.name = "pid[]";
          checkbox.value = product.pid;

          const productInfo = document.createElement("div");
          productInfo.textContent = product.pid + " - " + product.name;

          productDiv.appendChild(checkbox);
          productDiv.appendChild(productInfo);
          productsList.appendChild(productDiv);
        });
      });
  }
}
