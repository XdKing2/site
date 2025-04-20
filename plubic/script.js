document.getElementById("modeToggle")?.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

fetch("/api/products")
  .then(res => res.json())
  .then(products => {
    const list = document.getElementById("product-list");
    if (!list) return;
    list.innerHTML = products.map(p => \`
      <div class="product-card">
        <img src="\${p.image}" alt="\${p.name}">
        <h3>\${p.name}</h3>
        <p>\${p.category}</p>
        <strong>₦\${p.price}</strong>
      </div>\`).join('');
  });