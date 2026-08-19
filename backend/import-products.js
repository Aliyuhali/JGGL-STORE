const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

require("dotenv").config();

const pool = require("./db");

const productsFile =
    path.resolve(__dirname, "../products-data.js");

function numberOrFallback(value, fallback = 0){
    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
}

function textOrNull(value){
    if(value === undefined || value === null){
        return null;
    }

    const text = String(value).trim();

    return text === ""
        ? null
        : text;
}

function createProductSku(product){
    if(product.sku){
        return String(product.sku);
    }

    return `JGGL-PRODUCT-${product.id}`;
}

function createVariantSku(product, variant, index){
    if(variant.sku){
        return String(variant.sku);
    }

    return (
        createProductSku(product) +
        "-VAR-" +
        String(variant.id || index + 1)
            .toUpperCase()
            .replace(/[^A-Z0-9]+/g, "-")
    );
}

async function loadProducts(){

    const source =
        fs.readFileSync(productsFile, "utf8") +
        "\n;globalThis.__JGGL_PRODUCTS__ = PRODUCTS;";

    const sandbox = {};

    vm.createContext(sandbox);

    vm.runInContext(
        source,
        sandbox,
        {
            filename: productsFile
        }
    );

    const products =
        sandbox.__JGGL_PRODUCTS__;

    if(!Array.isArray(products)){
        throw new Error(
            "PRODUCTS array was not found in products-data.js"
        );
    }

    return products;
}

async function importProducts(){

    const products =
        await loadProducts();

    const client =
        await pool.connect();

    try{

        await client.query("BEGIN");

        let importedProducts = 0;
        let importedVariants = 0;

        for(const product of products){

            const retailPrice =
                numberOrFallback(
                    product.retailPrice ??
                    product.price,
                    0
                );

            const wholesalePrice =
                numberOrFallback(
                    product.wholesalePrice,
                    retailPrice
                );

            const bulkPrice =
                numberOrFallback(
                    product.bulkPrice,
                    wholesalePrice
                );

            const productSku =
                createProductSku(product);

            const productResult =
                await client.query(
                    `
                    INSERT INTO products (
                        product_name,
                        category,
                        brand,
                        sku,
                        description,
                        image_url,
                        retail_price,
                        wholesale_price,
                        bulk_price,
                        stock_quantity,
                        minimum_wholesale_quantity,
                        minimum_bulk_quantity,
                        is_active
                    )
                    VALUES (
                        $1, $2, $3, $4, $5, $6,
                        $7, $8, $9, $10, $11, $12, TRUE
                    )
                    ON CONFLICT (sku)
                    DO UPDATE SET
                        product_name = EXCLUDED.product_name,
                        category = EXCLUDED.category,
                        brand = EXCLUDED.brand,
                        description = EXCLUDED.description,
                        image_url = EXCLUDED.image_url,
                        retail_price = EXCLUDED.retail_price,
                        wholesale_price = EXCLUDED.wholesale_price,
                        bulk_price = EXCLUDED.bulk_price,
                        stock_quantity = EXCLUDED.stock_quantity,
                        minimum_wholesale_quantity =
                            EXCLUDED.minimum_wholesale_quantity,
                        minimum_bulk_quantity =
                            EXCLUDED.minimum_bulk_quantity,
                        is_active = TRUE,
                        updated_at = CURRENT_TIMESTAMP
                    RETURNING id
                    `,
                    [
                        product.name,
                        product.category || "Uncategorized",
                        textOrNull(product.brand),
                        productSku,
                        textOrNull(product.description),
                        textOrNull(product.image),
                        retailPrice,
                        wholesalePrice,
                        bulkPrice,
                        numberOrFallback(product.stock, 0),
                        numberOrFallback(
                            product.minimumWholesaleQuantity ??
                            product.wholesaleMinimumQuantity,
                            1
                        ),
                        numberOrFallback(
                            product.minimumBulkQuantity ??
                            product.bulkMinimumQuantity,
                            1
                        )
                    ]
                );

            const databaseProductId =
                productResult.rows[0].id;

            importedProducts += 1;

            const variants =
                Array.isArray(product.variants)
                    ? product.variants
                    : [];

            for(
                let index = 0;
                index < variants.length;
                index += 1
            ){

                const variant =
                    variants[index];

                const variantRetailPrice =
                    numberOrFallback(
                        variant.retailPrice ??
                        variant.price,
                        retailPrice
                    );

                const variantWholesalePrice =
                    numberOrFallback(
                        variant.wholesalePrice,
                        wholesalePrice
                    );

                const variantBulkPrice =
                    numberOrFallback(
                        variant.bulkPrice,
                        bulkPrice
                    );

                const variantName =
                    variant.name ||
                    [
                        variant.color,
                        variant.storage,
                        variant.ram,
                        variant.weight,
                        variant.packSize
                    ]
                        .filter(Boolean)
                        .join(" / ") ||
                    String(
                        variant.id ||
                        `Variant ${index + 1}`
                    );

                await client.query(
                    `
                    INSERT INTO product_variants (
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
                    )
                    VALUES (
                        $1, $2, $3, $4, $5, $6, $7,
                        $8, $9, $10, $11, $12, $13,
                        $14::jsonb, TRUE
                    )
                    ON CONFLICT (sku)
                    DO UPDATE SET
                        product_id = EXCLUDED.product_id,
                        variant_name = EXCLUDED.variant_name,
                        color = EXCLUDED.color,
                        storage = EXCLUDED.storage,
                        ram = EXCLUDED.ram,
                        weight = EXCLUDED.weight,
                        pack_size = EXCLUDED.pack_size,
                        retail_price = EXCLUDED.retail_price,
                        wholesale_price =
                            EXCLUDED.wholesale_price,
                        bulk_price = EXCLUDED.bulk_price,
                        stock_quantity =
                            EXCLUDED.stock_quantity,
                        image_url = EXCLUDED.image_url,
                        specifications =
                            EXCLUDED.specifications,
                        is_active = TRUE,
                        updated_at = CURRENT_TIMESTAMP
                    `,
                    [
                        databaseProductId,
                        variantName,
                        createVariantSku(
                            product,
                            variant,
                            index
                        ),
                        textOrNull(variant.color),
                        textOrNull(variant.storage),
                        textOrNull(variant.ram),
                        textOrNull(variant.weight),
                        textOrNull(
                            variant.packSize ??
                            variant.pack_size
                        ),
                        variantRetailPrice,
                        variantWholesalePrice,
                        variantBulkPrice,
                        numberOrFallback(
                            variant.stock,
                            product.stock || 0
                        ),
                        textOrNull(
                            variant.image ||
                            product.image
                        ),
                        JSON.stringify(
                            variant.specifications ||
                            variant.specs ||
                            {}
                        )
                    ]
                );

                importedVariants += 1;
            }
        }

        await client.query("COMMIT");

        console.log(
            `Imported ${importedProducts} products.`
        );

        console.log(
            `Imported ${importedVariants} variants.`
        );

    }catch(error){

        await client.query("ROLLBACK");

        console.error(
            "Product import failed:",
            error
        );

        process.exitCode = 1;

    }finally{

        client.release();
        await pool.end();
    }
}

importProducts();
