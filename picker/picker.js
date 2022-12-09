// @ts-check
import { IPHONE_PPI_WIDTH, MAX_FONT_SIZE, errorHTML } from "./ios.js";
import { range } from "./utils.js";

const styles = `
  /* reset css */
  * {
    padding: 0;
    margin: 0;
    box-sizing: border-box;
  }

  li {
    display: block;
  }

  #root {
    background-color: #000;

    padding: 0 20px;
  }

  .picker-container {
    position: relative;
    color: #fff;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .center {
    position: absolute;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    width: 100%;
    height: fit-content;
    display: flex;
    padding: 0.35em 0;
    perspective: 1000px;
    background-color: rgba(255, 255, 255, .15);
    border-radius: 10px;
  }
  .center:before {
    content: '';
    height: 1em;
    width: 100%;
  }
  .picker {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    top: 0;
    width: 1em;
    height: 100%;
    transform-style: preserve-3d;
    transition: ease 300ms box-shadow;

    overflow-y: hidden;
  }
  .picker:focus {
    box-shadow: inset 0px 0px 0px 2px #e3e3e3;
    outline: none;
  }
  .picker .space {
    height: calc(50% - .5em);
  }
  .picker .title {
    transform: translateX(-.4em);
    font-size: 0.55em;
    
    word-break: keep-all;
  }
  .num-list {
    cursor: pointer;
    height: 100%;
    /*overflow-y: scroll;
    overflow-x: hidden;*/
    padding:0 0.5em;
    -ms-overflow-style: none;  /* Internet Explorer 10+ */
    scrollbar-width: none;  /* Firefox */

    position: relative;
  }
  .num-list::-webkit-scrollbar { 
    display: none;  /* Safari and Chrome */
  }
  .num-list li {
    width: 1em;
    height: 1em;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .num-list li {
    margin-bottom: 1em;
  }
  .num-list li:last-of-type {
    margin-bottom: 0;
  }
  .num-list li span {
    line-height: 1em;
    padding: 1em;
  }
`;

/**
 * # LifeCycle
 *
 * constructor
 *     ↓
 * connectedCallback
 *     ↓
 * disconnectedCallback
 */
export class Picker extends HTMLElement {
  /**
   * @typedef {Object} UserSettings
   * @property {string} width
   * @property {string} height
   * @property {Array<number>} num-list
   * @property {Array<string>} title-list
   * @property {"end" | "endless"} picker-type
   * @property {boolean} flexible
   * @property {number} acc
   * @property {boolean} allow-key-event
   * @property {boolean} sound
   * @property {string} event-name
   */
  /**
   * @type {UserSettings}
   */
  userSettings = {
    width: "100%",
    height: "100%",
    "num-list": [10],
    "title-list": [],
    "picker-type": "end",
    flexible: false,
    acc: 0.18,
    "allow-key-event": false,
    sound: true,
    "event-name": "setnumber",
  };

  /**
   * @type {{"root": HTMLElement, "picker-container": HTMLElement, center: HTMLElement, "all-nums": Array<HTMLElement>, "all-picker": Array<HTMLElement>}}
   */
  // @ts-ignore
  elems = {};

  /**
   * @typedef {Object} Info
   * @property {boolean} isEntered
   * @property {number} top
   */

  /**
   * @type {Array<Array<Info>>}
   * @description the array initialize at {@link syncCoor}
   *  ,and {@link Info} data will be changed at ${@link setObservers}
   */
  numCoorPerPicker = [];

  /**
   * @typedef {Object} CoorInfo
   * @property {number} y
   * @property {number} dest
   * @property {number} upperBound
   * @property {number} lowerBound
   * @property {number} idealDest
   * @property {number} numGap
   */
  /**
   * @type {Array<CoorInfo>}
   */
  pickerCoor = [];

  /**
   * @type {DOMRect}
   * @description the variable assigned at {@link syncCoor}
   */
  pickerContainerCoor;

  /**
   * @type {{ mousedownY: number, pressedPickerIdx: number}}
   */
  mouseCoor = {
    mousedownY: -1,
    pressedPickerIdx: -1,
  };

  /**
   * @type {{cnt:number, shouldFireResult: boolean, result: Array<number>, bounceLength: number, animating: boolean}}
   * @description you can find codes for 'hasFiredResult' only in {@link animation}
   *  ,and you can find assigning value cods for 'result' at {@link setObservers} and
   *  can find initializing codes at {@link syncAttributes}
   */
  main = {
    cnt: 0,
    shouldFireResult: false,
    result: [],
    bounceLength: 0,
    animating: false,
  };

