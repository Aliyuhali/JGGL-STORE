// ===========================================
// JGGL-STORE Version 6.0
// Main JavaScript File
// Phase 3
// ===========================================

// Cart Storage
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Save Cart
function saveCart(){
    localStorage.setItem("cart", JSON.stringify(cart));
}

// Update Cart Count
function updateCartCount(){

    let cartCount = document.getElementById("cartCount");

    if(cartCount){
        cartCount.innerHTML = cart.length;
    }

}

// Add Product To Cart
function addToCart(product, price){

    let existing = cart.find(item => item.product === product);

    if(existing){

        existing.quantity++;

    }else{

        cart.push({
            product: product,
            price: price,
            quantity: 1
        });

    }

    saveCart();
    updateCartCount();

    alert(product + " added to cart successfully!");

}

// Show Cart
function showCart(){

    let cartItems = document.getElementById("cartItems");
    let totalBox = document.getElementById("total");

    if(!cartItems || !totalBox){
        return;
    }

    cartItems.innerHTML = "";

    let total = 0;

    cart.forEach(function(item, index){

        let itemTotal = item.price * item.quantity;
        total += itemTotal;

        cartItems.innerHTML += `

        <div class="cart-item">

            <h3>${item.product}</h3>

            <p>Price: ₦${item.price.toLocaleString()}</p>

            <p>

                Quantity

                <button onclick="changeQuantity(${index},-1)">
                −
                </button>

                <strong>${item.quantity}</strong>

                <button onclick="changeQuantity(${index},1)">
                +
                </button>

            </p>

            <p>
            Subtotal:
            ₦${itemTotal.toLocaleString()}
            </p>

            <button onclick="removeItem(${index})">
            Remove
            </button>

        </div>

        `;

    });

    totalBox.innerHTML =
    "Total: ₦" + total.toLocaleString();

}

// ===========================================
// Change Quantity
// ===========================================

function changeQuantity(index, amount){

    cart[index].quantity += amount;

    if(cart[index].quantity <= 0){
        cart.splice(index, 1);
    }

    saveCart();
    updateCartCount();
    showCart();

}


// ===========================================
// Remove Item
// ===========================================

function removeItem(index){

    if(confirm("Remove this item from cart?")){

        cart.splice(index, 1);

        saveCart();
        updateCartCount();
        showCart();

    }

}


// ===========================================
// Clear Cart
// ===========================================

function clearCart(){

    if(confirm("Clear all items from cart?")){

        cart = [];

        saveCart();
        updateCartCount();
        showCart();

    }

}


// ===========================================
// Search Products
// ===========================================

function searchProduct(){

    let input = document.getElementById("searchInput");

    if(!input){
        return;
    }

    let keyword = input.value.toLowerCase();

    let products = document.querySelectorAll(".product-card");

    products.forEach(function(product){

        let name = product.querySelector("h3").textContent.toLowerCase();

        if(name.includes(keyword)){
            product.style.display = "";
        }else{
            product.style.display = "none";
        }

    });

}

// ===========================================
// Load Checkout
// ===========================================

function loadCheckout(){

    let checkoutItems = document.getElementById("checkoutItems");
    let checkoutTotal = document.getElementById("checkoutTotal");

    if(!checkoutItems || !checkoutTotal){
        return;
    }

    checkoutItems.innerHTML = "";

    let total = 0;

    cart.forEach(function(item){

        let subTotal = item.price * item.quantity;

        total += subTotal;

        checkoutItems.innerHTML += `
        <div class="checkout-item">
            <p><strong>${item.product}</strong></p>
            <p>₦${item.price.toLocaleString()} × ${item.quantity}</p>
            <p>Subtotal: ₦${subTotal.toLocaleString()}</p>
        </div>
        `;

    });

    checkoutTotal.innerHTML = "Total: ₦" + total.toLocaleString();

}


// ===========================================
// Page Load
// ===========================================

document.addEventListener("DOMContentLoaded", function(){

    updateCartCount();
    showCart();
    loadCheckout();

});


// ===========================================
// Place Order From Checkout
// ===========================================

