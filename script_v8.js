
// ===========================================
// JGGL-STORE Version 6.0
// Main JavaScript File
// Phase 3
// ===========================================⁷
// ===========================================
// API BASE URL
// Local development -> Node on port 3000
// Render production -> same online origin
// ===========================================

const API_BASE =
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost"
        ? "http://127.0.0.1:3000"
        : window.location.origin;

// Cart Storage


let currentProduct = "";
let currentPrice = 0;
let currentImage = "";


let cart = [];

function getCartUser(){

    return JSON.parse(
        localStorage.getItem("jgglUser") ||
        "null"
    );

}

function saveCart(){

    const user = getCartUser();

    if(!user || !user.id){

        localStorage.setItem(
            "cart",
            JSON.stringify(cart)
        );

    }

}

async function loadCart(){

    const user = getCartUser();

    if(!user || !user.id){

        cart = JSON.parse(
            localStorage.getItem("cart") ||
            "[]"
        );

        updateCartCount();
        showCart();
        loadCheckout();

        return;
    }

    try{



const response = await fetch(
    API_BASE + "/api/cart/" +
    encodeURIComponent(user.id),
    {
        headers: getAuthHeaders()
    }
);


        const data =
            await response.json();

        if(!response.ok || !data.success){

            console.error(
                data.message ||
                "Unable to load cart."
            );

            return;
        }

        cart = Array.isArray(data.items)
            ? data.items
            : [];

        updateCartCount();
        showCart();
        loadCheckout();

    }catch(error){

        console.error(
            "LOAD CART ERROR:",
            error
        );

    }

}


// Update Cart Count
function updateCartCount(){

    let cartCount = document.getElementById("cart-count");

    if(cartCount){
        cartCount.innerHTML = cart.length;
    }

}

// Add Product To Cart


async function addToCart(
    product,
    price,
    image,
    purchaseType = "retail",
    quantity = 1,
    minimumQuantity = 1,
    productId = null,
    variantId = null
){

    const user = getCartUser();

    if(!user || !user.id){

        const existing =
            cart.find(function(item){

                return (
                    item.product === product &&
                    item.purchaseType === purchaseType
                );

            });

        if(existing){

            existing.quantity += quantity;
            existing.price = price;
            existing.minimumQuantity =
                minimumQuantity;

            if(image){
                existing.image = image;
            }

        }else{

            cart.push({
                product: product,
                price: Number(price) || 0,
                image: image || "",
                purchaseType: purchaseType,
                quantity: Number(quantity) || 1,
                minimumQuantity:
                    Number(minimumQuantity) || 1,
                productId:
                    productId || null,
                variantId:
                    variantId || null
            });

        }

        saveCart();
        updateCartCount();

        alert(
            product +
            " added to cart successfully!"
        );

        return;
    }

    try{

        const response = await fetch(
            API_BASE + "/api/cart/" +
            encodeURIComponent(user.id) +
            "/items",
            {
                method: "POST",

headers: getAuthHeaders(),


                body: JSON.stringify({
                    product: product,
                    price: Number(price) || 0,
                    image: image || "",
                    purchaseType:
                        purchaseType || "retail",
                    quantity:
                        Number(quantity) || 1,
                    minimumQuantity:
                        Number(minimumQuantity) || 1,
                    productId:
                        productId || null,
                    variantId:
                        variantId || null
                })
            }
        );

        const data =
            await response.json();

        if(
            response.status === 401 ||
            response.status === 403
        ){

            localStorage.removeItem(
                "jgglLoggedIn"
            );

            localStorage.removeItem(
                "jgglAuthToken"
            );

            localStorage.removeItem(
                "jgglUser"
            );

            localStorage.removeItem(
                "cart"
            );

            cart = [];

            updateCartCount();

            alert(
                data.message ||
                "Your login session has expired. Please login again."
            );

            window.location.href =
                "login.html?view=auth-flow-2";

            return;
        }

        if(!response.ok || !data.success){

            alert(
                data.message ||
                "Unable to add product to cart."
            );

            return;
        }

        await loadCart();

        alert(
            product +
            " added to cart successfully!"
        );

    }catch(error){

        console.error(
            "ADD TO CART ERROR:",
            error
        );

        alert(
            "Network error while adding product to cart."
        );

    }

}



// Show Cart


