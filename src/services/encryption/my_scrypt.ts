'use strict';

import optionService = require('../options');
import crypto = require('crypto');

function getVerificationHash(password: crypto.BinaryLike) {
    const salt = optionService.getOption('passwordVerificationSalt');

    return getScryptHash(password, salt);
}

function getPasswordDerivedKey(password: crypto.BinaryLike) {
    const salt = optionService.getOption('passwordDerivedKeySalt');

    return getScryptHash(password, salt);
}

function getScryptHash(password: crypto.BinaryLike, salt: crypto.BinaryLike) {
    const hashed = crypto.scryptSync(password, salt, 32, {N: 16384, r: 8, p: 1});

    return hashed;
}

function getSubjectIdentifierVerificationHash(password: crypto.BinaryLike) {
    const salt = optionService.getOption('subjectIdentifierVerificationSalt');

    return getScryptHash(password, salt);
}

function getSubjectIdentifierDerivedKey(subjectIdentifer: crypto.BinaryLike) {
    const salt = optionService.getOption('subjectIdentifierDerivedKeySalt');

    return getScryptHash(subjectIdentifer, salt);
}

export = {
    getVerificationHash,
    getPasswordDerivedKey,
    getSubjectIdentifierVerificationHash,
    getSubjectIdentifierDerivedKey
};
