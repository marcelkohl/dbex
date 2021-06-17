'use babel';

import {CompositeDisposable} from 'atom';
import Navigator from './view/navigator';
import DbexResult from './view/result';
import TreeView from './view/tree';
import CreateConnection from './view/create-connection';
import DataTable from "./component/data-table";
import HeaderOptions from "./view/header-options";
import StatusBarNotification from './component/status-bar-notification';
import Logger from './service/logger';


export default {
  navigatorView: null,
  subscriptions: null,
  savedConnectionsFileName: 'db-connections.json',
  savedConnections: [],
  statusBarNotification: undefined,
  pinnedConnectionName: undefined,

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

    let headerOptions = new HeaderOptions(this._getConnectionOptions());
    this.navigatorView.addElement(headerOptions.element);
    this.navigatorView.addElement(this.treeView.element);

    atom.commands.add('atom-workspace', 'dbex:execute-query', () => this.execQuery())
    this.statusBarNotification = new StatusBarNotification("");
  },

  execQuery() {
    let queryArea = atom.workspace.getActivePaneContainer().getActivePaneItem();

    //TODO: If query area is not the DbexResult, detect from status bar the selected database

    if (queryArea.constructor.name === "DbexResult") {
      // let query = queryArea.getQueryTextEditor().getSelectedText() || queryArea.getQueryTextEditor().getText()
      let query = queryArea.getQueryTextEditor();

      // this.logit(query, queryArea.uuid);

      if (query.constructor.name === 'TextEditor') {
        queryArea.onExecuteQuery(queryArea.uuid, query.getSelectedText() || query.getText());
      }
      // let query = queryArea.getQueryTextEditor().getText() : queryArea.getText();

    } else {
      // console.log(this.pinnedConnectionName);
      if (!this.pinnedConnectionName) {
        this.showError("Select a connection before running a query", "No connection selected");
        return;
      }

      let connInfo = this.treeView.getConnectionData(this.pinnedConnectionName);

      if (connInfo) {
        console.log(queryArea.getText());
        // let query = queryArea.constructor.name === "DbexResult" ? queryArea.getQueryTextEditor().getText() : queryArea.getText();
        // console.log("query on text not implemented, only on dbexResult");
        let query = queryArea.getSelectedText() || queryArea.getText();
        // this.logit(query, connInfo.name);
        // connInfo.name = query.replace(/("|')(?:\\\1|[^\1])*?\1/g, "").replace(/[^a-zA-Z]+/g, "");

        this._engineCall(
          {
            connection: connInfo.name,
            engine: connInfo.engine,
            node: connInfo
          },
          (engine, connection, nodeData, onSuccess, onFail)=>{
            // console.log("----->", engine, connection, nodeData);
            // engine.resolveDoubleClick(connection, nodeData, onSuccess, onFail);
            // let domain = connection + query.replace(/("|')(?:\\\1|[^\1])*?\1/g, "").replace(/[^a-zA-Z]+/g, "");

            // ${nodeData.name}-${nodeInfo.engine}

            // console.log("====>", domain, uuidv5(domain, uuidv5.DNS));
            // console.log("------x------");

            engine.getLogger().scope = nodeData.name;
            engine.executeQuery("", query, connection, nodeData, onSuccess);
          }
        );

      }
    }

    // console.log(query);
  },

  _getResultCustomOptions() {
    return [
      {
        icon: 'fa-outdent',
        onClick: ()=> false,
        tooltip: 'Format SQL',
        // classes: 'info',
      },
      {
        icon: 'fa-download',
        onClick: ()=> false,
        tooltip: 'Export result',
        // classes: 'info',
      },
    ];
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
        onClick: ()=> this._askRemoveConnection(),
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
      console.log(data);

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
      let engineInstance = subscribedPlugin(new Logger());
      this.engines[engineInstance.getName()] = engineInstance;
  },

  singleClickAction(nodeInfo) {
    console.log("click", nodeInfo);

    if (nodeInfo && nodeInfo.node) {
      console.log(nodeInfo);
      let connInfo = this.treeView.getConnectionData(nodeInfo.connection);
      this.statusBarNotification.selectedConnection = connInfo;
      this.pinnedConnectionName = nodeInfo.connection;
    }

    if (nodeInfo && nodeInfo.action) {
      let engine = this.engines[nodeInfo.engine];
      engine.getLogger().scope = nodeInfo.node.name;
      engine.resolveActionClick(nodeInfo.action, nodeInfo); //TODO: onsuccess, onfail
    }
  },

  doubleClickAction(nodeInfo) {
    console.log("Dblclick", nodeInfo);

    this._engineCall(
      nodeInfo,
      (engine, connection, nodeData, onSuccess, onFail)=>{
        engine.getLogger().scope = nodeData.name;
        engine.resolveDoubleClick(connection, nodeData, onSuccess, onFail);
      }
    );
  },

  _engineCall(nodeInfo, callback) {
    console.log("engineCall", nodeInfo);

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
      let onSuccess = (response, timestamp)=>{
        console.log("engine reponse", response);
        console.log('onSuccess timestamp', timestamp);

        if (response) {
          if (Array.isArray(response) && response[0].constructor.name === "TreeItem") {
            console.log("engine reponse is an Array of TreeItem");
            this.treeView.updateNodeChild(nodeData.name, response);
          } else if (response.constructor.name === "TreeItem") {
            console.log("engine reponse is a TreeItem");
            this.treeView.updateNode(response);
          } else if (response.constructor.name === "ResultSet") {
            console.log("engine reponse is a DbexResult");
            let resultName = (`debex-result-${nodeData.name}-${nodeInfo.engine}`).replace(/[^a-zA-Z0-9 ]/g, "-");
            console.log("=====>> we have a resultSet")
            let setResult = ()=>{
              // let datasetColumns = response.columns.map((c)=>{
              //   return {
              //     name: c.name,
              //     width: c.type === ResultSet.STRING ? 300 : 100
              //   }
              // });
              //
              // console.log("results=============>", datasetColumns);

              console.log("teh cols ==-=-=-=-==>>", response.columns);

              let datatable = new DataTable(`.${resultName} .result-data`, {
                columns: response.columns,
                data: response.data,
                id: resultName,
                // layout: 'fluid',
              });

              console.log("done engine response data");
            };

            let resultArea = document.getElementsByClassName(resultName);

            if (resultArea.length === 0) {
              if (response.columns && response.columns.length > 0) {
                let connInfo = this.treeView.getConnectionData(nodeInfo.connection);

                let resultView = new DbexResult({
                  name: resultName,
                  title: nodeData.name,
                  icon: 'icon-table',
                  color: connInfo.color ? `#${connInfo.color}` : "transparent",
                  customHeaderOptions: this._getResultCustomOptions(),
                });

                resultView.toolbar.message = (response.recordsAffected || response.data.length) + " rows in ~" + ((Date.now() - timestamp)/100)+"s";

                if (response.query && response.query.length > 0) {
                  resultView.setQuery(response.query.trim());
                }

                resultView.onExecuteQuery = (uuid, query) => {
                  console.log("execute the query", uuid, query);
                  // this.logit(query, nodeData.name);
                  engine.getLogger().scope = nodeData.name;

                  let startCall = Date.now();
                  resultView.toolbar.message = "Executing query...";
                  engine.executeQuery(uuid, query, nodeInfo.connection, nodeData, (response)=>onSuccess(response, startCall) );
                };

                resultView.onStopQuery = (uuid) => {
                  console.log("stop the query", uuid);
                };

                atom.workspace.open(
                  resultView, {
                    activatePane: true,
                    activateItem: true,
                  }
                ).then(setResult);
              }
            } else {
              console.log('dbresult already exists');
              resultArea[0].querySelector('.toolbar .options-label').innerHTML = (response.recordsAffected || response.data.length) + " rows in ~" + ((Date.now() - timestamp)/100)+"s";

              let paneName = `atom://${resultName}`;

              if (atom.workspace.paneForURI(paneName).activeItem.uri !== paneName) {
                atom.workspace.toggle(paneName);
              }

              if (response.columns && response.columns.length > 0) {
                setResult();
              }
            }
          }
        }
      };

      let startCall = Date.now();
      callback(engine, nodeInfo.connection, nodeData, (response)=>onSuccess(response, startCall), onFail);
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

  // consumeStatusBar(statusBar) {
  // },

  consumeStatusBar(statusBar) {
    statusBar.addLeftTile({item: this.statusBarNotification.getElement(), priority: 100});
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
    } else if (this.savedConnections.filter((e)=>e.name === name).length > 0 && (connectionData.customValues.name === undefined || connectionData.customValues.name !== name)) {
      alert("Connection with same name already exists");
      return false;
    }

    if (connectionData.customValues.name) {
      this._removeConnection(connectionData.customValues.name);
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

      connectionView.show(this.engines, nodeConn.engine);
      connectionView.setCustomFields(
        this.engines[nodeConn.engine].getConnectionSettings().custom,
        nodeConn.node
      );

      connectionView.setConnectionName(nodeConn.node.label);
      connectionView.setSelectedColor(nodeConn.node.color);
    }
  },

  _askRemoveConnection() {
    let nodeConn = this.treeView.getSelected();

    if (nodeConn && nodeConn.connection) {
      this.confirmRemoval(
        nodeConn.connection,
        ()=>this._removeConnection(nodeConn.connection)
      );
    } else {
      this.showError("Select a connection before removing");
    }
  },

  _removeConnection(connNameToRemove) {
    this.savedConnections = this.savedConnections.filter((connection)=>connection.name !== connNameToRemove);
    this._saveConnections(this.savedConnections);
    this.treeView.removeElementByConnectionName(connNameToRemove);
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
  },

  // logit(msg, logName) {
  //   let logPath = atom.packages.getLoadedPackage('dbex').path + "/logs/" + (logName || "general") + ".log";
  //   console.log(logPath);
  //   log(msg.replace(/\s\s+/g, ' '), logPath)
  // }
};
