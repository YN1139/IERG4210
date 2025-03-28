const API = "http://13.238.18.138:3000";

document.addEventListener("DOMContentLoaded", function () {
  fetchCategories();

  if (window.localStorage.getItem("category")) {
    fetchProducts(window.localStorage.getItem("category"));
    window.localStorage.removeItem("category");
  } else {
    fetchAllProducts();
  }
});

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
        const a = document.createElement("a");
        a.href = "#";
        a.textContent = category.name;
        /* li.innerHTML = `
        <a href="#">${category.name}</a>
      `; */
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

        const a = document.createElement("a");
        a.href = "product.html?pid=" + product.pid;

        const img = document.createElement("img");
        img.src = product.image;
        img.alt = product.name;

        const productInfo = document.createElement("div");
        productInfo.className = "productInfo";
        productInfo.textContent = product.name + "\nHKD $" + product.price;

        const addToCart = document.createElement("button");
        addToCart.className = "add-to-cart";
        addToCart.dataset.pid = product.pid;
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
  fetch(API + "/api/products/" + catid)
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      const productList = document.querySelector(".productList");
      productList.innerHTML = "";
      data.forEach((product) => {
        const productDiv = document.createElement("div");
        productDiv.className = "product";

        const a = document.createElement("a");
        a.href = "product.html?pid=" + product.pid;

        const img = document.createElement("img");
        img.src = product.image;
        img.alt = product.name;

        const productInfo = document.createElement("div");
        productInfo.className = "productInfo";
        productInfo.textContent = product.name + "\nHKD $" + product.price;

        const addToCart = document.createElement("button");
        addToCart.className = "add-to-cart";
        addToCart.dataset.pid = product.pid;
        addToCart.textContent = "Add to cart";

        a.appendChild(img);
        a.appendChild(productInfo);
        productDiv.appendChild(a);
        productDiv.appendChild(addToCart);
        productList.appendChild(productDiv);
      });
    });
}
