'use babel';

import { Disposable, CompositeDisposable } from 'atom';
import Navigator from './view/navigator';
import TreeView from './view/tree';
import TreeItem from './dataModel/tree-item';
import CreateConnection from './view/create-connection';

export default {
  navigatorView: null,
  subscriptions: null,
  savedConnectionsFileName: 'db-connections.json',
  savedConnections: [],

  activate() {
    this._loadSavedConnections();

    this.navigatorView = new Navigator({name:'dbex', title:'Databases', icon:'database'});
    this.subscriptions = new CompositeDisposable();
    this.positionHidden = atom.config.get('dbex.position') === 'Hidden';

    if (this.positionHidden) {
      this.subscriptions.add(atom.commands.add('atom-workspace', {
        'dbex:toggle': () => {
          atom.confirm({
            message: 'You have set the [Position] to [Hidden] in Settings. If you want to toggle dbex, please change the setting to [Left] or [Right].',
            buttons: {
              Ok: () => {},
            },
          });
        },
      }));
    } else {
      const showOnAttach = atom.config.get('dbex.autoRevealOnStart');

      this.viewOpenPromise = atom.workspace.open(
        this.navigatorView, {
          activatePane: showOnAttach,
          activateItem: showOnAttach,
        }
      );
    }

    this.engines = {};

    let nconn = new CreateConnection();
    nconn.onSave = (data)=>{
      console.log("save", data);
      return this._addConenction(data);
    };
    nconn.onTestConnection = (data)=> {
      if (data.engine.length > 0) {
        this.engines[data.engine].testConnection(
          data,
          (result)=>alert("Test connection returned success!"),
          (result)=>alert("Failed with message:\n" + result)
        );
      }
    }
    nconn.onSelectConnection = (value)=>{
      console.log("selcted", value)
      nconn.setCustomFields(value ? this.engines[value].getConnectionSettings().custom : {});
    };

    const connect = document.createElement('div');
    connect.innerHTML = this.getConnectView();
    let addConnButton = connect.getElementsByClassName('add-connection')[0];
    addConnButton.addEventListener(
      'click',
      () => nconn.show(this.engines)
    );
    atom.tooltips.add(addConnButton, {title: 'Create a new connection'});
    this.navigatorView.addElement(connect)

    this.treeView = new TreeView();
    this.treeView.setData(this.getInitialData());
    this.treeView.onClick = (nodeData)=>this.singleClickAction(nodeData);
    this.treeView.onDoubleClick = (nodeData)=>this.doubleClickAction(nodeData);
    this.navigatorView.addElement(this.treeView.element)

    console.log("====> dbex", this)
  },

  getSubscribedPlugins(subscribedPlugin) {
      let engineInstance = subscribedPlugin();
      this.engines[engineInstance.getName()] = engineInstance;
  },

  singleClickAction(nodeInfo) {
    console.log("click", nodeInfo);

    if (nodeInfo && nodeInfo.action) {
      let engine = this.engines[nodeInfo.engine];
      engine.resolveActionClick(nodeInfo.action, nodeInfo); //TODO: onsuccess, onfail
    }
  },

  doubleClickAction(nodeInfo) {
    console.log("Dblclick", nodeInfo);
    let engine = nodeInfo.engine ? this.engines[nodeInfo.engine] : undefined;

    if (nodeInfo.node && engine) {
      let nodeData = nodeInfo.node;
      // delete nodeData.icon;

      console.log(nodeData.name);
      // this.treeView.updateControls(nodeData.name, '<i class="fa fa-circle-o-notch fa-spin fa-3x fa-fw" style="color:yellow;"></i>');

      let onFail = (message)=>{
        // this.treeView.updateControls(nodeData.name, '<i class="fa fa-exclamation-triangle vague text-danger" aria-hidden="true"></i>');
        this.showError(message, "Failed to get structure");
      };
      let onSuccess = (responseNode)=>{
        console.log("dblClick reponse", responseNode);
        // this.treeView.updateControls(nodeData.name, "")
        if (responseNode) {
          this.treeView.updateNode({
            name: nodeData.name,
            label: nodeData.label,
            icon: nodeData.icon,
            details: "",
            children: responseNode,
            // classes: "structured",
            datasets: nodeData
          });
        }
      };

      engine.resolveDoubleClick(nodeInfo.connection, nodeData, onSuccess, onFail);
    }
  },

  getConnectView() {
    return `
    <div tabindex="-1" class="dbex-controls">
      <header class="header">
        <span class="header-item options-label pull-right">
          <span class="btn-group btn-toggle btn-group-options">
            <button class="btn add-connection" data-original-title="" title="">
              <i class="fa fa-plus" aria-hidden="true"></i>
            </button>
            <button class="btn" data-original-title="" title="">
              <i class="fa fa-minus" aria-hidden="true"></i>
            </button>
            <button class="btn" data-original-title="" title="">
              <i class="fa fa-pencil" aria-hidden="true"></i>
            </button>
          </span>
        </span>
      </header>
    </div>`;
  },

  getInitialData() {
    return {
      label: 'root',
      icon: null,
      children: this.savedConnections
    }
  },

  deactivate() {
    this.subscriptions.dispose();
    this.navigatorView.destroy();
    this.navigatorView = null;
  },

  consumeStatusBar(statusBar) {
  },

  _loadSavedConnections() {
      let fs = require("fs");
      let filePath = atom.packages.getLoadedPackage('dbex').path + "/" + this.savedConnectionsFileName;

      if (fs.existsSync(filePath)) {
        let data = fs.readFileSync(filePath);
        let parsedData = JSON.parse(data);

        this.savedConnections = parsedData.length > 0 ? parsedData : [];
      } else {
        this.savedConnections = [];
      }
  },

  _addConenction(connectionData) {
    let name = connectionData.name.replace(/\s+/g, '').toLowerCase();
    let label = connectionData.name;

    if (name.length === 0) {
      alert("Name cannot be empty");
      return false;
    } else if (this.savedConnections.filter((e)=>e.name === name).length > 0) {
      alert("Connection with same name already exists");
      return false;
    }

    delete connectionData.name;

    this.savedConnections.push({
      icon: this.engines[connectionData.engine].getIconClass() || 'icon-database',
      label: label,
      name: name,
      details: "",
      collapsed: 'collapsed',
      datasets: connectionData
    });

    this.treeView.setData(this.getInitialData());
    this._saveConnections(this.savedConnections);

    return true;
  },

  _removeConnection(connectionName) {
    // update internal list
    // remove from view
    // use _saveConnection(updatedList)
  },

  _saveConnections(connections) {
    let fs = require("fs");
    let filePath = atom.packages.getLoadedPackage('dbex').path + "/" + this.savedConnectionsFileName;

    fs.writeFile(filePath, JSON.stringify(connections), function (err) {
      if (err) {
        alert(err);
      }
    });
  },

  showError(message, title) {
    atom.notifications.addError(
      title || "dbex",
      {
          buttons: [],
          detail: message,
          dismissable: true
      }
    );
  }
};
