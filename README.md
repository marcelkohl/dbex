# dbex
A hackable database explorer for Atom Editor

## TODO
- edit result directly on table result (engine result must have a list of cols/references to send on confirm edit. ex.: mysql is the pk col name)
- engine plugins automatically install dbex core
- clone datamodel folder into engine plugin (so files are always synced with core) -- need to be a kind of base engine which will be forked and updated as needed;

## Would be nice
- show divider between query and result (where we can see easily where to drag to resize)
- custom plugins for query area (ex.: action buttons)
- custom plugins for result area (ex.: exporter)
- on edit connection, replace entry at same position instead of in the end
- draggable connections to reorder in tree-view
- autocomplete on query area
- identify query executed from textEditor and replace or create new result tab (uuid or title), not on a generic tab
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
