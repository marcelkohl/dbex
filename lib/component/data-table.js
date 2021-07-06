'use babel';

import Clusterize from "clusterize.js"
import ResultSet from '../dataModel/result-set';

export default class DataTable {
  constructor(targetQuery, {columns, data, id}) {
    Object.assign(this, {columns, data, id});
    this._lastRowIndex = "0";
    this._cursor = undefined;
    this._resizeObserver = undefined;
    this._element = document.createElement('div');
    this._element.id = `${this.id}-scroll-area`; //"scrollArea"
    this._element.classList.add('clusterize-scroll');
    let table = document.createElement("table");
    // this._element.innerHTML = `<table></table>`;

    this._element.addEventListener('keyup', (e)=>document.execCommand('copy'));

    table.appendChild(this._getColumnsElement());

    this._tBody = document.createElement("tbody");
    this._tBody.onclick = (el)=>{
      if (el.target && el.target.tagName === 'TD' && !el.target.classList.contains('dbex-col-index')) {
        this.dotheneedful(el.target)
      }
    };

    this._tBody.classList.add('clusterize-content');
    this._tBody.id = `${this.id}-content-area`;
    table.appendChild(this._tBody);
    this._element.appendChild(table);
    // this._element.appendChild(this._getDataElement());
// this._getDataElement()
// console.log("=====> terminado")
    let target = document.querySelector(targetQuery);
    target.innerHTML = "";
    target.appendChild(this._element);

    this._makeResizable(document.querySelector(`#${this._element.id} > table`));

    this.clusterize = new Clusterize({
      rows: this._getDataElement(),
      scrollId: this._element.id,
      contentId: this._tBody.id,
      callbacks: {
        clusterWillChange: (e)=>{
          let selectedCell = table.getElementsByClassName('dbex-selected-cell')[0];
           if (selectedCell) {
             this._lastRowIndex = selectedCell.closest('tr').dataset.row;
             selectedCell.classList.remove('dbex-selected-cell');
           }
        },
        clusterChanged: (e)=>{
          let row = table.querySelector(`[data-row="${this._lastRowIndex}"] > td:not(.dbex-col-index)`)

          if (row) {
            row.classList.add('dbex-selected-cell');
            this._setSelectedCell(table)
          }
        },
        // scrollingProgress: function(progress) {}
      }
    });

      // console.log(clusterize);

    this._enableKeys(table);

      // new Resizable(document.querySelector(`#${this._element.id} > table`),{
      //     // liveDrag:true,
      //     draggingClass:"rangeDrag",
      //     // gripInnerHtml:"<div class='rangeGrip'></div>",
      //     // minWidth:8
      //     partialRefresh: true,
      // });

      // resizer.init(document.querySelector(`#${this._element.id} > table`));
  }

  _makeResizable(table) {
    // Query the table
    // const table = document.getElementById('resizeMe');

    // Query all headers
    const cols = table.querySelectorAll('th');

    // Loop over them
    cols.forEach((col) => {
        // Create a resizer element
        // const resizer = document.createElement('div');
        // resizer.innerHTML = col.innerHTML;
        // resizer.style.width = parseInt(window.getComputedStyle(col).width, 10);
        // resizer.classList.add('resizer');
// console.log(window.getComputedStyle(col));
        // Set the height
        // resizer.style.height = `${table.offsetHeight}px`;

        // Add a resizer element to the column
        // col.innerHTML = "";
        // col.appendChild(resizer);

        let resizer = col.querySelector('.resizer');

        // Will be implemented in the next section
        this.createResizableColumn(col, resizer);
    });
  }

