'use babel';

export default class ColorPicker {
  constructor(colors) {
    let colorPicker = document.createElement("div");
    colorPicker.style.display = "none";
    colorPicker.style.position = "relative";
    colorPicker.innerHTML = `
      <div style="float: left;position: absolute;margin-top: 16px;right: -5px;z-index: 1;">
        <div class="color-picker" style="width: 262px; background: #2b2e31; border: 0px solid rgba(0, 0, 0, 0.25); box-shadow: rgba(255, 255, 255, 0.32) 2px 2px 4px; border-radius: 4px; position: relative;">
          <div style="width: 0px; height: 0px; border-style: solid; border-width: 0px 9px 10px; border-color: transparent transparent rgba(163, 168, 174, 0.27); position: absolute; top: -11px; right: 11px;"></div>
          <div style="width: 0px; height: 0px; border-style: solid; border-width: 0px 9px 10px; border-color: transparent transparent #2b2e31; position: absolute; top: -10px; right: 12px;"></div>
          <div class="colors" style="padding: 15px 9px 4px 15px;">
            <div style="background: rgb(240, 240, 240) none repeat scroll 0% 0%; height: 28px; width: 28px; border-radius: 4px 0px 0px 4px; float: left; color: rgb(152, 161, 164); display: flex; align-items: center; justify-content: center;">#</div>
            <div class="selected-color"></div>
            <div style="clear: both;"></div>
          </div>
        </div>
        <div style="text-align: center; position: absolute; width: 100%; color: rgba(0, 0, 0, 0.4); font-size: 12px; margin-top: 10px;">Twitter</div>
      </div>
    `;

    let button = document.createElement("button");
    button.innerHTML = `
      <div class="selected-color-box" title="#ABB8C3" tabindex="0" style="background: rgb(171, 184, 195) none repeat scroll 0% 0%;height: 20px;width: 20px; border-radius: 4px;margin: 2px 2px 2px 2px;"></div>
    `;
    button.style.padding = "2px";
    button.setAttribute("type", "button");
    button.classList.add('btn', 'btn-default');
    button.addEventListener("click", ()=>colorPicker.style.display = colorPicker.style.display === "block" ? "none" : "block");

    this.colorSelected = atom.workspace.buildTextEditor({mini:true})
    this.colorSelected.element.id = "color";
    this.colorSelected.onDidChange(()=>{
      let colorCode = this.colorSelected.getText();
      button.getElementsByClassName("selected-color-box")[0].style.backgroundColor = `#${colorCode}`;
      console.log(this.colorSelected);
    });
    colorPicker.getElementsByClassName("selected-color")[0].appendChild(this.colorSelected.element);

    let colorItems = this._createColorElements(
      (el)=>{
        console.log(el.srcElement.dataset.color);
        this.setColorCode(el.srcElement.dataset.color);
        colorPicker.style.display = "none";
      },
      [
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

    colorPicker.getElementsByClassName("colors")[0].prepend(colorItems);

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
        <div class="color-item" data-color="${color}" title="#${color}" tabindex="0" style="background: #${color} none repeat scroll 0% 0%; height: 28px; width: 28px; cursor: pointer; position: relative; outline: currentcolor none medium; float: left; border-radius: 4px; margin: 0px 6px 6px 0px;"></div>
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
