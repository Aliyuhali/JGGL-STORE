BEGIN;

CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    supplier_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(150),
    phone VARCHAR(40),
    email VARCHAR(150),
    address TEXT,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    purchase_order_number VARCHAR(60) NOT NULL UNIQUE,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'Pending',
    payment_status VARCHAR(30) NOT NULL DEFAULT 'Unpaid',

    subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    additional_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_cost NUMERIC(14,2) NOT NULL DEFAULT 0,

    order_date TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expected_date TIMESTAMP WITHOUT TIME ZONE,
    received_at TIMESTAMP WITHOUT TIME ZONE,

    notes TEXT,

    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,

    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
    id SERIAL PRIMARY KEY,
    purchase_order_id INTEGER NOT NULL
        REFERENCES purchase_orders(id) ON DELETE CASCADE,

    product_id INTEGER NOT NULL
        REFERENCES products(id) ON DELETE RESTRICT,

    variant_id INTEGER
        REFERENCES product_variants(id) ON DELETE SET NULL,

    product_name VARCHAR(200) NOT NULL,
    variant_name VARCHAR(150),

    quantity INTEGER NOT NULL CHECK (quantity > 0),
    received_quantity INTEGER NOT NULL DEFAULT 0
        CHECK (received_quantity >= 0),

    unit_cost NUMERIC(14,2) NOT NULL CHECK (unit_cost >= 0),
    line_total NUMERIC(14,2) NOT NULL CHECK (line_total >= 0),

    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id
ON purchase_orders(supplier_id);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_status
ON purchase_orders(status);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_date
ON purchase_orders(order_date);

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_purchase_order_id
ON purchase_order_items(purchase_order_id);

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_product_id
ON purchase_order_items(product_id);

COMMIT;