  createResizableColumn(col, resizer) {
      // Track the current position of mouse
      let x = 0;
      let w = 0;

      const mouseDownHandler = function(e) {
          // Get the current mouse position
          x = e.clientX;

          // Calculate the current width of column
          const styles = window.getComputedStyle(col);
          w = parseInt(styles.width, 10);

          // Attach listeners for document's events
          document.addEventListener('mousemove', mouseMoveHandler);
          document.addEventListener('mouseup', mouseUpHandler);
      };

      const mouseMoveHandler = function(e) {
          // Determine how far the mouse has been moved
          const dx = e.clientX - x;

          // Update the width of column
          col.style.minWidth = `${w + dx}px`;
      };

      // When user releases the mouse, remove the existing event listeners
      const mouseUpHandler = function() {
          document.removeEventListener('mousemove', mouseMoveHandler);
          document.removeEventListener('mouseup', mouseUpHandler);
      };

      resizer.addEventListener('mousedown', mouseDownHandler);
  }

  dotheneedful(sibling, key) {
    if (sibling != null) {
      this._cursor.focus();
      // this._cursor.style.backgroundColor = '';
      // this._cursor.style.color = '';
      this._cursor.classList.remove("dbex-selected-cell");
      this._cursor.parentElement.classList.remove("dbex-selected-row");
      sibling.focus();

      // this._cursor.onblur = undefined;

      // sibling.onfocus = ()=>console.log('foccuus');
      // sibling.style.backgroundColor = 'green';
      // sibling.style.color = 'white';
      sibling.classList.add("dbex-selected-cell")
      sibling.parentElement.classList.add("dbex-selected-row");
      this._cursor = sibling;

        // console.log('sibling -----> ', key, sibling);

      if (key === 'PageDown') {
        sibling.scrollIntoView({block:"start"});
      } else if (sibling.parentElement.dataset.row === "0") {
        // console.log('BLOCK END');
        sibling.scrollIntoView({block:"end"});
      } else {
        // console.log('BLOCK Nearst');
        sibling.scrollIntoView({block:"nearest"});
      }
    }
  }

  checkKey(e) {
    // console.log(e);
    e = e || window.event;
    if (e.key == 'ArrowUp') {
      // up arrow keyCode 38
      var idx = this._cursor.cellIndex;
      var nextrow = this._cursor.parentElement.previousElementSibling;
      if (nextrow != null) {
        var sibling = nextrow.cells[idx];
        this.dotheneedful(sibling);
      }
    } else if (e.key == 'ArrowDown') {
      // down arrow keyCode 40
      var idx = this._cursor.cellIndex;
      var nextrow = this._cursor.parentElement.nextElementSibling;
      if (nextrow != null) {
        var sibling = nextrow.cells[idx];
        this.dotheneedful(sibling);
      }
    } else if (e.key == 'ArrowLeft') {
      // left arrow keyCode 37
      var sibling = this._cursor.previousElementSibling;
      if (!sibling.classList.contains('dbex-col-index')) {
        this.dotheneedful(sibling);
      } else {
        this._element.scrollLeft -= sibling.offsetWidth;
      }
    } else if (e.key == 'ArrowRight') {
      // right arrow keyCode 39
      var sibling = this._cursor.nextElementSibling;
      this.dotheneedful(sibling);
    } else if (e.key == 'PageDown') {
        // getNextRow = (bodyEl)=>{
      let bodyEl = this._tBody;
      let limitBottom = bodyEl.closest('.result-data').getBoundingClientRect().bottom;
      let found = false;
      let last = undefined;

      bodyEl.querySelectorAll('tr').forEach((e)=>{
          if (found === false && e.getBoundingClientRect().bottom > limitBottom) {
              // console.log(last);
              found = last;
          }

          last = e;
      });

      if (found) {
        let selCol = 0;

        this._cursor.closest('tr').querySelectorAll('td').forEach((e,i)=>{
            if (e.classList.contains('dbex-selected-cell')) {
                selCol = i;
            }
        });

        this.dotheneedful(found.querySelectorAll('td')[selCol], e.key);
      }
    } else if (e.key == 'PageUp') {
      this._cursor.scrollIntoView({block:'end'});

      let bodyEl = this._tBody;
      let limitTop = bodyEl.closest('.result-data').getBoundingClientRect().top;
      let found = false;
      let last = undefined;

      bodyEl.querySelectorAll('tr').forEach((e)=>{
          if (found === false && e.getBoundingClientRect().top > limitTop) {
              // console.log('FOUND', e);
              found = e;
          }
      });

      if (found) {
        let selCol = 0;

        this._cursor.closest('tr').querySelectorAll('td').forEach((e,i)=>{
            if (e.classList.contains('dbex-selected-cell')) {
                selCol = i;
            }
        });

        this.dotheneedful(found.querySelectorAll('td')[selCol], e.key);
      }
    }
  }