  /**
   * @type {number}
   * @description float number that help js won't calculate too deeply from {@link drawPicker}
   *  which has {@link reqestAnimationFrame}
   */
  animFloat = 0.1;

  /**
   *
   * @returns {{ canRun: boolean, msg?: string }}
   */
  syncAttributes() {
    const userWidth = this.getAttribute("width");
    const userHeight = this.getAttribute("height");
    const userAcc = this.getAttribute("acc");
    const userNumList = this.getAttribute("num-list");
    const userTitleList = this.getAttribute("title-list");
    const userFlexible = this.getAttribute("flexible");
    const userPickerType = this.getAttribute("picker-type");
    const userAllowKeyEvent = this.getAttribute("allow-key-event");
    const userSound = this.getAttribute("sound");
    const userEventName = this.getAttribute("event-name");

    try {
      if (userWidth) {
        this.userSettings.width = userWidth;
      }

      if (userHeight) {
        this.userSettings.height = userHeight;
      }

      if (userAcc) {
        const acc = parseFloat(userAcc);

        if (Number.isNaN(acc) || acc === 0)
          throw new Error("unvalid acc input");

        this.userSettings.acc = acc;
      }

      if (userNumList) {
        this.userSettings["num-list"] = userNumList.split(",").map((v) => {
          const n = parseInt(v);
          if (Number.isNaN(n) || n === 0.0)
            throw new Error("unvalid num list input");

          return n;
        });

        this.main.cnt = this.userSettings["num-list"].length;
        this.main.result = range(this.main.cnt).map(() => 0);
      }

      if (userTitleList) {
        this.userSettings["title-list"] = userTitleList.split(",");
      }

      if (userFlexible) {
        this.userSettings.flexible = userFlexible === "true";
      }

      if (userPickerType) {
        if (userPickerType === "end" || userPickerType === "endless") {
          this.userSettings["picker-type"] = userPickerType;
        } else throw new Error("unvalid picker type");
      }

      if (userAllowKeyEvent) {
        this.userSettings["allow-key-event"] = userAllowKeyEvent === "true";
      }

      if (userSound) {
        this.userSettings.sound = userSound === "true";
      }

      if (userEventName) {
        this.userSettings["event-name"] = userEventName;
      }

      if (
        this.userSettings["num-list"].length <
        this.userSettings["title-list"].length
      ) {
        throw new Error("titles cannot be more exists than numbers");
      } else {
        while (
          this.userSettings["num-list"].length >
          this.userSettings["title-list"].length
        ) {
          this.userSettings["title-list"].push("");
        }
      }
    } catch (error) {
      return { canRun: false, msg: error };
    }

    return { canRun: true };
  }

  /**
   *
   * @param {CoorInfo} coor
   * @param {number} pickerIdx
   */
  setIdealDestWhenStop(coor, pickerIdx) {
    if (this.main.animating) return;

    /**
     * set number's postions to ideal location,
     * the ideal position set from {@link setObservers}
     */
    if (
      coor.y === coor.dest &&
      this.pickerCoor[pickerIdx].idealDest !== coor.dest
    ) {
      coor.dest = this.pickerCoor[pickerIdx].idealDest;
    }
  }
  /**
   *
   * @param {Element} pickerElem
   * @param {number} pickerIdx
   */
  drawPicker(pickerElem, pickerIdx) {
    const coor = this.pickerCoor[pickerIdx];
    const dis = Math.abs(coor.dest - coor.y);
    const d = dis > 2 ? dis * this.userSettings.acc : dis;

    if (coor.dest > coor.y) {
      /**
       * [go down]
       * ----y----
       *     ↓
       * ---dest--
       */
      if (coor.y + this.animFloat > coor.dest) {
        coor.y = coor.dest;
      } else {
        coor.y += d;
      }
    } else if (coor.dest < coor.y) {
      /**
       * [go up]
       * ---dest--
       *     ↑
       * ----y----
       */
      if (coor.y - this.animFloat < coor.dest) {
        coor.y = coor.dest;
      } else {
        coor.y -= d;
      }
    }

    /**
     * Since picker should fix his position, numbers will be
     *  moved by transforming ul tag which is the parent of numbers
     * see {@link render}
     * <div>
     *
     * </div>
     */
    // @ts-ignore
    pickerElem.querySelector(".num-list").style.top = `${-coor.y}px`;

    [...pickerElem.querySelectorAll("li.num")].forEach((numElem, numIdx) => {
      this.drawNum(numElem, pickerIdx, numIdx);
    });
  }

