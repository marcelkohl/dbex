"use babel"
// /** @jsx etch.dom */
//
// import etch, {getScheduler} from 'etch'
// import URL from 'url'
//
// import _s from 'underscore.string'
// import {CompositeDisposable} from 'atom'

// import DbFactory from '../data-managers/db-factory'
// import Utils from '../utils.js'

module.exports =
class NewConnectionDialog {
  constructor() {
    this._onSave = (data)=>null;
    this.element = document.createElement('div');
    this.element.innerHTML = this.render();

    this.element.getElementsByClassName('btn-cancel')[0].addEventListener('click', () => this.close())
    this.element.getElementsByClassName('btn-save')[0].addEventListener('click', (data) => this._onSave({some:'data'}))

    // this.onConnectClicked = onConnect
    //
    // this.loadedConnections = []
    // this.placeholderUrlPart = '://user:pass@localhost/db-name'
    // this.supportedDbs = DbFactory.getSupportedDatabases()
    //
    // this.state = {
    //   selectedProtocol: this.supportedDbs[0].prefix,
    //   defaultPort: this.supportedDbs[0].port
    // }
    //
    // etch.initialize(this)
    // this.registerListeners()
    //
    // this.subscriptions = new CompositeDisposable()
    // this.subscriptions.add(
    //   atom.commands.add(this.element, {
    //   'core:close': () => { this.close(); },
    //   'core:cancel': () => { this.close(); }
    // }))
    //
    // DbFactory.loadConnections().then(connections => {
    //   this.loadedConnections = connections
    //   etch.update(this)
    // })
  }

  // update(props, children) {
  //   return etch.update(this)
  // }

