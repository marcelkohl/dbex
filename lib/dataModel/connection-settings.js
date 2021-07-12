'use babel';

/**
 * Content to be displayed/used on the connection settings
 */
export default class ConnectionSettings {
  /**
   * @param String            name     Engine name that distinguishes it from the other engines. This will not be shown for the user
   * @param String            label    Identification label. This is what the user will see on the settings
   * @param FieldConnection[] custom   database custom fields to be requested on the connection
   */
  constructor({name, label, custom}) {
    Object.assign(this, {name, label, custom})
  }
}
