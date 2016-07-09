#!/bin/bash

source ~/.bashrc

dir="$(pwd)"
cd $(cd "$(dirname "$0")"; pwd)/..

gcloud auth login

test=true
if [ "${1}" == '--prod' ] ; then
	test=''
	shift
elif [ "${1}" == '--simple' ] ; then
	simple=true
	shift
fi

site=''
if [ "${1}" == '--site' ] ; then
	shift
	site="${1}"
	shift
fi

comment="${*}"
if [ "${comment}" == "" -a ! "${simple}" ] ; then
	comment=deploy
fi
if [ "${comment}" ] ; then
	./commands/commit.sh "${comment}"
fi

rm -rf .build
mkdir .build
cp -rf * .build/
cd .build

for project in cyph.com cyph.im cyph.me cyph.video cyph.audio ; do
	cp -rf shared/* $project/
done


# Branch config setup
branch="$(git describe --tags --exact-match 2> /dev/null || git branch | awk '/^\*/{print $2}')"
if [ $branch == 'prod' ] ; then
	branch='staging'
fi
version="$branch"
if [ $test ] ; then
	version="$(git config --get remote.origin.url | perl -pe 's/.*:(.*)\/.*/\1/' | tr '[:upper:]' '[:lower:]')-${version}"
fi
if [ $simple ] ; then
	version="simple-${version}"
fi


if [ ! $simple ] ; then
	defaultHeadersString='# default_headers'
	defaultHeaders="$(cat headers.yaml)"
	ls */*.yaml | xargs -I% sed -ri.bak "s/  ${defaultHeadersString}(.*)/\
		headers=\"\$(cat headers.yaml)\" ; \
		for header in \1 ; do \
			headers=\"\$(echo \"\$headers\" | grep -v \$header:)\" ; \
		done ; \
		echo \"\$headers\" \
	/ge" %
	ls */*.yaml | xargs -I% sed -i.bak 's|###| |g' %

	defaultCSPString='DEFAULT_CSP'
	fullCSP="$(cat shared/websign/csp | tr -d '\n')"
	coreCSP="$(cat shared/websign/csp | grep -P 'referrer|script-src|style-src|upgrade-insecure-requests' | tr -d '\n')"
	cyphComCSP="$(cat shared/websign/csp | tr -d '\n' | sed 's|frame-src|frame-src https://*.facebook.com https://*.braintreegateway.com|g')"
	ls cyph.com/*.yaml | xargs -I% sed -i.bak "s|${defaultCSPString}|\"${cyphComCSP}\"|g" %
	ls */*.yaml | xargs -I% sed -i.bak "s|${defaultCSPString}|\"${coreCSP}\"|g" %
	ls */js/cyph/envdeploy.ts | xargs -I% sed -i.bak "s|${defaultCSPString}|${fullCSP}|g" %

	# Expand connect-src and frame-src on blog to support social media widgets and stuff

	blogCSPSources="$(cat cyph.com/blog/csp | perl -pe 's/^(.*)$/https:\/\/\1 https:\/\/*.\1/g' | tr '\n' ' ')"

	cat cyph.com/cyph-com.yaml | \
		tr '\n' '☁' | \
		perl -pe 's/(\/blog.*?connect-src '"'"'self'"'"' )(.*?frame-src )(.*?connect-src '"'"'self'"'"' )(.*?frame-src )(.*?connect-src '"'"'self'"'"' )(.*?frame-src )/\1☼ \2☼ \3☼ \4☼ \5☼ \6☼ /g' | \
		sed "s|☼|${blogCSPSources}|g" | \
		tr '☁' '\n' | \
		sed "s|Cache-Control: private, max-age=31536000|Cache-Control: public, max-age=31536000|g" \
	> cyph.com/new.yaml
	mv cyph.com/new.yaml cyph.com/cyph-com.yaml
fi

defaultHost='\${locationData\.protocol}\/\/\${locationData\.hostname}:'
ls */js/cyph/envdeploy.ts | xargs -I% sed -i.bak "s/${defaultHost}43000//g" %
ls */js/cyph/envdeploy.ts | xargs -I% sed -i.bak 's/isLocalEnv: boolean		= true/isLocalEnv: boolean		= false/g' %

if [ $branch == 'staging' ] ; then
	sed -i.bak "s/false, \/\* IsProd \*\//true,/g" default/config.go
fi

