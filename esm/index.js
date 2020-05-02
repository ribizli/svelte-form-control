import { writable, derived, get } from 'svelte/store';

const validateIterated = (validators, fieldValue) => {
    if (!Array.isArray(validators))
        return null;
    for (const validator of validators) {
        if (typeof validator === 'function') {
            try {
                const result = validator(fieldValue);
                if (result != null)
                    return result;
            }
            catch (e) {
                console.error(`validator error`, validator, e);
            }
        }
    }
    return null;
};

class ControlBase {
    constructor(validators) {
        this.validators = validators;
    }
    setValidators(validators) {
        if (!(Array.isArray(validators) && validators.length))
            return;
        this.validators = validators;
    }
}
class Control extends ControlBase {
    constructor(initial, validators = []) {
        super(validators);
        this.initial = initial;
        this.value = writable(this.initial);
        this.touched = writable(false);
        this.state = derived([this.value, this.touched], ([value, $touched]) => {
            const $error = validateIterated(this.validators, value);
            const $valid = $error == null;
            const $dirty = this.initial !== value;
            return { $error, $valid, $touched, $dirty };
        });
    }
    setTouched(touched) {
        this.touched.set(touched);
    }
    child() {
        return null;
    }
    reset(value) {
        if (value !== undefined)
            this.initial = value;
        this.value.set(this.initial);
        this.touched.set(false);
    }
    ;
}
const objectPath = /^([^.[]+)\.?(.*)$/;
class ControlGroup extends ControlBase {
    constructor(controls, validators = []) {
        super(validators);
        this.controlStore = writable({});
        this.controls = { subscribe: this.controlStore.subscribe };
        this.valueDerived = derived(this.controlStore, (controls, set) => {
            const keys = Object.keys(controls);
            const controlValues = keys.map(key => controls[key].value);
            const derivedValues = derived(controlValues, values => values.reduce((acc, value, index) => (acc[keys[index]] = value, acc), {}));
            return derivedValues.subscribe(set);
        });
        this.childStateDerived = derived(this.controlStore, (controls, set) => {
            const keys = Object.keys(controls);
            const controlStates = keys.map(key => controls[key].state);
            const derivedStates = derived(controlStates, states => states.reduce((acc, state, index) => (acc[keys[index]] = state, acc), {}));
            return derivedStates.subscribe(set);
        });
        this.value = {
            subscribe: this.valueDerived.subscribe,
            set: value => this.setValue(value),
            update: updater => this.setValue(updater(get(this.valueDerived))),
        };
        this.state = derived([this.valueDerived, this.childStateDerived], ([value, childState]) => {
            const children = {};
            let childrenValid = true;
            let $touched = false;
            let $dirty = false;
            for (const key of Object.keys(childState)) {
                const state = children[key] = childState[key];
                childrenValid = childrenValid && state.$valid;
                $touched = $touched || state.$touched;
                $dirty = $dirty || state.$dirty;
            }
            const $error = validateIterated(this.validators, value);
            const $valid = $error == null && childrenValid;
            return Object.assign({ $error, $valid, $touched, $dirty }, children);
        });
        this.controlStore.set(controls);
    }
    iterateControls(callback) {
        const controls = get(this.controlStore);
        Object.entries(controls).forEach(callback);
    }
    setValue(value) {
        this.iterateControls(([key, control]) => {
            control.value.set(value[key]);
        });
    }
    addControl(key, control) {
        this.controlStore.update(controls => (controls[key] = control, controls));
    }
    removeControl(key) {
        this.controlStore.update(controls => (delete controls[key], controls));
    }
    setTouched(touched) {
        this.iterateControls(([_, control]) => {
            control.setTouched(touched);
        });
    }
    child(path) {
        const [_, name, rest] = path.match(objectPath) || [];
        const controls = get(this.controlStore);
        const control = name && controls[name] || null;
        if (!control)
            return null;
        return rest ? control.child(rest) : control;
    }
    reset(value) {
        this.iterateControls(([key, control]) => {
            control.reset(value && value[key]);
        });
    }
    ;
}
const arrayPath = /^\[(\d+)\]\.?(.*)$/;
class ControlArray extends ControlBase {
    constructor(_controls, validators = []) {
        super(validators);
        this._controls = _controls;
        this.controlStore = writable(this._controls);
        this.controls = { subscribe: this.controlStore.subscribe };
        this.valueDerived = derived(this.controlStore, (controls, set) => {
            const derivedValues = derived(controls.map(control => control.value), values => values);
            return derivedValues.subscribe(set);
        });
        this.childStateDerived = derived(this.controlStore, (controls, set) => {
            const derivedStates = derived(controls.map(control => control.state), values => values);
            return derivedStates.subscribe(set);
        });
        this.value = {
            subscribe: this.valueDerived.subscribe,
            set: value => this.setValue(value),
            update: updater => this.setValue(updater(get(this.valueDerived))),
        };
        this.state = derived([this.valueDerived, this.childStateDerived], ([value, childState]) => {
            const arrayState = {};
            arrayState.list = [];
            let childrenValid = true;
            for (let i = 0, len = childState.length; i < len; i++) {
                const state = childState[i];
                arrayState.list[i] = state;
                childrenValid = childrenValid && state.$valid;
                arrayState.$touched = arrayState.$touched || state.$touched;
                arrayState.$dirty = arrayState.$dirty || state.$dirty;
            }
            arrayState.$error = validateIterated(this.validators, value);
            arrayState.$valid = arrayState.$error == null && childrenValid;
            return arrayState;
        });
    }
    iterateControls(callback) {
        const controls = get(this.controlStore);
        controls.forEach(callback);
    }
    setValue(value) {
        this.iterateControls((control, index) => control.value.set(value[index]));
    }
    setTouched(touched) {
        this.iterateControls(control => control.setTouched(touched));
    }
    pushControl(control) {
        this.controlStore.update(controls => (controls.push(control), controls));
    }
    addControlAt(index, control) {
        this.controlStore.update(controls => (controls.splice(index, 0, control), controls));
    }
    removeControlAt(index) {
        this.controlStore.update(controls => (controls.splice(index, 1), controls));
    }
    removeControl(control) {
        this.controlStore.update(controls => controls.filter(c => c !== control));
    }
    slice(start, end) {
        this.controlStore.update(controls => controls.slice(start, end));
    }
    child(path) {
        const [_, index, rest] = path.match(arrayPath) || [];
        const controls = get(this.controlStore);
        const control = index != null && controls[+index] || null;
        if (!control)
            return null;
        return rest ? control.child(rest) : control;
    }
    reset(value) {
        this.iterateControls((control, index) => control.reset(value && value[index]));
    }
}

const controlClasses = (el, control) => {
    if (!(control instanceof Control))
        throw new Error('must be used with a Control class');
    const classList = el.classList;
    const stateSub = control.state.subscribe((state) => {
        if (state.$error) {
            classList.add('invalid');
            classList.remove('valid');
        }
        else {
            classList.add('valid');
            classList.remove('invalid');
        }
        if (state.$dirty) {
            classList.add('dirty');
            classList.remove('pristine');
        }
        else {
            classList.add('pristine');
            classList.remove('dirty');
        }
        if (state.$touched) {
            classList.add('touched');
        }
        else {
            classList.remove('touched');
        }
    });
    const eventNames = ['blur', 'focusout'];
    const unregister = () => eventNames.forEach(eventName => el.removeEventListener(eventName, touchedFn));
    const touchedFn = () => {
        if (get(control.state).$touched)
            return;
        control.setTouched(true);
    };
    eventNames.forEach(eventName => el.addEventListener(eventName, touchedFn));
    return {
        destroy() {
            unregister();
            stateSub();
        }
    };
};

export { Control, ControlArray, ControlBase, ControlGroup, controlClasses };
//# sourceMappingURL=index.js.map
