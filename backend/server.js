const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const path = require("node:path");

const multer = require("multer");

const OpenAI = require("openai");

require("dotenv").config();

const pool = require("./db");
const app = express();

app.disable("x-powered-by");

app.use(
    helmet({
        crossOriginResourcePolicy: false,

        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],

                scriptSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "https://cdnjs.cloudflare.com",
                    "https://unpkg.com"
                ],

                scriptSrcAttr: [
                    "'unsafe-inline'"
                ],

                styleSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "https:"
                ],

                imgSrc: [
                    "'self'",
                    "data:",
                    "blob:"
                ],

                fontSrc: [
                    "'self'",
                    "https:",
                    "data:"
                ],

                connectSrc: [
                    "'self'",
                    "http://127.0.0.1:3000",
                    "http://localhost:3000"
                ],

                objectSrc: [
                    "'none'"
                ],

                baseUri: [
                    "'self'"
                ],

                frameAncestors: [
                    "'self'"
                ]
            }
        }
    })
);
const allowedOrigins = [
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
    "http://localhost:3000",
    "http://localhost:8000",
    "https://jggl-store.onrender.com"
];

if(process.env.FRONTEND_URL){
    allowedOrigins.push(
        process.env.FRONTEND_URL
    );
}

app.use(
    cors({
        origin: function(origin, callback){

            if(
                !origin ||
                allowedOrigins.includes(origin)
            ){
                return callback(null, true);
            }

            const corsError =
                new Error(
                    "Origin not allowed by CORS."
                );

            corsError.code =
                "CORS_NOT_ALLOWED";

            return callback(corsError);
        }
    })
);

const PORT = process.env.PORT || 3000;
// ===========================================
// RATE LIMITING / ABUSE PROTECTION
// ===========================================

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message:
            "Too many login or registration attempts. Please try again later."
    }
});

const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message:
            "Too many admin requests. Please try again later."
    }
});



const openai =
    process.env.OPENAI_API_KEY
        ? new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        })
        : null;

const imageUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: function(req, file, callback){

        if(
            !file.mimetype ||
            !file.mimetype.startsWith("image/")
        ){
            return callback(
                new Error("Only image files are allowed.")
            );
        }

        callback(null, true);
    }
});



// ===========================================
// JWT AUTH MIDDLEWARE
// ===========================================

function authenticateToken(req, res, next){

    const authHeader =
        req.headers.authorization || "";

    if(!authHeader.startsWith("Bearer ")){

        return res.status(401).json({
            success: false,
            message: "Authentication token is required."
        });
    }

    const token =
        authHeader.slice(7).trim();

    if(!token){

        return res.status(401).json({
            success: false,
            message: "Authentication token is required."
        });
    }

    try{

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        req.user = decoded;

        next();

    }catch(error){

        return res.status(401).json({
            success: false,
            message: "Invalid or expired authentication token."
        });
    }
}


// ===========================================
// ADMIN ROLE MIDDLEWARE
// ===========================================

function requireAdmin(req, res, next){

    if(
        !req.user ||
        String(req.user.role || "").toLowerCase() !== "admin"
    ){
        return res.status(403).json({
            success: false,
            message: "Admin access is required."
        });
    }

    next();
}


// Frontend yana folder ɗaya sama da backend.
const frontendPath = path.resolve(__dirname, "..");

app.use(function(error, req, res, next){

    if(
        error &&
        error.code === "CORS_NOT_ALLOWED"
    ){
        return res.status(403).json({
            success: false,
            message:
                "Origin not allowed by CORS."
        });
    }

    next(error);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve existing HTML, CSS, JS da images.
app.use(express.static(frontendPath));

// Backend health test.
app.get("/api/health", function(req, res){
    res.status(200).json({
        success: true,
        message: "JGGL-STORE backend is running.",
        timestamp: new Date().toISOString()
    });
});


app.get("/api/db-health", async function(req, res){

    try{

        const result = await pool.query(
            `
            SELECT
                current_database() AS database_name,
                current_user AS database_user,
                NOW() AS database_time
            `
        );

        res.status(200).json({
            success: true,
            message:
                "JGGL-STORE PostgreSQL connection is working.",
            database: result.rows[0]
        });

    }catch(error){

        console.error(
            "Database health check failed:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to connect to PostgreSQL.",
            error: error.message
        });
    }

});



// ===========================================
// SEARCH PRODUCT BY IMAGE
// ===========================================

app.post(
    "/api/search-by-image",
    imageUpload.single("image"),
    async function(req, res){

        try{

            if(!req.file){

                return res.status(400).json({
                    success: false,
                    message: "Image file is required."
                });

            }



const imageBase64 =
    req.file.buffer.toString("base64");

const imageDataUrl =
    `data:${req.file.mimetype};base64,${imageBase64}`;

if(!openai){
    return res.status(503).json({
        success: false,
        message: "AI image search is temporarily unavailable."
    });
}

const aiResponse =
    await openai.responses.create({
        model: "gpt-5.6-luna",
        input: [
            {
                role: "user",
                content: [
                    {
                        type: "input_text",
                        text:
                            "Identify the main retail product in this image. " +
                            "Return only a short product search phrase, " +
                            "for example: Samsung charger, rice, sugar, laptop, headphones. " +
                            "Do not add explanations."
                    },
                    {
                        type: "input_image",
                        image_url: imageDataUrl
                    }
                ]
            }
        ]
    });

const detectedProduct =
    String(aiResponse.output_text || "").trim();

return res.status(200).json({
    success: true,
    message: "Image recognized successfully.",
    image: {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size
    },
    recognition: {
        status: "completed",
        query: detectedProduct
    }
});



        }catch(error){

            console.error(
                "SEARCH BY IMAGE ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Unable to process image."
            });

        }

    }
);



app.get("/api/products", async function(req, res){

    try{



const result = await pool.query(`
    SELECT
        frontend_id AS id,
        product_name AS name,
        category,
        product_group AS "group",
        brand,
        sku,

        retail_price AS price,
        retail_price AS "retailPrice",
        wholesale_price AS "wholesalePrice",
        bulk_price AS "bulkPrice",

        minimum_wholesale_quantity AS "wholesaleMinQty",
        minimum_bulk_quantity AS "bulkMinQty",

        image_url AS image,

        stock_quantity AS stock,
        stock_status AS "stockStatus",

        rating,
        discount,

        description,
        specifications,
        related_frontend_ids AS related

    FROM products

    WHERE is_active = TRUE

    ORDER BY frontend_id ASC
`);



        res.status(200).json({
            success: true,
            count: result.rows.length,
            products: result.rows
        });

    }catch(error){

        console.error(
            "Unable to load products:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to load products from database.",
            error: error.message
        });
    }

});




// ===========================================
// GET SINGLE PUBLIC PRODUCT + VARIANTS
// Live inventory source for Product Details.
// ===========================================

app.get("/api/products/:id", async function(req, res){

    try{

        const productId =
            String(req.params.id || "").trim();

        const productResult =
            await pool.query(
                `
                SELECT
                    id,
                    frontend_id,
                    product_name,
                    category,
                    product_group,
                    brand,
                    sku,
                    description,
                    image_url,
                    retail_price,
                    wholesale_price,
                    bulk_price,
                    minimum_wholesale_quantity,
                    minimum_bulk_quantity,
                    stock_quantity,
                    reserved_stock,
                    reorder_level,
                    stock_status,
                    rating,
                    discount,
                    specifications,
                    related_frontend_ids,
                    is_active
                FROM products
                WHERE
                    is_active = TRUE
                    AND (
                        id::text = $1
                        OR frontend_id::text = $1
                    )
                LIMIT 1
                `,
                [productId]
            );

        if(productResult.rows.length === 0){

            return res.status(404).json({
                success: false,
                message: "Product not found."
            });

        }

        const product =
            productResult.rows[0];

        const variantsResult =
            await pool.query(
                `
                SELECT
                    id,
                    product_id,
                    variant_name,
                    sku,
                    color,
                    storage,
                    ram,
                    weight,
                    pack_size,
                    retail_price,
                    wholesale_price,
                    bulk_price,
                    stock_quantity,
                    image_url,
                    specifications,
                    is_active
                FROM product_variants
                WHERE
                    product_id = $1
                    AND is_active = TRUE
                ORDER BY id ASC
                `,
                [product.id]
            );

        return res.json({
            success: true,
            product: product,
            variants: variantsResult.rows
        });

    }catch(error){

        console.error(
            "GET SINGLE PUBLIC PRODUCT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load product."
        });

    }

});


// ===========================================
// PROTECT ALL ADMIN API ROUTES
// ===========================================

app.use(
    "/api/admin",
    authenticateToken,
    requireAdmin,
    adminLimiter
);


// ===========================================
// ADMIN PRODUCTS
// ===========================================

app.get("/api/admin/products", async function(req, res){

    try{

        const result = await pool.query(`
            SELECT
                id,
                frontend_id,
                product_name,
                category,
                product_group,
                brand,

  sku,
image_url,

                retail_price,
      wholesale_price,
                bulk_price,
                stock_quantity,
                reorder_level,
                stock_status,
                is_active
            FROM products
            ORDER BY frontend_id ASC
        `);

        res.status(200).json({
            success: true,
            count: result.rows.length,
            products: result.rows
        });

    }catch(error){

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to load admin products."
        });

    }

});




// ===========================================
// GET SINGLE ADMIN PRODUCT
// ===========================================

