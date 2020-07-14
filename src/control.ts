import { derived, get, Readable, writable, Writable } from 'svelte/store';
import { validateIterated } from './utils';
import { ValidationError, ValidatorFn } from './validators';

type GroupValue<T> = { [K in keyof T]: T[K] };

type ControlTypes = string | number | boolean;

export interface $ControlState {
  $error: ValidationError | null;

  $valid: boolean;

  $touched: boolean;

  $dirty: boolean;
}

type ControlState<T = any> = T extends (infer K)[] ? $ControlState & { list: Array<ControlState<K>> }
  : T extends ControlTypes ? $ControlState
  : T extends GroupValue<T> ? { [K in keyof T]: ControlState<T[K]> & $ControlState }
  : $ControlState;

export abstract class ControlBase<T = any> {

  protected validators: Writable<ValidatorFn<T>[]>;

  constructor(validators: ValidatorFn<T>[]) {
    this.validators = writable(validators);
  }

  abstract value: Writable<T>;

  abstract state: Readable<ControlState<T>>;

  abstract child(path: string): ControlBase;

  abstract reset(value?: T): void;

  abstract setTouched(touched: boolean): void;

  setValidators(validators: ValidatorFn<T>[]) {
    if (!(Array.isArray(validators) && validators.length)) return;
    this.validators.set(validators);
  }

}

export class Control<T = ControlTypes> extends ControlBase<T> {

  value = writable<T>(this.initial);

  private touched = writable(false);