function showCart(){

    let cartItems =
        document.getElementById("cartItems");

    let totalBox =
        document.getElementById("total");

    if(!cartItems || !totalBox){
        return;
    }

    cartItems.innerHTML = "";

    let total = 0;

    cart.forEach(function(item, index){

        let purchaseType =
            item.purchaseType || "retail";

        let minimumQuantity =
            item.minimumQuantity || 1;

        let itemTotal =
            item.price * item.quantity;

        total += itemTotal;

        let purchaseTypeName =
            purchaseType.charAt(0).toUpperCase() +
            purchaseType.slice(1);

        cartItems.innerHTML += `

        <div class="cart-item">

            ${
                item.image
                ? `<img src="${item.image}"
                        alt="${item.product}"
                        class="cart-item-image">`
                : ""
            }

            <h3>${item.product}</h3>

            <p>
                Purchase Type:
                <strong>${purchaseTypeName}</strong>
            </p>

            <p>
                Unit Price:
                ₦${Number(item.price).toLocaleString()}
            </p>

            <p>
                Minimum Quantity:
                <strong>${minimumQuantity}</strong>
            </p>

            <p>

                Quantity

                <button
                    onclick="changeQuantity(${index},-1)">
                    −
                </button>

                <strong>${item.quantity}</strong>

                <button
                    onclick="changeQuantity(${index},1)">
                    +
                </button>

            </p>

            <p>
                Subtotal:
                <strong>
                    ₦${itemTotal.toLocaleString()}
                </strong>
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

    let item = cart[index];

    if(!item){
        return;
    }

    let minimumQuantity = Number(item.minimumQuantity);

    if(!minimumQuantity || minimumQuantity < 1){
        minimumQuantity = 1;
    }

    let currentQuantity = Number(item.quantity) || minimumQuantity;
    let newQuantity = currentQuantity + amount;

    if(newQuantity < minimumQuantity){

        item.quantity = minimumQuantity;

        alert(
            "Minimum quantity for " +
            (item.purchaseType || "retail") +
            " is " +
            minimumQuantity
        );

        saveCart();
        showCart();
        return;
    }

    item.quantity = newQuantity;

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


async function clearCart(){

    const confirmed =
        confirm("Clear all items from cart?");

    if(!confirmed){
        return;
    }

    try{


const savedUser =
    JSON.parse(
        localStorage.getItem("jgglUser") ||
        "null"
    );

if(!savedUser || !savedUser.id){
    alert("Please login again.");
    window.location.href = "login.html?view=auth-flow-2";
    return;
}

const userId = savedUser.id;


        const response =
            await fetch(
                `${API_BASE}/api/cart/${userId}`,


{
    method: "DELETE",
    headers: getAuthHeaders()
}

   );

        const result =
            await response.json();

        if(!response.ok || !result.success){

            throw new Error(
                result.message ||
                "Unable to clear cart."
            );

        }

        cart = [];

        saveCart();
        updateCartCount();
        showCart();

        alert("Cart cleared successfully.");

    }catch(error){

        console.error(
            "CLEAR CART ERROR:",
            error
        );

        alert(
            "Unable to clear cart. Please try again."
        );

    }

}



// ===========================================
// Search Products
// ===========================================


// ===========================================
// SEARCH PRODUCTS
// ===========================================

function searchProduct(){

    const input =
        document.getElementById("searchInput");

    const suggestions =
        document.getElementById("searchSuggestions");

    const categoryFilter =
        document.getElementById("categoryFilter");

    const noProductsFound =
        document.getElementById("noProductsFound");

    const clearSearchBtn =
        document.getElementById("clearSearchBtn");

    if(!input || typeof PRODUCTS === "undefined"){
        return;
    }

    const keyword =
        input.value.trim().toLowerCase();

    const selectedCategory =
        categoryFilter
            ? categoryFilter.value
            : "all";

    const results = PRODUCTS.filter(function(product){

        const matchesName =
            product.name
                .toLowerCase()
                .includes(keyword);

        const productCategory =
            product.category || product.group || "";

        const matchesCategory =
            selectedCategory === "all" ||
            productCategory.toLowerCase() ===
            selectedCategory.toLowerCase();

        return matchesName && matchesCategory;

    });

    if(clearSearchBtn){
        clearSearchBtn.style.display =
            keyword ? "flex" : "none";
    }

    if(suggestions){

        suggestions.innerHTML = "";

        if(keyword && results.length){

            results.slice(0, 5).forEach(function(product){

                const item =
                    document.createElement("div");

                item.className = "search-item";

                item.textContent =
                    "🔍 " + product.name;

                item.onclick = function(){
                    selectSuggestion(product.name);
                };

                suggestions.appendChild(item);

            });

            suggestions.style.display = "block";

        }else{

            suggestions.style.display = "none";

        }

    }

    if(noProductsFound){

        noProductsFound.style.display =
            results.length === 0
                ? "block"
                : "none";

    }

    loadProducts(results);

}


// ===========================================
// SELECT SEARCH SUGGESTION
// ===========================================

function selectSuggestion(productName){

    const input =
        document.getElementById("searchInput");

    const suggestions =
        document.getElementById("searchSuggestions");

    if(!input){
        return;
    }

    input.value = productName;

    if(suggestions){
        suggestions.style.display = "none";
    }

    saveSearch(productName);
    searchProduct();

}


// ===========================================
// CLEAR SEARCH
// ===========================================

function clearSearch(){

    const input =
        document.getElementById("searchInput");

    const suggestions =
        document.getElementById("searchSuggestions");

    const noProductsFound =
        document.getElementById("noProductsFound");

    const clearSearchBtn =
        document.getElementById("clearSearchBtn");

    if(input){
        input.value = "";
        input.focus();
    }

    if(suggestions){
        suggestions.innerHTML = "";
        suggestions.style.display = "none";
    }

    if(noProductsFound){
        noProductsFound.style.display = "none";
    }

    if(clearSearchBtn){
        clearSearchBtn.style.display = "none";
    }

    loadProducts(PRODUCTS);

}


// ===========================================
// SAVE SEARCH HISTORY
// ===========================================

function saveSearch(searchText){

    if(!searchText){
        return;
    }

    let history = JSON.parse(
        localStorage.getItem("searchHistory") || "[]"
    );

    history = history.filter(function(item){
        return item.toLowerCase() !==
            searchText.toLowerCase();
    });

    history.unshift(searchText);

    history = history.slice(0, 10);

    localStorage.setItem(
        "searchHistory",
        JSON.stringify(history)
    );

}


// ===========================================
// SHOW SEARCH HISTORY
// ===========================================

function showSearchHistory(){

    const panel =
        document.getElementById("searchHistoryPanel");

    const list =
        document.getElementById("searchHistoryList");

    if(!panel || !list){
        return;
    }

    const history = JSON.parse(
        localStorage.getItem("searchHistory") || "[]"
    );

    list.innerHTML = "";

    if(history.length === 0){

        list.innerHTML =
            "<p>No search history</p>";

    }else{

        history.forEach(function(item){

            const button =
                document.createElement("button");

            button.type = "button";
            button.className = "search-history-item";
            button.textContent = item;

            button.onclick = function(){
                selectSuggestion(item);
                panel.style.display = "none";
            };

            list.appendChild(button);

        });

    }

    panel.style.display =
        panel.style.display === "block"
            ? "none"
            : "block";

}


// ===========================================
// SHOW RECENT SEARCHES
// ===========================================

function showRecentSearches(){
    showSearchHistory();
}


// ===========================================
// CLEAR SEARCH HISTORY
// ===========================================

function clearSearchHistory(){

    localStorage.removeItem("searchHistory");

    const list =
        document.getElementById("searchHistoryList");

    const panel =
        document.getElementById("searchHistoryPanel");

    if(list){
        list.innerHTML = "<p>No search history</p>";
    }

    if(panel){
        panel.style.display = "block";
    }

}


// ===========================================
// CAMERA SEARCH
// ===========================================

async function cameraSearch(event){

    const file =
        event.target.files[0];

    if(!file){
        return;
    }

    if(!file.type.startsWith("image/")){

        alert("Please select an image.");

        event.target.value = "";

        return;
    }

    const previewBox =
        document.getElementById("cameraPreviewBox");

    const previewImage =
        document.getElementById("cameraPreviewImage");

    if(previewBox && previewImage){

        const reader =
            new FileReader();

        reader.onload = function(loadEvent){

            previewImage.src =
                loadEvent.target.result;

            previewBox.style.display =
                "flex";

        };

        reader.readAsDataURL(file);

    }

    try{

        const formData =
            new FormData();

        formData.append(
            "image",
            file
        );

        const response =
            await fetch(
                API_BASE + "/api/search-by-image",
                {
                    method: "POST",
                    body: formData
                }
            );

        const data =
            await response.json();

        if(!response.ok || !data.success){

            throw new Error(
                data.message ||
                "Unable to search by image."
            );

        }

        const detectedQuery =
            String(
                data?.recognition?.query || ""
            ).trim();

        if(!detectedQuery){
            throw new Error(
                "No product could be identified from this image."
            );
        }

        const searchInput =
            document.getElementById("searchInput");

        if(searchInput){
            searchInput.value = detectedQuery;
        }

        if(typeof searchProduct === "function"){
            searchProduct();
        }

        if(typeof showToast === "function"){
            showToast(
                "Detected: " + detectedQuery
            );
        }

        console.log(
            "IMAGE SEARCH RESPONSE:",
            data
        );

    }catch(error){

        console.error(
            "CAMERA SEARCH ERROR:",
            error
        );

        alert(
            error.message ||
            "Unable to search by image."
        );

    }

}




function clearCameraPreview(){

    const input =
        document.getElementById("cameraInput");

    const previewBox =
        document.getElementById("cameraPreviewBox");

    const previewImage =
        document.getElementById("cameraPreviewImage");

    if(input){
        input.value = "";
    }

    if(previewImage){
        previewImage.src = "";
    }

    if(previewBox){
        previewBox.style.display = "none";
    }

}



// ===========================================
// Load Checkout
// ===========================================


function loadCheckout(){

    const checkoutItems =
        document.getElementById("checkoutItems");


const checkoutSubtotal =
    document.getElementById("checkoutSubtotal");

const checkoutCouponRow =
    document.getElementById("checkoutCouponRow");

const checkoutCoupon =
    document.getElementById("checkoutCoupon");

const checkoutDiscountRow =
    document.getElementById("checkoutDiscountRow");

const checkoutDiscount =
    document.getElementById("checkoutDiscount");

const checkoutShippingState =
    document.getElementById("checkoutShippingState");

const checkoutShippingFee =
    document.getElementById("checkoutShippingFee");

const checkoutDeliveryTimeRow =
    document.getElementById("checkoutDeliveryTimeRow");

const checkoutDeliveryTime =
    document.getElementById("checkoutDeliveryTime");


    const checkoutTotal =
        document.getElementById("checkoutTotal");

    const checkoutItemCount =
        document.getElementById("checkoutItemCount");

    if(!checkoutItems || !checkoutTotal){
        return;
    }



const savedProfile =
    JSON.parse(
        localStorage.getItem("jgglProfile") || "{}"
    );

const savedUser =
    JSON.parse(
        localStorage.getItem("jgglUser") || "{}"
    );

const customerName =
    document.getElementById("customerName");

const customerPhone =
    document.getElementById("customerPhone");

const customerEmail =
    document.getElementById("customerEmail");

const customerAddress =
    document.getElementById("customerAddress");

if(customerName && !customerName.value){
    customerName.value =
        savedProfile.name ||
        savedUser.name ||
        "";
}

if(customerPhone && !customerPhone.value){
    customerPhone.value =
        savedProfile.phone ||
        savedUser.phone ||
        "";
}


if(customerEmail && !customerEmail.value){
    customerEmail.value =
        savedProfile.email ||
        savedUser.email ||
        "";
}

if(customerAddress && !customerAddress.value){
    customerAddress.value =
        savedProfile.address ||
        "";
}



    const savedCart =
        JSON.parse(localStorage.getItem("cart")) || [];

    checkoutItems.innerHTML = "";

    let total = 0;
    let itemCount = 0;

    savedCart.forEach(function(item){

        const price =
            Number(item.price) || 0;

        const quantity =
            Number(item.quantity) || 1;

        const subTotal =
            price * quantity;

        total += subTotal;
        itemCount += quantity;

        checkoutItems.innerHTML += `
            <div class="checkout-item">

                <img
                    src="${item.image || 'images/placeholder.jpg'}"
                    alt="${item.product || 'Product'}"
                    onerror="this.src='images/placeholder.jpg'">

                <div class="checkout-item-info">

                    <h3>
                        ${item.product || 'Product'}
                    </h3>

                    <p>
                        ₦${price.toLocaleString('en-GB')}
                        × ${quantity}
                    </p>

                    <p>
                        Subtotal:
                        ₦${subTotal.toLocaleString('en-GB')}
                    </p>

                </div>

            </div>
        `;

    });



let cartSummary = {};

try{
    cartSummary = JSON.parse(
        localStorage.getItem("jgglCartSummary") || "{}"
    );
}catch(error){
    cartSummary = {};
}

const subtotal =
    Number(cartSummary.subtotal ?? total);

const discount =
    Number(cartSummary.discount || 0);

const shipping =
    Number(cartSummary.shipping || 0);

const finalTotal =
    Number(
        cartSummary.total ??
        (subtotal - discount + shipping)
    );

const couponCode =
    cartSummary.coupon || "";

const shippingState =
    cartSummary.shippingState || "Not selected";

const shippingTime =
    cartSummary.shippingTime || "";

if(checkoutSubtotal){
    checkoutSubtotal.textContent =
        "₦" + subtotal.toLocaleString("en-GB");
}

if(checkoutCouponRow && checkoutCoupon){

    if(couponCode){
        checkoutCouponRow.style.display = "flex";
        checkoutCoupon.textContent = couponCode;
    }else{
        checkoutCouponRow.style.display = "none";
        checkoutCoupon.textContent = "—";
    }
}

if(checkoutDiscountRow && checkoutDiscount){

    if(discount > 0){
        checkoutDiscountRow.style.display = "flex";
        checkoutDiscount.textContent =
            "-₦" + discount.toLocaleString("en-GB");
    }else{
        checkoutDiscountRow.style.display = "none";
        checkoutDiscount.textContent = "-₦0";
    }
}

if(checkoutShippingState){
    checkoutShippingState.textContent =
        shippingState;
}

if(checkoutShippingFee){
    checkoutShippingFee.textContent =
        "₦" + shipping.toLocaleString("en-GB");
}

if(checkoutDeliveryTimeRow && checkoutDeliveryTime){

    if(shippingTime){
        checkoutDeliveryTimeRow.style.display = "flex";
        checkoutDeliveryTime.textContent =
            shippingTime.replace(
                "Estimated delivery: ",
                ""
            );
    }else{
        checkoutDeliveryTimeRow.style.display = "none";
        checkoutDeliveryTime.textContent = "—";
    }
}

checkoutTotal.textContent =
    "₦" + finalTotal.toLocaleString("en-GB");


    if(checkoutItemCount){

        checkoutItemCount.textContent =
            itemCount;

    }

}





// ===========================================
// Place Order From Checkout
// ===========================================


async function placeOrder(){



    let name = document.getElementById("customerName").value.trim();
    let phone = document.getElementById("customerPhone").value.trim();

let email =
    document.getElementById("customerEmail").value.trim();

    let address = document.getElementById("customerAddress").value.trim();


if(
    name === "" ||
    phone === "" ||
    email === "" ||
    address === ""
){

        alert("Please fill all customer details.");
        return;

    }

    if(cart.length === 0){

        alert("Your cart is empty.");
        return;

    }

    let orderId = "JGGL-" + Date.now();

let date = new Date().toLocaleString();



let cartSummary = {};

try{
    cartSummary = JSON.parse(
        localStorage.getItem("jgglCartSummary") || "{}"
    );
}catch(error){
    cartSummary = {};
}

const subtotal =
    Number(cartSummary.subtotal || 0);

const discount =
    Number(cartSummary.discount || 0);

const shippingFee =
    Number(cartSummary.shipping || 0);

const finalTotal =
    Number(
        cartSummary.total ||
        (subtotal - discount + shippingFee)
    );

const couponCode =
    cartSummary.coupon || "";

const shippingState =
    cartSummary.shippingState || "Not selected";

const shippingTime =
    cartSummary.shippingTime || "";

const selectedPaymentMethod =
    document.querySelector(
        'input[name="paymentMethod"]:checked'
    );

if(!selectedPaymentMethod){
    alert("Please select a payment method.");
    return;
}

const paymentMethod =
    selectedPaymentMethod.value;

const paymentStatus =
    "Pending";



    let message =
`Hello JGGL-STORE,

I would like to order from you.

*JGGL-STORE NEW ORDER*

Order ID: ${orderId}

Date: ${date}

Customer Details
Name: ${name}

Phone: ${phone}
Email: ${email}
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
    "Subtotal: ₦" +
    subtotal.toLocaleString() +
    "\n";

if(couponCode){

    message +=
        "Coupon: " +
        couponCode +
        "\n";
}

if(discount > 0){

    message +=
        "Discount: -₦" +
        discount.toLocaleString() +
        "\n";
}

message +=
    "Shipping State: " +
    shippingState +
    "\n" +
    "Shipping Fee: ₦" +
    shippingFee.toLocaleString() +
    "\n";

if(shippingTime){

    message +=
        shippingTime +
        "\n";
}

message +=
    "Total: ₦" +
    finalTotal.toLocaleString() +
    "\n\n" +
    "Thank you for choosing JGGL-STORE.\n";


try{

    const response =
        await fetch(
            API_BASE + "/api/orders",
            {
                method: "POST",



headers: getAuthHeaders(),

                body: JSON.stringify({
                    customer: {
                        name: name,
                        phone: phone,
                        email: email,
                        address: address
                    },

                    items: cart.map(function(item){
                        return {
                            product:
                                item.product,
                            price:
                                Number(item.price),
                            quantity:
                                Number(item.quantity),
                            productId:
                                item.product_id ||
                                item.productId ||
                                null,
                            variantId:
                                item.variant_id ||
                                item.variantId ||
                                null
                        };
                    }),

                    subtotal: subtotal,
                    coupon: couponCode,
                    discount: discount,
                    shippingState:
                        shippingState,
                    shippingFee:
                        shippingFee,
                    estimatedDelivery:
                        shippingTime,
                    paymentMethod:
                        paymentMethod,
                    paymentStatus:
                        paymentStatus,
                    total:
                        finalTotal
                })
            }
        );

    const data =
        await response.json();


if(
    response.status === 401 ||
    response.status === 403
){
    localStorage.removeItem("jgglLoggedIn");
    localStorage.removeItem("jgglAuthToken");
    localStorage.removeItem("jgglUser");

    window.location.href = "login.html?view=auth-flow-2";
    return;
}



    if(
        !response.ok ||
        !data.success
    ){

        alert(
            data.message ||
            "Unable to save order."
        );

        return;
    }


orderId =
    data.orderNumber ||
    orderId;



}catch(error){

    console.error(
        "Failed to save order:",
        error
    );

    alert(
        "Network error while saving order."
    );

    return;

}




alert("Your order has been placed successfully.");

localStorage.setItem(
    "selectedOrderId",
    orderId
);

cart = [];
saveCart();
updateCartCount();
showCart();
loadCheckout();

window.location.href = "orders.html";

}



// ===========================================
// WISHLIST
// ===========================================

function getWishlist(){

    return JSON.parse(
        localStorage.getItem("wishlist")
    ) || [];

}


// ===========================================
// ADD TO WISHLIST
// ===========================================

function addToWishlist(name, price, image){

    const wishlist = getWishlist();

    const exists = wishlist.some(function(item){

        return item.name === name;

    });

    if(exists){

        alert(
            name +
            " is already in your Wishlist ❤️"
        );

        return;

    }

    wishlist.push({

        name: name,
        price: Number(price),
        image: image || "images/product-placeholder.jpg"

    });

    localStorage.setItem(
        "wishlist",
        JSON.stringify(wishlist)
    );

    updateWishlistCount();

    alert(
        name +
        " has been added to your Wishlist ❤️"
    );

}


// ===========================================
// DISPLAY WISHLIST
// ===========================================

function loadWishlist(){

    const container =
        document.getElementById("wishlistItems");

    if(!container){

        return;

    }

    const wishlist = getWishlist();

    updateWishlistCount();

    if(wishlist.length === 0){

        container.innerHTML = `

            <div class="empty-wishlist">

                <i class="far fa-heart"></i>

                <h3>Your wishlist is empty</h3>

                <p>
                    Products you save will appear here.
                </p>

                <a
                    href="product-types.html"
                    class="browse-products">

                    <i class="fas fa-bag-shopping"></i>
                    Browse Products

                </a>

            </div>

        `;

        return;

    }

    container.innerHTML = "";

    wishlist.forEach(function(item, index){

        const card = document.createElement("div");

        card.className = "wishlist-item";

        card.innerHTML = `

            <img
                src="${item.image}"
                alt="${item.name}"
                onerror="this.src='images/product-placeholder.jpg'">

            <div class="wishlist-item-content">

                <h3>${item.name}</h3>

                <p class="price">
                    ₦${Number(item.price).toLocaleString()}
                </p>

                <div class="wishlist-buttons">

                    <button
                        type="button"
                        class="wishlist-btn add-wishlist-cart">

                        <i class="fas fa-cart-plus"></i>
                        Add to Cart

                    </button>

                    <button
                        type="button"
                        class="wishlist-btn remove-wishlist">

                        <i class="fas fa-trash"></i>
                        Remove

                    </button>

                </div>

            </div>

        `;

        const addButton =
            card.querySelector(".add-wishlist-cart");

        const removeButton =
            card.querySelector(".remove-wishlist");

        addButton.addEventListener("click", function(){

            addToCart(
                item.name,
                Number(item.price),
                item.image,
                item.purchaseType || "retail",
                1,
                1,
                item.productId ||
                item.product_id ||
                item.id ||
                null,
                item.variantId ||
                item.variant_id ||
                null
            );

        });

        removeButton.addEventListener("click", function(){

            removeWishlist(index);

        });

        container.appendChild(card);

    });

}


// ===========================================
// REMOVE WISHLIST ITEM
// ===========================================

function removeWishlist(index){

    const wishlist = getWishlist();

    wishlist.splice(index, 1);

    localStorage.setItem(
        "wishlist",
        JSON.stringify(wishlist)
    );

    loadWishlist();

}


// ===========================================
// WISHLIST COUNTER
// ===========================================

function updateWishlistCount(){

    const wishlist = getWishlist();

    const counter =
        document.getElementById("wishlist-count");

    if(counter){

        counter.textContent = wishlist.length;

    }

}


// ===========================================
// CLEAR WISHLIST
// ===========================================

function clearWishlist(){

    const wishlist = getWishlist();

    if(wishlist.length === 0){

        alert("Your Wishlist is already empty.");

        return;

    }

    const confirmClear = confirm(
        "Are you sure you want to clear your Wishlist?"
    );

    if(!confirmClear){

        return;

    }

    localStorage.removeItem("wishlist");

    loadWishlist();

    alert("Wishlist cleared successfully.");

}


// ===========================================
// PAGE STARTUP
// ===========================================


window.addEventListener(
    "load",
    async function(){

        if(typeof loadCart === "function"){

            await loadCart();

        }else{

            updateCartCount();
            showCart();

            if(typeof loadCheckout === "function"){
                loadCheckout();
            }

        }

        if(typeof loadWishlist === "function"){
            loadWishlist();
        }

        if(typeof updateWishlistCount === "function"){
            updateWishlistCount();
        }

    }
);



/* ==========================================
   VIEW DETAILS
========================================== */

function viewDetails(product, price, image){

    currentProduct = product;
    currentPrice = price;
    currentImage = image;

    const modal = document.getElementById("detailsModal");
    const title = document.getElementById("detailsTitle");
    const priceText = document.getElementById("detailsPrice");
    const img = document.getElementById("detailsImage");

    if (!modal || !title || !priceText || !img){
        alert("Modal elements not found");
        return;
    }

    title.textContent = product;
    priceText.textContent = "₦" + Number(price).toLocaleString();
    img.src = image;
    img.alt = product;

    modal.style.display = "flex";
    modal.style.justifyContent = "center";

   modal.style.alignItems = "center";


}



function showToast(message){

    let toast = document.getElementById("toast");

    if(!toast){
        return;
    }

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(function(){
        toast.classList.remove("show");
    }, 2500);
}


function closeDetails(){

    let modal = document.getElementById("detailsModal");

    if(modal){
        modal.style.display = "none";
    }

}

function addDetailsToCart(){


addToCart(currentProduct, currentPrice, currentImage);
}

// ===========================================
// CREATE PRODUCT CARD
// ===========================================


function createProductCard(product){

    const isProductTypesPage =
        window.location.pathname.includes(
            "product-types.html"
        );

    const displayName = isProductTypesPage
        ? product.name
        : (product.group || product.name);

    const clickAction = isProductTypesPage


        ? `openProductDetails(${product.id})`

: `openProductGroup('${product.group || product.name || product.category}')`;

    return `
        <div class="product-card"
             onclick="${clickAction}">

            <img
                src="${product.image}"
                alt="${displayName}"
                loading="lazy">

            <div class="product-info">

                <h3>${displayName}</h3>

                <p class="product-price">
                    ₦${Number(product.price).toLocaleString()}
                </p>

            </div>

        </div>
    `;
}


// ===========================================
// LOAD PRODUCTS
// ===========================================

function loadProducts(productList = PRODUCTS){

    const container =
        document.getElementById("productsContainer");

    if(!container){
        return;
    }

    container.innerHTML = "";

container.innerHTML = "";

const isProductTypesPage =
    window.location.pathname.includes("product-types.html");

if(!isProductTypesPage){

    const seenGroups = new Set();

    productList = productList.filter(function(product){

        const key = product.group || product.name || product.category;

        if(seenGroups.has(key)){
            return false;
        }

        seenGroups.add(key);
        return true;

    });

}



    if(!Array.isArray(productList) || productList.length === 0){

        container.innerHTML = `
            <div class="no-products-found-message">
                No product found
            </div>
        `;

        return;
    }

    productList.forEach(function(product){

        container.innerHTML +=
            createProductCard(product);

    });

}


// ===========================================
// LOAD TRENDING PRODUCTS
// ===========================================

function loadTrendingProducts(){

    const container =
        document.getElementById("trendingProducts");

    if(!container || !Array.isArray(PRODUCTS)){
        return;
    }

    container.innerHTML = "";


const seenGroups = new Set();

const trendingProducts = PRODUCTS.filter(function(product){

    const groupName =
        product.group ||
        product.category ||
        product.name;

    if(seenGroups.has(groupName)){
        return false;
    }

    seenGroups.add(groupName);

    return true;

}).slice(0, 6);

trendingProducts.forEach(function(product){

    container.innerHTML +=
        createProductCard(product);

});


}


// ===========================================
// AUTO SLIDE TRENDING PRODUCTS
// ===========================================


function startTrendingSlider(){

    const slider =
        document.getElementById("trendingProducts");

    if(!slider || slider.dataset.loopStarted === "true"){
        return;
    }

    const originalCards =
        Array.from(
            slider.querySelectorAll(".product-card")
        );

    if(originalCards.length < 2){
        return;
    }

    originalCards.forEach(function(card){
        slider.appendChild(card.cloneNode(true));
    });

    slider.dataset.loopStarted = "true";

    let currentIndex = 0;

    setInterval(function(){

        const card =
            slider.querySelector(".product-card");

        if(!card){
            return;
        }

        const sliderStyle =
            window.getComputedStyle(slider);

        const gap =
            parseFloat(sliderStyle.columnGap) ||
            parseFloat(sliderStyle.gap) ||
            10;

        const moveDistance =
            card.getBoundingClientRect().width + gap;

        currentIndex++;

        slider.scrollTo({
            left: currentIndex * moveDistance,
            behavior: "smooth"
        });

        if(currentIndex >= originalCards.length){

            setTimeout(function(){

                slider.scrollTo({
                    left: 0,
                    behavior: "auto"
                });

                currentIndex = 0;

            }, 700);
        }

    }, 2500);

}

// ===========================================
// LOAD SELECTED PRODUCT GROUP
// ===========================================



function loadSelectedProductGroup(){

    const container =
        document.getElementById("productsContainer");

    const count =
        document.getElementById("groupCount");

    if(!container || !count){
        return;
    }

    const selectedGroup =
        localStorage.getItem("selectedGroup");

    const selectedValue =
        String(selectedGroup || "")
            .trim()
            .toLowerCase();

    const groupProducts = PRODUCTS.filter(function(product){

        return String(product.group || "")
            .trim()
            .toLowerCase() === selectedValue;

    });

    const title =
        document.getElementById("groupTitle");

    const groupName =
        document.getElementById("groupName");

    if(title){
        title.textContent = selectedGroup;
    }



const currentLanguage =
    localStorage.getItem("jgglLanguage") ||
    "English";

if(groupName){

    if(currentLanguage === "Hausa"){

        groupName.textContent =
            selectedGroup + " Kayayyaki";

    }else{

        groupName.textContent =
            selectedGroup + " Products";

    }

}

if(currentLanguage === "Hausa"){

    count.textContent =
        groupProducts.length +
        (groupProducts.length === 1
            ? " Kaya"
            : " Kayayyaki");

}else{

    count.textContent =
        groupProducts.length +
        (groupProducts.length === 1
            ? " Product"
            : " Products");

}



    loadProducts(groupProducts);

}




// ===========================================
// LOAD PRODUCTS FROM BACKEND
// ===========================================

async function loadProductsFromBackend(){

    try{

        const response = await fetch("/api/products");

        if(!response.ok){
            throw new Error("Failed to load products.");
        }

        const data = await response.json();

        if(
            data.success &&
            Array.isArray(data.products)
        ){
            PRODUCTS.length = 0;

            data.products.forEach(function(product){
                PRODUCTS.push(product);
            });
        }

    }catch(error){

        console.log(
            "Using local products fallback.",
            error
        );

    }

}




// ===========================================
// PAGE STARTUP
// ===========================================

document.addEventListener("DOMContentLoaded", async function(){

    if(
        window.location.pathname.endsWith("account.html")
    ){
        if(!checkLogin()){
            return;
        }

        loadAccountUser();
    }

    if(
        window.location.pathname.endsWith("edit-profile.html")
    ){
        if(!checkLogin()){
            return;
        }

        loadProfile();
    }

    await loadProductsFromBackend();

    updateNotificationBadge();

    loadTrendingProducts();
    startTrendingSlider();



    const groupCount =
        document.getElementById("groupCount");

    if(groupCount){

        loadSelectedProductGroup();

    }else{

        if(typeof PRODUCT_GROUPS !== "undefined"){
            loadProducts(PRODUCT_GROUPS);
        }else{
            loadProducts(PRODUCTS);
        }

    }

});




// ===========================================
// OPEN PRODUCT GROUP
// ===========================================

function openProductGroup(group){

    localStorage.setItem(
        "selectedGroup",
        String(group)
    );

    window.location.href =
        "product-types.html";

}


// ===========================================
// OPEN PRODUCT DETAILS
// ===========================================

function openProductDetails(productId){

    localStorage.setItem(
        "selectedProductId",
        String(productId)
    );

    window.location.href =
        "product-details.html?v=38";

}



// ===========================================
// LOAD PRODUCT DETAILS PAGE
// ===========================================

function loadProductDetailsPage(){

    const productId =
        Number(localStorage.getItem("selectedProductId"));

    if(!productId || typeof PRODUCTS === "undefined"){
        return;
    }

    const product = PRODUCTS.find(function(item){
        return Number(item.id) === productId;
    });

    if(!product){
        return;
    }


const image = document.getElementById("productImage");
const title = document.getElementById("productName");
const price = document.getElementById("productPrice");

    const brand = document.getElementById("detailsBrand");
    const description = document.getElementById("detailsDescription");
    const stock = document.getElementById("detailsStock");
    const rating = document.getElementById("detailsRating");
    const discount = document.getElementById("detailsDiscount");

    if(image){
        image.src = product.image;
        image.alt = product.name;
    }

    if(title){
        title.textContent = product.name;
    }

    if(price){
        price.textContent =
            "₦" + Number(product.price).toLocaleString();
    }

    if(brand){
        brand.textContent =
            product.brand || "JGGL-STORE";
    }

    if(description){
        description.textContent =
            product.description || "No description available.";
    }

    if(stock){
        stock.textContent =
            product.stock ?? 0;
    }

    if(rating){
        rating.textContent =
            product.rating ?? "Not rated";
    }

    if(discount){
        discount.textContent =
            product.discount
                ? product.discount + "%"
                : "No discount";
    }
}


// ===========================================
// PRODUCT DETAILS PAGE STARTUP
// ===========================================

document.addEventListener("DOMContentLoaded", function(){

    if(document.getElementById("productName")){
        loadProductDetailsPage();
    }

});



// ===========================================
// EDIT PROFILE
// ===========================================


async function saveProfile(event){

    event.preventDefault();

    const inputs =
        document.querySelectorAll(
            ".account-form input"
        );

    if(inputs.length < 7){

        alert("Profile form is not complete.");

        return;
    }

    const savedUser =
        JSON.parse(
            localStorage.getItem("jgglUser")
            || "null"
        );

    if(!savedUser || !savedUser.id){

        alert("Please login again.");

        window.location.href =
            "login.html?view=auth-flow-2";

        return;
    }

    const profile = {

        fullName:
            inputs[0].value.trim(),

        phone:
            inputs[1].value.trim(),

        email:
            inputs[2].value
                .trim()
                .toLowerCase(),

        address:
            inputs[3].value.trim(),

        lga:
            inputs[4].value.trim(),

        state:
            inputs[5].value.trim(),

        country:
            inputs[6].value.trim()
    };

    if(
        !profile.fullName ||
        !profile.phone ||
        !profile.email
    ){

        alert(
            "Full name, phone and email are required."
        );

        return;
    }

    try{

        const response = await fetch(
            API_BASE + "/api/account/" +
            encodeURIComponent(savedUser.id),
            {
                method: "PUT",


headers: getAuthHeaders(),


                body: JSON.stringify(profile)
            }
        );

        const data =
            await response.json();

        if(
            !response.ok ||
            !data.success ||
            !data.user
        ){

            alert(
                data.message ||
                "Unable to update profile."
            );

            return;
        }

        localStorage.setItem(
            "jgglUser",
            JSON.stringify(data.user)
        );

        alert(
            "Profile updated successfully."
        );

        window.location.href =
            "account.html";

    }catch(error){

        console.error(
            "SAVE PROFILE ERROR:",
            error
        );

        alert(
            "Network error while updating profile."
        );

    }

}



// ===========================================
// LOAD EDIT PROFILE FORM
// ===========================================


async function loadProfile(){

    const inputs =
        document.querySelectorAll(
            ".account-form input"
        );

    if(inputs.length < 7){
        return;
    }

    const savedUser =
        JSON.parse(
            localStorage.getItem("jgglUser")
            || "null"
        );

    if(!savedUser || !savedUser.id){

        alert("Please login again.");

        window.location.href =
            "login.html?view=auth-flow-2";

        return;
    }

    try{


const response = await fetch(
    API_BASE + "/api/account/" +
    encodeURIComponent(savedUser.id),
    {
        headers: getAuthHeaders()
    }
);


        const data =
            await response.json();


if(
    response.status === 401 ||
    response.status === 403
){

    localStorage.removeItem(
        "jgglLoggedIn"
    );

    localStorage.removeItem(
        "jgglAuthToken"
    );

    localStorage.removeItem(
        "jgglUser"
    );

    window.location.href =
        "login.html?view=auth-flow-2";

    return;
}


        if(
            !response.ok ||
            !data.success ||
            !data.account
        ){

            alert(
                data.message ||
                "Unable to load profile."
            );

            return;
        }

        const account =
            data.account;

        inputs[0].value =
            account.full_name || "";

        inputs[1].value =
            account.phone || "";

        inputs[2].value =
            account.email || "";

        inputs[3].value =
            account.address || "";

        inputs[4].value =
            account.lga || "";

        inputs[5].value =
            account.state || "";

        inputs[6].value =
            account.country || "";

    }catch(error){

        console.error(
            "LOAD PROFILE ERROR:",
            error
        );

        alert(
            "Network error while loading profile."
        );

    }

}



// ===========================================
// LOGOUT USER
// ===========================================

function logoutUser(){

    const confirmLogout = confirm(
        "Are you sure you want to logout?"
    );

    if(!confirmLogout){
        return;
    }

localStorage.removeItem("jgglLoggedIn");
localStorage.removeItem("jgglAuthToken");
localStorage.removeItem("jgglUser");

window.location.href = "index.html";


}


// ===========================================
// JWT AUTH HELPERS
// ===========================================


function getAuthToken(){
    return localStorage.getItem("jgglAuthToken");
}

function getAuthHeaders(){
    const token = getAuthToken();

    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}


// ===========================================
// ADMIN API AUTHORIZATION
// ===========================================

if(!window.jgglAdminFetchProtected){

    window.jgglAdminFetchProtected = true;

    const jgglOriginalFetch =
        window.fetch.bind(window);

    window.fetch = function(input, init){

        const url =
            typeof input === "string"
                ? input
                : (
                    input &&
                    input.url
                        ? input.url
                        : ""
                );

        if(
            String(url).includes(
                "/api/admin/"
            )
        ){

            const token =
                getAuthToken();

            const options = {
                ...(init || {})
            };

            const headers =
                new Headers(
                    options.headers || {}
                );

            if(token){
                headers.set(
                    "Authorization",
                    "Bearer " + token
                );
            }

            options.headers = headers;

            return jgglOriginalFetch(
                input,
                options
            );
        }

        return jgglOriginalFetch(
            input,
            init
        );
    };
}


// ===========================================
// ADMIN PAGE ACCESS GUARD
// ===========================================

function checkAdminAccess(){

    const token =
        getAuthToken();

    let user = null;

    try{
        user = JSON.parse(
            localStorage.getItem("jgglUser") ||
            "null"
        );
    }catch(error){
        user = null;
    }

    if(
        !token ||
        !user ||
        String(user.role || "").toLowerCase()
            !== "admin"
    ){
        const currentPage =
            window.location.pathname
                .split("/")
                .pop();

        if(
            currentPage &&
            currentPage !== "login.html" &&
            currentPage !== "register.html"
        ){
            localStorage.setItem(
                "jgglLoginRedirect",
                currentPage +
                window.location.search
            );
        }

        window.location.href =
            "login.html?view=auth-flow-2";

        return false;
    }

    return true;
}


document.addEventListener(
    "DOMContentLoaded",
    function(){

        const page =
            window.location.pathname
                .split("/")
                .pop();

        if(
            page &&
            page.startsWith("admin-") &&
            page.endsWith(".html")
        ){
            checkAdminAccess();
        }

    }
);


// ===========================================
// LOGIN USER
// ===========================================


async function loginUser(event){

    event.preventDefault();

    const emailInput =
        document.getElementById("loginEmail");

    const passwordInput =
        document.getElementById("loginPassword");

    if(!emailInput || !passwordInput){

        alert("Login form is not complete.");

        return;

    }

    const email =
        emailInput.value
            .trim()
            .toLowerCase();

    const password =
        passwordInput.value;

    if(!email || !password){

        alert(
            "Please enter your email and password."
        );

        return;

    }

    try{

        const response =
            await fetch(
                API_BASE + "/api/login",
                {
                    method: "POST",

                    headers:{
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                }
            );

        const data =
            await response.json();

        if(
            !response.ok ||
            !data.success
        ){

            alert(
                data.message ||
                "Invalid email or password."
            );

            return;

        }



if(!data.token){

    alert(
        "Login succeeded but authentication token was not received."
    );

    return;
}

localStorage.setItem(
    "jgglAuthToken",
    data.token
);

localStorage.setItem(
    "jgglLoggedIn",
    "true"
);

localStorage.setItem(
    "jgglUser",
    JSON.stringify(data.user)
);

localStorage.setItem(
    "jgglOnboardingCompleted",
    "true"
);



       alert("Login successful.");

        const loginRole =
            String(
                data.user &&
                data.user.role
                    ? data.user.role
                    : "customer"
            ).toLowerCase();

        if(loginRole === "admin"){

            localStorage.removeItem(
                "jgglLoginRedirect"
            );

            window.location.href =
                "admin-dashboard.html";

        }else{

            const savedRedirect =
                localStorage.getItem(
                    "jgglLoginRedirect"
                );

            localStorage.removeItem(
                "jgglLoginRedirect"
            );

            if(
                savedRedirect &&
                !savedRedirect.includes("login.html") &&
                !savedRedirect.includes("register.html") &&
                !savedRedirect.startsWith("admin-")
            ){
                window.location.href =
                    savedRedirect;
            }else{
                window.location.href =
                    "index.html";
            }

        }

    }catch(error){

        console.error(
            "LOGIN ERROR:",
            error
        );

        alert(
            "Network error while logging in."
        );

    }

}


// ===========================================
// REGISTER USER
// ===========================================


async function registerUser(event){

    event.preventDefault();

    const nameInput =
        document.getElementById("registerName");

    const emailInput =
        document.getElementById("registerEmail");

    const phoneInput =
        document.getElementById("registerPhone");

    const passwordInput =
        document.getElementById("registerPassword");

    const confirmPasswordInput =
        document.getElementById(
            "confirmRegisterPassword"
        );

    if(
        !nameInput ||
        !emailInput ||
        !phoneInput ||
        !passwordInput ||
        !confirmPasswordInput
    ){
        alert("Registration form is not complete.");
        return;
    }

    const name =
        nameInput.value.trim();

    const email =
        emailInput.value
            .trim()
            .toLowerCase();

    const phone =
        phoneInput.value.trim();

    const password =
        passwordInput.value;

    const confirmPassword =
        confirmPasswordInput.value;

    if(
        !name ||
        !email ||
        !phone ||
        !password ||
        !confirmPassword
    ){
        alert("Please complete all fields.");
        return;
    }

    if(password.length < 6){
        alert(
            "Password must contain at least 6 characters."
        );
        return;
    }

    if(password !== confirmPassword){
        alert("Passwords do not match.");
        return;
    }

    try{

        const response = await fetch(
            API_BASE + "/api/register",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    name: name,
                    email: email,
                    phone: phone,
                    password: password
                })
            }
        );

        const data =
            await response.json();

        if(
            !response.ok ||
            !data.success
        ){

            alert(
                data.message ||
                "Unable to create account."
            );

            return;
        }

        localStorage.setItem(
            "jgglOnboardingCompleted",
            "true"
        );

        alert(
            "Account created successfully. Please login."
        );

        window.location.replace(
            "login.html?view=auth-flow-2"
        );

    }catch(error){

        console.error(
            "REGISTER ERROR:",
            error
        );

        alert(
            "Network error while creating account."
        );

    }

}



