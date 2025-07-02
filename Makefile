swagger:
	scripts/swagger.sh

tidy:
	scripts/tidy.sh

add_license:
	scripts/license.sh

pre_commit: tidy swagger add_license
