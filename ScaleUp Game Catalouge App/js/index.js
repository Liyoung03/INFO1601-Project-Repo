//SIDE BAR FUNCTION

const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const closeSidebar = document.getElementById("closeSidebar");
const overlay = document.getElementById("sidebarOverlay");

// Open sidebar
menuToggle.addEventListener("click", () => {
  sidebar.classList.add("active");
  overlay.classList.add("active");
});

// Close sidebar function
function closeSidebarMenu() {
  sidebar.classList.remove("active");
  overlay.classList.remove("active");
}

// Close with X button
closeSidebar.addEventListener("click", closeSidebarMenu);

// Close with overlay click
overlay.addEventListener("click", closeSidebarMenu);

// Close on escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeSidebarMenu();
});
