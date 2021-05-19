'use babel';

import { Disposable, CompositeDisposable } from 'atom';
import NavigatorView from './view/navigator';
import TreeView from './view/tree';
import TreeItem from './dataModel/tree-item';
import mysql from 'mysql'

export default {
  navigatorView: null,
  subscriptions: null,

  activate() {
    this.navigatorView = new NavigatorView({name:'dbex', title:'Databases', icon:'database'});
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
    this.treeView.setData(this.getInitialData());
    this.navigatorView.addElement(this.treeView.element)

    console.log("====> dbex", this)
  },

  getInitialData() {
    return {
        label: 'root',
        icon: null,
        children: [{
          icon: "icon-database",
          label: "Magento-01",
          name: "App\Recipe\Normalizer\Exporter\UnitNormalizer",
          details: "MySQL",
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
              children: [
                {
                  icon: "icon-pk",
                  label: "id",
                  name: "The Child",
                  details: "int(4) not null",
                  datasets: {
                    field: "id",
                  },
                },
                {
                  icon: "icon-fk",
                  label: "tax_id",
                  name: "The Child",
                  details: "int(4) not null",
                },
                {
                  icon: "icon-field",
                  label: "title",
                  name: "The Child",
                  details: "varchar(256)",
                },
                {
                  icon: "icon-field",
                  label: "uuid",
                  name: "The Child",
                  details: "int(36) not null",
                },
              ]
            },
            {
              icon: "icon-table",
              label: "Customers",
              name: "The Child",
              details: "",
            }
          ]
        }],
    };
  },

  deactivate() {
    this.subscriptions.dispose();
    this.navigatorView.destroy();
    this.navigatorView = null;
  },

  consumeStatusBar(statusBar) {
  },

  sampleMysqlQuery(query) {
    // execute(database, query, onQueryToken) {
    //   return new Promise((resolve, reject) => {
    //     var url = database !== '' ? this.getUrlWithDb(database) : this.getUrl()
    //     if (!this.pool) {
          let config = {
            host: 'localhost', //this.config.server,
            user: 'admin', //this.config.user,
            password: 'admin', //this.config.password,
            port: 13306, //this.config.port,
            database: 'scooter_api',
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
            connection.query(query, (err, results, fields) => {
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
            })
          }
        })
    //   })
  }
};
