// Simple Mobile Menu JavaScript
document.addEventListener("DOMContentLoaded", function () {
  const navbarToggler = document.querySelector(".navbar-toggler");
  const navbarCollapse = document.querySelector(".navbar-collapse");
  const body = document.body;

  // Handle menu toggle
  if (navbarToggler) {
    navbarToggler.addEventListener("click", function () {
      setTimeout(() => {
        if (navbarCollapse && navbarCollapse.classList.contains("show")) {
          body.classList.add("menu-open");
        } else {
          body.classList.remove("menu-open");
        }
      }, 50);
    });
  }

  // Close menu when clicking on nav links
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach((link) => {
    link.addEventListener("click", function () {
      if (window.innerWidth < 768) {
        navbarCollapse.classList.remove("show");
        navbarToggler.setAttribute("aria-expanded", "false");
        body.classList.remove("menu-open");
      }
    });
  });

  // Handle window resize
  window.addEventListener("resize", function () {
    if (window.innerWidth >= 768) {
      body.classList.remove("menu-open");
    }
  });
});
