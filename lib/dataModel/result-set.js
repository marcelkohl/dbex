'use babel';

/**
 * result set data
 */
export default class ResultSet {
  /**
   * @param String[]  columns  column names
   * @param Mixed[][] data     an array containing an inner array corresponding to the declarated columns
   * @param String    query    a query string for the result data. This will be auto filled in the query area
   */
  constructor({columns, data, query}) {
    Object.assign(this, {columns, data, query})
  }
}
