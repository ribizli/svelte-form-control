import { Readable, Writable } from 'svelte/store';
import { ValidatorFn } from './validators';
declare type GroupValue<T> = {
    [K in keyof T]: T[K];
};
declare type ControlTypes = string | number | boolean;
export interface $ControlState {
    $error: string | null;
    $valid: boolean;
    $touched: boolean;
    $dirty: boolean;
}
declare type ControlState<T = any> = T extends (infer K)[] ? Array<ControlState<K> & $ControlState> : T extends ControlTypes ? $ControlState : T extends GroupValue<T> ? {
    [K in keyof T]: ControlState<T[K]> & $ControlState;
} : $ControlState;
export declare abstract class ControlBase<T = any> {
    protected validators: ValidatorFn<T>[];
    constructor(validators: ValidatorFn<T>[]);
    abstract value: Writable<T>;
    abstract state: Readable<ControlState<T>>;
    abstract getControl(path: string): ControlBase;
    abstract reset(value?: T): void;
    abstract setTouched(touched: boolean): void;
    setValidators(validators: ValidatorFn<T>[]): void;
}
export declare class Control<T = ControlTypes> extends ControlBase<T> {
    private initial;
    value: Writable<T>;
    private touched;
    state: Readable<ControlState<T>>;
    constructor(initial: T, validators?: ValidatorFn<T>[]);
    setTouched(touched: boolean): void;
    getControl(): never;
    reset(value?: T): void;
}
declare type Controls<T> = {
    [K in keyof T]: ControlBase<T[K]>;
};
export declare class ControlGroup<T> extends ControlBase<T> {
    private readonly controls;
    private valueDerived;
    value: Writable<T>;
    state: Readable<ControlState<T>>;
    constructor(controls: Controls<T>, validators?: ValidatorFn<T>[]);
    private initControls;
    private setValue;
    setTouched(touched: boolean): void;
    getControl(path: string): ControlBase<any>;
    reset(value?: T): void;
}
export declare class ControlArray<T> extends ControlBase<T[]> {
    private readonly _controls;
    private controlStore;
    private valueDerived;
    value: Writable<T[]>;
    state: Readable<(ControlState<T> & $ControlState)[]>;
    constructor(_controls: ControlBase<T>[], validators?: ValidatorFn<T[]>[]);
    private setValue;
    setTouched(touched: boolean): void;
    get size(): number;
    get controls(): ControlBase<T>[];
    pushControl(control: ControlBase<T>): void;
    addControlAt(index: number, control: ControlBase<T>): void;
    removeControlAt(index: number): void;
    slice(start?: number, end?: number): void;
    getControl(path: string): ControlBase<any> | ControlBase<T>;
    reset(value?: T[]): void;
    setValidators(validators: ValidatorFn<T[]>[]): void;
}
export {};
