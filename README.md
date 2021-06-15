# dbex
database explorer plugin for atom ide

## TODO
- clone datamodel folder into engine plugin (so files are always synced with core) -- need to be a kind of base engine which will be forked and updated as needed;
- create connection action for refresh
- destroy all the created elements when closing tab
- cleanup code

## Would be nice
- autocomplete on query area
- custom plugins for query area (ex.: action buttons)
- custom plugins for result area (ex.: exporter)
- engine plugins automatically install dbex core
- load latest queries from connection
- edit result directly on table result
- loading/processing request on tree item that was double clicked
- status bar with time taken by query, or records updated (engine must send messages to be shown)
- input for filter treeview by name
- show time taken from last query (or while querying)
- alert before processing results greather than 1k
- hide query window when result not have query
- hide data result when there is no data on result
- click on status bar open query window (dbexResult)
- identify query executed from textEditor and replace or create new result tab (uuid or title)
- draggable connections to reorder in tree-view
- on edit connection, replace entry at same position instead of in the end


### Additional modules
- export result as csv
- auto indent query
  https://github.com/zeroturnaround/sql-formatter
  https://github.com/kufii/sql-formatter-plus
  https://www.sqlstyle.guide/
- draw db diagram
  https://dshifflet.com/erd/
  https://github.com/antuane/js-diagram-chart
  https://github.com/mermaid-js/mermaid
  https://github.com/DavidBanksNZ/simple-diagram-js
  https://visjs.org/
  https://github.com/clientIO/joint
  https://github.com/dagrejs/dagre
    https://github.com/dagrejs/dagre/wiki
    https://www.nomnoml.com/
- SQLite engine
  https://www.npmjs.com/package/sqlite3
- MariaDB engine
  https://preview.npmjs.com/package/mariadb
- Kafka
  https://www.npmjs.com/package/kafkajs/v/1.12.0
- PostgreSQL
  https://www.npmjs.com/package/postgres