  /**
   * @param {Element} numElem
   * @param {number} pickerIdx
   * @param {number} numIdx
   */
  drawNum(numElem, pickerIdx, numIdx) {
    const span = numElem.children[0];
    if (this.numCoorPerPicker[pickerIdx][numIdx].isEntered) {
      // @ts-ignore
      span.style.display = "block";

      // -------------------- setting opacity, rotateX&Y --------------------
      const numCoor = numElem.getBoundingClientRect();
      /**
       * -----------picker-container-----------
       *                  │
       *      numTop  ----│-----
       *              │   ↓    │
       *              │ center │
       *              │        │
       *              ----------
       */
      const numTopFromCenter = numCoor.top + numCoor.height / 2;
      const percentage =
        (numTopFromCenter - this.pickerContainerCoor.top) /
        this.elems["picker-container"].offsetHeight;

      /**
       * 8 is important constant
       */
      const zConstant = this.elems["picker-container"].offsetHeight / 7;
      const Zpx = zConstant * ((percentage - 0.5) / 0.5);

      let Xdeg = 0;
      let opacity = 1;

      const centerIdx = this.elems["all-picker"].length / 2;

      let Ydeg = 7 * (centerIdx - pickerIdx) * ((percentage - 0.5) / 0.5);

      let Zdeg = 7 * (centerIdx - pickerIdx) * ((percentage - 0.5) / 0.5);

      if (0.0 <= percentage && percentage < 0.5) {
        // 0.0 ~ 0.5 -> 90 * (1 -> 0)
        Xdeg = 60 * ((percentage - 0.5) / 0.5);
        opacity = percentage / 0.5;
      } else {
        // 0.5 ~ 1.0 -> -90 * (0 -> 1)
        Xdeg = -60 * ((percentage - 0.5) / 0.5);
        opacity = 1 - (percentage - 0.5) / 0.5;
      }
      // -------------------------------------------------------------------

      // @ts-ignore
      span.style.opacity = opacity;
      // @ts-ignore
      span.style.transform = `rotateX(${-Xdeg}deg) rotateY(${Ydeg}deg) rotateZ(${-Zdeg}deg) translateZ(${Zpx}px)`;
    } else {
      // @ts-ignore
      span.style.display = "none";
    }
  }

  isDrawingStop() {
    if (this.pickerCoor.every((coor) => coor.dest === coor.y)) {
      this.main.animating = false;
    } else {
      this.main.animating = true;
    }
  }
  isPickerLocateAtIdealDest() {
    return this.pickerCoor.every((coor) => coor.y === coor.idealDest);
  }


  animation() {
    requestAnimationFrame(this.animation.bind(this));

    this.isDrawingStop();

    this.elems["all-picker"].forEach((pickerElem, pickerIdx) => {
      const coor = this.pickerCoor[pickerIdx];

      if (!this.main.animating && this.mouseCoor.pressedPickerIdx === -1) this.setIdealDestWhenStop(coor, pickerIdx);

      this.drawPicker(pickerElem, pickerIdx);
    });

    if (this.main.animating || this.isResizing) {
      this.main.shouldFireResult = false;
      return;
    }

    if (
      !this.main.animating &&
      this.isPickerLocateAtIdealDest() &&
      !this.main.shouldFireResult
    ) {
      this.dispatchEvent(
        new CustomEvent(this.userSettings["event-name"], {
          detail: this.main.result,
          bubbles: true,
        })
      );

      this.main.shouldFireResult = true;
    }
  }

  constructor() {
    super();

    // 1. attach shadow
    this.attachShadow({ mode: "open" });

    // 2. sync attributes from user's inputs
    const { canRun, msg } = this.syncAttributes();

    // 3. start animation
    if (canRun) requestAnimationFrame(this.animation.bind(this));
    // @ts-ignore
    else this.render = () => (this.shadowRoot.innerHTML = errorHTML(msg));
  }

