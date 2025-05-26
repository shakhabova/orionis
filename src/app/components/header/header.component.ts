import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { tuiDialog, TuiIcon } from '@taiga-ui/core';
import { ConfigService } from 'services/config.service';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { AuthService } from 'services/auth.service';
import { DASHBOARD_LINKS, HOME_PAGE_LINKS } from './constants';
import { AsyncPipe } from '@angular/common';
import { UserService } from 'services/user.service';
import { map } from 'rxjs';

export interface HeaderLink {
	routerLink: string;
	icon?: string;
	label: string;
}

@Component({
	selector: 'app-header',
	imports: [RouterModule, TuiIcon, AsyncPipe],
	templateUrl: './header.component.html',
	styleUrl: './header.component.css',
})
export class HeaderComponent {
	public configService = inject(ConfigService);
	public isHomePage = input(true);
	private userService = inject(UserService);

	abbreviate$ = this.userService.currentUser$.pipe(
		map((user) => `${user?.firstName[0]}${user?.lastName[0]}`.toUpperCase()),
	);

	private dialog = tuiDialog(UserProfileComponent, { size: 'auto' });
	public authService = inject(AuthService);

	public activeLinks = computed(() => (this.isHomePage() ? HOME_PAGE_LINKS : DASHBOARD_LINKS));

	isMobileMenuOpened = signal(false);

	mobileMenuToggle() {
		this.isMobileMenuOpened.update((opened) => !opened);
	}

	openUserProfile() {
		this.dialog().subscribe();
	}
}
