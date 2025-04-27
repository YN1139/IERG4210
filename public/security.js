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
});
