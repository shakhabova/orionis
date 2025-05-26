import { Component, type OnInit, computed, inject, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TuiLabel } from '@taiga-ui/core';
import { TuiCheckbox } from '@taiga-ui/kit';
import QrcodeDecoder from 'qrcode-decoder';
import { from, Observable, of } from 'rxjs';

@Component({
	selector: 'app-mfa-connect',
	imports: [FormsModule, TuiLabel, TuiCheckbox],
	templateUrl: './mfa-connect.component.html',
	styleUrl: './mfa-connect.component.css',
})
export class MfaConnectComponent implements OnInit {
	private router = inject(Router);

	protected mfaAdded = model(false);
	protected isMobileAppsPage = signal(true);
	protected displayBack = computed(() => !this.isMobileAppsPage());
	protected displayNext = computed(() => this.isMobileAppsPage());

	mfaQR = this.router.getCurrentNavigation()?.extras.state?.['mfaQR'];

	private qrDecoder = new QrcodeDecoder();
	mfaQrCode?: Observable<string>;

	ngOnInit(): void {
		if (!this.mfaQR) {
			this.goToLogin();
		} else {
			this.mfaQrCode = from(
				this.qrDecoder.decodeFromImage(this.mfaQR).then((result) => {
					const url = result?.data ?? '';
					if (!url) {
						return '';
					}
					return new URL(url).searchParams.get('secret') ?? '';
				}),
			);
		}
	}

	goNext() {
		this.isMobileAppsPage.set(false);
	}

	goBack() {
		this.isMobileAppsPage.set(true);
	}

	done() {
		this.goToLogin();
	}

	async copySecret() {
		this.mfaQrCode?.subscribe(async (code) => {
			if (code) {
				await navigator.clipboard.writeText(code);
			}
		});
	}

	private goToLogin() {
		this.router.navigateByUrl('/auth/login');
	}
}
