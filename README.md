# dbex
database explorer plugin for atom ide

## TODO
- clone datamodel folder into engine plugin (so files are always synced with core) -- need to be a kind of base engine which will be forked and updated as needed;
- edit connection
- create connection action for refresh
- execute query on engine
- show query area with data when result is data query
- execute text from query area on engine
- execute query from selected text (opened file or query area)
- generate log from all queries
- select opened databases from statusbar, so selected query with hotkey can automatically run based on that

## Would be nice
- autocomplete on query area
- custom plugins for query area (ex.: action buttons)
- custom plugins for result area (ex.: exporter)
- engine plugins automatically install dbex core
- load lates queries from connection

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