app.get("/api/admin/products/:id", async function(req, res){

    try{

        const productId = req.params.id;

        const result = await pool.query(`
            SELECT
                id,
                frontend_id,
                product_name,
                category,
                product_group,
                brand,
                sku,
                image_url,
                retail_price,
                wholesale_price,
                bulk_price,
                stock_quantity,
                reorder_level,
                stock_status,
                description,
                rating,
                discount,
                is_active
            FROM products
            WHERE
                id::text = $1
                OR frontend_id::text = $1
            LIMIT 1
        `, [productId]);

        if(result.rows.length === 0){

            return res.status(404).json({
                success: false,
                message: "Product not found."
            });

        }

        const product =
            result.rows[0];

        const variantsResult =
            await pool.query(
                `
                SELECT
                    id,
                    product_id,
                    variant_name,
                    sku,
                    color,
                    storage,
                    ram,
                    weight,
                    pack_size,
                    retail_price,
                    wholesale_price,
                    bulk_price,
                    stock_quantity,
                    image_url,
                    is_active
                FROM product_variants
                WHERE
                    product_id = $1
                    AND is_active = TRUE
                ORDER BY id ASC
                `,
                [product.id]
            );

        res.status(200).json({
            success: true,
            product: product,
            variants: variantsResult.rows
        });

    }catch(error){

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to load product details."
        });

    }

});




app.post("/api/admin/products", async function(req, res){

    try{

        const {
            id,
            name,
            category,
            group,
            brand,
            image,
            price,
            retailPrice,
            wholesalePrice,
            bulkPrice,
            stock,
            reorderLevel,
            description
        } = req.body;

        if(
            !name ||
            !category ||
            !Number(retailPrice || price)
        ){
            return res.status(400).json({
                success: false,
                message:
                    "Product name, category and retail price are required."
            });
        }




const requestedFrontendId =
    Number(id);

let frontendId;

if(
    Number.isInteger(requestedFrontendId) &&
    requestedFrontendId > 0 &&
    requestedFrontendId <= 2147483647
){

    frontendId =
        requestedFrontendId;

}else{

    const idResult =
        await pool.query(`
            SELECT
                COALESCE(
                    MAX(frontend_id),
                    1000
                ) + 1 AS next_frontend_id
            FROM products
        `);

    frontendId =
        Number(
            idResult.rows[0]
                .next_frontend_id
        );

}

const sku =
    "JGGL-PRODUCT-" + frontendId;



        const result = await pool.query(
            `
            INSERT INTO products (
                frontend_id,
                product_name,
                category,
                product_group,
                brand,
                sku,
                description,
                image_url,
                retail_price,
                wholesale_price,
                bulk_price,
                stock_quantity,
                reorder_level,
                stock_status,
                is_active
            )
            VALUES (
                $1, $2, $3, $4, $5, $6,
                $7, $8, $9, $10, $11,
                $12, $13, $14, TRUE
            )
            RETURNING *
            `,
            [
                frontendId,
                String(name).trim(),
                String(category).trim(),
                String(group || category).trim(),
                brand ? String(brand).trim() : null,
                sku,
                description
                    ? String(description).trim()
                    : null,
                image
                    ? String(image).trim()
                    : null,
                Number(retailPrice || price),
                Number(wholesalePrice || 0),
                Number(bulkPrice || 0),
                Number(stock || 0),

                Math.max(
                    0,
                    Number(reorderLevel || 0)
                ),

                Number(stock || 0) <= 0
                    ? "Out of Stock"
                    : (
                        Number(reorderLevel || 0) > 0 &&
                        Number(stock || 0) <=
                            Number(reorderLevel || 0)
                            ? "Low Stock"
                            : "In Stock"
                    )
            ]
        );

        res.status(201).json({
            success: true,
            message:
                "Product added successfully.",
            product: result.rows[0]
        });

    }catch(error){

        console.error(
            "Unable to add product:",
            error
        );

        if(error.code === "23505"){

            return res.status(409).json({
                success: false,
                message:
                    "A product with this ID or SKU already exists."
            });
        }

        res.status(500).json({
            success: false,
            message:
                "Unable to add product."
        });
    }

});




// ===========================================
// UPDATE ADMIN PRODUCT
// ===========================================

app.put("/api/admin/products/:id", async function(req, res){

    try{

        const productId = req.params.id;

        const {
            name,
            category,
            group,
            brand,
            image,
            price,
            retailPrice,
            wholesalePrice,
            bulkPrice,
            stock,
            reorderLevel,
            description
        } = req.body;

        if(
            !name ||
            !category ||
            !Number(retailPrice || price)
        ){
            return res.status(400).json({
                success: false,
                message:
                    "Product name, category and retail price are required."
            });
        }

        const stockQuantity =
            Number(stock || 0);

        const reorderLevelValue =
            Math.max(
                0,
                Number(reorderLevel || 0)
            );

        const result = await pool.query(
            `
            UPDATE products
            SET
                product_name = $1,
                category = $2,
                product_group = $3,
                brand = $4,
                image_url = $5,
                retail_price = $6,
                wholesale_price = $7,
                bulk_price = $8,
                stock_quantity = $9,
                reorder_level = $10,
                stock_status = $11,
                description = $12,
                updated_at = CURRENT_TIMESTAMP
            WHERE
                id::text = $13
                OR frontend_id::text = $13
            RETURNING *
            `,
            [
                String(name).trim(),
                String(category).trim(),
                String(group || category).trim(),
                brand
                    ? String(brand).trim()
                    : null,
                image
                    ? String(image).trim()
                    : null,
                Number(retailPrice || price),
                Number(wholesalePrice || 0),
                Number(bulkPrice || 0),
                stockQuantity,

                reorderLevelValue,

                stockQuantity <= 0
                    ? "Out of Stock"
                    : (
                        reorderLevelValue > 0 &&
                        stockQuantity <= reorderLevelValue
                            ? "Low Stock"
                            : "In Stock"
                    ),

                description
                    ? String(description).trim()
                    : null,

                String(productId)
            ]
        );

        if(result.rows.length === 0){

            return res.status(404).json({
                success: false,
                message:
                    "Product not found."
            });

        }

        res.status(200).json({
            success: true,
            message:
                "Product updated successfully.",
            product: result.rows[0]
        });

    }catch(error){

        console.error(
            "Unable to update product:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to update product."
        });

    }

});



// ===========================================
// DELETE ADMIN PRODUCT
// ===========================================

app.delete("/api/admin/products/:id", async function(req, res){

    try{

        const productId = req.params.id;

        const result = await pool.query(
            `
            DELETE FROM products
            WHERE
                id::text = $1
                OR frontend_id::text = $1
            RETURNING id
            `,
            [
                String(productId)
            ]
        );

        if(result.rows.length === 0){

            return res.status(404).json({
                success: false,
                message: "Product not found."
            });

        }

        res.status(200).json({
            success: true,
            message: "Product deleted successfully."
        });

    }catch(error){

        console.error(
            "Unable to delete product:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Unable to delete product."
        });

    }

});


// ===========================================
// REGISTER USER
// ===========================================

app.post("/api/register", authLimiter, async function(req, res){

    const client = await pool.connect();

    try{

        const {
            name,
            email,
            phone,
            password
        } = req.body;

        const cleanName =
            String(name || "").trim();

        const cleanEmail =
            String(email || "")
                .trim()
                .toLowerCase();

        const cleanPhone =
            String(phone || "").trim();

        const cleanPassword =
            String(password || "");

        if(
            !cleanName ||
            !cleanEmail ||
            !cleanPhone ||
            !cleanPassword
        ){

            return res.status(400).json({
                success: false,
                message:
                    "Name, email, phone and password are required."
            });
        }

        if(cleanPassword.length < 6){

            return res.status(400).json({
                success: false,
                message:
                    "Password must contain at least 6 characters."
            });
        }

        await client.query("BEGIN");

        const existingUser =
            await client.query(
                `
                SELECT id
                FROM users
                WHERE LOWER(email) = $1
                   OR phone = $2
                LIMIT 1
                `,
                [
                    cleanEmail,
                    cleanPhone
                ]
            );

        if(existingUser.rows.length > 0){

            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                message:
                    "An account already exists with this email or phone."
            });
        }

        const passwordHash =
            await bcrypt.hash(
                cleanPassword,
                12
            );

        const userResult =
            await client.query(
                `
                INSERT INTO users (
                    full_name,
                    email,
                    phone,
                    password_hash,
                    role,
                    is_active
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    'customer',
                    TRUE
                )
                RETURNING
                    id,
                    full_name,
                    email,
                    phone,
                    role,
                    is_active,
                    created_at
                `,
                [
                    cleanName,
                    cleanEmail,
                    cleanPhone,
                    passwordHash
                ]
            );

        const user =
            userResult.rows[0];

        const customerResult =
            await client.query(
                `
                INSERT INTO customers (
                    user_id,
                    full_name,
                    email,
                    phone,
                    is_active
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    TRUE
                )
                RETURNING
                    id,
                    user_id,
                    full_name,
                    email,
                    phone,
                    is_active,
                    joined_at
                `,
                [
                    user.id,
                    cleanName,
                    cleanEmail,
                    cleanPhone
                ]
            );

        await client.query("COMMIT");

        return res.status(201).json({
            success: true,
            message:
                "Account created successfully.",
            user: user,
            customer:
                customerResult.rows[0]
        });

    }catch(error){

        await client.query("ROLLBACK");

        console.error(
            "REGISTER USER ERROR:",
            error
        );

        if(error.code === "23505"){

            return res.status(409).json({
                success: false,
                message:
                    "An account already exists with this email or phone."
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Unable to create account."
        });

    }finally{

        client.release();

    }

});



// ===========================================
// LOGIN USER
// ===========================================

