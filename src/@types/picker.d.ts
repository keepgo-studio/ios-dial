interface Info {
  isEntered: boolean;
  top: number;
}

interface CoorInfo {
  y: number;
  dest: number;
  upperBound: number;
  lowerBound: number;
  idealDest: number;
  numGap: number;
}

interface UserSettings {
  width: string;
  height: string;
  "num-list": Array<number>;
  "title-list": Array<string>;
  "picker-type-list": Array<"end" | "endless">;
  flexible: boolean;
  acc: number;
  "allow-key-event": boolean;
  "sound-src": string;
  "event-name": string;
}

interface ElementMap {
  root: HTMLElement;
  pickerContainer: HTMLElement;
  center: HTMLElement;
  space: HTMLElement;
  allPickers: Array<HTMLElement>;
  allLi: Array<HTMLElement>;
}
type TMouseListener = "mousedown" | "mousemove" | "mouseup" | "mouseleave";

type TKeyListener = "keydown" | "keyup";