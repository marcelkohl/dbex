# dbex
database explorer plugin for atom ide

## TODO
- openning log is failing when tabs are opened from history. It is opening log file for the connection name instead of the node.name expected;
- clone datamodel folder into engine plugin (so files are always synced with core) -- need to be a kind of base engine which will be forked and updated as needed;
- create connection action for refresh
- destroy all the created elements when closing tab
- cleanup code
- engine plugins automatically install dbex core

## Would be nice
- edit result directly on table result
- custom plugins for query area (ex.: action buttons)
- custom plugins for result area (ex.: exporter)
- on edit connection, replace entry at same position instead of in the end
- draggable connections to reorder in tree-view
- autocomplete on query area
- identify query executed from textEditor and replace or create new result tab (uuid or title)
- add promise on dbex side to avoid engine blocking atom

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
