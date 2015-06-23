/// <reference path="templates.ts" />


module Cyph {
	export module UI {
		export module Directives {
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
						link: scope => scope['Cyph'] = Cyph,
						template: Templates.linkConnection
					}));
				})();
			}
		}
	}
}
