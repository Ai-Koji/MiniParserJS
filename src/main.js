const knex = require('knex');
const knexfile = require('./knexfile');
const config = require('./config')

const DATABASE = knex(knexfile.production);

async function get_boxes(date) {
  console.log("getting records from wb")
  try {
    let url = "https://common-api.wildberries.ru/api/v1/tariffs/box?date=";
    const response = await fetch(url + date, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${config.TOKEN}`,
        "Content-Type": "application/json"
      }
    });
    
    if (!response.ok) {
      throw new Error(`status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("fetching error:", error);
    throw error;
  }
}

async function save_data(warehouseList, date) {  
  date = new Date(date);
  console.log("saving records to wb")

  for (i = 0; i < warehouseList.length; i++) {
    existed_records = await DATABASE('wb_tariffs_boxes_history').select().where('tariff_date', date).andWhere('warehouse_name', warehouseList[i].warehouseName);

    warehouseList[i].geoName = "hello"
    if (existed_records.length != 0) {
      if (existed_records.length > 1)
        console.log("WARNING: same date and name record in the db")

      await DATABASE('wb_tariffs_boxes_history').update({
        geo_name: warehouseList[i].geoName,
        box_delivery_base: warehouseList[i].box_delivery_base,
        box_delivery_liter: warehouseList[i].box_delivery_liter,
        box_storage_base: warehouseList[i].box_storage_base,
        box_storage_liter: warehouseList[i].box_storage_liter,
        box_delivery_coef_expr: warehouseList[i].box_delivery_coef_expr,
        box_storage_coef_expr: warehouseList[i].box_storage_coef_expr
      }).where('tariff_date', date).andWhere('warehouse_name', 'Цифровой склад');
    }
    else
      await DATABASE('wb_tariffs_boxes_history').insert({
        warehouse_name: warehouseList[i].warehouseName,
        geo_name: warehouseList[i].geoName,
        tariff_date: date,
        box_delivery_base: warehouseList[i].box_delivery_base,
        box_delivery_liter: warehouseList[i].box_delivery_liter,
        box_storage_base: warehouseList[i].box_storage_base,
        box_storage_liter: warehouseList[i].box_storage_liter,
        box_delivery_coef_expr: warehouseList[i].box_delivery_coef_expr,
        box_storage_coef_expr: warehouseList[i].box_storage_coef_expr
      });
  }
}

async function main() {
  try {
    let res = await get_boxes("2025-11-24");
    let warehouseList = res.response.data.warehouseList

    // console.log(warehouseList);
    save_data(warehouseList, "2025-11-24")

    // console.log(":", res.response.data.warehouseList);
  
  } catch (error) {
    console.error("Failed to get boxes:", error);
  }
}

main();