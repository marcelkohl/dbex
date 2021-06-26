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
import FilterOnTree from './component/filter-on-tree';
import ResultSet from './dataModel/result-set';

export default {
  navigatorView: null,
  subscriptions: null,
  savedConnectionsFileName: 'db-connections.json',
  savedConnections: [],
  statusBarNotification: undefined,
  pinnedConnectionName: undefined,
  limitRecordsResult: 1000,
  resultViews: {},

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

    let treeViewClass = 'connections-tree';
    this.treeView = new TreeView({customClass: treeViewClass});
    this.treeView.setData(this._getInitialData());
    this.treeView.onClick = (nodeData)=>this.singleClickAction(nodeData);
    this.treeView.onDoubleClick = (nodeData)=>this.doubleClickAction(nodeData);

    this.filterTreeView = new FilterOnTree(treeViewClass);
    let headerOptions = new HeaderOptions(this._getConnectionOptions());
    this.navigatorView.addElement(this.filterTreeView.element);
    this.navigatorView.addElement(headerOptions.element);
    this.navigatorView.addElement(this.treeView.element);

    atom.commands.add('atom-workspace', 'dbex:execute-query', () => this.execQuery())
    this.statusBarNotification = new StatusBarNotification("");
    this.statusBarNotification.onClick = (selectedConnection)=>this._clickOnStatusBar(selectedConnection);

    console.log(this.resultViews);
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
        icon: 'fa-search',
        onClick: () => this.filterTreeView.show(),
        tooltip: 'Search in the tree view'
      },
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
      engine.resolveActionClick(
        nodeInfo.action,
        nodeInfo,
        (resultFromSingleClick)=>{
          console.log("return success from single click ===> ", resultFromSingleClick);

          // console.log("selectedConnection", selectedConnection);
          // console.log("engines", this.engines);

          let engine = nodeInfo.engine ? this.engines[nodeInfo.engine] : undefined;

          if (engine) {
            this._onSuccess(
              resultFromSingleClick,
              Date.now(),
              nodeInfo.connection,
              nodeInfo.engine,
              engine,
              nodeInfo.node // nodeData
            );
          }
        },
        (e)=>console.log("return FAILED from single click ===> ", e)
      ); //TODO: onsuccess, onfail
    }
  },

  doubleClickAction(nodeInfo) {
    console.log("Dblclick", nodeInfo);

    this.setLoading(true, nodeInfo.node.name);

    this._engineCall(
      nodeInfo,
      (engine, connection, nodeData, onSuccess, onFail)=>{
        engine.getLogger().scope = nodeData.name;
        engine.resolveDoubleClick(
          connection,
          nodeData,
          (resultSet)=>{
            this.setLoading(false, nodeInfo.node.name);
            onSuccess(resultSet);
          },
          (resultSet)=>{
            this.setLoading(false, nodeInfo.node.name);
            onFail(resultSet);
          }
        );
      }
    );
  },

  setLoading(showLoading, nodeName) {
    let el = document.querySelector(`[data-name="${nodeName}"] span.icon`);

    if (el) {
      let existentLoading = el.querySelector('i.waiting-engine');

      if (existentLoading) {
        existentLoading.remove();
      }

      if (showLoading) {
        let loadingEl = document.createElement('i');
        loadingEl.classList.add('waiting-engine', 'fa', 'fa-circle-o-notch', 'fa-spin', 'fa-3x', 'fa-fw');
        el.appendChild(loadingEl);
      }
    }
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

      // console.log(nodeData.name);
      // this.treeView.updateControls(nodeData.name, '<i class="fa fa-circle-o-notch fa-spin fa-3x fa-fw" style="color:yellow;"></i>');

      let onFail = (message)=>{
        // this.treeView.updateControls(nodeData.name, '<i class="fa fa-exclamation-triangle vague text-danger" aria-hidden="true"></i>');
        this.showError(message, "dbex engine failed");
      };

      let startCall = Date.now();
      callback(
        engine,
        nodeInfo.connection,
        nodeData,
        (response)=>this._onSuccess(response, startCall, nodeInfo.connection, nodeInfo.engine, engine, nodeData),
                                 // response, timestamp, connectionName, engineName, engine, nodeData
        onFail
      );
    }
  },

  _onSuccess(response, timestamp, connectionName, engineName, engine, nodeData) {
    // nodeData // {icon, label, name} must be the node.name clicked
    console.log("again nodeData", nodeData);
    console.log("engine reponse", response);
    console.log('onSuccess timestamp', timestamp);

    if (response) {
      let renderResults = (totalRecordsToRender)=>{
        if (Array.isArray(response) && response[0].constructor.name === "TreeItem") {
          console.log("engine reponse is an Array of TreeItem");
          this.treeView.updateNodeChild(nodeData.name, response);
        } else if (response.constructor.name === "TreeItem") {
          console.log("engine reponse is a TreeItem");
          this.treeView.updateNode(response);
        } else if (response.constructor.name === "ResultSet") {
          console.log("engine reponse is a DbexResult");
          let resultName = (`debex-result-${nodeData.name}-${engineName}`).replace(/[^a-zA-Z0-9 ]/g, "-");
          console.log("=====>> we have a resultSet")
          let setResult = (responseData, resultName)=>{
            // let datasetColumns = response.columns.map((c)=>{
            //   return {
            //     name: c.name,
            //     width: c.type === ResultSet.STRING ? 300 : 100
            //   }
            // });
            //
            // console.log("results=============>", datasetColumns);

            console.log("teh cols ==-=-=-=-==>>", responseData.columns);

            if (responseData.columns) {
              let datatable = new DataTable(`.${resultName} .result-data`, {
                columns: responseData.columns,
                data: responseData.data,
                id: resultName,
                // layout: 'fluid',
              });
            }

            console.log("done engine response data");
          };

          let resultArea = document.getElementsByClassName(resultName);

          if (resultArea.length === 0) {
            if (true) { // response.columns && response.columns.length > 0) {
              let connInfo = this.treeView.getConnectionData(connectionName);

              let resultView = this._createResultArea(
                resultName,
                nodeData,
                connInfo.color ? `#${connInfo.color}` : "transparent",
                engine,
                connectionName,
                engineName
              );

              resultView.toolbar.message = (response.recordsAffected || (response.data ? response.data.length : 0)) + " rows in ~" + ((Date.now() - timestamp)/100)+"s";

              if (response.query && response.query.length > 0) {
                resultView.setQuery(response.query.trim());
              } else if (response.data  > 0) {
                resultView.setQueryVisibility(false);
              }

              if (response.data) {
                if (totalRecordsToRender < response.data.length) {
                  var responseToRender = response;
                  responseToRender.data = responseToRender.data.slice(0, totalRecordsToRender);
                } else {
                  var responseToRender = response;
                }
              } else {
                var responseToRender = response;
              }

              let afterShowResult = ()=>setResult(responseToRender, resultName);

              if (!response.columns || response.columns.length === 0) {
                afterShowResult = ()=>false;
                resultView.setDataVisibility(false);
              }

              atom.workspace.open(
                resultView, {
                  activatePane: true,
                  activateItem: true,
                }
              ).then(afterShowResult);

            }
          } else {
            console.log('dbresult already exists');
            resultArea[0].querySelector('.toolbar .options-label').innerHTML = (response.recordsAffected || response.data.length) + " rows in ~" + ((Date.now() - timestamp)/100)+"s";

            let paneName = `atom://${resultName}`;

            if (atom.workspace.paneForURI(paneName).activeItem.uri !== paneName) {
              atom.workspace.toggle(paneName);
            }

            if (response.columns && response.columns.length > 0) {
              this.resultViews[document.getElementsByClassName(resultName)[0].dataset.uuid].setDataVisibility(true);

              if (totalRecordsToRender < response.data.length) {
                var responseToRender = response;
                responseToRender.data = responseToRender.data.slice(0, totalRecordsToRender);
              } else {
                var responseToRender = response;
              }

              setResult(responseToRender, resultName);
            }
          }
        }
      };

      let totalRecords = response.data ? response.data.length : 0;

      if (totalRecords > this.limitRecordsResult) {
        console.log('LIMIT the records');
        this.confirmLimitRecords(totalRecords, this.limitRecordsResult, renderResults)
      } else {
        console.log('unlimited records');
        renderResults(totalRecords);
      }
    }
  },

  _createResultArea(resultName, nodeData, color, engine, connectionName, engineName) {
    console.log("_createResultArea nodeData", nodeData);

    let resultView = new DbexResult({
      name: resultName,
      title: nodeData.name,
      icon: 'icon-table',
      color: color,
      customHeaderOptions: this._getResultCustomOptions(),
    });

    this.resultViews[resultView.uuid] = resultView;

//<i class="fa fa-circle-o-notch fa-spin fa-3x fa-fw"></i>

    resultView.onExecuteQuery = (uuid, query) => {
      console.log("execute the query", uuid, query);
      engine.getLogger().scope = nodeData.name;

      let startCall = Date.now();

      resultView.toolbar.message = "Executing query...";

      engine.executeQuery(
        uuid,
        query,
        connectionName,
        nodeData,
        (response)=>{
          console.log("executeQuery callback nodeData", nodeData);
          this._onSuccess(response, startCall, connectionName, engineName, engine, nodeData) // response, startCall, nodeInfo.connection, nodeInfo.engine, engine, nodeData
                          // response, timestamp, connectionName, engineName, engine, nodeData
        }
      );
    };

    resultView.onStopQuery = (uuid) => {
      console.log("stop the query", uuid);
    };

    resultView.onShowLog = (uuid) => {
      console.log("show the log", uuid);
      atom.workspace.open(engine.getLogger().fullPath);
    };

    return resultView;
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

  confirmLimitRecords(totalRecords, suggestedRecords, onConfirm) {
    let notification = atom.notifications.addWarning(
      "dbex - Too much records on result",
      {
        buttons: [
          {
            className: "btn-details",
            onDidClick: ()=>{
              onConfirm(suggestedRecords);
              notification.dismiss();
            },
            text: "Go with suggested"
          },
          {
            className: "btn-details",
            onDidClick: ()=>{
              onConfirm(totalRecords);
              notification.dismiss()
            },
            text: "Bring them all!"
          },
          {
            className: "btn-details",
            onDidClick: ()=>{
              onConfirm(0);
              notification.dismiss()
            },
            text: "Cancel query"
          },
        ],
        detail: `Result returned ${totalRecords} records which is more than the suggested amount of ${suggestedRecords}.\nIt may cause delay on redering the results. \n\nContinue anyway?`,
        dismissable: true
      }
    );
  },

  _clickOnStatusBar(selectedConnection) {
    console.log("selectedConnection", selectedConnection);
    console.log("engines", this.engines);

    let engine = selectedConnection.engine ? this.engines[selectedConnection.engine] : undefined;
    let resultName = (`debex-result-${selectedConnection.name}-${selectedConnection.engine}`).replace(/[^a-zA-Z0-9 ]/g, "-");

    if (engine) {
      let content = new ResultSet({
        query: "QUERY HERE!"
      });

      this._onSuccess(
        content,
        Date.now(),
        selectedConnection.name,
        selectedConnection.engine,
        engine,
        {
          icon: "icon-table",
          label: selectedConnection.engine,
          name: selectedConnection.name,
        } // nodeData
      );
    }
  }
};
