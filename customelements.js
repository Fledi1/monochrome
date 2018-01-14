//const renderer = require('./renderer.js');

class Slider extends HTMLElement {

  constructor(){
    super();
  }

connectedCallback(){
  var conflu = document.createElement('div');
  conflu.className = 'container-fluid';
  this.appendChild(conflu);

  var row = document.createElement('div');
  row.className = 'row';
  conflu.appendChild(row);

  var col1 = document.createElement('div');
  col1.className = 'col-sm-2';
  row.appendChild(col1);
  var lbltype = document.createElement('p');
  lbltype.className = 'labeltype'
  lbltype.innerHTML = this.getAttribute('type');
  col1.appendChild(lbltype);

  var col2 = document.createElement('div');
  col2.className = 'col-sm-8';
  row.appendChild(col2);
  var inp = document.createElement('input');
  inp.className = 'slider';
  inp.type = 'range';
  inp.min = this.getAttribute('min');
  inp.max = this.getAttribute('max');
  inp.step = this.getAttribute('step');
  inp.value = this.getAttribute('initvalue')
  inp.ondblclick = function(){
    //inp.setAttribute('value',''+this.getAttribute('initvalue'));
    console.log(this.initialvalue);
    inp.value = this.getAttribute('initialvalue');
  };
  inp.oninput = function(){
    lblvalue.innerHTML = inp.value;
    this.setAttribute('value', ''+inp.value);
    updateImage(true);
  };
  inp.onchange = function(){
    lblvalue.innerHTML = inp.value;
    console.log(inp.value);
    this.setAttribute('value', inp.value);
    updateImage(false);
  };
  col2.appendChild(inp);

  var col3 = document.createElement('div');
  col3.className = 'col-sm-2';
  row.appendChild(col3);
  var lblvalue = document.createElement('p');
  lblvalue.className = 'labelvalue'
  lblvalue.innerHTML = this.getAttribute('initvalue');
  col3.appendChild(lblvalue);



  this.setAttribute('value', '' + this.getAttribute('initvalue'));

  lblvalue.innerHTML = this.getAttribute('initvalue');
  }
}

// Define the new element
customElements.define('cust-slider', Slider);
