import type { Route } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import { AskForMfaComponent } from './login/ask-for-mfa/ask-for-mfa.component';
import { ForcePasswordChangeComponent } from './login/force-password-change/force-password-change.component';
import { MfaConnectComponent } from './login/mfa-connect/mfa-connect.component';
import { ForgetPasswordComponent } from './login/forget-password/forget-password.component';

export const routes: Route[] = [
	{ path: 'login', component: LoginComponent, title: 'Sign in' },
	{ path: 'sign-up', component: SignUpComponent, title: 'Sign up' },
	{ path: 'two-factor-auth', component: AskForMfaComponent, title: 'Two-Factor Authentication' },
	{ path: 'mfa-connect', component: MfaConnectComponent, title: 'Two-Factor Authentication' },
	{ path: 'force-change-password', component: ForcePasswordChangeComponent, title: 'Set new password' },
	{ path: 'forget-password', component: ForgetPasswordComponent, title: 'Forgot password' },
	{
		path: '**',
		redirectTo: '/auth/login',
	},
];
