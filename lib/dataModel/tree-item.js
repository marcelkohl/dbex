'use babel';

export default class TreeItem {
  /**
   * @param string      label
   * @param string      name
   * @param string      icon
   * @param TreeItem[]  children
   * @param string      details
   * @param object[]    datasets
   */
  constructor({label, name, icon, children, details, datasets}) {
    Object.assign(this, {label, name, icon, children, details, datasets})
  }
}