// ===========================================
// TOGGLE REGISTER PASSWORD
// ===========================================

function toggleRegisterPassword(){

    const passwordInput =
        document.getElementById("registerPassword");

    const passwordIcon =
        document.getElementById("registerPasswordIcon");

    if(!passwordInput){
        return;
    }

    if(passwordInput.type === "password"){

        passwordInput.type = "text";

        if(passwordIcon){
            passwordIcon.className = "fas fa-eye-slash";
        }

    }else{

        passwordInput.type = "password";

        if(passwordIcon){
            passwordIcon.className = "fas fa-eye";
        }

    }
}


// ===========================================
// CHECK LOGIN STATUS
// ===========================================

function checkLogin(){

    const isLoggedIn =
        localStorage.getItem("jgglLoggedIn");

    const token =
        localStorage.getItem("jgglAuthToken");

    const savedUser =
        localStorage.getItem("jgglUser");

    if(
        isLoggedIn !== "true" ||
        !token ||
        !savedUser
    ){

        localStorage.removeItem(
            "jgglLoggedIn"
        );

        localStorage.removeItem(
            "jgglAuthToken"
        );

        localStorage.removeItem(
            "jgglUser"
        );

        window.location.href =
            "login.html?view=auth-flow-2";

        return false;
    }

    return true;
}


// ===========================================
// PROTECT ACCOUNT FROM BROWSER CACHE
// ===========================================

window.addEventListener("pageshow", function(){

    if(
        window.location.pathname.endsWith("account.html")
    ){
        checkLogin();
    }

});



// ===========================================
// LOAD ACCOUNT USER
// ===========================================

function loadAccountUser(){

    const savedUser =
        JSON.parse(localStorage.getItem("jgglUser"));

    if(!savedUser){
        return;
    }

    const nameElement =
        document.getElementById("accountUserName");

    const emailElement =
        document.getElementById("accountUserEmail");

    const phoneElement =
        document.getElementById("accountUserPhone");

    if(nameElement){
        nameElement.textContent =


savedUser.full_name ||
savedUser.name ||
"JGGL-STORE Customer";

    }

    if(emailElement){
        emailElement.textContent =
            savedUser.email || "";
    }

    if(phoneElement){
        phoneElement.textContent =
            savedUser.phone || "";
    }
}



// ===========================================
// LOAD MY ORDERS
// ===========================================


async function loadOrders(){

    const pendingContainer =
        document.getElementById("pendingOrders");

    const processingContainer =
        document.getElementById("processingOrders");

    const outForDeliveryContainer =
        document.getElementById("outForDeliveryOrders");

    const deliveredContainer =
        document.getElementById("deliveredOrders");

    const cancelledContainer =
        document.getElementById("cancelledOrders");

    if(
        !pendingContainer ||
        !processingContainer ||
        !outForDeliveryContainer ||
        !deliveredContainer ||
        !cancelledContainer
    ){
        return;
    }

    const savedUser =
        JSON.parse(
            localStorage.getItem("jgglUser")
            || "null"
        );

    if(!savedUser || !savedUser.email){

        alert("Please login again.");

        window.location.href =
            "login.html?view=auth-flow-2";

        return;
    }

    try{



const response = await fetch(
    API_BASE + "/api/orders",
    {
        headers: getAuthHeaders()
    }
);



        const data =
            await response.json();

        if(
            !response.ok ||
            !data.success
        ){

            alert(
                data.message ||
                "Unable to load orders."
            );

            return;
        }

        const orders =
            Array.isArray(data.orders)
                ? data.orders
                : [];

        pendingContainer.innerHTML = "";
        processingContainer.innerHTML = "";
        outForDeliveryContainer.innerHTML = "";
        deliveredContainer.innerHTML = "";
        cancelledContainer.innerHTML = "";

        const groups = {
            Pending: [],
            Processing: [],
            "Out for Delivery": [],
            Delivered: [],
            Cancelled: []
        };

        orders.forEach(function(order){

            const status =
                order.status || "Pending";

            if(groups[status]){
                groups[status].push(order);
            }else{
                groups.Pending.push(order);
            }

        });

        renderOrderGroup(
            groups.Pending,
            pendingContainer,
            "No pending orders yet."
        );

        renderOrderGroup(
            groups.Processing,
            processingContainer,
            "No processing orders yet."
        );

        renderOrderGroup(
            groups["Out for Delivery"],
            outForDeliveryContainer,
            "No orders out for delivery yet."
        );

        renderOrderGroup(
            groups.Delivered,
            deliveredContainer,
            "No delivered orders yet."
        );

        renderOrderGroup(
            groups.Cancelled,
            cancelledContainer,
            "No cancelled orders yet."
        );

    }catch(error){

        console.error(
            "LOAD ORDERS ERROR:",
            error
        );

        alert(
            "Network error while loading orders."
        );

    }

}



// ===========================================
// RENDER ORDER GROUP
// ===========================================

function renderOrderGroup(orders, container, emptyMessage){

    if(orders.length === 0){

        container.innerHTML =
            "<p>" + emptyMessage + "</p>";

        return;

    }

    orders.forEach(function(order){

        const orderCard =
            document.createElement("div");

        orderCard.className =
            "saved-order-card";

        // ===========================================
        // OPEN ORDER DETAILS
        // ===========================================

        orderCard.addEventListener(
            "click",
            function(){

                localStorage.setItem(
                    "selectedOrderId",



String(
    order.order_number ||
    order.id ||
    ""
)



                );

                window.location.href =
                    "order-details.html";

            }
        );

        // ===========================================
        // BUILD ORDER ITEMS
        // ===========================================

        const itemsHTML =
            (order.items || [])
                .map(function(item){

                    const productName =
                        item.product ||
                        item.name ||
                        "Product";

                    const quantity =
                        Number(item.quantity) || 1;

                    const price =
                        Number(item.price) || 0;

                    return `
                        <li>
                            ${productName}
                            × ${quantity}
                            — ₦${(price * quantity).toLocaleString()}
                        </li>
                    `;

                })
                .join("");

        // ===========================================
        // ORDER STATUS
        // ===========================================

        const status =
            order.status || "Pending";

        const statusClass =
            "status-" +
            status
                .toLowerCase()
                .replace(/\s+/g, "-");

        // ===========================================
        // BUILD ORDER CARD
        // ===========================================

        orderCard.innerHTML = `

            <div class="saved-order-header">

                <strong>

${order.order_number || order.id || "JGGL Order"}

               </strong>

                <span class="order-status ${statusClass}">
                    ${status}
                </span>

            </div>

            <p>

                <strong>Date:</strong>

${
    order.created_at
    ? new Date(order.created_at).toLocaleString()
    : order.date || ""
}



            </p>

            <ul class="saved-order-items">

                ${itemsHTML}

            </ul>

            <p class="saved-order-total">

                <strong>Total:</strong>

                ₦${Number(

order.total_amount ||
order.total ||
0


                ).toLocaleString()}

            </p>

        `;

        container.appendChild(orderCard);

    });

}



// ===========================================
// ORDERS PAGE STARTUP
// ===========================================

document.addEventListener("DOMContentLoaded", function(){

    if(
        window.location.pathname.endsWith("orders.html")
    ){


if(!checkLogin()){
    return;
}

loadOrders();

    }

});




// ===========================================
// LOAD ORDER DETAILS PAGE
// ===========================================


