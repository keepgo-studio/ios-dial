// @ts-check
import { IPHONE_PPI_WIDTH, MAX_FONT_SIZE } from "./ios.js";
import { range } from "./utils.js";

const errorHTML = `
  <div style="background-color: #000; text-align: center">
    <h1 style="
      display:inline-block;
      color: #fff; 
      font-weight: 100; 
      padding: 2rem;
      line-height: 1.6em;
      letter-spacing: -0.03em;
      max-width: 400px;
      ">
      <b>Oops!😢</b> you insert some attributes incorrectly
    </h1>
  </div>
`;

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
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 20px;
  }

  .picker-container {
    position: relative;
    color: #fff;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .center {
    width: 100%;
    height: fit-content;
    display: flex;
    padding: 0.35em 1.5em;
    perspective: 1000px;
    background-color: rgba(255, 255, 255, .15);
    border-radius: 10px;
  }
  .picker {
    position: relative;
    top: 0;
    z-index: 3;
    width: 1em;
    height: 1em;
    transform-style: preserve-3d;
    transition: ease 300ms box-shadow;
  }
  .picker:focus {
    box-shadow: inset 0px 0px 0px 2px #e3e3e3;
    outline: none;
  }
  .picker .title {
    position: absolute;
    font-size: 0.6em;
    top: 50%;
    right: 0;
    word-break: keep-all;
    transform: translateY(-50%);
  }
  .num-list {
    cursor: pointer;
    position: relative;
  }
  .num-list li {
    width: 1em;
    height: 1em;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .num-list li:not(:last-child) {
    margin-bottom: 1em;
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
   */
  /**
   * @type {UserSettings}
   */
  userSettings = {
    width: "100%",
    height: "50%",
    "num-list": [10],
    "title-list": [],
    "picker-type": "end",
    flexible: false,
    acc: 0.18,
    "allow-key-event": false,
    sound: true,
  };

  /**
   * @type {{"root": HTMLElement, "picker-container": HTMLElement, "all-nums": Array<HTMLElement>, "all-picker": Array<HTMLElement>}}
   */
  // @ts-ignore
  elems = {};

  /**
   * @typedef {Object} Info
   * @property {boolean} isEntered
   * @property {number} offsetTop
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
   * @typedef {"UP" | "DOWN"} MouseDirection
   */
  /**
   * @type {{ y: number, isPressed: boolean, pressedPickerIdx: number, enteredPickerIdx: number}}
   */
  mouseCoor = {
    y: 0,
    isPressed: false,
    pressedPickerIdx: 0,
    enteredPickerIdx: 0,
  };

  keyCoor = {
    focusedPickerIdx: -1,
  };

  /**
   * @type {{cnt:number, hasFiredResult: boolean, result: Array<number>}}
   * @description you can find codes for 'hasFiredResult' only in {@link animation}
   *  ,and you can find assigning value cods for 'result' at {@link setObservers} and
   *  can find initializing codes at {@link syncAttributes}
   */
  main = {
    cnt: 0,
    hasFiredResult: false,
    result: [],
  };

  /**
   * @type {number}
   * @description float number that help js won't calculate too deeply from {@link drawPicker}
   *  which has {@link reqestAnimationFrame}
   */
  animFloat = 0.1;

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

      if (
        this.userSettings["num-list"].length <
        this.userSettings["title-list"].length
      ) {
        throw new Error("titles cannot be exist more than numbers");
      } else {
        while (
          this.userSettings["num-list"].length >
          this.userSettings["title-list"].length
        ) {
          this.userSettings["title-list"].push("");
        }
      }
    } catch (error) {
      console.error(error);

      return false;
    }

    return true;
  }

  /**
   *
   * @param {CoorInfo} coor
   * @param {number} pickerIdx
   */
  setDestWhenStop(coor, pickerIdx) {
    if (this.mouseCoor.isPressed) return;

    // set number's postions to ideal location
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

    this.setDestWhenStop(coor, pickerIdx);

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
    pickerElem.querySelector(".num-list").style.top = `${coor.y}px`;

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

      const centerIdx = Math.floor(this.elems["all-picker"].length / 2);

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
    return this.pickerCoor.every((coor) => coor.dest === coor.y);
  }

  animation() {
    requestAnimationFrame(this.animation.bind(this));

    if (this.mouseCoor.isPressed || this.isResizing) {
      this.main.hasFiredResult = false;
      return;
    }

    this.elems["all-picker"].forEach((pickerElem, pickerIdx) => {
      this.drawPicker(pickerElem, pickerIdx);
    });

    if (!this.main.hasFiredResult && this.isDrawingStop()) {
      this.dispatchEvent(
        new CustomEvent("setnumber", {
          detail: {
            data: this.main.result,
          },
          bubbles: true,
        })
      );

      this.main.hasFiredResult = true;
    }
  }

  constructor() {
    super();

    // 1. attach shadow
    this.attachShadow({ mode: "open" });

    // 2. sync attributes from user's inputs
    const shouldStartPicker = this.syncAttributes();

    // 3. start animation
    if (shouldStartPicker) requestAnimationFrame(this.animation.bind(this));
    // @ts-ignore
    else this.render = () => (this.shadowRoot.innerHTML = errorHTML);
  }

  render() {
    if (!this.shadowRoot) return;

    const pickerContainerHTML = `
      <div class="picker-container">
        <div class="center">
        ${range(this.main.cnt)
          .map(
            (pickerIdx) => `
            <div class="picker" tabIndex=0>
              <ul class="num-list idx-${pickerIdx}">
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
              </ul>

              <div class="title">${
                this.userSettings["title-list"][pickerIdx]
              }</div>
            </div>
          `
          )
          .join("")}
        </div>
      </div>
    `
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>

      <section id="root">
        ${pickerContainerHTML}
      </section>
    `;
  }

  syncElements() {
    // @ts-ignore
    this.elems.root = this.shadowRoot?.getElementById("root");

    // @ts-ignore
    this.elems["picker-container"] =
      this.shadowRoot?.querySelector(".picker-container");

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

    let centerStyle = '';
    if (this.main.cnt === 1) {
      centerStyle = 'center';
    } else {
      centerStyle = 'space-between';
    }
    // @ts-ignore
    this.elems["picker-container"].querySelector(".center").style.justifyContent = centerStyle;

    this.elems["all-picker"].forEach((pickerElem) => {
      // @ts-ignore
      const titleElem = pickerElem.querySelector(".title");
      // @ts-ignore
      titleElem.style.right = `${-(titleElem.offsetWidth + fontSize / 8)}px`;
    });
  }

  syncCoor() {
    this.numCoorPerPicker = [];

    this.elems["all-picker"].forEach((pickerElem, pickerIdx) => {
      this.numCoorPerPicker.push([]);

      const numsFromPicker = [...pickerElem.querySelectorAll("li.num")];

      numsFromPicker.forEach((numElem) => {
        this.numCoorPerPicker[pickerIdx].push({
          isEntered: false,
          // @ts-ignore
          offsetTop: -numElem.offsetTop,
        });
      });

      let numGap = 0;
      if (numsFromPicker.length > 1) {
        // @ts-ignore
        numGap = numsFromPicker[1].offsetTop - numsFromPicker[0].offsetTop;
      }

      this.pickerCoor.push({
        y: 0,
        dest: 0,
        upperBound: 0,
        // @ts-ignore
        lowerBound: -numsFromPicker[numsFromPicker.length - 1].offsetTop,
        idealDest: 0,
        numGap,
      });
    });

    this.pickerContainerCoor =
      this.elems["picker-container"].getBoundingClientRect();
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
                  this.numCoorPerPicker[pickerIdx][numIdx].offsetTop;

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
    const maxDis = this.elems["picker-container"].offsetHeight / 6;

    switch (method) {
      case "add":
        if (
          this.pickerCoor[pickerIdx].dest + dis >
          this.pickerCoor[pickerIdx].upperBound + maxDis
        ) {
          this.pickerCoor[pickerIdx].dest =
            this.pickerCoor[pickerIdx].upperBound + maxDis;
        } else {
          this.pickerCoor[pickerIdx].dest += dis;
        }
        break;
      case "sub":
        if (
          this.pickerCoor[pickerIdx].dest - dis <
          this.pickerCoor[pickerIdx].lowerBound - maxDis
        ) {
          this.pickerCoor[pickerIdx].dest =
            this.pickerCoor[pickerIdx].lowerBound - maxDis;
        } else {
          this.pickerCoor[pickerIdx].dest -= dis;
        }
        break;
    }
  }

  keyListener = {
    /**
     * @param {KeyboardEvent} e
     */
    keydown: (e) => {
      if (this.keyCoor.focusedPickerIdx === -1) {
        switch (e.code) {
          case "ArrowUp":
          case "ArrowDown":
          case "ArrowLeft":
          case "ArrowRight":
            this.elems["all-picker"][0].focus();
        }
        return;
      }

      const gap = this.pickerCoor[this.keyCoor.focusedPickerIdx].numGap;

      if (e.code === "ArrowUp") {
        this.addDistanceForDestination(
          this.keyCoor.focusedPickerIdx,
          gap,
          "sub"
        );
      } else if (e.code === "ArrowDown") {
        this.addDistanceForDestination(
          this.keyCoor.focusedPickerIdx,
          gap,
          "add"
        );
      } else if (e.code === "ArrowLeft") {
        if (this.keyCoor.focusedPickerIdx > 0) {
          this.elems["all-picker"][this.keyCoor.focusedPickerIdx - 1].focus();
        } else {
          this.elems["all-picker"][this.keyCoor.focusedPickerIdx].blur();
        }
      } else if (e.code === "ArrowRight") {
        if (this.keyCoor.focusedPickerIdx < this.main.cnt - 1) {
          this.elems["all-picker"][this.keyCoor.focusedPickerIdx + 1].focus();
        } else {
          this.elems["all-picker"][this.keyCoor.focusedPickerIdx].blur();
        }
      }
    },
    keyup: () => {},
  };

  attachFocusEventListener() {
    this.elems["all-picker"].forEach((pickerElem, pickerIdx) => {
      pickerElem.addEventListener("focusin", () => {
        this.keyCoor.focusedPickerIdx = pickerIdx;
      });

      pickerElem.addEventListener("focusout", () => {
        this.keyCoor.focusedPickerIdx = -1;
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

      this.mouseCoor.y = e.y;
      this.mouseCoor.isPressed = true;
      this.mouseCoor.pressedPickerIdx = pickerIdx;
    },
    /**
     * @param {MouseEvent} e
     */
    mousemove: (e) => {
      if (!this.mouseCoor.isPressed) return;

      const dir = e.y - this.mouseCoor.y;

      let dis = Math.abs(e.y - this.mouseCoor.y);

      /**
       * when user scroll rapidly, the picker will move to pickers' bound ASAP
       */
      if (dis > window.innerWidth / 4) {
        dis = -this.pickerCoor[this.mouseCoor.pressedPickerIdx].lowerBound;
      } else if (dis > window.innerWidth / 6) {
        dis = -this.pickerCoor[this.mouseCoor.pressedPickerIdx].lowerBound / 2;
      }

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
      this.mouseCoor.y = e.y;

      this.drawPicker(
        this.elems["all-picker"][this.mouseCoor.pressedPickerIdx],
        this.mouseCoor.pressedPickerIdx
      );
    },
    /**
     * @param {MouseEvent} e
     */
    // @ts-ignore
    mouseup: (e) => {
      this.mouseCoor.isPressed = false;
    },
    mouseleave: () => {
      this.mouseCoor.isPressed = false;
    },
  };

  syncSettingsDependsOnResize() {
    this.setStyles();
    this.syncCoor();
    this.setObservers();

    this.isResizing = false;
  }

  stId = -1;
  isResizing = false;

  async resizeListener() {
    this.isResizing = true;
    clearTimeout(this.stId);
    this.stId = setTimeout(this.syncSettingsDependsOnResize.bind(this), 100);
  }

  connectedCallback() {
    this.render();

    this.syncElements();

    this.syncSettingsDependsOnResize();

    Object.keys(this.mouseListener).forEach((event) => {
      window.addEventListener(event, this.mouseListener[event].bind(this));
    });
    document.onmouseleave = this.mouseListener.mouseleave;

    if (this.userSettings["allow-key-event"]) {
      this.attachFocusEventListener();

      Object.keys(this.keyListener).forEach((event) => {
        window.addEventListener(event, this.keyListener[event].bind(this));
      });
    }

    if (this.userSettings.flexible) {
      window.addEventListener("resize", this.resizeListener.bind(this));
    }

    /**
     * disable darg and if some picker had focused, will be disappear if user click other area
     */
    this.elems.root.onmousedown = () => {
      const idx = this.keyCoor.focusedPickerIdx;

      if (idx !== -1) {
        this.elems["all-picker"][idx].blur();
      }

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
