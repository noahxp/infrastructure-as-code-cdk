.PHONY: test install build deploy watch diff
SHELL=/usr/bin/env bash -e -o pipefail

printPhaseName = echo "$(shell tput bold;tput setaf 2 ) === $@ === $(shell tput sgr0)"

install:
	@$(call printPhaseName)
	@npm install -g aws-cdk typescript
	@npm install
	@npm update

diff:
	@$(call printPhaseName)
	@cdk diff

synth:
	@$(call printPhaseName)
	@cdk synth

deploy:
	@$(call printPhaseName)
	@cdk deploy --require-approval never

deploy-acm:
	@$(call printPhaseName)
	@cdk deploy --stack=acm --require-approval never

deploy-cdnwaf:
	@$(call printPhaseName)
	@cdk deploy --stack=cdnwaf --require-approval never


destroy:
	@$(call printPhaseName)
	@cdk destroy --force

destroy-acm:
	@$(call printPhaseName)
	@cdk destroy --stack=acm --force

destroy-cdnwaf:
	@$(call printPhaseName)
	@cdk destroy --stack=cdnwaf --force