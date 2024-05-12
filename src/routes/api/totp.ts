import options = require('../../services/options');
import totp_secret = require('../../services/encryption/totp_secret');
import passwordEncryptionService = require('../../services/encryption/password_encryption');
import { Request } from 'express';
import totp_fs = require('../../services/totp_secret');
import ValidationError = require('../../errors/validation_error');
const speakeasy = require('speakeasy');

function verifyOTPToken(guessedToken: any) {
    const tokenValidates = speakeasy.totp.verify({
        secret: process.env.MFA_SECRET,
        encoding: 'base32',
        token: guessedToken,
        window: 1
    });

    return tokenValidates;
}

function generateSecret() {
    return { success: 'true', message: speakeasy.generateSecret().base32 };
}

function checkForTOTP() {
    const totpEnabled = options.getOptionBool('totpEnabled');
    return { success: 'true', message: totpEnabled };
}

function enableTOTP() {
    options.setOption('totpEnabled', true);
    return { success: 'true' };
}

function disableTOTP() {
    options.setOption('totpEnabled', false);

    return { success: totp_fs.removeTotpSecret() };
}

function setTotpSecret(req: Request) {
    if (!passwordEncryptionService.verifyPassword(req.body.password))
        throw new ValidationError('Incorrect password reset confirmation');

    const regex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
    if (req.body.secret.length != 52) return;
    if (regex.test(req.body.secret)) return;

    totp_fs.saveTotpSecret(req.body.secret);
}

function getSecret() {
    return totp_fs.getTotpSecret();
}

export = {
    verifyOTPToken,
    generateSecret,
    checkForTOTP,
    enableTOTP,
    disableTOTP,
    setTotpSecret,
    getSecret
};
