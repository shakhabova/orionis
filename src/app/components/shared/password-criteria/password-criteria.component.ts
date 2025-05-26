import { Component, computed, input, type Signal } from '@angular/core';
import { TuiIcon } from '@taiga-ui/core';

interface PasswordCriteriaModel {
	length: boolean;
	uppercase: boolean;
	lowercase: boolean;
	number: boolean;
	char: boolean;
}

@Component({
	selector: 'app-password-criteria',
	imports: [TuiIcon],
	templateUrl: './password-criteria.component.html',
	styleUrl: './password-criteria.component.css',
})
export class PasswordCriteriaComponent {
	password = input.required<string>();

	passwordCriteriaPassed: Signal<PasswordCriteriaModel> = computed(() => {
		const password = this.password();
		return {
			length: password ? password.length > 5 : false,
			uppercase: password ? new RegExp(/[A-ZА-Я]+/).test(password) : false,
			lowercase: password ? new RegExp(/[a-zа-я]+/).test(password) : false,
			number: new RegExp(/[0-9]/).test(password ?? ''),
			char: new RegExp(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi).test(password ?? ''),
		};
	});
	passwordCriteriaIcons: Signal<{
		[key in keyof PasswordCriteriaModel]: string;
	}> = computed(() => {
		const criteria = this.passwordCriteriaPassed();
		const icons = ['@tui.check', '@tui.dot'];
		return {
			length: criteria.length ? icons[0] : icons[1],
			uppercase: criteria.uppercase ? icons[0] : icons[1],
			lowercase: criteria.lowercase ? icons[0] : icons[1],
			number: criteria.number ? icons[0] : icons[1],
			char: criteria.char ? icons[0] : icons[1],
		};
	});
}
