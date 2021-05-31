'use babel';

class TreeNode {
  constructor(item) {
    const {label, name, icon, children, details, collapsed, datasets, classes, actions} = item;
    this.children = item.children;
    this.item = item;
    this.classes = classes === undefined ? [] : classes;

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

    const actionsElement = document.createElement('span');
    actionsElement.classList.add('item-actions', 'vague-reverse');

    if (actions) {
      actions.forEach((action) => {
        let actionElement = document.createElement('span');

        actionElement.classList.add('item-action', action.icon);
        Object.assign(actionElement.dataset, {name: action.name});

        actionsElement.appendChild(actionElement);
      });
    }

    this.element = document.createElement('li');

    Object.assign(this.element.dataset, {name: name, label: label, icon: categoryClass}, datasets);

    // if (children) {
      this.element.classList.add('list-nested-item', 'list-selectable-item', collapsed, ...this.classes);
      // Object.assign(this.element.dataset, {name: name, label: label}, datasets);

      const root = document.createElement('div');
      root.classList.add('list-item', 'tree-view-root');

      root.appendChild(actionsElement);
      root.appendChild(accessElement);
      this.element.appendChild(root);

      if (children && children.length > 0) {
        this.element.classList.add('has-children');

        // const childElement = generateChildren

        this.element.appendChild(TreeNode.generateChildren(children));
      }

    // } else {
    //   this.element.classList.add('list-item', 'list-selectable-item', ...this.classes);
    //   // Object.assign(this.element.dataset, {name: name, label: label}, datasets);
    //
    //   this.element.appendChild(actionsElement);
    //   this.element.appendChild(accessElement);
    // }
  }

  setSelected() {
    this.element.classList.add('selected');
  }

  hide() {
    this.element.style.display = 'none';
  }

  static generateChildren(children) {
    let childElement = document.createElement('ul');
    childElement.classList.add('list-tree');
// console.log('children ==>', children);
    children.forEach((child, i) => {
      // console.log('child ==>', child);
      child.element = (new TreeNode(child)).element;
      childElement.appendChild(child.element);
    });

// console.log('chidlElement ==>', childElement);
    return childElement;
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

    this.list.querySelector(`[data-name="${data.datasets.name}"]`).replaceWith(updatedNode.element);
  }

  updateNodeChild(nodeName, data) {
    let updatedNode = TreeNode.generateChildren(data);
    let nodeToUpdate = this.list.querySelector(`[data-name="${nodeName}"]`);
    let oldChildren = nodeToUpdate.getElementsByTagName('ul');

    if (oldChildren.length > 0) {
      oldChildren[0].remove();
    }

    nodeToUpdate.classList.add('has-children');
    nodeToUpdate.classList.remove('collapsed');
    nodeToUpdate.appendChild(updatedNode);
  }

  updateControls(nodeName, content) {
    console.log(nodeName, this.list);
    this.list.querySelector(`[data-name="${nodeName}"] .item-actions`).innerHTML = content;
  }

  setClassOnNode(nodeName, className, remove) {
    let node = this.list.querySelector(`[data-name="${nodeName}"]`);

    if (node) {
      if (remove === true) {
        node.classList.remove(className)
      } else {
        node.classList.add(className)
      }
    }
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
    let action, engine, connection;

    event.stopPropagation();

    if (target.classList.contains('item-action')) {
      action = target.dataset.name || undefined;
    }

    if (target.closest("[data-engine]")) {
      engine = target.closest("[data-engine]").dataset["engine"];
      connection = target.closest("[data-engine]").dataset["name"];
    }

    if (target.classList.contains('list-nested-item')) {
      currentNode = target;
    } else if (target.classList.contains('list-tree')) {
      currentNode = target.closest('.list-nested-item');
    } else if (target.classList.contains('tree-view-root') && target.closest('.list-nested-item').classList.contains('has-children')) {
      currentNode = target.closest('.list-nested-item');
      collapsed = true;
      console.log("=====> click collapse");
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

    return {
      action: action,
      engine: engine,
      connection: connection,
      node: currentNode.dataset
    };
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
