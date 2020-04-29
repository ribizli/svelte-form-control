export interface ValidationError<D = any> {
	[name: string]: D;
}

export type ValidatorFn<T = any, D = any> = (fieldValue: T) => ValidationError<D> | null;

type ValidatorFactory<C = unknown, T = any, D = any> = (config: C) => ValidatorFn<T, D>;

const empty = (value: any) => value == null || `${value}` === '';

export const required: ValidatorFn<string | number | boolean, boolean> = value => {
	let stringValue = value != null && value !== false ? `${value}`.trim() : '';
	return stringValue !== '' ? null : { required: true };
};

const emailFormat = /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/;
export const email: ValidatorFn<string, boolean> = email => {
	const valid = empty(email) || emailFormat.test(email);
	return valid ? null : { email: true };
};

export const minLength: ValidatorFactory<number, string, number> = min => value => {
	const valid = empty(value) || min == null || `${value}`.trim().length >= min;
	return valid ? null : { minLength: min };
};

export const maxLength: ValidatorFactory<number, string, number> = max => value => {
	const valid = empty(value) || max == null || `${value}`.trim().length <= max;
	return valid ? null : { maxLength: max };
};

export const number: ValidatorFn<string | number, boolean> = number => {
	const valid = empty(number) || !isNaN(+number);
	return valid ? null : { number: true };
};

const decimalFormat = /^\d*\.?\d+$/;
export const decimal: ValidatorFn<string | number, boolean> = number => {
	const valid = empty(number) || !isNaN(+number) && decimalFormat.test(`${number}`);
	return valid ? null : { decimal: true };
};

const intFormat = /^\d+$/;
export const integer: ValidatorFn<string | number, boolean> = number => {
	const valid = empty(number) || !isNaN(+number) && intFormat.test(`${number}`);
	return valid ? null : { integer: true };
};


export const min: ValidatorFactory<number, string | number, number> = min => number => {
	const valid = empty(number) || !isNaN(+number) && (min == null || number >= min);
	return valid ? null : { min };
};

export const max: ValidatorFactory<number, string | number, number> = max => number => {
	const valid = empty(number) || !isNaN(+number) && (max == null || number <= max);
	return valid ? null : { max };
};

export const pattern: ValidatorFactory<RegExp, string, string> = re => text => {
	const valid = empty(text) || (re == null || re.test(text));
	return valid ? null : { pattern: `${re}`};
};
