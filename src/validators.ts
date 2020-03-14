export type ValidatorFn<T = any> = (fieldValue: T) => string | null;

type ValidatorFactory<T = unknown> = (message: string, config?: T) => ValidatorFn;

const empty = (value: any) => value == null || `${value}` === '';

export const required: ValidatorFactory = (message, trim = true) => value => {
	let stringValue = value != null ? `${value}` : '';
	if (trim) stringValue = stringValue.trim();
	return stringValue !== '' ? null : message;
};

const emailFormat = /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/;
export const email: ValidatorFactory = message => email => {
	const valid = empty(email) || emailFormat.test(email);
	return valid ? null : message;
};

export const minLength: ValidatorFactory<number> = (message, min) => value => {
	const valid = empty(value) && (min == null || `${value}`.length >= min);
	return valid ? null : message;
};

export const maxLength: ValidatorFactory<number> = (message, max) => value => {
	const valid = empty(value) && (max == null || `${value}`.length <= max);
	return valid ? null : message;
};

export const number: ValidatorFactory = message => number => {
	const valid = empty(number) || !isNaN(number);
	return valid ? null : message;
};

const decimalFormat = /^[\d.]+$/;
export const decimal: ValidatorFactory = message => number => {
	const valid = empty(number) || !isNaN(number) && decimalFormat.test(`${number}`);
	return valid ? null : message;
};

const intFormat = /^[\d]+$/;
export const integer: ValidatorFactory = message => number => {
	const valid = empty(number) || !isNaN(number) && intFormat.test(`${number}`);
	return valid ? null : message;
};



export const min: ValidatorFactory<number> = (message, min) => number => {
	const valid = empty(number) || !isNaN(number) && (min == null || number >= min);
	return valid ? null : message;
};

export const max: ValidatorFactory<number> = (message, max) => number => {
	const valid = empty(number) || !isNaN(number) && (max == null || number <= max);
	return valid ? null : message;
};

export const pattern: ValidatorFactory<RegExp> = (message, re) => text => {
	const valid = empty(text) || (re == null || re.test(text));
	return valid ? null : message;
};