app.post("/api/login", authLimiter, async function(req, res){

    try{

        const {
            email,
            password
        } = req.body;

        const cleanEmail =
            String(email || "")
                .trim()
                .toLowerCase();

        const cleanPassword =
            String(password || "");

        if(!cleanEmail || !cleanPassword){

            return res.status(400).json({
                success: false,
                message:
                    "Email and password are required."
            });
        }

        const result = await pool.query(
            `
            SELECT
                id,
                full_name,
                email,
                phone,
                password_hash,
                role,
                is_active,
                created_at
            FROM users
            WHERE LOWER(email) = $1
            LIMIT 1
            `,
            [cleanEmail]
        );

        if(result.rows.length === 0){

            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password."
            });
        }

        const user =
            result.rows[0];

        if(user.is_active === false){

            return res.status(403).json({
                success: false,
                message:
                    "This account is inactive."
            });
        }

        const passwordMatches =
            await bcrypt.compare(
                cleanPassword,
                user.password_hash
            );

        if(!passwordMatches){

            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password."
            });
        }



delete user.password_hash;

const token = jwt.sign(
    {
        userId: user.id,
        email: user.email,
        role: user.role
    },
    process.env.JWT_SECRET,
    {
        expiresIn:
            process.env.JWT_EXPIRES_IN || "7d"
    }
);

return res.json({
    success: true,
    message: "Login successful.",
    token: token,
    user: user
});


    }catch(error){

        console.error(
            "LOGIN USER ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to login."
        });

    }

});




// ===========================================
// CHANGE CUSTOMER PASSWORD
// ===========================================

app.put(
    "/api/account/password",
    authenticateToken,
    authLimiter,
    async function(req, res){

        try{

            const userId =
                Number(
                    req.user &&
                    req.user.userId
                );

            const currentPassword =
                String(
                    req.body.currentPassword || ""
                );

            const newPassword =
                String(
                    req.body.newPassword || ""
                );

            if(!userId){

                return res.status(401).json({
                    success: false,
                    message:
                        "Authenticated user was not found."
                });
            }

            if(!currentPassword || !newPassword){

                return res.status(400).json({
                    success: false,
                    message:
                        "Current password and new password are required."
                });
            }

            if(newPassword.length < 6){

                return res.status(400).json({
                    success: false,
                    message:
                        "New password must contain at least 6 characters."
                });
            }

            if(currentPassword === newPassword){

                return res.status(400).json({
                    success: false,
                    message:
                        "New password must be different from the current password."
                });
            }

            const result =
                await pool.query(
                    `
                    SELECT
                        id,
                        password_hash,
                        is_active
                    FROM users
                    WHERE id = $1
                    LIMIT 1
                    `,
                    [userId]
                );

            if(result.rows.length === 0){

                return res.status(404).json({
                    success: false,
                    message:
                        "User account was not found."
                });
            }

            const user =
                result.rows[0];

            if(user.is_active === false){

                return res.status(403).json({
                    success: false,
                    message:
                        "This account is inactive."
                });
            }

            const passwordMatches =
                await bcrypt.compare(
                    currentPassword,
                    user.password_hash
                );

            if(!passwordMatches){

                return res.status(400).json({
                    success: false,
                    message:
                        "Current password is incorrect."
                });
            }

            const newPasswordHash =
                await bcrypt.hash(
                    newPassword,
                    12
                );

            await pool.query(
                `
                UPDATE users
                SET password_hash = $1
                WHERE id = $2
                `,
                [
                    newPasswordHash,
                    userId
                ]
            );

            return res.json({
                success: true,
                message:
                    "Password changed successfully."
            });

        }catch(error){

            console.error(
                "CHANGE PASSWORD ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to change password."
            });
        }
    }
);


// ===========================================
// GET ACCOUNT PROFILE
// ===========================================

app.get(
    "/api/account/:userId",
    authenticateToken,
    async function(req, res){


    const requestedUserId =
        Number(req.params.userId);

    if(
        req.user.role !== "admin" &&
        Number(req.user.userId) !== requestedUserId
    ){
        return res.status(403).json({
            success: false,
            message: "You are not allowed to access this account."
        });
    }


    try{

        const userId =
            Number(req.params.userId);

        if(!Number.isInteger(userId) || userId <= 0){

            return res.status(400).json({
                success: false,
                message: "Valid user ID is required."
            });
        }

        const result = await pool.query(
            `
            SELECT
                u.id,
                u.full_name,
                u.email,
                u.phone,
                u.role,
                u.is_active,
                u.created_at,
                c.id AS customer_id,
                c.address,
                c.lga,
                c.state,
                c.country,
                c.joined_at
            FROM users u
            LEFT JOIN customers c
                ON c.user_id = u.id
            WHERE u.id = $1
            LIMIT 1
            `,
            [userId]
        );

        if(result.rows.length === 0){

            return res.status(404).json({
                success: false,
                message: "Account not found."
            });
        }

        return res.json({
            success: true,
            account: result.rows[0]
        });

    }catch(error){

        console.error(
            "GET ACCOUNT PROFILE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load account profile."
        });
    }

});



// ===========================================
// UPDATE ACCOUNT PROFILE
// ===========================================

app.put(
    "/api/account/:userId",
    authenticateToken,
    async function(req, res){



    const client = await pool.connect();


    const requestedUserId =
        Number(req.params.userId);

    if(
        req.user.role !== "admin" &&
        Number(req.user.userId) !== requestedUserId
    ){
        client.release();

        return res.status(403).json({
            success: false,
            message: "You are not allowed to update this account."
        });
    }

    try{

        const userId =
            Number(req.params.userId);

        const {
            fullName,
            email,
            phone,
            address,
            lga,
            state,
            country
        } = req.body;

        const cleanName =
            String(fullName || "").trim();

        const cleanEmail =
            String(email || "")
                .trim()
                .toLowerCase();

        const cleanPhone =
            String(phone || "").trim();

        if(
            !Number.isInteger(userId) ||
            userId <= 0
        ){

            return res.status(400).json({
                success: false,
                message: "Valid user ID is required."
            });
        }

        if(
            !cleanName ||
            !cleanEmail ||
            !cleanPhone
        ){

            return res.status(400).json({
                success: false,
                message:
                    "Full name, email and phone are required."
            });
        }

        await client.query("BEGIN");

        const userResult =
            await client.query(
                `
                UPDATE users
                SET
                    full_name = $1,
                    email = $2,
                    phone = $3,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $4
                RETURNING
                    id,
                    full_name,
                    email,
                    phone,
                    role,
                    is_active,
                    created_at,
                    updated_at
                `,
                [
                    cleanName,
                    cleanEmail,
                    cleanPhone,
                    userId
                ]
            );

        if(userResult.rows.length === 0){

            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Account not found."
            });
        }

        const customerResult =
            await client.query(
                `
                INSERT INTO customers (
                    user_id,
                    full_name,
                    email,
                    phone,
                    address,
                    lga,
                    state,
                    country,
                    is_active
                )
                VALUES (
                    $1, $2, $3, $4,
                    $5, $6, $7, $8,
                    TRUE
                )
                ON CONFLICT (user_id)
                DO UPDATE SET
                    full_name = EXCLUDED.full_name,
                    email = EXCLUDED.email,
                    phone = EXCLUDED.phone,
                    address = EXCLUDED.address,
                    lga = EXCLUDED.lga,
                    state = EXCLUDED.state,
                    country = EXCLUDED.country,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING
                    id,
                    user_id,
                    full_name,
                    email,
                    phone,
                    address,
                    lga,
                    state,
                    country,
                    is_active,
                    joined_at,
                    updated_at
                `,
                [
                    userId,
                    cleanName,
                    cleanEmail,
                    cleanPhone,
                    String(address || "").trim() || null,
                    String(lga || "").trim() || null,
                    String(state || "").trim() || null,
                    String(country || "").trim() || null
                ]
            );

        await client.query("COMMIT");

        return res.json({
            success: true,
            message: "Profile updated successfully.",
            user: userResult.rows[0],
            customer: customerResult.rows[0]
        });

    }catch(error){

        await client.query("ROLLBACK");

        console.error(
            "UPDATE ACCOUNT PROFILE ERROR:",
            error
        );

        if(error.code === "23505"){

            return res.status(409).json({
                success: false,
                message:
                    "This email or phone is already in use."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to update profile."
        });

    }finally{

        client.release();

    }

});



// ===========================================
// ADMIN CUSTOMERS
// ===========================================

app.get("/api/admin/customers", async function(req, res){

    try{

        const result = await pool.query(`
            SELECT
                c.id,
                c.user_id,
                c.full_name,
                c.email,
                c.phone,
                c.address,
                COUNT(o.id)::integer AS total_orders,
                COALESCE(
                    SUM(o.total_amount),
                    0
                )::numeric(14,2) AS total_spent,
                c.is_active,
                c.joined_at,
                MAX(o.created_at) AS last_order_at,
                c.created_at,
                c.updated_at
            FROM customers c
            LEFT JOIN orders o
                ON o.customer_id = c.id
                OR (
                    c.email IS NOT NULL
                    AND o.customer_email IS NOT NULL
                    AND LOWER(o.customer_email) =
                        LOWER(c.email)
                )
                OR (
                    c.phone IS NOT NULL
                    AND o.customer_phone = c.phone
                )
            GROUP BY c.id
            ORDER BY c.joined_at DESC
        `);

        return res.json({
            success: true,
            count: result.rows.length,
            customers: result.rows
        });

    }catch(error){

        console.error(
            "GET ADMIN CUSTOMERS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load customers."
        });

    }

});



// ===========================================
// DELETE ADMIN CUSTOMER
// ===========================================