async function loadOrderDetails(){

    const orderNumber =
        localStorage.getItem("selectedOrderId");

    if(!orderNumber){
        console.error("Selected order number was not found.");
        return;
    }

    try{

const response = await fetch(
    API_BASE + "/api/orders/" +
    encodeURIComponent(orderNumber),
    {
        headers: getAuthHeaders()
    }
);


        const data = await response.json();

if(
    response.status === 401 ||
    response.status === 403
){
    localStorage.removeItem("jgglLoggedIn");
    localStorage.removeItem("jgglAuthToken");
    localStorage.removeItem("jgglUser");

    window.location.href = "login.html?view=auth-flow-2";
    return;
}


      if(!response.ok || !data.success || !data.order){

            console.error(
                data.message || "Unable to load order."
            );

            return;
        }

        const order = data.order;

        const orderDetailsId =
            document.getElementById("orderDetailsId");

        const orderDetailsStatus =
            document.getElementById("orderDetailsStatus");

        const orderDetailsDate =
            document.getElementById("orderDetailsDate");

        const orderCustomerName =
            document.getElementById("orderCustomerName");

        const orderCustomerPhone =
            document.getElementById("orderCustomerPhone");


const orderCustomerEmail =
    document.getElementById("orderCustomerEmail");


        const orderCustomerAddress =
            document.getElementById("orderCustomerAddress");

        const orderDetailsItems =
            document.getElementById("orderDetailsItems");

        const orderDetailsSubtotal =
            document.getElementById("orderDetailsSubtotal");


const orderDetailsPaymentMethod =
    document.getElementById("orderDetailsPaymentMethod");

const orderDetailsPaymentStatus =
    document.getElementById("orderDetailsPaymentStatus");

const orderDetailsCoupon =
    document.getElementById("orderDetailsCoupon");

const orderDetailsDiscount =
    document.getElementById("orderDetailsDiscount");

const orderDetailsShippingState =
    document.getElementById("orderDetailsShippingState");

const orderDetailsEstimatedDelivery =
    document.getElementById("orderDetailsEstimatedDelivery");


        const orderDetailsDeliveryFee =
            document.getElementById("orderDetailsDeliveryFee");

        const orderDetailsTotal =
            document.getElementById("orderDetailsTotal");

        if(orderDetailsId){
            orderDetailsId.textContent =
                order.order_number || "JGGL Order";
        }

        const status =
            order.status || "Pending";

        if(orderDetailsStatus){

            orderDetailsStatus.textContent =
                status;

            orderDetailsStatus.className =
                "order-status";

            switch(status){

                case "Pending":
                    orderDetailsStatus.classList.add(
                        "status-pending"
                    );
                    break;

                case "Processing":
                    orderDetailsStatus.classList.add(
                        "status-processing"
                    );
                    break;

                case "Out for Delivery":
                    orderDetailsStatus.classList.add(
                        "status-out-for-delivery"
                    );
                    break;

                case "Delivered":
                    orderDetailsStatus.classList.add(
                        "status-delivered"
                    );
                    break;

                case "Cancelled":
                    orderDetailsStatus.classList.add(
                        "status-cancelled"
                    );
                    break;
            }
        }

        const trackingSteps =
            document.querySelectorAll(".tracking-step");

        const trackingOrder = [
            "Pending",
            "Processing",
            "Out for Delivery",
            "Delivered"
        ];

        trackingSteps.forEach(function(step){
            step.classList.remove("active");
        });

        if(status === "Cancelled"){

            if(trackingSteps[0]){
                trackingSteps[0].classList.add("active");
            }

        }else{

            const currentIndex =
                trackingOrder.indexOf(status);

            trackingSteps.forEach(function(step, index){

                if(
                    currentIndex >= 0 &&
                    index <= currentIndex
                ){
                    step.classList.add("active");
                }

            });
        }

        if(orderDetailsDate){

            orderDetailsDate.textContent =
                order.created_at
                ? new Date(order.created_at).toLocaleString()
                : "";
        }

        if(orderCustomerName){
            orderCustomerName.textContent =
                order.customer_name || "";
        }

        if(orderCustomerPhone){
            orderCustomerPhone.textContent =
                order.customer_phone || "";
        }


if(orderCustomerEmail){
    orderCustomerEmail.textContent =
        order.customer_email || "";
}


       if(orderCustomerAddress){
            orderCustomerAddress.textContent =
                order.customer_address || "";
        }

        const itemsHTML =
            (order.items || []).map(function(item){

                const productName =
                    item.product ||
                    item.name ||
                    "Product";

                const variantName =
                    item.variant || "";

                const quantity =
                    Number(item.quantity) || 1;

                const price =
                    Number(item.price) || 0;

                const itemSubtotal =
                    Number(
                        item.subtotal ||
                        price * quantity
                    );

                return `
                    <div class="order-details-item">

                        <div>
                            <h4>${productName}</h4>

                            ${
                                variantName
                                ? `<p>Variant: ${variantName}</p>`
                                : ""
                            }

                            <p>
                                Quantity: ${quantity}
                            </p>

                            <p>
                                Unit Price:
                                ₦${price.toLocaleString()}
                            </p>

                            <strong>
                                ₦${itemSubtotal.toLocaleString()}
                            </strong>
                        </div>

                    </div>
                `;

            }).join("");


if(orderDetailsItems){

    orderDetailsItems.innerHTML =
        itemsHTML ||
        "<p>No products found.</p>";
}


       if(orderDetailsSubtotal){

            orderDetailsSubtotal.textContent =
                "₦" +
                Number(
                    order.subtotal || 0
                ).toLocaleString();
        }


if(orderDetailsCoupon){
    orderDetailsCoupon.textContent =
        order.coupon_code || "-";
}

if(orderDetailsDiscount){
    orderDetailsDiscount.textContent =
        "-₦" +
        Number(
            order.discount_amount || 0
        ).toLocaleString();
}

if(orderDetailsShippingState){
    orderDetailsShippingState.textContent =
        order.shipping_state || "-";
}

if(orderDetailsEstimatedDelivery){

    const deliveryText =
        order.estimated_delivery || "-";

    orderDetailsEstimatedDelivery.textContent =
        deliveryText.replace(
            /^Estimated delivery:\s*/i,
            ""
        );
}


       if(orderDetailsDeliveryFee){

            orderDetailsDeliveryFee.textContent =
                "₦" +
                Number(
                    order.shipping_fee || 0
                ).toLocaleString();
        }



if(orderDetailsPaymentMethod){
    orderDetailsPaymentMethod.textContent =
        order.payment_method || "-";
}

if(orderDetailsPaymentStatus){
    orderDetailsPaymentStatus.textContent =
        order.payment_status || "-";
}



        if(orderDetailsTotal){

            orderDetailsTotal.textContent =
                "₦" +
                Number(
                    order.total_amount || 0
                ).toLocaleString();
        }

    }catch(error){

        console.error(
            "LOAD ORDER DETAILS ERROR:",
            error
        );
    }
}



// ===========================================
// SHARE CURRENT ORDER
// FULL ORDER DETAILS + PRODUCT IMAGE
// ===========================================


async function shareCurrentOrder(){

    const orderNumber =
        localStorage.getItem("selectedOrderId");

    if(!orderNumber){
        alert("Order not found.");
        return;
    }

    try{



const response = await fetch(
    API_BASE + "/api/orders/" +
    encodeURIComponent(orderNumber),
    {
        headers: getAuthHeaders()
    }
);


      const data = await response.json();

        if(
            !response.ok ||
            !data.success ||
            !data.order
        ){
            alert("Unable to load order details.");
            return;
        }

        const order = data.order;

        const itemsText =
            (order.items || [])
                .map(function(item){

                    const name =
                        item.product ||
                        item.name ||
                        "Product";

                    const quantity =
                        Number(item.quantity) || 1;

                    const price =
                        Number(item.price) || 0;

                    const subtotal =
                        Number(
                            item.subtotal ||
                            price * quantity
                        );

                    return (
                        name +
                        "\nQuantity: " +
                        quantity +
                        "\nUnit Price: ₦" +
                        price.toLocaleString() +
                        "\nSubtotal: ₦" +
                        subtotal.toLocaleString()
                    );

                })
                .join("\n\n");

        const estimatedDelivery =
            String(
                order.estimated_delivery || "-"
            ).replace(
                /^Estimated delivery:\s*/i,
                ""
            );

        const shareText =
            "JGGL-STORE ORDER DETAILS" +

            "\n\nOrder ID: " +
            (order.order_number || "") +

            "\nStatus: " +
            (order.status || "Pending") +

            "\nDate: " +
            (
                order.created_at
                ? new Date(
                    order.created_at
                ).toLocaleString()
                : "-"
            ) +

            "\n\nCUSTOMER DETAILS" +

            "\nName: " +
            (order.customer_name || "") +

            "\nPhone: " +
            (order.customer_phone || "") +

            "\nEmail: " +
            (order.customer_email || "") +

            "\nAddress: " +
            (order.customer_address || "") +

            "\n\nPRODUCTS" +

            "\n" +
            itemsText +

            "\n\nORDER SUMMARY" +

            "\nSubtotal: ₦" +
            Number(
                order.subtotal || 0
            ).toLocaleString() +

            "\nCoupon: " +
            (order.coupon_code || "-") +

            "\nDiscount: ₦" +
            Number(
                order.discount_amount || 0
            ).toLocaleString() +

            "\nShipping State: " +
            (order.shipping_state || "-") +

            "\nDelivery Fee: ₦" +
            Number(
                order.shipping_fee || 0
            ).toLocaleString() +

            "\nEstimated Delivery: " +
            estimatedDelivery +

            "\nPayment Method: " +
            (order.payment_method || "-") +

            "\nPayment Status: " +
            (order.payment_status || "-") +

            "\nTotal: ₦" +
            Number(
                order.total_amount || 0
            ).toLocaleString() +

            "\n\nThank you for shopping with JGGL-STORE.";

        const shareData = {
            title:
                "JGGL-STORE Order " +
                (order.order_number || ""),
            text: shareText
        };

        const firstItem =
            Array.isArray(order.items) &&
            order.items.length > 0
                ? order.items[0]
                : null;

        if(
            firstItem &&
            firstItem.image
        ){

            try{

                const imageURL =
                    new URL(
                        firstItem.image,
                        window.location.href
                    ).href;

                const imageResponse =
                    await fetch(imageURL);

                if(imageResponse.ok){

                    const imageBlob =
                        await imageResponse.blob();

                    const extension =
                        firstItem.image
                            .split(".")
                            .pop()
                            .split("?")[0] ||
                        "png";

                    const imageFile =
                        new File(
                            [
                                imageBlob
                            ],
                            "jggl-order-product." +
                            extension,
                            {
                                type:
                                    imageBlob.type ||
                                    "image/png"
                            }
                        );

                    const fileShareData = {
                        title: shareData.title,
                        text: shareData.text,
                        files: [
                            imageFile
                        ]
                    };

                    if(
                        navigator.canShare &&
                        navigator.canShare(
                            {
                                files: [
                                    imageFile
                                ]
                            }
                        ) &&
                        navigator.share
                    ){

                        await navigator.share(
                            fileShareData
                        );

                        return;
                    }

                }

            }catch(imageError){

                console.error(
                    "ORDER IMAGE SHARE ERROR:",
                    imageError
                );

            }

        }



try{

    if(navigator.share){

        await navigator.share(
            shareData
        );

        return;
    }

}catch(shareError){

    console.error(
        "ORDER TEXT SHARE ERROR:",
        shareError
    );

}

if(navigator.clipboard){

    await navigator.clipboard.writeText(
        shareData.text
    );

    alert(
        "Order information copied successfully."
    );

}else{

    alert(shareData.text);

}


    }catch(error){

        console.error(
            "SHARE ORDER ERROR:",
            error
        );

        alert(
            "Unable to share order."
        );

    }

}



// ===========================================
// ORDER DETAILS PAGE STARTUP
// ===========================================

document.addEventListener("DOMContentLoaded", function(){

    if(
        window.location.pathname.endsWith("order-details.html")
    ){

if(!checkLogin()){
    return;
}

loadOrderDetails();

    }

});




// ===========================================
// UPDATE NOTIFICATION BADGE
// ===========================================


async function updateNotificationBadge(){

    const badge =
        document.getElementById(
            "notificationBadge"
        );

    if(!badge){
        return;
    }

    const user =
        JSON.parse(
            localStorage.getItem("jgglUser") || "{}"
        );

    const email =
        String(user.email || "").trim();

    const phone =
        String(user.phone || "").trim();

    if(!email && !phone){

        badge.style.display = "none";
        return;

    }

    try{

const response =
    await fetch(
        API_BASE + "/api/notifications",
        {
            headers: getAuthHeaders()
        }
    );



      const data =
            await response.json();

        if(
            !response.ok ||
            !data.success
        ){
            throw new Error(
                data.message ||
                "Unable to load notification badge."
            );
        }

        const notifications =
            Array.isArray(data.notifications)
                ? data.notifications
                : [];

        const unreadCount =
            notifications.filter(
                function(notification){

                    return notification.is_read === false;

                }
            ).length;

        if(unreadCount === 0){

            badge.style.display = "none";

        }else{

            badge.style.display =
                "inline-flex";

            badge.textContent =
                unreadCount;

        }

    }catch(error){

        console.error(
            "UPDATE NOTIFICATION BADGE ERROR:",
            error
        );

        badge.style.display = "none";

    }

}


// ===========================================
// MARK NOTIFICATIONS AS READ
// ===========================================


async function markNotificationsAsRead(){

    const user =
        JSON.parse(
            localStorage.getItem("jgglUser") || "{}"
        );

    const email =
        String(user.email || "").trim();

    const phone =
        String(user.phone || "").trim();

    if(!email && !phone){
        return;
    }

    try{

        const response =
            await fetch(
                API_BASE + "/api/notifications/read",
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        email: email,
                        phone: phone
                    })
                }
            );

        const data =
            await response.json();

        if(
            !response.ok ||
            !data.success
        ){
            throw new Error(
                data.message ||
                "Unable to mark notifications as read."
            );
        }

        await updateNotificationBadge();

    }catch(error){

        console.error(
            "MARK NOTIFICATIONS AS READ ERROR:",
            error
        );

    }

}


// ===========================================
// CLEAR NOTIFICATIONS
// ===========================================



async function clearNotifications(){

    const confirmClear = confirm(
        "Are you sure you want to clear all notifications?"
    );

    if(!confirmClear){
        return;
    }

    const user =
        JSON.parse(
            localStorage.getItem("jgglUser") || "{}"
        );

    const email =
        String(user.email || "").trim();

    const phone =
        String(user.phone || "").trim();

    if(!email && !phone){
        return;
    }

    try{

        const params =
            new URLSearchParams();

        if(email){
            params.set("email", email);
        }

        if(phone){
            params.set("phone", phone);
        }

        const response =
            await fetch(
                API_BASE + "/api/notifications?" +
                params.toString(),
                {
                    method: "DELETE"
                }
            );

        const data =
            await response.json();

        if(
            !response.ok ||
            !data.success
        ){

            alert(
                data.message ||
                "Unable to clear notifications."
            );

            return;
        }

        await updateNotificationBadge();

        await loadNotifications();

    }catch(error){

        console.error(
            "CLEAR NOTIFICATIONS ERROR:",
            error
        );

        alert(
            "Network error while clearing notifications."
        );

    }

}


// ===========================================
// OPEN NOTIFICATION ORDER
// ===========================================


function openNotificationOrder(orderId){

    alert("Order ID: " + orderId);

    localStorage.setItem(
        "selectedOrderId",
        String(orderId)
    );

    window.location.href =
        "order-details.html";
}



// ===========================================
// DELETE NOTIFICATION
// ===========================================



async function deleteNotification(id){

    const user =
        JSON.parse(
            localStorage.getItem("jgglUser") || "{}"
        );

    const email =
        String(user.email || "").trim();

    const phone =
        String(user.phone || "").trim();

    if(!email && !phone){
        return;
    }

    try{

        const params =
            new URLSearchParams();

        if(email){
            params.set("email", email);
        }

        if(phone){
            params.set("phone", phone);
        }

        const response =
            await fetch(
                API_BASE + "/api/notifications/" +
                encodeURIComponent(id) +
                "?" +
                params.toString(),
                {
                    method: "DELETE"
                }
            );

        const data =
            await response.json();

        if(
            !response.ok ||
            !data.success
        ){

            alert(
                data.message ||
                "Unable to delete notification."
            );

            return;
        }

        await loadNotifications();

        await updateNotificationBadge();

    }catch(error){

        console.error(
            "DELETE NOTIFICATION ERROR:",
            error
        );

        alert(
            "Network error while deleting notification."
        );

    }

}


// ===========================================
// LOAD NOTIFICATIONS
// ===========================================


async function loadNotifications(){

    const container =
        document.getElementById(
            "notificationsContainer"
        );

    if(!container){
        return;
    }


const token =
    localStorage.getItem("jgglAuthToken") || "";


if(!token){

    container.innerHTML = `
        <div class="empty-notifications">
            <i class="fas fa-bell-slash"></i>
            <p>Please login again to view notifications.</p>
        </div>
    `;

    return;
}




    container.innerHTML = `
        <div class="empty-notifications">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading notifications...</p>
        </div>
    `;

    try{



const response =
    await fetch(
        API_BASE + "/api/notifications",
        {
            headers: {
                "Authorization":
                    "Bearer " + token
            }
        }
    );



      const data =
            await response.json();

        if(
            !response.ok ||
            !data.success
        ){

            throw new Error(
                data.message ||
                "Unable to load notifications."
            );

        }

        const notifications =
            Array.isArray(data.notifications)
                ? data.notifications
                : [];

        container.innerHTML = "";

        if(notifications.length === 0){

            container.innerHTML = `
                <div class="empty-notifications">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications yet.</p>
                </div>
            `;

            return;
        }

        notifications.forEach(
            function(notification){

                const card =
                    document.createElement("div");

                card.className =
                    "notification-card";

                const linkedOrderId =
                    notification.order_number || null;

                if(linkedOrderId){

                    card.addEventListener(
                        "click",
                        function(){

                            openNotificationOrder(
                                linkedOrderId
                            );

                        }
                    );

                }

                const notificationDate =
                    notification.created_at
                        ? new Date(
                            notification.created_at
                        ).toLocaleString()
                        : "";

                card.innerHTML = `
                    <div class="notification-card-header">

                        <h3>${notification.title}</h3>

                        <button
                            type="button"
                            class="delete-notification-btn"
                            aria-label="Delete Notification"
                        >
                            <i class="fas fa-trash"></i>
                        </button>

                    </div>

                    <p>${notification.message}</p>

                    <small>${notificationDate}</small>
                `;

                const deleteButton =
                    card.querySelector(
                        ".delete-notification-btn"
                    );

                deleteButton.addEventListener(
                    "click",
                    function(event){

                        event.stopPropagation();

                        deleteNotification(
                            notification.id
                        );

                    }
                );

                container.appendChild(card);

            }
        );

    }catch(error){

        console.error(
            "LOAD NOTIFICATIONS ERROR:",
            error
        );

        container.innerHTML = `
            <div class="empty-notifications">
                <i class="fas fa-triangle-exclamation"></i>
                <p>Unable to load notifications.</p>
            </div>
        `;

    }

}


// ===========================================
// LOAD ADMIN ORDERS
// ===========================================

