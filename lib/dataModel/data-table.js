'use babel';

import Clusterize from "clusterize.js"

export default class DataTable {
  constructor(targetQuery, {columns, data, id}) {
    Object.assign(this, {columns, data});

    this._element = document.createElement('div');
    this._element.id = this.id; //"scrollArea"
    // this._element.classList.add('result-data', ...classes);
    this._element.innerHTML = `<table></table>`;

    this._element.appendChild(this._getColumnsElement());
    this._element.appendChild(this._getDataElement());

    let target = document.querySelector(targetQuery);
    target.innerHTML = "";
    target.appendChild(this._element);
  }

  // get element() {
  //   let result = this._element;
  //
  //   result.appendChild(this._getColumnsElement());
  //   result.appendChild(this._getDataElement());
  //
  //   var clusterize = new Clusterize({
  //     rows: data,
  //     scrollId: 'scrollArea',
  //     contentId: 'contentArea'
  //   });
  //
  //   return result
  // }

  _getDataElement() {
    let table = document.createElement("tbody");

    this.data.forEach((srcData) => {
      let row = document.createElement("tr");

      Object.values(srcData).forEach((dataItem, i) => {
        let elData = document.createElement("td");
        elData.innerHTML = dataItem;
        row.appendChild(elData);
      });

      table.appendChild(row);
    });

    return table
  }

  _getColumnsElement() {
    let colRow = document.createElement("tr");

    this.columns.forEach((srcColumn) => {
      // console.log(srcColumn.name);
      let elColumn = document.createElement("th");
      elColumn.innerHTML = srcColumn.name;
      colRow.appendChild(elColumn);
    });

    let cols = document.createElement("thead");
    cols.appendChild(colRow);

    return cols;
  }
}