app.delete(
    "/api/admin/customers/:id",
    async function(req, res){

        const customerId =
            Number(req.params.id);

        if(
            !Number.isInteger(customerId) ||
            customerId <= 0
        ){
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID."
            });
        }

        try{

            const result =
                await pool.query(
                    `
                    DELETE FROM customers
                    WHERE id = $1
                    RETURNING id
                    `,
                    [customerId]
                );

            if(result.rowCount === 0){

                return res.status(404).json({
                    success: false,
                    message: "Customer not found."
                });

            }

            return res.json({
                success: true,
                message:
                    "Customer deleted successfully."
            });

        }catch(error){

            console.error(
                "DELETE ADMIN CUSTOMER ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to delete customer."
            });

        }

    }
);



// ===========================================
// GET ADMIN SETTINGS
// ===========================================

app.get(
    "/api/admin/settings",
    async function(req, res){

        try{

            const result =
                await pool.query(`
                    SELECT
                        id,
                        store_name,
                        store_phone,
                        store_whatsapp,
                        store_email,
                        store_address,
                        store_currency,
                        delivery_fee,
                        business_hours,
                        created_at,
                        updated_at
                    FROM admin_settings
                    ORDER BY id ASC
                    LIMIT 1
                `);

            return res.json({
                success: true,
                settings:
                    result.rows[0] || null
            });

        }catch(error){

            console.error(
                "GET ADMIN SETTINGS ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to load admin settings."
            });

        }

    }
);


// ===========================================
// UPDATE ADMIN SETTINGS
// ===========================================

app.put(
    "/api/admin/settings",
    async function(req, res){

        try{

            const {
                storeName,
                storePhone,
                storeWhatsapp,
                storeEmail,
                storeAddress,
                storeCurrency,
                deliveryFee,
                businessHours
            } = req.body;

            const result =
                await pool.query(
                    `
                    UPDATE admin_settings
                    SET
                        store_name = $1,
                        store_phone = $2,
                        store_whatsapp = $3,
                        store_email = $4,
                        store_address = $5,
                        store_currency = $6,
                        delivery_fee = $7,
                        business_hours = $8,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = (
                        SELECT id
                        FROM admin_settings
                        ORDER BY id ASC
                        LIMIT 1
                    )
                    RETURNING *
                    `,
                    [
                        storeName || "JGGL-STORE",
                        storePhone || null,
                        storeWhatsapp || null,
                        storeEmail || null,
                        storeAddress || null,
                        storeCurrency || "₦",
                        Number(deliveryFee || 0),
                        businessHours || null
                    ]
                );

            if(result.rows.length === 0){

                return res.status(404).json({
                    success: false,
                    message:
                        "Admin settings were not found."
                });

            }

            return res.json({
                success: true,
                message:
                    "Settings updated successfully.",
                settings:
                    result.rows[0]
            });

        }catch(error){

            console.error(
                "UPDATE ADMIN SETTINGS ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to update admin settings."
            });

        }

    }
);



// ===========================================
// GET CUSTOMER NOTIFICATIONS
// ===========================================



app.get(
    "/api/notifications",
    authenticateToken,
    async function(req, res){

        try{

            const result =
                await pool.query(
                    `
                    SELECT
                        n.id,
                        n.customer_id,
                        n.order_id,
                        n.title,
                        n.message,
                        n.is_read,
                        n.created_at,
                        o.order_number
                    FROM notifications n

                    JOIN orders o
                        ON o.id = n.order_id

                    WHERE EXISTS (
                        SELECT 1
                        FROM customers c
                        WHERE c.id = o.customer_id
                          AND c.user_id = $1
                    )

                    ORDER BY n.created_at DESC
                    `,
                    [
                        req.user.userId
                    ]
                );

            const unreadCount =
                result.rows.filter(
                    function(notification){
                        return notification.is_read !== true;
                    }
                ).length;

            return res.json({
                success: true,
                count: result.rows.length,
                unreadCount: unreadCount,
                notifications: result.rows
            });

        }catch(error){

            console.error(
                "GET CUSTOMER NOTIFICATIONS ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to load notifications."
            });

        }

    }
);



// ===========================================
// MARK CUSTOMER NOTIFICATIONS AS READ
// ===========================================

app.patch(
    "/api/notifications/read",
    async function(req, res){

        try{

            const email =
                String(req.body.email || "").trim();

            const phone =
                String(req.body.phone || "").trim();

            if(!email && !phone){

                return res.status(400).json({
                    success: false,
                    message:
                        "Customer email or phone is required."
                });

            }

            const result =
                await pool.query(
                    `
                    UPDATE notifications n
                    SET is_read = TRUE
                    FROM orders o
                    WHERE
                        n.order_id = o.id
                        AND
                        (
                            (
                                $1 <> ''
                                AND LOWER(o.customer_email) =
                                    LOWER($1)
                            )
                            OR
                            (
                                $2 <> ''
                                AND o.customer_phone = $2
                            )
                        )
                    RETURNING n.id
                    `,
                    [
                        email,
                        phone
                    ]
                );

            return res.json({
                success: true,
                updatedCount:
                    result.rows.length
            });

        }catch(error){

            console.error(
                "MARK CUSTOMER NOTIFICATIONS READ ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to mark notifications as read."
            });

        }

    }
);


// ===========================================
// DELETE SINGLE CUSTOMER NOTIFICATION
// ===========================================

app.delete(
    "/api/notifications/:id",
    async function(req, res){

        try{

            const notificationId =
                Number(req.params.id);

            const email =
                String(req.query.email || "").trim();

            const phone =
                String(req.query.phone || "").trim();

            if(
                !Number.isInteger(notificationId) ||
                notificationId <= 0
            ){

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid notification ID."
                });

            }

            if(!email && !phone){

                return res.status(400).json({
                    success: false,
                    message:
                        "Customer email or phone is required."
                });

            }

            const result =
                await pool.query(
                    `
                    DELETE FROM notifications n
                    USING orders o
                    WHERE
                        n.id = $1
                        AND n.order_id = o.id
                        AND
                        (
                            (
                                $2 <> ''
                                AND LOWER(o.customer_email) =
                                    LOWER($2)
                            )
                            OR
                            (
                                $3 <> ''
                                AND o.customer_phone = $3
                            )
                        )
                    RETURNING n.id
                    `,
                    [
                        notificationId,
                        email,
                        phone
                    ]
                );

            if(result.rows.length === 0){

                return res.status(404).json({
                    success: false,
                    message:
                        "Notification not found."
                });

            }

            return res.json({
                success: true,
                message:
                    "Notification deleted successfully."
            });

        }catch(error){

            console.error(
                "DELETE CUSTOMER NOTIFICATION ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to delete notification."
            });

        }

    }
);


// ===========================================
// CLEAR CUSTOMER NOTIFICATIONS
// ===========================================

app.delete(
    "/api/notifications",
    async function(req, res){

        try{

            const email =
                String(req.query.email || "").trim();

            const phone =
                String(req.query.phone || "").trim();

            if(!email && !phone){

                return res.status(400).json({
                    success: false,
                    message:
                        "Customer email or phone is required."
                });

            }

            const result =
                await pool.query(
                    `
                    DELETE FROM notifications n
                    USING orders o
                    WHERE
                        n.order_id = o.id
                        AND
                        (
                            (
                                $1 <> ''
                                AND LOWER(o.customer_email) =
                                    LOWER($1)
                            )
                            OR
                            (
                                $2 <> ''
                                AND o.customer_phone = $2
                            )
                        )
                    RETURNING n.id
                    `,
                    [
                        email,
                        phone
                    ]
                );

            return res.json({
                success: true,
                deletedCount:
                    result.rows.length,
                message:
                    "Notifications cleared successfully."
            });

        }catch(error){

            console.error(
                "CLEAR CUSTOMER NOTIFICATIONS ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to clear notifications."
            });

        }

    }
);



// ===========================================
// GET ADMIN NOTIFICATIONS
// ===========================================

app.get(
    "/api/admin/notifications",
    async function(req, res){

        try{

            const result =
                await pool.query(`
                    SELECT
                        n.id,
                        n.customer_id,
                        n.order_id,
                        n.title,
                        n.message,
                        n.is_read,
                        n.admin_is_read,
                        n.admin_is_dismissed,
                        n.created_at,
                        o.order_number
                    FROM notifications n
                    LEFT JOIN orders o
                        ON o.id = n.order_id
                    WHERE n.admin_is_dismissed = FALSE
                    ORDER BY n.created_at DESC
                `);

            const unreadCount =
                result.rows.filter(
                    function(notification){
                        return notification.admin_is_read !== true;
                    }
                ).length;

            return res.json({
                success: true,
                count: result.rows.length,
                unreadCount: unreadCount,
                notifications: result.rows
            });

        }catch(error){

            console.error(
                "GET ADMIN NOTIFICATIONS ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to load notifications."
            });

        }

    }
);


// ===========================================
// MARK ALL ADMIN NOTIFICATIONS AS READ
// ===========================================

app.patch(
    "/api/admin/notifications/read-all",
    async function(req, res){

        try{

            const result =
                await pool.query(
                    `
                    UPDATE notifications
                    SET admin_is_read = TRUE
                    WHERE
                        admin_is_dismissed = FALSE
                        AND admin_is_read = FALSE
                    RETURNING id
                    `
                );

            return res.json({
                success: true,
                updatedCount:
                    result.rows.length,
                message:
                    "Admin notifications marked as read."
            });

        }catch(error){

            console.error(
                "MARK ADMIN NOTIFICATIONS READ ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to mark admin notifications as read."
            });

        }

    }
);


// ===========================================
// CLEAR ADMIN NOTIFICATIONS
// Admin clear must NOT delete customer records.
// ===========================================

