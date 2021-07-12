'use babel';

export default class ColorPicker {
  constructor(colors) {
    let colorPicker = document.createElement("div");
    colorPicker.style.display = "none";
    colorPicker.style.position = "relative";
    colorPicker.innerHTML = `
      <div id='dbex-color-picker'>
        <div class='picker-container'>
          <div class='tooltip-tab shadow'></div>
          <div class='tooltip-tab'></div>
          <div class='colors-list'>
            <div class='hash-color-guide'>#</div>
            <div class="selected-color"></div>
          </div>
        </div>
      </div>
    `;

    let button = document.createElement("button");
    button.innerHTML = `
      <div class="color-btn color-btn-selected" title="#ABB8C3" tabindex="0"></div>
    `;
    button.style.padding = "2px";
    button.setAttribute("type", "button");
    button.classList.add('btn', 'btn-default');
    button.addEventListener("click", ()=>colorPicker.style.display = colorPicker.style.display === "block" ? "none" : "block");

    this.colorSelected = atom.workspace.buildTextEditor({mini:true})
    this.colorSelected.onDidChange(()=>{
      let colorCode = this.colorSelected.getText();
      let selectedEl = button.getElementsByClassName("color-btn-selected")[0];
      selectedEl.style.backgroundColor = `#${colorCode}`;
      selectedEl.title = `#${colorCode}`;
    });
    colorPicker.getElementsByClassName("selected-color")[0].appendChild(this.colorSelected.element);

    let colorItems = this._createColorElements(
      (el)=>{
        this.setColorCode(el.srcElement.dataset.color);
        colorPicker.style.display = "none";
      },
      colors || [
        "FF6900",
        "FCB900",
        "7BDCB5",
        "00D084",
        "8ED1FC",
        "0693E3",
        "ABB8C3",
        "EB144C",
        "F78DA7",
        "9900EF",
      ]
    );

    colorPicker.getElementsByClassName("colors-list")[0].prepend(colorItems);

    this._element = document.createElement('div');
    this._element.appendChild(button);
    this._element.appendChild(colorPicker);
  }

  get element() {
    return this._element;
  }

  setColorCode(colorCode) {
    this.colorSelected.setText(colorCode);
  }

  getSelectedColor() {
    return this.colorSelected.getText();
  }

  _createColorElements(onClick, colors) {
    let elements = document.createElement('span');

    colors.forEach((color) => {
      let colorEl = document.createElement('span');
      colorEl.innerHTML = `
        <div class="color-btn" data-color="${color}" title="#${color}" tabindex="0" style="background-color: #${color};"></div>
      `;
      colorEl.addEventListener("click", onClick);
      elements.appendChild(colorEl);
    });

    return elements;
  }

  dispose() {
    this.colorSelected.destroy();
  }
}