async function loadAdminOrders(){

    const container =
        document.getElementById(
            "adminOrdersContainer"
        );

    if(!container){
        return;
    }

    container.innerHTML = `
        <div class="empty-orders">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading orders...</p>
        </div>
    `;

    try{

        const response =
            await fetch(
                API_BASE + "/api/admin/orders"
            );

        const data =
            await response.json();

        if(
            !response.ok ||
            !data.success
        ){

            throw new Error(
                data.message ||
                "Unable to load orders."
            );

        }

        const orders =
            Array.isArray(data.orders)
                ? data.orders
                : [];

        const totalElement =
            document.getElementById(
                "adminTotalOrders"
            );

        const pendingElement =
            document.getElementById(
                "adminPendingOrders"
            );

        const deliveredElement =
            document.getElementById(
                "adminDeliveredOrders"
            );

        if(totalElement){
            totalElement.textContent =
                orders.length;
        }

        if(pendingElement){

            pendingElement.textContent =
                orders.filter(function(order){

                    return (
                        order.status ||
                        "Pending"
                    ) === "Pending";

                }).length;

        }

        if(deliveredElement){

            deliveredElement.textContent =
                orders.filter(function(order){

                    return order.status ===
                        "Delivered";

                }).length;

        }

        container.innerHTML = "";

        if(orders.length === 0){

            container.innerHTML = `
                <div class="empty-orders">
                    <i class="fas fa-box-open"></i>
                    <p>No orders available.</p>
                </div>
            `;

            return;
        }

        orders.forEach(function(order){

            const card =
                document.createElement("div");

            card.className =
                "admin-order-card";

            const status =
                order.status || "Pending";

            const statusClass =
                "status-" +
                status
                    .toLowerCase()
                    .replace(/\s+/g, "-");

            const itemsHTML =
                (order.items || [])
                    .map(function(item){

                        const productName =
                            item.product_name ||
                            item.product ||
                            item.name ||
                            "Product";

                        const quantity =
                            Number(
                                item.quantity
                            ) || 1;

                        return `
                            <li>
                                ${productName}
                                × ${quantity}
                            </li>
                        `;

                    })
                    .join("");

            const orderIdentifier =
                order.order_number ||
                order.id ||
                "JGGL Order";

            const orderDate =
                order.created_at
                    ? new Date(
                        order.created_at
                    ).toLocaleString()
                    : "";

            const totalAmount =
                Number(
                    order.total_amount ||
                    order.total ||
                    0
                );

            card.innerHTML = `
                <div class="admin-order-header">

                    <div>
                        <strong>
                            ${orderIdentifier}
                        </strong>

                        <small>
                            ${orderDate}
                        </small>
                    </div>

                    <span class="order-status ${statusClass}">
                        ${status}
                    </span>

                </div>

                <div class="admin-order-customer">

                    <p>
                        <strong>Customer:</strong>
                        ${order.customer_name || ""}
                    </p>

                    <p>
                        <strong>Phone:</strong>
                        ${order.customer_phone || ""}
                    </p>

                </div>

                <ul class="admin-order-items">
                    ${itemsHTML}
                </ul>

                <p class="admin-order-total">
                    <strong>Total:</strong>
                    ₦${totalAmount.toLocaleString()}
                </p>

                <div class="admin-order-actions">

                    <select
                        class="admin-status-select"
                        data-order-id="${order.id}"
                    >

                        <option value="Pending"
                            ${status === "Pending" ? "selected" : ""}>
                            Pending
                        </option>

                        <option value="Processing"
                            ${status === "Processing" ? "selected" : ""}>
                            Processing
                        </option>

                        <option value="Out for Delivery"
                            ${status === "Out for Delivery" ? "selected" : ""}>
                            Out for Delivery
                        </option>

                        <option value="Delivered"
                            ${status === "Delivered" ? "selected" : ""}>
                            Delivered
                        </option>

                        <option value="Cancelled"
                            ${status === "Cancelled" ? "selected" : ""}>
                            Cancelled
                        </option>

                    </select>

                    <button
                        type="button"
                        class="admin-update-status-btn"
                    >
                        <i class="fas fa-check"></i>
                        Update Status
                    </button>

                    <button
                        type="button"
                        class="admin-view-order-btn"
                    >
                        <span class="admin-view-eye" aria-hidden="true">👁️</span>
                        View Order
                    </button>

                </div>
            `;

            const updateButton =
                card.querySelector(
                    ".admin-update-status-btn"
                );

            updateButton.addEventListener(
                "click",
                function(){

                    const select =
                        card.querySelector(
                            ".admin-status-select"
                        );



updateAdminOrderStatusFromList(
    order.id,
    select.value
);

}
);


            const viewButton =
                card.querySelector(
                    ".admin-view-order-btn"
                );

            viewButton.addEventListener(
                "click",
                function(){

                    localStorage.setItem(
                        "selectedAdminOrderId",
                        String(order.id)
                    );

                    window.location.href =
                        "admin-order-details.html";

                }
            );

            container.appendChild(card);

        });

    }catch(error){

        console.error(
            "Failed to load admin orders:",
            error
        );

        container.innerHTML = `
            <div class="empty-orders">
                <i class="fas fa-triangle-exclamation"></i>
                <p>${error.message}</p>
            </div>
        `;

    }

}



// ===========================================
// CUSTOMER NOTIFICATIONS PAGE STARTUP
// ===========================================

document.addEventListener(
    "DOMContentLoaded",
    function(){

        if(
            window.location.pathname.endsWith(
                "notifications.html"
            )
        ){


if(!checkLogin()){
    return;
}

loadNotifications();

markNotificationsAsRead();

        }

    }
);



// ===========================================
// UPDATE ADMIN ORDER STATUS
// ===========================================

async function updateAdminOrderStatusFromList(
    orderId,
    newStatus
){


    try{

        const response =
            await fetch(
                API_BASE + "/api/admin/orders/" +
                encodeURIComponent(orderId) +
                "/status",
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        status: newStatus
                    })
                }
            );

        const data =
            await response.json();

        if(
            !response.ok ||
            !data.success
        ){

            alert(
                data.message ||
                "Unable to update order status."
            );

            return;
        }

        alert(
            "Order status updated successfully."
        );

        loadAdminOrders();

    }catch(error){

        console.error(
            "Failed to update order status:",
            error
        );

        alert(
            "Network error while updating order status."
        );

    }

}




// ===========================================
// ADMIN ORDERS PAGE STARTUP
// ===========================================

document.addEventListener(
    "DOMContentLoaded",
    function(){

        if(
            window.location.pathname.endsWith(
                "admin-orders.html"
            )
        ){
            loadAdminOrders();
        }

    }
);



// ===========================================
// LOAD ADMIN DASHBOARD
// ===========================================


async function loadAdminDashboard(){

    const totalOrders =
        document.getElementById(
            "dashboardTotalOrders"
        );

    const pendingOrders =
        document.getElementById(
            "dashboardPendingOrders"
        );

    const deliveredOrders =
        document.getElementById(
            "dashboardDeliveredOrders"
        );

    const totalSales =
        document.getElementById(
            "dashboardTotalSales"
        );

    const dailySales =
        document.getElementById(
            "dashboardDailySales"
        );

    const weeklySales =
        document.getElementById(
            "dashboardWeeklySales"
        );

    const monthlySales =
        document.getElementById(
            "dashboardMonthlySales"
        );

    const yearlySales =
        document.getElementById(
            "dashboardYearlySales"
        );

    const recentOrdersContainer =
        document.getElementById(
            "dashboardRecentOrders"
        );

    try{

        const response =
            await fetch(
                API_BASE + "/api/admin/orders"
            );

        const data =
            await response.json();

        if(
            !response.ok ||
            !data.success
        ){

            throw new Error(
                data.message ||
                "Unable to load dashboard orders."
            );
        }

        const orders =
            Array.isArray(data.orders)
                ? data.orders
                : [];

        const pendingCount =
            orders.filter(function(order){

                return (
                    order.status || "Pending"
                ) === "Pending";

            }).length;

        const deliveredCount =
            orders.filter(function(order){

                return order.status ===
                    "Delivered";

            }).length;

        const salesTotal =
            orders
                .filter(function(order){

                    return order.status !==
                        "Cancelled";

                })
                .reduce(function(total, order){

                    return total +
                        Number(
                            order.total_amount ||
                            order.total ||
                            0
                        );

                }, 0);

        const now = new Date();

        const startOfToday =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate()
            );

        const startOfWeek =
            new Date(startOfToday);

        startOfWeek.setDate(
            startOfToday.getDate() -
            startOfToday.getDay()
        );

        const startOfMonth =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                1
            );

        const startOfYear =
            new Date(
                now.getFullYear(),
                0,
                1
            );

        function calculateSalesFrom(startDate){

            return orders
                .filter(function(order){

                    if(order.status === "Cancelled"){
                        return false;
                    }

                    const orderDate =
                        new Date(
                            order.created_at ||
                            order.order_date ||
                            order.date
                        );

                    return (
                        !Number.isNaN(orderDate.getTime()) &&
                        orderDate >= startDate
                    );

                })
                .reduce(function(total, order){

                    return total +
                        Number(
                            order.total_amount ||
                            order.total ||
                            0
                        );

                }, 0);
        }

        const dailySalesTotal =
            calculateSalesFrom(startOfToday);

        const weeklySalesTotal =
            calculateSalesFrom(startOfWeek);

        const monthlySalesTotal =
            calculateSalesFrom(startOfMonth);

        const yearlySalesTotal =
            calculateSalesFrom(startOfYear);

        if(totalSales){
            totalSales.textContent =
                "₦" +
                salesTotal.toLocaleString();
        }

        if(dailySales){
            dailySales.textContent =
                "₦" +
                dailySalesTotal.toLocaleString();
        }

        if(weeklySales){
            weeklySales.textContent =
                "₦" +
                weeklySalesTotal.toLocaleString();
        }

        if(monthlySales){
            monthlySales.textContent =
                "₦" +
                monthlySalesTotal.toLocaleString();
        }

        if(yearlySales){
            yearlySales.textContent =
                "₦" +
                yearlySalesTotal.toLocaleString();
        }

        if(totalOrders){
            totalOrders.textContent =
                orders.length;
        }

        if(pendingOrders){
            pendingOrders.textContent =
                pendingCount;
        }

        if(deliveredOrders){
            deliveredOrders.textContent =
                deliveredCount;
        }

        if(totalSales){

            totalSales.textContent =
                "₦" +
                salesTotal.toLocaleString();

        }

        if(!recentOrdersContainer){
            return;
        }

        recentOrdersContainer.innerHTML = "";

        const recentOrders =
            orders.slice(0, 5);

        if(recentOrders.length === 0){

            recentOrdersContainer.innerHTML = `
                <div class="empty-orders">
                    <i class="fas fa-box-open"></i>
                    <p>No recent orders.</p>
                </div>
            `;

            return;
        }

        recentOrders.forEach(function(order){

            const status =
                order.status || "Pending";

            const statusClass =
                "status-" +
                status
                    .toLowerCase()
                    .replace(/\s+/g, "-");

            const orderIdentifier =
                order.order_number ||
                order.id ||
                "JGGL Order";

            const orderDate =
                order.created_at
                    ? new Date(
                        order.created_at
                    ).toLocaleString()
                    : "";

            const orderTotal =
                Number(
                    order.total_amount ||
                    order.total ||
                    0
                );

            const card =
                document.createElement("div");

            card.className =
                "dashboard-recent-order";

            card.innerHTML = `
                <div>

                    <strong>
                        ${orderIdentifier}
                    </strong>

                    <small>
                        ${orderDate}
                    </small>

                </div>

                <span class="order-status ${statusClass}">
                    ${status}
                </span>

                <strong>
                    ₦${orderTotal.toLocaleString()}
                </strong>
            `;

            card.addEventListener(
                "click",
                function(){

                    localStorage.setItem(
                        "selectedAdminOrderId",
                        String(order.id)
                    );

                    window.location.href =
                        "admin-order-details.html";

                }
            );

            recentOrdersContainer.appendChild(
                card
            );

        });

    }catch(error){

        console.error(
            "LOAD ADMIN DASHBOARD ERROR:",
            error
        );

        if(recentOrdersContainer){

            recentOrdersContainer.innerHTML = `
                <div class="empty-orders">
                    <p>Unable to load dashboard data.</p>
                </div>
            `;

        }

    }

}


// ===========================================
// ADMIN DASHBOARD PAGE STARTUP
// ===========================================

document.addEventListener(
    "DOMContentLoaded",
    function(){

        if(
            window.location.pathname.endsWith(
                "admin-dashboard.html"
            )
        ){
            loadAdminDashboard();
        }

    }
);



// ===========================================
// LOAD ADMIN PRODUCTS
// ===========================================


async function loadAdminProducts(){


    const container =
        document.getElementById(
            "adminProductsContainer"
        );

    if(!container){
        return;
    }




let products = [];

try{



const response =
    await fetch(
        API_BASE + "/api/admin/products"
    );


    const data =
        await response.json();

    if(
        response.ok &&
        data.success
    ){
        products = data.products.map(function(product){

            return {
                id:
                    product.frontend_id ||
                    product.id,

                name:
                    product.product_name,

                price:
                    Number(
                        product.retail_price
                    ),

                stock:
                    Number(
                        product.stock_quantity
                    ),

                reorderLevel:
                    Number(
                        product.reorder_level || 0
                    ),

                stockStatus:
                    product.stock_status ||
                    "In Stock",

                group:
                    product.product_group,

                category:
                    product.category,

                image:
                    product.image_url
            };

        });

    }

}catch(error){

    console.error(
        "Failed to load admin products:",
        error
    );


alert(error.message);


}



    container.innerHTML = "";

    if(products.length === 0){

        container.innerHTML = `
            <div class="empty-orders">
                <i class="fas fa-box-open"></i>
                <p>No products available.</p>
            </div>
        `;

        return;
    }

    products.forEach(function(product){

        const card =
            document.createElement("div");

        card.className =
            "admin-product-card";

        const productId =
            product.id || Date.now();

        const productName =
            product.name || "Product";

        const productPrice =
            Number(product.price) || 0;

        const productStock =
            Number(product.stock) || 0;

        const reorderLevel =
            Number(product.reorderLevel) || 0;

        const productStockStatus =
            productStock <= 0
                ? "Out of Stock"
                : (
                    reorderLevel > 0 &&
                    productStock <= reorderLevel
                        ? "Low Stock"
                        : "In Stock"
                );

        const productImage =
            product.image || "";

        card.innerHTML = `
            <div class="admin-product-image">

                ${
                    productImage
                        ? `
                            <img
                                src="${productImage}"
                                alt="${productName}"
                            >
                        `
                        : `
                            <i class="fas fa-image"></i>
                        `
                }

            </div>

            <div class="admin-product-info">

                <h4>
                    ${productName}
                </h4>

                <p>
                    <strong>Price:</strong>
                    ₦${productPrice.toLocaleString()}
                </p>

                <p>
                    <strong>Stock:</strong>
                    ${productStock}
                </p>

                <p>
                    <strong>Status:</strong>
                    <span
                        class="admin-stock-status-badge ${
                            productStockStatus
                                .toLowerCase()
                                .replace(/\s+/g, "-")
                        }"
                    >
                        ${productStockStatus}
                    </span>
                </p>

                <p>
                    <strong>Alert Level:</strong>
                    ${reorderLevel}
                </p>

                <p>
                    <strong>Category:</strong>
                    ${product.group || product.category || "General"}
                </p>

            </div>

            <div class="admin-product-actions">



<button
    type="button"
    class="admin-view-product-btn"
    onclick="viewAdminProduct('${productId}')"
>
    <i class="fas fa-eye"></i>
    View
</button>


                <button
                    type="button"
                    class="admin-edit-product-btn"
                    onclick="editAdminProduct('${productId}')"
                >

                    <i class="fas fa-pen"></i>

                    Edit

                </button>

                <button
                    type="button"
                    class="admin-delete-product-btn"
                    onclick="deleteAdminProduct('${productId}')"
                >

                    <i class="fas fa-trash"></i>

                    Delete

                </button>

            </div>
        `;

        container.appendChild(card);

    });

}


// ===========================================
// OPEN ADD PRODUCT FORM
// ===========================================


function openAddProductForm(){

    localStorage.removeItem(
        "selectedAdminProductId"
    );

    window.location.href =
        "admin-product-form.html";

}




// ===========================================
// VIEW ADMIN PRODUCT
// ===========================================

function viewAdminProduct(productId){

    localStorage.setItem(
        "selectedAdminProductId",
        String(productId)
    );

    window.location.href =
        "admin-product-details.html";

}




// ===========================================
// EDIT ADMIN PRODUCT
// ===========================================

function editAdminProduct(productId){

    localStorage.setItem(
        "selectedAdminProductId",
        String(productId)
    );

    window.location.href =
        "admin-product-form.html";

}



// ===========================================
// DELETE ADMIN PRODUCT
// ===========================================

async function deleteAdminProduct(productId){

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this product?"
        );


if(!confirmDelete){
    return false;
}



    try{

        const response =
            await fetch(
                API_BASE + "/api/admin/products/" +
                encodeURIComponent(productId),
                {
                    method: "DELETE"
                }
            );

        const data =
            await response.json();

        if(!response.ok || !data.success){

            alert(
                data.message ||
                "Unable to delete product."
            );

            return;

        }

        alert(
            "Product deleted successfully."
        );

        loadAdminProducts();

return true;


    }catch(error){

        console.error(
            "Failed to delete product:",
            error
        );

        alert(
            "Network error."
        );

    }

}



// ===========================================
// ADMIN PRODUCTS PAGE STARTUP
// ===========================================

document.addEventListener(
    "DOMContentLoaded",
    function(){

        if(
            window.location.pathname.endsWith(
                "admin-products.html"
            )
        ){
            loadAdminProducts();
        }

    }
);





// ===========================================
// LOAD ADMIN CUSTOMERS
// ===========================================


async function loadAdminCustomers(){

    const container =
        document.getElementById(
            "customersContainer"
        );

    if(!container){
        return;
    }

    try{

        const response = await fetch(
            API_BASE + "/api/admin/customers"
        );

        const data = await response.json();

        if(
            !response.ok ||
            !data.success
        ){

            container.innerHTML = `
                <div class="admin-empty">
                    <h3>
                        Unable to load customers
                    </h3>
                </div>
            `;

            return;
        }

        const customers =
            Array.isArray(data.customers)
                ? data.customers
                : [];

        const totalCustomers =
            document.getElementById(
                "totalCustomers"
            );

        if(totalCustomers){
            totalCustomers.textContent =
                customers.length;
        }

        const activeCustomers =
            document.getElementById(
                "activeCustomers"
            );

        const newCustomers =
            document.getElementById(
                "newCustomers"
            );

        const activeCount =
            customers.filter(function(customer){
                return customer.is_active !== false;
            }).length;

        const now =
            new Date();

        const thirtyDaysAgo =
            new Date(
                now.getTime() -
                (30 * 24 * 60 * 60 * 1000)
            );

        const newCount =
            customers.filter(function(customer){

                if(!customer.joined_at){
                    return false;
                }

                const joinedDate =
                    new Date(customer.joined_at);

                return (
                    !Number.isNaN(joinedDate.getTime()) &&
                    joinedDate >= thirtyDaysAgo
                );

            }).length;

        if(activeCustomers){
            activeCustomers.textContent =
                activeCount;
        }

        if(newCustomers){
            newCustomers.textContent =
                newCount;
        }

        if(customers.length === 0){

            container.innerHTML = `
                <div class="admin-empty">
                    <h3>No Customers Found</h3>
                </div>
            `;

            return;
        }

        container.innerHTML = "";

        customers.forEach(function(customer){

            const card =
                document.createElement("div");

            card.className =
                "admin-customer-card";

            card.innerHTML = `

                <div class="admin-customer-info">

                    <h3>
                        ${customer.full_name || "No Name"}
                    </h3>

                    <p>
                        <i class="fas fa-phone"></i>
                        ${customer.phone || "-"}
                    </p>

                    <p>
                        <i class="fas fa-envelope"></i>
                        ${customer.email || "-"}
                    </p>

                </div>

                <div class="admin-customer-actions">

                    <button
                        class="admin-view-customer"
                        onclick="viewAdminCustomer('${customer.id}')"
                    >
                        <i class="fas fa-eye"></i>
                        View
                    </button>

                    <button
                        class="admin-delete-customer"
                        onclick="deleteAdminCustomer('${customer.id}')"
                    >
                        <i class="fas fa-trash"></i>
                        Delete
                    </button>

                </div>
            `;

            container.appendChild(card);

        });

    }catch(error){

        console.error(
            "Unable to load admin customers:",
            error
        );

        container.innerHTML = `
            <div class="admin-empty">
                <h3>Network Error</h3>
            </div>
        `;

    }

}




// ===========================================
// ADMIN CUSTOMERS STARTUP
// ===========================================