app.delete(
    "/api/admin/notifications",
    async function(req, res){

        try{

            const result =
                await pool.query(
                    `
                    UPDATE notifications
                    SET
                        admin_is_read = TRUE,
                        admin_is_dismissed = TRUE
                    WHERE admin_is_dismissed = FALSE
                    RETURNING id
                    `
                );

            return res.json({
                success: true,
                deletedCount:
                    result.rows.length,
                message:
                    "Admin notifications cleared successfully."
            });

        }catch(error){

            console.error(
                "CLEAR ADMIN NOTIFICATIONS ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to clear admin notifications."
            });

        }

    }
);



// ===========================================
// GET SINGLE ADMIN CUSTOMER
// ===========================================

app.get("/api/admin/customers/:id", async function(req, res){

    try{

        const customerId =
            String(req.params.id || "").trim();

        const customerResult =
            await pool.query(
                `
                SELECT
                    c.id,
                    c.user_id,
                    c.full_name,
                    c.email,
                    c.phone,
                    c.address,
                    COUNT(o.id)::integer AS total_orders,
                    COALESCE(
                        SUM(o.total_amount),
                        0
                    )::numeric(14,2) AS total_spent,
                    c.is_active,
                    c.joined_at,
                    MAX(o.created_at) AS last_order_at,
                    c.created_at,
                    c.updated_at
                FROM customers c
                LEFT JOIN orders o
                    ON o.customer_id = c.id
                    OR (
                        c.email IS NOT NULL
                        AND o.customer_email IS NOT NULL
                        AND LOWER(o.customer_email) =
                            LOWER(c.email)
                    )
                    OR (
                        c.phone IS NOT NULL
                        AND o.customer_phone = c.phone
                    )
                WHERE c.id::text = $1
                GROUP BY c.id
                LIMIT 1
                `,
                [customerId]
            );

        if(customerResult.rows.length === 0){

            return res.status(404).json({
                success: false,
                message: "Customer not found."
            });

        }

        const ordersResult =
            await pool.query(
                `
                SELECT
                    id,
                    order_number,
                    status,
                    subtotal,
                    discount_amount,
                    shipping_fee,
                    total_amount,
                    created_at
                FROM orders
                WHERE customer_id = $1
                   OR (
                        customer_email IS NOT NULL
                        AND LOWER(customer_email) =
                            LOWER(
                                COALESCE(
                                    (
                                        SELECT email
                                        FROM customers
                                        WHERE id = $1
                                    ),
                                    ''
                                )
                            )
                   )
                   OR (
                        customer_phone IS NOT NULL
                        AND customer_phone =
                            COALESCE(
                                (
                                    SELECT phone
                                    FROM customers
                                    WHERE id = $1
                                ),
                                ''
                            )
                   )
                ORDER BY created_at DESC
                `,
                [Number(customerId)]
            );

        return res.json({
            success: true,
            customer: {
                ...customerResult.rows[0],
                orders: ordersResult.rows
            }
        });

    }catch(error){

        console.error(
            "GET SINGLE ADMIN CUSTOMER ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load customer details."
        });

    }

});




// ===========================================
// ADMIN ORDERS
// ===========================================

app.get("/api/admin/orders", async function(req, res){

    try{

        const ordersResult =
            await pool.query(`
                SELECT
                    id,
                    order_number,
                    customer_id,
                    status,
                    customer_name,
                    customer_email,
                    customer_phone,
                    customer_address,
                    coupon_code,
                    discount_amount,
                    shipping_state,
                    shipping_fee,
    estimated_delivery,
    payment_method,
    payment_status,
    subtotal,
    total_amount,
                    payment_method,
                    payment_status,
                    notes,
                    created_at,
                    updated_at
                FROM orders
                ORDER BY created_at DESC
            `);

        const itemsResult =
            await pool.query(`
                SELECT
                    id,
                    order_id,
                    product_id,
                    variant_id,
                    product_name,
                    variant_name,
                    quantity,
                    unit_price,
                    subtotal,
                    created_at
                FROM order_items
                ORDER BY id ASC
            `);

        const itemsByOrder = {};

        itemsResult.rows.forEach(function(item){

            const orderId =
                String(item.order_id);

            if(!itemsByOrder[orderId]){
                itemsByOrder[orderId] = [];
            }

            itemsByOrder[orderId].push(item);

        });

        const orders =
            ordersResult.rows.map(function(order){

                return {
                    ...order,
                    items:
                        itemsByOrder[
                            String(order.id)
                        ] || []
                };

            });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders: orders
        });

    }catch(error){

        console.error(
            "Unable to load admin orders:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to load admin orders."
        });

    }

});



// ===========================================
// GET ADMIN ORDER DETAILS
// ===========================================

app.get("/api/admin/orders/:id", async function(req, res){

    try{

        const orderId = req.params.id;

        const orderResult =
            await pool.query(
                `
                SELECT *
                FROM orders
                WHERE
                    id::text = $1
                    OR order_number = $1
                LIMIT 1
                `,
                [String(orderId)]
            );

        if(orderResult.rows.length === 0){

            return res.status(404).json({
                success: false,
                message: "Order not found."
            });

        }

        const itemsResult =
            await pool.query(
                `
                SELECT *
                FROM order_items
                WHERE order_id = $1
                ORDER BY id ASC
                `,
                [orderResult.rows[0].id]
            );

        res.status(200).json({
            success: true,
            order: {
                ...orderResult.rows[0],
                items: itemsResult.rows
            }
        });

    }catch(error){

        console.error(
            "Unable to load order details:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to load order details."
        });

    }

});



// ===========================================
// UPDATE ADMIN PAYMENT STATUS
// ===========================================

app.put(
    "/api/admin/orders/:id/payment-status",
    async function(req, res){

        try{

            const orderId =
                String(req.params.id || "").trim();

            const newPaymentStatus =
                String(
                    req.body.paymentStatus || ""
                ).trim();

            const allowedPaymentStatuses = [
                "Pending",
                "Paid",
                "Failed",
                "Refunded"
            ];

            if(
                !allowedPaymentStatuses.includes(
                    newPaymentStatus
                )
            ){
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid payment status."
                });
            }

            const result =
                await pool.query(
                    `
                    UPDATE orders
                    SET
                        payment_status = $1,
                        updated_at =
                            CURRENT_TIMESTAMP
                    WHERE
                        id::text = $2
                        OR order_number = $2
                    RETURNING *
                    `,
                    [
                        newPaymentStatus,
                        orderId
                    ]
                );

            if(result.rows.length === 0){
                return res.status(404).json({
                    success: false,
                    message: "Order not found."
                });
            }

            return res.json({
                success: true,
                message:
                    "Payment status updated successfully.",
                order: result.rows[0]
            });

        }catch(error){

            console.error(
                "UPDATE PAYMENT STATUS ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to update payment status."
            });
        }

    }
);


// ===========================================
// UPDATE ADMIN ORDER STATUS
// ===========================================

app.put("/api/admin/orders/:id/status", async function(req, res){

    try{

        const orderId =
            req.params.id;

        const newStatus =
            String(req.body.status || "").trim();

        const allowedStatuses = [
            "Pending",
            "Processing",
            "Out for Delivery",
            "Delivered",
            "Cancelled"
        ];

        if(!allowedStatuses.includes(newStatus)){

            return res.status(400).json({
                success: false,
                message: "Invalid order status."
            });

        }

        const currentOrderResult =
            await pool.query(
                `
                SELECT *
                FROM orders
                WHERE
                    id::text = $1
                    OR order_number = $1
                LIMIT 1
                `,
                [
                    String(orderId)
                ]
            );

        if(currentOrderResult.rows.length === 0){

            return res.status(404).json({
                success: false,
                message: "Order not found."
            });

        }

        const currentOrder =
            currentOrderResult.rows[0];

        if(currentOrder.status === newStatus){

            return res.status(200).json({
                success: true,
                unchanged: true,
                message:
                    "Order status is already " +
                    newStatus +
                    ".",
                order: currentOrder
            });

        }

        const result =
            await pool.query(
                `
                UPDATE orders
                SET
                    status = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE
                    id::text = $2
                    OR order_number = $2
                RETURNING *
                `,
                [
                    newStatus,
                    String(orderId)
                ]
            );



const updatedOrder =
    result.rows[0];

let notificationTitle =
    "Order Status Updated";

let notificationMessage =
    "Your order " +
    updatedOrder.order_number +
    " status is now " +
    newStatus +
    ".";

if(newStatus === "Processing"){

    notificationTitle =
        "Order Processing";

    notificationMessage =
        "Your order " +
        updatedOrder.order_number +
        " is now being processed.";

}else if(newStatus === "Out for Delivery"){

    notificationTitle =
        "Order Out for Delivery";

    notificationMessage =
        "Your order " +
        updatedOrder.order_number +
        " is out for delivery.";

}else if(newStatus === "Delivered"){

    notificationTitle =
        "Order Delivered";

    notificationMessage =
        "Your order " +
        updatedOrder.order_number +
        " has been delivered successfully.";

}else if(newStatus === "Cancelled"){

    notificationTitle =
        "Order Cancelled";

    notificationMessage =
        "Your order " +
        updatedOrder.order_number +
        " has been cancelled.";

}

await pool.query(
    `
    INSERT INTO notifications (
        customer_id,
        order_id,
        title,
        message
    )
    VALUES (
        $1,
        $2,
        $3,
        $4
    )
    `,
    [
        updatedOrder.customer_id || null,
        updatedOrder.id,
        notificationTitle,
        notificationMessage
    ]
);



        res.status(200).json({
            success: true,
            message:
                "Order status updated successfully.",
            order: result.rows[0]
        });

    }catch(error){

        console.error(
            "Unable to update order status:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to update order status."
        });

    }

});



