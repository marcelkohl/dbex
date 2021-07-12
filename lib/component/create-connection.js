"use babel"

import ColorPicker from "../component/color-picker";
import {CompositeDisposable} from 'atom';

export default class CreateConnection {
  constructor() {
    this._onSave = ()=>false;
    this._onTestConnection = ()=>false;
    this._onSelectConnection = ()=>false;
    this._colorPicker = undefined;
    this._connNameEditor = undefined;
    this._customValues = {};
    this.disposables = new CompositeDisposable();
    this.destroyables = [];

    this.element = this.render();
    this._setEvents();
  }

  _setEvents() {
    this.element.getElementsByClassName('connection-engine')[0].addEventListener(
      'change',
      (el) => this._onSelectConnection(el.target.value)
    );
    this.element.getElementsByClassName('btn-test-connection')[0].addEventListener(
      'click',
      () => this._onTestConnection(this.formData)
    );
    this.element.getElementsByClassName('btn-cancel')[0].addEventListener(
      'click',
      () => this.close()
    );
    this.element.getElementsByClassName('btn-save')[0].addEventListener(
      'click',
      () => this._onSave(this.formData)
    );
  }

  render() {
    let dialogElement = document.createElement('div');
    dialogElement.id = 'dbex-create-connetion';

    dialogElement.innerHTML = `
      <section class='dbex dialog'>
        <div class='heading section-heading'>New Connection...</div>
        <section class="row row-centered content">
          <div class="control-group">
            <div class="controls">
              <label class="control-label">
                <div class="title">Name</div>
                <div class="description">Give a nice name for your connection</div>
              </label>
              <div id="connection-distinction" class="controls">
                <div class="editor-container"></div>
                <div class="dbex-color-picker"></div>
              </div>
            </div>
            <div>
              <div class="controls">
                <label class="control-label">
                  <div class="title">Connection type</div>
                  <div class="description">Availability of connections depends on the additional dbex data engines that you have installed.</div>
                </label>
                  <select id="engine" class="form-control connection-engine" data-original-title="" title="">
                  </select>
              </div>
            </div>

            <div class="controls custom-fields">
            </div>
        </section>

        <div class='footer'>
          <button type="button" class='btn-test-connection btn btn-default pull-left'>Test Connection</button>
          <button type="button" class='btn-save btn btn-default selected pull-right'>Save</button>
          <button type="button" class='btn-cancel btn btn-default pull-right'>Cancel</button>
        </div>
      </section>
    `;

    this._colorPicker = new ColorPicker();
    let colorPickerArea = dialogElement.getElementsByClassName("dbex-color-picker")[0];
    colorPickerArea.appendChild(this._colorPicker.element);
    this.disposables.add(this._colorPicker);

    this._connNameEditor = atom.workspace.buildTextEditor({mini:true});
    this._connNameEditor.element.id = "name";
    dialogElement.getElementsByClassName("editor-container")[0].appendChild(this._connNameEditor.element);
    this.destroyables.push(this._connNameEditor);

    return dialogElement;
  }

  /**
   * @param FieldConnection[] fields
   * @param Object[]          values  values for the fields as field-id: value
   */
  setCustomFields(fields, values) {
    let customFieldsArea = this.element.getElementsByClassName('custom-fields')[0];
    customFieldsArea.innerHTML = "";
    this._customValues = values || {};

    fields.forEach((field) => {
      let el = document.createElement('div');
      el.classList.add('controls')

      if (field.isBool) {
        let isChecked =  this._customValues[field.id] ? this._customValues[field.id] === "true" : false;

        el.innerHTML = `
          <div class="checkbox">
            <label>
              <input id="${field.id}" type="checkbox" class="input-checkbox" data-original-title="" title="" ${isChecked ? "checked" : ""}>
              <div class="title">${field.title || field.id}</div>
            </label>
            <div class="description">${field.tip || ""}</div>
          </div>
        `;
      } else {
        el.innerHTML = `
          <label class="control-label">
            <div class="title">${field.title || field.id}</div>
            <div class="description">${field.tip || ""}</div>
          </label>
          <div class="controls">
            <div class="editor-container">
            </div>
          </div>
        `;

        let editElement = atom.workspace.buildTextEditor({mini:true});
        editElement.element.id = field.id;
        editElement.setText(this._customValues[field.id] || "");
        this.destroyables.push(editElement);

        el.getElementsByClassName("editor-container")[0].appendChild(editElement.element);
      }

      customFieldsArea.appendChild(el);
    });
  }

  set connectionName(name) {
    this._connNameEditor.setText(name);
  }

  set selectedColor(colorCode) {
    this._colorPicker.setColorCode(colorCode);
  }

  get formData() {
    let content = this.element;
    let fields = {};

    Array.from(content.getElementsByTagName('atom-text-editor')).forEach((item) => {
      fields[item.id] = item.getElementsByClassName('lines')[0].innerText.trim();
    });

    Array.from(content.getElementsByClassName('input-checkbox')).forEach((item) => {
      fields[item.id] = item.checked;
    });

    fields.color = this._colorPicker.getSelectedColor();

    return Object.assign(
      {engine: content.getElementsByClassName("connection-engine")[0].value},
      fields,
      {customValues: this._customValues}
    );
  }

  /**
   * @param Object[]    engine instances loaded from atom plugins
   * @param String      default value selected on show window
   */
  show(engines, defaultName) {
    if (!this.dialogPanel) {
      let options = '';

      Object.entries(engines).forEach((engine) => {
        let [name, obj] = engine;
        let info = obj.getConnectionSettings();
        let isSelected = name === defaultName ? "selected" : "";

        options += `<option value="${name}" ${isSelected}>${info.label}</option>`;
      });

      this.element.getElementsByClassName("connection-engine")[0].innerHTML = '<option value="">Select...</option>' + options;

      this.dialogPanel = atom.workspace.addModalPanel({item:this.element});
    }
  }

  close() {
    if (this.dialogPanel) {
      this.dispose();
    }
  }

  set onSave(onSave) {
    this._onSave = (formData)=>{
      if (onSave(formData) === true) {
        this.close();
      }
    };
  }

  set onTestConnection(onTestConnection) {
    this._onTestConnection = (formData)=>{
      onTestConnection(formData)
    };
  }

  set onSelectConnection(onSelectConnection) {
    this._onSelectConnection = (valueSelected)=>{
      onSelectConnection(valueSelected)
    };
  }

  dispose() {
    this.dialogPanel.hide()
    this.element.remove()
    this.dialogPanel.destroy()
    this.dialogPanel = null
    this.disposables.dispose();

    this.destroyables.forEach((item) => {
      item.destroy();
    });
  }
}
