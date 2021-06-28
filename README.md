# dbex
database explorer plugin for atom ide

## TODO
- fix grid scroll on first and last records (actually hidden by the theader/atom footer)
- move cursor on grid result when clicked
- move cursor on grid result when pgup pgdown
- on data-table, add col types to cells, so it can be styled on css (number, alignment, color, etc)
- add first column as index (1,2,3...)
- set "null" cells innerHTML as css content (if possible).
- clone datamodel folder into engine plugin (so files are always synced with core) -- need to be a kind of base engine which will be forked and updated as needed;
- create connection action for refresh
- destroy all the created elements when closing tab
- cleanup code

## Would be nice
- edit result directly on table result
- custom plugins for query area (ex.: action buttons)
- custom plugins for result area (ex.: exporter)
- engine plugins automatically install dbex core
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
