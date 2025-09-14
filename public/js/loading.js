const messages = [
  {
    status: "Welcome to Wanderlust",
    subtitle: "Where travelers meet amazing hosts",
  },
  {
    status: "Loading your marketplace",
    subtitle: "Browse listings or become a host today",
  },
  {
    status: "Connecting communities",
    subtitle: "Join thousands creating unforgettable experiences",
  },
  {
    status: "Building your platform",
    subtitle: "List your space and start earning instantly",
  },
  {
    status: "Ready to get started",
    subtitle: "Book unique stays or share your space",
  },
];

let currentIndex = 0;
const statusEl = document.getElementById("status");
const subtitleEl = document.getElementById("subtitle");

function updateMessage() {
  // Fade out
  statusEl.classList.add("fade-out");
  subtitleEl.classList.add("fade-out");

  setTimeout(() => {
    // Update content
    statusEl.textContent = messages[currentIndex].status;
    subtitleEl.textContent = messages[currentIndex].subtitle;

    // Fade in
    statusEl.classList.remove("fade-out");
    subtitleEl.classList.remove("fade-out");
    statusEl.classList.add("fade-in");
    subtitleEl.classList.add("fade-in");

    setTimeout(() => {
      statusEl.classList.remove("fade-in");
      subtitleEl.classList.remove("fade-in");
    }, 400);

    currentIndex = (currentIndex + 1) % messages.length;
  }, 300);
}

// Start message rotation after initial display
setTimeout(() => {
  setInterval(updateMessage, 3000);
}, 2000);

// Auto refresh after 45 seconds
setTimeout(() => {
  window.location.reload();
}, 45000);
