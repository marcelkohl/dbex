'use babel';

/**
 * item action attributes for an item on the list (could be a conenction, a database, field, etc)
 */
export default class ItemAction {
  /**
   * @param String name         Identification name
   * @param String icon         A string referring to an icon class
   * @param String description  description for the tooltip
   */
  constructor({name, icon, description}) {
    Object.assign(this, {name, icon, description})
  }
}
