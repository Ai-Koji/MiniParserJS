const knex = require('knex');
const knexfile = require('./knexfile');
const config = require('./config')


const path = require('node:path'); 
const  process = require('node:process');
const  {authenticate} = require('@google-cloud/local-auth');
const  {google} = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

async function writeDataSheet(auth) {
  console.log("start writing to google tables");

  const sheets = google.sheets({ version: 'v4', auth: auth });
  const spreadsheetId = config.SHEET_ID;
  
  try {
    const dbData = await DATABASE('wb_tariffs_boxes_history')
      .select(
        'warehouse_name',
        'geo_name', 
        'box_delivery_base',
        'box_delivery_liter',
        'box_storage_base',
        'box_storage_liter',
        'box_delivery_coef_expr',
        'tariff_date'
      )
      .where('tariff_date', '>=', new Date(new Date().setDate(new Date().getDate() - 1))) // данные за последние сутки
      .orderBy('box_delivery_coef_expr', 'asc'); // сортировка по возрастанию коэффициента

    if (!dbData || dbData.length === 0) {
      console.log('No data found in database');
      return;
    }

    const values = [
      // Заголовки столбцов
      [
        'Склад', 
        'Регион', 
        'Тариф доставки (база)', 
        'Тариф доставки (литр)', 
        'Тариф хранения (база)', 
        'Тариф хранения (литр)', 
        'Коэффициент доставки',
        'Дата тарифа'
      ],
      // Данные из БД
      ...dbData.map(row => [
        row.warehouse_name,
        row.geo_name,
        row.box_delivery_base,
        row.box_delivery_liter,
        row.box_storage_base,
        row.box_storage_liter,
        row.box_delivery_coef_expr,
        new Date(row.tariff_date).toLocaleDateString('ru-RU')
      ])
    ];

    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: config.SHEET_NAME + '!A:H',
    });

    const request = {
      spreadsheetId,
      range: config.SHEET_NAME + '!A1',
      valueInputOption: 'RAW',
      resource: { values },
    };

    const response = await sheets.spreadsheets.values.update(request);
    console.log('Данные успешно записаны в Google Sheets:', response.data.updatedRows + ' строк обновлено');
    
  } catch (error) {
    console.error('Ошибка при записи в Google Sheets:', error);
    throw error;
  }
}

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
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log("starting script");

  while (true) {
    try {
      now = new Date()
      
      dateNow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

      let res = await get_boxes(dateNow);
      let warehouseList = res.response.data.warehouseList
      try {
        save_data(warehouseList, dateNow)
      } catch (error) {
        console.log(`ERROR:`, error);
      }

      db_res = await DATABASE('wb_tariffs_boxes_history').select();    
    } catch (error) {
      console.error("ERROR:", error);
    }
    console.log("waiting a hour")
    await delay(60*60*1000);
  }
  console.log("end of script")
}

main();
