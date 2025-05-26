import type { Routes } from '@angular/router';
import { AuthComponent } from './components/auth/auth.component';
import { LayoutComponent } from './components/layout/layout.component';
import { authGuard } from 'guards/auth.guard';

export const routes: Routes = [
	{
		path: '',
		component: LayoutComponent,
		children: [
			{
				path: 'dashboard',
				loadComponent: () => import('./components/dashboard/dashboard.component').then((m) => m.DashboardComponent),
				title: 'Dashboard',
				canActivate: [authGuard],
			},
			{
				path: 'wallets',
				loadChildren: () => import('./components/wallets-page/wallets-page.routes').then((m) => m.routes),
				title: 'Wallets',
				canActivate: [authGuard],
			},
			{
				path: 'transactions',
				loadComponent: () =>
					import('./components/transactions-page/transactions-page.component').then((m) => m.TransactionsPageComponent),
				title: 'Transactions',
				canActivate: [authGuard],
			},
			{
				path: 'home-page',
				loadComponent: () => import('./components/home-page/home-page.component').then((m) => m.HomePageComponent),
				title: 'Home',
			},
			{
				path: 'contact-page',
				loadComponent: () =>
					import('./components/home-page/contact-page/contact-page.component').then((m) => m.ContactPageComponent),
				title: 'Contact Us',
			},
			{
				path: 'about-us',
				loadComponent: () =>
					import('./components/home-page/about-us/about-us.component').then((m) => m.AboutUsComponent),
				title: 'About Us',
			},
			{
				path: '',
				pathMatch: 'full',
				redirectTo: '/home-page',
			},
		],
	},
	{
		path: 'auth',
		component: AuthComponent,
		title: 'Sign in',
		loadChildren: () => import('./components/auth/auth.routes').then((m) => m.routes),
	},
];
