import {Util} from 'cyph/util';


/**
 * Reusable HTML view templates.
 */
export const Templates	= {
	amazonLink: `
		<md-dialog class='amazon-link'>
			<md-content>
				<h2 class='md-title' translate>
					Amazon Link
				</h2>
				<p translate>
					You have the option to add Cyph's Amazon affiliate code to this link.
				</p>
				<p translate>
					If you make a purchase, this code will give us a small commission to help keep
					the service running. However, it will also anonymously include your purchase in
					aggregate data reported to us by Amazon.
				</p>
				<p translate>
					Add the code?
				</p>
				<md-checkbox translate ng-model='locals.remember' aria-label='Remember my preference'>
					Remember my preference
				</md-checkbox>
			</md-content>
			<div class='md-actions'>
				<md-button translate aria-label='No' ng-click='close(false)'>No</md-button>
				<md-button translate aria-label='Sure, add the code' ng-click='close(true)'>Sure, add the code</md-button>
			</div>
		</md-dialog>
	`,

	helpModal: `
		<md-dialog class='help'>
			<md-content>
				<md-tabs md-dynamic-height md-border-bottom>
					<md-tab label='Formatting Help'>
						<p>
							<span translate>Cyph uses a version of Markdown called</span>
							<a href='http://commonmark.org/'>CommonMark</a>
							<span translate>
								for formatting. We also support various extensions &ndash;
								including emojis and code fencing.
							</span>
						</p>
						<p translate>
							The following examples are shamelessly copied from reddit:
						</p>
						<table>
							<tbody>
								<tr>
									<th translate>you type:</th>
									<th translate>you see:</th>
								</tr>
								<tr>
									<td>*<span translate>italics</span>*</td>
									<td><em translate>italics</em></td>
								</tr>
								<tr>
									<td>**<span translate>bold</span>**</td>
									<td><b translate>bold</b></td>
								</tr>
								<tr>
									<td>[cyph <span translate>me</span>!](https://cyph.com)</td>
									<td><a href='https://cyph.com'>cyph <span translate>me</span>!</a></td>
								</tr>
								<tr>
									<td>
										<br />
										* <span translate>item 1</span>
										<br />
										* <span translate>item 2</span>
										<br />
										* <span translate>item 3</span>
									</td>
									<td>
										<ul>
											<li translate>item 1</li>
											<li translate>item 2</li>
											<li translate>item 3</li>
										</ul>
									</td>
								</tr>
								<tr>
									<td>
										<br />
										&gt; <span translate>quoted text</span>
									</td>
									<td>
										<blockquote translate>quoted text</blockquote>
									</td>
								</tr>
								<tr>
									<td>
										<span translate>Lines starting with tabs are treated like code:</span>

										<br />
										<br />

										<span class='spaces'>&nbsp;&nbsp;&nbsp;&nbsp;</span>
										if 1 * 2 &lt; 3:
										<br />
										<span class='spaces'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
										print "hello!"
										<br />
									</td>
									<td>
										<span translate>Lines starting with tabs are treated like code:</span>

										<br />
										<br />

										<pre>if 1 * 2 &lt; 3:<br />&nbsp;&nbsp;&nbsp;&nbsp;print "hello!"</pre>
									</td>
								</tr>
								<tr>
									<td>~~<span translate>strikethrough</span>~~</td>
									<td><strike translate>strikethrough</strike></td>
								</tr>
								<tr>
									<td><span translate>super</span>^<span translate>script</span>^</td>
									<td><span translate>super</span><sup translate>script</sup></td>
								</tr>
							</tbody>
						</table>
					</md-tab>
					<md-tab label='Contact Cyph' ng-disabled='ui.coBranded'>
						<span translate>Please check out the</span>
						<a href='{{Cyph.Env.homeUrl}}faq'>FAQs</a>
						<span translate>first!</span>
						<br />
						<br />
						<br />
						<cyph-contact to='"help"'></cyph-contact>
					</md-tab>
				</md-tabs>
			</md-content>
		</md-dialog>
	`,

	register: `
		<md-dialog class='register' flex='65' flex-sm='80' flex-xs='95'>
			<md-content>
				<md-card class='md-padding'>
					<md-card-title>
						<md-card-title-text>
							<span class='md-headline' translate>
								Register
							</span>
							<span class='md-subhead'>
								<div ng-show='locals.signupForm.state === 1'>
									Enter your email address.
								</div>
								<div ng-show='locals.signupForm.state === 2'>
									Thanks for signing up. Feel free to give us your name too.
									Privacy is at the core of our ideology, so we'll never give
									away your email address or personal details.
								</div>
							</span>
						</md-card-title-text>
					</md-card-title>
					<md-card-content>
						<div cyph-signup-form='locals.signupForm'></div>
					</md-card-content>
				</md-card>

				<div class='login-button' layout='row' layout-align='center center'>
					<md-button
						ng-href='{{locals.Cyph.Env.newCyphBaseUrl}}#beta/login'
						translate
					>
						Already have a Cyph account? Click here to login.
					</md-button>
				</div>
			</md-content>
		</md-dialog>
	`,

	invite: `
		<md-dialog class='register' flex='65' flex-sm='80' flex-xs='95'>
			<md-content>
				<md-card class='md-padding'>
					<md-card-title>
						<md-card-title-text>
							<span class='md-headline' translate>
								Register with Invite Code
							</span>
							<span class='md-subhead'>
								<div ng-show='locals.signupForm.state === 1'>
									Enter your email address and invite code for priority access on our waitlist.
								</div>
								<div ng-show='locals.signupForm.state === 2'>
									Thanks for signing up. Feel free to give us your name too.
									Privacy is at the core of our ideology, so we'll never give
									away your email address or personal details.
								</div>
							</span>
						</md-card-title-text>
					</md-card-title>
					<md-card-content>
						<div invite='true' cyph-signup-form='locals.signupForm'></div>
					</md-card-content>
				</md-card>

				<div class='login-button' layout='row' layout-align='center center'>
					<md-button
						ng-href='{{locals.Cyph.Env.newCyphBaseUrl}}#beta/login'
						translate
					>
						Already have a Cyph account? Click here to login.
					</md-button>
				</div>
			</md-content>
		</md-dialog>
	`
};

(() => {
	for (let k of Object.keys(Templates)) {
		Templates[k]	= Util.translateHtml(Templates[k]);
	}
})();
