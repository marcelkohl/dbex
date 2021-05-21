"use babel"

export default class CreateConnection {
  constructor() {
    this._onSave = ()=>null;
    this._onTestConnection = ()=>null
    this._onSelectConnection = ()=>null
    this.element = document.createElement('div');
    this.element.innerHTML = this.render();

    this.element.getElementsByClassName('connection-manager')[0].addEventListener(
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
                <div class="title">Connection type</div>
                <div class="description">Availability of connections depends on the additional dbex data managers that you have installed.</div>
              </label>
              <select id="dbex.connection" class="form-control connection-manager" data-original-title="" title="">
                <option value="">Select...</option>
                <option value="mysql">MySQL until 5.7</option>
                <option value="postgresql">PostgreSQL</option>
              </select>
            </div>
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

    Object.entries(fields).forEach((entry) => {
      let [id, title] = entry;

      customFieldsArea.insertAdjacentHTML(
        'beforeend',
        `<div class="controls">
          <label class="control-label">
            <div class="title">${title}</div>
            <!-- div class="description">If localhost does not work, try 127.0.0.1</div -->
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

    return Object.assign(
      {manager: content.getElementsByClassName("connection-manager")[0].value,},
      fields
    );
  }

  show() {
    if (!this.dialogPanel) {
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
      onSave(formData);
      this.close();
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
