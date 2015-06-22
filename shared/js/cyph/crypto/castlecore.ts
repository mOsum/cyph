module Cyph {
	export module Crypto {
		/**
		 * The Castle encryption protocol. This version supports an OTR-like
		 * feature set, with group/async/persistence coming later.
		 */
		export class CastleCore {
			private static flagIndex: number				= 4;

			private static flagDataIndex: number			=
				CastleCore.flagIndex + 1
			;

			private static handshakeTimeout: number			= 45000;

			private static nonceEndIndex: number			=
				CastleCore.flagIndex +
				sodium.crypto_secretbox_NONCEBYTES
			;

			private static ntruMacIndex: number				=
				CastleCore.nonceEndIndex +
				ntru.encryptedDataLength
			;

			private static ntruPlaintextLength: number		=
				sodium.crypto_secretbox_KEYBYTES +
				sodium.crypto_onetimeauth_KEYBYTES
			;

			private static publicKeySetLength: number		=
				sodium.crypto_box_PUBLICKEYBYTES +
				ntru.publicKeyLength
			;

			private static sodiumCyphertextIndex: number	=
				CastleCore.ntruMacIndex +
				sodium.crypto_onetimeauth_BYTES
			;

			private static errors	= {
				decryptionFailure: new Error('Data could not be decrypted.'),
				invalidMessageId: new Error('Indicated message ID is invalid'),
				ntruAuthFailure: new Error('Invalid NTRU cyphertext.')
			};


			private keySets: {
				sodium: { publicKey: Uint8Array; privateKey: Uint8Array; };
				ntru: { publicKey: Uint8Array; privateKey: Uint8Array; };
			}[]	= [];

			private friendKeySet: {
				sodium: Uint8Array;
				ntru: Uint8Array;
			};

			private isAborted: boolean;
			private isConnected: boolean;
			private shouldRatchetKeys: boolean;
			private sharedSecret: Uint8Array;

			public outgoingMessageId: Uint32Array	= new Uint32Array([1]);

			private abort () : void {
				this.isAborted	= true;

				try {
					/* Send invalid cyphertext to trigger
						friend's abortion logic */
					this.handlers.send('');
				}
				finally {
					this.handlers.abort();
				}
			}

			private decrypt (cyphertext: Uint8Array) : {
				data: Uint8Array;
				keySet: {
					sodium: { publicKey: Uint8Array; privateKey: Uint8Array; };
					ntru: { publicKey: Uint8Array; privateKey: Uint8Array; };
				};
			} {
				const id: number	= new Uint32Array(cyphertext.buffer, 0, 1)[0];

				const nonce: Uint8Array				= new Uint8Array(
					cyphertext.buffer,
					CastleCore.flagIndex,
					sodium.crypto_secretbox_NONCEBYTES
				);

				const ntruCyphertext: Uint8Array	= new Uint8Array(
					cyphertext.buffer,
					CastleCore.nonceEndIndex,
					ntru.encryptedDataLength
				);

				const ntruMac: Uint8Array			= new Uint8Array(
					cyphertext.buffer,
					CastleCore.ntruMacIndex,
					sodium.crypto_onetimeauth_BYTES
				);

				const sodiumCyphertext: Uint8Array	= new Uint8Array(
					cyphertext.buffer,
					CastleCore.sodiumCyphertextIndex
				);


				for (const keySet of this.keySets) {
					let ntruPlaintext: Uint8Array;

					try {
						ntruPlaintext	= ntru.decrypt(
							ntruCyphertext,
							keySet.ntru.privateKey
						);

						const symmetricKey: Uint8Array	= new Uint8Array(
							ntruPlaintext.buffer,
							0,
							sodium.crypto_secretbox_KEYBYTES
						);

						const ntruAuthKey: Uint8Array	= new Uint8Array(
							ntruPlaintext.buffer,
							sodium.crypto_secretbox_KEYBYTES,
							sodium.crypto_onetimeauth_KEYBYTES
						);

						if (!sodium.crypto_onetimeauth_verify(
							ntruMac,
							ntruCyphertext,
							ntruAuthKey
						)) {
							throw CastleCore.errors.ntruAuthFailure;
						}

						const data: Uint8Array	= sodium.crypto_box_open_easy(
							sodium.crypto_secretbox_open_easy(
								sodiumCyphertext,
								nonce,
								symmetricKey
							),
							nonce,
							this.friendKeySet.sodium,
							keySet.sodium.privateKey
						);

						if (id !== new Uint32Array(data.buffer, 0, 1)[0]) {
							throw CastleCore.errors.invalidMessageId;
						}

						return {data, keySet};
					}
					catch (err) {
						if (
							err === CastleCore.errors.ntruAuthFailure ||
							err === CastleCore.errors.invalidMessageId
						) {
							throw err;
						}
					}
					finally {
						if (ntruPlaintext) {
							sodium.memzero(ntruPlaintext);
						}
					}
				}

				throw CastleCore.errors.decryptionFailure;
			}

			private encrypt (
				data: Uint8Array,
				keySet: {
					sodium: { publicKey: Uint8Array; privateKey: Uint8Array; };
					ntru: { publicKey: Uint8Array; privateKey: Uint8Array; };
				}
			) : string {
				const nonce: Uint8Array				= sodium.randombytes_buf(
					sodium.crypto_secretbox_NONCEBYTES
				);

				const symmetricKey: Uint8Array		= sodium.randombytes_buf(
					sodium.crypto_secretbox_KEYBYTES
				);

				const ntruAuthKey: Uint8Array		= sodium.randombytes_buf(
					sodium.crypto_onetimeauth_KEYBYTES
				);

				const ntruPlaintext: Uint8Array		= new Uint8Array(
					CastleCore.ntruPlaintextLength
				);

				ntruPlaintext.set(symmetricKey);
				ntruPlaintext.set(ntruAuthKey, sodium.crypto_secretbox_KEYBYTES);


				const ntruCyphertext: Uint8Array	= ntru.encrypt(
					ntruPlaintext,
					this.friendKeySet.ntru
				);

				const ntruMac: Uint8Array			= sodium.crypto_onetimeauth(
					ntruCyphertext,
					ntruAuthKey
				);

				const sodiumCyphertext: Uint8Array	= sodium.crypto_secretbox_easy(
					sodium.crypto_box_easy(
						data,
						nonce,
						this.friendKeySet.sodium,
						keySet.sodium.privateKey
					),
					nonce,
					symmetricKey
				);

				const cyphertext: Uint8Array		= new Uint8Array(
					CastleCore.sodiumCyphertextIndex +
					sodiumCyphertext.length
				);

				cyphertext.set(new Uint8Array(this.outgoingMessageId.buffer));
				cyphertext.set(nonce, CastleCore.flagIndex);
				cyphertext.set(ntruCyphertext, CastleCore.nonceEndIndex);
				cyphertext.set(ntruMac, CastleCore.ntruMacIndex);
				cyphertext.set(sodiumCyphertext, CastleCore.sodiumCyphertextIndex);

				try {
					return sodium.to_base64(cyphertext);
				}
				finally {
					sodium.memzero(nonce);
					sodium.memzero(symmetricKey);
					sodium.memzero(ntruAuthKey);
					sodium.memzero(ntruPlaintext);
					sodium.memzero(ntruCyphertext);
					sodium.memzero(ntruMac);
					sodium.memzero(sodiumCyphertext);
					sodium.memzero(cyphertext);
				}
			}

			private generateKeySet () : Uint8Array {
				this.keySets.unshift({
					sodium: sodium.crypto_box_keypair(),
					ntru: ntru.keyPair()
				});

				if (this.keySets.length > 2) {
					const oldKeySet	= this.keySets.pop();

					sodium.memzero(oldKeySet.sodium.privateKey);
					sodium.memzero(oldKeySet.ntru.privateKey);
					sodium.memzero(oldKeySet.sodium.publicKey);
					sodium.memzero(oldKeySet.ntru.publicKey);
				}

				const publicKeySet: Uint8Array	= new Uint8Array(
					CastleCore.publicKeySetLength
				);

				publicKeySet.set(this.keySets[0].sodium.publicKey);
				publicKeySet.set(
					this.keySets[0].ntru.publicKey,
					sodium.crypto_box_PUBLICKEYBYTES
				);

				return publicKeySet;
			}

			private importFriendKeySet (data: Uint8Array, startIndex: number = 0) : void {
				this.friendKeySet.sodium.set(new Uint8Array(
					data.buffer,
					startIndex,
					sodium.crypto_box_PUBLICKEYBYTES
				));

				this.friendKeySet.ntru.set(new Uint8Array(
					data.buffer,
					sodium.crypto_box_PUBLICKEYBYTES + startIndex,
					ntru.publicKeyLength
				));
			}

			/**
			 * Receive incoming cyphertext.
			 * @param message Data to be decrypted.
			 * @returns Whether message was successfully decrypted.
			 */
			public receive (message: Uint8Array) : boolean {
				if (this.isAborted) {
					return false;
				}

				try {
					/* Initial key exchange */
					if (!this.friendKeySet) {
						this.friendKeySet	= {
							sodium: new Uint8Array(sodium.crypto_box_PUBLICKEYBYTES),
							ntru: new Uint8Array(ntru.publicKeyLength)
						};

						const nonce: Uint8Array			= new Uint8Array(
							message.buffer,
							CastleCore.flagIndex,
							sodium.crypto_secretbox_NONCEBYTES
						);

						const encryptedKeys: Uint8Array	= new Uint8Array(
							message.buffer,
							CastleCore.nonceEndIndex
						);

						try {
							this.importFriendKeySet(
								sodium.crypto_secretbox_open_easy(
									encryptedKeys,
									nonce,
									this.sharedSecret
								)
							);
						}
						finally {
							sodium.memzero(this.sharedSecret);
						}

						/* Trigger friend's connection acknowledgement logic
							by sending this user's first encrypted message */
						this.send(new Uint8Array(0));

						return true;
					}

					/* Standard incoming message */
					else {
						const decrypted	= this.decrypt(message);

						if (decrypted.keySet === this.keySets[0]) {
							this.shouldRatchetKeys	= true;
						}

						let paddingLengthIndex: number	= CastleCore.flagDataIndex;

						if (decrypted.data[CastleCore.flagIndex] === 1) {
							this.importFriendKeySet(decrypted.data, CastleCore.flagDataIndex);
							paddingLengthIndex += CastleCore.publicKeySetLength;
						}

						const paddingIndex: number	= paddingLengthIndex + 1;

						const messageIndex: number	=
							paddingIndex + decrypted.data[paddingLengthIndex]
						;

						if (decrypted.data.length > messageIndex) {
							this.handlers.receive(decrypted.data, messageIndex);
						}

						if (!this.isConnected) {
							this.isConnected	= true;
							this.handlers.connect();
						}

						return true;
					}
				}
				catch (_) {
					if (!this.isConnected) {
						this.abort();
					}
				}

				return false;
			}

			/**
			 * Send outgoing text.
			 * @param message Data to be encrypted.
			 */
			public send (message: Uint8Array) : void {
				const keySet	= this.keySets[0];

				let publicKeySet: Uint8Array;

				if (this.shouldRatchetKeys) {
					this.shouldRatchetKeys	= false;
					publicKeySet			= this.generateKeySet();

				}

				const paddingLengthIndex: number		=
					CastleCore.flagDataIndex +
					(publicKeySet ? CastleCore.publicKeySetLength : 0)
				;

				const paddingIndex: number		= paddingLengthIndex + 1;

				const paddingLength: Uint8Array	= sodium.randombytes_buf(1);
				const padding: Uint8Array		= sodium.randombytes_buf(paddingLength[0]);

				const messageIndex: number		= paddingIndex + padding.length;

				const data: Uint8Array			= new Uint8Array(
					message.length +
					messageIndex
				);

				data.set(new Uint8Array(this.outgoingMessageId.buffer));

				if (publicKeySet) {
					data[CastleCore.flagIndex]	= 1;
					data.set(publicKeySet, CastleCore.flagDataIndex);
				}

				data.set(paddingLength, paddingLengthIndex);
				data.set(padding, paddingIndex);
				data.set(message, messageIndex);

				try {
					this.handlers.send(this.encrypt(data, keySet));
				}
				finally {
					++this.outgoingMessageId[0];

					sodium.memzero(data);

					if (publicKeySet) {
						sodium.memzero(publicKeySet);
					}
				}
			}

			public constructor (
				sharedSecret: string,
				private handlers: {
					abort: Function;
					connect: Function;
					receive: (data: Uint8Array, startIndex: number) => void;
					send: (message: string) => void;
				}
			) {
				setTimeout(() => {
					if (!this.isConnected) {
						this.abort();
					}
				}, CastleCore.handshakeTimeout);

				this.sharedSecret	= sodium.crypto_pwhash_scryptsalsa208sha256(
					sharedSecret,
					new Uint8Array(sodium.crypto_pwhash_scryptsalsa208sha256_SALTBYTES),
					sodium.crypto_pwhash_scryptsalsa208sha256_OPSLIMIT_INTERACTIVE,
					sodium.crypto_pwhash_scryptsalsa208sha256_MEMLIMIT_INTERACTIVE,
					sodium.crypto_secretbox_KEYBYTES
				);

				const publicKeySet: Uint8Array	= this.generateKeySet();

				const nonce: Uint8Array			= sodium.randombytes_buf(
					sodium.crypto_secretbox_NONCEBYTES
				);

				const encryptedKeys: Uint8Array	= sodium.crypto_secretbox_easy(
					publicKeySet,
					nonce,
					this.sharedSecret
				);

				const cyphertext: Uint8Array	= new Uint8Array(
					CastleCore.nonceEndIndex +
					encryptedKeys.length
				);

				cyphertext.set(nonce, CastleCore.flagIndex);
				cyphertext.set(encryptedKeys, CastleCore.nonceEndIndex);

				try {
					this.handlers.send(sodium.to_base64(cyphertext));
				}
				finally {
					sodium.memzero(publicKeySet);
					sodium.memzero(nonce);
					sodium.memzero(encryptedKeys);
					sodium.memzero(cyphertext);
				}
			}
		}
	}
}
