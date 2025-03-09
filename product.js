const API = "http://13.238.18.138:3000";

document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const pid = urlParams.get("pid");
  fetchProduct(pid);
});

async function fetchProduct(pid) {
  fetch(API + `/api/products/${pid}`)
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      const product = data[0];

      const productContainer = document.querySelector(".item");
      productContainer.innerHTML = `
        <img 
          src="server/${product.image}"
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
