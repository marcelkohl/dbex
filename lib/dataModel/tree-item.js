'use babel';

export default class TreeItem {
  /**
   * @param string      label
   * @param string      name
   * @param string      icon
   * @param TreeItem[]  children
   * @param string      details
   * @param boolean     collapsed
   * @param object[]    datasets
   */
  constructor({label, name, icon, children, details, collapsed, datasets}) {
    collapsed = (collapsed ? 'collapsed' : '');
    Object.assign(this, {label, name, icon, children, details, collapsed, datasets})
  }
}
