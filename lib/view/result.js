'use babel';

import HeaderOptions from "./header-options";
import { v4 as uuidv4 } from 'uuid';

export default class DbexResult {
  constructor({name, title, icon, color, uuid, allowedLocations, customHeaderOptions}) {
    this._onExecuteQuery = (uuid, query)=>undefined;
    this._onStopQuery = (uuid)=>undefined;
    this._uuid = uuid || uuidv4();

    this.uri = 'atom://' + name;
    this.title = title;
    this.icon = icon;
    this.allowedLocations = allowedLocations || ['bottom'];

    this.query = atom.workspace.buildTextEditor();
    this.query.setGrammar(atom.grammars.selectGrammar("source.sql"));

    let queryElement = document.createElement('div');
    queryElement.classList.add('result-query');
    queryElement.appendChild(this.query.element);

    let dataElement = document.createElement('div');
    dataElement.classList.add('result-data');

    this.element = document.createElement('div');
    this.element.classList.add('tool-panel', 'focusable-panel', 'dbex-result-view', name);
    this.element.style.borderTop = `1px solid ${color}`
    this.element.tabIndex = -1;

    this._toolbar = new HeaderOptions(this._getHeaderOptions(customHeaderOptions));

    this.toolbarElement = document.createElement('div');
    this.toolbarElement.classList.add('toolbar');
    this.toolbarElement.appendChild(this._toolbar.element);

    this.element.appendChild(this.toolbarElement)
    this.element.appendChild(queryElement)
    this.element.appendChild(dataElement)

    this._observeResizableAreas(this.element, dataElement, [this.toolbarElement, queryElement]);
  }

  get toolbar() {
    return this._toolbar;
  }

  getQueryTextEditor() {
    return this.query;
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

      dataElement.getElementsByClassName('clusterize-scroll')[0].style.maxHeight=`${remainingSpace}px`;
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
        onClick: () => this._onExecuteQuery(
          this._uuid,
          this.query.getSelectedText() || this.query.getText()
        ),
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
        onClick: ()=> this._showLog(this.title),
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

  _showLog(scope) {
    let filePath = atom.packages.getLoadedPackage('dbex').path + "/logs/" + scope + ".log";
    atom.workspace.open(filePath);
  }

  setQuery(query) {
    this.query.setText(query);
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

  destroy() {
    this.removeEventForEditor();
    this.element.remove();
  }

  removeEventForEditor() {
    if (this.onEditorSave != null) {
      this.onEditorSave.dispose();
    }

    if (this.onChangeRow != null) {
      this.onChangeRow.dispose();
    }
  }

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
}
