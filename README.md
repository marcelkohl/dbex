[![Maintenance](https://img.shields.io/badge/Maintained%3F-no-red.svg)](#)
[![Generic badge](https://img.shields.io/badge/Status-Beta-yellow.svg)](#)
[![GPLv3 license](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0.en.html)
[![Ask Me Anything !](https://img.shields.io/badge/Ask%20me-anything-1abc9c.svg)](https://github.com/marcelkohl)

# Dbex - A Hackable Database Explorer For Atom Editor
Dbex is an Atom package created to facilitate every developer who needs to work with multiple databases. It is not supposed to replace any professional tool, instead, it is a support package to avoid installing many database tools.

<img alt="Dbex - A Hackable Database Explorer For Atom Editor" src="https://github.com/marcelkohl/dbex/blob/master/samples/main.png?raw=true">

## Resources
<table border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border:0px;">
   <tbody>
      <tr>
         <td>
         <b>Easy to manage</b>
         <p>Multiple database connections can be managed through the Databases tab. Identified by colors and respective engine icon.</p>
         </td>
         <td><img alt="Easy to manage" src="https://github.com/marcelkohl/dbex/blob/master/samples/tree.png?raw=true" width="400" height="auto"></td>
      </tr>
      <tr>
         <td><img alt="Community friendly" src="https://github.com/marcelkohl/dbex/blob/master/samples/create.png?raw=true" width="400" height="auto"></td>
         <td>
         <b>Community friendly</b>
         <p>Engines for any database can be created using the available <a href="https://github.com/marcelkohl/dbex-engine-base">base template</a>, so nobody will miss your favorite database.</p>
         </td>
      </tr>
      <tr>
         <td>
         <b>Quick access</b>
         <p>Query and results can be quickly accessed by the bottom tab, supporting multiple tabs for queries and results.</p>
         </td>
         <td><img alt="Quick access" src="https://github.com/marcelkohl/dbex/blob/master/samples/result.png?raw=true" width="400" height="auto"></td>
      </tr>
      <tr>
         <td><img alt="Queries Everywhere" src="https://github.com/marcelkohl/dbex/blob/master/samples/queries.png?raw=true" width="400" height="auto"></td>
         <td>
         <b>Queries Everywhere</b>
         <p>Request queries directly from the text editor or by clicking on the database indicator.</p>
         </td>
      </tr>
      <tr>
         <td>
         <b>Theme Compatible</b>
         <p>Don't mess up your theme. Dbex is compatible with it following the theme schema.</p>
         </td>
         <td><img alt="Queries Everywhere" src="https://github.com/marcelkohl/dbex/blob/master/samples/themes.png?raw=true" width="400" height="auto"></td>
      </tr>
      <tr>
         <td colspan="2">
         <b>...and More</b>
         <ul>
         <li>Log queries</li>
         <li>Reopen last opened tabs</li>
         <li>Filter tree by text</li>
         <li>Highlight query sintax</li>
         <li>Execute full or just selected query text</li>
         </ul>
         </td>
      </tr>
   </tbody>
</table>

## Engines
Dbex package does not make all the work alone, instead, it use 3rd party engines to make things happen. Everything that is related to the database is done by the engine as processing queries, controlling connection pools, retrieving structures and so on.

Engines can be created by anyone just by following the [base template](https://github.com/marcelkohl/dbex-engine-base) and filling the mandatory methods. Dbex will communicate with the installed engines to make things happen.

As soon as other engines are available it will be listed here. For now this is what we have:

|Engine|Description|
|---|---|
|[Base Engine](https://github.com/marcelkohl/dbex-engine-base)|Sample engine used as base structure. It does nothing, just an example|   
|[MySQL](https://github.com/marcelkohl/atom-dbex-mysql)|Support to the basic aspects of MySQL resources, including v.5.x and v.8.x|
|[MariaDB](https://github.com/marcelkohl/atom-dbex-mariadb)|Support to MariaDB resources|
|[Cassandra](https://github.com/marcelkohl/atom-dbex-cassandra)|Cassandra support - BETA|

## TODO
While many resources where implemented there are still some small issues to fix and also other resources that would be nice to have and probably will be implemented soon:

- Prevent "paste query" on query area to hide the result area. it is happening when result area is not visible yet;
- Show actions on right click instead of node icons;
- Edit result directly on table result (engine result must have a list of cols/references to send on confirm edit. ex.: mysql is the pk col name);
- Show divider between query and result (where we can see easily where to drag to resize);
- custom plugins for query area (ex.: action buttons, indentation);
- Custom plugins for result area (ex.: exporter);
- On edit connection, replace entry at same position instead of in the end;
- Draggable connections to reorder in tree;
- Auto complete on query area;
- Identify query executed from textEditor and replace or create new result tab (uuid or title), not on a generic tab;
- Add promise on dbex side to avoid engine blocking atom;

## Warranty Disclaimer
The following disclaimer was written thinking in all professionals that works with data and know how important data is.

**All work here is provided ​“AS IS” AND I CANNOT MAKE ANY EXPRESS OR IMPLIED WARRANTY OF ANY KIND. As this is a side project from myself and a non-commercial product, I cannot give any warranties about the correct and full functional product. I hereby declare to not be liable for any damages arising in use of or inability to use this software.**

**USE IT BY YOUR OWN RISK.**

**KEEP BACKUPS UPDATED.**
