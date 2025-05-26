import { Component, DestroyRef, inject, INJECTOR, model, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TuiDialogService, type TuiDialogContext } from '@taiga-ui/core';
import { injectContext, PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { explicitEffect } from 'ngxtension/explicit-effect';
import { finalize, from } from 'rxjs';
import { DialogService } from 'services/dialog.service';
import { type AuthenticateResponse, LoginApiService } from 'services/login-api.service';
import { OtpCodeInputComponent } from '../otp-code-input/otp-code-input.component';
import { MfaApiService } from 'services/mfa-api.service';
import { EmailOtpCodeComponent } from '../email-otp-code/email-otp-code.component';

export interface MfaOtpModalData {
	email: string;
}

@Component({
	selector: 'app-mfa-otp-code',
	imports: [OtpCodeInputComponent],
	templateUrl: './mfa-otp-code.component.html',
	styleUrl: './mfa-otp-code.component.css',
})
export class MfaOtpCodeComponent {
	private loginService = inject(LoginApiService);
	private mfaService = inject(MfaApiService);
	private destroyRef = inject(DestroyRef);
	private router = inject(Router);
	private dialogService = inject(DialogService);
	private tuiDialogs = inject(TuiDialogService);
	private injector = inject(INJECTOR);

	public readonly context = injectContext<TuiDialogContext<AuthenticateResponse | null, MfaOtpModalData>>();

	protected otpCode = model('');
	protected errorMessage = signal('');
	protected loading = signal(false);

	constructor() {
		explicitEffect([this.otpCode], ([otpCode]) => {
			if (otpCode.length === 6) {
				this.sendOtpCode();
			} else {
				this.errorMessage.set('');
			}
		});
	}

	get email() {
		return this.context.data.email;
	}

	closeModal() {
		this.context.completeWith(null);
	}

	recover() {
		if (this.email) {
			this.mfaService
				.resetMfa(this.email)
				.pipe(takeUntilDestroyed(this.destroyRef))
				.subscribe(() => {
					this.showEmailOTPModal();
				});
		}
		// this.mfaService.resetMfa(this.context.data.email)
		//   .pipe(
		//     takeUntilDestroyed(this.destroyRef),
		//   )
		//   .subscribe(mfaQR => )
	}

	private showEmailOTPModal(): void {
		const getRequest = (otp: string) => this.mfaService.submitResetMfa({ email: this.email, otp });

		const otpDialog = this.tuiDialogs.open<string>(new PolymorpheusComponent(EmailOtpCodeComponent, this.injector), {
			data: {
				email: this.email,
				requestGetter: getRequest,
				codeLength: 8,
				errorButtonText: 'Back to sign in',
			},
		});

		otpDialog.subscribe((result) => {
			if (!result) {
				return;
			}

			this.router.navigateByUrl('/auth/mfa-connect', {
				state: { mfaQR: result },
			});
		});
	}

	private sendOtpCode() {
		this.loading.set(true);

		this.loginService
			.sendMfaOtpCode(this.otpCode(), this.context.data.email)
			.pipe(
				takeUntilDestroyed(this.destroyRef),
				finalize(() => this.loading.set(false)),
			)
			.subscribe({
				next: (response) => this.context.completeWith(response),
				error: (err) => {
					if (err.error?.code === 'invalid_otp') {
						this.errorMessage.set('Invalid verification code');
					}

					this.dialogService
						.showInfo({
							type: 'warning',
							title: 'Error',
							text: 'An unexpected error has appeared. Please try again later.',
						})
						.subscribe();
				},
			});
	}
}
