#!/bin/bash
SCRIPT=autoPlay.noUpdate.user.js
LOADER=autoplay.user.js

# Too many arguments, show usage
if [ $# -gt 1 ]; then
	echo "Usage: $0 [version]"
	echo "If version is not specified, the build number is updated."
	exit 1
fi

# Get the old script version
OLD_VERSION=`cat $SCRIPT | grep "// \@version" | awk '{print $3}'`

# If a version is specified, make sure it's valid
if [[ $# -eq 1 ]]; then
	if [[ "$1" =~ ^[[:digit:]]+\.[[:digit:]]+\.[[:digit:]]+\.[[:digit:]]+$ ]]; then
		NEW_VERSION=$1
	else
		echo "Invalid version \"$1\"."
		echo "Version numbers must be in the format X.Y.Z.ZZ."
		exit 2
	fi
else
	echo "Version not specified, loading from javascript."
	NEW_VERSION=`echo $OLD_VERSION | awk -F . '{print $1 "." $2 "." $3 "." $4+1}'`
fi

echo "Old Version: $OLD_VERSION"
echo "New Version: $NEW_VERSION"

# Replace the occurrances in the .js file
OLD_REGEX=`echo $OLD_VERSION | sed 's/\./\\\\./g'`
NEW_REGEX=`echo $NEW_VERSION | sed 's/\./\\\\./g'`
sed -i '' "s/$OLD_REGEX/$NEW_REGEX/g" $SCRIPT
sed -i '' "s/$OLD_REGEX/$NEW_REGEX/g" $LOADER

cat << EOF > version.json
{
    "_comment" : "This file is used for automatic updates.  Please update with update_version.sh.",
    "Version" : "$NEW_VERSION"
}
EOF
