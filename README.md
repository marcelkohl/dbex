[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://bitbucket.org/lbesson/ansi-colors)
[![Generic badge](https://img.shields.io/badge/Status-Beta-orange.svg)](https://shields.io/)
[![GPLv3 license](https://img.shields.io/badge/License-GPLv3-blue.svg)](http://perso.crans.org/besson/LICENSE.html)
[![Ask Me Anything !](https://img.shields.io/badge/Ask%20me-anything-1abc9c.svg)](https://GitHub.com/Naereen/ama)

# Dbex - A Hackable Database Explorer For Atom Editor
Dbex is an Atom package created to facilitate every developer who needs to work with multiple databases. It is not supposed to replace any professional tool, instead, it is a support package to avoid installing many database tools.

**Using this graphical environment it looks like this:**

<img alt="Graphics on Clipper DOS" src="https://github.com/marcelkohl/dbex/blob/main/samples/main.png?raw=true">

## Resources
<table>
   <tbody>
      <tr>
         <td>
         <b>Easy to manage</b>
         <p>Multiple database connections can be managed through the Databases tab. Identified by colors and respective engine icon.</p>
         </td>
         <td>Img tree</td>
      </tr>
      <tr>
         <td>img create conn</td>
         <td>
         <b>Community friendly</b>
         <p>Engines for any database can be created using the available <a href="https://github.com/marcelkohl/dbex-engine-base">sample template</a>, so nobody will miss your favorite database.</p>
         </td>
      </tr>
      <tr>
         <td>
         <b>Quick access</b>
         <p>Query and results can be quickly accessed by the bottom tab, supporting multiple tabs for queries and results.</p>
         </td>
         <td>img result</td>
      </tr>
      <tr>
         <td>img queries</td>
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
         <td>img themes</td>
      </tr>
      <tr>
         <td>img queries</td>
         <td>
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

## TODO
- Edit result directly on table result (engine result must have a list of cols/references to send on confirm edit. ex.: mysql is the pk col name);
- Show divider between query and result (where we can see easily where to drag to resize);
- custom plugins for query area (ex.: action buttons, indentation);
- Custom plugins for result area (ex.: exporter);
- On edit connection, replace entry at same position instead of in the end;
- Draggable connections to reorder in tree;
- Auto complete on query area;
- Identify query executed from textEditor and replace or create new result tab (uuid or title), not on a generic tab;
- Add promise on dbex side to avoid engine blocking atom;
