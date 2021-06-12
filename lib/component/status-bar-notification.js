'use babel';

import EmptyDisposable from '../dataModel/empty-disposable';

module.exports = class StatusBarNotification{
    constructor() {
        this._onClickCallback = ()=>true;
        // this.packagePath = packagePath;
        this.elementId = "dbex-status-bar-icon";
        this.element = document.createElement('div');
        this.element.setAttribute("id", this.elementId);
        this.element.classList.add('inline-block');
        // this.element.onclick = ()=>this._onClickCallback();
        this.disposable = new EmptyDisposable();
        this._setElementContent();
    }

    _setElementContent() {
      this.element.innerHTML = `
        <div class="inline-block dbex" tabindex="-1" data-original-title="" title="">
          <span class="icon icon-database"></span>
          <span class="">None Selected</span>
        </div>
      `;
    }

    set selectedConnection(connection) {
      console.log(connection.label);
      this.element.getElementsByTagName('div')[0].innerHTML = `
        <span class="icon ${connection.icon}"></span>
        <span>${connection.label}</span>
      `;
    }

    // hideAllNotifications(resolve) {
    //     Array.from(
    //         this.element.querySelectorAll('.notification:not(.hidden)')
    //     ).forEach(
    //         (element)=>element.classList.add('hidden')
    //     );
    // }

    // _showNotification(notificationClass) {
    //     this.element.querySelectorAll('.notification' + notificationClass)[0].classList.remove('hidden');
    // }

    // working() {
    //     this.hideAllNotifications();
    //     this._showNotification('.working');
    // }
    //
    // allFine() {
    //     this.hideAllNotifications();
    //     this._showNotification('.all-fine');
    // }
    //
    // misspelling() {
    //     this.hideAllNotifications();
    //     this._showNotification('.misspelling');
    // }

    getElement() {
        return this.element;
    }

    _removeElement() {
        this.element.classList.add("hidden");
    }

    // setMessage(message) {
    //     this.disposable.dispose();
    //     this.disposable = atom.tooltips.add(this.element, {title: message});
    // }

    destroy() {
        this.disposable.dispose();
        this._removeElement();
    }

    // set onClick(onClickCallback) {
    //     this._onClickCallback = onClickCallback;
    // }
};
