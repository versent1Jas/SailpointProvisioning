/* (c) Copyright 2008 SailPoint Technologies, Inc., All Rights Reserved. */

/*
 * This file contains javascript extensions
 */

/**
 * Returns true if the argument that is passed in is a valid integer.
 * Returns false otherwise
 */
Number.isInteger = function(number) {
    var numberToCheck = Number(number);
    return numberToCheck !== Number.NaN && (Math.floor(numberToCheck) === Math.ceil(numberToCheck));
}