'use babel';

export default class TreeItem {
  /**
   * @param string        label
   * @param string        name
   * @param string        icon
   * @param TreeItem[]    children
   * @param string        details
   * @param boolean       collapsed
   * @param object        datasets
   * @param string[]      classes
   * @param ItemAction[]  actions
   */
  constructor({label, name, icon, children, details, collapsed, datasets, classes, actions}) {
    collapsed = (collapsed === true ? 'collapsed' : undefined);
    Object.assign(this, {label, name, icon, children, details, collapsed, datasets, classes, actions})
  }
}
