

currentProduct = null;

document.addEventListener("DOMContentLoaded", function(){

    const productId =
        Number(localStorage.getItem("selectedProductId"));

    currentProduct = PRODUCTS.find(function(product){

        return product.id === productId;

    });

    if(!currentProduct){

        document.getElementById("productName").textContent =
            "Product not found";

        return;

    }

    document.getElementById("productImage").src =
        currentProduct.image;

    document.getElementById("productName").textContent =
        currentProduct.name;

    document.getElementById("productPrice").textContent =
        "₦" + Number(currentProduct.price).toLocaleString();



document.getElementById("productCategory").textContent =
    currentProduct.group || currentProduct.category || "";

document.getElementById("productBrand").textContent =
    currentProduct.brand || "";

document.getElementById("productSku").textContent =
    currentProduct.sku || "";

document.getElementById("productStock").textContent =
    currentProduct.stock ?? 0;

document.getElementById("productStockStatus").textContent =
    currentProduct.stockStatus ||
    (currentProduct.stock > 0 ? "In Stock" : "Out of Stock");

document.getElementById("productRating").textContent =
    currentProduct.rating
        ? currentProduct.rating + " / 5"
        : "No rating";

document.getElementById("productReviews").textContent =
    Array.isArray(currentProduct.reviews)
        ? currentProduct.reviews.length
        : 0;



document.getElementById("productDiscount").textContent =
    currentProduct.discount
        ? currentProduct.discount + "%"
        : "No discount";


document.getElementById("productDiscount").textContent =
    currentProduct.discount
        ? currentProduct.discount + "%"
        : "No discount";

document.getElementById("productDescription").textContent =
    currentProduct.description || "No description available";

selectPurchaseType("retail");

});



let purchaseType = "retail";
let selectedPurchasePrice = 0;
let minimumPurchaseQuantity = 1;

function selectPurchaseType(type){

    if(!currentProduct){
        return;
    }

    purchaseType = type;

    const buttons =
        document.querySelectorAll(".purchase-type-btn");

    buttons.forEach(function(button){

        button.classList.remove("active");

        if(
            button.textContent.trim().toLowerCase() === type
        ){
            button.classList.add("active");
        }

    });

    if(type === "wholesale"){

        selectedPurchasePrice =
            currentProduct.wholesalePrice ||
            currentProduct.retailPrice ||
            currentProduct.price;

        minimumPurchaseQuantity =
            currentProduct.wholesaleMinQty || 5;

    }else if(type === "bulk"){

        selectedPurchasePrice =
            currentProduct.bulkPrice ||
            currentProduct.wholesalePrice ||
            currentProduct.retailPrice ||
            currentProduct.price;

        minimumPurchaseQuantity =
            currentProduct.bulkMinQty || 20;

    }else{

        selectedPurchasePrice =
            currentProduct.retailPrice ||
            currentProduct.price;

        minimumPurchaseQuantity = 1;

    }

    document.getElementById(
        "selectedPurchasePrice"
    ).textContent =
        "₦" +
        Number(selectedPurchasePrice)
            .toLocaleString("en-NG");

    document.getElementById(
        "minimumPurchaseQuantity"
    ).textContent =
        minimumPurchaseQuantity;

    document.getElementById(
        "productPrice"
    ).textContent =
        "₦" +
        Number(selectedPurchasePrice)
            .toLocaleString("en-NG");

}




function addCurrentProductToCart(){

    if(!currentProduct){
        return;
    }

    addToCart(
        currentProduct.name,
        selectedPurchasePrice,
        currentProduct.image,
        purchaseType,
        minimumPurchaseQuantity,
        minimumPurchaseQuantity
    );

}



function addCurrentProductToWishlist(){

    if(currentProduct){

        addToWishlist(
            currentProduct.name,
            currentProduct.price,
            currentProduct.image
        );

    }

}

