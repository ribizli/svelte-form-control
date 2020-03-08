import { derived, get, Readable, writable, Writable } from 'svelte/store';
import { validateIterated } from './utils';
import { ValidatorFn } from './validators';

type GroupValue<T> = { [K in keyof T]: T[K] };

type ControlTypes = string | number | boolean;

export interface $ControlState {
  $error: string | null;

  $valid: boolean;

  $touched: boolean;

  $dirty: boolean;
}

type ControlState<T = any> = T extends (infer K)[] ? Array<ControlState<K> & $ControlState>
  : T extends ControlTypes ? $ControlState
  : T extends GroupValue<T> ? { [K in keyof T]: ControlState<T[K]> & $ControlState }
  : $ControlState;

export abstract class ControlBase<T = any> {

  constructor(protected validators: ValidatorFn<T>[]) { }

  abstract value: Writable<T>;

  abstract state: Readable<ControlState<T>>;

  abstract getControl(path: string): ControlBase;

  abstract reset(value?: T): void;

  abstract setTouched(touched: boolean): void;

  setValidators(validators: ValidatorFn<T>[]) {
    if (!(Array.isArray(validators) && validators.length)) return;
    this.validators = validators;
  }

}

export class Control<T = ControlTypes> extends ControlBase<T> {

  value = writable<T>(this.initial);

  private touched = writable(false);

  state = derived([this.value, this.touched], ([value, $touched]) => {
    const $error = validateIterated(this.validators, value);
    const $valid = $error == null;
    const $dirty = this.initial !== value;
    return { $error, $valid, $touched, $dirty } as ControlState<T>;
  });

  constructor(
    private initial: T,
    validators: ValidatorFn<T>[] = [],
  ) {
    super(validators);
  }

  setTouched(touched: boolean) {
    this.touched.set(touched);
  }

  getControl() {
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

const controlsValueReadable = <T>(controls: Controls<T>) => {
  const keys = Object.keys(controls);
  const controlList = keys.map(key => (<any>controls)[key]);
  const readables = controlList.map(control => control.value) as any as [Readable<any>, ...Readable<any>[]];
  return derived(readables, (values: any[]) =>
    values.reduce((acc, value, index) => (acc[keys[index]] = value, acc), {}) as T);
};

const controlsStateReadable = <T>(controls: Controls<T>) => {
  const keys = Object.keys(controls);
  const controlList = keys.map(key => (<any>controls)[key]);
  const readables = controlList.map(control => control.state) as any as [Readable<any>, ...Readable<any>[]];
  return derived(readables, (states: any[]) =>
    states.reduce((acc, state, index) => (acc[keys[index]] = state, acc), {}) as { [K in keyof T]: $ControlState });
};

export class ControlGroup<T> extends ControlBase<T> {

  private valueReadable = controlsValueReadable(this.controls);

  private childStateReadable = controlsStateReadable(this.controls);

  value: Writable<T> = {
    subscribe: this.valueReadable.subscribe,
    set: value => this.setValue(value),
    update: updater => this.setValue(updater(get(this.valueReadable))),
  };

  state = derived([this.valueReadable, this.childStateReadable], ([value, childState]) => {
    const children: Record<string, $ControlState> = {};
    let childrenValid = true;
    let $touched = false;
    let $dirty = false;
    for (const key of Object.keys(this.controls)) {
      const state = children[key] = (childState as any)[key] as $ControlState;
      childrenValid = childrenValid && state.$valid;
      $touched = $touched || state.$touched;
      $dirty = $dirty || state.$dirty;
    }
    const $error = validateIterated(this.validators, value);
    const $valid = $error == null && childrenValid;
    return { $error, $valid, $touched, $dirty, ...children } as ControlState<T>;
  });

  constructor(
    private readonly controls: Controls<T>,
    validators: ValidatorFn<T>[] = [],
  ) {
    super(validators);
  }

  private setValue(value: T) {
    Object.keys(this.controls).forEach(key => {
      const control = (this.controls as any)[key] as ControlBase;
      control.value.set((value as any)[key]);
    });
  }

  setTouched(touched: boolean) {
    Object.keys(this.controls).forEach(key => {
      const control = (this.controls as any)[key] as ControlBase;
      control.setTouched(touched);
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

export class ControlArray<T> extends ControlBase<T[]> {

  private controlStore = writable(this._controls);

  private valueDerived = derived(this.controlStore, (controls: ControlBase<T>[], set: (value: T[]) => void) => {
    const derivedValues = derived(
      controls.map(control => control.value) as any as [Readable<T>, ...Readable<T>[]],
      values => values as T[]);
    return derivedValues.subscribe(set);
  });

  private childStateDerived = derived(this.controlStore,
    (controls: ControlBase<T>[], set: (value: $ControlState[]) => void) => {
      const derivedValues = derived(
        controls.map(control => control.state) as any as [Readable<$ControlState>, ...Readable<$ControlState>[]],
        values => values as $ControlState[]);
      return derivedValues.subscribe(set);
    });

  value: Writable<T[]> = {
    subscribe: this.valueDerived.subscribe,
    set: value => this.setValue(value),
    update: updater => this.setValue(updater(get(this.valueDerived))),
  };

  state = derived([this.valueDerived, this.childStateDerived], ([value, childState]) => {
    const children: $ControlState & $ControlState[] = [] as any;
    let childrenValid = true;
    for (let i = 0, len = childState.length; i < len; i++) {
      const state = childState[i];
      children[i] = state;
      childrenValid = childrenValid && state.$valid;
      children.$touched = children.$touched || state.$touched;
      children.$dirty = children.$dirty || state.$dirty;
    }
    children.$error = validateIterated(this.validators, value);
    children.$valid = children.$error == null && childrenValid;

    return children as any as ControlState<T[]>;
  });

  constructor(
    private readonly _controls: ControlBase<T>[],
    validators: ValidatorFn<T[]>[] = [],
  ) {
    super(validators);
  }

  private setValue(value: T[]) {
    const controls: ControlBase<T>[] = get(this.controlStore);
    controls.forEach((control, index) => control.value.set(value[index]));
  }

  setTouched(touched: boolean) {
    const controls: ControlBase<T>[] = get(this.controlStore);
    controls.forEach(control => control.setTouched(touched));
  }

  get size() {
    return (get(this.controlStore) as ControlBase<T>[]).length;
  }

  get controls() {
    return (get(this.controlStore) as ControlBase<T>[]);
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

  slice(start?: number, end?: number) {
    this.controlStore.update(stores => stores.slice(start, end));
  }

  getControl(path: string) {
    const [_, index, rest] = path.match(arrayPath) || [];
    const controls: ControlBase<T>[] = get(this.controlStore);
    const control = index != null && controls[+index] || null;
    if (!control) return null!;
    return rest ? control.getControl(rest) : control;
  }

  reset(value?: T[]) {
    const controls: ControlBase<T>[] = get(this.controlStore);
    controls.forEach((control, index) => control.reset(value && value[index]));
  }

  setValidators(validators: ValidatorFn<T[]>[]) {
    if (!(Array.isArray(validators) && validators.length)) return;
    this.validators = validators;
  }

}
