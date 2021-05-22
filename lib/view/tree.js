'use babel';

class TreeNode {
  constructor(item) {
    const {label, name, icon, children, details, collapsed, datasets} = item;
    this.children = item.children;
    this.item = item;

    const categoryClass = icon ? [`${icon}`] : [];
    const iconClass = ['icon', ...categoryClass];

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
      this.element.classList.add('list-nested-item', 'list-selectable-item', collapsed);
      Object.assign(this.element.dataset, {name: name, label: label}, datasets);

      const root = document.createElement('div');
      root.classList.add('list-item', 'tree-view-root');

      const childElement = document.createElement('ul');
      childElement.classList.add('list-tree');

      children.forEach((child, i) => {
        child.element = (new TreeNode(child)).element;
        childElement.appendChild(child.element);
      });

      root.appendChild(accessElement);
      this.element.appendChild(root);
      this.element.appendChild(childElement);
    } else {
      this.element.classList.add('list-item', 'list-selectable-item');
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
    this._onClick = (ev)=>this._parseClick(ev);
    this._onDoubleClick = (ev)=>this._parseClick(ev);

    this.element = document.createElement('div');
    this.element.classList.add('navigator-tree-view');

    this.list = document.createElement('ul');
    this.list.classList.add('list-tree', 'has-collapsable-children');

    this.element.appendChild(this.list);

    this._setEvents();
  }

  _setEvents(element) {
    this.element.addEventListener('dblclick', (event) => {
      this._onDoubleClick(event);
    });

    this.element.addEventListener('click', (event) => {
      this._onClick(event);
    });
  }

  destroy() {
    this.remove();
  }

  updateNode(data) {
    let updatedNode = new TreeNode(data);

    this.list.querySelector(`[data-name="${data.name}"]`).replaceWith(updatedNode.element);
  }

  setData(sourceData, sortByName = true, ignoreRoot = true) {
    let data = JSON.parse(JSON.stringify(sourceData));

    if (sortByName) {
      this.sortByName(data);
    }

    this.rootNode = new TreeNode(data);

    while (this.list.firstChild) {
      this.list.removeChild(this.list.firstChild);
    }

    if (ignoreRoot) {
      for (const child of this.rootNode.children) {
        this.list.appendChild(child.element);
      }
    } else {
      this.list.appendChild(data.element);
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

  _parseClick(event) {
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

    if (!currentNode.classList.contains("selected")) {
      this.clearSelect();
      currentNode.classList.add('selected');
    }

    return currentNode.dataset;
  }

  set onClick(onClick) {
    this._onClick = (event)=>{
      onClick(this._parseClick(event));
    }
  }

  set onDoubleClick(onDoubleClick) {
    this._onDoubleClick = (event)=>{
      onDoubleClick(this._parseClick(event));
    }
  }

  clearSelect() {
    document.querySelectorAll('.list-selectable-item').forEach((item) => {
      item.classList.remove('selected');
    });
  }

  select(item, currentScrollTop, currentScrollBottom) {
    this.clearSelect();
    if (item != null) {
      item.setSelected();
      const element = item.element;
      if (element.offsetTop < currentScrollTop || element.offsetTop > currentScrollBottom) {
        return item.element.offsetTop;
      }
    }

    return null;
  }
}
