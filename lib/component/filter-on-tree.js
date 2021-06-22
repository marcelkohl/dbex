'use babel';

export default class FilterOnTree {
  constructor(filterElRef) {
    this._element = document.createElement('div');
    this._element.classList.add('filter-on-tree');
    this._filterElRef = filterElRef;
    // this._element.innerHTML = "The filter goes here";
    this._lastTimeoutFilter = undefined;

    this._filterEditor = atom.workspace.buildTextEditor({mini:true});
    this._filterEditor.onDidChange(()=>{
      if (this._lastTimeoutFilter) {
        clearTimeout(this._lastTimeoutFilter);
      }

      this._lastTimeoutFilter = setTimeout(
        ()=>{
          this.filter(this._filterEditor.getText());
        },
        500
      )
    });
    console.log(this._filterEditor);

    let optEl = document.createElement('button');
    optEl.classList.add('btn');
    optEl.title = 'Close filter';
    optEl.innerHTML = `<i class="fa fa-times aria-hidden="true"></i>`;
    optEl.addEventListener('click', ()=>this.hide());

    this._element.appendChild(this._filterEditor.element);
    this._element.appendChild(optEl);
  }

  get element() {
    return this._element;
  }

  show() {
    this.element.style.display = 'flex';
    this._filterEditor.element.focus();
  }

  hide() {
    this.element.style.display = 'none';
    console.log('hide it');
    this.removeFilter();
  }

  removeFilter() {
    let treeEl = document.getElementsByClassName(this._filterElRef)[0];
    let allItems = Array.from(treeEl.querySelectorAll('[data-label]'));

    allItems.forEach((item, i) => {
      item.classList.remove('hidden');
    });
  }

  filter(textToFilter) {
    if (textToFilter.length < 3) {
      this.removeFilter();
      return;
    }

    textToFilter = textToFilter.toLowerCase();

    let treeEl = document.getElementsByClassName(this._filterElRef)[0];
    let allItems = Array.from(treeEl.querySelectorAll('[data-label]'));

    allItems.forEach((item, i) => {
      item.classList.add('hidden');
    });

    let itemsWithText = allItems.filter((e)=>e.dataset.label.toLowerCase().includes(textToFilter))

    let keepParent = (e)=>{
        e.classList.remove('hidden');
        let parEl = e.parentElement || false;

        if (parEl) {
            let parCollaped = parEl.closest('li.collapsed');

            if (parCollaped) {
              parCollaped.classList.remove('collapsed');
            }

            let parElHidden = parEl.closest('li.hidden');

            if (parElHidden) {
              keepParent(parElHidden);
            }
        }
    }

    itemsWithText.forEach((e)=>keepParent(e));
  }
}
