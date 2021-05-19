'use babel';

class TreeNode {
  constructor(item) {
    const {label, name, icon, children, details, datasets} = item;
    this.item = item;
    this.item.view = this;

    const categoryClass = icon ? [`${icon}`] : [];
    const iconClass = ['icon', ...categoryClass];
    const collapsed = atom.config.get('dbex.collapsedByDefault') ? ['collapsed'] : [];

    const nameElement = document.createElement('span');
    nameElement.classList.add(...iconClass);
    nameElement.innerHTML = label;

    const detailsElement = document.createElement('span');
    detailsElement.classList.add('details', 'status-ignored');
    detailsElement.innerHTML = details;

    const accessElement = document.createElement('span');
    accessElement.appendChild(nameElement);
    accessElement.appendChild(detailsElement);

    this.element = document.createElement('li');

    if (children) {
      this.element.classList.add('list-nested-item', 'list-selectable-item', ...collapsed);
      Object.assign(this.element.dataset, {name: name, label: label}, datasets);

      const root = document.createElement('div');
      root.classList.add('list-item', 'tree-view-root');

      const childElement = document.createElement('ul');
      childElement.classList.add('list-tree');

      for (const child of children) {
        const childTreeNode = new TreeNode(child);
        childElement.appendChild(childTreeNode.element);
      }

      root.appendChild(accessElement);
      this.element.appendChild(root);
      this.element.appendChild(childElement);
    } else {
      this.element.classList.add('list-item', 'symbol-item', 'list-selectable-item');
      Object.assign(this.element.dataset, {name: name, label: label}, datasets);

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
    this.element.classList.add('navigator-tree-view');

    this.list = document.createElement('ul');
    this.list.classList.add('list-tree', 'has-collapsable-children');

    this.element.appendChild(this.list);

    this._setEvents();
  }

  _setEvents(element) {
    this.element.addEventListener('dblclick', (event) => {
      this.onDblClick(event);
    });

    this.element.addEventListener('click', (event) => {
      this.onClick(event);
    });
  }

  destroy() {
    this.remove();
  }

  setData(data, sortByName = true, ignoreRoot = true) {
    if (sortByName) {
      this.sortByName(data);
    }

    this.rootNode = new TreeNode(data);

    while (this.list.firstChild) {
      this.list.removeChild(this.list.firstChild);
    }

    if (ignoreRoot) {
      for (const child of data.children) {
        this.list.appendChild(child.view.element);
      }
    } else {
      this.list.appendChild(data.view.element);
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

  sortByName = (data) => {
    this.traversal(data, (node) => {
      if (node.children != null) {

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
      if (atom.config.get('dbex.collapseClick') === 'Collapse item' && atom.config.get('dbex.clickType') === 'Single Click') {
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

    console.log("Single click", currentNode.dataset);
  }

  onDblClick(event) {
    event.stopPropagation();
    console.log("Double click clickType")
  }

  clearSelect() {
    document.querySelectorAll('.list-selectable-item').forEach((item) => {
      item.classList.remove('selected');
    });
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
