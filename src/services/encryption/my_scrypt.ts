"use strict";

import optionService = require("../options");
import crypto = require("crypto");
import utils = require("../utils");
import sql = require("../sql");

function getVerificationHash(password: crypto.BinaryLike) {
    const salt = optionService.getOption("passwordVerificationSalt");

    return getScryptHash(password, salt);
}

function getPasswordDerivedKey(password: crypto.BinaryLike) {
    const salt = optionService.getOption("passwordDerivedKeySalt");

    return getScryptHash(password, salt);
}

function getScryptHash(
    password: crypto.BinaryLike,
    salt: string | crypto.BinaryLike
) {
    const hashed = crypto.scryptSync(
        password,
        salt instanceof String ? utils.toBase64(salt.toString()) : salt,
        32,
        {
            N: 16384,
            r: 8,
            p: 1,
        }
    );

    return hashed;
}

function getSubjectIdentifierVerificationHash(
    guessedUserId: string | crypto.BinaryLike,
    params?: { salt: string; derivedKey: string }
) {
    // const salt = optionService.getOption('subjectIdentifierVerificationSalt');

    if (params != null)
        return getScryptHash(guessedUserId, utils.toBase64(params.salt));

    const salt = sql.getValue("SELECT salt FROM user_data;");
    if (salt === undefined || salt === null) {
        console.log("User salt undefined!");
        return undefined;
    }
    console.log(
        "Guessed userID: " + guessedUserId,
        "--Salt: " + utils.toBase64(salt.toString())
    );
    return getScryptHash(
        guessedUserId,
        utils.toBase64(salt.toString())
    ).toString();
}

function getSubjectIdentifierDerivedKey(subjectIdentifer: crypto.BinaryLike) {
    // const salt = optionService.getOption("subjectIdentifierDerivedKeySalt");

    const salt = sql.getValue("SELECT salt FROM user_data");
    if (salt === undefined || salt === null) return undefined;

    return getScryptHash(subjectIdentifer, utils.toBase64(salt.toString()));
}

function createSubjectIdentifierDerivedKey(
    subjectIdentifer: string | crypto.BinaryLike,
    salt: string | crypto.BinaryLike
) {
    // const salt = optionService.getOption("subjectIdentifierDerivedKeySalt");

    //   const salt = sql.getValue("SELECT salt FROM user_data");
    //   if (salt === undefined || salt === null) return undefined;

    return getScryptHash(subjectIdentifer, salt);
}

export = {
    getVerificationHash,
    getPasswordDerivedKey,
    getSubjectIdentifierVerificationHash,
    getSubjectIdentifierDerivedKey,
    createSubjectIdentifierDerivedKey,
};
