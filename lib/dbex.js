'use babel';

import { Disposable, CompositeDisposable } from 'atom';
import NavigatorView from './navigator-view';

export default {
  navigatorView: null,
  subscriptions: null,

  activate() {
    this.navigatorView = new NavigatorView(this.statusBarManager);
    this.subscriptions = new CompositeDisposable();

    this.positionHidden = atom.config.get('symbols-navigator.position') === 'Hidden';
    if (this.positionHidden) {
      this.subscriptions.add(atom.commands.add('atom-workspace', {
        'symbols-navigator:toggle': () => {
          atom.confirm({
            message: 'You have set the [Position] to [Hidden] in Settings. If you want to toggle Symbols-Navigator, please change the setting to [Left] or [Right].',
            buttons: {
              Ok: () => {},
            },
          });
        },
      }));
    } else {
      this.subscriptions.add(atom.commands.add('atom-workspace', {
        'symbols-navigator:toggle': () => { this.navigatorView.toggle(); },
        'symbols-navigator:toggle-focus': () => { this.navigatorView.toggleFocus(); },
      }));

      const showOnAttach = atom.config.get('symbols-navigator.autoRevealOnStart');
      this.viewOpenPromise = atom.workspace.open(this.navigatorView, {
        activatePane: showOnAttach,
        activateItem: showOnAttach,
      });
    }
  },

  deactivate() {
    this.subscriptions.dispose();
    this.navigatorView.destroy();
    this.navigatorView = null;
  },

  consumeStatusBar(statusBar) {
  },
};
