#!/bin/sh

SINK=$(pactl stat | grep "Default Sink" | colrm 1 14)
SOURCE=$(pactl stat | grep "Default Source" | colrm 1 16)

case ${1} in
	input)
		case ${2} in
			mute)
				pactl set-source-mute ${SOURCE} ${3}
				;;

			volume)
				pactl set-source-volume ${SOURCE} $((65536*${3}/100"))
				;;
		esac
		;;

	output)
		case ${2} in
			mute)
				pactl set-sink-mute ${SINK} ${3}
				;;

			volume)
				pactl set-sink-volume ${SINK} $((65536*${3}/100))
				;;
		esac
		;;

	status)
		INPUT_HEX="0x$(pacmd dump | grep "set-source-volume ${SOURCE} " | cut -d ' ' -f 3 | colrm 1 2 | tr a-f A-F)"

		INPUT_VOLUME=$((100*${INPUT_HEX}/65536))

		if [ $(pacmd dump | grep "set-source-mute ${SOURCE} " | cut -d ' ' -f 3) = "yes" ]; then
			INPUT_MUTE="true"
		else
			INPUT_MUTE="false"
		fi

		OUTPUT_HEX="0x$(pacmd dump | grep "set-sink-volume ${SINK} " | cut -d ' ' -f 3 | colrm 1 2 | tr a-f A-F)"

		OUTPUT_VOLUME=$((100*${OUTPUT_HEX}/65536))

		if [ $(pacmd dump | grep "set-sink-mute ${SINK} " | cut -d ' ' -f 3) = "yes" ]; then
			OUTPUT_MUTE="true"
		else
			OUTPUT_MUTE="false"
		fi

		echo "${INPUT_VOLUME},${INPUT_MUTE},${OUTPUT_VOLUME},${OUTPUT_MUTE}"
		;;
esac
