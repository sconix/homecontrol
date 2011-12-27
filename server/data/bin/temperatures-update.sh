#!/bin/bash

	mkdir -p ./data/graphs
	mkdir -p ./data/sensors

	read_temperature()
	{
		TEMPERATURE=$(grep " t=" ${1} | sed s/".*t="/""/)

		echo "scale=3; ${TEMPERATURE} / 1000" | bc
	}

	function create_database()
	{
		/usr/bin/rrdtool create \
			./data/sensors/${1}.rrd \
			-s 300 \
			"DS:temp:GAUGE:600:U:U" \
			"RRA:AVERAGE:0.5:1:2016" \
			"RRA:MIN:0.5:1:2016" \
			"RRA:MAX:0.5:1:2016" \
			"RRA:AVERAGE:0.5:6:1344" \
			"RRA:MIN:0.5:6:1344" \
			"RRA:MAX:0.5:6:1344" \
			"RRA:AVERAGE:0.5:24:2190" \
			"RRA:MIN:0.5:24:2190" \
			"RRA:MAX:0.5:24:2190" \
			"RRA:AVERAGE:0.5:144:3650" \
			"RRA:MIN:0.5:144:3650" \
			"RRA:MAX:0.5:144:3650"
	}

	function update_database()
	{
		/usr/bin/rrdtool update \
			./data/sensors/${1}.rrd \
			-t "temp" N:${2}
	}

	function graph_database()
	{
		/usr/bin/rrdtool graph \
			./data/graphs/${1}_${2}.png \
	    -s -1${2} -t "Temperatures of last ${2}" \
			-z -h 102 -w 269 -a "PNG" --border 0 -E \
			"DEF:temp=./data/sensors/${1}.rrd:temp:AVERAGE" \
			"DEF:min=./data/sensors/${1}.rrd:temp:MIN" \
	    "DEF:max=./data/sensors/${1}.rrd:temp:MAX" \
			"LINE1:min#FF3333" "LINE1:max#66FF33" "LINE2:temp#0000FF" \
			"GPRINT:temp:MIN:Min\\: %3.1lf" \
			"GPRINT:temp:MAX: Max\\: %3.1lf" \
			"GPRINT:temp:AVERAGE: Avg\\: %3.1lf" \
			"GPRINT:temp:LAST: Cur\\: %3.1lf\\n" >/dev/null
	}

# The Main Function

	if [ ! -d /sys/bus/w1/drivers/w1_slave_driver ]; then
		exit 1
	fi

	for SPATH in $(ls /sys/bus/w1/drivers/w1_slave_driver/*/w1_slave) ; do
		SID=$(basename $(dirname ${SPATH}))

		if [ ! -e ./data/sensors/${SID}.rrd ]; then
			echo "- Creating database for ${SID} sensor"

			create_database ${SID}
		fi

		echo "- Reading temperature for ${SID} sensor"

		T="$(read_temperature ${SPATH})"

		echo "- Reading of ${SID} sensor: ${T}"

		echo "- Updating database for ${SID} sensor"

		update_database ${SID} ${T}

		echo "- Creating graphs for ${SID} sensor"

		graph_database ${SID} day
		graph_database ${SID} week
		graph_database ${SID} month
		graph_database ${SID} year
	done

	exit 0
