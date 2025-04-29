document.addEventListener("DOMContentLoaded", function () {
  fetch("/api/csrf-token", { credentials: "include" })
    .then((response) => response.json())
    .then((data) => {
      document.querySelectorAll("form").forEach((form) => {
        let csrf = form.querySelector('input[name="_csrf"]');
        if (!csrf) {
          csrf = document.createElement("input");
          csrf.type = "hidden";
          csrf.name = "_csrf";
          form.appendChild(csrf);
        }
        csrf.value = data.csrfToken;
        console.log("csrf to client", csrf.value);
      });
    });
  fetchUserStatus();
});

async function fetchUserStatus() {
  fetch("/api/userStatus")
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      const navBar = document.querySelector(".pages ul");
      const li = document.createElement("li");
      li.textContent = data;
      navBar.appendChild(li);

      //add logout button if user is logged in
      if (data !== "guest") {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.textContent = "Logout";
        a.href = "/logout";
        li.appendChild(a);
        navBar.appendChild(li);
      }
    });
}
