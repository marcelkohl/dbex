'use babel';

import Clusterize from "clusterize.js"

export default class DataTable {
  constructor(targetQuery, {columns, data, id}) {
    Object.assign(this, {columns, data, id});
    this._lastRowIndex = "0";
    this._selectedCell = undefined;
    this._resizeObserver = undefined;

    this._element = document.createElement('div');
    this._element.id = `${this.id}-scroll-area`;
    this._element.classList.add('clusterize-scroll');
    this._element.addEventListener('keyup', (e)=>document.execCommand('copy'));

    let table = document.createElement("table");
    table.appendChild(this._getColumnsElement());
    table.onkeydown = (e)=>this._onTableKeyPress(e);

    this._tBody = document.createElement("tbody");
    this._tBody.id = `${this.id}-content-area`;
    this._tBody.classList.add('clusterize-content');
    this._tBody.onclick = (el)=>{
      if (el.target && el.target.tagName === 'TD' && !el.target.classList.contains('dbex-col-index')) {
        this._changeSelectedCell(el.target)
      }
    };
    table.appendChild(this._tBody);

    this._element.appendChild(table);

    let target = document.querySelector(targetQuery);
    target.innerHTML = "";
    target.appendChild(this._element);

    this._makeColsResizable(document.querySelector(`#${this._element.id} > table`));
    this._clusterize(table);
    this._changeSelectedCell(table.getElementsByClassName('dbex-selected-cell')[0]);
  }

  _clusterize(table) {
    this.clusterize = new Clusterize({
      rows: this._generateDataRowsEl(),
      scrollId: this._element.id,
      contentId: this._tBody.id,
      callbacks: {
        clusterWillChange: (e)=>{
          let selectedCell = table.getElementsByClassName('dbex-selected-cell')[0];

           if (selectedCell) {
             this._lastRowIndex = selectedCell.closest('tr').dataset.row;
             this._lastColIndex = this._getSelectedColIndex(selectedCell);
             selectedCell.classList.remove('dbex-selected-cell');
           }
        },
        clusterChanged: (e)=>{
          let row = table.querySelectorAll(`[data-row="${this._lastRowIndex}"] > td`)[this._lastColIndex];

          if (row) {
            row.classList.add('dbex-selected-cell');
            this._changeSelectedCell(row);
          }
        },
      }
    });
  }

  _makeColsResizable(table) {
    table.querySelectorAll('th').forEach((col) => {
        this._setColumnAsResizable(col, col.querySelector('.resizer'));
    });
  }

  _setColumnAsResizable(col, resizer) {
      let clientStartPos = 0;
      let elementWidth = 0;

      let onMouseDown = function(e) {
          clientStartPos = e.clientX;
          elementWidth = parseInt(window.getComputedStyle(col).width, 10);

          document.addEventListener('mousemove', onMouseMove);
          document.addEventListener('mouseup', onMouseUp);
      };

      let onMouseMove = function(el) {
          let newWidth = el.clientX - clientStartPos;
          col.style.minWidth = `${elementWidth + newWidth}px`;
      };

      let onMouseUp = function() {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
      };

      resizer.addEventListener('mousedown', onMouseDown);
  }

  _changeSelectedCell(cellToSelect, scrollBlock = 'nearest') {
    if (!cellToSelect) {
      return;
    }

    if (this._selectedCell) {
      this._selectedCell.classList.remove("dbex-selected-cell");
      this._selectedCell.parentElement.classList.remove("dbex-selected-row");
    }

    this._selectedCell = cellToSelect;
    this._selectedCell.classList.add("dbex-selected-cell")
    this._selectedCell.parentElement.classList.add("dbex-selected-row");
    this._selectedCell.scrollIntoView({block: scrollBlock});
    this._selectedCell.focus();

    this._bringCellToVisible();
  }

  _bringCellToVisible() {
    let visibleEdges = this._tBody.closest('.result-data').getBoundingClientRect();
    let limitTop = visibleEdges.top;
    let cellVisible = this._selectedCell.getBoundingClientRect();
    let headerHeight = cellVisible.height;
    let colIndexWidth = this._selectedCell.parentElement.firstChild.getBoundingClientRect().width;
    let limitLeft = visibleEdges.left;

    if (cellVisible.top < (limitTop + headerHeight)) {
      this._element.scroll(this._element.scrollLeft, this._element.scrollTop - headerHeight);
    }

    if (cellVisible.left < (limitLeft + colIndexWidth)) {
      this._element.scroll(this._element.scrollLeft - colIndexWidth, this._element.scrollTop);
    }
  }

