module Cyph {
	export module Session {
		export enum Authors {
			me,
			friend,
			app
		}

		export class Events {
			public static abort: string				= 'abort';
			public static beginChat: string			= 'beginChat';
			public static beginChatComplete: string	= 'beginChatComplete';
			public static beginWaiting: string		= 'beginWaiting';
			public static channelRatchet: string	= 'channelRatchet';
			public static closeChat: string			= 'closeChat';
			public static cyphertext: string		= 'cyphertext';
			public static destroy: string			= 'destroy';
			public static mutex: string				= 'mutex';
			public static newCyph: string			= 'newCyph';
			public static otr: string				= 'otr';
			public static p2p: string				= 'p2p';
			public static p2pUi: string				= 'p2pUi';
			public static smp: string				= 'smp';
			public static text: string				= 'text';
			public static typing: string			= 'typing';
		}

		export enum OTREvents {
			abort,
			authenticated,
			begin,
			receive,
			send
		}

		export class State {
			public static cyphId: string				= 'cyphId';
			public static sharedSecret: string			= 'sharedSecret';
			public static hasKeyExchangeBegun: string	= 'hasKeyExchangeBegun';
			public static isAlive: string				= 'isAlive';
			public static isCreator: string				= 'isCreator';
			public static isStartingNewCyph: string		= 'isStartingNewCyph';
		}

		export let ThreadedSessionEvents	= {
			close: 'close-ThreadedSession',
			receive: 'receive-ThreadedSession',
			send: 'send-ThreadedSession',
			sendText: 'sendText-ThreadedSession',
			updateState: 'updateState-ThreadedSession',
			updateStateThread: 'updateStateThread-ThreadedSession'
		}
	}
}
