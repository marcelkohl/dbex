'use babel';

import {CompositeDisposable} from 'atom';
import Navigator from './view/navigator';
import DbexResult from './view/result';
import Tree from './component/tree';
import CreateConnection from './component/create-connection';
import HeaderOptions from "./view/header-options";
import StatusBarNotification from './component/status-bar-notification';
import Logger from './service/logger';
import FilterOnTree from './component/filter-on-tree';
import ResultSet from './dataModel/result-set';

export default {
  navigatorView: null,
  disposables: null,
  savedConnectionsFileName: 'db-connections.json',
  savedConnections: [],
  statusBarNotification: undefined,
  pinnedConnectionName: undefined,
  limitRecordsResult: 1000,
  resultViews: {},
  queryHistory: {},
  isPanelSetToNotDestroyHistory: false,
  isAtomClosing: false,

  activate() {
    this._loadSavedConnections();
    this.engines = {};
    this.disposables = new CompositeDisposable();

    this.navigatorView = new Navigator({name:'dbex', title:'Databases', icon:'database'});
    this.disposables.add(this.navigatorView);
    this.positionHidden = atom.config.get('dbex.position') === 'Hidden';

    let cmdRefresh = atom.commands.add('atom-workspace', {
        'dbex:refresh': (element) => {
          let target = element.target;

          if (target.tagName === 'LI' && target.classList.contains('.list-selectable-item')) {
            // nothing
          } else {
            target = target.closest('li.list-selectable-item');
          }

          let connInfo = this.treeView.getDatasetFromElement(target);

          this.engines[connInfo.engine].refreshNode(
            connInfo.connection,
            connInfo.node,
            (response)=>{
              console.log('result from refresh', response);

              if (response.constructor.name === "TreeItem") {
                this.treeView.updateNode(response);
              }
            }
          );
        }
    });

    this.disposables.add(cmdRefresh);

    let mnuRefresh = atom.contextMenu.add({
      'li.has-children[data-engine]':[{
        label: 'Refresh',
        command: 'dbex:refresh'
      }]
    });

    this.disposables.add(mnuRefresh);

    if (this.positionHidden) {
      this.disposables.add(atom.commands.add('atom-workspace', {
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
    this.treeView = new Tree({customClass: treeViewClass});
    this.treeView.setData(this._getInitialData());
    this.treeView.onClick = (nodeData)=>this.singleClickAction(nodeData);
    this.treeView.onDoubleClick = (nodeData)=>this.doubleClickAction(nodeData);
    this.disposables.add(this.treeView);

    this.filterTreeView = new FilterOnTree(treeViewClass);
    let headerOptions = new HeaderOptions(this._getConnectionOptions());
    this.disposables.add(this.filterTreeView);

    this.navigatorView.addElement(this.filterTreeView.element);
    this.navigatorView.addElement(headerOptions.element);
    this.navigatorView.addElement(this.treeView.element);

    this.disposables.add(
      atom.commands.add(
        'atom-workspace',
        'dbex:execute-query', () => this.execQuery()
      )
    );

    this.statusBarNotification = new StatusBarNotification("");
    this.statusBarNotification.onClick = (selectedConnection)=>this._clickOnStatusBar(selectedConnection);
    this.disposables.add(this.statusBarNotification);
  },

  execQuery() {
    let queryArea = atom.workspace.getActivePaneContainer().getActivePaneItem();

    //TODO: If query area is not the DbexResult, detect from status bar the selected database

    if (queryArea.constructor.name === "DbexResult") {
      let query = queryArea.getQueryTextEditor();

      if (query.constructor.name === 'TextEditor') {
        queryArea.onExecuteQuery(queryArea.uuid, query.getSelectedText() || query.getText());
      }
    } else {
      if (!this.pinnedConnectionName) {
        this.showError("Select a connection before running a query", "No connection selected");
        return;
      }

      let connInfo = this.treeView.getConnectionData(this.pinnedConnectionName);

      if (connInfo) {
        let query = queryArea.getSelectedText() || queryArea.getText();

        this._engineCall(
          {
            connection: connInfo.name,
            engine: connInfo.engine,
            node: connInfo
          },
          (engine, connection, nodeData, onSuccess, onFail)=>{
            engine.getLogger().scope = nodeData.name;
            engine.executeQuery("", query, connection, nodeData, onSuccess);
          }
        );
      }
    }
  },

  _getResultCustomOptions() {
    return [
      {
        icon: 'fa-outdent',
        onClick: ()=> false,
        tooltip: 'Format SQL',
      },
      {
        icon: 'fa-download',
        onClick: ()=> false,
        tooltip: 'Export result',
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
    if (nodeInfo && nodeInfo.node) {
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
          let engine = nodeInfo.engine ? this.engines[nodeInfo.engine] : undefined;

          if (engine) {
            this._onSuccess(
              resultFromSingleClick,
              Date.now(),
              nodeInfo.connection,
              nodeInfo.engine,
              engine,
              nodeInfo.node
            );
          }
        },
        (e)=>console.log("return FAILED from single click ===> ", e)
      );
    }
  },

  doubleClickAction(nodeInfo) {
    if (!nodeInfo) {
      return;
    }

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
            this._loadHistory(nodeInfo.connection, engine);
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
    console.log(nodeName);
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
    if (!nodeInfo) {
      return;
    }

    let engine = nodeInfo.engine ? this.engines[nodeInfo.engine] : undefined;

    if (nodeInfo.node && engine) {
      let nodeData = nodeInfo.node;
      let onFail = (message)=>{
        this.showError(message, "dbex engine failed");
      };

      let startCall = Date.now();
      callback(
        engine,
        nodeInfo.connection,
        nodeData,
        (response)=>this._onSuccess(response, startCall, nodeInfo.connection, nodeInfo.engine, engine, nodeData),
        onFail
      );
    }
  },

  _onSuccess(response, timestamp, connectionName, engineName, engine, nodeData) {
    if (response) {
      let renderResults = (totalRecordsToRender)=>{
        if (Array.isArray(response) && response[0].constructor.name === "TreeItem") {
          this.treeView.updateNodeChild(nodeData.name, response);
        } else if (response.constructor.name === "TreeItem") {
          this.treeView.updateNode(response); //TODO: check if there is a use for this one. Refresh uses the same method from tree but had to get name from a parent node instead of datasets.name
        } else if (response.constructor.name === "ResultSet") {
          let resultName = (`debex-result-${nodeData.name}-${engineName}`).replace(/[^a-zA-Z0-9 ]/g, "-");

          let setResult = (responseData, resultView)=>{
            resultView.resultData = responseData;
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

              let afterShowResult = ()=>setResult(responseToRender, resultView);

              if (!response.columns || response.columns.length === 0) {
                afterShowResult = ()=>false;
                resultView.setDataVisibility(false);
              }

              atom.workspace.open(
                resultView, {
                  activatePane: true,
                  activateItem: true,
                }
              ).then(()=>{
                if (!this.isPanelSetToNotDestroyHistory) {
                  atom.workspace.paneForURI(resultView.getURI()).onWillDestroy(()=>this.isAtomClosing = true);
                  this.isPanelSetToNotDestroyHistory = true;
                }
                afterShowResult();
              });

            }
          } else {
            resultArea[0].querySelector('.toolbar .options-label').innerHTML = (response.recordsAffected || (response.data ? response.data.length : '0')) + " rows in ~" + ((Date.now() - timestamp)/100)+"s";

            let paneName = `atom://${resultName}`;

            if (atom.workspace.paneForURI(paneName).activeItem.uri !== paneName) {
              atom.workspace.toggle(paneName);
            }

            if (response.columns && response.columns.length > 0) {
              let responseToRender;
              let resultView = this.resultViews[document.getElementsByClassName(resultName)[0].dataset.uuid];
              resultView.setDataVisibility(true);

              if (totalRecordsToRender < response.data.length) {
                responseToRender = response;
                responseToRender.data = responseToRender.data.slice(0, totalRecordsToRender);
              } else {
                responseToRender = response;
              }

              setResult(responseToRender, resultView);
            }
          }
        }
      };

      let totalRecords = response.data ? response.data.length : 0;

      if (totalRecords > this.limitRecordsResult) {
        this.confirmLimitRecords(totalRecords, this.limitRecordsResult, renderResults)
      } else {
        renderResults(totalRecords);
      }
    }
  },

  _createResultArea(resultName, nodeData, color, engine, connectionName, engineName) {
    let resultView = new DbexResult({
      name: resultName,
      title: nodeData.name,
      icon: 'icon-table',
      color: color,
      customHeaderOptions: this._getResultCustomOptions(),
    });

    this.resultViews[resultView.uuid] = resultView;

    resultView.onExecuteQuery = (uuid, query) => {
      engine.getLogger().scope = nodeData.name;

      let startCall = Date.now();

      resultView.toolbar.message = "Executing query...";

      engine.executeQuery(
        uuid,
        query,
        connectionName,
        nodeData,
        (response)=>{
          this._onSuccess(response, startCall, connectionName, engineName, engine, nodeData)
        }
      );
    };

    resultView.onStopQuery = (uuid) => {
      console.log("stop the query", uuid);
    };

    resultView.onShowLog = (uuid) => {
      engine.getLogger().scope = nodeData.name;
      atom.workspace.open(engine.getLogger().fullPath);
    };

    resultView.onQueryStopChanging = (queryEl)=>{
      this._updateHistory(nodeData.name, connectionName, queryEl.getText());
    }

    resultView.onDestroy = (uuid) => {
      if (!this.isAtomClosing) {
        this._updateHistory(nodeData.name, connectionName, undefined);
      }
    }

    return resultView;
  },

  _updateHistory(name, connection, content) {
    if (!this.queryHistory[connection]) {
      this.queryHistory[connection] = {};
    }

    if (content === undefined) {
      delete(this.queryHistory[connection][name]);
    } else {
      this.queryHistory[connection][name] = content;
    }

    let filePath = atom.packages.getLoadedPackage('dbex').path + `/history/${connection}.json`;
    this._saveFile(this.queryHistory[connection], filePath);
  },

  _loadHistory(connectionName, engine) {
    let isLoaded = this.queryHistory[connectionName];

    if (isLoaded) {
      return;
    }

    this.queryHistory[connectionName] = {};

    let fs = require("fs");
    let filePath = atom.packages.getLoadedPackage('dbex').path + `/history/${connectionName}.json`;

    if (fs.existsSync(filePath)) {
      let data = fs.readFileSync(filePath); //TODO: close opened file
      let parsedData = JSON.parse(data);
      let historyKeys = Object.keys(parsedData);

      historyKeys.forEach((historyKey, i) => {
        this.queryHistory[connectionName][historyKey] = parsedData[historyKey];

        let content = new ResultSet({
          query: this.queryHistory[connectionName][historyKey]
        });

        this._onSuccess(
          content,
          Date.now(),
          connectionName,
          engine.getName(),
          engine,
          {
            icon: "icon-table",
            label: engine.getName(),
            name: historyKey,
          }
        );
      });
    } else {
      this.queryHistory[connectionName] = {};
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
    this.disposables.dispose();
  },

  consumeStatusBar(statusBar) {
    statusBar.addLeftTile({item: this.statusBarNotification.getElement(), priority: 100});
  },

  _loadSavedConnections() {
      let fs = require("fs");
      let filePath = atom.packages.getLoadedPackage('dbex').path + "/" + this.savedConnectionsFileName;

      if (fs.existsSync(filePath)) {
        let data = fs.readFileSync(filePath); //TODO: close opened file
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
    delete connectionData.customValues;

    this.savedConnections.push({
      icon: this.engines[connectionData.engine].getIconClass() || 'icon-database',
      label: label,
      name: name,
      details: "",
      collapsed: 'collapsed',
      datasets: connectionData
    });

    this.treeView.setData(this._getInitialData());

    let filePath = atom.packages.getLoadedPackage('dbex').path + "/" + this.savedConnectionsFileName;
    this._saveFile(this.savedConnections, filePath);

    return true;
  },

  _showEditConnection() {
    let nodeConn = this.treeView.selected;

    if (nodeConn && nodeConn.connection) {
      let connectionView = this._getNewConnectionView();

      connectionView.show(this.engines, nodeConn.engine);
      connectionView.setCustomFields(
        this.engines[nodeConn.engine].getConnectionSettings().custom,
        nodeConn.node
      );

      connectionView.connectionName = nodeConn.node.label;
      connectionView.selectedColor = nodeConn.node.color;
    }
  },

  _askRemoveConnection() {
    let nodeConn = this.treeView.selected;

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

    let filePath = atom.packages.getLoadedPackage('dbex').path + "/" + this.savedConnectionsFileName;
    this._saveFile(this.savedConnections, filePath);

    //TODO: remove item from disposables array

    this.treeView.removeNodeByName(connNameToRemove);
  },

  _saveFile(contentObj, filePath) {
    let fs = require("fs");

    fs.writeFile(filePath, JSON.stringify(contentObj), function (err) {
      if (err) {
        alert(err);
      }
    });

    //TODO: close file opened
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
    let engine = selectedConnection.engine ? this.engines[selectedConnection.engine] : undefined;

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
        }
      );
    }
  }
};
