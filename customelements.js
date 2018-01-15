//const renderer = require('./renderer.js');

class PropertySlider extends HTMLElement {

  constructor(){
    super();
  }

connectedCallback() {

  var conflu = document.createElement('div');
  //conflu.className = 'container-fluid';
  this.appendChild(conflu);

  var row = document.createElement('div');
  row.style.display = "table";
  row.style.borderSpacing = "0px";
  row.style.width = "100%";
  //row.className = 'row';
  conflu.appendChild(row);

  var col1 = document.createElement('div');
  //col1.className = "table-cell";
  col1.style.padding = "0px 10px 0px 0px";
  col1.style.cssFloat = "left";
  col1.style.width = "6em";
  col1.style.display = "table-cell";
  row.appendChild(col1);
  var lbltype = document.createElement('p');
  lbltype.style.margin = "0px";
  lbltype.className = 'labeltype'
  lbltype.innerHTML = this.getAttribute('type');
  col1.appendChild(lbltype);

  var col2 = document.createElement('div');
  //col2.className = "table-cell";
  col2.style.padding = "0px 0px 0px 0px";
  col2.style.display = "table-cell";
  col2.style.verticalAlign = "top";
  col2.style.width = "100%";
  row.appendChild(col2);
  var inp = document.createElement('input');
  inp.style.width = "100%";
  inp.style.verticalAlign = "center";
  inp.style.margin = "5px 0px 0px 0px";
  inp.className = 'slider';
  inp.type = 'range';
  inp.min = this.getAttribute('min');
  inp.max = this.getAttribute('max');
  inp.step = this.getAttribute('step');
  inp.value = this.getAttribute('initvalue')
  inp.ondblclick = (function(){
    console.log(this.getAttribute('initvalue'));
    lblvalue.innerHTML = this.getAttribute('initvalue');
    this.setAttribute('value', ''+this.getAttribute('initvalue'));
    inp.value = this.getAttribute('initvalue');
    updateImage(true);
  }).bind(this);

  inp.oninput = (function(){
    lblvalue.innerHTML = inp.value;
    this.setAttribute('value', ''+inp.value);
    updateImage(true);
  }).bind(this);
  inp.onchange = (function(){
    lblvalue.innerHTML = inp.value;
    console.log(inp.value);
    this.setAttribute('value', inp.value);
    updateImage(false);
  }).bind(this);
  col2.appendChild(inp);

  var col3 = document.createElement('div');
  //col3.className = "table-cell";
  col3.style.padding = "0px 0px 0px 10px";
  col3.style.width = "3em";
  col3.style.textAlign = "right";
  col3.style.cssFloat = "right";
  col3.style.display = "table-cell";
  row.appendChild(col3);
  var lblvalue = document.createElement('p');
  lblvalue.className = 'labelvalue'
  lblvalue.style.margin = "0px";
  lblvalue.innerHTML = this.getAttribute('initvalue');
  col3.appendChild(lblvalue);



  this.setAttribute('value', '' + this.getAttribute('initvalue'));

  lblvalue.innerHTML = this.getAttribute('initvalue');
  }
}

// Define the new element
customElements.define('prop-slider', PropertySlider);
