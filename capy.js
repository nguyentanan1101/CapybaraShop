let cart = [];
let products = []; // Sản phẩm lấy từ backend

// Mapping tên thuộc tính sang tiếng Việt
const specLabels = {
  "Cpu": "CPU",
  "Ram": "RAM",
  "O Cung": "Ổ cứng",
  "Card Do Hoa": "Card đồ họa",
  "Man Hinh": "Màn hình",
  "Audio": "Âm thanh",
  "Ban Phim": "Bàn phím",
  "Chuan Wifi": "Chuẩn Wi-Fi",
  "Bluetooth": "Bluetooth",
  "Webcam": "Webcam",
  "He Dieu Hanh": "Hệ điều hành",
  "Pin": "Pin",
  "Trong Luong": "Trọng lượng",
  "Mau Sac": "Màu sắc",
  "Kich Thuoc": "Kích thước"
};

// Lấy danh sách sản phẩm từ backend
async function fetchProducts() {
  try {
    const response = await fetch("get_products.php");
    const data = await response.json();
    products = data;
    renderProducts();
  } catch (error) {
    console.error("Error fetching products:", error);
  }
}

// Render sản phẩm
function renderProducts() {
  const container = document.getElementById("product-list");
  container.innerHTML = "";

  products.forEach((product) => {
    const col = document.createElement("div");
    col.className = "col-md-3 mb-4";

    const card = document.createElement("div");
    card.className = "card position-relative h-100";
    card.dataset.productId = product.product_id;

    let badgeHTML = "";
    if (product.discount_price && product.discount_price < product.price) {
      badgeHTML = `<span class="badge-discount">-${Math.round(
        ((product.price - product.discount_price) / product.price) * 100
      )}%</span>`;
    }

    let priceHTML = product.discount_price && product.discount_price < product.price
      ? `<del>${formatPrice(product.price)}</del> <span class="fw-bold product-price" data-price="${product.discount_price}">${formatPrice(product.discount_price)}</span>`
      : `<span class="fw-bold product-price" data-price="${product.price}">${formatPrice(product.price)}</span>`;

    let stockInfo = `<p class="text-muted stock-info ${product.quantity === 0 ? "text-danger fw-bold" : ""}">${product.quantity > 0 ? `Còn ${product.quantity} sản phẩm` : "Hết hàng"}</p>`;

    let buyButton = `<button class="btn btn-primary add-to-cart mt-2" ${product.quantity === 0 ? "disabled" : ""}>${product.quantity === 0 ? "Hết hàng" : "Mua ngay"}</button>`;

    let specsButton = `<button class="btn btn-info btn-view-specs mt-2" data-product-id="${product.product_id}">Xem thông số</button>`;

    card.innerHTML = `
      ${badgeHTML}
      <img src="${product.image_url}" class="card-img-top" alt="${product.product_name}" />
      <div class="card-body d-flex flex-column">
        <h5 class="card-title">${product.product_name}</h5>
        <p class="card-text mt-auto">${priceHTML} ${stockInfo}</p>
        <div class="d-flex gap-2">
          ${buyButton}
          ${specsButton}
        </div>
      </div>
    `;

    col.appendChild(card);
    container.appendChild(col);
  });

  attachAddToCartEvents();
  attachViewSpecsEvents(); // Gán sự kiện xem thông số
}

// Gán sự kiện cho nút "Xem thông số"
function attachViewSpecsEvents() {
  document.querySelectorAll(".btn-view-specs").forEach((button) => {
    button.addEventListener("click", function () {
      const productId = parseInt(this.dataset.productId);
      const product = products.find(p => p.product_id === productId);

      if (!product || !product.specs) {
        alert("Không có thông số kỹ thuật");
        return;
      }

      let html = '<table class="table table-bordered">';
      for (const key in product.specs) {
        if (product.specs[key]) {
          html += `<tr><th>${specLabels[key] || key}</th><td>${product.specs[key]}</td></tr>`;
        }
      }
      html += '</table>';

      document.getElementById("specModalBody").innerHTML = html;
      const specModal = new bootstrap.Modal(document.getElementById("specModal"));
      specModal.show();
    });
  });
}

// Gán sự kiện cho các nút "Mua ngay"
function attachAddToCartEvents() {
  document.querySelectorAll(".add-to-cart").forEach((button) => {
    button.addEventListener("click", async function (event) {
      event.preventDefault();
      const card = this.closest(".card");
      const productId = parseInt(card.dataset.productId);
      const product = products.find((p) => p.product_id === productId);

      const availability = await checkProductAvailability(productId, 1);
      if (!availability.status) {
        showToast(availability.message);
        return;
      }

      const existingItemIndex = cart.findIndex(item => item.productId === productId);
      if (existingItemIndex > -1) {
        const newQuantity = cart[existingItemIndex].quantity + 1;
        const checkResult = await checkProductAvailability(productId, newQuantity);
        if (checkResult.status) {
          cart[existingItemIndex].quantity++;
          showToast();
        } else {
          showToast(checkResult.message);
        }
      } else {
        cart.push({
          productId: productId,
          name: product.product_name,
          price: product.discount_price || product.price,
          quantity: 1
        });
        showToast();
      }

      updateCartCount();
      saveCart();
    });
  });
}

// Các hàm hỗ trợ giỏ hàng giữ nguyên
function saveCart() { localStorage.setItem("shoppingCart", JSON.stringify(cart)); }
function loadCart() { 
  const savedCart = localStorage.getItem("shoppingCart"); 
  if (savedCart) cart = JSON.parse(savedCart); 
  updateCartCount(); 
  renderCartModal(); 
}
function updateCartCount() { 
  document.getElementById("cart-count").textContent = cart.reduce((sum, item) => sum + item.quantity, 0); 
}
function showToast(message = "Sản phẩm đã được thêm vào giỏ hàng!") { 
  const toast = new bootstrap.Toast(document.getElementById("addToCartToast")); 
  document.querySelector("#addToCartToast .toast-body").textContent = message; 
  toast.show(); 
}
async function checkProductAvailability(productId, requestedQuantity) {
  try {
    const response = await fetch("cart_handler.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "check", product_id: productId, quantity: requestedQuantity }),
    });
    return await response.json();
  } catch (error) {
    console.error(error);
    return { status: false, message: "Lỗi kiểm tra tồn kho" };
  }
}

function formatPrice(price) {
  return price.toLocaleString("vi-VN") + " VND";
}

// DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  fetchProducts();
  loadCart();

  document.getElementById("cartModal").addEventListener("show.bs.modal", renderCartModal);

  document.getElementById("cart-items-container").addEventListener("click", async (event) => {
    const target = event.target;

    if (target.classList.contains("increase-quantity")) {
      const index = target.dataset.index;
      const item = cart[index];
      const availability = await checkProductAvailability(item.productId, item.quantity + 1);
      if (availability.status) {
        item.quantity++;
        renderCartModal();
        updateCartCount();
      } else {
        showToast(availability.message);
      }
    } else if (target.classList.contains("decrease-quantity")) {
      const index = target.dataset.index;
      if (cart[index].quantity > 1) cart[index].quantity--;
      renderCartModal();
      updateCartCount();
    } else if (target.classList.contains("remove-item") || target.closest(".remove-item")) {
      const index = target.dataset.index || target.closest(".remove-item").dataset.index;
      cart.splice(index, 1);
      renderCartModal();
      updateCartCount();
    }
  });

  document.getElementById("confirm-order-button").addEventListener("click", processOrder);
});
