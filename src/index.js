import _ from "lodash"
import "./style.css"

function component() {
  var element = document.createElement('div');
  var btn = document.createElement("button");
  element.innerHTML = _.join(['Hello', 'webpack'], ' ');
  element.classList.add("hello");

  return element;
}

document.body.appendChild(component());
