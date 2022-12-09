# ios-ui

1. width, height, acc attr 추가 (O)

2. endless style 구현

3. scroll event 구현 (O)

4. giving opportunity nameing for the event to user

5. keydown event 구현 (O)

6. npm 배포

## user parameters

### width

* example : ```width='100%'```

### height

* example : ```height='100%'```

### num-list

* example : ```num-list="24,60,60"```

### title-list

* example : ```title-list="시간,분,초"```

### picker-type

* example : ```picker-type="end"```

### flexible

* example : ```flexible="true"```

### allow-key-event

* example : ```allow-key-event="false"```

### event-name

* example : ```event-name```

## caution

* all parameters should typed with string since this module created pure html and javscript.

* Width and height is recommended to default, "100%"


## getting result

event name : set

## example

1. Firstly, define component somewhere of your code

```js
import App from "ios-ui/picker";

new App().config("picker");
```

2. Then, you can add it to your code freely!

```html
<ios-ui-picker></ios-ui-picker>
```

if you turn of flag in option, you can define component with only your tag name

```js
new App().config("web-picker", { flag: false });
```

```html
<web-picker></web-picker>
```

3. You can add settings inside the tag

```html
<ios-ui-picker
  width="600px"
  height="400px"
  num-list="10"
  title-list="hour"
  picker-type="end"
  flexible="true"
  allow-key-event="false"
></ios-ui-picker>
```

## attributes examples

1. [event-name](#event-name)

```html
<ios-ui-picker
  event-name="getnumber"
></ios-ui-picker>
```

```js
  /**
   * @param {CustomEvent<Array<number>>} e
   */
  element.addEventListener('setnumber', ({detail}) => console.log(detail));
  // if num-list length is 3 -> [0, 0, 0]
```