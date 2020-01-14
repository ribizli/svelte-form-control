import { derived, get, Readable, writable, Writable } from 'svelte/store';
import { validateChain } from './utils';
import { ValidatorFn } from './validators';

type GroupValue<T> = { [K in keyof T]: T[K] };
type ControlStateGroup<T> = { [K in keyof T]: ControlState<T[K]> };
type ControlStateChildren<T> = T extends (infer K)[] ? ControlState<K>[]
  : T extends GroupValue<T> ? ControlStateGroup<T>
  : never;

interface ControlState<T = any> {
  error: string | null;

  valid: boolean;

  touched: boolean;

  dirty: boolean;

  children: ControlStateChildren<T>;

}

export interface ControlBase<T = any> {
  value: Writable<T>;

  state: Readable<ControlState<T>>;

  getControl(path: string): ControlBase;

  reset(value?: T): void;

}

export class Control<T = any> implements ControlBase<T> {

  value = writable<T>(this.initial);

  private touched = writable(false);

  state = derived([this.value, this.touched], ([value, touched]) => {
    const error = validateChain(this.validators, value);
    const valid = error == null;
    const dirty = this.initial !== value;
    return { error, valid, touched, dirty } as ControlState<T>;
  });

  constructor(private initial: T, private validators: ValidatorFn<T>[] = []) { }

  setTouched(touched: boolean) {
    this.touched.set(touched);
  }

  getControl(path: string) {
    return null!;
  }

  reset(value?: T) {
    this.touched.set(false);
    if (value != null) this.initial = value;
    this.value.set(this.initial);
  };

}

type Controls<T> = { [K in keyof T]: ControlBase<T[K]> };

const objectPath = /^([^.[]+)\.?(.*)$/;

export class ControlGroup<T> implements ControlBase<T> {

  private valueDerived = derived(this.initControls(this.controls), value => value);

  value: Writable<T> = {
    subscribe: this.valueDerived.subscribe,
    set: value => this.setValue(value),
    update: updater => this.setValue(updater(get(this.valueDerived))),
  };

  state = derived(this.value, value => {
    const children: Record<string, ControlState> = {};
    let childError = false;
    let touched = false;
    let dirty = false;
    for (const key of Object.keys(this.controls)) {
      const state = children[key] = get(((this.controls as any)[key] as ControlBase).state) as ControlState;
      childError = childError || state.error != null;
      touched = touched || state.touched;
      dirty = dirty || state.dirty;
    }
    const error = validateChain(this.validators, value);
    const valid = error == null && !childError;
    return { error, valid, touched, dirty, children } as ControlState<T>;
  });

  constructor(
    private readonly controls: Controls<T>,
    private readonly validators: ValidatorFn<T>[] = [],
  ) { }

  private initControls(controls: Controls<T>) {
    const keys = Object.keys(controls);
    const controlList = keys.map(key => (<any>this.controls)[key]);
    const readables = controlList.map(control => control.value) as any as [Readable<any>, ...Readable<any>[]];
    return derived(readables, (values: any[]) =>
      values.reduce((acc, value, index) => (acc[keys[index]] = value, acc), {}) as T);
  }

  private setValue(value: T) {
    Object.keys(this.controls).forEach(key => {
      const control = (this.controls as any)[key] as ControlBase;
      control.value.set((value as any)[key]);
    });
  }

  getControl(path: string) {
    const [_, name, rest] = path.match(objectPath) || [];
    const control = name && (this.controls as any)[name] as ControlBase || null;
    if (!control) return null!;
    return rest ? control.getControl(rest) : control;
  }

  reset(value?: T) {
    Object.keys(this.controls).forEach(key => {
      const control = (this.controls as any)[key] as ControlBase;
      control.reset((value as any)[key]);
    });
  };

}

const arrayPath = /^\[(\d+)\]\.?(.*)$/;

export class ControlArray<T> implements ControlBase<T[]> {

  private controlStore = writable(this.controls);

  private valueDerived = derived(this.controlStore, (controls: ControlBase<T>[], set: (value: T[]) => void) => {
    const derivedValues = derived(
      controls.map(control => control.value) as any as [Readable<T>, ...Readable<T>[]],
      values => values as T[]);
    return derivedValues.subscribe(set);
  });

  value: Writable<T[]> = {
    subscribe: this.valueDerived.subscribe,
    set: value => this.setValue(value),
    update: updater => this.setValue(updater(get(this.valueDerived))),
  };

  state = derived([this.value, this.controlStore], ([value, controls]) => {
    const children: ControlState<T>[] = [];
    let childError = false;
    let touched = false;
    let dirty = false;
    for (const control of controls) {
      const state: ControlState = get(control.state);
      children.push(state);
      childError = childError || state.error != null;
      touched = touched || state.touched;
      dirty = dirty || state.dirty;
    }
    const error = validateChain(this.validators, value);
    const valid = error == null && !childError;
    return { error, valid, touched, dirty, children } as ControlState<T[]>;
  });

  constructor(
    private readonly controls: ControlBase<T>[],
    private readonly validators: ValidatorFn<T[]>[] = [],
  ) {
  }

  private setValue(value: T[]) {
    const controls: ControlBase<T>[] = get(this.controlStore);
    controls.forEach((control, index) => control.value.set(value[index]));
  }

  pushControl(control: ControlBase<T>) {
    this.controlStore.update(stores => (stores.push(control), stores));
  }

  addControlAt(index: number, control: ControlBase<T>) {
    this.controlStore.update(stores => (stores.splice(index, 0, control), stores));
  }

  removeControlAt(index: number) {
    this.controlStore.update(stores => (stores.splice(index, 1), stores));
  }

  getControl(path: string) {
    const [_, index, rest] = path.match(arrayPath) || [];
    const control = index != null && this.controls[+index] || null;
    if (!control) return null!;
    return rest ? control.getControl(rest) : control;
  }

  reset(value?: T[]) {
    const controls: ControlBase<T>[] = get(this.controlStore);
    controls.forEach((control, index) => control.reset(value && value[index]));
  }

}
