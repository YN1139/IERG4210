const API = "http://13.238.18.138:3000";

document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const pid = urlParams.get("pid");
  fetchProduct(pid);
});

async function fetchProduct(pid) {
  fetch(API + "/api/products/" + pid)
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      const product = data[0];

      // Update the product name in the breadcrumb (3rd item)
      const breadcrumbItems = document.querySelectorAll(
        ".breadcrumb ol li.crumb"
      );
      if (breadcrumbItems && breadcrumbItems.length >= 3) {
        const productCrumb = breadcrumbItems[2]; // Third li element (0-indexed)
        if (productCrumb && productCrumb.querySelector("a")) {
          productCrumb.querySelector("a").textContent = product.name;
        }
      }

      // Get category name for the breadcrumb (2nd item)
      fetch(API + "/api/cat")
        .then((response) => response.json())
        .then((categories) => {
          // Find the category matching product.catid
          const category = categories.find((cat) => cat.catid == product.catid);

          if (category && breadcrumbItems && breadcrumbItems.length >= 2) {
            const categoryCrumb = breadcrumbItems[1]; // Second li element
            if (categoryCrumb && categoryCrumb.querySelector("a")) {
              const catLink = categoryCrumb.querySelector("a");
              catLink.textContent = category.name;
              catLink.href = `index.html?category=${category.catid}`;
            }
          }
        })
        .catch((error) => console.error("Error fetching categories:", error));

      const productContainer = document.querySelector(".item");
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
