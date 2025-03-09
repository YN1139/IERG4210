const API = "http://13.238.18.138:3000";

document.addEventListener("DOMContentLoaded", function () {
  fetchCategories();
  //fetchProducts();
});

function fetchCategories() {
  fetch(API + "/api/categories")
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
