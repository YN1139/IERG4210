const API = "http://13.238.18.138:3000";

document.addEventListener("DOMContentLoaded", function () {
  fetchCategories();
  fetchAllProducts();
  fetchBreadcrumb();
});

async function fetchBreadcrumb() {
  fetch(API + "/api/cat")
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      const breadcrumb = document.querySelector(".breadcrumb li");
      data.forEach((category) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.textContent = category.name;
        a.addEventListener("click", function () {
          a.href = fetchCategories();
        });
        li.appendChild(a);
        breadcrumb.appendChild(li);
      });
    });
}

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
                src="${product.image}"
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
              src="${product.image}"
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
