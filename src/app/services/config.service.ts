import { DestroyRef, inject, Injectable, NgZone, signal } from '@angular/core';
import { environment } from '../../environment/environment';
import { fromEvent, map, startWith, takeUntil } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

const MOBILE_MAX_WIDTH = 575;

@Injectable({ providedIn: 'root' })
export class ConfigService {
	private ngZone = inject(NgZone);
	private destroyRef = inject(DestroyRef);

	public serverUrl: string = environment.serverUrl;
	public s3BucketLink: string = environment.s3BucketLink;

	public isMobile = signal(false);

	constructor() {
		this.ngZone.runOutsideAngular(() => {
			fromEvent(window, 'resize')
				.pipe(
					map(() => document.body.clientWidth),
					startWith(document.body.clientWidth),
					takeUntilDestroyed(this.destroyRef),
				)
				.subscribe((width) => this.ngZone.run(() => this.isMobile.set(width <= MOBILE_MAX_WIDTH)));
		});
	}
}
