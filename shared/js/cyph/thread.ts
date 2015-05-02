module Cyph {
	export class Thread {
		private static BlobBuilder: any	= Util.getValue(self, [
			'BlobBuilder',
			'WebKitBlobBuilder',
			'MozBlobBuilder'
		]);

		private static stringifyFunction (f: Function) : string {
			let s: string	= f.toString();
			return s.slice(s.indexOf('{'));
		}

		private static threadEnvSetup (vars: any, importScripts: Function) : void {
			location	= vars.location;
			navigator	= vars.navigator;

			/* Wrapper to make importScripts work in local dev environments;
				not used in prod because of WebSign packing */
			let oldImportScripts	= importScripts;
			importScripts			= (script: string) => {
				oldImportScripts(
					`${location.protocol}//${location.host}` +
					script
				);
			};

			importScripts('/js/global/base.js');

			console	= {
				assert: () => {},
				clear: () => {},
				count: () => {},
				debug: () => {},
				dir: () => {},
				dirxml: () => {},
				error: () => {},
				exception: () => {},
				group: () => {},
				groupCollapsed: () => {},
				groupEnd: () => {},
				info: () => {},
				log: () => {},
				markTimeline: () => {},
				msIsIndependentlyComposed: () => false,
				profile: () => {},
				profiles: () => {},
				profileEnd: () => {},
				select: () => {},
				show: () => {},
				table: () => {},
				time: () => {},
				timeEnd: () => {},
				timeline: () => {},
				timelineEnd: () => {},
				timeStamp: () => {},
				trace: () => {},
				warn: () => {}
			};

			if (typeof atob === 'undefined' || typeof btoa === 'undefined') {
				importScripts('/lib/bower_components/base64/base64.min.js');
			}

			if (typeof crypto === 'undefined') {
				if (typeof msCrypto !== 'undefined') {
					crypto	= msCrypto;
				}
				else {
					let isaac: any;
					importScripts('/cryptolib/bower_components/isaac.js/isaac.js');
					isaac	= isaac || self['isaac'];

					isaac.seed(vars.threadRandomSeed);

					crypto	= {
						getRandomValues: array => {
							let bytes: number	=
								'BYTES_PER_ELEMENT' in array ?
									array['BYTES_PER_ELEMENT'] :
									4
							;

							let max: number	= Math.pow(2, bytes * 8) - 1;

							for (let i = 0 ; i < array['length'] ; ++i) {
								array[i]	= Math.floor(isaac.random() * max);
							}

							return array;
						},

						subtle: null
					};
				}
			}
		}

		private static threadPostSetup () : void {
			if (!self.onmessage) {
				self.onmessage	= onthreadmessage;
			}
		}

		public static threads: Thread[]	= [];

		public static callMainThread (method: string, args: any[] = []) : void {
			if (Env.isMainThread) {
				let methodSplit: string[]	= method.split('.');
				let methodName: string		= methodSplit.slice(-1)[0];

				let methodObject: any	= methodSplit.
					slice(0, -1).
					reduce((o: any, k: string) => o[k], self)
				;

				/* Validate command against namespace whitelist, then execute */
				if (['Cyph', 'ui'].indexOf(methodSplit[0]) > -1) {
					methodObject[methodName].apply(methodObject, args);
				}
				else {
					throw new Error(method + ' not in whitelist. (args: ' + JSON.stringify(args) + ')');
				}
			}
			else {
				EventManager.trigger(EventManager.mainThreadEvents, {method, args});
			}
		}


		private worker: Worker;

		public isAlive () : boolean {
			return !!this.worker;
		}

		public postMessage (o: any) : void {
			if (this.worker) {
				this.worker.postMessage(o);
			}
		}

		public stop () : void {
			if (this.worker) {
				this.worker.terminate();
			}

			this.worker	= null;

			Thread.threads	= Thread.threads.filter(t => t !== this);
		}

		public constructor (f: Function, vars: any = {}, onmessage: (e: MessageEvent) => any = e => {}) {
			vars.location	= location;
			vars.navigator	= {language: Env.language, userAgent: Env.userAgent};

			vars.threadRandomSeed	= crypto.getRandomValues(new Uint8Array(50000));

			let threadBody: string	=
				'var vars = ' + JSON.stringify(vars) + ';\n' +
				Thread.stringifyFunction(Thread.threadEnvSetup) +
				Thread.stringifyFunction(f) +
				Thread.stringifyFunction(Thread.threadPostSetup)
			;

			try {
				let blob: Blob;
				let blobUrl: string;

				try {
					blob	= new Blob([threadBody], {type: 'application/javascript'});
				}
				catch (_) {
					let blobBuilder	= new Thread.BlobBuilder();
					blobBuilder.append(threadBody);

					blob	= blobBuilder.getBlob();
				}

				try {
					blobUrl		= URL.createObjectURL(blob);
					this.worker	= new Worker(blobUrl);
				}
				catch (err) {
					this.worker.terminate();
					throw err;
				}
				finally {
					try {
						URL.revokeObjectURL(blobUrl);
					}
					catch (_) {}
				}
			}
			catch (_) {
				this.worker	= new Worker(Config.webSignConfig.workerHelper);
				this.worker.postMessage(threadBody);
			}


			this.worker.onmessage	= (e: MessageEvent) => {
				if (Util.getValue(e.data, 'isThreadEvent')) {
					EventManager.trigger(e.data.event, e.data.data);
				}
				else {
					onmessage(e);
				}
			};

			Thread.threads.push(this);
		}
	}
}