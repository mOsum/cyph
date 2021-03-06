import {Templates} from 'templates';


/**
 * Angular directive for link connection component.
 */
export class LinkConnection {
	/** Module/directive title. */
	public static title: string	= 'cyphLinkConnection';

	private static _	= (() => {
		angular.module(LinkConnection.title, []).directive(LinkConnection.title, () => ({
			restrict: 'A',
			transclude: true,
			scope: {
				$this: '=' + LinkConnection.title
			},
			link: scope => scope['Cyph'] = self['Cyph'],
			template: Templates.linkConnection
		}));
	})();
}