  _setSelectedCell(targetElement) {
    // console.log("targetElement", targetElement)
    this._cursor = targetElement.getElementsByClassName('dbex-selected-cell')[0];

    if (!this._cursor) {
      return;
    }

    this._cursor.parentElement.classList.add("dbex-selected-row");
    this._cursor.focus();
  }

  _enableKeys(targetElement) {
    this._setSelectedCell(targetElement);
    targetElement.onkeydown = (e)=>this.checkKey(e);
  }

  _getDataElement() {
    // let table = document.createElement("tbody");

    let rows = [];
    let start = "dbex-selected-cell";
    let columnSizes = ['dbex-col-undefined', 'dbex-col-number', 'dbex-col-text', 'dbex-col-boolean', 'dbex-col-date'];

    this.data.forEach((srcData, index) => {
      let row = document.createElement("tr");
      row.dataset.row = index;

      let elData = document.createElement("td");
      elData.classList.add('dbex-col-index');
      elData.innerHTML = index;
      elData.classList.add(columnSizes[this.columns[1].type]);
      row.appendChild(elData);

      Object.values(srcData).forEach((dataItem, i) => {
        let elData = document.createElement("td");
        if (start) {
          // elData.classList.add(start);
          start = false;
        }

        if (dataItem === null) {
          elData.classList.add('dbex-value-null');
        } else {
          elData.innerHTML = dataItem;
        }

        elData.classList.add(columnSizes[this.columns[i].type]);

        row.appendChild(elData);
      });

      rows.push(row.outerHTML);
      // table.appendChild(row);
    });

    if (this.data.length === 0) {
      // console.log("====>>>  no data");
      let row = document.createElement("tr");
      row.innerHTML = `<td colspan="${this.columns.length}">No data</td>`;

      rows.push(row.outerHTML);
    }
// console.log(rows);
    return rows;
  }

  _getColumnsElement() {
    // let columnSizes = [150, 100, 300, 50, 150];
    let columnSizes = ['dbex-col-undefined', 'dbex-col-number', 'dbex-col-text', 'dbex-col-boolean', 'dbex-col-date'];
    let colRow = document.createElement("tr");

    let width = columnSizes[1];
    let elColumn = document.createElement("th");
    elColumn.classList.add(width, 'dbex-col-index', 'dbex-dead-corner');
    elColumn.innerHTML = `
    <div class="th-inner">
      <div class="th-text"></div>
      <div class="resizer"></div>
    </div>
    `;
    colRow.appendChild(elColumn);


    this.columns.forEach((srcColumn) => {
      // console.log(srcColumn.name);
      let width = columnSizes[srcColumn.type];
      // console.log(srcColumn, srcColumn.type, columnSizes[srcColumn.type]);
      let elColumn = document.createElement("th");
      elColumn.classList.add(width);
      // elColumn.style.minWidth = `${width}px`;
      elColumn.innerHTML = `
      <div class="th-inner">
        <div class="th-text">${srcColumn.name}</div>
        <div class="resizer"></div>
      </div>
      `;
      colRow.appendChild(elColumn);
    });

    let cols = document.createElement("thead");
    cols.appendChild(colRow);

    return cols;
  }

  dispose() {
    this.clusterize.destroy();
  }
}
