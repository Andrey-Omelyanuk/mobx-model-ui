PROJECT_NAME = mobx-model-ui
EMAIL=omelyanukandrey@gmail.com
NPM_PACKAGE_REGISTRY=https://registry.npmjs.org/
ifneq (,$(wildcard .env))
	include .env
	export $(shell sed 's/=.*//' .env)
endif

help:
	@echo "build            : Build the docker image." 
	@echo "dev              : " 
	@echo "debug            : " 
	@echo "lint             : Run linter" 
	@echo "test             : Run unit tests" 
	@echo "test-e2e         : Run e2e tests"  
	@echo "publish          : Manually publish"  
	@echo "---------------------------------------------"  
	@echo "release-build    : Build image    for release" 
	@echo "release-lint     : Run linter     for release" 
	@echo "release-test     : Run unit tests for release" 
	@echo "release-test-e2e : Run e2e  tests for release" 
	@echo "release-publish  : Publish        the release" 

# ------------------------------------------------------------------------------

build:
	docker build --target base -t $(PROJECT_NAME) .
dev:
	docker run --rm -it -v .:/app $(PROJECT_NAME) sh -c "yarn install && yarn dev"
# chrome://inspect/#devices
debug:
	docker run --rm -it -p 9229:9229 -v .:/app $(PROJECT_NAME) \
		yarn install && \
		node --inspect-brk=0.0.0.0 node_modules/.bin/jest --runInBand --testMatch='**/src/**/*.spec.ts'
lint:
	docker run --rm -it -v .:/app $(PROJECT_NAME) sh -c "yarn install && yarn lint"
lint-fix:
	docker run --rm -it -v .:/app $(PROJECT_NAME) sh -c "yarn install && yarn lint-fix"
test:
	docker run --rm -it -v .:/app $(PROJECT_NAME) sh -c "yarn install && yarn test"
test-e2e:
	docker run --rm -it -v .:/app $(PROJECT_NAME) sh -c "yarn install && yarn build && yarn e2e"

# //registry.npmjs.org/:_authToken=your_auth_token
# NPM_PACKAGE_REGISTRY=https://registry.npmjs.org/
# npm config set registry https://gitea.example.com/api/packages/testuser/npm/
# npm config set -- '//gitea.example.com/api/packages/testuser/npm/:_authToken' "personal_access_token"
# yarn config set --global npmAuthToken ${TOKEN} &&
# Use a .yarnrc file:
# npm config set registry ${NPM_PACKAGE_REGISTRY} && \
# npm config set -- 'registry.npmjs.org/:_authToken=${TOKEN}' && \
# npm login && 

VERSION=0.0.1
publish:

	docker run --rm -it -v .:/app $(PROJECT_NAME) sh -c "\
      	echo _auth=${TOKEN} >> .npmrc && \
        echo email=${EMAIL} >> .npmrc && \
        echo always-auth=true >> .npmrc && \
		yarn config fix && \
		yarn publish --access public --new-version ${VERSION} --non-interactive"

# ------------------------------------------------------------------------------

release-build:
	docker build --target release -t $(PROJECT_NAME)-release .
release-lint:
	docker run --rm $(PROJECT_NAME)-release sh -c "yarn lint"
release-test:
	docker run --rm $(PROJECT_NAME)-release sh -c "yarn test"
release-test-e2e:
	docker run --rm $(PROJECT_NAME)-release sh -c "yarn e2e"
release-publish:
	docker run --rm $(PROJECT_NAME)-release sh -c "yarn config set registry ${NPM_PACKAGE_REGISTRY}"
	docker run --rm $(PROJECT_NAME)-release sh -c "yarn config set -- '//repo.edtechworld.pl/api/packages/mobx-data/npm/:_authToken' '${TOKEN}'"
	docker run --rm $(PROJECT_NAME)-release sh -c "yarn publish --new-version ${VERSION} --non-interactive"
