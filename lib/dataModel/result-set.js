'use babel';

/**
 * result set data
 */
export default class ResultSet {
  /**
   * @param String[]  columns  column names
   * @param Mixed[][] data     an array containing an inner array corresponding to the declarated columns
   */
  constructor({columns, data}) {
    Object.assign(this, {columns, data})
  }
}
