'use babel';

export const TYPE = {
  undefined: 0,
  number: 1,
  text: 2,
  boolean: 3,
  date: 4
};

/**
 * result set data
 */
export default class ResultSet {
  /**
   * @param String[]  columns         column names
   * @param Mixed[][] data            an array containing an inner array corresponding to the declarated columns
   * @param String    query           a query string for the result data. This will be auto filled in the query area
   * @param String    grammar         grammar style for the query. It may depends on the user's language plugins installed. Make sure that the dependencies for the desired grammar is installed
   * @param Integer   recordsAffected the number of records affected by the query
   */
  constructor({columns, data, query, grammar, recordsAffected}) {
    Object.assign(this, {columns, data, query, grammar, recordsAffected})
  }
}