  registerListeners() {
  //   this.refs.dbUser.getModel().onDidChange(() => this.buildUrl())
  //   this.refs.dbPassword.getModel().onDidChange(() => this.buildUrl())
  //   this.refs.dbServer.getModel().onDidChange(() => this.buildUrl())
  //   this.refs.dbPort.getModel().onDidChange(() => this.buildUrl())
  //   this.refs.dbName.getModel().onDidChange(() => this.buildUrl())
  //   this.refs.dbOptions.getModel().onDidChange(() => this.buildUrl())
  //
  //   this.refs.url.getModel().onDidChange(() => this.separateUrl())
  //
  //   this.refs.connections.addEventListener('change', (e) => this.connectionPicked(e))
  //   this.refs.dbType.addEventListener('change', (e) => this.updateDbType(e))
  //
  //   this.refs.btnConnect.addEventListener('click', () => this.connect())
  //   this.refs.btnSaveConnect.addEventListener('click', () => this.connectAndSave())
    // this.refs.btnClose.addEventListener('click', () => this.close())
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
              <select id="core.colorProfile" class="form-control" data-original-title="" title="">
                <option value="default">MySQL until 5.7</option>
                <option value="srgb">PostgreSQL</option>
              </select>
            </div>
          </div>

          <section className="row row-centered">
        <label className='control-label'>Auth</label>
        <div className='row-item-flex row-item-pad-right'>
          <atom-text-editor ref='dbUser' attributes={{mini: true, tabindex:6, 'placeholder-text':'user'}}></atom-text-editor>
        </div>
        <div className='row-item-flex row-item-pad-left'>
          <atom-text-editor ref='dbPassword' attributes={{mini: true, tabindex:7, 'placeholder-text':'password'}}></atom-text-editor>
        </div>
      </section>
      
        </section>
        <div class='footer'>
          <button type="button" class='btn-save btn btn-default pull-left'>Test Connection</button>
          <button type="button" class='btn-save btn btn-default selected pull-right'>Save</button>
          <button type="button" class='btn-cancel btn btn-default pull-right'>Cancel</button>
        </div>
      </section>`;
  }

  show() {
    console.log(this.element);
    if (!this.dialogPanel)
      this.dialogPanel = atom.workspace.addModalPanel({item:this.element})
    // this.refs.url.focus()
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
      onSave(formData)
    };
  }

  // if the user modifies the URL we'll try to break it into the separate parameters
  // separateUrl() {
  //   if (!this.refs.url.hasFocus())
  //     return
  //
  //   // clear inputs
  //   this.refs.dbOptions.getModel().setText('')
  //   this.refs.dbServer.getModel().setText('')
  //   this.refs.dbPort.getModel().setText('')
  //   this.refs.dbName.getModel().setText('')
  //   this.refs.dbUser.getModel().setText('')
  //   this.refs.dbPassword.getModel().setText('')
  //
  //   // we update the view, a combination of setting the atomTextEditor model and using Etch's updateElement (for non-atomTextEditor)
  //   // #'s in passwords etc screw up the URL.parse
  //   this.state.escapedUrl = this.refs.url.getModel().getText().replace(/#/g, '%23')
  //
  //   var urlObj = URL.parse(this.state.escapedUrl, true)
  //   if (urlObj) {
  //     if (urlObj.protocol) {
  //       this.state.selectedProtocol = urlObj.protocol.substring(0, urlObj.protocol.length - 1)
  //     }
  //     if (urlObj.search) {
  //       this.refs.dbOptions.getModel().setText(urlObj.search.replace('?', '').replace('&', ', '))
  //     }
  //     if (urlObj.hostname) {
  //       this.refs.dbServer.getModel().setText(urlObj.hostname)
  //     }
  //     if (urlObj.port) {
  //       this.refs.dbPort.getModel().setText(urlObj.port)
  //     }
  //     this.refs.dbName.getModel().setText(_s.ltrim(urlObj.pathname, '/'))
  //     if (urlObj.auth) {
  //       var auth = urlObj.auth.split(':')
  //       if (auth) {
  //         this.refs.dbUser.getModel().setText(auth[0])
  //         if (auth.length != 1) {
  //           this.refs.dbPassword.getModel().setText(auth[1])
  //         }
  //       }
  //     }
  //     etch.update(this)
  //   }
  // }
  //
  // buildUrl() {
  //   if (this.refs.url.hasFocus())
  //     return
  //
  //   var urlStr = this.state.selectedProtocol + '://'
  //   this.state.escapedUrl = urlStr
  //
  //   var userPass = this.refs.dbUser.getModel().getText() + ':' + this.refs.dbPassword.getModel().getText()
  //   if (userPass != ':') {
  //     urlStr += userPass + '@'
  //     this.state.escapedUrl += encodeURIComponent(this.refs.dbUser.getModel().getText()) + ':' + encodeURIComponent(this.refs.dbPassword.getModel().getText()) + '@'
  //   }
  //
  //   urlStr += this.refs.dbServer.getModel().getText()
  //   this.state.escapedUrl += this.refs.dbServer.getModel().getText()
  //   if (this.refs.dbPort.getModel().getText() != '') {
  //     urlStr += ':' + this.refs.dbPort.getModel().getText()
  //     this.state.escapedUrl += ':' + this.refs.dbPort.getModel().getText()
  //   }
  //
  //   var dbName = this.refs.dbName.getModel().getText()
  //   var dbOptions = this.refs.dbOptions.getModel().getText()
  //   if (dbName || dbOptions) {
  //     urlStr += '/'
  //     this.state.escapedUrl += '/'
  //   }
  //   if (dbName) {
  //     urlStr += dbName
  //     this.state.escapedUrl += encodeURIComponent(dbName)
  //   }
  //   if (dbOptions) {
  //     urlStr += '?' + Utils.buildDbOptions(dbOptions)
  //     this.state.escapedUrl += '?' + Utils.buildEscapeDbOptions(dbOptions)
  //   }
  //   this.refs.url.getModel().setText(urlStr)
  //
  //   return this.state.escapedUrl
  // }
  //
  // updateDbType(e) {
  //   for (var i = 0; i < this.refs.dbType.childNodes.length; i++) {
  //     var n = this.refs.dbType.childNodes[i]
  //     if (n.selected) {
  //       this.state.selectedProtocol = n.getAttribute('value')
  //       this.state.defaultPort = n.getAttribute('data-port')
  //       etch.update(this)
  //       this.buildUrl()
  //       return
  //     }
  //   }
  // }
  //
  // connectionPicked(e) {
  //   for (var i = 0; i < this.refs.connections.childNodes.length; i++) {
  //     var n = this.refs.connections.childNodes[i]
  //     if (n.selected) {
  //       this.refs.connectionName.getModel().setText(n.innerText)
  //       this.refs.url.focus()
  //
  //       this.refs.btnSaveConnect.disabled = (n.value !== '')
  //       if (n.value === '') {
  //         this.refs.url.getModel().setText('')
  //         this.refs.connectionName.getModel().setText('')
  //         this.refs.dbOptions.getModel().setText('')
  //         this.refs.dbServer.getModel().setText('')
  //         this.refs.dbPort.getModel().setText('')
  //         this.refs.dbUser.getModel().setText('')
  //         this.refs.dbPassword.getModel().setText('')
  //         this.refs.dbName.getModel().setText('')
  //       }
  //       else {
  //         this.refs.url.getModel().setText(n.value)
  //         this.separateUrl()
  //       }
  //       return
  //     }
  //   }
  // }
  //
  // // Called when the user clicks the save and connect button.
  // connectAndSave() {
  //   var connection = {
  //     name: this.refs.connectionName.getModel().getText() !== '' ? this.refs.connectionName.getModel().getText() : this.refs.dbName.getModel().getText(),
  //     protocol: this.state.selectedProtocol,
  //     user: this.refs.dbUser.getModel().getText(),
  //     password: this.refs.dbPassword.getModel().getText(),
  //     server: this.refs.dbServer.getModel().getText(),
  //     database: this.refs.dbName.getModel().getText(),
  //     options: this.refs.dbOptions.getModel().getText()
  //   }
  //   if (this.refs.dbPort.getModel().getText() !== '') {
  //     connection.port = this.refs.dbPort.getModel().getText()
  //   }
  //   DbFactory.saveConnection(connection).then(() => {
  //     this.loadedConnections.push(connection)
  //     this.onConnectClicked(this.buildUrl())
  //     this.close()
  //   })
  // }
  //
  // // Called when the user clicks the connect button. Triggers a callback for the controller to
  // // create a connection with the given parameters
  // connect() {
  //   var url = this.buildUrl()
  //   if (this.onConnectClicked && url !== '') {
  //     this.onConnectClicked(url)
  //     this.close()
  //   }
  // }
}
