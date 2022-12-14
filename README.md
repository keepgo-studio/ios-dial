- [ios-ui](#ios-ui)
  * [Todos](#todos)
  * [installetion](#installetion)
    + [npm](#npm)
    + [cdn](#cdn)
- [Ui types](#ui-types)
  * [1. Picker](#1-picker)
    + [user parameters](#user-parameters)
    + [caution](#caution)
    + [guide](#guide)
    + [examples](#examples)

<small><i><a href='http://ecotrust-canada.github.io/markdown-toc/'>Table of contents generated with markdown-toc</a></i></small>



# ios-ui

This package has several custom elements which are follow Web Component rules.

## Todos

1. Adding width, height, acc attributes (O)

2. Implement endless style (O)

3. Implement scroll event (O)

4. Implement giving opportunity nameing for the event to user (O)

5. Implement keydown event (O)

6. Implement bouncing animation (O)

7. Deploy npm (O)

8. Support typescript (O)


## installetion

### npm

```shell
  $ npm i ios-ui
```

### cdn

```html
  <script src="https://unpkg.com/ios-ui/dist/bundle.js"></script>

  <!-- or -->

  <script src="https://unpkg.com/ios-ui/dist/bundle.min.js"></script>

  <!-- if you only want to get one ui component -->
  <!-- This file hasn't set yet. 😥 But it will support ASAP -->

  <script src="https://unpkg.com/iou-ui/dist/picker.js">
```

# Ui types

## 1. Picker

<div style="display:flex">
 <img src="https://user-images.githubusercontent.com/101318878/207603762-5624e942-f2cc-4e82-bf90-e7dec4cd8d80.png" style="width:300px; display: inline-block">

 <p>
  <img style="width: 300px" src="https://user-images.githubusercontent.com/101318878/207604508-8caed4ec-ac52-4526-9ee6-25015ad527d5.png"><em>electron app, Ios-clock, example snapshot</em>
 </p>
</div>


### user parameters

- width (default: '100%')
  
  * width of the component
  * example : ```width='100%'```

- height: (default: '100%')

  * height of the component. 
  * example : ```height='100%'```

- num-list (default: [10])

  * insert number many as you want.
  * example : ```num-list="24,60,60"```

- title-list (default: [])

  * example : ```title-list="시간,분,초"```

- picker-type-list (default: "end")

  * define each picker's style ('end' | 'endless')
  * example : ```picker-type-list="end,end,end"```

    if you define style only one, then it will unify all pickers
    ```html
      <ios-ui-picker
        num-list="24,60,60"  
        picker-type-list="end"
      ></ios-ui-picker>
    ```

- flexible (default: false)

  * if true, picker size will change if window resized
  * example : ```flexible="true"```

- allow-key-event (default: false)

  * if true, user can choose number by pressing keyboard
  * example : ```allow-key-event="false"```

- event-name (default: setnumber)

  * the component fire its result numbers by Element.dispatchEvent() and its event name is 'setnumber' as default.

    if you want to change it, insert to this parameter

  * example : ```event-name='result'```

- sound-src (default: "https://unpkg.com/ios-ui/dist/bundle.js")

  * if true, picker will make sound
  * example: ```sound-src="/public/mp3/example.mp3""```

### caution

* All parameters are should be a **string** since the custom component get these params by Element.getAttributes() function.


### guide
1. In browser

```js
UI.Picker.config('picker')
```

2. In node environment

```js
import { Picker } from 'ios-ui';

// put this line somewhere in your codes
Picker.config('picker');

// and use it like using custom web component

  <div>
    <ios-ui-picker></ios-ui-picker>
  </div>
```

  * if you turn off flag in option, you can define component with only your tag name

  ```js
  new Picker().config("web-picker", { flag: false });
  ```
  
  ```html
  <web-picker></web-picker>
  ```

### examples

```html
<ios-ui-picker
  width="600px"
  height="400px"
  num-list="10"
  title-list="hour"
  picker-type-list="end"
  flexible="true"
  allow-key-event="false"
></ios-ui-picker>
```

* [event-name](#event-name) example

```html
<ios-ui-picker
  event-name="getnumber"
></ios-ui-picker>
```

```js
  /**
   * @param {CustomEvent<Array<number>>} e
   */
  element.addEventListener('getnumber', ({detail}) => console.log(detail));
  // if num-list length is 3 -> [0, 0, 0]
```