// ===========================================
// GET USER CART
// ===========================================

app.get(
    "/api/cart/:userId",
    authenticateToken,
    async function(req, res){

    try{

        const userId =
            Number(req.params.userId);

if(
    req.user.role !== "admin" &&
    Number(req.user.userId) !== userId
){
    return res.status(403).json({
        success: false,
        message: "You are not allowed to access this cart."
    });
}

        if(!Number.isInteger(userId) || userId <= 0){

            return res.status(400).json({
                success: false,
                message: "Valid user ID is required."
            });
        }

        const cartResult =
            await pool.query(
                `
                INSERT INTO carts (
                    user_id
                )
                VALUES ($1)
                ON CONFLICT (user_id)
                DO UPDATE SET
                    updated_at = carts.updated_at
                RETURNING id, user_id
                `,
                [userId]
            );

        const cart =
            cartResult.rows[0];

        const itemsResult =
            await pool.query(
                `
                SELECT
                    id,
                    product_id,
                    variant_id,
                    product_name AS product,
                    image_url AS image,
                    purchase_type AS "purchaseType",
                    quantity,
                    minimum_quantity AS "minimumQuantity",
                    unit_price::float8 AS price
                FROM cart_items
                WHERE cart_id = $1
                ORDER BY id
                `,
                [cart.id]
            );

        return res.json({
            success: true,
            cart_id: cart.id,
            count: itemsResult.rows.length,
            items: itemsResult.rows
        });

    }catch(error){

        console.error(
            "GET USER CART ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load cart."
        });

    }

});



// ===========================================
// ADD ITEM TO USER CART
// ===========================================

app.post(
    "/api/cart/:userId/items",
    authenticateToken,
    async function(req, res){


    const client = await pool.connect();

    try{

        const userId =
            Number(req.params.userId);


if(
    req.user.role !== "admin" &&
    Number(req.user.userId) !== userId
){
    return res.status(403).json({
        success: false,
        message: "You are not allowed to modify this cart."
    });
}


       const {
            productId,
            variantId,
            product,
            image,
            purchaseType,
            quantity,
            minimumQuantity,
            price
        } = req.body;

        const cleanProduct =
            String(product || "").trim();

        const cleanPurchaseType =
            String(purchaseType || "retail")
                .trim()
                .toLowerCase();

        const cleanQuantity =
            Math.max(1, Number(quantity) || 1);

        const cleanMinimumQuantity =
            Math.max(
                1,
                Number(minimumQuantity) || 1
            );

        const cleanPrice =
            Number(price);

        if(
            !Number.isInteger(userId) ||
            userId <= 0
        ){

            return res.status(400).json({
                success: false,
                message: "Valid user ID is required."
            });
        }

        if(
            !cleanProduct ||
            !Number.isFinite(cleanPrice) ||
            cleanPrice < 0
        ){

            return res.status(400).json({
                success: false,
                message:
                    "Product name and valid price are required."
            });
        }

        await client.query("BEGIN");

        // ===========================================
        // NORMALIZE PRODUCT / VARIANT DATABASE IDS
        // ===========================================

        let resolvedProductId = null;
        let resolvedVariantId = null;

        const requestedProductId =
            Number(productId || 0);

        if(
            Number.isInteger(requestedProductId) &&
            requestedProductId > 0
        ){

            const productLookup =
                await client.query(
                    `
                    SELECT id
                    FROM products
                    WHERE
                        id = $1
                        OR frontend_id = $1
                    LIMIT 1
                    `,
                    [requestedProductId]
                );

            if(productLookup.rows.length === 0){

                await client.query("ROLLBACK");

                return res.status(409).json({
                    success: false,
                    message:
                        "Product is no longer available."
                });

            }

            resolvedProductId =
                productLookup.rows[0].id;

        }

        const requestedVariantId =
            Number(variantId || 0);

        if(
            Number.isInteger(requestedVariantId) &&
            requestedVariantId > 0
        ){

            const variantLookup =
                await client.query(
                    `
                    SELECT
                        id,
                        product_id,
                        stock_quantity,
                        is_active
                    FROM product_variants
                    WHERE id = $1
                    LIMIT 1
                    `,
                    [requestedVariantId]
                );

            if(variantLookup.rows.length === 0){

                await client.query("ROLLBACK");

                return res.status(409).json({
                    success: false,
                    message:
                        "Selected product option is unavailable."
                });

            }

            const variant =
                variantLookup.rows[0];

            if(
                variant.is_active !== true ||
                Number(variant.stock_quantity || 0) <= 0
            ){

                await client.query("ROLLBACK");

                return res.status(409).json({
                    success: false,
                    message:
                        "Selected product option is out of stock."
                });

            }

            if(
                resolvedProductId &&
                Number(variant.product_id) !==
                Number(resolvedProductId)
            ){

                await client.query("ROLLBACK");

                return res.status(409).json({
                    success: false,
                    message:
                        "Selected option does not belong to this product."
                });

            }

            resolvedVariantId =
                variant.id;

            if(!resolvedProductId){
                resolvedProductId =
                    variant.product_id;
            }

        }

        const cartResult =
            await client.query(
                `
                INSERT INTO carts (
                    user_id
                )
                VALUES ($1)
                ON CONFLICT (user_id)
                DO UPDATE SET
                    updated_at = CURRENT_TIMESTAMP
                RETURNING id
                `,
                [userId]
            );

        const cartId =
            cartResult.rows[0].id;

        const itemResult =
            await client.query(
                `
                INSERT INTO cart_items (
                    cart_id,
                    product_id,
                    variant_id,
                    product_name,
                    image_url,
                    purchase_type,
                    quantity,
                    minimum_quantity,
                    unit_price
                )
                VALUES (
                    $1, $2, $3, $4, $5,
                    $6, $7, $8, $9
                )
                ON CONFLICT (
                    cart_id,
                    product_name,
                    purchase_type
                )
                DO UPDATE SET
                    product_id = EXCLUDED.product_id,
                    variant_id = EXCLUDED.variant_id,
                    image_url = EXCLUDED.image_url,
                    quantity =
                        cart_items.quantity +
                        EXCLUDED.quantity,
                    minimum_quantity =
                        EXCLUDED.minimum_quantity,
                    unit_price =
                        EXCLUDED.unit_price,
                    updated_at =
                        CURRENT_TIMESTAMP
                RETURNING
                    id,
                    product_id,
                    variant_id,
                    product_name AS product,
                    image_url AS image,
                    purchase_type AS "purchaseType",
                    quantity,
                    minimum_quantity AS "minimumQuantity",
                    unit_price::float8 AS price
                `,
                [
                    cartId,
                    resolvedProductId,
                    resolvedVariantId,
                    cleanProduct,
                    image
                        ? String(image).trim()
                        : null,
                    cleanPurchaseType,
                    cleanQuantity,
                    cleanMinimumQuantity,
                    cleanPrice
                ]
            );

        await client.query(
            `
            UPDATE carts
            SET updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            `,
            [cartId]
        );

        await client.query("COMMIT");

        return res.status(201).json({
            success: true,
            message:
                "Product added to cart successfully.",
            item: itemResult.rows[0]
        });

    }catch(error){

        await client.query("ROLLBACK");

        console.error(
            "ADD CART ITEM ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to add product to cart."
        });

    }finally{

        client.release();

    }

});



// ===========================================
// UPDATE CART ITEM QUANTITY
// ===========================================

app.put(
    "/api/cart/:userId/items/:itemId",
    authenticateToken,
    async function(req, res){


        try{

            const userId =
                Number(req.params.userId);

if(
    req.user.role !== "admin" &&
    Number(req.user.userId) !== userId
){
    return res.status(403).json({
        success: false,
        message: "You are not allowed to modify this cart."
    });
}


            const itemId =
                Number(req.params.itemId);

            const quantity =
                Number(req.body.quantity);

            if(
                !Number.isInteger(userId) ||
                userId <= 0 ||
                !Number.isInteger(itemId) ||
                itemId <= 0 ||
                !Number.isInteger(quantity) ||
                quantity <= 0
            ){

                return res.status(400).json({
                    success: false,
                    message:
                        "Valid user ID, item ID and quantity are required."
                });
            }

            const result =
                await pool.query(
                    `
                    UPDATE cart_items ci
                    SET
                        quantity = GREATEST(
                            $1,
                            ci.minimum_quantity
                        ),
                        updated_at =
                            CURRENT_TIMESTAMP
                    FROM carts c
                    WHERE
                        ci.id = $2
                        AND ci.cart_id = c.id
                        AND c.user_id = $3
                    RETURNING
                        ci.id,
                        ci.product_name AS product,
                        ci.image_url AS image,
                        ci.purchase_type AS "purchaseType",
                        ci.quantity,
                        ci.minimum_quantity AS "minimumQuantity",
                        ci.unit_price::float8 AS price
                    `,
                    [
                        quantity,
                        itemId,
                        userId
                    ]
                );

            if(result.rows.length === 0){

                return res.status(404).json({
                    success: false,
                    message: "Cart item not found."
                });
            }

            return res.json({
                success: true,
                message:
                    "Cart item updated successfully.",
                item: result.rows[0]
            });

        }catch(error){

            console.error(
                "UPDATE CART ITEM ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to update cart item."
            });

        }

    }
);



// ===========================================
// DELETE CART ITEM
// ===========================================


