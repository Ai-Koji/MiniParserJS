
CREATE TABLE wb_tariffs_history (
    id SERIAL PRIMARY KEY,
    warehouse_name VARCHAR(255) NOT NULL,
    geo_name VARCHAR(255) NOT NULL,
    box_delivery_base DECIMAL(10,2),
    box_delivery_liter DECIMAL(10,2),
    box_storage_base DECIMAL(10,2),
    box_storage_liter DECIMAL(10,2),
    box_delivery_coef_expr VARCHAR(50),
    box_storage_coef_expr VARCHAR(50)
);