const API = "http://13.238.18.138:3000";

document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const pid = urlParams.get("pid");
  fetchProduct(pid);
});

async function fetchProduct(pid) {
  fetch(API + "/api/product/" + pid)
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      const product = data[0];
      fetchBreadcrumbProduct(product.pid);
      const productContainer = document.querySelector(".item");
      productContainer.innerHTML = `
        <img 
          src="${product.image}"
          alt="${product.name}"
        >
        <section class="itemInfo">
          <h2>${product.name}</h2>
          <div class="itemDescription">
            ${product.description}
          </div>
          <p>HKD $${product.price}</p>
          <button class="add-to-cart" data-pid="${product.pid}">Add to Cart</button>
        </section>
      `;
    });
}

async function fetchProducts(catid = null) {
  fetchBreadcrumb(catid);
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

async function fetchBreadcrumb(catid = null) {
  const response = await fetch(API + "/api/category/" + catid);
  const data = await response.json();
  const category = data[0];
  console.log(category.name);
  const breadcrumb = document.querySelector(".breadcrumb ol");

  const li = document.createElement("li");
  li.className = "crumb";
  const a = document.createElement("a");
  a.href = "#";
  a.textContent = category.name;
  a.addEventListener("click", function () {
    fetchProducts(category.catid);
  });
  li.appendChild(a);
  breadcrumb.appendChild(li);
}

async function fetchBreadcrumbProduct(pid) {
  const response = await fetch(API + "/api/product/" + pid);
  const data = await response.json();
  const product = data[0];
  console.log(product.name);
  const breadcrumb = document.querySelector(".breadcrumb ol");
  if (product.catid) {
    await fetchBreadcrumb(product.catid);
  }
  const li = document.createElement("li");
  li.className = "crumb";
  li.innerHTML = `
        <a href="#">${product.name}</a>
  `;
  breadcrumb.appendChild(li);
}
