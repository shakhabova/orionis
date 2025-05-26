import { NG_EVENT_PLUGINS } from '@taiga-ui/event-plugins';
import { provideAnimations } from '@angular/platform-browser/animations';
import { importProvidersFrom, type ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { providePrimeNG } from 'primeng/config';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import Aura from '@primeng/themes/aura';
import { authInterceptor } from 'interceptors/auth-interceptor.service';
import { RxReactiveFormsModule } from '@rxweb/reactive-form-validators';

export const appConfig: ApplicationConfig = {
	providers: [
		provideAnimations(),
		provideRouter(routes, withComponentInputBinding(), withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
		provideAnimationsAsync('noop'),
		NG_EVENT_PLUGINS,
		provideHttpClient(withInterceptors([authInterceptor])),
		providePrimeNG({
			theme: {
				preset: Aura,
				options: {
					darkModeSelector: false,
				},
			},
		}),
		importProvidersFrom(RxReactiveFormsModule),
	],
};
