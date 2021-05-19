'use babel';

import { Disposable, CompositeDisposable } from 'atom';
import NavigatorView from './navigator-view';

export default {
  navigatorView: null,
  subscriptions: null,

  activate() {
    this.navigatorView = new NavigatorView();
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
      // this.subscriptions.add(atom.commands.add('atom-workspace', {
      //   'symbols-navigator:toggle': () => { this.navigatorView.toggle(); },
      //   'symbols-navigator:toggle-focus': () => { this.navigatorView.toggleFocus(); },
      // }));

      const showOnAttach = atom.config.get('dbex.autoRevealOnStart');
      this.viewOpenPromise = atom.workspace.open(this.navigatorView, {
        activatePane: showOnAttach,
        activateItem: showOnAttach,
      });
    }

    this.navigatorView.populate(this.getInitialData());
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
};
