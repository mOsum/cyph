module Cyph {
	export module Crypto {
		/**
		 * The Castle encryption protocol. This version includes an OTR-like
		 * feature set, with group/async/persistence coming later.
		 */
		export class Castle {
			private static sodium: any	= self['sodium'];

			private static emptyNonce: Uint8Array	= new Uint8Array(
				Castle.sodium.crypto_secretbox_NONCEBYTES
			);

			private static emptySalt: Uint8Array	= new Uint8Array(
				Castle.sodium.crypto_pwhash_scryptsalsa208sha256_SALTBYTES
			);


			private keyPairs: { publicKey: Uint8Array; privateKey: Uint8Array; }[]	= [];
			private friendKeys: Uint8Array[]	= [];
			private isAborted: boolean			= false;
			private isConnected: boolean		= false;
			private shouldRatchetKeys: boolean	= true;

			private abort () : void {
				this.isAborted		= true;
				this.isConnected	= false;

				this.handlers.abort();
			}

			private generateKeyPair () : Uint8Array {
				this.keyPairs.unshift(Castle.sodium.crypto_box_keypair());

				if (this.keyPairs.length > 2) {
					const oldKeyPair	= this.keyPairs.pop();

					Castle.sodium.memzero(oldKeyPair.privateKey);
					Castle.sodium.memzero(oldKeyPair.publicKey);
				}

				return this.keyPairs[0].publicKey;
			}

			/**
			 * Receive incoming cyphertext.
			 * @param message Data to be decrypted.
			 */
			public receive (message: string) : void {
				if (this.isAborted) {
					return;
				}

				this.shouldRatchetKeys	= true;

				if (this.friendKeys.length < 1) {
					try {
						this.friendKeys.unshift(
							Castle.sodium.crypto_secretbox_open_easy(
								Castle.sodium.from_hex(message),
								Castle.emptyNonce,
								Castle.sodium.crypto_pwhash_scryptsalsa208sha256(
									this.sharedSecret,
									Castle.emptySalt,
									0,
									0,
									Castle.sodium.crypto_secretbox_KEYBYTES
								)
							)
						);

						this.send('');
					}
					catch (_) {
						this.handlers.send('');
						this.abort();
					}
				}
				else {
					try {
						const cyphertextData: { nonce: string, cyphertext: string }	=
							JSON.parse(message)
						;

						const nonce: Uint8Array			= Castle.sodium.from_hex(
							cyphertextData.nonce
						);

						const cyphertext: Uint8Array	= Castle.sodium.from_hex(
							cyphertextData.cyphertext
						);

						const data: {
							message: string;
							key: string
						}	= (() => {
							for (const friendKey of this.friendKeys) {
								for (const keyPair of this.keyPairs) {
									try {
										return JSON.parse(
											Castle.sodium.crypto_box_open_easy(
												cyphertext,
												nonce,
												friendKey,
												keyPair.privateKey,
												'text'
											)
										);
									}
									catch (_) {}
								}
							}

							return {};
						})();

						if (data.key) {
							this.friendKeys.unshift(Castle.sodium.from_hex(data.key));

							if (this.friendKeys.length > 2) {
								const oldKey	= this.friendKeys.pop();
								Castle.sodium.memzero(oldKey);
							}
						}

						if (data.message) {
							this.handlers.receive(data.message);
						}

						if (!this.isConnected) {
							this.isConnected = true;
							this.handlers.connected();
						}
					}
					catch (_) {
						if (!this.isConnected) {
							this.abort();
						}
					}
				}
			}

			/**
			 * Send outgoing text.
			 * @param message Data to be encrypted.
			 */
			public send (message: string) : void {
				const data	= {message, key: undefined};

				if (this.shouldRatchetKeys) {
					this.shouldRatchetKeys	= false;
					data.key				= Castle.sodium.to_hex(this.generateKeyPair());
				}

				const nonce: Uint8Array	= Castle.sodium.randombytes_buf(
					Castle.sodium.crypto_secretbox_NONCEBYTES
				);

				this.handlers.send(JSON.stringify({
					nonce: Castle.sodium.to_hex(nonce),
					cyphertext: Castle.sodium.crypto_box_easy(
						JSON.stringify(data),
						nonce,
						this.friendKeys[0],
						this.keyPairs[0].privateKey,
						'hex'
					)
				}));
			}

			public constructor (
				private sharedSecret: string,
				private handlers: {
					abort: Function;
					connected: Function;
					receive: Function;
					send: Function;
				}
			) {
				this.handlers.send(
					Castle.sodium.crypto_secretbox_easy(
						this.generateKeyPair(),
						Castle.emptyNonce,
						Castle.sodium.crypto_pwhash_scryptsalsa208sha256(
							this.sharedSecret,
							Castle.emptySalt,
							0,
							0,
							Castle.sodium.crypto_secretbox_KEYBYTES
						),
						'hex'
					)
				);
			}
		}
	}
}
