import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { RxwebValidators } from '@rxweb/reactive-form-validators';

export const PASSWORDS_NOT_EQUAL = 'passwordsNotEqual';

export function firstNameValidator(
	minLength: number,
	maxLength: number,
): (control: AbstractControl) => ValidationErrors | null {
	return (control) => {
		if (!control?.value) {
			return null;
		}

		return control?.value?.length < minLength || control?.value?.length > maxLength
			? { firstName: 'Please enter a valid first name' }
			: null;
	};
}

export function lastNameValidator(
	minLength: number,
	maxLength: number,
): (control: AbstractControl) => ValidationErrors | null {
	return (control) => {
		if (!control?.value) {
			return null;
		}

		return control?.value?.length < minLength || control?.value?.length > maxLength
			? { lastName: 'Please enter a valid last name' }
			: null;
	};
}

export function confirmPasswordValidator(control: AbstractControl): ValidationErrors | null {
	return control.value.password === control.value.repeatPassword
		? null
		: { [PASSWORDS_NOT_EQUAL]: 'Passwords do not match' };
}

export function getPasswordValidator() {
	return RxwebValidators.password({
		validation: { minLength: 6, digit: true, specialCharacter: true, upperCase: true, lowerCase: true },
		message: {
			minLength: 'minLength',
			digit: 'digit',
			specialCharacter: 'specialCharacter',
			upperCase: 'upperCase',
			lowerCase: 'lowerCase',
		},
	});
}