  _onTableKeyPress(event) {
    let keyPressed = event ? event.key : window.event.key;
    let nextCell, scrollBlock;

    if (keyPressed == 'ArrowUp') {
      let nextRow = this._selectedCell.parentElement.previousElementSibling;

      if (nextRow != null && nextRow.cells.length > 0) {
        nextCell = nextRow.cells[this._selectedCell.cellIndex];
        scrollBlock = nextCell.parentElement.dataset.row === "0" ? 'end' : 'nearest';
      }
    } else if (keyPressed == 'ArrowDown') {
      let nextRow = this._selectedCell.parentElement.nextElementSibling;

      if (nextRow != null) {
        nextCell = nextRow.cells[this._selectedCell.cellIndex];
      }
    } else if (keyPressed == 'ArrowLeft') {
      let sibling = this._selectedCell.previousElementSibling;

      if (!sibling) {
        return;
      }

      if (!sibling.classList.contains('dbex-col-index')) {
        nextCell = sibling;
      } else {
        this._element.scrollLeft -= sibling.offsetWidth;
      }
    } else if (keyPressed == 'ArrowRight') {
      nextCell = this._selectedCell.nextElementSibling
    } else if (keyPressed == 'PageDown') {
      let limitBottom = this._tBody.closest('.result-data').getBoundingClientRect().bottom;
      let rowFound, lastRow;

      this._tBody.querySelectorAll('tr').forEach((row)=>{
          if (!rowFound && row.getBoundingClientRect().bottom > limitBottom) {
              rowFound = lastRow;
          }

          lastRow = row;
      });

      if (rowFound) {
        scrollBlock = 'start';
        nextCell = rowFound.querySelectorAll('td')[
          this._getSelectedColIndex(this._selectedCell)
        ];
      }
    } else if (keyPressed == 'PageUp') {
      let limitTop = this._tBody.closest('.result-data').getBoundingClientRect().top;
      let rowFound;

      this._selectedCell.scrollIntoView({block:'end'});

      this._tBody.querySelectorAll('tr').forEach((row)=>{
          if (!rowFound && row.getBoundingClientRect().top > limitTop) {
              rowFound = row;
          }
      });

      if (rowFound) {
        nextCell = rowFound.querySelectorAll('td')[
          this._getSelectedColIndex(this._selectedCell)
        ];
        scrollBlock = nextCell.parentElement.dataset.row === "0" ? 'end' : 'nearest';
      }
    }

    this._changeSelectedCell(nextCell, scrollBlock);
  }

  _getSelectedColIndex(cell) {
    let selectedColIndex = 0;

    cell.closest('tr').querySelectorAll('td').forEach((col, i)=>{
        if (col.classList.contains('dbex-selected-cell')) {
          selectedColIndex = i;
        }
    });

    return selectedColIndex;
  }

  get _columnSizes() {
    //TODO: implement these values in a proper way, as a DI or by another class constant
    return ['dbex-col-undefined', 'dbex-col-number', 'dbex-col-text', 'dbex-col-boolean', 'dbex-col-date'];
  }

  _generateDataRowsEl(selectedCellIndex = 0) {
    let rows = [];

    this.data.forEach((srcData, index) => {
      let row = document.createElement("tr");
      row.dataset.row = index;

      let elData = document.createElement("td");
      elData.classList.add('dbex-col-index', 'tool-panel');
      elData.innerHTML = `<div class="td-inner">${index}</div>`;
      elData.classList.add(this._columnSizes[1]);

      row.appendChild(elData);

      Object.values(srcData).forEach((dataItem, dataIdx) => {
        let elData = document.createElement("td");

        if (dataItem === null) {
          elData.classList.add('dbex-value-null');
        } else {
          elData.innerHTML = dataItem;
        }

        let colType = this.columns[dataIdx] ? this.columns[dataIdx].type : 0;
        elData.classList.add(this._columnSizes[colType]);

        row.appendChild(elData);
      });

      rows.push(row.outerHTML);
    });

    if (this.data.length === 0) {
      let row = document.createElement("tr");
      row.innerHTML = `<td colspan="${this.columns.length}">No data</td>`;

      rows.push(row.outerHTML);
    }

    return rows;
  }

  _getColumnsElement() {
    let colRow = document.createElement("tr");
    let width = this._columnSizes[1];
    let elColumn = document.createElement("th");

    elColumn.classList.add(width, 'dbex-col-index', 'dbex-dead-corner', 'tool-panel');
    elColumn.innerHTML = `
    <div class="th-inner">
      <div class="th-text"></div>
      <div class="resizer"></div>
    </div>
    `;

    colRow.appendChild(elColumn);

    this.columns.forEach((srcColumn) => {
      let width = this._columnSizes[srcColumn.type];
      let elColumn = document.createElement("th");

      elColumn.classList.add(width, 'tool-panel');
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

  destroy() {
    this.dispose();
  }

  dispose() {
    this.clusterize.destroy();
  }
}
