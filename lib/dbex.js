'use babel';

import {CompositeDisposable} from 'atom';
import Navigator from './view/navigator';
import DbexResult from './view/dbex-result';
import TreeView from './view/tree';
import CreateConnection from './view/create-connection';
import DataTable from "frappe-datatable";
import HeaderOptions from "./view/header-options";

export default {
  navigatorView: null,
  subscriptions: null,
  savedConnectionsFileName: 'db-connections.json',
  savedConnections: [],

  activate() {
    this._loadSavedConnections();
    this.engines = {};

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

    this.treeView = new TreeView();
    this.treeView.setData(this._getInitialData());
    this.treeView.onClick = (nodeData)=>this.singleClickAction(nodeData);
    this.treeView.onDoubleClick = (nodeData)=>this.doubleClickAction(nodeData);

    this.navigatorView.addElement(new HeaderOptions(this._getConnectionOptions()));
    this.navigatorView.addElement(this.treeView.element)
  },

  _getConnectionOptions() {
    return [
      {
        icon: 'fa-plus',
        onClick: () => (this._getNewConnectionView()).show(this.engines),
        tooltip: 'Create a new connection'
      },
      {
        icon: 'fa-minus',
        onClick: ()=> this._removeConnection(),
        tooltip: 'Remove the selected connection'
      },
      {
        icon: 'fa-pencil',
        onClick: () =>  this._showEditConnection(),
        tooltip: 'Edit the selected connection'
      }
    ];
  },

  _getNewConnectionView() {
    let nconn = new CreateConnection();

    nconn.onSave = (data)=>{
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
      nconn.setCustomFields(value ? this.engines[value].getConnectionSettings().custom : {});
    };

    return nconn;
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

    if (!nodeInfo) {
      return;
    }

    let engine = nodeInfo.engine ? this.engines[nodeInfo.engine] : undefined;

    if (nodeInfo.node && engine) {
      let nodeData = nodeInfo.node;
      // delete nodeData.icon;

      console.log(nodeData.name);
      // this.treeView.updateControls(nodeData.name, '<i class="fa fa-circle-o-notch fa-spin fa-3x fa-fw" style="color:yellow;"></i>');

      let onFail = (message)=>{
        // this.treeView.updateControls(nodeData.name, '<i class="fa fa-exclamation-triangle vague text-danger" aria-hidden="true"></i>');
        this.showError(message, "dbex engine failed");
      };
      let onSuccess = (response)=>{
        console.log("dblClick reponse", response);

        if (response) {
          if (Array.isArray(response) && response[0].constructor.name === "TreeItem") {
            console.log("dblClick reponse is an Array of TreeItem");
            this.treeView.updateNodeChild(nodeData.name, response);
          } else if (response.constructor.name === "TreeItem") {
            console.log("dblClick reponse is a TreeItem");
            this.treeView.updateNode(response);
          } else if (response.constructor.name === "ResultSet") {
            let resultName = (`debex-result-${nodeData.name}-${nodeInfo.engine}`).replace(/[^a-zA-Z0-9 ]/g, "-");
            let setResult = ()=>{
              let datasetColumns = response.columns.map((c)=>{
                return {name: c, width: 100}
              });

              let datatable = new DataTable(`.${resultName} .result-data`, {
                columns: datasetColumns,
                data: response.data,
                // layout: 'fluid',
              });
            };

            if (document.getElementsByClassName(resultName).length === 0) {
              let resultList = new DbexResult({name:resultName, title:nodeData.name, icon:'icon-table'})

              atom.workspace.open(
                resultList, {
                  activatePane: true,
                  activateItem: true,
                }
              ).then(setResult);
            } else {
              atom.workspace.toggle(`atom://${resultName}`);
              setResult();
            }
          }
        }
      };

      engine.resolveDoubleClick(nodeInfo.connection, nodeData, onSuccess, onFail);
    }
  },

  _getInitialData() {
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

    this.treeView.setData(this._getInitialData());
    this._saveConnections(this.savedConnections);

    return true;
  },

  _showEditConnection() {
    let nodeConn = this.treeView.getSelected();

    if (nodeConn && nodeConn.connection) {
      let connectionView = this._getNewConnectionView();

      connectionView.show(this.engines, nodeConn.node.label, nodeConn.engine);
      console.log(nodeConn);

    }
  },

  _removeConnection() {
    let nodeConn = this.treeView.getSelected();

    if (nodeConn && nodeConn.connection) {
      this.confirmRemoval(
        nodeConn.connection,
        ()=>{
          this.savedConnections = this.savedConnections.filter((connection)=>connection.name !== nodeConn.connection);
          this._saveConnections(this.savedConnections);
          this.treeView.removeElementByConnectionName(nodeConn.connection);
        }
      );
    } else {
      this.showError("Select a connection before removing");
    }
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
  },

  confirmRemoval(connectionName, onConfirm) {
    let notification = atom.notifications.addWarning(
      "dbex - Connection Removal",
      {
        buttons: [
          {
            className: "btn-details",
            onDidClick: ()=>{
              onConfirm();
              notification.dismiss();
            },
            text: "Yes"
          },
          {
            className: "btn-details",
            onDidClick: ()=>notification.dismiss(),
            text: "No"
          },
        ],
        detail: `Confirm removal of the ${connectionName} connection?`,
        dismissable: true
      }
    );
  }
};
