'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const empty = (value) => value == null || `${value}` === '';
const required = value => {
    let stringValue = value != null && value !== false ? `${value}`.trim() : '';
    return stringValue !== '' ? null : { required: true };
};
const emailFormat = /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/;
const email = email => {
    const valid = empty(email) || emailFormat.test(email);
    return valid ? null : { email: true };
};
const minLength = min => value => {
    const valid = empty(value) || min == null || `${value}`.trim().length >= min;
    return valid ? null : { minLength: min };
};
const maxLength = max => value => {
    const valid = empty(value) || max == null || `${value}`.trim().length <= max;
    return valid ? null : { maxLength: max };
};
const number = number => {
    const valid = empty(number) || !isNaN(+number);
    return valid ? null : { number: true };
};
const decimalFormat = /^\d*\.?\d+$/;
const decimal = number => {
    const valid = empty(number) || !isNaN(+number) && decimalFormat.test(`${number}`);
    return valid ? null : { decimal: true };
};
const intFormat = /^\d+$/;
const integer = number => {
    const valid = empty(number) || !isNaN(+number) && intFormat.test(`${number}`);
    return valid ? null : { integer: true };
};
const min = min => number => {
    const valid = empty(number) || !isNaN(+number) && (min == null || number >= min);
    return valid ? null : { min };
};
const max = max => number => {
    const valid = empty(number) || !isNaN(+number) && (max == null || number <= max);
    return valid ? null : { max };
};
const pattern = re => text => {
    const valid = empty(text) || (re == null || re.test(text));
    return valid ? null : { pattern: `${re}` };
};

exports.decimal = decimal;
exports.email = email;
exports.integer = integer;
exports.max = max;
exports.maxLength = maxLength;
exports.min = min;
exports.minLength = minLength;
exports.number = number;
exports.pattern = pattern;
exports.required = required;
//# sourceMappingURL=validators.js.map
