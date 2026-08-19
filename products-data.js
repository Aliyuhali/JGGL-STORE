// ===========================================
// JGGL-STORE v8 Alpha
// CFR-1 Test Products Database
// Groups: Sugar, Rice, Oil
// ===========================================


const PRODUCT_GROUPS = [

    {
        id: 1,
        name: "Sugar",
        image: "images/sugar.jpg",
        price: 65000
    },

    {
        id: 4,
        name: "Flour",
        image: "images/flour.jpg",
        price: 35000
    },

    {
        id: 2,
        name: "Rice",
        image: "images/rice.jpg",
        price: 75000
    },



{
    id: 3,
    name: "Oil",
    image: "images/oil.jpg",
    price: 45000
},


{
    id: 5,
    name: "Smartphones",
    image: "images/samsung-a15-black.png",
    price: 245000
},



{
    id: 6,
    name: "Laptops",
    image: "images/laptop.png",
    price: 450000
},

{
    id: 7,
    name: "Televisions",
    image: "images/television.png",
    price: 300000
},

{
    id: 8,
    name: "Smart Watches",
    image: "images/smart-watch.png",
    price: 85000
},

{
    id: 9,
    name: "Audio",
    image: "images/headphones.png",
    price: 45000
},

{
    id: 10,
    name: "Printers",
    image: "images/printer.png",
    price: 180000
},

{
    id: 11,
    name: "Cameras",
    image: "images/camera.png",
    price: 550000
},

{
    id: 12,
    name: "Accessories",
    image: "images/electronics-accessories.png",
    price: 15000
}





];