  state = derived([this.value, this.touched, this.validators], ([value, $touched, validators]) => {
    const $error = validateIterated(validators, value);
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

  child() {
    return null!;
  }

  reset(value?: T) {
    if (value !== undefined) this.initial = value;
    this.value.set(this.initial);
    this.touched.set(false);
  };

}

type Controls<T> = { [K in keyof T]: ControlBase<T[K]> };
type ControlsState<T> = { [K in keyof T]: $ControlState };
const objectPath = /^([^.[]+)\.?(.*)$/;

export class ControlGroup<T> extends ControlBase<T> {

  private controlStore = writable<Controls<T>>({} as any);

  controls: Readable<Controls<T>> = { subscribe: this.controlStore.subscribe };

  private valueDerived = derived(this.controlStore, (controls: Controls<T>, set: (value: T) => void) => {
    const keys = Object.keys(controls) as Array<keyof T>;
    const controlValues = keys.map(key => controls[key].value);
    const derivedValues = derived(controlValues as any,
      values => (<any[]>values).reduce((acc, value, index) => (acc[keys[index]] = value, acc), {}) as T);
    return derivedValues.subscribe(set);
  });

  private childStateDerived = derived(this.controlStore,
    (controls: Controls<T>, set: (value: ControlsState<T>) => void) => {
      const keys = Object.keys(controls) as Array<keyof T>;
      const controlStates = keys.map(key => controls[key].state);
      const derivedStates = derived(controlStates as any,
        states => (<any[]>states).reduce((acc, state, index) => (acc[keys[index]] = state, acc), {}) as ControlsState<T>);
      return derivedStates.subscribe(set);
    });

  value: Writable<T> = {
    subscribe: this.valueDerived.subscribe,
    set: value => this.setValue(value),
    update: updater => this.setValue(updater(get(this.valueDerived))),
  };

  state = derived(
    [this.valueDerived, this.childStateDerived, this.validators],
    ([value, childState, validators]) => {
      const children: Record<string, $ControlState> = {};
      let childrenValid = true;
      let $touched = false;
      let $dirty = false;
      for (const key of Object.keys(childState)) {
        const state = children[key] = (childState as any)[key] as $ControlState;
        childrenValid = childrenValid && state.$valid;
        $touched = $touched || state.$touched;
        $dirty = $dirty || state.$dirty;
      }
      const $error = validateIterated(validators, value);
      const $valid = $error == null && childrenValid;
      return { $error, $valid, $touched, $dirty, ...children } as ControlState<T>;
    });

  constructor(
    controls: Controls<T>,
    validators: ValidatorFn<T>[] = [],
  ) {
    super(validators);
    this.controlStore.set(controls);
  }

  private iterateControls<K extends keyof T>(callback: (args: [K, ControlBase<T[K]>]) => void) {
    const controls = get(this.controlStore);
    (<[K, ControlBase<T[K]>][]>Object.entries(controls)).forEach(callback);
  }

  private setValue(value: T) {
    this.iterateControls(([key, control]) => {
      const controlValue = value && value[key] || null;
      control.value.set(controlValue!);
    });
  }

  addControl(key: string, control: ControlBase) {
    this.controlStore.update(controls => ((<any>controls)[key] = control, controls));
  }

  removeControl(key: string) {
    this.controlStore.update(controls => (delete (<any>controls)[key], controls));
  }

  setTouched(touched: boolean) {
    this.iterateControls(([_, control]) => {
      control.setTouched(touched);
    });
  }

  child(path: string) {
    const [_, name, rest] = path.match(objectPath) || [];
    const controls = get(this.controlStore);
    const control = name && (controls as any)[name] as ControlBase || null;
    if (!control) return null!;
    return rest ? control.child(rest) : control;
  }

  reset(value?: T) {
    this.iterateControls(([key, control]) => {
      const controlValue = value && value[key] || null;
      control.reset(controlValue!);
    });
  };

}

const arrayPath = /^\[(\d+)\]\.?(.*)$/;

export class ControlArray<T> extends ControlBase<T[]> {

  private controlStore = writable(this._controls);

  controls: Readable<ControlBase<T>[]> = { subscribe: this.controlStore.subscribe };

  private valueDerived = derived(this.controlStore, (controls: ControlBase<T>[], set: (value: T[]) => void) => {
    const derivedValues = derived(
      controls.map(control => control.value) as any,
      values => values as T[]);
    return derivedValues.subscribe(set);
  });

  private childStateDerived = derived(this.controlStore,
    (controls: ControlBase<T>[], set: (value: $ControlState[]) => void) => {
      const derivedStates = derived(
        controls.map(control => control.state) as any,
        values => values as $ControlState[]);
      return derivedStates.subscribe(set);
    });

  value: Writable<T[]> = {
    subscribe: this.valueDerived.subscribe,
    set: value => this.setValue(value),
    update: updater => this.setValue(updater(get(this.valueDerived))),
  };

  state = derived(
    [this.valueDerived, this.childStateDerived, this.validators],
    ([value, childState, validators]) => {
      const arrayState = {} as $ControlState & { list: $ControlState[] };
      arrayState.list = [];
      let childrenValid = true;
      for (let i = 0, len = childState.length; i < len; i++) {
        const state = childState[i];
        arrayState.list[i] = state;
        childrenValid = childrenValid && state.$valid;
        arrayState.$touched = arrayState.$touched || state.$touched;
        arrayState.$dirty = arrayState.$dirty || state.$dirty;
      }
      arrayState.$error = validateIterated(validators, value);
      arrayState.$valid = arrayState.$error == null && childrenValid;

      return arrayState as ControlState<T[]>;
    });

  constructor(
    private readonly _controls: ControlBase<T>[],
    validators: ValidatorFn<T[]>[] = [],
  ) {
    super(validators);
  }

  private iterateControls(callback: (control: ControlBase<T>, index: number) => void) {
    const controls: ControlBase<T>[] = get(this.controlStore);
    controls.forEach(callback);
  }

  private setValue(value: T[]) {
    this.iterateControls((control, index) => {
      const controlValue = value && value[index] || null;
      control.value.set(controlValue!);
    });
  }

  setTouched(touched: boolean) {
    this.iterateControls(control => control.setTouched(touched));
  }

  pushControl(control: ControlBase<T>) {
    this.controlStore.update(controls => (controls.push(control), controls));
  }

  addControlAt(index: number, control: ControlBase<T>) {
    this.controlStore.update(controls => (controls.splice(index, 0, control), controls));
  }

  removeControlAt(index: number) {
    this.controlStore.update(controls => (controls.splice(index, 1), controls));
  }

  removeControl(control: ControlBase<T>) {
    this.controlStore.update(controls => controls.filter(c => c !== control));
  }

  slice(start?: number, end?: number) {
    this.controlStore.update(controls => controls.slice(start, end));
  }

  child(path: string) {
    const [_, index, rest] = path.match(arrayPath) || [];
    const controls: ControlBase<T>[] = get(this.controlStore);
    const control = index != null && controls[+index] || null;
    if (!control) return null!;
    return rest ? control.child(rest) : control;
  }

  reset(value?: T[]) {
    this.iterateControls((control, index) => {
      const controlValue = value && value[index] || null;
      control.reset(controlValue!);
    });
  }

}
