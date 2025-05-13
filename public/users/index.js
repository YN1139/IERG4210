//const API = "";

document.addEventListener("DOMContentLoaded", function () {
  fetchCategories();

  if (window.localStorage.getItem("category")) {
    fetchProducts(window.localStorage.getItem("category"));
    window.localStorage.removeItem("category");
  } else {
    fetchAllProducts();
  }
  window.alert(
    "Here are some minor features updates after the project submission: \n" +
      "13/5 Update:\n" +
      "Removed some console.log on client side\n" +
      "Updated sql query (added ORDER BY orderID DESC LIMIT 5) for fetching the most recent 5 orders for users\n" +
      "Added a pop up box for the updates"
  );
});

async function fetchBreadcrumb(catid = null) {
  fetch("/api/category/" + catid)
    .then((response) => response.json())
    .then((data) => {
      const breadcrumb = document.querySelector(".breadcrumb ol");
      const crumb = breadcrumb.querySelectorAll("li:not(:first-child)"); //selecr all li except the first one
      crumb.forEach((li) => li.remove()); //remove them
      data.forEach((category) => {
        const li = document.createElement("li");
        li.className = "crumb";
        const a = document.createElement("a");
        a.href = "#";
        a.textContent = category.name;
        li.appendChild(a);
        breadcrumb.appendChild(li);
      });
    });
}

async function fetchCategories() {
  fetch("/api/cat")
    .then((response) => response.json())
    .then((data) => {
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
  fetch("/api/prod/")
    .then((response) => response.json())
    .then((data) => {
      const productList = document.querySelector(".productList");
      productList.innerHTML = "";
      data.forEach((product) => {
        const productDiv = document.createElement("div");
        productDiv.className = "product";

        const a = document.createElement("a");
        a.href = "/product?pid=" + encodeURIComponent(product.pid);

        const img = document.createElement("img");
        img.src = product.image;
        img.alt = product.name;

        const productInfo = document.createElement("div");
        productInfo.className = "productInfo";
        const name = document.createElement("div");
        name.textContent = product.name;
        const price = document.createElement("div");
        price.textContent = "HKD $" + product.price;
        productInfo.appendChild(name);
        productInfo.appendChild(price);

        const addToCart = document.createElement("button");
        addToCart.className = "add-to-cart";
        addToCart.dataset.pid = encodeURIComponent(product.pid);
        addToCart.textContent = "Add to cart";

        a.appendChild(img);
        a.appendChild(productInfo);
        productDiv.appendChild(a);
        productDiv.appendChild(addToCart);
        productList.appendChild(productDiv);
      });
    });
}

async function fetchProducts(catid = null) {
  fetchBreadcrumb(catid);
  fetch("/api/products/" + catid)
    .then((response) => response.json())
    .then((data) => {
      const productList = document.querySelector(".productList");
      productList.innerHTML = "";
      data.forEach((product) => {
        const productDiv = document.createElement("div");
        productDiv.className = "product";

        const a = document.createElement("a");
        a.href = "/product?pid=" + encodeURIComponent(product.pid);

        const img = document.createElement("img");
        img.src = product.image;
        img.alt = product.name;

        const productInfo = document.createElement("div");
        productInfo.className = "productInfo";
        const name = document.createElement("div");
        name.textContent = product.name;
        const price = document.createElement("div");
        price.textContent = "HKD $" + product.price;
        productInfo.appendChild(name);
        productInfo.appendChild(price);

        const addToCart = document.createElement("button");
        addToCart.className = "add-to-cart";
        addToCart.dataset.pid = encodeURIComponent(product.pid);
        addToCart.textContent = "Add to cart";

        a.appendChild(img);
        a.appendChild(productInfo);
        productDiv.appendChild(a);
        productDiv.appendChild(addToCart);
        productList.appendChild(productDiv);
      });
    });
}
