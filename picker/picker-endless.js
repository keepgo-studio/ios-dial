// @ts-check

import { errorHTML, IPHONE_PPI_WIDTH, MAX_FONT_SIZE } from "./ios.js";
import { range } from "./utils.js";

const baseStyles = `
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

const estyles = `
  
`
export class PickerEndless extends HTMLElement{
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
   * @typedef {Object} ElementList
   * @property {HTMLElement} root
   * @property {HTMLElement} pickerContainer
   * @property {HTMLElement} center
   * @property {Array<HTMLElement>} allPickers
   * @property {Array<HTMLElement>} allNums
   * @property {Array<HTMLElement>} allNumClones
   * @property {Array<HTMLElement>} allLi
   */
  /**
   * @type {ElementList}
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
      // coor.y += dis
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
      // coor.y -= dis
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
  }
  animation() {
    requestAnimationFrame(this.animation.bind(this));

    this.elems.allPickers.forEach((pickerElem, pickerIdx) => {
      this.drawPicker(pickerElem, pickerIdx);
    })
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

    this.shadowRoot.innerHTML = `
    <style>${baseStyles}</style>
    <style>${estyles}</style>

    <section id="root">
      <div class="picker-container">
        <div class="center"></div>

        ${range(this.main.cnt)
          .map(
            (pickerIdx) => `
            <div class="picker" tabIndex=0>
              <ul class="num-list idx-${pickerIdx}">
                ${range(this.userSettings["num-list"][pickerIdx])
                  .map(
                    (numIdx) => `
                  <li class="num-clone idx-${pickerIdx}-${numIdx}"><span>${numIdx}</span>
                  </li>
                `
                  )
                  .join("")}

                ${range(this.userSettings["num-list"][pickerIdx])
                  .map(
                    (numIdx) => `
                  <li class="num idx-${pickerIdx}-${numIdx}"><span>${numIdx}</span>
                  </li>
                `
                  )
                  .join("")}
                ${range(this.userSettings["num-list"][pickerIdx])
                  .map(
                    (numIdx) => `
                  <li class="num-clone idx-${pickerIdx}-${numIdx}"><span>${numIdx}</span>
                  </li>
                `
                  )
                  .join("")}
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
    `
  }

  syncElements() {
    // @ts-ignore
    this.elems.root = this.shadowRoot?.getElementById("root");

    // @ts-ignore
    this.elems.pickerContainer = this.shadowRoot?.querySelector(".picker-container");

    // @ts-ignore
    this.elems.center = this.shadowRoot?.querySelector(".center");

    this.elems.allPickers = [
      // @ts-ignore
      ...this.shadowRoot?.querySelectorAll(".picker"),
    ];

    this.elems.allNums = [
      ...this.shadowRoot?.querySelectorAll(".num-list .num"),
    ];
  }

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

  syncCoor() { 
    this.pickerContainerCoor = this.elems.pickerContainer
      .getBoundingClientRect();

    this.numCoorPerPicker = [];

    this.elems.allPickers.forEach((pickerElem, pickerIdx) => {
      this.numCoorPerPicker.push([]);

      const numsFromPicker = [...pickerElem.querySelectorAll("li.num")];

      numsFromPicker.forEach(numElem => {
        this.numCoorPerPicker[pickerIdx].push({
          isEntered: false,
          // @ts-ignore
          top: numElem.offsetTop,
        });
      });

      let numGap = 0;

      if (numsFromPicker.length > 1) {
        // @ts-ignore
        numGap =
          this.numCoorPerPicker[pickerIdx][1].top -
          this.numCoorPerPicker[pickerIdx][0].top;
      }

      const numsLength = numsFromPicker.length;

      const initY = this.numCoorPerPicker[pickerIdx][0].top;

      this.pickerCoor.push({
        y: initY,
        dest: initY,
        upperBound: initY,
        // @ts-ignore
        lowerBound: this.numCoorPerPicker[pickerIdx][numsLength - 1].top,
        idealDest: initY,
        numGap,
      });
    });
  }

  /**
   * @param {number} pickerIdx
   * @param {number} dis
   * @param {'add' | 'sub'} method
   */
  addDistanceForDestination(pickerIdx, dis, method) {
    const coor = this.pickerCoor[pickerIdx];

    switch (method) {
      // go down ↓
      case "add":
        coor.dest += dis;
        break;
      // go up ↑
      case "sub":
        coor.dest -= dis;
        break;
    }
  }

  /**
   * @param {WheelEvent} e 
   * @param {number} pickerIdx 
   */
  wheelListener(e, pickerIdx) {
    // this.pickerCoor[pickerIdx].
    const dis = Math.abs(e.deltaY);

    if (e.deltaY > 0) {
      this.addDistanceForDestination(pickerIdx, dis, 'add')
    } else {
      this.addDistanceForDestination(pickerIdx, dis, 'sub')
    }
  }

  /**
   * @type {Array<IntersectionObserver>}
   */
  ioScrollSwitcherPerPicker = [];

  setObservers() {
    this.ioScrollSwitcherPerPicker.forEach(io => io.disconnect());

    const rootHeight = this.elems.root.offsetHeight;

    this.ioScrollSwitcherPerPicker = this.elems.allPickers.map((pickerElem, pickerIdx) => {
      const numsLength = this.numCoorPerPicker[pickerIdx].length;

      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
        // @ts-ignore
          const info = entry.target.classList.item(1).split('-');

          const numIdx = parseInt(info[2]);

          const coor = this.pickerCoor[pickerIdx];

          if (!entry.isIntersecting) {
            switch(numIdx) {
              case 0:
                if (coor.y < coor.upperBound - coor.numGap / 2) {
                  coor.dest = coor.lowerBound + coor.numGap - rootHeight;
                  coor.y = coor.dest + coor.numGap / 2;
                }
                break;
              case numsLength - 1:
                console.log(coor.y, entry.target, coor.lowerBound - 1)
                if (coor.y >= coor.lowerBound + coor.numGap / 2) {
                  console.log(entry.target)
                  coor.dest = coor.upperBound;
                  coor.y = coor.dest - coor.numGap / 2;
                }
                break;
            }
          }
        })
      }, {
        root: this.elems.pickerContainer,
        threshold: 0.1,
      })

      const allNumElem = pickerElem.querySelectorAll(`li.num`);
      // @ts-ignore
      io.observe(allNumElem[0]);
      // @ts-ignore
      io.observe(allNumElem[numsLength - 1]);

      return io;
    })
  }

  connectedCallback() {
    this.render();

    this.syncElements();

    this.setStyles();

    this.syncCoor();

    this.setObservers();

    this.elems.allPickers.forEach((pickerElem, pickerIdx) => {
      pickerElem.addEventListener('wheel', (e) => this.wheelListener(e, pickerIdx), false);
    })
  }
}