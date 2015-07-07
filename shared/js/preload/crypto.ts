/**
 * @file Initialise crypto object on IE + redirect browsers
 * that don't support crypto (or other required features).
 */


if (!('crypto' in self) && 'msCrypto' in self) {
	self['crypto']	= self['msCrypto'];
}

if (!(
	'crypto' in self &&
	'getRandomValues' in self['crypto'] &&
	'Worker' in self &&
	'history' in self &&
	'pushState' in self['history'] &&
	'replaceState' in self['history'] &&
	'MutationObserver' in self
)) {
	location.pathname	= '/unsupportedbrowser';
}

if (!('subtle' in crypto) && 'webkitSubtle' in crypto) {
	crypto.subtle	= crypto['webkitSubtle'];
}

let LocalStorage: Storage;

try {
	localStorage.isPersistent	= 'true';
	LocalStorage	= localStorage;
}
catch (_) {
	LocalStorage	= LocalStorage || <Storage> {};
}
