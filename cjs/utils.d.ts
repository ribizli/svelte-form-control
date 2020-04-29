import { ValidatorFn } from "./validators";
export declare const chainValidators: (validators: ValidatorFn[]) => ValidatorFn;
export declare const validateIterated: <T>(validators: ValidatorFn<T, any>[], fieldValue: T) => import("./validators").ValidationError<any> | null;
