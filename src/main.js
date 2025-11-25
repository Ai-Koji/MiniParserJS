const knex = require('knex');
const knexfile = require('./knexfile');

const db = knex(knexfile.development);
module.exports = db;


const token = "";


async function get_boxes(date) {
  try {
    let url = "https://common-api.wildberries.ru/api/v1/tariffs/box?date=";
    const response = await fetch(url + date, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
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

// Правильное использование async/await
async function main() {
  try {
    const res = await get_boxes("2025-11-24");
    console.log("Response:", res);
    
    console.log("Formatted response:", JSON.stringify(res, null, 2));
    
    if (res.response && res.response.data) {
      console.log("Warehouses count:", res.response.data.warehouseList.length);
      console.log("Valid until:", res.response.data.dtTillMax);
    }
  } catch (error) {
    console.error("Failed to get boxes:", error);
  }
}

main();