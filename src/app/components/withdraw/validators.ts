import type { ValidatorFn, AbstractControl, Validators } from '@angular/forms';

export function addressPatternValidator(regex: RegExp): ValidatorFn {
	return (field: AbstractControl): Validators | null => {
		return field.value && regex.test(field.value)
			? null
			: {
					other: 'Only digits and letters are allowed',
				};
	};
}

export function amountMinValidator(field: AbstractControl): Validators | null {
	return field.value && Number.parseFloat(field.value) > 0
		? null
		: {
				other: 'Only valid numbers greater than 0 are allowed',
			};
}

export function amountPatternValidator(field: AbstractControl): Validators | null {
	return field.value && /^[0-9]+$|^[0-9]+\.{0,1}[0-9]+$/.test(field.value)
		? null
		: {
				other: 'Only valid numbers greater than 0 are allowed',
			};
}
