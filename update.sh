#!/bin/sh

rm -rf nodes/*
cp -r ../wyliodrin/red/nodes/* nodes/
git add .
git commit -am "$1"
git push