const PRODUCTS = [

    // =======================================
    // SUGAR GROUP
    // =======================================


{
    id: 101,
    name: "Dangote Sugar 50kg",
    category: "Food",
    group: "Sugar",
    brand: "Dangote",
    sku: "JGGL-SUGAR-DANGOTE-50KG",

    price: 65000,
    retailPrice: 65000,
    wholesalePrice: 62500,
    bulkPrice: 60000,

    wholesaleMinQty: 5,
    bulkMinQty: 20,

    image: "images/sugar.jpg",

    stock: 40,
    reservedStock: 0,
    reorderLevel: 10,
    stockStatus: "In Stock",

    rating: 4.8,
    discount: 0,
    reviews: [],

    variants: [
        {
            id: "dangote-sugar-50kg",
            label: "50kg Bag",
            weight: "50kg",
            priceAdjustment: 0,
            stock: 40
        }
    ],

    description: "Dangote refined white sugar in a 50kg bag.",

specifications: {
    weight: "50kg",
    packSize: "1 Bag",
    ingredients: "Refined white sugar",
    manufacturingDate: "See package",
    expiryDate: "See package",
    storageInstructions:
        "Store in a cool, dry place",
    countryOfOrigin: "Nigeria"
},

    related: [102, 103]
},



    {
        id: 102,
        name: "BUA Sugar 50kg",
        category: "Food",
        group: "Sugar",
        brand: "BUA",
        price: 64000,
        image: "images/sugar.jpg",
        stock: 35,
        rating: 4.7,
        discount: 0,
        reviews: [],
        description: "BUA refined white sugar in a 50kg bag.",
        related: [101, 103]
    },

    {
        id: 103,
        name: "Golden Sugar 50kg",
        category: "Food",
        group: "Sugar",
        brand: "Golden",
        price: 63000,
        image: "images/sugar.jpg",
        stock: 30,
        rating: 4.6,
        discount: 0,
        reviews: [],
        description: "Golden refined white sugar in a 50kg bag.",
        related: [101, 102]

    },




    // =======================================
    // RICE GROUP
    // =======================================

    {
        id: 201,
        name: "Mama Gold Rice 50kg",
        category: "Food",
        group: "Rice",
        brand: "Mama Gold",
        price: 75000,
        image: "images/rice.jpg",
        stock: 25,
        rating: 4.9,
        discount: 0,
        reviews: [],
        description: "Mama Gold quality rice in a 50kg bag.",
        related: [202, 203]
    },

    {
        id: 202,
        name: "Royal Stallion Rice 50kg",
        category: "Food",
        group: "Rice",
        brand: "Royal Stallion",
        price: 74000,
        image: "images/rice.jpg",
        stock: 20,
        rating: 4.8,
        discount: 0,
        reviews: [],
        description: "Royal Stallion quality rice in a 50kg bag.",
        related: [201, 203]
    },

    {
        id: 203,
        name: "Cap Rice 50kg",
        category: "Food",
        group: "Rice",
        brand: "Cap",
        price: 73000,
        image: "images/rice.jpg",
        stock: 30,
        rating: 4.7,
        discount: 0,
        reviews: [],
        description: "Cap quality rice in a 50kg bag.",
        related: [201, 202]
    },

    // =======================================
    // OIL GROUP
    // =======================================

    {
        id: 301,
        name: "Kings Cooking Oil",
        category: "Food",
        group: "Oil",
        brand: "Kings",
        price: 45000,
        image: "images/oil.jpg",
        stock: 35,
        rating: 4.8,
        discount: 0,
        reviews: [],
        description: "Kings vegetable cooking oil.",
        related: [302, 303]
    },

    {
        id: 302,
        name: "Power Cooking Oil",
        category: "Food",
        group: "Oil",
        brand: "Power Oil",
        price: 44000,
        image: "images/oil.jpg",
        stock: 30,
        rating: 4.7,
        discount: 0,
        reviews: [],
        description: "Power vegetable cooking oil.",
        related: [301, 303]
    },

    {
        id: 303,
        name: "Mamador Cooking Oil",
        category: "Food",
        group: "Oil",
        brand: "Mamador",
        price: 46000,
        image: "images/oil.jpg",
        stock: 25,
        rating: 4.9,
        discount: 0,
        reviews: [],
        description: "Mamador vegetable cooking oil.",
        related: [301, 302]
},


// =======================================
// FLOUR GROUP
// =======================================

{
    id: 401,
    name: "Golden Penny Flour 50kg",
    category: "Food",
    group: "Flour",
    brand: "Golden Penny",
    price: 35000,
    image: "images/flour.jpg",
    stock: 30,
    rating: 4.8,
    discount: 0,
    reviews: [],
    description: "Golden Penny wheat flour in a 50kg bag.",
    related: [402]
},




{
    id: 402,
    name: "Honeywell Flour 50kg",
    category: "Food",
    group: "Flour",
    brand: "Honeywell",

    sku: "HWF-50KG-001",

    price: 34000,
    retailPrice: 34000,
    wholesalePrice: 32500,
    bulkPrice: 31000,

    wholesaleMinQty: 5,
    bulkMinQty: 20,

    image: "images/flour.jpg",

    stock: 25,
    stockStatus: "In Stock",

    rating: 4.7,
    discount: 0,
    reviews: [],

    description: "Honeywell wheat flour in a 50kg bag.",
    related: [401]

},



{
    id: 1001,

    name: "Samsung Galaxy A15",

    category: "Electronics",

    group: "Smartphones",

    brand: "Samsung",

    sku: "JGGL-SAM-A15",

    retailPrice: 245000,
    wholesalePrice: 238000,
    bulkPrice: 230000,

    price: 245000,

    wholesaleMinQty: 2,
    bulkMinQty: 5,

    image: "images/samsung-a15-black.png",

    stock: 12,

    stockStatus: "In Stock",

    rating: 4.8,

    discount: 0,

    reviews: [],

    specifications: {
        model: "Galaxy A15",
        display: "6.5-inch Super AMOLED",
        processor: "MediaTek Helio G99",
        ram: "4GB",
        storage: "128GB",
        battery: "5000mAh",
        camera: "50MP + 5MP + 2MP",
        operatingSystem: "Android",
        network: "4G",
        warranty: "12 Months"
    },

    variants: [
        {
            id: "a15-black-128-4",
            label: "Black",
            color: "Black",
            storage: "128GB",
            ram: "4GB",
            price: 245000,
            stock: 12,
            sku: "JGGL-SAM-A15-BLK-128-4",
            image: "images/samsung-a15-black.png"
        },

        {
            id: "a15-blue-128-4",
            label: "Blue",
            color: "Blue",
            storage: "128GB",
            ram: "4GB",
            price: 247000,
            stock: 10,
            sku: "JGGL-SAM-A15-BLU-128-4",
image: "images/samsung-a15-blue.png"

        },

        {
            id: "a15-black-256-8",
            label: "Black",
            color: "Black",
            storage: "256GB",
            ram: "8GB",
            price: 285000,
            stock: 8,
            sku: "JGGL-SAM-A15-BLK-256-8",
            image: "images/samsung-a15-black.png"
        },

        {
            id: "a15-silver-256-8",
            label: "Silver",
            color: "Silver",
            storage: "256GB",
            ram: "8GB",
            price: 289000,
            stock: 6,
            sku: "JGGL-SAM-A15-SLV-256-8",
image: "images/samsung-a15-silver.png"


        }
    ],

    description:
        "Samsung Galaxy A15 smartphone with Super AMOLED display, long-lasting battery and excellent everyday performance.",

    related: []
}









];













