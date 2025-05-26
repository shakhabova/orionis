import { Component, DestroyRef, INJECTOR, type OnInit, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TuiDialogService } from '@taiga-ui/core';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { DialogService } from 'services/dialog.service';
import { MfaApiService } from 'services/mfa-api.service';
import { UserService } from 'services/user.service';
import { LoaderComponent } from '../../../shared/loader/loader.component';
import { EmailOtpCodeComponent } from 'components/auth/shared/email-otp-code/email-otp-code.component';
import { finalize } from 'rxjs';

@Component({
	selector: 'app-ask-for-mfa',
	imports: [LoaderComponent],
	templateUrl: './ask-for-mfa.component.html',
	styleUrl: './ask-for-mfa.component.css',
})
export class AskForMfaComponent implements OnInit {
	private mfaApiService = inject(MfaApiService);
	private destroyRef = inject(DestroyRef);
	private readonly tuiDialogs = inject(TuiDialogService);
	private readonly injector = inject(INJECTOR);
	private router = inject(Router);
	private userService = inject(UserService);
	private dialogService = inject(DialogService);

	protected readonly loading = signal(false);
	public email = input<string>();
	public mfaQR = input<string>();

	ngOnInit(): void {
		if (!this.email()) {
			this.router.navigateByUrl('/auth/login');
			return;
		}
	}

	enable() {
		const qr = this.mfaQR();
		if (qr) {
			this.goToMfaConnect(qr);
			return;
		}

		this.loading.set(true);
		const email = this.email();
		if (email) {
			this.mfaApiService
				.resetMfa(email)
				.pipe(
					takeUntilDestroyed(this.destroyRef),
					finalize(() => this.loading.set(false)),
				)
				.subscribe({
					next: () => {
						this.showOTPModal();
					},
					error: (err) => {
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

	private showOTPModal(): void {
		const email = this.email();
		if (!email) {
			return;
		}

		const getRequest = (otp: string) => this.mfaApiService.submitResetMfa({ email, otp });

		const otpDialog = this.tuiDialogs.open<string>(new PolymorpheusComponent(EmailOtpCodeComponent, this.injector), {
			data: {
				email,
				requestGetter: getRequest,
				codeLength: 8,
				errorButtonText: 'Back to sign in',
			},
		});

		otpDialog.subscribe((result) => {
			if (!result) {
				return;
			}

			this.goToMfaConnect(result);
		});
	}

	private goToMfaConnect(mfaQR: string) {
		this.router.navigateByUrl('/auth/mfa-connect', { state: { mfaQR } });
	}
}
