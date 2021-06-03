'use babel';

export default class DbexResult {
  constructor({name, title, icon, allowedLocations}) {
    this.uri = 'atom://' + name;
    this.title = title;
    this.icon = icon;
    this.allowedLocations = allowedLocations || ['bottom'];

    this.element = document.createElement('div');
    this.element.classList.add('tool-panel', 'focusable-panel', 'dbex-result-view', name);
    this.element.tabIndex = -1;
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
