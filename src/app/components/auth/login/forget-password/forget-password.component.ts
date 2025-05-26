import { Component, computed, DestroyRef, inject, linkedSignal, model, signal } from '@angular/core';
import { FormControl, FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TuiError, TuiLabel, TuiTextfield } from '@taiga-ui/core';
import { TUI_VALIDATION_ERRORS, TuiFieldErrorPipe, TuiInputPassword } from '@taiga-ui/kit';
import { TuiInputModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { PasswordCriteriaComponent } from 'components/shared/password-criteria/password-criteria.component';
import { LoginApiService, LoginChallengeResponse, SubmitResetPasswordRequest } from 'services/login-api.service';
import { confirmPasswordValidator, getPasswordValidator } from 'utils/validators';
import { OtpCodeInputComponent } from '../../shared/otp-code-input/otp-code-input.component';
import { AsyncPipe } from '@angular/common';
import { finalize, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { DialogService } from 'services/dialog.service';
import { LoaderComponent } from '../../../shared/loader/loader.component';
import { explicitEffect } from 'ngxtension/explicit-effect';
import { TuiAutoFocus } from '@taiga-ui/cdk';

@Component({
	selector: 'app-forget-password',
	imports: [
		TuiLabel,
		TuiInputModule,
		TuiTextfieldControllerModule,
		ReactiveFormsModule,
		TuiInputPassword,
		TuiTextfield,
		PasswordCriteriaComponent,
		OtpCodeInputComponent,
		FormsModule,
		TuiError,
		TuiFieldErrorPipe,
		AsyncPipe,
		LoaderComponent,
		TuiAutoFocus,
	],
	templateUrl: './forget-password.component.html',
	styleUrl: './forget-password.component.css',
	providers: [
		{
			provide: TUI_VALIDATION_ERRORS,
			useValue: {
				email: 'Please enter a valid email, e.g., name@example.com',
				required: 'Value is required',
			},
		},
	],
})
export class ForgetPasswordComponent {
	private fb = inject(NonNullableFormBuilder);
	private router = inject(Router);
	private loginApiService = inject(LoginApiService);
	private dialogService = inject(DialogService);
	private destroyRef = inject(DestroyRef);

	public otpCode = model<string>('');
	public readonly codeLength = 6;
	public errorMessage = signal<string | null>(null);
	public loading = signal(false);
	public isSaveDisabled = linkedSignal(
		() => this.otpCode()?.length !== this.codeLength || this.formStatus() === 'INVALID' || !!this.errorMessage(),
	);

	public email = new FormControl('', [Validators.required, Validators.email]);
	public phase = signal<'email' | 'password'>('email');

	protected formGroup = this.fb.group(
		{
			password: ['', [Validators.required, Validators.minLength(6), getPasswordValidator()]],
			repeatPassword: ['', [Validators.required, getPasswordValidator()]],
		},
		{ validators: [confirmPasswordValidator] },
	);

	private challenge?: LoginChallengeResponse;
	private formStatus = toSignal(this.formGroup.statusChanges);

	constructor() {
		explicitEffect([this.otpCode], () => {
			this.errorMessage.set('');
		});
	}

	continue() {
		const email = this.email.value;
		if (this.email.invalid || !email) {
			return;
		}

		this.loading.set(true);
		this.loginApiService
			.challenge(email)
			.pipe(
				tap((challenge) => (this.challenge = challenge)),
				switchMap(() => this.loginApiService.resetPassword(email)),
				takeUntilDestroyed(this.destroyRef),
				finalize(() => this.loading.set(false)),
			)
			.subscribe({
				next: () => this.phase.set('password'),
				error: (err) => {
					switch (err.error?.code) {
						case 'resource_missing':
						case 'data_not_found':
							this.dialogService
								.showInfo({
									type: 'warning',
									title: 'Error',
									text: 'The specified user could not be found',
								})
								.subscribe();
							break;
						default:
							this.dialogService
								.showInfo({
									type: 'warning',
									title: 'Error',
									text: 'An unexpected error has appeared. Please try again later.',
								})
								.subscribe();
					}
				},
			});
	}

	backToSignIn() {
		this.router.navigate(['/auth/login'], { replaceUrl: true });
	}

	save() {
		const email = this.email.value;
		if (!email || !this.challenge || this.formGroup.invalid) {
			return;
		}

		const request: SubmitResetPasswordRequest = {
			email,
			otp: this.otpCode(),
			salt: this.challenge.salt,
			b: this.challenge.b,
			password: this.formGroup.getRawValue().password,
		};

		this.loading.set(true);
		this.loginApiService
			.submitResetPassword(request)
			.pipe(
				takeUntilDestroyed(this.destroyRef),
				finalize(() => this.loading.set(false)),
			)
			.subscribe({
				next: () => {
					this.dialogService
						.showInfo({
							type: 'success',
							title: 'Congratulations!',
							text: 'Your password reset successfully',
							buttonText: 'Back to sign in',
						})
						.subscribe(() => this.backToSignIn());
				},
				error: (err) => {
					switch (err.error?.code) {
						case 'invalid_confirmation_code':
							this.errorMessage.set('Invalid verification code');
							break;
						default:
							this.dialogService
								.showInfo({
									type: 'warning',
									title: 'Error',
									text: 'An unexpected error has appeared. Please try again later.',
								})
								.subscribe();
					}
				},
			});
	}
}
