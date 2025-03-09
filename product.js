const API = "http://13.238.18.138:3000";

document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const pid = urlParams.get("pid");
  fetchCategories();
  fetchProduct(pid);
});

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

async function fetchProduct(pid) {
  fetch(API + "/api/products/" + pid)
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      const product = data[0];

      document.getElementById("product-crumb").querySelector("a").textContent =
        product.name;

      // Get category name for breadcrumb
      fetch(API + "/api/cat/" + product.catid)
        .then((response) => response.json())
        .then((catData) => {
          if (catData && catData[0]) {
            const catLink = document
              .getElementById("category-crumb")
              .querySelector("a");
            catLink.textContent = catData[0].name;
            catLink.href = `index.html?category=${product.catid}`;
          }
        });

      // Populate product container
      const productContainer = document.getElementById("product-container");
      productContainer.innerHTML = `
        <img 
          src="${API}/${product.image}"
          alt="${product.name}"
        >
        <section class="itemInfo">
          <h2>${product.name}</h2>
          <div class="itemDescription">
            ${product.description}
          </div>
          <p>HKD $${product.price}</p>
          <button data-pid="${product.pid}">Add to Cart</button>
        </section>
      `;
    });
}
