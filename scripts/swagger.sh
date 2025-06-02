#!/bin/sh

# execute this first
# go install github.com/swaggo/swag/cmd/swag@latest

swag init -o docs --parseDependency --parseInternal
