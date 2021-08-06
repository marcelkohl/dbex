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
  _navigatorView: undefined,
  _headerOptions: undefined,
  _treeView: undefined,
  _statusBarNotification: undefined,
  _pinnedConnectionName: undefined,
  _filterTreeView: undefined,
  _packageConfig: undefined,
  _isPanelSetToNotDestroyHistory: false,
  _isAtomClosing: false,
  _savedConnections: [],
  _resultViews: {},
  _queryHistory: {},
  _engines: {},
  _disposables: new CompositeDisposable(),
  _savedConnectionsFileName: 'db-connections.json',

  activate() {
    this._loadPackageConfig();
    this._loadSavedConnections();
    this._createTreeView();
    this._createNavigator();
    this._createStatusBarNotification();

    this._disposables.add(
      atom.commands.add(
        'atom-workspace',
        'dbex:execute-query', () => this.execQuery()
      )
    );

    this._disposables.add(
        atom.config.onDidChange('dbex', (settings)=>{
          this._loadPackageConfig();
          this._updateLoggerStates();
          this._statusBarNotification.isVisible = this._packageConfig.AllowExecuteQueryFromEditor;
        })
    );
  },

  _createStatusBarNotification() {
    this._statusBarNotification = new StatusBarNotification(this._packageConfig.AllowExecuteQueryFromEditor);
    this._statusBarNotification.onClick = (selectedConnection)=>this._clickOnStatusBar(selectedConnection);
    this._disposables.add(this._statusBarNotification);
  },

  _createTreeView() {
    let treeViewClass = 'connections-tree';

    this._treeView = new Tree({customClass: treeViewClass});
    this._treeView.setData(this._getInitialData());
    this._treeView.onClick = (nodeData)=>this.singleClickAction(nodeData);
    this._treeView.onDoubleClick = (nodeData)=>this.doubleClickAction(nodeData);
    this._disposables.add(this._treeView);

    this._filterTreeView = new FilterOnTree(treeViewClass);
    this._headerOptions = new HeaderOptions(this._getConnectionOptions());
    this._disposables.add(this._filterTreeView);

    this._createRefreshAction();
  },

  _createNavigator() {
    this._navigatorView = new Navigator({name:'dbex', title:'Databases', icon:'database'});
    this._disposables.add(this._navigatorView);

    atom.workspace.open(
      this._navigatorView, {
        activatePane: false,
        activateItem: false,
      }
    );

    this._navigatorView.addElement(this._filterTreeView.element);
    this._navigatorView.addElement(this._headerOptions.element);
    this._navigatorView.addElement(this._treeView.element);
  },

  _createRefreshAction() {
    this._disposables.add(
      atom.commands.add('atom-workspace', {'dbex:refresh': (e)=>this._refreshNode(e)})
    );

    this._disposables.add(
      atom.contextMenu.add({
        'li.has-children[data-engine]':[{
          label: 'Refresh',
          command: 'dbex:refresh'
        }]
      })
    );
  },

  _refreshNode(elementNode) {
    let target = elementNode.target;

    if (target.tagName !== 'LI' && !target.classList.contains('.list-selectable-item')) {
      target = target.closest('li.list-selectable-item');
    }

    let nodeUuid = target.dataset.uuid;
    let connInfo = this._treeView.getDatasetFromElement(target);

    this._engines[connInfo.engine].refreshNode(
      connInfo.connection,
      connInfo.node,
      (response)=>{
        if (response && response.constructor) {
          if (response.constructor.name === 'String') {
            this.showError(response);
          } else {
            this._treeView.updateNode(nodeUuid, response);
          }
        }
      }
    );
  },

  execQuery() {
    let queryArea = atom.workspace.getActivePaneContainer().getActivePaneItem();

    if (queryArea.constructor.name === "DbexResult") {
      let query = queryArea.getQueryTextEditor();

      if (query.constructor.name === 'TextEditor') {
        queryArea.onExecuteQuery(queryArea.uuid, query.getSelectedText() || query.getText());
      }
    } else {
      if (this._packageConfig.AllowExecuteQueryFromEditor === false) {
        return;
      } else if (!this._pinnedConnectionName) {
        this.showError("Select a connection before running a query", "No connection selected");
        return;
      }

      let connInfo = this._treeView.getConnectionData(this._pinnedConnectionName);

      if (connInfo) {
        let query = queryArea.getSelectedText() || queryArea.getText();

        this._engineCall(
          {
            connection: connInfo.name,
            engine: connInfo.engine,
            node: connInfo
          },
          (engine, connection, nodeData, onSuccess)=>{
            engine.getLogger().scope = nodeData.name;
            engine.executeQuery("", query, connection, nodeData, onSuccess);
          }
        );
      }
    }
  },

  _getResultCustomOptions() {
    // TODO: implement custom options from engines/other plugins
    return [
    //   {
    //     icon: 'fa-outdent',
    //     onClick: ()=> false,
    //     tooltip: 'Format SQL',
    //   },
    //   {
    //     icon: 'fa-download',
    //     onClick: ()=> false,
    //     tooltip: 'Export result',
    //   },
    ];
  },

  _getConnectionOptions() {
    return [
      {
        icon: 'fa-search',
        onClick: () => this._filterTreeView.show(),
        tooltip: 'Search in the tree view'
      },
      {
        icon: 'fa-plus',
        onClick: () => (this._getNewConnectionView()).show(this._engines),
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
        this._engines[data.engine].testConnection(
          data,
          (result)=>alert("Test connection returned success!\n" + result),
          (result)=>alert("Failed with message:\n" + result)
        );
      }
    }

    nconn.onSelectConnection = (value)=>{
      nconn.setCustomFields(value ? this._engines[value].getConnectionSettings().custom : []);
    };

    return nconn;
  },

  getSubscribedPlugins(subscribedPlugin) {
      let engineInstance = subscribedPlugin(
        new Logger(this._packageConfig.LogQueries)
      );
      this._engines[engineInstance.getName()] = engineInstance;
  },

  singleClickAction(nodeInfo) {
    if (!nodeInfo) {
      return;
    }

    if (nodeInfo.node) {
      let connInfo = this._treeView.getConnectionData(nodeInfo.connection);

      this._statusBarNotification.selectedConnection = connInfo;
      this._pinnedConnectionName = nodeInfo.connection;
    }

    if (nodeInfo.action) {
      let engine = this._engines[nodeInfo.engine];

      engine.getLogger().scope = nodeInfo.node.name;
      engine.resolveActionClick(
        nodeInfo.action,
        nodeInfo.connection,
        nodeInfo.node,
        (resultFromSingleClick)=>{
          let engine = nodeInfo.engine ? this._engines[nodeInfo.engine] : undefined;

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
        }
      );
    }
  },

  doubleClickAction(nodeInfo) {
    if (!nodeInfo) {
      return;
    }

    this._setLoading(true, nodeInfo.node.name);

    this._engineCall(
      nodeInfo,
      (engine, connection, nodeData, onSuccess)=>{
        engine.getLogger().scope = nodeData.name;
        engine.resolveDoubleClick(
          connection,
          nodeData,
          (resultSet)=>{
            this._setLoading(false, nodeInfo.node.name);
            this._loadHistory(nodeInfo.connection, engine);
            onSuccess(resultSet);
          }
        );
      }
    );
  },

  _setLoading(showLoading, nodeName) {
    let nodeIcon = document.querySelector(`[data-name="${nodeName}"] span.icon`);

    if (nodeIcon) {
      let existentLoading = nodeIcon.querySelector('i.waiting-engine');

      if (existentLoading) {
        existentLoading.remove();
      }

      if (showLoading) {
        let loadingEl = document.createElement('i');

        loadingEl.classList.add('waiting-engine', 'fa', 'fa-circle-o-notch', 'fa-spin', 'fa-3x', 'fa-fw');
        nodeIcon.appendChild(loadingEl);
      }
    }
  },

  _engineCall(nodeInfo, callback) {
    if (!nodeInfo) {
      return;
    }

    let engine = nodeInfo.engine ? this._engines[nodeInfo.engine] : undefined;

    if (nodeInfo.node && engine) {
      let nodeData = nodeInfo.node;
      let startCall = Date.now();

      callback(
        engine,
        nodeInfo.connection,
        nodeData,
        (response)=>this._onSuccess(
          response, startCall,
          nodeInfo.connection,
          nodeInfo.engine,
          engine, nodeData
        )
      );
    }
  },

  _onSuccess(response, timestamp, connectionName, engineName, engine, nodeData) {
    if (response) {
      let renderResults = (totalRecordsToRender, timeFinished)=>{
        let resultView;

        if (response.constructor.name === 'Error' || response.constructor.name === 'String') {
          this.showError('Engine failed!\n' + response, engineName);
        } else if (Array.isArray(response) && response.length > 0 && response[0].constructor.name === "TreeItem") {
          this._treeView.updateNodeChild(nodeData.uuid, response);
        } else if (response.constructor.name === "TreeItem") {
          this._treeView.updateNode(nodeData.uuid, response);
        } else if (response.constructor.name === "ResultSet") {
          let resultName = (`dbex-result-${nodeData.name}-${engineName}`).replace(/[^a-zA-Z0-9 ]/g, "-");
          let resultArea = document.getElementsByClassName(resultName);
          let setResult = (responseData, resultView)=>{
            resultView.resultData = responseData
            if (resultView.getQueryTextEditor().getText().length === 0) {
              resultView.setQueryVisibility( !(response.query === undefined || response.query.length === 0) );
            }
          };

          if (resultArea.length === 0) {
            let responseToRender;
            let connInfo = this._treeView.getConnectionData(connectionName);

            resultView = this._createResultArea(
              resultName,
              nodeData,
              connInfo.color ? `#${connInfo.color}` : "transparent",
              engine,
              connectionName,
              engineName,
              response.grammar
            );

            if (response.query && response.query.length > 0) {
              resultView.setQuery(response.query.trim());
            } else if (response.data  > 0) {
              resultView.setQueryVisibility(false);
            }

            if (response.data) {
              if (totalRecordsToRender < response.data.length) {
                responseToRender = response;
                responseToRender.data = responseToRender.data.slice(0, totalRecordsToRender);
              } else {
                responseToRender = response;
              }
            } else {
              responseToRender = response;
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
              if (!this._isPanelSetToNotDestroyHistory) {
                atom.workspace.paneForURI(resultView.getURI()).onWillDestroy(()=>this._isAtomClosing = true);
                this._isPanelSetToNotDestroyHistory = true;
              }
              afterShowResult();
            });
          } else {
            let paneName = `atom://${resultName}`;

            if (atom.workspace.paneForURI(paneName).activeItem.uri !== paneName) {
              atom.workspace.toggle(paneName);
            }

            resultView = this._resultViews[document.getElementsByClassName(resultName)[0].dataset.uuid];

            if (response.columns && response.columns.length > 0) {
              let responseToRender;

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

          if (resultView && ((response.columns && response.columns.length > 0) || response.recordsAffected)) {
            resultView.toolbar.message = (response.recordsAffected || (response.data ? response.data.length : '0')) + " rows in ~" + ((timeFinished - timestamp)/1000)+"s";
          }
        }
      };

      let totalRecords = response.data ? response.data.length : 0;
      let timeFinished = Date.now();

      if (totalRecords > this._packageConfig.MaximumLimitRecordsResult) {
        this.confirmLimitRecords(
          totalRecords,
          this._packageConfig.MaximumLimitRecordsResult,
          (totalRecords)=>renderResults(totalRecords, timeFinished)
        );
      } else {
        renderResults(totalRecords, timeFinished);
      }
    }
  },

  _createResultArea(resultName, nodeData, color, engine, connectionName, engineName, grammar) {
    let connData = this._treeView.getConnectionData(connectionName);
    let resultView = new DbexResult({
      name: resultName,
      title: nodeData.name,
      icon: 'icon-table',
      color: color,
      customHeaderOptions: this._getResultCustomOptions(),
    });

    this._resultViews[resultView.uuid] = resultView;

    resultView.queryGrammar = grammar;
    resultView.onExecuteQuery = (uuid, query) => {
      resultView.toolbar.message = "Executing query...";

      let connInfo = this._treeView.getConnectionData(nodeData.name); // if the name is our connection, means that we are dealing with a tab that was not generated by a node double click
      let startCall = Date.now();

      engine.getLogger().scope = nodeData.name;
      engine.executeQuery(
        uuid,
        query,
        connectionName,
        connInfo || nodeData,
        (response)=>{
          this._onSuccess(
            response,
            startCall,
            connectionName,
            engineName,
            engine,
            nodeData
          )
        }
      );
    };

    resultView.onStopQuery = (uuid) => {
      engine.stopQuery(uuid, connData);
    };

    resultView.onShowLog = (uuid) => {
      engine.getLogger().scope = nodeData.name;
      atom.workspace.open(engine.getLogger().fullPath);
    };

    resultView.onQueryStopChanging = (queryEl)=>{
      this._updateHistory(
        nodeData.name,
        connectionName,
        queryEl.getText(),
        queryEl.getGrammar().scopeName
      );
    }

    resultView.onDestroy = (uuid) => {
      if (!this._isAtomClosing) {
        this._updateHistory(nodeData.name, connectionName, undefined, undefined);
      }
    }

    return resultView;
  },

  _updateHistory(name, connection, content, grammar) {
    if (this._packageConfig.RememberLastOpenedQueryTabs === false) {
      return;
    }

    if (!this._queryHistory[connection]) {
      this._queryHistory[connection] = {};
    }

    if (content === undefined) {
      delete(this._queryHistory[connection][name]);
    } else {
      this._queryHistory[connection][name] = {};
      this._queryHistory[connection][name].query = content;
      this._queryHistory[connection][name].grammar = grammar;
    }

    let filePath = atom.packages.getLoadedPackage('dbex').path + `/history/${connection}.json`;
    this._saveFile(this._queryHistory[connection], filePath);
  },

  _loadHistory(connectionName, engine) {
    if (this._packageConfig.RememberLastOpenedQueryTabs === false) {
      return;
    }

    let isLoaded = this._queryHistory[connectionName];

    if (isLoaded) {
      return;
    }

    this._queryHistory[connectionName] = {};

    let fs = require("fs");
    let filePath = atom.packages.getLoadedPackage('dbex').path + `/history/${connectionName}.json`;

    if (fs.existsSync(filePath)) {
      let data = fs.readFileSync(filePath);
      let parsedData = JSON.parse(data);
      let historyKeys = Object.keys(parsedData);

      historyKeys.forEach((historyKey, i) => {
        this._queryHistory[connectionName][historyKey] = parsedData[historyKey];

        let content = new ResultSet({
          query: this._queryHistory[connectionName][historyKey].query,
          grammar: this._queryHistory[connectionName][historyKey].grammar,
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
      this._queryHistory[connectionName] = {};
    }
  },

  _getInitialData() {
    return {
      label: 'root',
      icon: null,
      children: this._savedConnections
    }
  },

  deactivate() {
    this._disposables.dispose();
  },

  consumeStatusBar(statusBar) {
    statusBar.addLeftTile({
      item: this._statusBarNotification.getElement(),
      priority: 100
    });
  },

  _loadSavedConnections() {
      let fs = require("fs");
      let filePath = atom.packages.getLoadedPackage('dbex').path + "/" + this._savedConnectionsFileName;

      if (fs.existsSync(filePath)) {
        let data = fs.readFileSync(filePath);
        let parsedData = JSON.parse(data);

        this._savedConnections = parsedData.length > 0 ? parsedData : [];
      } else {
        this._savedConnections = [];
      }
  },

  _addConenction(connectionData) {
    let name = connectionData.name.replace(/\s+/g, '').toLowerCase();
    let label = connectionData.name;

    if (name.length === 0) {
      alert("Name cannot be empty");
      return false;
    } else if (connectionData.engine.length === 0) {
      alert("Select a connection type before saving");
      return false;
    } else if (this._savedConnections.filter((e)=>e.name === name).length > 0 && (connectionData.customValues.name === undefined || connectionData.customValues.name !== name)) {
      alert("Connection with same name already exists");
      return false;
    }

    if (connectionData.customValues.name) {
      this._removeConnection(connectionData.customValues.name, connectionData.customValues.engine);
    }

    delete connectionData.name;
    delete connectionData.customValues;

    this._savedConnections.push({
      icon: this._engines[connectionData.engine].getIconClass() || 'icon-database',
      label: label,
      name: name,
      details: "",
      collapsed: 'collapsed',
      datasets: connectionData
    });

    this._treeView.setData(this._getInitialData());

    let filePath = atom.packages.getLoadedPackage('dbex').path + "/" + this._savedConnectionsFileName;
    this._saveFile(this._savedConnections, filePath);

    return true;
  },

  _showEditConnection() {
    let nodeConn = this._treeView.selected;

    if (nodeConn && nodeConn.isRoot) {
      let connectionView = this._getNewConnectionView();

      connectionView.show(this._engines, nodeConn.engine);
      connectionView.setCustomFields(
        this._engines[nodeConn.engine].getConnectionSettings().custom,
        nodeConn.node
      );

      connectionView.connectionName = nodeConn.node.label;
      connectionView.selectedColor = nodeConn.node.color;
    } else {
      this.showError("Select a connection node before editing");
    }
  },

  _askRemoveConnection() {
    let nodeConn = this._treeView.selected;

    if (nodeConn && nodeConn.isRoot) {
      this.confirmRemoval(
        nodeConn.connection,
        ()=>this._removeConnection(nodeConn.connection, nodeConn.engine)
      );
    } else {
      this.showError("Select a connection node before removing");
    }
  },

  _removeConnection(connNameToRemove, connEngine) {
    this._savedConnections = this._savedConnections.filter((connection)=>connection.name !== connNameToRemove);
    let filePath = atom.packages.getLoadedPackage('dbex').path + "/" + this._savedConnectionsFileName;
    this._saveFile(this._savedConnections, filePath);

    this._treeView.removeNodeByAttributes({
      name: connNameToRemove,
      engine: connEngine,
    });
  },

  _saveFile(contentObj, filePath) {
    let fs = require("fs");

    fs.writeFile(filePath, JSON.stringify(contentObj), function (err) {
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
    let engine = (selectedConnection && selectedConnection.engine) ? this._engines[selectedConnection.engine] : undefined;

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
  },

  _loadPackageConfig() {
    this._packageConfig = atom.config.get('dbex');
  },

  _updateLoggerStates() {
    Object.keys(this._engines).forEach((engineName) => {
      this._engines[engineName].getLogger().isEnabled = this._packageConfig.LogQueries;
    });
  }
};
