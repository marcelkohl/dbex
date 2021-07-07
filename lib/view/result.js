'use babel';

import DataTable from "../component/data-table";
import HeaderOptions from "./header-options";
import { v4 as uuidv4 } from 'uuid';

export default class DbexResult {
  constructor({name, title, icon, color, uuid, allowedLocations, customHeaderOptions}) {
    this.destroyables = [];
    this._dataTable = undefined;
    this._onExecuteQuery = (uuid, query)=>undefined;
    this._onStopQuery = (uuid)=>undefined;
    this._onShowLog = (uuid)=>undefined;
    this._onDestroy = (uuid)=>undefined;
    this._uuid = uuid || uuidv4();
    this._name = name;

    this.uri = 'atom://' + name;
    this.title = title;
    this.icon = icon;
    this.allowedLocations = allowedLocations || ['bottom'];

    this.query = atom.workspace.buildTextEditor();
    this.query.setGrammar(atom.grammars.selectGrammar("source.sql"));
    this.destroyables.push(this.query);

    this.queryElement = document.createElement('div');
    this.queryElement.classList.add('result-query');
    this.queryElement.appendChild(this.query.element);

    this.dataElement = document.createElement('div');
    this.dataElement.classList.add('result-data');

    this.element = document.createElement('div');
    this.element.classList.add('tool-panel', 'focusable-panel', 'dbex-result-view', name);
    this.element.style.borderTop = `1px solid ${color}`
    this.element.tabIndex = -1;
    this.element.dataset.uuid = this.uuid;

    this._toolbar = new HeaderOptions(this._getHeaderOptions(customHeaderOptions));

    this.toolbarElement = document.createElement('div');
    this.toolbarElement.classList.add('toolbar');
    this.toolbarElement.appendChild(this._toolbar.element);

    this.element.appendChild(this.toolbarElement)
    this.element.appendChild(this.queryElement)
    this.element.appendChild(this.dataElement)

    this._observeResizableAreas(this.element, this.dataElement, [this.toolbarElement, this.queryElement]);
  }

  get toolbar() {
    return this._toolbar;
  }

  getQueryTextEditor() {
    return this.query;
  }

  set onQueryStopChanging(onQueryStopChanging) {
    this.query.onDidStopChanging(
      ()=>onQueryStopChanging(this.query)
    );
  }

  _observeResizableAreas(resultArea, dataElement, otherElements) {
    this._resizeObserver = new ResizeObserver(entries => {
      let totalUsed = 0;
      // let resultArea = 0;

      otherElements.forEach((element) => {
        totalUsed += element.offsetHeight;
      });

      let remainingSpace = resultArea.offsetHeight - totalUsed;

      remainingSpace = remainingSpace < 200 ? 200 : remainingSpace;

      let innerData = dataElement.getElementsByClassName('clusterize-scroll')[0];

      if (innerData) {
        innerData.style.maxHeight=`${remainingSpace}px`;
      }
    });

    [resultArea, dataElement, ...otherElements].forEach((el) => {
      this._resizeObserver.observe(el);
    });
  }

  get uuid() {
    return this._uuid;
  }

  set onExecuteQuery(onExecuteQuery) {
    this._onExecuteQuery = onExecuteQuery;
  }

  get onExecuteQuery() {
    return this._onExecuteQuery;
  }

  set onStopQuery(onStopQuery) {
    this._onStopQuery = onStopQuery;
  }

  _getHeaderOptions(customHeaderOptions) {
    let options = [
      {
        icon: 'fa-flash',
        onClick: () => {
          if (this.queryElement.classList.contains('hidden')) {
            this.setQueryVisibility(true);
          } else {
            this._onExecuteQuery(
              this._uuid,
              this.query.getSelectedText() || this.query.getText()
            )
          }
        },
        tooltip: 'Execute query',
        classes: 'warning',
      },
      {
        icon: 'fa-stop',
        onClick: ()=> this._onStopQuery(this._uuid),
        tooltip: 'Stop query transaction',
        classes: 'danger',
      },
      {
        icon: 'fa-file-text-o',
        onClick: ()=> this._onShowLog(this._uuid),
        tooltip: 'Show logs for this scope',
        classes: 'info',
      },
    ];

    if (customHeaderOptions && customHeaderOptions.length > 0) {
      options.push({divider: true});

      customHeaderOptions.forEach((option) => {
        options.push(option);
      });
    }

    return options;
  }

  set onShowLog(onShowLog) {
    this._onShowLog = onShowLog;
  }

  // _showLog(scope) {
  //   let filePath = atom.packages.getLoadedPackage('dbex').path + "/logs/" + scope + ".log";
  //   atom.workspace.open(filePath);
  // }

  setQuery(query) {
    this.query.setText(query);
  }

  setQueryVisibility(isVisible) {
    if (isVisible) {
      this.queryElement.classList.remove('hidden');
    } else {
      this.queryElement.classList.add('hidden');
    }
  }

  setDataVisibility(isVisible) {
    if (isVisible) {
      this.dataElement.classList.remove('hidden');
    } else {
      this.dataElement.classList.add('hidden');
    }
  }

  addElement(element) {
    this.element.appendChild(element);
  }

  getEditor() {
    return atom.workspace.getActiveTextEditor();
  }

  getScopeName() {
    if (
      atom.workspace.getActiveTextEditor() != null &&
      atom.workspace.getActiveTextEditor().getGrammar() != null
    ) {
      return atom.workspace.getActiveTextEditor().getGrammar().scopeName;
    }

    return undefined;
  }

  serialize() {}

  set onDestroy(onDestroy) {
    this._onDestroy = onDestroy;

    // if (atom.workspace.paneContainerForURI(this.getURI())) {
      // atom.workspace.paneContainerForURI(this.getURI()).onDidDestroyPaneItem(onClose);
    // }
  }

  destroy() {
    // console.log("Result destroy");
    this._onDestroy(this.uuid);
    // this.removeEventForEditor();
    this.element.remove();
    this.destroyables.forEach((item) => {
      item.destroy();
    });
  }

  dispose() {
    this.destroy();
  }

  // removeEventForEditor() {
  //   if (this.onEditorSave != null) {
  //     this.onEditorSave.dispose();
  //   }
  //
  //   if (this.onChangeRow != null) {
  //     this.onChangeRow.dispose();
  //   }
  // }

  unfocus() {
    atom.workspace.getCenter().activate();
  }

  hasFocus() {
    return document.activeElement === this.element;
  }

  toggleFocus() {
    if (this.hasFocus()) {
      this.unfocus();
    } else {
      this.show();
      this.element.focus();
    }
  }

  toggle() {
    atom.workspace.toggle(this);
  }

  hide() {
    atom.workspace.hide(this);
  }

  show() {
    atom.workspace.open(this, {
      searchAllPanes: true,
      activatePane: false,
      activateItem: false,
    }).then(() => {
      atom.workspace.paneContainerForURI(this.getURI()).show();
    });
  }

  keyboardEvents() {
  }

  getURI() {
    return this.uri;
  }

  getTitle() {
    return this.title;
  }

  getIconName() {
    return this.icon;
  }

  getAllowedLocations() {
    return this.allowedLocations;
  }

  isPermanentDockItem() {
    return false;
  }

  set resultData(resultData) {
    if (this._dataTable) {
      this._dataTable.dispose();
    }

    this._dataTable = new DataTable(
      `.${this._name} .result-data`,
      {
        columns: resultData.columns,
        data: resultData.data,
        id: this._name,
        // layout: 'fluid',
      }
    );

    this.destroyables.push(this._dataTable);
  }
}
