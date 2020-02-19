import { ValidatorFn } from "./validators";

export const chainValidators: (validators: ValidatorFn[]) => ValidatorFn = validators => {
	if (!Array.isArray(validators)) return (value: any) => null;
	return fieldValue => {
		for (const validator of validators) {
			const result = validator(fieldValue);
			if (result) return result;
    }
    return null;
	}
}

export const validateIterated = <T>(validators: ValidatorFn<T>[], fieldValue: T) => {
	if (!Array.isArray(validators)) return null;
		for (const validator of validators) {
			if (typeof validator === 'function') {
        try {
					const result = validator(fieldValue);
					if (result != null) return result;
        } catch (e) {
          console.error(`validator error`, validator, e);
        }
      }
    }
    return null;
}
