#!/bin/sh

XMODMAP=$(which xmodmap)

if [ ! -x "${XMODMAP}" ]; then
	echo "No xmodmap found!"
	exit 1
fi

echo > /tmp/keysyms.tmp >/dev/null 2>&1

echo "exports.keycodes = {" >../../lib/misc/x11-keycodes.js

xmodmap -pke | while read line ; do
	KEYCODE=$(echo $line | cut -d ' ' -f 2)
	KEYSYM1=$(echo $line | cut -d ' ' -f 4)
	KEYSYM2=$(echo $line | cut -d ' ' -f 5)
	KEYSYM3=$(echo $line | cut -d ' ' -f 8)

	if [ "${KEYSYM1}" = "Prior" ]; then
		KEYSYM1="Page_Up"
	fi

	if [ "${KEYSYM1}" = "Next" ]; then
		KEYSYM1="Page_Down"
	fi

	if [ ! -z "${KEYSYM1}" ] && [ "${KEYSYM1}" != "NoSymbol" ]; then
		echo "  \"${KEYSYM1}\": {keycode: ${KEYCODE}, modifier: \"none\"}," >>../../lib/misc/x11-keycodes.js

		echo "${KEYSYM1}" >>/tmp/keysyms.tmp
	fi

	if [ ! -z "${KEYSYM2}" ] && [ "${KEYSYM2}" != "NoSymbol" ]; then
		grep -q -w "${KEYSYM2}" /tmp/keysyms.tmp >/dev/null 2>&1

		if [ "${?}" = "1" ]; then
			echo "  \"${KEYSYM2}\": {keycode: ${KEYCODE}, modifier: \"shift\"}," >>../../lib/misc/x11-keycodes.js
		fi
	fi

	if [ ! -z "${KEYSYM3}" ] && [ "${KEYSYM3}" != "NoSymbol" ]; then
		grep -q -w "${KEYSYM3}" /tmp/keysyms.tmp >/dev/null 2>&1

		if [ "${?}" = "1" ]; then
			echo "  \"${KEYSYM3}\": {keycode: ${KEYCODE}, modifier: \"altgr\"}," >>../../lib/misc/x11-keycodes.js
		fi
	fi
done

echo "};" >>../../lib/misc/x11-keycodes.js

rm -f /tmp/keysyms.tmp >/dev/null 2>&1
