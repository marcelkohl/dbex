'use babel';

import { v4 as uuidv4 } from 'uuid';

class TreeNode {
  constructor(item) {
    const {label, name, icon, children, details, collapsed, datasets, classes, actions} = item;

    this.children = children;
    this.classes = classes === undefined ? [] : classes;

    let categoryClass = icon ? [`${icon}`] : [];
    let iconClass = ['icon', ...categoryClass];

    let nameElement = document.createElement('span');
    nameElement.classList.add(...iconClass);
    nameElement.innerHTML = label;

    let detailsElement = document.createElement('span');
    detailsElement.classList.add('details', 'status-ignored');
    detailsElement.innerHTML = details || '';

    let accessElement = document.createElement('span');
    accessElement.appendChild(nameElement);
    accessElement.appendChild(detailsElement);

    let actionsElement = document.createElement('span');
    actionsElement.classList.add('item-actions', 'vague-reverse');

    if (actions) {
      actions.forEach((action) => {
        let actionElement = document.createElement('span');

        if (action.description) {
          actionElement.setAttribute('title', action.description);
        }

        actionElement.classList.add('item-action', action.icon);
        Object.assign(actionElement.dataset, {name: action.name});

        actionsElement.appendChild(actionElement);
      });
    }

    this.element = document.createElement('li');
    this.element.classList.add('list-nested-item', 'list-selectable-item', collapsed, ...this.classes);

    Object.assign(this.element.dataset, {uuid: uuidv4(), name: name, label: label, icon: categoryClass}, datasets);

    let root = document.createElement('div');
    let nodeColor = datasets ? (datasets.color ? `#${datasets.color}` : "transparent") : "transparent";

    root.classList.add('list-item', 'tree-view-root');
    root.style.borderLeft = `3px solid ${nodeColor}`;

    root.appendChild(actionsElement);
    root.appendChild(accessElement);

    this.element.appendChild(root);

    if (children && children.length > 0) {
      this.element.classList.add('has-children');

      this.element.appendChild(TreeNode.generateChildren(children));
    }
  }

  hide() {
    this.element.style.display = 'none';
  }

  static generateChildren(children) {
    let childElement = document.createElement('ul');
    childElement.classList.add('list-tree');

    children.forEach((child) => {
      child.element = (new TreeNode(child)).element;
      childElement.appendChild(child.element);
    });

    return childElement;
  }
}

export default class Tree {
  constructor({customClass}) {
    this._onClick = (event)=>this._parseClick(event);
    this._onDoubleClick = (event)=>this._parseClick(event);

    this.element = document.createElement('div');
    this.element.classList.add('navigator-tree-view');

    if (customClass) {
      this.element.classList.add(customClass);
    }

    this.list = document.createElement('ul');
    this.list.classList.add('list-tree', 'has-collapsable-children');

    this.element.appendChild(this.list);

    this._setEvents();
  }

  _setEvents() {
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

  dispose() {
    this.destroy();
  }

  updateNode(uuid, data) {
    this.list.querySelector(`[data-uuid="${uuid}"]`)
      .replaceWith(
        (new TreeNode(data)).element
      );
  }

  updateNodeChild(uuid, data) {
    let nodeToUpdate = this.list.querySelector(`[data-uuid="${uuid}"]`);
    let oldChildren = nodeToUpdate.getElementsByTagName('ul');

    if (oldChildren.length > 0) {
      oldChildren[0].remove();
    }

    nodeToUpdate.classList.add('has-children');
    nodeToUpdate.classList.remove('collapsed');
    nodeToUpdate.appendChild(TreeNode.generateChildren(data));
  }

  setData(sourceData) {
    let data = JSON.parse(JSON.stringify(sourceData));

    this.rootNode = new TreeNode(data);

    while (this.list.firstChild) {
      this.list.removeChild(this.list.firstChild);
    }

    for (const child of this.rootNode.children) {
      this.list.appendChild(child.element);
    }
  }

  get selected() {
    let nodeSelected = this.element.getElementsByClassName('selected')[0];

    return nodeSelected ? this.getDatasetFromElement(nodeSelected) : {};
  }

  removeNodeByName(name) {
    let element = this.element.querySelector(`[data-name="${name}"]`);

    if (element) {
      element.parentElement.removeChild(element);
    }
  }

  getConnectionData(connectionName) {
    let element = document.querySelector(`[data-engine][data-name='${connectionName}']`);

    return element ? element.dataset : undefined;
  }

  getNestedNode(target) {
    return target.classList.contains('list-nested-item') ? target : target.closest('.list-nested-item');
  }

  getDatasetFromElement(target) {
    let action, engine, connection;
    let nestedNode = this.getNestedNode(target);

    if (nestedNode === null) {
      return;
    }

    if (target.classList.contains('item-action')) {
      action = target.dataset.name || undefined;
    }

    if (nestedNode.closest("[data-engine]")) {
      engine = nestedNode.closest("[data-engine]").dataset["engine"];
      connection = nestedNode.closest("[data-engine]").dataset["name"];
    }

    return {
      action: action,
      engine: engine,
      connection: connection,
      isRoot: target.parentElement.parentElement.classList.contains('connections-tree'),
      node: Object.assign({}, nestedNode.dataset)
    };
  }

  _parseClick(event) {
    event.stopPropagation();
    return this.getDatasetFromElement(event.target);
  }

  set onClick(onClick) {
    this._onClick = (event)=>{
      this._setSelected(event.target);
      this._setCollapsed(event.target);
      onClick(this._parseClick(event));
    }
  }

  set onDoubleClick(onDoubleClick) {
    this._onDoubleClick = (event)=>{
      onDoubleClick(this._parseClick(event));
    }
  }

  _setCollapsed(target) {
    let nestedNode = this.getNestedNode(target);

    if (target.classList.contains('list-item') && nestedNode.classList.contains('has-children')) {
        nestedNode.classList.toggle('collapsed');
    }
  }

  _setSelected(target) {
    let nestedNode = this.getNestedNode(target);

    if (!nestedNode.classList.contains("selected")) {
      document.querySelectorAll('.list-selectable-item').forEach((item) => {
        item.classList.remove('selected');
      });

      nestedNode.classList.add('selected');
    }
  }
}
