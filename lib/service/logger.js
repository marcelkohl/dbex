'use babel';

const log = require('log-to-file');

export default class Logger {
  constructor(scope) {
    this._scope = scope || "general";
    this._path = atom.packages.getLoadedPackage('dbex').path + "/logs/";
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

  log(message) {
    let filePath = this._path + this._scope + ".log";
    log(message.replace(/\s\s+/g, ' '), filePath);
  }
}
