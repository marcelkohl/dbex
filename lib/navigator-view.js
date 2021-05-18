'use babel';

import { CompositeDisposable } from 'atom';
import TreeView from './tree-view';

const SYMBOLS_NAVIGATOR = 'atom://dbex';
const SYMBOLS_NAVIGATOR_TITLE = 'Databases';
const SYMBOLS_NAVIGATOR_ICON = 'database';

export default class SymbolsNavigatorView {
  constructor() {
    this.toolbar = document.createElement('div');
    this.toolbar.classList.add('super-hyper-001');

    this.element = document.createElement('div');
    this.element.classList.add('dbex', 'tool-panel', 'focusable-panel');
    this.element.tabIndex = -1;

    this.subscriptions = new CompositeDisposable();
    this.treeView = new TreeView();
    this.element.appendChild(this.toolbar);
    this.element.appendChild(this.treeView.element);

    this.subscriptions.add(atom.workspace.onDidOpen(() => {
      this.removeEventForEditor();
      this.populate();
    }));

    this.populate();
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

  populate() {
    const editor = this.getEditor();

    if (editor != null) {
      let filePath = editor.getPath();
      if (filePath !== this.previousFilePath || this.refreshTag) {
        this.generateTags(filePath);
        this.refreshTag = false;
        this.currentTag = null;
      }

      this.previousFilePath = filePath;

      this.onEditorSave = editor.onDidSave((event) => {
        filePath = event.path;
        this.generateTags(filePath);
      });

      this.onChangeRow = editor.onDidChangeCursorPosition(
        ({ oldBufferPosition, newBufferPosition }) => {
          if (oldBufferPosition.row !== newBufferPosition.row) {
            this.focusCurrentCursorTag();
          } else {
            // this.statusBarManager.update(this.currentTag);
          }
        },
      );
    } else {
      this.previousFilePath = '';
      this.treeView.setEmptyRoot();
    }
  }

  focusCurrentCursorTag() {
    let editor;

    if ((editor = this.getEditor()) && (this.parser != null)) {
      const { row } = editor.getCursorBufferPosition();
      const tag = this.parser.getNearestTag(row);
      const currentScrollTop = this.element.scrollTop;
      const currentScrollBottom = this.element.scrollTop + this.element.offsetHeight;
      const changeScroll = this.treeView.select(tag, currentScrollTop, currentScrollBottom);

      if (changeScroll != null) {
        this.element.scrollTop = changeScroll;
      }

      this.currentTag = tag;
    }
  }

  generateTags(filePath) {
    let root = {
        label: 'root',
        icon: null,
        children: [{
          icon: "icon-database",
          label: "Magento-01",
          name: "App\Recipe\Normalizer\Exporter\UnitNormalizer",
          parent: null,
          signature: "",
          children: [
            {
              icon: "icon-table",
              label: "Products",
              name: "The Child",
              parent: null,
              signature: "",
              children: [
                {
                  icon: "icon-pk",
                  label: "id",
                  name: "The Child",
                  parent: null,
                  signature: "int(4) not null",
                },
                {
                  icon: "icon-fk",
                  label: "tax_id",
                  name: "The Child",
                  parent: null,
                  signature: "int(4) not null",
                },
                {
                  icon: "icon-field",
                  label: "title",
                  name: "The Child",
                  parent: null,
                  signature: "varchar(256)",
                },
                {
                  icon: "icon-field",
                  label: "uuid",
                  name: "The Child",
                  parent: null,
                  signature: "int(36) not null",
                },
              ]
            },
            {
              icon: "icon-table",
              label: "Customers",
              name: "The Child",
              parent: null,
              signature: "",
            }
          ]
        }],
    };

    this.treeView.setRoot(root, this.sortByName);
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
    return SYMBOLS_NAVIGATOR;
  }

  getTitle() {
    return SYMBOLS_NAVIGATOR_TITLE;
  }

  getIconName() {
    return SYMBOLS_NAVIGATOR_ICON;
  }

  getAllowedLocations() {
    return ['left', 'right'];
  }

  isPermanentDockItem() {
    return true;
  }
}
