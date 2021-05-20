'use babel';

import ConnectionSettings from './dataModel/connection-settings';

export default class DbManager {
  /**
   * @param ConnectionSettings config an object containing data collected from connection settings
   */
  constructor(config) {

  }

  /**
   * @return ConnectionSettings
   */
  getConnectionSettings() {
    return new ConnectionSettings({
      label: "SampleSQL",
      protocol: "xsql",
      custom: {
        host: "Host",
        port: "Port",
        password: "Password",
        user: "User",
        database: "Database",
      }
    });
  }
}
