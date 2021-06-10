# dbex
database explorer plugin for atom ide

## TODO
- clone datamodel folder into engine plugin (so files are always synced with core) -- need to be a kind of base engine which will be forked and updated as needed;
- execute query from selected text (opened file or query area)
- select opened databases from statusbar, so selected query with hotkey can automatically run based on that
- fix scrolling on result table
- fix action buttons styling on tree items
- generate log from all queries
- create connection action for refresh

## Would be nice
- autocomplete on query area
- custom plugins for query area (ex.: action buttons)
- custom plugins for result area (ex.: exporter)
- engine plugins automatically install dbex core
- load lates queries from connection
- colored tabs/result (defined on connection), se user knows by color which db it is working on
- edit result directly on table result
- loading/processing request on tree item that was double clicked
- status bar with time taken by query, or records updated (engine must send messages to be shown)
- input for filter treeview by name
- show time taken from last query (or while querying)

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
