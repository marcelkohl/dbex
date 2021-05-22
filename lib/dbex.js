'use babel';

import { Disposable, CompositeDisposable } from 'atom';
import Navigator from './view/navigator';
import TreeView from './view/tree';
import TreeItem from './dataModel/tree-item';
import mysql from 'mysql'
import CreateConnection from './view/create-connection';
import DatabaseManager from './db-manager';

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

    let managers = {};
    let mysqlManager = new DatabaseManager();
    managers[mysqlManager.getName()] = mysqlManager;

    let nconn = new CreateConnection();
    nconn.onSave = (data)=>{
      console.log("save", data);
      return this._addConenction(data);
    };
    nconn.onTestConnection = (data)=> {
      console.log("test", data);
      if (data.manager.length > 0) {
        let testResult = managers[data.manager].testConnection(data);

        alert(testResult || "Test connection returned success!");
      }
    }
    nconn.onSelectConnection = (value)=>{
      console.log("selcted", value)
      nconn.setCustomFields(value ? managers[value].getConnectionSettings().custom : {});
    };

    const connect = document.createElement('div');
    connect.innerHTML = this.getConnectView();
    let addConnButton = connect.getElementsByClassName('add-connection')[0];
    addConnButton.addEventListener(
      'click',
      () => nconn.show(managers)
    );
    atom.tooltips.add(addConnButton, {title: 'Create a new connection'});
    this.navigatorView.addElement(connect)

    this.treeView = new TreeView();
    this.treeView.setData(this.getInitialData());
    this.treeView.onClick = (data)=>console.log("click", data);
    this.treeView.onDoubleClick = (data)=>console.log("Dblclick", data);
    this.navigatorView.addElement(this.treeView.element)

    console.log("this.treeView =====>", this.treeView);
    console.log("====> dbex", this)
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
          </span>
        </span>
      </header>
    </div>`;
  },

  sampleUpdateTree() {
    this.treeView.updateNode({
      icon: "icon-database",
      label: "Magento-01",
      name: "connectionname",
      details: "MySQL on localhost:3306",
      datasets: {
        database: "magento-01",
      },
      children: [
        {
          icon: "icon-table",
          label: "Products",
          name: "The Child",
          details: "",
          // collapsed: 'collapsed',
          datasets: {
            table: "Products",
          },
          children: []
        }
      ]
    });
  },

  getInitialData() {
    return {
      label: 'root',
      icon: null,
      children: this.savedConnections
    }
    // return {
    //     label: 'root',
    //     icon: null,
    //     children: [{
    //       icon: "icon-database",
    //       label: "Magento-01",
    //       name: "App\Recipe\Normalizer\Exporter\UnitNormalizer",
    //       details: "MySQL on localhost:3306",
    //       datasets: {
    //         database: "magento-01",
    //       },
    //       children: [
    //         {
    //           icon: "icon-table",
    //           label: "Products",
    //           name: "The Child",
    //           details: "",
    //           // collapsed: 'collapsed',
    //           datasets: {
    //             table: "Products",
    //           },
    //           children: [
    //             {
    //               icon: "icon-pk",
    //               label: "id",
    //               name: "The Child",
    //               details: "int(4) not null",
    //               datasets: {
    //                 field: "id",
    //               },
    //             },
    //             {
    //               icon: "icon-fk",
    //               label: "tax_id",
    //               name: "The Child",
    //               details: "int(4) not null",
    //             },
    //             {
    //               icon: "icon-field",
    //               label: "title",
    //               name: "The Child",
    //               details: "varchar(256)",
    //             },
    //             {
    //               icon: "icon-field",
    //               label: "uuid",
    //               name: "The Child",
    //               details: "int(36) not null",
    //             },
    //           ]
    //         },
    //         {
    //           icon: "icon-table",
    //           label: "Customers",
    //           name: "The Child",
    //           details: "",
    //         }
    //       ]
    //     }],
    // };
  },

  deactivate() {
    this.subscriptions.dispose();
    this.navigatorView.destroy();
    this.navigatorView = null;
  },

  consumeStatusBar(statusBar) {
  },

  sampleAsyncQuery(query){
    let self = this;
    let axx = async function () {
      console.log("async func");
      self.sampleMysqlQuery(query);
      // .....
      // await init();
      // main();
      // ....
    };

    axx();
  },

  sampleMysqlQuery(query) {
    // execute(database, query, onQueryToken) {
    //   return new Promise((resolve, reject) => {
    //     var url = database !== '' ? this.getUrlWithDb(database) : this.getUrl()
    //     if (!this.pool) {
          let config = {
            host: 'localhost', //this.config.server,
            user: 'od_bot_db_master', //this.config.user,
            password: '12345678', //this.config.password,
            port: 3306, //this.config.port,
            database: 'od_bot_dev',
            multipleStatements: true
          }
    //
    //       if (database) {
    //         config.database = database
    //       }
          this.pool = mysql.createPool(config)
    //     }
    //
        this.pool.getConnection((err, connection) => {
          if (err) {
            console.log("connection failed", err)
    //         return reject(this.translateError(err))
          }
    //
          if (connection) {
            console.log("connected")
            let el = connection.query(query, (err, results, fields) => {
              if (err) {
                console.log("query failed", err)
    //             return reject(this.translateError(err))
              }

              console.log("results", results);
              console.log("fields", fields);
    //
    //           if (!fields || (fields.length && fields[0].constructor.name === 'FieldPacket')) {
    //             resolve(this.translateResults([results], [fields]))
    //           } else {
    //             resolve(this.translateResults(results, fields))
              // }
              connection.release()
            });

            console.log("conn.query", el);
            return el;
          }
        })
    //   })
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
      icon: "icon-database",
      label: label,
      name: name,
      details: "127.0.0.1:13306",
      collapsed: 'collapsed',
      datasets: connectionData,
      children: []
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
  }
};
