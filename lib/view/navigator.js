'use babel';

export default class Navigator {
  constructor({name, title, icon, allowedLocations}) {
    this.uri = 'atom://' + name;
    this.title = title;
    this.icon = icon;
    this.allowedLocations = allowedLocations || ['left', 'right'];

    this.element = document.createElement('div');
    this.element.classList.add('tool-panel', 'focusable-panel', name);
    this.element.tabIndex = -1;
  }

  addElement(element) {
    this.element.appendChild(element);
  }

  getEditor() {
    return atom.workspace.getActiveTextEditor();
  }

  serialize() {}

  dispose() {
    //
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
    return true;
  }
}
