setup:
	npm install
	
lint:
	./node_modules/.bin/jshint lib/ test/

test: lint
	./node_modules/.bin/mocha --reporter list

.PHONY: lint test setup
