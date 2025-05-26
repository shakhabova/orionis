import { Component, DestroyRef, inject, model } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { tuiDialog, type TuiDialogContext, TuiIcon, TuiTextfield } from '@taiga-ui/core';
import { TuiSwitch } from '@taiga-ui/kit';
import { TuiInputComponent, TuiInputModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { injectContext } from '@taiga-ui/polymorpheus';
import { filter, map, of, switchMap } from 'rxjs';
import { AuthService } from 'services/auth.service';
import { DialogService } from 'services/dialog.service';
import { MfaApiService } from 'services/mfa-api.service';
import { UserService } from 'services/user.service';
import { ChangePasswordComponent } from './change-password/change-password.component';

@Component({
	selector: 'app-user-profile',
	imports: [TuiInputModule, FormsModule, TuiTextfield, TuiTextfieldControllerModule, TuiSwitch, TuiIcon],
	templateUrl: './user-profile.component.html',
	styleUrl: './user-profile.component.css',
})
export class UserProfileComponent {
	private usersService = inject(UserService);
	private destroyRef = inject(DestroyRef);
	private router = inject(Router);
	public readonly context = injectContext<TuiDialogContext<void, void>>();
	private authService = inject(AuthService);
	private dialogService = inject(DialogService);
	private mfaService = inject(MfaApiService);

	private changePasswordDialog = tuiDialog(ChangePasswordComponent, { size: 'auto' });

	name = model('');
	email = model('');
	phone = model('');
	googleAuth = model(true);

	private userId?: number;

	ngOnInit() {
		this.usersService.currentUser$
			.pipe(
				filter((info) => !!info),
				takeUntilDestroyed(this.destroyRef),
			)
			.subscribe((info) => {
				this.name.set(`${info.firstName} ${info.lastName}`);
				this.email.set(info.email);
				this.phone.set(info.phoneNumber);
				this.googleAuth.set(info.mfaStatus === 'ACTIVATED');
				this.userId = info.id;
			});
	}

	googleAuthChanged() {
		if (!this.googleAuth()) {
			this.dialogService
				.confirm({
					text: 'Are you sure you want to deactivate Google Authenticator?',
				})
				.pipe(
					switchMap((confirm) => {
						if (!confirm) {
							this.googleAuth.set(true);
							return of(null);
						}

						if (!this.userId) {
							return of(null);
						}

						return this.mfaService.rejectMfa(this.email(), this.userId).pipe(map(() => true));
					}),
				)
				.subscribe({
					next: (result) => {
						if (result) {
							this.usersService.updateCurrentUser();
							this.dialogService
								.showInfo({
									type: 'success',
									title: 'Congratulations!',
									text: 'Your Google Authenticator has been disabled successfully',
								})
								.subscribe();
						}
					},
					error: (err) => {
						console.error(err);
						this.googleAuth.set(true);
						this.dialogService
							.showInfo({
								type: 'warning',
								title: 'Error',
								text: 'An unexpected error has appeared. Please try again later.',
							})
							.subscribe();
					},
				});
		} else {
			this.context.completeWith();
			this.router.navigate(['/auth/two-factor-auth'], { queryParams: { email: this.email() } });
		}
	}

	logOut() {
		this.authService.logout();
		this.context.completeWith();
	}

	changePassword() {
		this.changePasswordDialog().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
	}
}
