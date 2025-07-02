import { Component, type OnInit, computed, inject, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TuiLabel } from '@taiga-ui/core';
import { TuiCheckbox } from '@taiga-ui/kit';
import { CopyIconComponent } from "../../../shared/copy-icon/copy-icon.component";

@Component({
	selector: 'app-mfa-connect',
	imports: [FormsModule, TuiLabel, TuiCheckbox, CopyIconComponent],
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
	secret = this.router.getCurrentNavigation()?.extras.state?.['secret'];

	ngOnInit(): void {
		if (!this.mfaQR) {
			this.goToLogin();
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
		await navigator.clipboard.writeText(this.secret);
	}

	private goToLogin() {
		this.router.navigateByUrl('/auth/login');
	}
}
