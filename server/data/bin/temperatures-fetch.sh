#!/bin/bash

	for SPATH in $(ls /sys/bus/w1/drivers/w1_slave_driver/*/w1_slave) ; do
		SID=$(basename $(dirname ${SPATH}))

		if [ -e ./data/sensors/${SID}.rrd ]; then
			CUR=$(rrdtool lastupdate ./data/sensors/${SID}.rrd | tail -n 1 | sed s/".*: "/""/ | awk '{printf("%.1f\n"), $1}')

			END=$(rrdtool last ./data/sensors/${SID}.rrd)

			let E="(${END} / 7200) * 7200"
			let S="${E} - 86400"

			MIN=$(rrdtool fetch ./data/sensors/${SID}.rrd MIN -s ${S} -e ${E} -r 7200 | grep -v "nan" | awk '/[0-9]+: [-0-9.e+]+/ {if (!n) {min=$2; n++; next}; if ($2 < min){min =$2};} END{printf("%.1f\n", min)}' | sed s/"nan"/"NA"/)

			MAX=$(rrdtool fetch ./data/sensors/${SID}.rrd MAX -s ${S} -e ${E} -r 7200 | grep -v "nan" | awk '/[0-9]+: [-0-9.e+]+/ {if (!n) {max=$2; n++; next}; if ($2 > max){max =$2};} END{printf("%.1f\n", max)}' | sed s/"nan"/"NA"/)

			echo "${SID} ${CUR} ${MIN} ${MAX}"
		fi
	done

	exit 0