if [ $test ] ; then
	sed -i.bak "s/staging/${version}/g" default/config.go
	sed -i.bak "s/http:\/\/localhost:42000/https:\/\/${version}-dot-cyphme.appspot.com/g" default/config.go
	ls */*.yaml */js/cyph/envdeploy.ts | xargs -I% sed -i.bak "s/api.cyph.com/${version}-dot-cyphme.appspot.com/g" %
	ls */*.yaml */js/cyph/envdeploy.ts | xargs -I% sed -i.bak "s/www.cyph.com/${version}-dot-cyph-com-dot-cyphme.appspot.com/g" %
	ls */js/cyph/envdeploy.ts | xargs -I% sed -i.bak "s/${defaultHost}42000/https:\/\/${version}-dot-cyphme.appspot.com/g" %
	ls */js/cyph/envdeploy.ts | xargs -I% sed -i.bak "s/${defaultHost}42001/https:\/\/${version}-dot-cyph-com-dot-cyphme.appspot.com/g" %
	ls */js/cyph/envdeploy.ts | xargs -I% sed -i.bak "s/${defaultHost}42002/https:\/\/${version}-dot-cyph-im-dot-cyphme.appspot.com/g" %
	ls */js/cyph/envdeploy.ts | xargs -I% sed -i.bak "s/CYPH-ME/https:\/\/${version}-dot-cyph-me-dot-cyphme.appspot.com/g" %
	ls */js/cyph/envdeploy.ts | xargs -I% sed -i.bak "s/CYPH-VIDEO/https:\/\/${version}-dot-cyph-video-dot-cyphme.appspot.com/g" %
	ls */js/cyph/envdeploy.ts | xargs -I% sed -i.bak "s/CYPH-AUDIO/https:\/\/${version}-dot-cyph-audio-dot-cyphme.appspot.com/g" %

	# Disable caching and HPKP in test environments
	ls */*.yaml | xargs -I% sed -i.bak 's/Public-Key-Pins: .*/Pragma: no-cache/g' %
	ls */*.yaml | xargs -I% sed -i.bak 's/max-age=31536000/max-age=0/g' %

	for yaml in `ls */cyph*.yaml` ; do
		cat $yaml | perl -pe 's/(- url: .*)/\1\n  login: admin/g' > $yaml.new
		mv $yaml.new $yaml
	done
else
	sed -i.bak "s/http:\/\/localhost:42000/https:\/\/api.cyph.com/g" default/config.go
	ls */js/cyph/envdeploy.ts | xargs -I% sed -i.bak "s/${defaultHost}42000/https:\/\/api.cyph.com/g" %
	ls */js/cyph/envdeploy.ts | xargs -I% sed -i.bak "s/${defaultHost}42001/https:\/\/www.cyph.com/g" %
	ls */js/cyph/envdeploy.ts | xargs -I% sed -i.bak "s/${defaultHost}42002/https:\/\/cyph.im/g" %
	ls */js/cyph/envdeploy.ts | xargs -I% sed -i.bak "s/CYPH-ME/https:\/\/cyph.me/g" %
	ls */js/cyph/envdeploy.ts | xargs -I% sed -i.bak "s/CYPH-VIDEO/https:\/\/cyph.video/g" %
	ls */js/cyph/envdeploy.ts | xargs -I% sed -i.bak "s/CYPH-AUDIO/https:\/\/cyph.audio/g" %

	version=prod
fi


# Blog
cd cyph.com
sed -i.bak 's|blog/build|blog|g' cyph-com.yaml
mv blog blag
rm -rf blag/theme/_posts 2> /dev/null
mv blag/posts blag/theme/_posts
cd blag/theme
jekyll build --destination ../../blog
cd ../..
rm -rf blag
cd ..


# Compile + translate + minify
for d in cyph.com cyph.im ; do
	if [ $simple ] ; then
		cd $d
	else
		cd translations

		echo "Translations = { \
			$(echo "$( \
				ls | \
				sed 's/\.json//' | \
				xargs -I% bash -c 'echo -n "\"%\": $(cat %.json | tr "\n" " "),"')" | \
				rev | \
				cut -c 2- | \
				rev \
			) \
		};" > ../$d/js/preload/translations.ts

		cd ../$d
	fi

	../commands/build.sh --prod || exit;

	if [ ! $simple ] ; then
		echo "JS Minify ${d}"
		find js -name '*.js' | xargs -I% uglifyjs -r \
			importScripts,Cyph,ui,session,locals,threadSetupVars,self,isaac,onmessage,postMessage,onthreadmessage,WebSign,Translations,IS_WEB,crypto \
			'%' -o '%' -m

		echo "CSS Minify ${d}"
		find css -name '*.css' | grep -v bourbon/ | xargs -I% cleancss -o '%' '%'

		echo "HTML Minify ${d}"
		html-minifier --minify-js --minify-css --remove-comments --collapse-whitespace index.html -o index.html.new
		mv index.html.new index.html
	fi

	cd ..
done


if [ ! $simple ] ; then
	# Cache bust
	echo "Cache bust"
	filesToCacheBust="$( \
		find shared ! -wholename '*websign*' -type f -print0 | \
		while read -d $'\0' f ; do echo "$f" ; done \
	)"
	for d in cyph.com ; do
		cd $d

		filesToModify="$(find . -name '*.html') $(find js -name '*.js') $(find css -name '*.css')"
		filesToModifyText="$(cat $filesToModify)"

		for f in $filesToCacheBust ; do
			f="$(echo "$f" | sed 's/shared\///g' | sed 's/\.ts$/\.js/g' | sed 's/\.scss$/\.css/g')"
			safeF="$(echo "$f" | sed 's/\//\\\//g' | sed 's/ /\\ /g' | sed 's/\_/\\_/g')"

			if ( echo "$filesToModifyText" | grep -o "$safeF" ) ; then
				for g in $filesToModify ; do
					if ( grep -o "$safeF" $g ) ; then
						cat $g | perl -pe \
							"s/(\\/$safeF)/\1?`md5 "$f" | perl -pe 's/.*([a-f0-9]{32}).*/\1/g'`/g" \
						> $g.new
						mv $g.new $g
					fi
				done
			fi
		done

		cd ..
	done

	# WebSign preprocessing
	for d in cyph.im cyph.video cyph.audio ; do
		cd $d

		echo 'WebSign'

		mv websign/serviceworker.js ./
		mv websign/unsupportedbrowser.html ./

		# Merge in base64'd images, fonts, video, and audio
		find img fonts audio video -type f -print0 | while read -d $'\0' f ; do
			for g in index.html $(find js -name '*.js') $(find css -name '*.css') ; do
				if ( grep -o "$f" $g ) ; then
					dataURI="data:$(echo -n "$(file --mime-type "$f")" | perl -pe 's/.*\s+(.*?)$/\1/g');base64,$(base64 "$f")"

					echo "s|/$f|$dataURI|g" | tr -d '\n' > $g.tmp
					sed -i.bak -f $g.tmp $g
					rm $g.tmp $g.bak
				fi
			done
		done

		# Merge imported libraries into threads
		find js -name '*.js' | xargs -I% ../commands/websign/threadpack.js %

		websignhashes=''
		if [ $test ] ; then
			websignhashes="{\"$(../commands/websignhash.sh "${d}" "${version}")\": true}"
			d="${version}.${d}"
		fi

		../commands/websign/pack.py index.html $d.pkg
		sed -i 's|use strict||g' $d.pkg

		cat websign/index.html | sed "s/\\\$PROJECT/$d/g" > index.html
		../commands/websign/pack.py index.html index.html
		rm websign/index.html

		currentDir="$(pwd)"
		cd ..
		git clone git@github.com:cyph/cyph.github.io.git github.io
		cd github.io
		git reset --hard
		git clean -f
		git pull

		if [ ! $test ] ; then
			websignhashes="$(cat $currentDir/websignhashes.json)"
		fi

		$currentDir/../commands/websign/sign.js \
			$currentDir/../shared/websign/js/keys.js \
			"${websignhashes}" \
			$currentDir/$d.pkg \
			websign/$d.pkg

		git add .
		git commit -a -m 'package update'
		git push
		cd $currentDir

		cd ..
	done
fi


find . -name '*.bak' | xargs rm

if [ ! $test ] ; then
	rm -rf */lib/js/crypto
fi


# Secret credentials
cat ~/.cyph/default.vars >> default/app.yaml
cat ~/.cyph/jobs.vars >> jobs/jobs.yaml
if [ $branch == 'staging' ] ; then
	cat ~/.cyph/braintree.prod >> default/app.yaml
else
	cat ~/.cyph/braintree.sandbox >> default/app.yaml
fi

deploy () {
	gcloud preview app deploy --quiet --no-promote --project cyphme --version $version $*
}

# Temporary workaround for cache-busting reverse proxies
if [ ! $test ] ; then
	for project in cyph.im cyph.video ; do
		cat $project/*.yaml | perl -pe 's/(service: cyph.*)/\1-update/' > $project/update.yaml
	done
fi

# Workaround for symlinks doubling up Google's count of the files toward its 10k limit
find . -type l -exec bash -c '
	original="$(readlink "{}")";
	parent="$(echo "{}" | perl -pe "s/(.*)\/.*?$/\1/g")";
	name="$(echo "{}" | perl -pe "s/.*\/(.*?)$/\1/g")"

	cd "${parent}"
	rm "${name}"
	mv "${original}" "${name}"
' \;

if [ $site ] ; then
	deploy $site/*.yaml
else
	deploy */*.yaml
fi

deploy dispatch.yaml cron.yaml

cd "${dir}"
