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
export interface ControlBase<T = any> {
    value: Writable<T>;
    state: Readable<ControlState<T>>;
    getControl(path: string): ControlBase;
    reset(value?: T): void;
}
export declare class Control<T = ControlTypes> implements ControlBase<T> {
    private initial;
    private readonly validators;
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
export declare class ControlGroup<T> implements ControlBase<T> {
    private readonly controls;
    private readonly validators;
    private valueDerived;
    value: Writable<T>;
    state: Readable<ControlState<T>>;
    constructor(controls: Controls<T>, validators?: ValidatorFn<T>[]);
    private initControls;
    private setValue;
    getControl(path: string): ControlBase<any>;
    reset(value?: T): void;
}
export declare class ControlArray<T> implements ControlBase<T[]> {
    private readonly controls;
    private readonly validators;
    private controlStore;
    private valueDerived;
    value: Writable<T[]>;
    state: Readable<(ControlState<T> & $ControlState)[]>;
    constructor(controls: ControlBase<T>[], validators?: ValidatorFn<T[]>[]);
    private setValue;
    get size(): number;
    pushControl(control: ControlBase<T>): void;
    addControlAt(index: number, control: ControlBase<T>): void;
    removeControlAt(index: number): void;
    slice(start?: number, end?: number): void;
    getControl(path: string): ControlBase<any>;
    reset(value?: T[]): void;
}
export {};
