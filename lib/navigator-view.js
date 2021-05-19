'use babel';

import { CompositeDisposable } from 'atom';
import TreeView from './tree-view';

const NAVIGATOR_URI = 'atom://dbex';
const NAVIGATOR_TITLE = 'Databases';
const NAVIGATOR_ICON = 'database';

export default class NavigatorView {
  constructor() {
    // this.toolbar = document.createElement('div');
    // this.toolbar.classList.add('super-hyper-001');

    this.element = document.createElement('div');
    this.element.classList.add('dbex', 'tool-panel', 'focusable-panel');
    this.element.tabIndex = -1;

    this.subscriptions = new CompositeDisposable();
    this.treeView = new TreeView();
    // this.element.appendChild(this.toolbar);
    this.element.appendChild(this.treeView.element);

    this.subscriptions.add(atom.workspace.onDidOpen(() => {
      this.removeEventForEditor();
      // this.populate();
    }));

    // this.populate();
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

  populate(data) {
    this.treeView.setData(data, this.sortByName);
  }

  serialize() {}

  destroy() {
    this.removeEventForEditor();
    this.subscriptions.dispose();
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
    return NAVIGATOR_URI;
  }

  getTitle() {
    return NAVIGATOR_TITLE;
  }

  getIconName() {
    return NAVIGATOR_ICON;
  }

  getAllowedLocations() {
    return ['left', 'right'];
  }

  isPermanentDockItem() {
    return true;
  }
}
