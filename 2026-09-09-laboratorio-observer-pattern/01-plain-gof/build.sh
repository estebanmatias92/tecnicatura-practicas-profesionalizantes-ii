#!/bin/bash

## Borro el directorio bin si ya existiera
if [ -d "./bin" ];
	then rm -r ./bin;
fi

## Creo los directorios para el Binario
mkdir ./bin/

## Compilo el Binario
g++ -Wall -std=c++11 -c main.cpp 
g++ main.o  -o ./bin/main.bin

## Limpio los códigos objeto
rm ./*.o