  render() {
    if (!this.shadowRoot) return;

    const spaceOrNot = this.userSettings["picker-type"] === 'end' ? `<div class="space"></div>`: '';

    const pickersHTML = `
        ${range(this.main.cnt)
          .map(
            (pickerIdx) => `
            <div class="picker" tabIndex=0>

              <ul class="num-list idx-${pickerIdx}">
                ${spaceOrNot}
                ${range(this.userSettings["num-list"][pickerIdx])
                  .map(
                    (numIdx) => `
                  <li 
                    class="num idx-${pickerIdx}-${numIdx}"
                    ><span>${numIdx}</span>
                  </li>
                `
                  )
                  .join("")}
                ${spaceOrNot}
              </ul>

              ${
                this.userSettings["title-list"].length > 0
                  ? `<div class="title">
                      ${this.userSettings["title-list"][pickerIdx]}
                    </div>`
                  : ""
              }

            </div>
          `
          )
          .join("")}`;

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>

      <section id="root">
        <div class="picker-container">
          
          <div class="center"></div>

          ${pickersHTML}
        </div>
      </section>
    `;
  }

  syncElements() {
    // @ts-ignore
    this.elems.root = this.shadowRoot?.getElementById("root");

    // @ts-ignore
    this.elems["picker-container"] =
      this.shadowRoot?.querySelector(".picker-container");

    // @ts-ignore
    this.elems.center = this.shadowRoot?.querySelector(".center");

    this.elems["all-picker"] = [
      // @ts-ignore
      ...this.shadowRoot?.querySelectorAll(".picker"),
    ];

    this.elems["all-nums"] = [
      // @ts-ignore
      ...this.shadowRoot?.querySelectorAll(".num-list .num"),
    ];
  }

  /**
   * set static styles
   */
  setStyles() {
    this.elems["root"].style.width = this.userSettings.width;
    this.elems["root"].style.height = this.userSettings.height;

    const rootWidth = this.elems["root"].offsetWidth;
    /**
     * How to calculate font size
     *
     * root width : 270.719 = font-size : 20
     * ideal cnt was 3
     */
    let fontSize = (rootWidth * 60) / IPHONE_PPI_WIDTH / this.main.cnt;

    fontSize = fontSize > MAX_FONT_SIZE ? MAX_FONT_SIZE : fontSize;

    this.elems["picker-container"].style.fontSize = `${fontSize}px`;
  }

  BOUNCE_LENGHT = 0;

  syncCoor() {
    // prettier-ignore
    this.pickerContainerCoor = this.elems["picker-container"]
      .getBoundingClientRect();

    // @ts-ignore
    const spaceHeight = this.elems.root.querySelector(".space").offsetHeight;

    this.numCoorPerPicker = [];

    this.elems["all-picker"].forEach((pickerElem, pickerIdx) => {
      this.numCoorPerPicker.push([]);

      const numsFromPicker = [...pickerElem.querySelectorAll("li.num")];

      numsFromPicker.forEach((numElem) => {
        this.numCoorPerPicker[pickerIdx].push({
          isEntered: false,
          // @ts-ignore
          top: numElem.offsetTop - spaceHeight,
        });
      });

      let numGap = 0;
      
      if (numsFromPicker.length > 1) {
        // @ts-ignore
        numGap = numsFromPicker[1].offsetTop - numsFromPicker[0].offsetTop;
      }

      const numsLength = numsFromPicker.length;

      this.pickerCoor.push({
        y: 0,
        dest: 0,
        upperBound: 0,
        // @ts-ignore
        lowerBound: this.numCoorPerPicker[pickerIdx][numsLength - 1].top,
        idealDest: this.numCoorPerPicker[pickerIdx][0].top,
        numGap,
      });
    });
  }

  ioForCurvingNums = new IntersectionObserver(() => {});
  /**
   * @type {Array<IntersectionObserver>}
   */
  ioForSetDest = [];

  setObservers() {
    this.ioForCurvingNums.disconnect();
    this.ioForSetDest.forEach((io) => io.disconnect());

    this.ioForCurvingNums = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          const data = entry.target.classList.item(1)?.split("-");
          // @ts-ignore
          const pickerIdx = parseInt(data[1]);
          // @ts-ignore
          const numIdx = parseInt(data[2]);

          if (entry.isIntersecting) {
            this.numCoorPerPicker[pickerIdx][numIdx].isEntered = true;
          } else {
            this.numCoorPerPicker[pickerIdx][numIdx].isEntered = false;
          }
        }),
      {
        threshold: 0.1,
        root: this.elems["picker-container"],
      }
    );

    this.elems["all-nums"].forEach((elem) =>
      this.ioForCurvingNums.observe(elem)
    );

    /**
     * Since center is **absolute positioned element**, its offsetTop is not accurate
     */
    const centerOffsetTop =
      this.elems.center.offsetTop - this.elems.center.offsetHeight / 2;
    // @ts-ignore
    this.elems["all-picker"].forEach((pickerElem, pickerIdx) => {
      this.ioForSetDest.push(
        new IntersectionObserver(
          (entries) =>
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const data = entry.target.classList.item(1)?.split("-");
                // @ts-ignore
                const pickerIdx = parseInt(data[1]);
                // @ts-ignore
                const numIdx = parseInt(data[2]);

                this.pickerCoor[pickerIdx].idealDest =
                  this.numCoorPerPicker[pickerIdx][numIdx].top;

                this.main.result[pickerIdx] = numIdx;

                try {
                  if (this.userSettings.sound) {
                    new Audio("../assets/ios-tik.mp3").play();
                  }
                } catch (err) {
                  console.log(err);
                }
              }
            }),
          {
            threshold: 0.5,
            root: pickerElem,
            rootMargin: `-${centerOffsetTop}px 0px`,
          }
        )
      );

      pickerElem
        .querySelectorAll("li.num")
        .forEach((e) => this.ioForSetDest[pickerIdx].observe(e));
    });
  }

  /**
   * @param {number} pickerIdx
   * @param {number} dis
   * @param {'add' | 'sub'} method
   */
  addDistanceForDestination(pickerIdx, dis, method) {
    const BOUNCE_LENGTH = this.elems["picker-container"].offsetHeight / 3;

    switch (method) {
      // go down ↓
      case "add":
        if (
          this.pickerCoor[pickerIdx].dest + dis >
          this.pickerCoor[pickerIdx].lowerBound + BOUNCE_LENGTH
        ) {
          this.pickerCoor[pickerIdx].dest =
            this.pickerCoor[pickerIdx].lowerBound;
        } else {
          this.pickerCoor[pickerIdx].dest += dis;
        }
        break;
      // go up ↑
      case "sub":
        if (
          this.pickerCoor[pickerIdx].dest - dis <
          this.pickerCoor[pickerIdx].upperBound - BOUNCE_LENGTH
        ) {
          this.pickerCoor[pickerIdx].dest =
            this.pickerCoor[pickerIdx].upperBound;
        } else {
          this.pickerCoor[pickerIdx].dest -= dis;
        }
        break;
    }
  }

  focusedPickerIdx = -1;

  keyListener = {
    /**
     * @param {KeyboardEvent} e
     */
    keydown: (e) => {
      if (this.focusedPickerIdx === -1) {
        switch (e.code) {
          case "ArrowUp":
          case "ArrowDown":
          case "ArrowLeft":
            this.elems["all-picker"][this.main.cnt - 1].focus();
            break;
          case "ArrowRight":
            this.elems["all-picker"][0].focus();
        }
        return;
      }

      const gap = this.pickerCoor[this.focusedPickerIdx].numGap;

      if (e.code === "ArrowUp") {
        this.addDistanceForDestination(this.focusedPickerIdx, gap, "sub");
      } else if (e.code === "ArrowDown") {
        this.addDistanceForDestination(this.focusedPickerIdx, gap, "add");
      } else if (e.code === "ArrowLeft") {
        if (this.focusedPickerIdx > 0) {
          this.elems["all-picker"][this.focusedPickerIdx - 1].focus();
        } else {
          this.elems["all-picker"][this.focusedPickerIdx].blur();
        }
      } else if (e.code === "ArrowRight") {
        if (this.focusedPickerIdx < this.main.cnt - 1) {
          this.elems["all-picker"][this.focusedPickerIdx + 1].focus();
        } else {
          this.elems["all-picker"][this.focusedPickerIdx].blur();
        }
      }
    },
    keyup: () => {},
  };

  /**
   * this listener is for key board event, check {@link keyListener}
   */
  attachFocusEventListenerForPicker() {
    this.elems["all-picker"].forEach((pickerElem, pickerIdx) => {
      pickerElem.addEventListener("focusin", () => {
        this.focusedPickerIdx = pickerIdx;
      });

      pickerElem.addEventListener("focusout", () => {
        this.focusedPickerIdx = -1;
      });
    });
  }

  mouseListener = {
    /**
     * @param {MouseEvent} e
     */
    mousedown: (e) => {
      const target = e.composedPath().find((elem) => {
        // @ts-ignore
        if (!elem.tagName) return false;
        // @ts-ignore
        if (elem.classList.contains("num-list")) return true;
      });
      // @ts-ignore
      if (!target) return;
      // @ts-ignore
      const info = target.classList.item(1).split("-");
      const pickerIdx = parseInt(info[1]);

      this.mouseCoor.mousedownY = e.y;
      this.mouseCoor.pressedPickerIdx = pickerIdx;
    },
    /**
     * @param {MouseEvent} e
     */
    mousemove: (e) => {
      if (this.mouseCoor.mousedownY === -1) return;

      const dir = e.y - this.mouseCoor.mousedownY;

      let dis = Math.abs(e.y - this.mouseCoor.mousedownY);

      if (dir > 0) {
        // down
        this.addDistanceForDestination(
          this.mouseCoor.pressedPickerIdx,
          dis,
          "add"
        );
      } else {
        // up
        this.addDistanceForDestination(
          this.mouseCoor.pressedPickerIdx,
          dis,
          "sub"
        );
      }
      this.mouseCoor.mousedownY = e.y;
    },
    mouseup: () => {
      this.mouseCoor.pressedPickerIdx = -1;
      this.mouseCoor.mousedownY = -1;
    },
    // if mouse leave window, isPressed should set to be false
    mouseleave: () => {
      this.mouseCoor.mousedownY = -1;
    },
  };

  /**
   * @param {WheelEvent} e
   * @param {number} pickerIdx
   */
  wheelListener(e, pickerIdx) {
    this.addDistanceForDestination(
      pickerIdx,
      Math.abs(e.deltaY),
      e.deltaY > 0 ? "add" : "sub"
    );
  }

  attachWheelEventListenerForPicker() {
    this.elems["all-picker"].forEach((pickerElem, pickerIdx) => {
      const numListElem = pickerElem.querySelector(".num-list");

      numListElem?.addEventListener(
        "wheel",
        // @ts-ignore
        (e) => this.wheelListener(e, pickerIdx),
        false
      );
    });
  }

  syncWhenResizeEnd() {
    this.setStyles();
    this.syncCoor();
    this.setObservers();

    this.isResizing = false;
  }
  resizeStId = -1;
  isResizing = false;

  async resizeListener() {
    this.isResizing = true;
    clearTimeout(this.resizeStId);
    this.resizeStId = setTimeout(this.syncWhenResizeEnd.bind(this), 100);
  }

  connectedCallback() {
    this.render();

    this.syncElements();

    this.syncWhenResizeEnd();

    this.attachWheelEventListenerForPicker();

    // mouse events for window
    Object.keys(this.mouseListener).forEach((event) => {
      window.addEventListener(event, this.mouseListener[event].bind(this));
    });
    document.onmouseleave = this.mouseListener.mouseleave;

    // key event for window and picker
    if (this.userSettings["allow-key-event"]) {
      this.attachFocusEventListenerForPicker();

      Object.keys(this.keyListener).forEach((event) => {
        window.addEventListener(event, this.keyListener[event].bind(this));
      }, false);
    }

    if (this.userSettings.flexible) {
      window.addEventListener("resize", this.resizeListener.bind(this));
    }

    /**
     * disable darg and if some picker had focused, will be disappear if user click other area
     */
    this.elems.root.onmousedown = () => {
      this.elems["all-picker"].forEach((e) => e.blur());

      return false;
    };
  }

  disconnectedCallback() {
    Object.keys(this.mouseListener).forEach((event) => {
      window.removeEventListener(event, this.mouseListener[event].bind(this));
    });
    document.removeEventListener("mouseleave", this.mouseListener.mouseleave);

    if (this.userSettings["allow-key-event"]) {
      Object.keys(this.keyListener).forEach((event) => {
        window.removeEventListener(event, this.keyListener[event].bind(this));
      });
    }

    if (this.userSettings.flexible) {
      window.removeEventListener("resize", this.resizeListener.bind(this));
    }
  }
}
