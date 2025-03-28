const API = "";

document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const pid = urlParams.get("pid");
  fetchProduct(pid);
});

async function fetchProduct(pid) {
  const response = await fetch(API + "/api/product/" + pid);
  const data = await response.json();
  const product = data[0];
  await fetchBreadcrumbProduct(product.pid);
  const productContainer = document.querySelector(".item");

  const img = document.createElement("img");
  img.src = product.image;
  img.alt = product.name;
  productContainer.appendChild(img);

  const section = document.createElement("section");
  section.className = "itemInfo";
  const productHeader = document.createElement("h2");
  productHeader.textContent = product.name;
  section.appendChild(productHeader);

  const descriptionDiv = document.createElement("div");
  descriptionDiv.className = "itemDescription";
  descriptionDiv.textContent = product.description;
  section.appendChild(descriptionDiv);

  const price = document.createElement("p");
  price.textContent = "HKD $" + product.price;
  section.appendChild(price);

  const addToCart = document.createElement("button");
  addToCart.className = "add-to-cart";
  addToCart.dataset.pid = encodeURIComponent(product.pid);
  addToCart.textContent = "Add to Cart";
  section.appendChild(addToCart);
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
  a.textContent = category.name;
  a.addEventListener("click", function () {
    redirectToCategories(category.catid);
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
  const a = document.createElement("a");
  a.textContent = product.name;
  a.href = "#";
  li.appendChild(a);
  breadcrumb.appendChild(li);
}

function redirectToCategories(pid) {
  window.location.href = "/";
  window.localStorage.setItem("category", pid);
}
