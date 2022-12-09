// @ts-check

import { Picker } from "./picker.js";

export default class App {
  /**
   * @param {string} tagName 
   * @param {{flag: boolean}} option
   * @description The picker will be created by using {@link https://developer.mozilla.org/en-US/docs/Web/Web_Components Web Components} tech.
   *  
   *  By default, the tag will be defined special with tag name; "ios-ui-{@link tagName}"
   *  if you like to only with your tag name, turn off the flag in {@link option}
   */
  config (
    tagName,
    option = { flag: true }
    ) {
    if (option.flag) {
      customElements.define("ios-ui-" + tagName, Picker);
    } else {
      customElements.define(tagName, Picker);
    }
  }
}