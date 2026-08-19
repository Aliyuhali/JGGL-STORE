const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

require("dotenv").config();

const pool = require("./db");

const productsFile =
    path.resolve(__dirname, "../products-data.js");

function loadProducts(){

    const source =
        fs.readFileSync(productsFile, "utf8") +
        "\n;globalThis.__PRODUCTS__ = PRODUCTS;";

    const sandbox = {};

    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, {
        filename: productsFile
    });

    if(!Array.isArray(sandbox.__PRODUCTS__)){
        throw new Error("PRODUCTS array was not found.");
    }

    return sandbox.__PRODUCTS__;
}

function productSku(product){

    return product.sku ||
        `JGGL-PRODUCT-${product.id}`;
}

function numberValue(value, fallback = 0){

    const parsed = Number(value);

    return Number.isFinite(parsed)
        ? parsed
        : fallback;
}

async function syncMetadata(){

    const products = loadProducts();
    const client = await pool.connect();

    try{

        await client.query("BEGIN");

        for(const product of products){

            await client.query(
                `
                UPDATE products
                SET
                    frontend_id = $1,
                    product_group = $2,
                    rating = $3,
                    discount = $4,
                    specifications = $5::jsonb,
                    related_frontend_ids = $6::integer[],
                    stock_status = $7,
                    reserved_stock = $8,
                    reorder_level = $9,
                    minimum_wholesale_quantity = $10,
                    minimum_bulk_quantity = $11,
                    updated_at = CURRENT_TIMESTAMP
                WHERE sku = $12
                `,
                [
                    numberValue(product.id),
                    product.group || null,
                    numberValue(product.rating),
                    numberValue(product.discount),
                    JSON.stringify(
                        product.specifications || {}
                    ),
                    Array.isArray(product.related)
                        ? product.related.map(Number)
                        : [],
                    product.stockStatus || null,
                    numberValue(product.reservedStock),
                    numberValue(product.reorderLevel),

                    numberValue(
                        product.wholesaleMinQty,
                        1
                    ),

                    numberValue(
                        product.bulkMinQty,
                        1
                    ),

                    productSku(product)
                ]
            );
        }

        await client.query("COMMIT");

        console.log(
            `Synchronized metadata for ${products.length} products.`
        );

    }catch(error){

        await client.query("ROLLBACK");

        console.error(
            "Metadata synchronization failed:",
            error
        );

        process.exitCode = 1;

    }finally{

        client.release();
        await pool.end();
    }
}

syncMetadata();