function placeOrder(){

    let name = document.getElementById("customerName").value.trim();
    let phone = document.getElementById("customerPhone").value.trim();
    let address = document.getElementById("customerAddress").value.trim();

    if(name === "" || phone === "" || address === ""){

        alert("Please fill all customer details.");
        return;

    }

    if(cart.length === 0){

        alert("Your cart is empty.");
        return;

    }

    let orderId = "JGGL-" + Date.now();

    let date = new Date().toLocaleString();

    let message =
`Hello JGGL-STORE,

I would like to order from you.

*JGGL-STORE NEW ORDER*

Order ID: ${orderId}

Date: ${date}

Customer Details

Name: ${name}
Phone: ${phone}
Address: ${address}

Products:

`;

    let total = 0;

    cart.forEach(function(item){

        let subTotal = item.price * item.quantity;

        total += subTotal;

        message +=
        "- " + item.product +
        " × " + item.quantity +
        " = ₦" + subTotal.toLocaleString() +
        "\n";

    });

    message +=
    "\n--------------------------\n" +
    "Subtotal: ₦" + total.toLocaleString() +
    "\n" +
    "Delivery Fee: ₦0" +
    "\n" +
    "Total: ₦" + total.toLocaleString() +
    "\n\n" +
    "Thank you for choosing JGGL-STORE.\n";

    let whatsappURL =
    "https://wa.me/2348089250443?text=" +
    encodeURIComponent(message);

    window.open(whatsappURL, "_blank");

    alert("Your order has been sent successfully!");

    cart = [];
    saveCart();
    updateCartCount();
    showCart();
    loadCheckout();

}


// ===========================================
// Wishlist
// ===========================================

let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];


function addToWishlist(name, price, image){

    let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

    let exists = wishlist.find(function(item){
        return item.name === name;
    });

    if(exists){
        alert(name + " is already in your Wishlist ❤️");
        return;
    }

    wishlist.push({
        name: name,
        price: price,
        image: image
    });

localStorage.setItem("wishlist", JSON.stringify(wishlist));

updateWishlistCount();

alert(name + " has been added to your Wishlist ❤️");

}

// ===========================================
// Display Wishlist
// ===========================================

function loadWishlist(){

    let container = document.getElementById("wishlistItems");

    if(!container){
        return;
    }

    let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

    if(wishlist.length === 0){
        container.innerHTML = "<p>Your wishlist is empty.</p>";
        return;
    }

    container.innerHTML = "";

    wishlist.forEach(function(item,index){

    container.innerHTML += `
    <div class="wishlist-card">

        <img src="${item.image}" alt="${item.name}">

        <h3>${item.name}</h3>

        <p>₦${item.price.toLocaleString()}</p>

        <button class="add-cart-btn"
        onclick="addToCart('${item.name}', ${item.price}, '${item.image}')">
        Add To Cart
        </button>

        <button class="remove-btn"
        onclick="removeWishlist(${index})">
        Remove
        </button>

    </div>
    `;
});

updateWishlistCount();

}

// ===========================================k}// Remove Wishlist Item
// ===========================================

function removeWishlist(index){

    let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

    wishlist.splice(index, 1);

    localStorage.setItem("wishlist", JSON.stringify(wishlist));

    updateWishlistCount();

    loadWishlist();

}


window.onload = function () {

    if (typeof loadProducts === "function") {
        loadProducts();
    }

    if (typeof loadCart === "function") {
        loadCart();
    }

    if (typeof loadCheckout === "function") {
        loadCheckout();
    }

    if (typeof loadWishlist === "function") {
        loadWishlist();
    }

    if (typeof updateCartCount === "function") {
        updateCartCount();
    }

};



// ===========================================
// Wishlist Counter
// ===========================================

function updateWishlistCount(){

    let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

    let link = document.getElementById("wishlistLink");

    if(link){

        link.innerHTML = "❤️ Wishlist (" + wishlist.length + ")";

    }

}
// ===========================================
// Clear Wishlist
// ===========================================

function clearWishlist(){

    let confirmClear = confirm("Are you sure you want to clear your Wishlist?");

    if(confirmClear){

        localStorage.removeItem("wishlist");

        updateWishlistCount();

        loadWishlist();

        alert("Wishlist cleared successfully.");

    }

}