app.delete(
    "/api/cart/:userId/items/:itemId",
    authenticateToken,
    async function(req, res){


        try{

            const userId =
                Number(req.params.userId);


if(
    req.user.role !== "admin" &&
    Number(req.user.userId) !== userId
){
    return res.status(403).json({
        success: false,
        message: "You are not allowed to modify this cart."
    });
}


            const itemId =
                Number(req.params.itemId);

            const result =
                await pool.query(
                    `
                    DELETE FROM cart_items ci
                    USING carts c
                    WHERE
                        ci.id = $1
                        AND ci.cart_id = c.id
                        AND c.user_id = $2
                    RETURNING ci.id
                    `,
                    [
                        itemId,
                        userId
                    ]
                );

            if(result.rows.length === 0){

                return res.status(404).json({
                    success: false,
                    message: "Cart item not found."
                });
            }

            return res.json({
                success: true,
                message:
                    "Cart item removed successfully."
            });

        }catch(error){

            console.error(
                "DELETE CART ITEM ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to remove cart item."
            });

        }

    }
);



// ===========================================
// CLEAR USER CART
// ===========================================

app.delete(
    "/api/cart/:userId",
    authenticateToken,
    async function(req, res){


    try{

        const userId =
            Number(req.params.userId);


if(
    req.user.role !== "admin" &&
    Number(req.user.userId) !== userId
){
    return res.status(403).json({
        success: false,
        message: "You are not allowed to modify this cart."
    });
}


        if(!Number.isInteger(userId) || userId <= 0){

            return res.status(400).json({
                success: false,
                message: "Valid user ID is required."
            });
        }

        const result =
            await pool.query(
                `
                DELETE FROM cart_items
                WHERE cart_id IN (
                    SELECT id
                    FROM carts
                    WHERE user_id = $1
                )
                `,
                [userId]
            );

        return res.json({
            success: true,
            message: "Cart cleared successfully.",
            deleted_count: result.rowCount
        });

    }catch(error){

        console.error(
            "CLEAR USER CART ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to clear cart."
        });

    }

});



// ===========================================
// GET CUSTOMER ORDERS
// ===========================================

app.get(
    "/api/orders",
    authenticateToken,
    async function(req, res){

    try{


        const result = await pool.query(
            `
            SELECT
                o.id,
                o.order_number,
                o.customer_name,
                o.customer_email,
                o.customer_phone,
                o.customer_address,
                o.status,
                o.coupon_code,
                o.discount_amount,
                o.shipping_state,
                o.shipping_fee,
                o.estimated_delivery,
                o.subtotal,
                o.total_amount,
                o.created_at,

                COALESCE(
                    json_agg(



json_build_object(
    'id', oi.id,
    'product', oi.product_name,
    'variant', oi.variant_name,
    'price', oi.unit_price,
    'quantity', oi.quantity,
    'subtotal', oi.subtotal
)



                        ORDER BY oi.id
                    )
                    FILTER (WHERE oi.id IS NOT NULL),
                    '[]'::json
                ) AS items

            FROM orders o

            LEFT JOIN order_items oi
                ON oi.order_id = o.id

WHERE
    EXISTS (
        SELECT 1
        FROM customers c
        WHERE c.id = o.customer_id
          AND c.user_id = $1
    )


   GROUP BY o.id
  ORDER BY o.created_at DESC
   `,

[
    req.user.userId
]

   );

        return res.json({
            success: true,
            count: result.rows.length,
            orders: result.rows
        });

    }catch(error){

        console.error(
            "GET CUSTOMER ORDERS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load customer orders."
        });

    }

});



// ===========================================
// GET SINGLE ORDER
// ===========================================

app.get(
    "/api/orders/:orderNumber",
    authenticateToken,
    async function(req, res){


    try{

        const orderNumber = String(
            req.params.orderNumber || ""
        ).trim();

        if(!orderNumber){

            return res.status(400).json({
                success: false,
                message: "Order number is required."
            });

        }

        const result = await pool.query(
            `
            SELECT
                o.id,
                o.order_number,
                o.customer_name,
                o.customer_email,
                o.customer_phone,
                o.customer_address,
                o.status,
                o.coupon_code,
                o.discount_amount,
                o.shipping_state,
                o.shipping_fee,
                o.estimated_delivery,
                o.subtotal,
                o.total_amount,
                o.payment_method,
                o.payment_status,
                o.notes,
                o.created_at,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', oi.id,
                            'product', oi.product_name,

'image', p.image_url,
                            'variant', oi.variant_name,
                       'price', oi.unit_price,
                            'quantity', oi.quantity,
                            'subtotal', oi.subtotal
                        )
                        ORDER BY oi.id
                    ) FILTER (WHERE oi.id IS NOT NULL),
                    '[]'::json
                ) AS items


FROM orders o

LEFT JOIN order_items oi
    ON oi.order_id = o.id

LEFT JOIN products p
    ON (
        p.id = oi.product_id
        OR (
            oi.product_id IS NULL
            AND LOWER(TRIM(p.product_name)) =
                LOWER(
                    TRIM(
                        REGEXP_REPLACE(
                            oi.product_name,

'\\s*\\((retail|wholesale|bulk)\\)\\s*$',

                            '',
                            'i'
                        )
                    )
                )
        )
    )



WHERE
    o.order_number = $1
    AND (
        $2 = 'admin'
        OR EXISTS (
            SELECT 1
            FROM customers c
            WHERE c.id = o.customer_id
              AND c.user_id = $3
        )
    )
GROUP BY o.id
LIMIT 1

 `,

[
    orderNumber,
    req.user.role,
    Number(req.user.userId)
]
        );


 if(result.rows.length === 0){

            return res.status(404).json({
                success: false,
                message: "Order not found."
            });

        }

        return res.json({
            success: true,
            order: result.rows[0]
        });

    }catch(error){

        console.error(
            "GET SINGLE ORDER ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load order."
        });

    }

});



// ===========================================
// CREATE ORDER
// ===========================================

