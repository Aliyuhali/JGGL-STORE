

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



document.getElementById("productDescription").textContent =
    currentProduct.description ||
    "No description available";



loadProductSpecifications(
    currentProduct
);

loadProductVariants(
    currentProduct
);

selectPurchaseType("retail");



});



let selectedVariantOptions = {};
let selectedProductVariant = null;



// ===========================================
// LOAD PRODUCT VARIANTS
// ===========================================

function loadProductVariants(product){

    const section =
        document.getElementById(
            "productVariantsSection"
        );

    const list =
        document.getElementById(
            "productVariantsList"
        );

    if(!section || !list){
        return;
    }

    const variants =
        product &&
        Array.isArray(product.variants)
            ? product.variants
            : [];

    list.innerHTML = "";

    if(variants.length === 0){

        section.style.display = "none";
        return;

    }

    const ignoredKeys = new Set([
        "id",
        "label",
        "price",
        "retailPrice",
        "wholesalePrice",
        "bulkPrice",
        "priceAdjustment",
        "stock",
        "sku",
        "image"
    ]);

    const optionKeys = [];

    variants.forEach(function(variant){

        Object.keys(variant).forEach(function(key){

            if(
                !ignoredKeys.has(key) &&
                !optionKeys.includes(key)
            ){
                optionKeys.push(key);
            }

        });

    });

    if(optionKeys.length === 0){

        section.style.display = "none";
        return;

    }

    optionKeys.forEach(function(key){

        const values = [
            ...new Set(
                variants
                    .map(function(variant){
                        return variant[key];
                    })
                    .filter(function(value){
                        return (
                            value !== undefined &&
                            value !== null &&
                            value !== ""
                        );
                    })
            )
        ];

        if(values.length === 0){
            return;
        }

        const group =
            document.createElement("div");

        group.className =
            "product-variant-group";

        const heading =
            document.createElement("h4");

        heading.textContent =
            formatSpecificationLabel(key);

        const options =
            document.createElement("div");

        options.className =
            "product-variant-options";

        values.forEach(function(value){

            const button =
                document.createElement("button");

            button.type = "button";

            button.className =
                "product-variant-option-btn";

            button.textContent =
                String(value);

            button.dataset.variantKey =
                key;

            button.dataset.variantValue =
                String(value);



button.addEventListener(
    "click",
    function(){

        selectProductVariantOption(
            key,
            String(value),
            product,
            variants
        );

    }
);


            options.appendChild(button);

        });

        group.appendChild(heading);
        group.appendChild(options);
        list.appendChild(group);

    });

    section.style.display =
        list.children.length > 0
            ? "block"
            : "none";

}



// ===========================================
// SELECT PRODUCT VARIANT OPTION
// ===========================================

function selectProductVariantOption(
    key,
    value,
    product,
    variants
){

    selectedVariantOptions[key] = value;

    document
        .querySelectorAll(
            '.product-variant-option-btn[data-variant-key="' +
            key +
            '"]'
        )
        .forEach(function(button){

            button.classList.toggle(
                "active",
                button.dataset.variantValue ===
                    value
            );

        });

    const selectedKeys =
        Object.keys(selectedVariantOptions);

    selectedProductVariant =
        variants.find(function(variant){

            return selectedKeys.every(
                function(optionKey){

                    return String(
                        variant[optionKey]
                    ) === String(
                        selectedVariantOptions[
                            optionKey
                        ]
                    );

                }
            );

        }) || null;

    if(selectedProductVariant){

        applySelectedProductVariant(
            product,
            selectedProductVariant
        );

    }

}




// ===========================================
// APPLY SELECTED PRODUCT VARIANT
// ===========================================

function applySelectedProductVariant(
    product,
    variant
){

    const image =
        document.getElementById(
            "productImage"
        );

    const price =
        document.getElementById(
            "productPrice"
        );

    const sku =
        document.getElementById(
            "productSku"
        );

    const stock =
        document.getElementById(
            "productStock"
        );

    const stockStatus =
        document.getElementById(
            "productStockStatus"
        );

    const variantPrice =
        variant.price ??
        variant.retailPrice ??
        (
            Number(product.retailPrice || product.price || 0) +
            Number(variant.priceAdjustment || 0)
        );

    if(image && variant.image){
        image.src = variant.image;
    }

    if(price){
        price.textContent =
            "₦" +
            Number(variantPrice)
                .toLocaleString();
    }

    if(sku){
        sku.textContent =
            variant.sku ||
            product.sku ||
            "";
    }

    if(stock){
        stock.textContent =
            variant.stock ??
            product.stock ??
            0;
    }

    if(stockStatus){

        const availableStock =
            variant.stock ??
            product.stock ??
            0;

        stockStatus.textContent =
            availableStock > 0
                ? "In Stock"
                : "Out of Stock";

    }

    selectedPurchasePrice =
        Number(variantPrice);

    minimumPurchaseQuantity =
        purchaseType === "wholesale"
            ? (
                variant.wholesaleMinQty ||
                product.wholesaleMinQty ||
                5
            )
            : purchaseType === "bulk"
                ? (
                    variant.bulkMinQty ||
                    product.bulkMinQty ||
                    20
                )
                : 1;

    const selectedPrice =
        document.getElementById(
            "selectedPurchasePrice"
        );

    const minimumQuantity =
        document.getElementById(
            "minimumPurchaseQuantity"
        );

    if(selectedPrice){
        selectedPrice.textContent =
            "₦" +
            Number(selectedPurchasePrice)
                .toLocaleString();
    }

    if(minimumQuantity){
        minimumQuantity.textContent =
            minimumPurchaseQuantity;
    }

}





// ===========================================
// LOAD PRODUCT SPECIFICATIONS
// ===========================================

function loadProductSpecifications(product){

    const section =
        document.getElementById(
            "productSpecificationsSection"
        );

    const list =
        document.getElementById(
            "productSpecificationsList"
        );

    if(!section || !list){
        return;
    }

    const specifications =
        product &&
        product.specifications &&
        typeof product.specifications === "object"
            ? product.specifications
            : null;

    list.innerHTML = "";


    if(
        !specifications ||
        Object.keys(specifications).length === 0
    ){
        section.style.display = "none";
        return;
    }

    Object.entries(specifications)
        .forEach(function([key, value]){

            if(
                value === null ||
                value === undefined ||
                value === ""
            ){
                return;
            }

            const row =
                document.createElement("div");

            row.className =
                "product-specification-row";

            const label =
                document.createElement("strong");

            const text =
                document.createElement("span");

            label.textContent =
                formatSpecificationLabel(key) + ":";

            text.textContent =
                String(value);

            row.appendChild(label);
            row.appendChild(text);
            list.appendChild(row);

        });

   section.style.display = "block";


}


// ===========================================
// FORMAT SPECIFICATION LABEL
// ===========================================

function formatSpecificationLabel(key){

    return String(key)
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, function(letter){
            return letter.toUpperCase();
        });

}



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
        currentProduct.name + " (" + purchaseType + ")",
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

