swagger:
	scripts/swagger.sh

tidy:
	scripts/tidy.sh

check_license:
	scripts/license.sh

pre_commit: tidy swagger check_license
