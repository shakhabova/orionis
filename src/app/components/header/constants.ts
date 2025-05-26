import type { HeaderLink } from './header.component';

export const DASHBOARD_LINKS: HeaderLink[] = [
	{
		label: 'Dashboard',
		routerLink: '/dashboard',
		icon: '/assets/icons/Dashboard.svg',
	},
	{
		label: 'Wallets',
		routerLink: '/wallets',
		icon: '/assets/icons/Wallet.svg',
	},
	{
		label: 'Transactions',
		routerLink: '/transactions',
		icon: '/assets/icons/Transactions.svg',
	},
];

export const HOME_PAGE_LINKS: HeaderLink[] = [
	{
		label: 'Home',
		routerLink: '/home-page',
	},
	{
		label: 'Contact',
		routerLink: '/contact-page',
	},
	{
		label: 'About us',
		routerLink: '/about-us',
	},
];
