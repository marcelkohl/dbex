'use babel';

import Clusterize from "clusterize.js"

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

    table.appendChild(this._getColumnsElement());

    let tBody = document.createElement("tbody");
    tBody.classList.add('clusterize-content');
    tBody.id = `${this.id}-content-area`;
    table.appendChild(tBody);
    this._element.appendChild(table);
    // this._element.appendChild(this._getDataElement());
// this._getDataElement()
console.log("=====> terminado")
    let target = document.querySelector(targetQuery);
    target.innerHTML = "";
    target.appendChild(this._element);

    this._makeResizable(document.querySelector(`#${this._element.id} > table`));
      var clusterize = new Clusterize({
        rows: this._getDataElement(),
        scrollId: this._element.id,
        contentId: tBody.id,
        callbacks: {
          clusterWillChange: (e)=>{
            let selectedCell = table.getElementsByClassName('dbex-selected-cell')[0];
            this._lastRowIndex = selectedCell.closest('tr').dataset.row;
            selectedCell.classList.remove('dbex-selected-cell');
          },
          clusterChanged: (e)=>{
            table.querySelector(`[data-row="${this._lastRowIndex}"] > td`).classList.add('dbex-selected-cell');
            this._setSelectedCell(table)
          },
          // scrollingProgress: function(progress) {}
        }
      });

      console.log(clusterize);

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

  dotheneedful(sibling) {
    if (sibling != null) {
      this._cursor.focus();
      // this._cursor.style.backgroundColor = '';
      // this._cursor.style.color = '';
      this._cursor.classList.remove("dbex-selected-cell");
      this._cursor.parentElement.classList.remove("dbex-selected-row");
      sibling.focus();
      // sibling.style.backgroundColor = 'green';
      // sibling.style.color = 'white';
      sibling.classList.add("dbex-selected-cell")
      sibling.parentElement.classList.add("dbex-selected-row");
      this._cursor = sibling;

      sibling.scrollIntoView({block:"nearest"});
    }
  }

  checkKey(e) {
    console.log(e);
    e = e || window.event;
    if (e.keyCode == '38') {
      // up arrow
      var idx = this._cursor.cellIndex;
      var nextrow = this._cursor.parentElement.previousElementSibling;
      if (nextrow != null) {
        var sibling = nextrow.cells[idx];
        this.dotheneedful(sibling);
      }
    } else if (e.keyCode == '40') {
      // down arrow
      var idx = this._cursor.cellIndex;
      var nextrow = this._cursor.parentElement.nextElementSibling;
      if (nextrow != null) {
        var sibling = nextrow.cells[idx];
        this.dotheneedful(sibling);
      }
    } else if (e.keyCode == '37') {
      // left arrow
      var sibling = this._cursor.previousElementSibling;
      this.dotheneedful(sibling);
    } else if (e.keyCode == '39') {
      // right arrow
      var sibling = this._cursor.nextElementSibling;
      this.dotheneedful(sibling);
    }
  }

  _setSelectedCell(targetElement) {
    console.log("targetElement", targetElement)
    this._cursor = targetElement.getElementsByClassName('dbex-selected-cell')[0];
    this._cursor.parentElement.classList.add("dbex-selected-row");
    this._cursor.focus();
    // this._cursor.style.backgroundColor = 'green';
    // this._cursor.style.color = 'white';
  }

  _enableKeys(targetElement) {
    this._setSelectedCell(targetElement);
    targetElement.onkeydown = (e)=>this.checkKey(e);
  }

  _getDataElement() {
    // let table = document.createElement("tbody");

    let rows = [];
    let start = "dbex-selected-cell";

    this.data.forEach((srcData, index) => {
      let row = document.createElement("tr");
      row.dataset.row = index;

      Object.values(srcData).forEach((dataItem, i) => {
        let elData = document.createElement("td");
        if (start) {
          elData.classList.add(start);
          start = false;
        }
        elData.innerHTML = dataItem;

        row.appendChild(elData);
      });

      rows.push(row.outerHTML);
      // table.appendChild(row);
    });

    if (this.data.length === 0) {
      let row = document.createElement("tr");
      row.innerHTML = `<td colspan="${this.columns.length}">No data</td>`;

      rows.push(row.outerHTML);
    }
// console.log(rows);
    return rows;
  }

  _getColumnsElement() {
    let colRow = document.createElement("tr");

    this.columns.forEach((srcColumn) => {
      // console.log(srcColumn.name);
      let elColumn = document.createElement("th");
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
}
