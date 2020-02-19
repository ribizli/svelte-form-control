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

	const touchedFn = () => {
		control.setTouched(true);
		el.removeEventListener('focus', touchedFn);
	}

	el.addEventListener('focus', touchedFn);

	return {
		destroy() {
			el.removeEventListener('focus', touchedFn);
			stateSub();
		}
	}
};

export const controlError = (el: HTMLElement, control: ControlBase) => {
	const stateSub = control.state.subscribe(state => {
		const error = (state as $ControlState).$error;
		el.hidden = !error;
		if (error) el.innerHTML = error;
	});

	return { destroy: stateSub };
};