document.addEventListener("DOMContentLoaded", function(){

    if(
        window.location.pathname.endsWith(
            "admin-customers.html"
        )
    ){

        loadAdminCustomers();

    }

});




// ===========================================
// VIEW ADMIN CUSTOMER
// ===========================================



function viewAdminCustomer(customerId){

    localStorage.setItem(
        "selectedAdminCustomerId",
        String(customerId)
    );

    window.location.href =
        "admin-customer-details.html";

}


// ===========================================
// DELETE ADMIN CUSTOMER
// ===========================================


async function deleteAdminCustomer(customerId){

    const confirmed =
        confirm(
            "Are you sure you want to delete this customer?"
        );

    if(!confirmed){
        return;
    }

    try{

        const response =
            await fetch(
                API_BASE + "/api/admin/customers/" +
                encodeURIComponent(customerId),
                {
                    method: "DELETE"
                }
            );

        const data =
            await response.json();

        if(
            !response.ok ||
            !data.success
        ){

            alert(
                data.message ||
                "Unable to delete customer."
            );

            return;
        }

        alert(
            data.message ||
            "Customer deleted successfully."
        );

        loadAdminCustomers();

    }catch(error){

        console.error(
            "DELETE ADMIN CUSTOMER ERROR:",
            error
        );

        alert(
            "Network error while deleting customer."
        );

    }

}


// ===========================================
// LOAD ADMIN CUSTOMER DETAILS
// ===========================================


async function loadAdminCustomerDetails(){

    const customerId =
        localStorage.getItem(
            "selectedAdminCustomerId"
        );

    if(!customerId){

        alert("No customer selected.");

        window.location.href =
            "admin-customers.html";

        return;
    }

    try{

        const response = await fetch(
            API_BASE + "/api/admin/customers/" +
            encodeURIComponent(customerId)
        );

        const data = await response.json();

        if(
            !response.ok ||
            !data.success ||
            !data.customer
        ){

            alert(
                data.message ||
                "Unable to load customer details."
            );

            return;
        }

        const customer =
            data.customer;

        const name =
            document.getElementById(
                "customerDetailsName"
            );

        const email =
            document.getElementById(
                "customerDetailsEmail"
            );

        const phone =
            document.getElementById(
                "customerDetailsPhone"
            );

        const joined =
            document.getElementById(
                "customerDetailsJoined"
            );

        const orders =
            document.getElementById(
                "customerDetailsOrders"
            );

        const spent =
            document.getElementById(
                "customerDetailsSpent"
            );

        const status =
            document.getElementById(
                "customerDetailsStatus"
            );

        const ordersContainer =
            document.getElementById(
                "customerOrdersContainer"
            );

        if(name){
            name.textContent =
                customer.full_name ||
                "No Name";
        }

        if(email){
            email.textContent =
                customer.email || "-";
        }

        if(phone){
            phone.textContent =
                customer.phone || "-";
        }

        if(joined){

            joined.textContent =
                customer.joined_at
                    ? new Date(
                        customer.joined_at
                    ).toLocaleString()
                    : "-";
        }

        if(orders){

            orders.textContent =
                Number(
                    customer.total_orders || 0
                ).toLocaleString();
        }

        if(spent){

            spent.textContent =
                "₦" +
                Number(
                    customer.total_spent || 0
                ).toLocaleString();
        }

        if(status){

            status.textContent =
                customer.is_active === false
                    ? "Inactive"
                    : "Active";
        }

        if(!ordersContainer){
            return;
        }

        const customerOrders =
            Array.isArray(customer.orders)
                ? customer.orders
                : [];

        if(customerOrders.length === 0){

            ordersContainer.innerHTML = `
                <div class="admin-empty">
                    No Orders Yet
                </div>
            `;

            return;
        }

        ordersContainer.innerHTML = "";

        customerOrders.forEach(function(order){

            const orderCard =
                document.createElement("div");

            orderCard.className =
                "admin-customer-order-card";

            const orderNumber =
                order.order_number ||
                order.id ||
                "Order";

            const orderDate =
                order.created_at
                    ? new Date(
                        order.created_at
                    ).toLocaleString()
                    : "-";

            const orderTotal =
                Number(
                    order.total_amount || 0
                );

            orderCard.innerHTML = `

                <h4>
                    ${orderNumber}
                </h4>

                <p>
                    Date:
                    ${orderDate}
                </p>

                <p>
                    Status:
                    ${order.status || "Pending"}
                </p>

                <p>
                    Total:
                    ₦${orderTotal.toLocaleString()}
                </p>
            `;

            orderCard.addEventListener(
                "click",
                function(){

                    localStorage.setItem(
                        "selectedAdminOrderId",
                        String(order.id)
                    );

                    window.location.href =
                        "admin-order-details.html";
                }
            );

            ordersContainer.appendChild(
                orderCard
            );

        });

    }catch(error){

        console.error(
            "Unable to load admin customer details:",
            error
        );

        alert(
            "Network error while loading customer details."
        );

    }

}


// ===========================================
// ADMIN CUSTOMER DETAILS STARTUP
// ===========================================

document.addEventListener("DOMContentLoaded", function(){

    if(
        window.location.pathname.endsWith(
            "admin-customer-details.html"
        )
    ){

        loadAdminCustomerDetails();

    }

});




// ===========================================
// LOAD ADMIN ORDER DETAILS
// ===========================================

async function loadAdminOrderDetails(){

    const selectedOrderId =
        localStorage.getItem(
            "selectedAdminOrderId"
        );

    if(!selectedOrderId){

        alert("No order selected.");

        window.location.href =
            "admin-orders.html";

        return;
    }

    try{

        const response =
            await fetch(
                API_BASE + "/api/admin/orders/" +
                encodeURIComponent(
                    selectedOrderId
                )
            );

        const data =
            await response.json();

        if(
            !response.ok ||
            !data.success ||
            !data.order
        ){

            alert(
                data.message ||
                "Unable to load order details."
            );

            return;
        }

        const selectedOrder =
            data.order;

        const orderStatus =
            selectedOrder.status ||
            "Pending";

        const orderId =
            document.getElementById(
                "adminOrderDetailsId"
            );

        const status =
            document.getElementById(
                "adminOrderDetailsStatus"
            );

        const date =
            document.getElementById(
                "adminOrderDetailsDate"
            );

        const total =
            document.getElementById(
                "adminOrderDetailsTotal"
            );

        const subtotal =
            document.getElementById(
                "adminOrderDetailsSubtotal"
            );

        const couponRow =
            document.getElementById(
                "adminOrderCouponRow"
            );

        const coupon =
            document.getElementById(
                "adminOrderDetailsCoupon"
            );

        const discountRow =
            document.getElementById(
                "adminOrderDiscountRow"
            );

        const discount =
            document.getElementById(
                "adminOrderDetailsDiscount"
            );

        const shippingState =
            document.getElementById(
                "adminOrderDetailsShippingState"
            );

        const shippingFee =
            document.getElementById(
                "adminOrderDetailsShippingFee"
            );


const paymentMethod =
    document.getElementById(
        "adminOrderDetailsPaymentMethod"
    );

const paymentStatus =
    document.getElementById(
        "adminOrderDetailsPaymentStatus"
    );


        const deliveryTimeRow =
            document.getElementById(
                "adminOrderDeliveryTimeRow"
            );

        const deliveryTime =
            document.getElementById(
                "adminOrderDetailsDeliveryTime"
            );

        const customerName =
            document.getElementById(
                "adminOrderCustomerName"
            );

        const customerEmail =
            document.getElementById(
                "adminOrderCustomerEmail"
            );

        const customerPhone =
            document.getElementById(
                "adminOrderCustomerPhone"
            );

        const customerAddress =
            document.getElementById(
                "adminOrderCustomerAddress"
            );

        const statusSelect =
            document.getElementById(
                "adminOrderStatusSelect"
            );

        const paymentStatusSelect =
            document.getElementById(
                "adminPaymentStatusSelect"
            );

        const itemsContainer =
            document.getElementById(
                "adminOrderItemsContainer"
            );

        if(orderId){

            orderId.textContent =
                selectedOrder.order_number ||
                selectedOrder.id ||
                "-";

        }

        if(status){

            status.textContent =
                orderStatus;

            status.className =
                "admin-order-status " +
                orderStatus
                    .toLowerCase()
                    .replace(/\s+/g, "-");

        }

        if(date){

            date.textContent =
                selectedOrder.created_at
                    ? new Date(
                        selectedOrder.created_at
                    ).toLocaleString()
                    : "-";

        }

        if(total){

            total.textContent =
                "₦" +
                Number(
                    selectedOrder.total_amount ||
                    0
                ).toLocaleString();

        }

        if(subtotal){

            subtotal.textContent =
                "₦" +
                Number(
                    selectedOrder.subtotal ||
                    0
                ).toLocaleString();

        }

        if(couponRow && coupon){

            if(selectedOrder.coupon_code){

                couponRow.style.display =
                    "flex";

                coupon.textContent =
                    selectedOrder.coupon_code;

            }else{

                couponRow.style.display =
                    "none";

            }

        }

        if(discountRow && discount){

            const discountValue =
                Number(
                    selectedOrder.discount_amount ||
                    0
                );

            if(discountValue > 0){

                discountRow.style.display =
                    "flex";

                discount.textContent =
                    "-₦" +
                    discountValue.toLocaleString();

            }else{

                discountRow.style.display =
                    "none";

            }

        }

        if(shippingState){

            shippingState.textContent =
                selectedOrder.shipping_state ||
                "-";

        }

        if(shippingFee){

            shippingFee.textContent =
                "₦" +
                Number(
                    selectedOrder.shipping_fee ||
                    0
                ).toLocaleString();

        }



if(paymentMethod){
    paymentMethod.textContent =
        selectedOrder.payment_method || "-";
}

if(paymentStatus){
    paymentStatus.textContent =
        selectedOrder.payment_status || "-";
}


        if(
            deliveryTimeRow &&
            deliveryTime
        ){

            if(
                selectedOrder
                    .estimated_delivery
            ){

                deliveryTimeRow.style.display =
                    "flex";

                deliveryTime.textContent =
                    String(
                        selectedOrder
                            .estimated_delivery
                    )
                    .replace(
                        /Estimated delivery:\s*/i,
                        ""
                    )
                    .trim();

            }else{

                deliveryTimeRow.style.display =
                    "none";

            }

        }

        if(customerName){

            customerName.textContent =
                selectedOrder.customer_name ||
                "-";

        }

        if(customerEmail){

            customerEmail.textContent =
                selectedOrder.customer_email ||
                "-";

        }

        if(customerPhone){

            customerPhone.textContent =
                selectedOrder.customer_phone ||
                "-";

        }

        if(customerAddress){

            customerAddress.textContent =
                selectedOrder.customer_address ||
                "-";

        }

        if(statusSelect){

            statusSelect.value =
                orderStatus;

        }

        if(paymentStatusSelect){

            paymentStatusSelect.value =
                selectedOrder.payment_status ||
                "Pending";

        }

        if(!itemsContainer){
            return;
        }

        const orderItems =
            Array.isArray(
                selectedOrder.items
            )
                ? selectedOrder.items
                : [];

        itemsContainer.innerHTML = "";

        if(orderItems.length === 0){

            itemsContainer.innerHTML = `
                <div class="admin-empty">
                    No Items Found
                </div>
            `;

            return;
        }

        orderItems.forEach(function(item){

            const itemCard =
                document.createElement(
                    "div"
                );

            itemCard.className =
                "admin-order-item-card";

            const itemName =
                item.product_name ||
                "Unknown Product";

            const itemQuantity =
                Number(
                    item.quantity || 1
                );

            const itemPrice =
                Number(
                    item.unit_price || 0
                );

            const itemSubtotal =
                Number(
                    item.subtotal ||
                    (
                        itemQuantity *
                        itemPrice
                    )
                );

            itemCard.innerHTML = `
                <div class="admin-order-item-info">

                    <strong>
                        ${itemName}
                    </strong>

                    <small>
                        ${itemQuantity} ×
                        ₦${itemPrice.toLocaleString()}
                    </small>

                </div>

                <strong>
                    ₦${itemSubtotal.toLocaleString()}
                </strong>
            `;

            itemsContainer.appendChild(
                itemCard
            );

        });

    }catch(error){

        console.error(
            "Unable to load admin order details:",
            error
        );

        alert(
            "Network error while loading order details."
        );

    }

}


// ===========================================
// UPDATE ADMIN ORDER STATUS FROM DETAILS
// ===========================================

async function updateAdminOrderStatus(){

    const selectedOrderId =
        localStorage.getItem(
            "selectedAdminOrderId"
        );

    const statusSelect =
        document.getElementById(
            "adminOrderStatusSelect"
        );

    if(
        !selectedOrderId ||
        !statusSelect
    ){
        return;
    }

    try{

        const response =
            await fetch(
                API_BASE + "/api/admin/orders/" +
                encodeURIComponent(
                    selectedOrderId
                ) +
                "/status",
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        status:
                            statusSelect.value
                    })
                }
            );

        const data =
            await response.json();

        if(
            !response.ok ||
            !data.success
        ){

            alert(
                data.message ||
                "Unable to update order status."
            );

            return;
        }

        alert(
            "Order status updated successfully."
        );

        loadAdminOrderDetails();

    }catch(error){

        console.error(
            "Unable to update order status:",
            error
        );

        alert(
            "Network error while updating order status."
        );

    }

}



// ===========================================
// ADMIN ORDER DETAILS PAGE
// ===========================================

document.addEventListener("DOMContentLoaded", function(){

    if(
        window.location.pathname.endsWith(
            "admin-order-details.html"
        )
    ){
        loadAdminOrderDetails();
    }

});



// ===========================================
// ADMIN ANALYTICS PAGE
// ===========================================

async function loadAdminAnalytics(){

    try{

        const [
            ordersResponse,
            customersResponse
        ] = await Promise.all([
            fetch(
                API_BASE + "/api/admin/orders"
            ),
            fetch(
                API_BASE + "/api/admin/customers"
            )
        ]);

        const ordersData =
            await ordersResponse.json();

        const customersData =
            await customersResponse.json();

        if(
            !ordersResponse.ok ||
            !ordersData.success
        ){
            throw new Error(
                ordersData.message ||
                "Unable to load orders analytics."
            );
        }

        if(
            !customersResponse.ok ||
            !customersData.success
        ){
            throw new Error(
                customersData.message ||
                "Unable to load customers analytics."
            );
        }

        const orders =
            Array.isArray(ordersData.orders)
                ? ordersData.orders
                : [];

        const customers =
            Array.isArray(customersData.customers)
                ? customersData.customers
                : [];

        const totalOrders =
            orders.length;

        const totalCustomers =
            customers.length;

        const totalSales =
            orders
                .filter(function(order){
                    return order.status !==
                        "Cancelled";
                })
                .reduce(function(sum, order){

                    return sum +
                        Number(
                            order.total_amount ||
                            order.total ||
                            0
                        );

                }, 0);

        const averageOrder =
            totalOrders > 0
                ? totalSales / totalOrders
                : 0;

        const pendingOrders =
            orders.filter(function(order){

                return String(
                    order.status || ""
                ).toLowerCase() ===
                    "pending";

            }).length;

        const processingOrders =
            orders.filter(function(order){

                return String(
                    order.status || ""
                ).toLowerCase() ===
                    "processing";

            }).length;

        const outForDeliveryOrders =
            orders.filter(function(order){

                return String(
                    order.status || ""
                ).toLowerCase() ===
                    "out for delivery";

            }).length;

        const deliveredOrders =
            orders.filter(function(order){

                return String(
                    order.status || ""
                ).toLowerCase() ===
                    "delivered";

            }).length;

        const cancelledOrders =
            orders.filter(function(order){

                return String(
                    order.status || ""
                ).toLowerCase() ===
                    "cancelled";

            }).length;

        const totalSalesElement =
            document.getElementById(
                "analyticsTotalSales"
            );

        const totalOrdersElement =
            document.getElementById(
                "analyticsTotalOrders"
            );

        const totalCustomersElement =
            document.getElementById(
                "analyticsTotalCustomers"
            );

        const averageOrderElement =
            document.getElementById(
                "analyticsAverageOrder"
            );

        if(totalSalesElement){

            totalSalesElement.textContent =
                "₦" +
                totalSales.toLocaleString();

        }

        if(totalOrdersElement){

            totalOrdersElement.textContent =
                totalOrders;

        }

        if(totalCustomersElement){

            totalCustomersElement.textContent =
                totalCustomers;

        }

        if(averageOrderElement){

            averageOrderElement.textContent =
                "₦" +
                Math.round(
                    averageOrder
                ).toLocaleString();

        }

        const statusValues = {

            analyticsPendingOrders:
                pendingOrders,

            analyticsProcessingOrders:
                processingOrders,

            analyticsOutForDeliveryOrders:
                outForDeliveryOrders,

            analyticsDeliveredOrders:
                deliveredOrders,

            analyticsCancelledOrders:
                cancelledOrders

        };

        Object.entries(
            statusValues
        ).forEach(function(entry){

            const id =
                entry[0];

            const value =
                entry[1];

            const element =
                document.getElementById(id);

            if(element){
                element.textContent =
                    value;
            }

        });

        const productSales = {};

        orders.forEach(function(order){

            const items =
                Array.isArray(order.items)
                    ? order.items
                    : [];

            items.forEach(function(item){

                const productName =
                    item.product_name ||
                    item.product ||
                    item.name ||
                    "Unknown Product";

                const quantity =
                    Number(
                        item.quantity || 1
                    );

                if(
                    !productSales[
                        productName
                    ]
                ){
                    productSales[
                        productName
                    ] = 0;
                }

                productSales[
                    productName
                ] += quantity;

            });

        });

        const topProducts =
            Object.entries(
                productSales
            )
            .sort(function(a, b){
                return b[1] - a[1];
            })
            .slice(0, 5);

        const topProductsContainer =
            document.getElementById(
                "analyticsTopProducts"
            );

        if(topProductsContainer){

            topProductsContainer.innerHTML =
                "";

            if(
                topProducts.length === 0
            ){

                topProductsContainer.innerHTML = `
                    <p class="admin-empty-message">
                        No sales data yet.
                    </p>
                `;

            }else{

                topProducts.forEach(
                    function(entry, index){

                        const productName =
                            entry[0];

                        const quantity =
                            entry[1];

                        const card =
                            document.createElement(
                                "article"
                            );

                        card.className =
                            "admin-top-product-card";

                        card.innerHTML = `
                            <div>
                                <strong>
                                    ${index + 1}. ${productName}
                                </strong>

                                <p>
                                    Quantity sold
                                </p>
                            </div>

                            <strong>
                                ${quantity}
                            </strong>
                        `;

                        topProductsContainer
                            .appendChild(card);

                    }
                );

            }

        }

    }catch(error){

        console.error(
            "LOAD ADMIN ANALYTICS ERROR:",
            error
        );

    }

}



