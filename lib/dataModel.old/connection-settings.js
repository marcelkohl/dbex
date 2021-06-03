'use babel';

/**
 * Content to be displayed/used on the connection settings
 */
export default class ConnectionSettings {
  /**
   * @param String label    Identification label. This is what the user will see on the settings
   * @param String protocol database protocol (mysql, pgsql, etc.). It is just for information, doesn't need to match any standard
   * @param Object custom   database custom fields to be requested on the connection. A key:"value" structure must be used, as: attributeName:"title"
   */
  constructor({label, protocol, custom}) {
    Object.assign(this, {label, protocol, custom})
  }
}
