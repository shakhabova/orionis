import { AsyncPipe } from '@angular/common';
import { injectContext } from '@taiga-ui/polymorpheus';
import { Component, DestroyRef, inject, linkedSignal, model, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RxwebValidators, email } from '@rxweb/reactive-form-validators';
import { TuiAutoFocus } from '@taiga-ui/cdk';
import { TuiDialogContext, TuiError, TuiLabel, TuiLoader, TuiTextfield } from '@taiga-ui/core';
import { TuiFieldErrorPipe, TuiInputPassword } from '@taiga-ui/kit';
import { TuiInputModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { OtpCodeInputComponent } from 'components/auth/shared/otp-code-input/otp-code-input.component';
import { LoaderComponent } from 'components/shared/loader/loader.component';
import { PasswordCriteriaComponent } from 'components/shared/password-criteria/password-criteria.component';
import { explicitEffect } from 'ngxtension/explicit-effect';
import { finalize, switchMap, tap } from 'rxjs';
import { DialogService } from 'services/dialog.service';
import { LoginApiService, LoginChallengeResponse, SubmitResetPasswordRequest } from 'services/login-api.service';
import { UserService } from 'services/user.service';
import { confirmPasswordValidator, getPasswordValidator } from 'utils/validators';
import { AuthService } from 'services/auth.service';

@Component({
	selector: 'app-change-password',
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
		TuiLoader,
	],
	templateUrl: './change-password.component.html',
	styleUrl: './change-password.component.css',
})
export class ChangePasswordComponent {
	private fb = inject(NonNullableFormBuilder);
	private authService = inject(AuthService);
	private loginApiService = inject(LoginApiService);
	private dialogService = inject(DialogService);
	private destroyRef = inject(DestroyRef);
	private userService = inject(UserService);
	public readonly context = injectContext<TuiDialogContext<void, void>>();

	otpCode = model('');
	readonly codeLength = 6;

	public errorMessage = signal<string | null>(null);
	public loading = signal(false);
	public isSaveDisabled = linkedSignal(
		() => this.otpCode()?.length !== this.codeLength || this.formStatus() === 'INVALID' || !!this.errorMessage(),
	);

	protected formGroup = this.fb.group(
		{
			password: ['', [Validators.required, Validators.minLength(6), getPasswordValidator()]],
			repeatPassword: ['', [Validators.required, getPasswordValidator()]],
		},
		{ validators: [confirmPasswordValidator] },
	);

	private formStatus = toSignal(this.formGroup.statusChanges);
	private challenge?: LoginChallengeResponse;

	constructor() {
		explicitEffect([this.otpCode], () => {
			this.errorMessage.set('');
		});

		explicitEffect([this.loading], ([isLoading]) => {
			if (isLoading) {
				this.formGroup.disable();
			} else {
				this.formGroup.enable();
			}
		});
	}

	public get email(): string {
		const email = this.userService.currentUser$.value?.email;
		if (!email) {
			throw new Error('current user should be present');
		}

		return email;
	}

	ngOnInit() {
		this.initResetData();
	}

	save() {
		this.formGroup.updateValueAndValidity();
		if (this.formGroup.invalid || !this.challenge) {
			return;
		}

		const request: SubmitResetPasswordRequest = {
			email: this.email,
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
						})
						.subscribe(() => {
							this.context.completeWith();
						});
				},
				error: (err) => {
					switch (err.error?.code) {
						case 'invalid_confirmation_code':
							this.errorMessage.set('Invalid verification code');
							break;
						case 'invalid_new_password':
							this.dialogService
								.showInfo({
									type: 'warning',
									title: 'Error',
									text: 'The password you have entered is the same as your old one. Please consider another password.',
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

	private initResetData() {
		this.loading.set(true);
		this.loginApiService
			.challenge(this.email)
			.pipe(
				tap((challenge) => (this.challenge = challenge)),
				switchMap(() => this.loginApiService.resetPassword(this.email)),
				takeUntilDestroyed(this.destroyRef),
				finalize(() => this.loading.set(false)),
			)
			.subscribe({
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
}