app.post(
    "/api/orders",
    authenticateToken,
    async function(req, res){

console.log("POST /api/orders endpoint reached");


    const client = await pool.connect();

    try{

        await client.query("BEGIN");

const customerResult =
    await client.query(
        `
        SELECT id
        FROM customers
        WHERE user_id = $1
        LIMIT 1
        `,
        [Number(req.user.userId)]
    );

if(customerResult.rows.length === 0){

    await client.query("ROLLBACK");

    return res.status(404).json({
        success: false,
        message: "Customer profile not found."
    });
}

const customerId =
    customerResult.rows[0].id;



console.log("STEP 1: BEGIN OK");

        const {
            customer,
            items,
            subtotal,
            coupon,
            discount,
            shippingState,
            shippingFee,
            estimatedDelivery,
            paymentMethod,
            paymentStatus,
            total
        } = req.body;

        if(
            !customer ||
            !Array.isArray(items) ||
            items.length === 0
        ){

            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "Invalid order data."
            });

        }

        const orderNumber =
            "JGGL-" + Date.now();

        // ===========================================
        // INVENTORY: VALIDATE + LOCK ORDER PRODUCTS
        // ===========================================

        const inventoryItems = [];

        for(const item of items){

            const requestedQuantity =
                Number(item.quantity);

            if(
                !Number.isInteger(requestedQuantity) ||
                requestedQuantity <= 0
            ){
                const inventoryError =
                    new Error("Invalid product quantity.");

                inventoryError.statusCode = 400;
                throw inventoryError;
            }

            const requestedProductId =
                Number(
                    item.productId ||
                    item.product_id ||
                    0
                );

            let productResult;

            if(
                Number.isInteger(requestedProductId) &&
                requestedProductId > 0
            ){

                productResult =
                    await client.query(
                        `
                        SELECT
                            id,
                            frontend_id,
                            product_name,
                            retail_price,
                            wholesale_price,
                            bulk_price,
                            minimum_wholesale_quantity,
                            minimum_bulk_quantity,
                            stock_quantity,
                            reserved_stock,
                            reorder_level,
                            stock_status,
                            is_active
                        FROM products
                        WHERE
                            id = $1
                            OR frontend_id = $1
                        LIMIT 1
                        FOR UPDATE
                        `,
                        [requestedProductId]
                    );

            }else{

                productResult =
                    await client.query(
                        `
                        SELECT
                            id,
                            frontend_id,
                            product_name,
                            retail_price,
                            wholesale_price,
                            bulk_price,
                            minimum_wholesale_quantity,
                            minimum_bulk_quantity,
                            stock_quantity,
                            reserved_stock,
                            reorder_level,
                            stock_status,
                            is_active
                        FROM products
                        WHERE LOWER(product_name) =
                              LOWER($1)
                        LIMIT 1
                        FOR UPDATE
                        `,
                        [
                            String(
                                item.product || ""
                            ).trim()
                        ]
                    );

            }

            if(productResult.rows.length === 0){

                const inventoryError =
                    new Error(
                        "Product not found or no longer available: " +
                        String(item.product || "Unknown product")
                    );

                inventoryError.statusCode = 409;
                throw inventoryError;
            }

            const product =
                productResult.rows[0];

            if(product.is_active !== true){

                const inventoryError =
                    new Error(
                        product.product_name +
                        " is currently unavailable."
                    );

                inventoryError.statusCode = 409;
                throw inventoryError;
            }

            const availableStock =
                Math.max(
                    0,
                    Number(product.stock_quantity || 0) -
                    Number(product.reserved_stock || 0)
                );

            if(availableStock <= 0){

                const inventoryError =
                    new Error(
                        product.product_name +
                        " is out of stock."
                    );

                inventoryError.statusCode = 409;
                throw inventoryError;
            }

            if(requestedQuantity > availableStock){

                const inventoryError =
                    new Error(
                        product.product_name +
                        " has only " +
                        availableStock +
                        " item(s) available."
                    );

                inventoryError.statusCode = 409;
                throw inventoryError;
            }

            const purchaseType =
                String(
                    item.purchaseType ||
                    item.purchase_type ||
                    "retail"
                )
                    .trim()
                    .toLowerCase();

            let serverPrice =
                Number(product.retail_price || 0);

            let minimumQuantity = 1;

            if(purchaseType === "wholesale"){

                serverPrice =
                    Number(
                        product.wholesale_price ||
                        product.retail_price ||
                        0
                    );

                minimumQuantity =
                    Math.max(
                        1,
                        Number(
                            product.minimum_wholesale_quantity ||
                            1
                        )
                    );

            }else if(purchaseType === "bulk"){

                serverPrice =
                    Number(
                        product.bulk_price ||
                        product.wholesale_price ||
                        product.retail_price ||
                        0
                    );

                minimumQuantity =
                    Math.max(
                        1,
                        Number(
                            product.minimum_bulk_quantity ||
                            1
                        )
                    );

            }

            if(requestedQuantity < minimumQuantity){

                const inventoryError =
                    new Error(
                        product.product_name +
                        " requires minimum quantity " +
                        minimumQuantity +
                        " for " +
                        purchaseType +
                        " purchase."
                    );

                inventoryError.statusCode = 409;
                throw inventoryError;
            }

            const requestedVariantId =
                Number(
                    item.variantId ||
                    item.variant_id ||
                    0
                );

            let selectedVariant = null;

            if(
                Number.isInteger(requestedVariantId) &&
                requestedVariantId > 0
            ){

                const variantResult =
                    await client.query(
                        `
                        SELECT
                            id,
                            product_id,
                            variant_name,
                            retail_price,
                            wholesale_price,
                            bulk_price,
                            stock_quantity,
                            is_active
                        FROM product_variants
                        WHERE
                            id = $1
                            AND product_id = $2
                        LIMIT 1
                        FOR UPDATE
                        `,
                        [
                            requestedVariantId,
                            product.id
                        ]
                    );

                if(variantResult.rows.length === 0){

                    const inventoryError =
                        new Error(
                            product.product_name +
                            " selected variant is not available."
                        );

                    inventoryError.statusCode = 409;
                    throw inventoryError;
                }

                selectedVariant =
                    variantResult.rows[0];

                if(selectedVariant.is_active !== true){

                    const inventoryError =
                        new Error(
                            product.product_name +
                            " selected variant is unavailable."
                        );

                    inventoryError.statusCode = 409;
                    throw inventoryError;
                }

                const variantStock =
                    Math.max(
                        0,
                        Number(
                            selectedVariant.stock_quantity || 0
                        )
                    );

                if(variantStock <= 0){

                    const inventoryError =
                        new Error(
                            product.product_name +
                            " selected variant is out of stock."
                        );

                    inventoryError.statusCode = 409;
                    throw inventoryError;
                }

                if(requestedQuantity > variantStock){

                    const inventoryError =
                        new Error(
                            product.product_name +
                            " selected variant has only " +
                            variantStock +
                            " item(s) available."
                        );

                    inventoryError.statusCode = 409;
                    throw inventoryError;
                }

                if(purchaseType === "wholesale"){

                    serverPrice =
                        Number(
                            selectedVariant.wholesale_price ||
                            product.wholesale_price ||
                            product.retail_price ||
                            0
                        );

                }else if(purchaseType === "bulk"){

                    serverPrice =
                        Number(
                            selectedVariant.bulk_price ||
                            product.bulk_price ||
                            product.wholesale_price ||
                            product.retail_price ||
                            0
                        );

                }else{

                    serverPrice =
                        Number(
                            selectedVariant.retail_price ||
                            product.retail_price ||
                            0
                        );

                }

            }

            inventoryItems.push({
                productId:
                    product.id,
                variantId:
                    selectedVariant
                        ? selectedVariant.id
                        : null,
                variantName:
                    selectedVariant
                        ? selectedVariant.variant_name
                        : null,
                productName:
                    product.product_name,
                quantity:
                    requestedQuantity,
                unitPrice:
                    serverPrice,
                purchaseType:
                    purchaseType,
                reorderLevel:
                    Math.max(
                        0,
                        Number(product.reorder_level || 0)
                    )
            });

        }

        const orderResult =
            await client.query(
                `

INSERT INTO orders (
    order_number,
    customer_id,
    customer_name,
    customer_email,
    customer_phone,
    customer_address,
    status,
    coupon_code,
    discount_amount,
    shipping_state,
    shipping_fee,
    estimated_delivery,
    payment_method,
    payment_status,
    subtotal,
    total_amount
)


VALUES (
    $1,$2,$3,$4,$5,$6,
    'Pending',
    $7,$8,$9,$10,$11,
    $12,$13,$14,$15
)


  RETURNING id, order_number
                `,
[
    orderNumber,
    customerId,
    customer.name,
    customer.email,
    customer.phone,
    customer.address,
    coupon || null,
    Number(discount || 0),
    shippingState || null,
    Number(shippingFee || 0),
    estimatedDelivery || null,
    paymentMethod || "Cash on Delivery",
    paymentStatus || "Pending",
    Number(subtotal || 0),
    Number(total || 0)
]

    );


console.log("STEP 2: ORDER INSERTED");
        const orderId =
            orderResult.rows[0].id;

        for(const item of inventoryItems){

            await client.query(
                `
                INSERT INTO order_items (
                    order_id,
                    product_id,
                    variant_id,
                    product_name,
                    variant_name,
                    quantity,
                    unit_price,
                    subtotal
                )
                VALUES (
                    $1,$2,$3,$4,$5,$6,$7,$8
                )
                `,
                [
                    orderId,
                    item.productId,
                    item.variantId,
                    item.productName,
                    item.variantName,
                    item.quantity,
                    item.unitPrice,
                    item.unitPrice *
                    item.quantity
                ]
            );

            if(item.variantId){

                await client.query(
                    `
                    UPDATE product_variants
                    SET
                        stock_quantity =
                            stock_quantity - $1,
                        updated_at =
                            CURRENT_TIMESTAMP
                    WHERE id = $2
                    `,
                    [
                        item.quantity,
                        item.variantId
                    ]
                );

            }

            const updatedStockResult =
                await client.query(
                    `
                    UPDATE products
                    SET
                        stock_quantity =
                            stock_quantity - $1,

                        stock_status =
                            CASE
                                WHEN stock_quantity - $1 <= 0
                                    THEN 'Out of Stock'

                                WHEN reorder_level > 0
                                     AND stock_quantity - $1 <= reorder_level
                                    THEN 'Low Stock'

                                ELSE 'In Stock'
                            END,

                        updated_at =
                            CURRENT_TIMESTAMP
                    WHERE id = $2
                    RETURNING
                        id,
                        product_name,
                        stock_quantity,
                        reorder_level,
                        stock_status
                    `,
                    [
                        item.quantity,
                        item.productId
                    ]
                );

            const updatedProduct =
                updatedStockResult.rows[0];

            console.log(
                "INVENTORY UPDATED:",
                updatedProduct.product_name,
                "stock:",
                updatedProduct.stock_quantity,
                "status:",
                updatedProduct.stock_status
            );

            if(
                updatedProduct.stock_status === "Low Stock" ||
                updatedProduct.stock_status === "Out of Stock"
            ){

                const inventoryTitle =
                    updatedProduct.stock_status === "Out of Stock"
                        ? "Product Out of Stock"
                        : "Low Stock Alert";

                const inventoryMessage =
                    updatedProduct.product_name +
                    " now has " +
                    updatedProduct.stock_quantity +
                    " item(s) remaining.";

                const duplicateCheck =
                    await client.query(
                        `
                        SELECT id
                        FROM notifications
                        WHERE
                            customer_id IS NULL
                            AND order_id IS NULL
                            AND title = $1
                            AND message = $2
                            AND admin_is_read = FALSE
                            AND admin_is_dismissed = FALSE
                        LIMIT 1
                        `,
                        [
                            inventoryTitle,
                            inventoryMessage
                        ]
                    );

                if(duplicateCheck.rows.length === 0){

                    await client.query(
                        `
                        INSERT INTO notifications (
                            customer_id,
                            order_id,
                            title,
                            message,
                            is_read
                        )
                        VALUES (
                            NULL,
                            NULL,
                            $1,
                            $2,
                            FALSE
                        )
                        `,
                        [
                            inventoryTitle,
                            inventoryMessage
                        ]
                    );

                }

            }

        }


console.log("STEP 3: ITEMS INSERTED");


await client.query(
    `
    INSERT INTO notifications (
        customer_id,
        order_id,
        title,
        message
    )
    VALUES ($1, $2, $3, $4)
    `,
    [


    customerId,
    orderId,

        "Order Received",
        "Your order " +
            orderNumber +
            " has been received successfully."
    ]
);

console.log("STEP 3B: NOTIFICATION INSERTED");

        await client.query("COMMIT");

console.log("STEP 4: COMMIT OK");

        res.status(201).json({
            success: true,
            orderId: orderId,
            orderNumber:
                orderResult.rows[0].order_number
        });

    }catch(error){

        await client.query("ROLLBACK");


console.error(
    "CREATE ORDER ERROR:",
    error
);


        res.status(
            Number(error.statusCode) || 500
        ).json({
            success: false,



message:
    error.message


        });

    }finally{

        client.release();

    }

});





// API endpoint da bai wanzu ba.
app.use("/api", function(req, res){
    res.status(404).json({
        success: false,
        message: "API endpoint not found."
    });
});





app.listen(PORT, "0.0.0.0", function(){
    console.log(
        `JGGL-STORE server running at http://127.0.0.1:${PORT}`
    );
});
