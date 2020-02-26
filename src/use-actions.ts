import { $ControlState, Control, ControlBase } from "./control";

export const controlClasses = (el: HTMLElement, control: Control) => {
	if (!(control instanceof Control)) throw new Error('must be used with a Control class');

	const classList = el.classList;

	const stateSub = control.state.subscribe((state) => {
		if (state.$error) {
			classList.add('invalid');
			classList.remove('valid');
		} else {
			classList.add('valid');
			classList.remove('invalid');
		}

		if (state.$dirty) {
			classList.add('dirty');
			classList.remove('pristine');
		} else {
			classList.add('pristine');
			classList.remove('dirty');
		}

		if (state.$touched) {
			classList.add('touched');
		} else {
			classList.remove('touched');
		}

	});

	const eventNames = ['blur', 'focusout'];

	const unregister = () => eventNames.forEach(eventName => el.removeEventListener(eventName, touchedFn));

	const touchedFn = () => {
		control.setTouched(true);
		unregister();
	}

	eventNames.forEach(eventName => el.addEventListener(eventName, touchedFn));

	return {
		destroy() {
			unregister();
			stateSub();
		}
	}
};

export const controlErrorFactory = ({ onlyTouched = false } = {}) =>
	(el: HTMLElement, control: ControlBase) => {
		if (!(control instanceof Control)) throw new Error('must be used with a Control class');

		const stateSub = control.state.subscribe(_state => {
			const state = (_state as $ControlState);
			const hasError = !!((!onlyTouched || state.$touched) && state.$error);
			el.hidden = !hasError;
			if (hasError) el.innerHTML = state.$error!;
		});

		return { destroy: stateSub };
	};


export const controlError = controlErrorFactory();
