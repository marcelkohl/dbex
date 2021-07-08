'use babel';

export default class HeaderOptions {
  constructor(options) {
    this._id = 'dbex-main-options';

    this.optionsElement = document.createElement('div');
    this.optionsElement.innerHTML = `
      <div tabindex="-1" class="dbex-options">
        <header class="header">
          <span class="header-item options-items pull-right">
            <span class="${this.id} btn-group btn-toggle btn-group-options">
            </span>
          </span>
        </header>
      </div>
    `;

    this.label = document.createElement('span');
    this.label.classList.add('header-item', 'options-label');
    this.optionsElement.getElementsByClassName('header')[0].prepend(this.label);

    this._generateOptionsElements(options);
  }

  get id() {
    return this._id;
  }

  get element() {
    return this.optionsElement;
  }

  set message(message) {
    this.label.innerHTML = message;
  }

  _generateOptionsElements(options) {
    let buttons = this.optionsElement.getElementsByClassName(this.id)[0];

    options.forEach((option) => {
      let optEl;

      if (option.divider) {
        optEl = document.createElement('hr');
        optEl.classList.add('divider', 'pull-right');
      } else {
        optEl = document.createElement('button');

        optEl.classList.add('btn');
        optEl.title = option.tooltip;
        optEl.innerHTML = `<i class="fa ${option.icon} ${option.classes || ""}" aria-hidden="true"></i>`;
        optEl.addEventListener('click', option.onClick);
      }

      buttons.appendChild(optEl);
    });
  }
}