// ===========================================
// ADMIN ANALYTICS PAGE STARTUP
// ===========================================

document.addEventListener(
    "DOMContentLoaded",
    function(){

        if(
            window.location.pathname.endsWith(
                "admin-analytics.html"
            )
        ){
            loadAdminAnalytics();
        }

    }
);





// ===========================================
// LOAD ADMIN PRODUCT FORM
// ===========================================

async function loadAdminProductForm(){

    const form =
        document.getElementById(
            "adminProductForm"
        );

    if(!form){
        return;
    }

    const selectedProductId =
        localStorage.getItem(
            "selectedAdminProductId"
        );

    const title =
        document.getElementById(
            "adminProductFormTitle"
        );

    if(!selectedProductId){

        if(title){
            title.textContent =
                "Add Product";
        }

        return;
    }

    if(title){
        title.textContent =
            "Edit Product";
    }

    try{

        const response =
            await fetch(
                API_BASE + "/api/admin/products/" +
                encodeURIComponent(
                    selectedProductId
                )
            );

        const data =
            await response.json();

        if(
            !response.ok ||
            !data.success ||
            !data.product
        ){

            alert(
                data.message ||
                "Unable to load product."
            );

            return;
        }

        const product =
            data.product;

        document.getElementById(
            "adminProductId"
        ).value =
            product.frontend_id ||
            product.id ||
            "";

        document.getElementById(
            "adminProductName"
        ).value =
            product.product_name ||
            "";

        document.getElementById(
            "adminProductCategory"
        ).value =
            product.product_group ||
            product.category ||
            "";

        document.getElementById(
            "adminProductBrand"
        ).value =
            product.brand ||
            "";

        document.getElementById(
            "adminProductImage"
        ).value =
            product.image_url ||
            "";

        document.getElementById(
            "adminProductRetailPrice"
        ).value =
            product.retail_price ||
            "";

        document.getElementById(
            "adminProductWholesalePrice"
        ).value =
            product.wholesale_price ||
            "";

        document.getElementById(
            "adminProductBulkPrice"
        ).value =
            product.bulk_price ||
            "";

        document.getElementById(
            "adminProductStock"
        ).value =
            product.stock_quantity ||
            0;

        const reorderInput =
            document.getElementById(
                "adminProductReorderLevel"
            );

        if(reorderInput){
            reorderInput.value =
                product.reorder_level || 0;
        }

        document.getElementById(
            "adminProductDescription"
        ).value =
            product.description ||
            "";

    }catch(error){

        console.error(
            "Failed to load product form:",
            error
        );

        alert(
            "Network error while loading product."
        );

    }

}


// ===========================================
// SAVE ADMIN PRODUCT
// ===========================================

async function saveAdminProduct(event){

    event.preventDefault();

    const selectedProductId =
        localStorage.getItem(
            "selectedAdminProductId"
        );

    const productId =
        document.getElementById(
            "adminProductId"
        ).value;

    const product = {

        id:
            productId ||
            undefined,

        name:
            document.getElementById(
                "adminProductName"
            ).value.trim(),

        category:
            document.getElementById(
                "adminProductCategory"
            ).value.trim(),

        group:
            document.getElementById(
                "adminProductCategory"
            ).value.trim(),

        brand:
            document.getElementById(
                "adminProductBrand"
            ).value.trim(),

        image:
            document.getElementById(
                "adminProductImage"
            ).value.trim(),

        price:
            Number(
                document.getElementById(
                    "adminProductRetailPrice"
                ).value
            ),

        retailPrice:
            Number(
                document.getElementById(
                    "adminProductRetailPrice"
                ).value
            ),

        wholesalePrice:
            Number(
                document.getElementById(
                    "adminProductWholesalePrice"
                ).value || 0
            ),

        bulkPrice:
            Number(
                document.getElementById(
                    "adminProductBulkPrice"
                ).value || 0
            ),

        stock:
            Number(
                document.getElementById(
                    "adminProductStock"
                ).value || 0
            ),

        reorderLevel:
            Number(
                document.getElementById(
                    "adminProductReorderLevel"
                ).value || 0
            ),

        description:
            document.getElementById(
                "adminProductDescription"
            ).value.trim()

    };

    const isEdit =
        Boolean(selectedProductId);

    const endpoint =
        isEdit
            ? (
                API_BASE + "/api/admin/products/" +
                encodeURIComponent(
                    selectedProductId
                )
            )
            : API_BASE + "/api/admin/products";

    const method =
        isEdit
            ? "PUT"
            : "POST";

    try{

        const response =
            await fetch(
                endpoint,
                {
                    method: method,

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(product)
                }
            );

        const data =
            await response.json();

        if(
            !response.ok ||
            !data.success
        ){

            alert(
                data.message ||
                "Unable to save product."
            );

            return;
        }

        localStorage.removeItem(
            "selectedAdminProductId"
        );

        alert(
            isEdit
                ? "Product updated successfully."
                : "Product added successfully."
        );

        window.location.href =
            "admin-products.html";

    }catch(error){

        console.error(
            "Failed to save product:",
            error
        );

        alert(
            "Network error while saving product."
        );

    }

}



// ===========================================
// ADMIN PRODUCT FORM PAGE STARTUP
// ===========================================

document.addEventListener(
    "DOMContentLoaded",
    function(){

        if(
            window.location.pathname.endsWith(
                "admin-product-form.html"
            )
        ){
            loadAdminProductForm();
        }

    }
);




// ===========================================
// LOAD ADMIN PRODUCT DETAILS
// ===========================================


function loadAdminProductDetails(){

    const selectedProductId =
        localStorage.getItem(
            "selectedAdminProductId"
        );

    if(!selectedProductId){
        alert("No product selected.");
        window.location.href =
            "admin-products.html";
        return;
    }

    fetch(
        API_BASE + "/api/admin/products/" +
        encodeURIComponent(selectedProductId)
    )
    .then(function(response){

        return response.json().then(function(data){

            if(!response.ok){
                throw new Error(
                    data.message ||
                    "Failed to load product."
                );
            }

            return data;

        });

    })
    .then(function(data){

        if(!data.success || !data.product){
            throw new Error(
                "Product details were not found."
            );
        }

        const product = data.product;

        const image =
            document.getElementById(
                "adminDetailsImage"
            );

        const name =
            document.getElementById(
                "adminDetailsName"
            );

        const category =
            document.getElementById(
                "adminDetailsCategory"
            );

        const brand =
            document.getElementById(
                "adminDetailsBrand"
            );

        const retailPrice =
            document.getElementById(
                "adminDetailsRetailPrice"
            );

        const wholesalePrice =
            document.getElementById(
                "adminDetailsWholesalePrice"
            );

        const bulkPrice =
            document.getElementById(
                "adminDetailsBulkPrice"
            );

        const stock =
            document.getElementById(
                "adminDetailsStock"
            );

        const reorderLevel =
            document.getElementById(
                "adminDetailsReorderLevel"
            );

        const stockStatus =
            document.getElementById(
                "adminDetailsStockStatus"
            );

        const description =
            document.getElementById(
                "adminDetailsDescription"
            );

        if(image){
            image.src =
                product.image_url ||
                "images/product-placeholder.png";

            image.alt =
                product.product_name ||
                "Product";
        }

        if(name){
            name.textContent =
                product.product_name ||
                "Product";
        }

        if(category){
            category.textContent =
                product.product_group ||
                product.category ||
                "General";
        }

        if(brand){
            brand.textContent =
                product.brand || "-";
        }

        if(retailPrice){
            retailPrice.textContent =
                Number(
                    product.retail_price || 0
                ).toLocaleString();
        }

        if(wholesalePrice){
            wholesalePrice.textContent =
                Number(
                    product.wholesale_price || 0
                ).toLocaleString();
        }

        if(bulkPrice){
            bulkPrice.textContent =
                Number(
                    product.bulk_price || 0
                ).toLocaleString();
        }

        if(stock){
            stock.textContent =
                Number(
                    product.stock_quantity || 0
                ).toLocaleString();
        }

        if(reorderLevel){
            reorderLevel.textContent =
                Number(
                    product.reorder_level || 0
                ).toLocaleString();
        }

        if(stockStatus){

            const quantity =
                Number(
                    product.stock_quantity || 0
                );

            const alertLevel =
                Number(
                    product.reorder_level || 0
                );

            const status =
                quantity <= 0
                    ? "Out of Stock"
                    : (
                        alertLevel > 0 &&
                        quantity <= alertLevel
                            ? "Low Stock"
                            : "In Stock"
                    );

            stockStatus.textContent =
                status;

            stockStatus.className =
                "admin-stock-status-badge " +
                status
                    .toLowerCase()
                    .replace(/\s+/g, "-");
        }

        const variants =
            Array.isArray(data.variants)
                ? data.variants
                : [];

        const variantsSection =
            document.getElementById(
                "adminProductVariantsSection"
            );

        const variantsList =
            document.getElementById(
                "adminProductVariantsList"
            );

        if(variantsSection && variantsList){

            variantsList.innerHTML = "";

            if(variants.length === 0){

                variantsSection.style.display =
                    "none";

            }else{

                variantsSection.style.display =
                    "block";

                variants.forEach(
                    function(variant){

                        const row =
                            document.createElement(
                                "div"
                            );

                        row.className =
                            "admin-variant-stock-row";

                        const quantity =
                            Number(
                                variant.stock_quantity || 0
                            );

                        const status =
                            quantity <= 0
                                ? "Out of Stock"
                                : "In Stock";

                        row.innerHTML = `
                            <div>
                                <strong>
                                    ${
                                        variant.variant_name ||
                                        variant.sku ||
                                        "Variant"
                                    }
                                </strong>

                                <small>
                                    ${
                                        variant.sku ||
                                        ""
                                    }
                                </small>
                            </div>

                            <div
                                class="admin-variant-stock-quantity"
                            >
                                Qty:
                                <strong>
                                    ${quantity}
                                </strong>
                            </div>

                            <span
                                class="admin-stock-status-badge ${
                                    status
                                        .toLowerCase()
                                        .replace(/\s+/g, "-")
                                }"
                            >
                                ${status}
                            </span>
                        `;

                        variantsList.appendChild(
                            row
                        );

                    }
                );

            }

        }

        if(description){
            description.textContent =
                product.description ||
                "No description available.";
        }

    })
    .catch(function(error){

        console.error(
            "Admin product details error:",
            error
        );

        alert(
            error.message ||
            "Unable to load product details."
        );

    });

}



// ===========================================
// EDIT CURRENT ADMIN PRODUCT
// ===========================================

function editCurrentAdminProduct(){

    const selectedProductId =
        localStorage.getItem(
            "selectedAdminProductId"
        );

    if(!selectedProductId){
        return;
    }

    window.location.href =
        "admin-product-form.html";

}


// ===========================================
// DELETE CURRENT ADMIN PRODUCT
// ===========================================


async function deleteCurrentAdminProduct(){

    const selectedProductId =
        localStorage.getItem(
            "selectedAdminProductId"
        );

    if(!selectedProductId){
        return;
    }

    const deleted =
        await deleteAdminProduct(
            selectedProductId
        );

    if(!deleted){
        return;
    }

    localStorage.removeItem(
        "selectedAdminProductId"
    );

    window.location.href =
        "admin-products.html";

}


// ===========================================
// ADMIN PRODUCT DETAILS PAGE STARTUP
// ===========================================

document.addEventListener(
    "DOMContentLoaded",
    function(){

        if(
            window.location.pathname.endsWith(
                "admin-product-details.html"
            )
        ){
            loadAdminProductDetails();
        }

    }
);


// ===========================================
// ADMIN GENERAL NOTIFICATION BELL
// ===========================================

function isAdminPage(){

    return (
        window.location.pathname.includes("admin-")
    );

}

function ensureAdminNotificationBell(){

    if(!isAdminPage()){
        return;
    }

    const header =
        document.querySelector(".top-header");

    if(!header){
        return;
    }

    if(
        document.getElementById(
            "adminGeneralNotificationBell"
        )
    ){
        return;
    }

    const button =
        document.createElement("button");

    button.type = "button";
    button.id =
        "adminGeneralNotificationBell";

    button.className =
        "admin-general-bell";

    button.setAttribute(
        "aria-label",
        "Admin notifications"
    );

    button.innerHTML = `
        <span
            class="admin-general-bell-icon"
            aria-hidden="true"
        >
            🔔
        </span>

        <span
            id="adminGeneralBellBadge"
            class="admin-general-bell-badge"
            hidden
        >
            0
        </span>
    `;

    button.addEventListener(
        "click",
        async function(){

            try{

                await fetch(
                    API_BASE +
                    "/api/admin/notifications/read-all",
                    {
                        method: "PATCH",
                        headers: getAuthHeaders()
                    }
                );

            }catch(error){

                console.error(
                    "ADMIN BELL READ ERROR:",
                    error
                );

            }

            window.location.href =
                "admin-notifications.html";

        }
    );

    header.appendChild(button);

    updateAdminGeneralBell();

}

async function updateAdminGeneralBell(){

    const badge =
        document.getElementById(
            "adminGeneralBellBadge"
        );

    if(!badge){
        return;
    }

    try{

        const response =
            await fetch(
                API_BASE +
                "/api/admin/notifications",
                {
                    headers: getAuthHeaders()
                }
            );

        const data =
            await response.json();

        if(
            !response.ok ||
            !data.success
        ){
            return;
        }

        const count =
            Number(data.unreadCount || 0);

        badge.textContent =
            count > 99
                ? "99+"
                : String(count);

        badge.hidden =
            count <= 0;

    }catch(error){

        console.error(
            "ADMIN GENERAL BELL ERROR:",
            error
        );

    }

}

document.addEventListener(
    "DOMContentLoaded",
    function(){

        if(!isAdminPage()){
            return;
        }

        ensureAdminNotificationBell();

        window.setInterval(
            updateAdminGeneralBell,
            30000
        );

    }
);

window.addEventListener(
    "pageshow",
    function(){

        if(isAdminPage()){
            updateAdminGeneralBell();
        }

    }
);


// ===========================================
// LOAD ADMIN NOTIFICATIONS
// ===========================================



async function loadAdminNotifications(){

    const container =
        document.getElementById(
            "adminNotificationsContainer"
        );

    if(!container){
        return;
    }

    try{

        const response =
            await fetch(
                API_BASE + "/api/admin/notifications",
                {
                    headers: getAuthHeaders()
                }
            );

        const data =
            await response.json();

        if(
            !response.ok ||
            !data.success
        ){

            container.innerHTML = `
                <div class="admin-empty">
                    <p>Unable to load notifications.</p>
                </div>
            `;

            return;
        }

        const notifications =
            Array.isArray(data.notifications)
                ? data.notifications
                : [];

        container.innerHTML = "";

        if(notifications.length === 0){

            container.innerHTML = `
                <div class="admin-empty">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications yet.</p>
                </div>
            `;

            return;
        }

        notifications.forEach(
            function(notification){

                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "admin-notification-card";

                const date =
                    notification.created_at
                        ? new Date(
                            notification.created_at
                        ).toLocaleString()
                        : "";

                card.innerHTML = `
                    <h4>
                        ${notification.title || "Notification"}
                    </h4>

                    <p>
                        ${notification.message || ""}
                    </p>

                    <small>
                        ${date}
                    </small>
                `;

                container.appendChild(card);

            }
        );

    }catch(error){

        console.error(
            "LOAD ADMIN NOTIFICATIONS ERROR:",
            error
        );

        container.innerHTML = `
            <div class="admin-empty">
                <p>Network error.</p>
            </div>
        `;

    }

}



// ===========================================
// CLEAR ADMIN NOTIFICATIONS
// ===========================================


async function clearAdminNotifications(){

    const confirmClear =
        confirm(
            "Clear all notifications?"
        );

    if(!confirmClear){
        return;
    }

    try{

        const response =
            await fetch(
                API_BASE + "/api/admin/notifications",
                {
                    method: "DELETE",
                    headers: getAuthHeaders()
                }
            );

        const data =
            await response.json();

        if(
            !response.ok ||
            !data.success
        ){

            alert(
                data.message ||
                "Unable to clear notifications."
            );

            return;
        }

        alert(
            data.message ||
            "Notifications cleared successfully."
        );

        loadAdminNotifications();

    }catch(error){

        console.error(
            "CLEAR ADMIN NOTIFICATIONS ERROR:",
            error
        );

        alert(
            "Network error while clearing notifications."
        );

    }

}


// ===========================================
// ADMIN NOTIFICATIONS PAGE STARTUP
// ===========================================

document.addEventListener(
    "DOMContentLoaded",
    function(){

        if(
            window.location.pathname.endsWith(
                "admin-notifications.html"
            )
        ){
            loadAdminNotifications();
        }

    }
);




// ===========================================
// LOAD ADMIN SETTINGS
// ===========================================

async function loadAdminSettings(){

    try{

        const response =
            await fetch(
                API_BASE + "/api/admin/settings"
            );

        const data =
            await response.json();

        if(
            !response.ok ||
            !data.success ||
            !data.settings
        ){

            alert(
                data.message ||
                "Unable to load settings."
            );

            return;
        }

        const settings =
            data.settings;

        const values = {
            storeName:
                settings.store_name || "",

            storePhone:
                settings.store_phone || "",

            storeWhatsapp:
                settings.store_whatsapp || "",

            storeEmail:
                settings.store_email || "",

            storeAddress:
                settings.store_address || "",

            storeCurrency:
                settings.store_currency || "₦",

            deliveryFee:
                settings.delivery_fee || 0,

            businessHours:
                settings.business_hours || ""
        };

        Object.entries(values).forEach(
            function(entry){

                const id =
                    entry[0];

                const value =
                    entry[1];

                const input =
                    document.getElementById(id);

                if(input){
                    input.value = value;
                }

            }
        );

    }catch(error){

        console.error(
            "LOAD ADMIN SETTINGS ERROR:",
            error
        );

        alert(
            "Network error while loading settings."
        );

    }

}


// ===========================================
// SAVE ADMIN SETTINGS
// ===========================================


async function saveAdminSettings(event){

    event.preventDefault();

    const settings = {

        storeName:
            document.getElementById(
                "storeName"
            ).value.trim(),

        storePhone:
            document.getElementById(
                "storePhone"
            ).value.trim(),

        storeWhatsapp:
            document.getElementById(
                "storeWhatsapp"
            ).value.trim(),

        storeEmail:
            document.getElementById(
                "storeEmail"
            ).value.trim(),

        storeAddress:
            document.getElementById(
                "storeAddress"
            ).value.trim(),

        storeCurrency:
            document.getElementById(
                "storeCurrency"
            ).value.trim() || "₦",

        deliveryFee:
            Number(
                document.getElementById(
                    "deliveryFee"
                ).value || 0
            ),

        businessHours:
            document.getElementById(
                "businessHours"
            ).value.trim()

    };

    try{

        const response =
            await fetch(
                API_BASE + "/api/admin/settings",
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(settings)
                }
            );

        const data =
            await response.json();

        if(
            !response.ok ||
            !data.success
        ){

            alert(
                data.message ||
                "Unable to save settings."
            );

            return;
        }

        alert(
            data.message ||
            "Settings saved successfully."
        );

        loadAdminSettings();

    }catch(error){

        console.error(
            "SAVE ADMIN SETTINGS ERROR:",
            error
        );

        alert(
            "Network error while saving settings."
        );

    }

}



