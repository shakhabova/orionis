import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TuiLabel, TuiTextfield } from '@taiga-ui/core';
import { TuiInputPassword } from '@taiga-ui/kit';
import { TuiInputModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { PasswordCriteriaComponent } from 'components/shared/password-criteria/password-criteria.component';
import { LoginApiService } from 'services/login-api.service';
import { confirmPasswordValidator, getPasswordValidator } from 'utils/validators';

@Component({
	selector: 'app-force-password-change',
	imports: [
		TuiLabel,
		TuiInputModule,
		TuiTextfieldControllerModule,
		ReactiveFormsModule,
		TuiInputPassword,
		TuiTextfield,
		PasswordCriteriaComponent,
	],
	templateUrl: './force-password-change.component.html',
	styleUrl: './force-password-change.component.css',
})
export class ForcePasswordChangeComponent {
	private fb = inject(NonNullableFormBuilder);
	private loginApiService = inject(LoginApiService);
	private router = inject(Router);

	private email = this.router.getCurrentNavigation()?.extras?.state?.['email'];

	protected formGroup = this.fb.group(
		{
			password: ['', [Validators.required, Validators.minLength(6), getPasswordValidator()]],
			repeatPassword: ['', [Validators.required, getPasswordValidator()]],
		},
		{ validators: [confirmPasswordValidator] },
	);

	save() {
		if (!this.email) {
			return;
		}

		this.loginApiService
			.forceChangePassword(this.email, this.formGroup.getRawValue().repeatPassword)
			.subscribe((response) => {
				this.router.navigateByUrl('/auth/mfa-connect', {
					state: { mfaQR: response.data, email: this.email },
				});
			});
	}
}
