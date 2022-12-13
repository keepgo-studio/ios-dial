// @ts-check
import { IPHONE_PPI_WIDTH, MAX_FONT_SIZE, errorHTML } from "./ios";
import { range } from "@src/utils";

import TickMp3 from '@assets/ios-tik.mp3';

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
    overflow: hidden;
  }
  .picker:focus {
    box-shadow: inset 0px 0px 0px 2px #e3e3e3;
    outline: none;
  }
  .space {
    position: absolute;
    top: 0;
    left: 0;
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
    padding:0 0.5em;
    position: relative;
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
   * @property {Array<"end" | "endless">} picker-type-list
   * @property {boolean} flexible
   * @property {number} acc
   * @property {boolean} allow-key-event
   * @property {boolean} sound
   * @property {string} event-name
   */
  /**
   * @type {UserSettings}
   */
  userSettings: UserSettings = {
    width: "100%",
    height: "100%",
    "num-list": [10],
    "title-list": [],
    "picker-type-list": ["end"],
    flexible: false,
    acc: 0.18,
    "allow-key-event": false,
    sound: true,
    "event-name": "setnumber",
  };

  /**
   * @typedef {Object} ElementMap
   * @property {HTMLElement} root
   * @property {HTMLElement} pickerContainer
   * @property {HTMLElement} center
   * @property {HTMLElement} space
   * @property {Array<HTMLElement>} allPickers
   * @property {Array<HTMLElement>} allLi
   */
  /**
   * @type {ElementMap}
   */
  // @ts-ignore
  elems: ElementMap = {};

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
  allNumsCoorPerPicker: Array<Array<Info>> = [];

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
  pickerCoor: Array<CoorInfo> = [];

  /**
   * @type {DOMRect}
   * @description the variable assigned at {@link syncCoor}
   */
  pickerContainerCoor?: DOMRect;

  /**
   * @type {{ mousedownY: number, pressedPickerIdx: number}}
   */
  mouseCoor: { mousedownY: number; pressedPickerIdx: number } = {
    mousedownY: -1,
    pressedPickerIdx: -1,
  };

  /**
   * @type {{cnt:number, shouldFireResult: boolean, result: Array<number>, bounceLength: number, animating: boolean}}
   * @description you can find codes for 'hasFiredResult' only in {@link animation}
   *  ,and you can find assigning value cods for '{@link main.result}' at {@link setObservers} and
   *  can find initializing codes at {@link syncAttributes}
   */
  main: {
    cnt: number;
    shouldFireResult: boolean;
    result: Array<number>;
    bounceLength: number;
    animating: boolean;
  } = {
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
  animFloat: number = 0.1;

  /**
   * @returns {{ canRun: boolean, msg?: string }}
   */
  syncAttributes(): { canRun: boolean; msg?: unknown } {
    const userWidth = this.getAttribute("width");
    const userHeight = this.getAttribute("height");
    const userAcc = this.getAttribute("acc");
    const userNumList = this.getAttribute("num-list");
    const userTitleList = this.getAttribute("title-list");
    const userFlexible = this.getAttribute("flexible");
    const userPickerType = this.getAttribute("picker-type-list");
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
        this.userSettings["title-list"] = userTitleList
          .split(",")
          .map((v) => v.trim());
      }

      if (userFlexible) {
        this.userSettings.flexible = userFlexible === "true";
      }

      if (userPickerType) {
        /**
         * @param {string} v
         * @returns {boolean}
         */
        const checkValid = (v: string): boolean =>
          v === "end" || v === "endless";

        const typeList = userPickerType.split(",");

        // @ts-ignore
        this.userSettings["picker-type-list"] = typeList.map((type) => {
          type = type.trim();

          if (!checkValid(type)) {
            throw new Error(
              'unvalid picker type. (e.g picker-type="end,endless,endless")'
            );
          }

          return type;
        });

        if (this.userSettings["picker-type-list"].length === 1) {
          const unified = this.userSettings["picker-type-list"][0];

          this.userSettings["picker-type-list"] = this.userSettings[
            "num-list"
          ].map(() => unified);
        } else if (
          this.userSettings["picker-type-list"].length <
          this.userSettings["num-list"].length
        ) {
          throw new Error(
            `picker-type-list lenght should correspond with num-list or just only one value\n
            (e.g picker-type-list=\"end,end,end\" | picker-type-list=\"end\")
            `
          );
        }
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
   * @param {Element} pickerElem
   * @param {number} pickerIdx
   */
  drawPicker(pickerElem: Element, pickerIdx: number) {
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

    /**
     * not just nums because if user want to use 'endless' style, then
     *  the picker will have li childs which are have class name 'num' or
     *  'num-clone'
     *
     * For that reason, selector should be li, not li.num
     */

    [...pickerElem.querySelectorAll("li")].forEach((numElem, numIdx) => {
      this.drawNum(numElem, pickerIdx, numIdx);
    });
  }

  /**
   * @param {Element} numElem
   * @param {number} pickerIdx
   * @param {number} numIdx
   */
  drawNum(numElem: Element, pickerIdx: number, numIdx: number) {
    if (this.pickerContainerCoor === undefined) {
      throw new Error("something wrong in browser");
    }
    const span = numElem.children[0];

    if (this.allNumsCoorPerPicker[pickerIdx][numIdx].isEntered) {
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
        this.elems.root.offsetHeight;

      /**
       * 8 is important constant
       */
      const zConstant = this.elems.root.offsetHeight / 7;
      const Zpx = zConstant * ((percentage - 0.5) / 0.5);

      let Xdeg = 0;
      let opacity = 1;

      const centerIdx = this.elems.allPickers.length / 2;

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
  /**
   *
   * @param {CoorInfo} coor
   * @param {number} pickerIdx
   */
  setIdealDestWhenStop(coor: CoorInfo, pickerIdx: number) {
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
  isPickerLocateAtIdealDest() {
    return this.pickerCoor.every((coor) => coor.y === coor.idealDest);
  }

  animation() {
    requestAnimationFrame(this.animation.bind(this));

    this.isDrawingStop();

    this.elems.allPickers.forEach((pickerElem: Element, pickerIdx: number) => {
      const coor = this.pickerCoor[pickerIdx];

      // if mousedown maintating, the picker won't go back to ideal automatically
      if (!this.main.animating && this.mouseCoor.pressedPickerIdx === -1) {
        this.setIdealDestWhenStop(coor, pickerIdx);
      }

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

    /**
     * @param {number} pickerIdx
     * @param {number} baseNumIdx
     * @returns {string}
     */
    const cloneNodesHTML = (pickerIdx: number, baseNumIdx: number): string =>
      this.userSettings["picker-type-list"][pickerIdx] === "end"
        ? ""
        : range(this.userSettings["num-list"][pickerIdx])
            .map(
              (numIdx) =>
                `<li class="num-clone idx-${pickerIdx}-${baseNumIdx + numIdx}">
                  <span>${numIdx}</span>
                </li>`
            )
            .join("");

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>

      <section id="root">
        <div class="picker-container">
          <div class="space"></div>

          <div class="center"></div>
          ${range(this.main.cnt)
            .map(
              (pickerIdx) => `
              <div class="picker" tabIndex=0>

                <ul class="num-list idx-${pickerIdx}">
                  ${cloneNodesHTML(pickerIdx, 0)}

                  ${range(this.userSettings["num-list"][pickerIdx])
                    .map(
                      (numIdx) => `
                    <li class="num idx-${pickerIdx}-${
                        (this.userSettings["picker-type-list"][pickerIdx] ===
                        "end"
                          ? 0
                          : this.userSettings["num-list"][pickerIdx]) + numIdx
                      }"><span>${numIdx}</span>
                    </li>
                  `
                    )
                    .join("")}

                  ${cloneNodesHTML(
                    pickerIdx,
                    this.userSettings["num-list"][pickerIdx] * 2
                  )}
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
            .join("")}

        </div>
      </section>
    `;
  }

  syncElements() {
    // @ts-ignore
    this.elems.root = this.shadowRoot?.getElementById("root");

    // @ts-ignore
    this.elems.pickerContainer =
      this.shadowRoot?.querySelector(".picker-container");

    // @ts-ignore
    this.elems.center = this.shadowRoot?.querySelector(".center");

    // @ts-ignore
    this.elems.space = this.shadowRoot?.querySelector(".space");

    this.elems.allPickers = [
      // @ts-ignore
      ...this.shadowRoot?.querySelectorAll(".picker"),
    ];

    this.elems.allLi = [
      // @ts-ignore
      ...this.shadowRoot?.querySelectorAll(".num-list li"),
    ];
  }

  /**
   * set static styles
   */
  setStyles() {
    this.elems.root.style.width = this.userSettings.width;
    this.elems.root.style.height = this.userSettings.height;

    const rootWidth = this.elems.root.offsetWidth;
    /**
     * How to calculate font size
     *
     * root width : 270.719 = font-size : 20
     * ideal cnt was 3
     */
    let fontSize = (rootWidth * 60) / IPHONE_PPI_WIDTH / this.main.cnt;

    fontSize = fontSize > MAX_FONT_SIZE ? MAX_FONT_SIZE : fontSize;

    this.elems.pickerContainer.style.fontSize = `${fontSize}px`;
  }

  BOUNCE_LENGHT = 0;

  syncCoor() {
    this.pickerCoor = [];
    this.allNumsCoorPerPicker = [];

    // prettier-ignore
    this.pickerContainerCoor = this.elems.pickerContainer
      .getBoundingClientRect();

    // @ts-ignore
    const spaceHeight = this.elems.space.offsetHeight;

    this.elems.allPickers.forEach((pickerElem: Element, pickerIdx: number) => {
      this.allNumsCoorPerPicker.push([]);

      // if picker-type === 'endless', the list contains 'num-clone' class
      const liFromPicker = [...pickerElem.querySelectorAll("li")];

      liFromPicker.forEach((numElem) => {
        this.allNumsCoorPerPicker[pickerIdx].push({
          isEntered: false,
          // @ts-ignore
          top: numElem.offsetTop,
        });
      });

      let numGap = 0;

      if (liFromPicker.length > 1) {
        // @ts-ignore
        numGap =
          this.allNumsCoorPerPicker[pickerIdx][1].top -
          this.allNumsCoorPerPicker[pickerIdx][0].top;
      }

      const numsLength = liFromPicker.length;

      let initY = 0;
      let lowerBound = 0;

      switch (this.userSettings["picker-type-list"][pickerIdx]) {
        case "end":
          initY = this.allNumsCoorPerPicker[pickerIdx][0].top - spaceHeight;
          lowerBound = this.allNumsCoorPerPicker[pickerIdx][numsLength - 1].top;
          break;
        case "endless":
          const numsFromPicker = [...pickerElem.querySelectorAll("li.num")];

          // @ts-ignore
          initY = numsFromPicker[0].offsetTop - spaceHeight;

          // @ts-ignore
          lowerBound = numsFromPicker[numsFromPicker.length - 1].offsetTop;
          break;
      }

      this.pickerCoor.push({
        y: initY,
        dest: initY,
        upperBound: initY,
        // @ts-ignore
        lowerBound,
        idealDest: initY,
        numGap,
      });
    });
  }

  ioForCurvingNums = new IntersectionObserver(() => {});
  /**
   * @type {Array<IntersectionObserver>}
   */
  ioForSetIdealDest: Array<IntersectionObserver> = [];

  /**
   * @type {Array<IntersectionObserver>}
   * @description using only for **endless** picker style
   */
  ioScrollSwitcherPerPicker: Array<IntersectionObserver> = [];

  setObservers() {
    this.ioForCurvingNums.disconnect();
    this.ioForSetIdealDest.forEach((io) => io.disconnect());
    this.ioScrollSwitcherPerPicker.forEach((io) => io.disconnect());

    this.ioForCurvingNums = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          const data = entry.target.classList.item(1)?.split("-");
          // @ts-ignore
          const pickerIdx = parseInt(data[1]);
          // @ts-ignore
          const numIdx = parseInt(data[2]);

          const numCoor = this.allNumsCoorPerPicker[pickerIdx][numIdx];

          if (entry.isIntersecting) {
            numCoor.isEntered = true;
          } else {
            numCoor.isEntered = false;
          }
        }),
      {
        threshold: 0.1,
        root: this.elems.root,
      }
    );

    this.elems.allLi.forEach((elem: Element) =>
      this.ioForCurvingNums.observe(elem)
    );

    /**
     * Since center is **absolute positioned element**, its offsetTop is not accurate
     */
    const centerOffsetTop =
      this.elems.center.offsetTop - this.elems.center.offsetHeight / 2;

    // @ts-ignore
    const spaceHeight = this.elems.space?.offsetHeight;

    // @ts-ignore
    this.elems.allPickers.forEach((pickerElem, pickerIdx) => {
      this.ioForSetIdealDest.push(
        new IntersectionObserver(
          (entries) =>
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const data = entry.target.classList.item(1)?.split("-");
                // @ts-ignore
                const pickerIdx = parseInt(data[1]);
                // @ts-ignore
                const numIdx = parseInt(data[2]);

                const len = this.userSettings["num-list"][pickerIdx];

                this.pickerCoor[pickerIdx].idealDest =
                  this.allNumsCoorPerPicker[pickerIdx][numIdx].top -
                  spaceHeight;

                this.main.result[pickerIdx] = numIdx % len;

                try {
                  if (this.userSettings.sound) {
                    new Audio(TickMp3).play();
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
        .querySelectorAll("li")
        .forEach((e: Element) => this.ioForSetIdealDest[pickerIdx].observe(e));
    });

    this.elems.allPickers.forEach((pickerElem: Element, pickerIdx: number) => {
      if (this.userSettings["picker-type-list"][pickerIdx] === "end") return;

      const spaceHeight = this.elems.space.offsetHeight;
      const rootHeight = this.elems.root.offsetHeight;
      /**
       * @description see {@link render}, then you can find numIdx will be third times larger
       * if user want to use 'endless' style
       */
      const len = this.userSettings["num-list"][pickerIdx];
      const numsFromPicker = pickerElem.querySelectorAll("li.num");

      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            // @ts-ignore
            const info = entry.target.classList.item(1).split("-");

            const num = parseInt(info[2]);

            const coor = this.pickerCoor[pickerIdx];

            if (!entry.isIntersecting) {
              switch (num - len) {
                case 0:
                  if (
                    coor.y <
                    coor.upperBound - spaceHeight + coor.numGap * 1.5
                  ) {
                    coor.dest = coor.lowerBound - rootHeight + coor.numGap;
                    coor.y = coor.dest + coor.numGap / 2;
                  }
                  break;
                case len - 1:
                  if (coor.y > coor.lowerBound - coor.numGap * 1.5) {
                    coor.dest = coor.upperBound + spaceHeight;
                    coor.y = coor.dest - coor.numGap;
                  }
                  break;
              }
            }
          });
        },
        {
          root: this.elems.pickerContainer,
          threshold: 1,
        }
      );

      io.observe(numsFromPicker[0]);
      io.observe(numsFromPicker[len - 1]);

      this.ioScrollSwitcherPerPicker.push(io);
    });
  }

  /**
   * @param {number} pickerIdx
   * @param {number} dis
   * @param {'add' | 'sub'} method
   */
  addDistanceForDestination(
    pickerIdx: number,
    dis: number,
    method: "add" | "sub"
  ) {
    const BOUNCE_LENGTH = this.elems.root.offsetHeight / 3;

    const coor = this.pickerCoor[pickerIdx];

    const spaceHeight = this.elems.space.offsetHeight;
    switch (method) {
      // go down ↓
      case "add":
        if (
          this.userSettings["picker-type-list"][pickerIdx] === "end" &&
          coor.dest + dis > coor.lowerBound - spaceHeight + BOUNCE_LENGTH
        ) {
          coor.dest = coor.lowerBound - spaceHeight + BOUNCE_LENGTH;
        } else {
          coor.dest += dis;
        }
        break;
      // go up ↑
      case "sub":
        if (
          this.userSettings["picker-type-list"][pickerIdx] === "end" &&
          coor.dest - dis < coor.upperBound - BOUNCE_LENGTH
        ) {
          coor.dest = coor.upperBound - BOUNCE_LENGTH;
        } else {
          coor.dest -= dis;
        }
        break;
    }
  }

  focusedPickerIdx = -1;

  keyListener = {
    /**
     * @param {KeyboardEvent} e
     */
    keydown: (e: KeyboardEvent) => {
      if (this.focusedPickerIdx === -1) {
        switch (e.code) {
          case "ArrowUp":
          case "ArrowDown":
          case "ArrowLeft":
            this.elems.allPickers[this.main.cnt - 1].focus();
            break;
          case "ArrowRight":
            this.elems.allPickers[0].focus();
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
          this.elems.allPickers[this.focusedPickerIdx - 1].focus();
        } else {
          this.elems.allPickers[this.focusedPickerIdx].blur();
        }
      } else if (e.code === "ArrowRight") {
        if (this.focusedPickerIdx < this.main.cnt - 1) {
          this.elems.allPickers[this.focusedPickerIdx + 1].focus();
        } else {
          this.elems.allPickers[this.focusedPickerIdx].blur();
        }
      }
    },
    keyup: () => {},
  };

  /**
   * this listener is for key board event, check {@link keyListener}
   */
  attachFocusEventListenerForPicker() {
    this.elems.allPickers.forEach((pickerElem: Element, pickerIdx: number) => {
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
    mousedown: (e: MouseEvent) => {
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
    mousemove: (e: MouseEvent) => {
      if (this.mouseCoor.mousedownY === -1) return;

      const dir = e.y - this.mouseCoor.mousedownY;

      let dis = Math.abs(e.y - this.mouseCoor.mousedownY);

      if (dir < 0) {
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
   * @param {number} dis
   */
  wheelListener(e: WheelEvent, pickerIdx: number, dis: number) {
    this.addDistanceForDestination(
      pickerIdx,
      dis,
      e.deltaY > 0 ? "add" : "sub"
    );
  }

  attachWheelEventListenerForPicker() {
    this.elems.allPickers.forEach((pickerElem: Element, pickerIdx: number) => {
      const numGap = this.pickerCoor[pickerIdx].numGap;

      pickerElem.addEventListener(
        "wheel",
        // @ts-ignore
        (e) => this.wheelListener(e, pickerIdx, numGap),
        { passive: false }
      );
    });
  }

  syncDynamicSettings() {
    this.setStyles();
    this.syncCoor();
    this.setObservers();

    this.isResizing = false;
  }
  resizeStId: any;
  isResizing = false;

  async resizeListener() {
    this.isResizing = true;
    clearTimeout(this.resizeStId);
    this.resizeStId = setTimeout(this.syncDynamicSettings.bind(this), 100);
  }

  connectedCallback() {
    this.render();

    this.syncElements();

    this.syncDynamicSettings();

    this.attachWheelEventListenerForPicker();

    // mouse events for window
    Object.keys(this.mouseListener).forEach((event) => {
      const listener = this.mouseListener[event as TMouseListener];

      window.addEventListener(event as TMouseListener, listener.bind(this));
    });
    document.onmouseleave = this.mouseListener.mouseleave;

    // key event for window and picker
    if (this.userSettings["allow-key-event"]) {
      this.attachFocusEventListenerForPicker();

      Object.keys(this.keyListener).forEach((event) => {
        const listener = this.keyListener[event as TKeyListener];

        window.addEventListener(event as TKeyListener, listener.bind(this));
      }, false);
    }

    if (this.userSettings.flexible) {
      window.addEventListener("resize", this.resizeListener.bind(this));
    }

    /**
     * disable darg and if some picker had focused, will be disappear if user click other area
     */
    this.elems.root.onmousedown = () => {
      this.elems.allPickers.forEach((e: HTMLElement) => e.blur());

      return false;
    };
  }

  disconnectedCallback() {
    Object.keys(this.mouseListener).forEach((event) => {
      window.removeEventListener(
        event as TMouseListener,
        this.mouseListener[event as TMouseListener].bind(this)
      );
    });
    document.removeEventListener("mouseleave", this.mouseListener.mouseleave);

    if (this.userSettings["allow-key-event"]) {
      Object.keys(this.keyListener).forEach((event) => {
        window.removeEventListener(
          event as TKeyListener,
          this.keyListener[event as TKeyListener].bind(this)
        );
      });
    }

    if (this.userSettings.flexible) {
      window.removeEventListener("resize", this.resizeListener.bind(this));
    }
  }
}
