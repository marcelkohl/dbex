'use babel';

/**
 * field connection attributes. Used for the connection window
 */
export default class FieldConnection {
  /**
   * @param String name         Identification name
   * @param String icon         A string referring to an icon class
   * @param String description  description for the tooltip
   */
  constructor({id, title, tip, isBool}) {
    Object.assign(this, {id, title, tip, isBool})
  }
}
