import { ValidatorFn } from "./validators";
export declare const chainValidators: (validators: ValidatorFn[]) => ValidatorFn;
export declare const validateIterated: <T>(validators: ValidatorFn<T>[], fieldValue: T) => string | null;
