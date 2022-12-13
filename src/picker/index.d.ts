export declare class PickerComponent extends HTMLElement {
    userSettings: UserSettings;
    elems: ElementMap;
    allNumsCoorPerPicker: Array<Array<Info>>;
    pickerCoor: Array<CoorInfo>;
    pickerContainerCoor?: DOMRect;
    mouseCoor: {
        mousedownY: number;
        pressedPickerIdx: number;
    };
    main: {
        cnt: number;
        shouldFireResult: boolean;
        result: Array<number>;
        bounceLength: number;
        animating: boolean;
    };
    animFloat: number;
    syncAttributes(): {
        canRun: boolean;
        msg?: unknown;
    };
    drawPicker(pickerElem: Element, pickerIdx: number): void;
    drawNum(numElem: Element, pickerIdx: number, numIdx: number): void;
    isDrawingStop(): void;
    setIdealDestWhenStop(coor: CoorInfo, pickerIdx: number): void;
    isPickerLocateAtIdealDest(): boolean;
    animation(): void;
    constructor();
    render(): void;
    syncElements(): void;
    setStyles(): void;
    BOUNCE_LENGHT: number;
    syncCoor(): void;
    ioForCurvingNums: IntersectionObserver;
    ioForSetIdealDest: Array<IntersectionObserver>;
    ioScrollSwitcherPerPicker: Array<IntersectionObserver>;
    setObservers(): void;
    addDistanceForDestination(pickerIdx: number, dis: number, method: "add" | "sub"): void;
    focusedPickerIdx: number;
    keyListener: {
        keydown: (e: KeyboardEvent) => void;
        keyup: () => void;
    };
    attachFocusEventListenerForPicker(): void;
    mouseListener: {
        mousedown: (e: MouseEvent) => void;
        mousemove: (e: MouseEvent) => void;
        mouseup: () => void;
        mouseleave: () => void;
    };
    wheelListener(e: WheelEvent, pickerIdx: number, dis: number): void;
    attachWheelEventListenerForPicker(): void;
    syncDynamicSettings(): void;
    resizeStId: any;
    isResizing: boolean;
    resizeListener(): Promise<void>;
    connectedCallback(): void;
    disconnectedCallback(): void;
}
