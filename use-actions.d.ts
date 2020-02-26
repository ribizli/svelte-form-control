import { Control, ControlBase } from "./control";
export declare const controlClasses: (el: HTMLElement, control: Control<string | number | boolean>) => {
    destroy(): void;
};
export declare const controlErrorFactory: ({ onlyTouched }?: {
    onlyTouched?: boolean | undefined;
}) => (el: HTMLElement, control: ControlBase<any>) => {
    destroy: () => void;
};
export declare const controlError: (el: HTMLElement, control: ControlBase<any>) => {
    destroy: () => void;
};
