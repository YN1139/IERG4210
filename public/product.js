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

async function fetchBreadcrumb(catid = null) {
  fetch(API + "/api/category/" + catid)
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      const breadcrumb = document.querySelector(".breadcrumb ol");
      const crumb = breadcrumb.querySelectorAll("li:not(:first-child)"); //selecr all li except the first one
      crumb.forEach((li) => li.remove()); //remove them
      data.forEach((category) => {
        const li = document.createElement("li");
        li.className = "crumb";
        li.innerHTML = `
        <a href="#">${category.name}</a>
      `;
        breadcrumb.appendChild(li);
      });
    });
}

async function fetchBreadcrumbProduct(pid) {
  const response = await fetch(API + "/api/product/" + pid);
  const data = await response.json();
  const product = data[0];
  console.log(product.name);
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
