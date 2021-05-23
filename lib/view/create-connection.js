"use babel"

export default class CreateConnection {
  constructor() {
    this._onSave = ()=>null;
    this._onTestConnection = ()=>null
    this._onSelectConnection = ()=>null
    this.element = document.createElement('div');
    this.element.innerHTML = this.render();

    this.element.getElementsByClassName('connection-engine')[0].addEventListener(
      'change',
      (el) => this._onSelectConnection(el.target.value)
    );
    this.element.getElementsByClassName('btn-test-connection')[0].addEventListener(
      'click',
      () => this._onTestConnection(this.getFormData())
    );
    this.element.getElementsByClassName('btn-cancel')[0].addEventListener(
      'click',
      () => this.close()
    );
    this.element.getElementsByClassName('btn-save')[0].addEventListener(
      'click',
      () => this._onSave(this.getFormData())
    );
  }

  render() {
    return `
      <section class='dbex dialog'>
        <div class='heading section-heading'>New Connection...</div>
        <section class="row row-centered content">
          <div class="control-group">
            <div class="controls">
              <label class="control-label">
                <div class="title">Name</div>
                <div class="description">Give a nice name for your connection</div>
              </label>
              <div class="controls">
                <div class="editor-container">
                  <atom-text-editor class="editor mini" mini="" data-encoding="utf8" data-grammar="text plain null-grammar" tabindex="-1" id="name" type="number" data-original-title="" title=""></atom-text-editor>
                </div>
              </div>
            </div>
            <div class="controls">
              <label class="control-label">
                <div class="title">Connection type</div>
                <div class="description">Availability of connections depends on the additional dbex data engines that you have installed.</div>
              </label>
              <select id="engine" class="form-control connection-engine" data-original-title="" title="">
              </select>
            </div>

            <!-- section class="input-block find-container">
              <div class="input-block-item--flex editor-container">Content Here is something to be big an use the entire line</div>
              <div class="input-block-item">Here we have smethin also how many can fit</div>
            </section -->

            <div class="custom-fields">
            </div>
        </section>

        <div class='footer'>
          <button type="button" class='btn-test-connection btn btn-default pull-left'>Test Connection</button>
          <button type="button" class='btn-save btn btn-default selected pull-right'>Save</button>
          <button type="button" class='btn-cancel btn btn-default pull-right'>Cancel</button>
        </div>
      </section>`;
  }

  setCustomFields(fields) {
    let customFieldsArea = this.element.getElementsByClassName('custom-fields')[0];
    customFieldsArea.innerHTML = "";

    Object.entries(fields).forEach((field) => {
      let [id, definition] = field;

      customFieldsArea.insertAdjacentHTML(
        'beforeend',
        definition.isBool
        ? `<div class="controls">
            <div class="checkbox">
              <label>
                <input id="${id}" type="checkbox" class="input-checkbox" data-original-title="" title="">
                <div class="title">${definition.title || id}</div>
              </label>
              <div class="description">${definition.tip || ""}</div>
            </div>
          </div>`
        : `<div class="controls">
          <label class="control-label">
            <div class="title">${definition.title || id}</div>
            <div class="description">${definition.tip || ""}</div>
          </label>
          <div class="controls">
            <div class="editor-container">
              <atom-text-editor class="editor mini" mini="" data-encoding="utf8" data-grammar="text plain null-grammar" tabindex="-1" id="${id}" type="number" data-original-title="" title=""></atom-text-editor>
            </div>
          </div>
        </div>`
      );
    });
  }

  getFormData() {
    let content = this.element;
    let fields = {};

    Array.from(content.getElementsByTagName('atom-text-editor')).forEach((item) => {
      fields[item.id] = item.innerText.trim();
    });

    Array.from(content.getElementsByClassName('input-checkbox')).forEach((item) => {
      fields[item.id] = item.checked;
    });

    return Object.assign(
      {engine: content.getElementsByClassName("connection-engine")[0].value},
      fields
    );
  }

  /**
   * @param  DbEngine[] enginess
   */
  show(engines) {
    if (!this.dialogPanel) {
      let options = '';

      Object.entries(engines).forEach((engine) => {
        let [name, obj] = engine;
        let info = obj.getConnectionSettings();
        // console.log(name, info);
        options += `<option value="${name}">${info.label}</option>`;
      });

      this.element.getElementsByClassName("connection-engine")[0].innerHTML = '<option value="">Select...</option>' + options;

      this.dialogPanel = atom.workspace.addModalPanel({item:this.element})
    }
  }

  close() {
    if (this.dialogPanel) {
      this.dialogPanel.hide()
      this.element.remove()
      this.dialogPanel.destroy()
      this.dialogPanel = null
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
}
