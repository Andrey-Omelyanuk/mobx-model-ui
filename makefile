PROJECT_NAME = mobx-model-ui
ifneq (,$(wildcard .env))
	include .env
	export $(shell sed 's/=.*//' .env)
endif

help:
	@echo "build            : Build the docker image" 
	@echo "dev              : Run tests in dev mode" 
	@echo "debug            : Run tests in debug mode, it allow to debug the code by browser, open chrome://inspect/#devices in your browser" 
	@echo "lint-fix         : Run linter and fix the issues"
	@echo "lint             : Run linter" 
	@echo "test             : Run unit tests" 
	@echo "test-e2e         : Run e2e tests"  
	@echo "publish          : Publish the package to npm"  

# ------------------------------------------------------------------------------

build:
	docker build -t $(PROJECT_NAME) .
dev:
	docker run --rm -it -v .:/app $(PROJECT_NAME) sh -c "yarn install && yarn dev"
# chrome://inspect/#devices
debug:
	docker run --rm -it -p 9229:9229 -v .:/app $(PROJECT_NAME) \
		sh -c "yarn install && node --inspect-brk=0.0.0.0 node_modules/.bin/jest --runInBand --testMatch='**/src/**/Form.spec.ts'"
lint:
	docker run --rm -v .:/app $(PROJECT_NAME) sh -c "yarn install && yarn lint"
lint-fix:
	docker run --rm -v .:/app $(PROJECT_NAME) sh -c "yarn install && yarn lint-fix"
test:
	docker run --rm -v .:/app $(PROJECT_NAME) sh -c "yarn install && yarn test"
test-e2e:
	docker run --rm -v .:/app $(PROJECT_NAME) sh -c "yarn install && yarn build && yarn e2e"
publish:
	docker run --rm -it --env-file .env -v .:/app $(PROJECT_NAME) sh -c "\
		npm config set //registry.npmjs.org/:_authToken=$$NODE_AUTH_TOKEN && \
		npm publish --access public \
		"
