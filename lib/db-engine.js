'use babel';

import ConnectionSettings from './dataModel/connection-settings';

export default class DbEngine {
  constructor(logger) {
  }

  getName() {
    return "SampleSQL";
  }

  /**
   * @return ConnectionSettings
   */
  getConnectionSettings() {
    return new ConnectionSettings({
      name: this.getName(),
      label: "Sample SQL Connector",
      custom: {
        host: {title: "Host", tip:"Hostname or IP address without port"},
        port: {title: "Port", tip:"Only numbers"},
        user: {title: "User"},
        password: {title: "Password"},
        database: {title: "Database", tip: "Optional"},
        ssl: {title: "Use SSL", tip: "Default is to not use", isBool:true},
      }
    });
  }

  connect(connectionCustomFields) {

  }

  disconnect() {

  }

  testConnection(connectionCustomFields) {
    let ccf = connectionCustomFields;

    if (ccf.host.length > 0 && ccf.port.length > 0 && ccf.user.length > 0) {
      return "";
    } else {
      return "Some necessary fields are not filled. Please check again";
    }
  }

  getSchemas() {

  }

  getTables(schemaName) {

  }

  excuteQuery(query) {

  }

  queryTable(tableName, offset, limit) {

  }

  // stopQuery() {
  //   have to check how it wil work
  // }
}
