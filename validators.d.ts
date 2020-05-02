export interface ValidationError<D = any> {
    [name: string]: D;
}
export declare type ValidatorFn<T = any, D = any> = (fieldValue: T) => ValidationError<D> | null;
declare type ValidatorFactory<C = unknown, T = any, D = any> = (config: C) => ValidatorFn<T, D>;
export declare const required: ValidatorFn<string | number | boolean, boolean>;
export declare const email: ValidatorFn<string, boolean>;
export declare const minLength: ValidatorFactory<number, string, number>;
export declare const maxLength: ValidatorFactory<number, string, number>;
export declare const number: ValidatorFn<string | number, boolean>;
export declare const decimal: ValidatorFn<string | number, boolean>;
export declare const integer: ValidatorFn<string | number, boolean>;
export declare const min: ValidatorFactory<number, string | number, number>;
export declare const max: ValidatorFactory<number, string | number, number>;
export declare const pattern: ValidatorFactory<RegExp, string, string>;
export {};