// ===========================================
// ADMIN SETTINGS PAGE STARTUP
// ===========================================

document.addEventListener(
    "DOMContentLoaded",
    function(){

        if(
            window.location.pathname.endsWith(
                "admin-settings.html"
            )
        ){
            loadAdminSettings();
        }

    }
);




// ===========================================
// LOAD DELIVERY ADDRESS
// ===========================================

function loadDeliveryAddress(){

    const profile = JSON.parse(
        localStorage.getItem("jgglProfile")
    ) || {};

    const fields = {
        addressRecipientName:
            "Recipient Name: " +
           (profile.fullName || "Not set"),

        addressPhoneNumber:
            "Phone Number: " +
            (profile.phone || "Not set"),

        addressStreet:
            "Street Address: " +
            (profile.address || "Not set"),

        addressLga:
            "LGA: " +
            (profile.lga || "Not set"),

        addressState:
            "State: " +
            (profile.state || "Not set"),

        addressCountry:
            "Country: " +
            (profile.country || "Not set")
    };

    Object.entries(fields).forEach(
        function([id, text]){

            const element =
                document.getElementById(id);

            if(element){
                element.textContent = text;
            }

        }
    );

}


// ===========================================
// DELIVERY ADDRESS PAGE STARTUP
// ===========================================

document.addEventListener(
    "DOMContentLoaded",
    function(){

        if(
            window.location.pathname.endsWith(
                "address.html"
            )
        ){


if(!checkLogin()){
    return;
}

loadDeliveryAddress();

        }

    }
);



// ===========================================
// TOGGLE CUSTOMER DARK MODE
// ===========================================

function toggleDarkMode(){

    const isDarkMode =
        document.body.classList.toggle(
            "customer-dark-mode"
        );

    localStorage.setItem(
        "jgglDarkMode",
        isDarkMode ? "true" : "false"
    );

}


// ===========================================
// LOAD CUSTOMER DARK MODE
// ===========================================

function loadCustomerDarkMode(){

    const savedDarkMode =
        localStorage.getItem(
            "jgglDarkMode"
        );

    if(savedDarkMode === "true"){

        document.body.classList.add(
            "customer-dark-mode"
        );

    }

}


// ===========================================
// OPEN PRIVACY SETTINGS
// ===========================================


function openPrivacySettings(){

    window.location.href =
        "privacy-security.html";

}


// ===========================================
// OPEN ABOUT JGGL-STORE
// ===========================================


function openAboutJGGLStore(){

    window.location.href =
        "about-jggl-store.html";

}


// ===========================================
// CUSTOMER SETTINGS STARTUP
// ===========================================

document.addEventListener(
    "DOMContentLoaded",
    function(){

        loadCustomerDarkMode();

    }
);


// ===========================================
// CHANGE CUSTOMER LANGUAGE
// ===========================================

function changeCustomerLanguage(){

    const currentLanguage =
        localStorage.getItem(
            "jgglLanguage"
        ) || "English";

    const newLanguage =
        currentLanguage === "English"
            ? "Hausa"
            : "English";

    localStorage.setItem(
        "jgglLanguage",
        newLanguage
    );

    alert(
        "Language changed to " +
        newLanguage
    );

}



// ===========================================
// OPEN CHANGE PASSWORD
// ===========================================

function openChangePassword(){

    window.location.href =
        "change-password.html";

}



// ===========================================
// CHANGE CUSTOMER PASSWORD
// ===========================================

async function changePassword(event){

    event.preventDefault();

    const currentPasswordInput =
        document.getElementById(
            "currentPassword"
        );

    const newPasswordInput =
        document.getElementById(
            "newPassword"
        );

    const confirmPasswordInput =
        document.getElementById(
            "confirmPassword"
        );

    if(
        !currentPasswordInput ||
        !newPasswordInput ||
        !confirmPasswordInput
    ){
        alert(
            "Password form is not complete."
        );
        return;
    }

    const currentPassword =
        currentPasswordInput.value;

    const newPassword =
        newPasswordInput.value;

    const confirmPassword =
        confirmPasswordInput.value;

    if(
        !currentPassword ||
        !newPassword ||
        !confirmPassword
    ){
        alert(
            "Please complete all password fields."
        );
        return;
    }

    if(newPassword.length < 6){

        alert(
            "New password must be at least 6 characters."
        );

        return;
    }

    if(newPassword !== confirmPassword){

        alert(
            "New password and confirmation do not match."
        );

        return;
    }

    if(newPassword === currentPassword){

        alert(
            "New password must be different from the current password."
        );

        return;
    }

    try{

        const response =
            await fetch(
                API_BASE + "/api/account/password",
                {
                    method: "PUT",
                    headers:
                        getAuthHeaders(),

                    body: JSON.stringify({
                        currentPassword:
                            currentPassword,
                        newPassword:
                            newPassword
                    })
                }
            );

        const data =
            await response.json();

        if(
            response.status === 401 ||
            response.status === 403
        ){

            localStorage.removeItem(
                "jgglLoggedIn"
            );

            localStorage.removeItem(
                "jgglAuthToken"
            );

            localStorage.removeItem(
                "jgglUser"
            );

            alert(
                data.message ||
                "Your session has expired. Please login again."
            );

            window.location.href =
                "login.html";

            return;
        }

        if(
            !response.ok ||
            !data.success
        ){

            alert(
                data.message ||
                "Unable to change password."
            );

            return;
        }

        currentPasswordInput.value = "";
        newPasswordInput.value = "";
        confirmPasswordInput.value = "";

        alert(
            data.message ||
            "Password changed successfully."
        );

        window.location.href =
            "login-security.html";

    }catch(error){

        console.error(
            "CHANGE PASSWORD ERROR:",
            error
        );

        alert(
            "Network error while changing password."
        );
    }
}


// ===========================================
// OPEN PRIVACY POLICY
// ===========================================

function openPrivacyPolicy(){

    window.location.href =
        "privacy-policy.html";

}



// ===========================================
// OPEN TERMS & CONDITIONS
// ===========================================

function openTermsConditions(){

    window.location.href =
        "terms-conditions.html";

}


// ===========================================
// LOGIN & DEVICE SECURITY
// ===========================================

function openLoginSecurity(){

    window.location.href =
        "login-security.html";

}

function loadLoginSecurity(){

    const user =
        JSON.parse(
            localStorage.getItem("jgglUser")
        ) || {};

    const name =
        document.getElementById(
            "securityUserName"
        );

    const email =
        document.getElementById(
            "securityUserEmail"
        );

    const phone =
        document.getElementById(
            "securityUserPhone"
        );

    if(name){
        name.textContent =
            user.full_name ||
            user.name ||
            "-";
    }

    if(email){
        email.textContent =
            user.email || "-";
    }

    if(phone){
        phone.textContent =
            user.phone || "-";
    }

}

function logoutAllCustomerSessions(){

    if(
        !confirm(
            "Logout from this device?"
        )
    ){
        return;
    }


localStorage.removeItem(
    "jgglLoggedIn"
);

localStorage.removeItem(
    "jgglAuthToken"
);

localStorage.removeItem(
    "jgglUser"
);


    alert(
        "You have been logged out."
    );

    window.location.href =
        "login.html?view=auth-flow-2";

}

document.addEventListener(
    "DOMContentLoaded",
    function(){

        if(
            window.location.pathname.endsWith(
                "login-security.html"
            )
        ){

            loadLoginSecurity();

        }

    }
);




// ===========================================
// DELETE CUSTOMER ACCOUNT
// ===========================================

function deleteCustomerAccount(){

    const confirmDelete = confirm(
        "Are you sure you want to permanently delete your account?"
    );

    if(!confirmDelete){
        return;
    }

    const finalConfirm = confirm(
        "This action cannot be undone. Continue?"
    );

    if(!finalConfirm){
        return;
    }

    localStorage.removeItem("jgglUser");
    localStorage.removeItem("jgglProfile");
    localStorage.removeItem("jgglLoggedIn");
localStorage.removeItem("jgglAuthToken");    alert(

 "Your account has been deleted successfully."
    );

    window.location.href = "index.html";

}




// ===========================================
// LANGUAGE
// ===========================================

function changeCustomerLanguage(){

    window.location.href =
        "language.html";

}

function selectCustomerLanguage(language){

    localStorage.setItem(
        "jgglLanguage",
        language
    );

    updateSelectedLanguage();

    alert(
        language + " language selected."
    );

}

function updateSelectedLanguage(){

    const language =
        localStorage.getItem(
            "jgglLanguage"
        ) || "English";

    const english =
        document.getElementById(
            "englishLanguageCheck"
        );

    const hausa =
        document.getElementById(
            "hausaLanguageCheck"
        );

    if(english){
        english.style.visibility =
            language === "English"
            ? "visible"
            : "hidden";
    }

    if(hausa){
        hausa.style.visibility =
            language === "Hausa"
            ? "visible"
            : "hidden";
    }

}

document.addEventListener(
    "DOMContentLoaded",
    function(){

        if(
            window.location.pathname.endsWith(
                "language.html"
            )
        ){

            updateSelectedLanguage();

        }

    }
);






// ===========================================
// COPY PAYMENT ACCOUNT NUMBER
// ===========================================

async function copyPaymentAccount(accountNumber){

    try{

        await navigator.clipboard.writeText(
            String(accountNumber)
        );

        if(typeof showToast === "function"){
            showToast("Account number copied.");
        }else{
            alert("Account number copied.");
        }

    }catch(error){

        alert(
            "Account Number: " +
            accountNumber
        );

    }

}



// ===========================================
// BANK TRANSFER DETAILS VISIBILITY
// ===========================================

function updateBankTransferDetails(){

    const selected =
        document.querySelector(
            'input[name="paymentMethod"]:checked'
        );

    const details =
        document.getElementById(
            "bankTransferDetails"
        );

    if(!details){
        return;
    }

    if(
        selected &&
        selected.value === "Bank Transfer"
    ){
        details.classList.add("active");
    }else{
        details.classList.remove("active");
    }
}


document.addEventListener(
    "DOMContentLoaded",
    function(){

        const paymentInputs =
            document.querySelectorAll(
                'input[name="paymentMethod"]'
            );

        paymentInputs.forEach(function(input){

            input.addEventListener(
                "change",
                updateBankTransferDetails
            );

        });

        updateBankTransferDetails();

    }
);



// ===========================================
// UPDATE ADMIN PAYMENT STATUS
// ===========================================

async function updateAdminPaymentStatus(){

    const selectedOrderId =
        localStorage.getItem(
            "selectedAdminOrderId"
        );

    const paymentStatusSelect =
        document.getElementById(
            "adminPaymentStatusSelect"
        );

    if(
        !selectedOrderId ||
        !paymentStatusSelect
    ){
        return;
    }

    try{

        const response =
            await fetch(
                API_BASE + "/api/admin/orders/" +
                encodeURIComponent(
                    selectedOrderId
                ) +
                "/payment-status",
                {
                    method: "PUT",

                    headers:
                        getAuthHeaders(),

                    body: JSON.stringify({
                        paymentStatus:
                            paymentStatusSelect.value
                    })
                }
            );

        const data =
            await response.json();

        if(
            !response.ok ||
            !data.success
        ){
            alert(
                data.message ||
                "Unable to update payment status."
            );
            return;
        }

        alert(
            "Payment status updated successfully."
        );

        loadAdminOrderDetails();

    }catch(error){

        console.error(
            "UPDATE PAYMENT STATUS ERROR:",
            error
        );

        alert(
            "Network error while updating payment status."
        );
    }

}



// ===========================================

// ADMIN GLOBAL BOTTOM NAVIGATION
// ===========================================

function buildAdminNavigation(){

    const page =
        window.location.pathname
            .split("/")
            .pop() || "";

    if(
        !page.startsWith("admin-") ||
        !page.endsWith(".html")
    ){
        return;
    }

    if(
        document.getElementById(
            "jgglAdminBottomNav"
        )
    ){
        return;
    }

    let activePage = page;

    if(page === "admin-order-details.html"){
        activePage = "admin-orders.html";
    }

    if(
        page === "admin-product-details.html" ||
        page === "admin-product-form.html"
    ){
        activePage = "admin-products.html";
    }

    if(page === "admin-customer-details.html"){
        activePage = "admin-customers.html";
    }

    const morePages = [
        "admin-notifications.html",
        "admin-analytics.html",
        "admin-settings.html"
    ];

    const nav =
        document.createElement("nav");

    nav.id = "jgglAdminBottomNav";
    nav.className = "admin-global-bottom-nav";

    nav.setAttribute(
        "aria-label",
        "Admin navigation"
    );

    const navItems = [
        {
            href: "admin-dashboard.html",
            icon: "fa-house",
            label: "Dashboard"
        },
        {
            href: "admin-orders.html",
            icon: "fa-bag-shopping",
            label: "Orders"
        },
        {
            href: "admin-products.html",
            icon: "fa-box",
            label: "Products"
        },
        {
            href: "admin-customers.html",
            icon: "fa-users",
            label: "Customers"
        }
    ];

    navItems.forEach(function(item){

        const link =
            document.createElement("a");

        link.href = item.href;
        link.className =
            "admin-global-nav-item";

        if(activePage === item.href){
            link.classList.add("active");
        }

        link.innerHTML = `
            <i class="fas ${item.icon}"></i>
            <span>${item.label}</span>
        `;

        nav.appendChild(link);

    });


    // MORE BUTTON
    const moreButton =
        document.createElement("button");

    moreButton.type = "button";

    moreButton.className =
        "admin-global-nav-item admin-more-btn";

    if(morePages.includes(activePage)){
        moreButton.classList.add("active");
    }

    moreButton.innerHTML = `
        <i class="fas fa-ellipsis"></i>
        <span>More</span>
    `;

    nav.appendChild(moreButton);


    // MORE MENU
    const menu =
        document.createElement("div");

    menu.id = "jgglAdminMoreMenu";
    menu.className = "admin-more-menu";

    menu.innerHTML = `
        <div class="admin-more-menu-card">

            <div class="admin-more-menu-header">
                <strong>Admin Menu</strong>

                <button
                    type="button"
                    class="admin-more-close"
                    aria-label="Close admin menu"
                >
                    <i class="fas fa-xmark"></i>
                </button>
            </div>

            <a href="admin-notifications.html">
                <i class="fas fa-bell"></i>
                <span>Notifications</span>
            </a>

            <a href="admin-analytics.html">
                <i class="fas fa-chart-line"></i>
                <span>Analytics</span>
            </a>

            <a href="admin-settings.html">
                <i class="fas fa-gear"></i>
                <span>Settings</span>
            </a>

            <a href="index.html">
                <i class="fas fa-store"></i>
                <span>Back to Store</span>
            </a>

            <button
                type="button"
                class="admin-more-logout"
            >
                <i class="fas fa-right-from-bracket"></i>
                <span>Logout</span>
            </button>

        </div>
    `;

    document.body.appendChild(menu);
    document.body.appendChild(nav);


    function closeAdminMoreMenu(){
        menu.classList.remove("open");
    }

    moreButton.addEventListener(
        "click",
        function(){

            menu.classList.toggle("open");

        }
    );

    const closeButton =
        menu.querySelector(
            ".admin-more-close"
        );

    if(closeButton){
        closeButton.addEventListener(
            "click",
            closeAdminMoreMenu
        );
    }

    menu.addEventListener(
        "click",
        function(event){

            if(event.target === menu){
                closeAdminMoreMenu();
            }

        }
    );

    const logoutButton =
        menu.querySelector(
            ".admin-more-logout"
        );

    if(logoutButton){

        logoutButton.addEventListener(
            "click",
            function(){
                logoutUser();
            }
        );

    }

}


document.addEventListener(
    "DOMContentLoaded",
    function(){
        buildAdminNavigation();
    }
);

// ===========================================
// TOGGLE LOGIN PASSWORD VISIBILITY
// ===========================================

function toggleLoginPassword(){

    const passwordInput =
        document.getElementById("loginPassword");

    const passwordIcon =
        document.getElementById("loginPasswordIcon");

    if(!passwordInput){
        return;
    }

    if(passwordInput.type === "password"){

        passwordInput.type = "text";

        if(passwordIcon){
            passwordIcon.className =
                "fas fa-eye-slash";
        }

    }else{

        passwordInput.type = "password";

        if(passwordIcon){
            passwordIcon.className =
                "fas fa-eye";
        }

    }

}


// ===========================================
// JGGL FIRST VISIT ONBOARDING
// ===========================================

let jgglOnboardingSlide = 0;


function showJGGLOnboardingSlide(index){

    const slides =
        document.querySelectorAll(
            "[data-onboarding-slide]"
        );

    const dots =
        document.querySelectorAll(
            "[data-onboarding-dot]"
        );

    if(!slides.length){
        return;
    }

    const safeIndex =
        Math.max(
            0,
            Math.min(
                Number(index) || 0,
                slides.length - 1
            )
        );

    jgglOnboardingSlide =
        safeIndex;

    slides.forEach(function(slide, slideIndex){

        slide.classList.toggle(
            "active",
            slideIndex === safeIndex
        );

    });

    dots.forEach(function(dot, dotIndex){

        dot.classList.toggle(
            "active",
            dotIndex === safeIndex
        );

    });

    const nextButton =
        document.getElementById(
            "onboardingNextBtn"
        );

    const finalActions =
        document.getElementById(
            "onboardingFinalActions"
        );

    const isLast =
        safeIndex === slides.length - 1;

    if(nextButton){
        nextButton.hidden = isLast;
    }

    if(finalActions){
        finalActions.hidden = !isLast;
    }

}


function nextJGGLOnboardingSlide(){

    const slides =
        document.querySelectorAll(
            "[data-onboarding-slide]"
        );

    if(!slides.length){
        return;
    }

    const nextIndex =
        Math.min(
            jgglOnboardingSlide + 1,
            slides.length - 1
        );

    showJGGLOnboardingSlide(
        nextIndex
    );

}


function completeJGGLOnboarding(){

    localStorage.setItem(
        "jgglOnboardingCompleted",
        "true"
    );

}


function finishJGGLOnboarding(destination){

    completeJGGLOnboarding();

    if(destination === "register"){

        window.location.href =
            "register.html?view=auth-flow-2";

        return;
    }

    window.location.href =
        "login.html?view=auth-flow-2";

}


function skipJGGLOnboarding(){

    completeJGGLOnboarding();

    window.location.href =
        "login.html?view=auth-flow-2";

}


document.addEventListener(
    "DOMContentLoaded",
    function(){

        if(
            window.location.pathname.endsWith(
                "onboarding.html"
            )
        ){
            showJGGLOnboardingSlide(0);
        }

    }
);
