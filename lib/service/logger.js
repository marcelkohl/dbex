'use babel';

const log = require('log-to-file');

export default class Logger {
  constructor(isEnabled = true, scope = "general") {
    this._scope = scope;
    this._path = atom.packages.getLoadedPackage('dbex').path + "/logs/";
    this._isEnabled = isEnabled;
  }

  set scope(scope) {
    this._scope = scope.replace(/[^a-zA-Z0-9 ]/g, "-");
  }

  get scope() {
    return this._scope;
  }

  get fullPath() {
    return this._path + this._scope + '.log';
  }

  set isEnabled(isEnabled) {
    this._isEnabled = (isEnabled === true);
  }

  log(message) {
    if (this._isEnabled) {
      let filePath = this._path + this._scope + ".log";
      log(message.replace(/\s\s+/g, ' '), filePath);
    }
  }
}
