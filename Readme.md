# Wildberries парсер

## Гайд по запуску

WB API:
- добавить апи ключ в config.js/TOKEN

Google sheets:
- требуется создать google cloud, скачать json клиента для OAuth авторизации и закинуть в src под именем credentials.json
- разрешить google sheets api
- создать google таблицу, измените название листа на WB_box_tariffs(можно изменить в конфиге)
- скопировать id таблицы и вставить в config.js


сам запуск:
```bash
docker-compose up -d
```