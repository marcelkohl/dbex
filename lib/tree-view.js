'use babel';

class TreeNode {
  constructor(item) {
    const { label, icon, children, access, signature, position } = item;
    this.item = item;
    this.item.view = this;

    const categoryClass = icon ? [`${icon}`] : [];

    const iconClass = ['icon'];
    iconClass.push(...categoryClass);

    const signatureClass = ['signature', 'status-ignored'];
    // const collapsed = atom.config.get('symbols-navigator.collapsedByDefault') ? ['collapsed'] : [];
    const collapsed = false;

    const accessElement = document.createElement('span');

    const nameElement = document.createElement('span');
    nameElement.classList.add(...iconClass);
    nameElement.innerHTML = label;

    const signatureElement = document.createElement('span');
    signatureElement.classList.add(...signatureClass);
    signatureElement.innerHTML = signature;

    accessElement.appendChild(nameElement);
    accessElement.appendChild(signatureElement);

    this.element = document.createElement('li');

    if (children) {
      this.element.classList.add('list-nested-item', 'list-selectable-item', ...collapsed);
      this.element.dataset.title = label;

      const symbolRoot = document.createElement('div');
      symbolRoot.classList.add('list-item', 'tree-view-root');

      const childElement = document.createElement('ul');
      childElement.classList.add('list-tree');

      for (const child of children) {
        const childTreeNode = new TreeNode(child);
        childElement.appendChild(childTreeNode.element);
      }

      symbolRoot.appendChild(accessElement);
      this.element.appendChild(symbolRoot);
      this.element.appendChild(childElement);
    } else {
      this.element.classList.add('list-item', 'symbol-item', 'list-selectable-item');
      this.element.dataset.title = label;

      this.element.appendChild(accessElement);
    }
  }

  setSelected() {
    this.element.classList.add('selected');
  }

  hide() {
    this.element.style.display = 'none';
  }
}

export default class TreeView {
  constructor() {
    this.element = document.createElement('div');
    this.element.classList.add('symbols-navigator-tree-view');

    this.list = document.createElement('ul');
    this.list.classList.add('list-tree', 'has-collapsable-children');

    this.element.appendChild(this.list);

    this.element.addEventListener('click', (event) => {
      console.log("Click event")
      this.onClick(event);
    });

    this.element.addEventListener('dblclick', (event) => {
      console.log("Double click event")
      this.onDblClick(event);
    });
  }

  destroy() {
    this.remove();
  }

  setRoot(rootData, sortByName = true, ignoreRoot = true) {
    this.sortByName(rootData);

    this.rootNode = new TreeNode(rootData);

    while (this.list.firstChild) {
      this.list.removeChild(this.list.firstChild);
    }

    if (ignoreRoot) {
      for (const child of rootData.children) {
        this.list.appendChild(child.view.element);
      }
    } else {
      this.list.appendChild(rootData.view.element);
    }
  }

  setEmptyRoot() {
    this.rootNode = new TreeNode({});
    while (this.list.firstChild) {
      this.list.removeChild(this.list.firstChild);
    }
  }

  traversal = (node, doing) => {
    doing(node);
    if (node.children) {
      for (const child of node.children) {
        this.traversal(child, doing);
      }
    }
  }

  toggleTypeVisible = (type) => {
    this.traversal(this.rootNode.item, (item) => {
      if (item.type === type) {
        item.view.hide();
      }
    });
  }

  sortByName = (rootData) => {
    this.traversal(rootData, (node) => {
      if (node.children != null) {

      }
    });
  }

  sortByRow = (rootData) => {
    this.traversal(rootData, (node) => {
      if (node.children != null) {
        node.children.sort((a, b) => {
          return a.position.row - b.position.row;
        });
      }
    });
  }

  onClick(event) {
    const target = event.target;
    let currentNode;
    let collapsed = false;

    event.stopPropagation();

    if (target.classList.contains('list-nested-item')) {
      currentNode = target;
    } else if (target.classList.contains('list-tree')) {
      currentNode = target.closest('.list-nested-item');
    } else if (target.classList.contains('tree-view-root')) {
      currentNode = target.closest('.list-nested-item');
        collapsed = true;
    } else if (target.closest('.list-item') && target.closest('.list-item').classList.contains('tree-view-root')) {
      currentNode = target.closest('.list-nested-item');
      if (atom.config.get('symbols-navigator.collapseClick') === 'Collapse item' && atom.config.get('symbols-navigator.clickType') === 'Single Click') {
        collapsed = true;
      }
    } else {
      currentNode = target.closest('.list-item');
    }

    if (currentNode === null) {
      return;
    }

    if (collapsed) {
      currentNode.classList.toggle('collapsed');
      return;
    }
    this.clearSelect();
    currentNode.classList.add('selected');

    if (atom.config.get('symbols-navigator.clickType') === 'Single Click') {
      console.log("Single click")
    }
  }

  onDblClick(event) {
    const target = event.target;
    let currentNode = target;

    if (atom.config.get('symbols-navigator.clickType') === 'Double Click') {
      const editor = atom.workspace.getActiveTextEditor();
      if (currentNode.dataset.row && currentNode.dataset.row >= 0 && editor != null) {
        console.log("Double click clickType")
        // this.moveToSelectedSymbol();
      }
    }
  }

  clearSelect() {
    const allItems = document.querySelectorAll('.list-selectable-item');
    for (const item of allItems) {
      item.classList.remove('selected');
    }
  }

  select(item, currentScrollTop, currentScrollBottom) {
    this.clearSelect();
    if (item != null) {
      item.view.setSelected();
      const element = item.view.element;
      if (element.offsetTop < currentScrollTop || element.offsetTop > currentScrollBottom) {
        return item.view.element.offsetTop;
      }
    }

    return null;
  }
}
